(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const mapStatus = $('#mapStatus');
  $('#year').textContent = new Date().getFullYear();
  const menu = $('#mainNav'), menuBtn = $('#menuToggle');
  menuBtn.addEventListener('click', () => { const open=menu.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', String(open)); });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click',()=>{menu.classList.remove('open');menuBtn.setAttribute('aria-expanded','false')}));
  const dialog=$('#reportDialog'), form=$('#reportForm');
  document.querySelectorAll('[data-open-report]').forEach(b=>b.addEventListener('click',()=>dialog.showModal()));
  $('#closeReport').addEventListener('click',()=>dialog.close()); $('#cancelReport').addEventListener('click',()=>dialog.close());
  const map=L.map('map',{scrollWheelZoom:false}).setView([39.5,-98.35],4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
  const groups={critical:L.layerGroup().addTo(map),active:L.layerGroup().addTo(map),observed:L.layerGroup().addTo(map),support:L.layerGroup().addTo(map)};
  const colors={critical:'#c94d38',active:'#d99b16',observed:'#79a94c',support:'#286b9b'};
  let entries=[];
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function render(){
    Object.values(groups).forEach(g=>g.clearLayers());
    const enabled=new Set([...document.querySelectorAll('.filter-row input:checked')].map(x=>x.value));
    let count=0;
    entries.forEach(item=>{
      if(!enabled.has(item.category)||!Number.isFinite(Number(item.lat))||!Number.isFinite(Number(item.lng)))return;
      const marker=L.circleMarker([Number(item.lat),Number(item.lng)],{radius:8,color:'#fff',weight:2,fillColor:colors[item.category]||colors.observed,fillOpacity:.95});
      const title=esc(item.location_label||'General area');
      const category=esc((item.category||'community').replace('_',' '));
      const desc=esc((item.description||'').slice(0,300));
      marker.bindPopup('<strong>'+title+'</strong><br><small>'+category+' · '+esc(item.observed_at||'Date not provided')+'</small><p>'+desc+'</p><small>Reviewed before publication; details may not be independently verified.</small>');
      marker.addTo(groups[item.category]);count++;
    });
    $('#reportCount').textContent=count;
    if(!count) mapStatus.textContent='No approved map entries are currently available in this view. No sample or invented reports are shown.';
  }
  async function loadReports(){
    try{
      const response=await fetch('/api/reports',{headers:{Accept:'application/json'}});
      if(!response.ok)throw new Error('API unavailable');
      const data=await response.json(); entries=Array.isArray(data.reports)?data.reports:[];
      render();
      mapStatus.textContent=entries.length?'Showing approved community entries. Please read each entry with care.':'The map is ready. There are currently no approved public reports.';
    }catch(e){entries=[];render();mapStatus.textContent='The map is ready, but the reports service is not connected yet. No sample reports are displayed.';}
  }
  document.querySelectorAll('.filter-row input').forEach(input=>input.addEventListener('change',render));
  $('#resetMap').addEventListener('click',()=>map.setView([39.5,-98.35],4));
  $('#locationSearch').addEventListener('submit',async e=>{
    e.preventDefault();const q=$('#locationInput').value.trim();if(!q)return;
    mapStatus.textContent='Searching for location…';
    try{
      const res=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q='+encodeURIComponent(q),{headers:{Accept:'application/json'}});
      if(!res.ok)throw new Error();const results=await res.json();if(!results.length)throw new Error('No result');
      const p=results[0];map.setView([Number(p.lat),Number(p.lon)],Math.max(10,Number(p.zoom)||11));mapStatus.textContent='Map moved to '+(p.display_name||q)+'. Search results are provided by OpenStreetMap Nominatim.';
    }catch(e){mapStatus.textContent='We could not find that location. Try a city, state or ZIP code.';}
  });
  map.on('click',e=>{
    if(!dialog.open)return;
    $('#reportLat').value=e.latlng.lat.toFixed(2);$('#reportLng').value=e.latlng.lng.toFixed(2);
    if(!$('#reportLocation').value)$('#reportLocation').value='Approximate map location';
  });
  const dateInput=form.elements.observed_at;
  const now=new Date();dateInput.value=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,16);
  form.addEventListener('submit',async e=>{
    e.preventDefault();const status=$('#formStatus'),button=$('#submitReport');
    const fd=new FormData(form);if(!fd.get('consent'))return;
    const payload={location_label:String(fd.get('location_label')).trim(),category:fd.get('category'),description:String(fd.get('description')).trim(),observed_at:fd.get('observed_at'),lat:fd.get('lat')||null,lng:fd.get('lng')||null,consent:true};
    if((payload.lat&&!payload.lng)||(!payload.lat&&payload.lng)){status.textContent='Enter both coordinates or leave both blank.';status.className='form-alert error';return;}
    button.disabled=true;button.textContent='Sending…';status.textContent='Submitting privately for review…';status.className='form-alert';
    try{
      const response=await fetch('/api/reports',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'The report could not be submitted.');
      status.textContent='Thank you. Your report has been received and is pending moderation. It is not public.';form.reset();dateInput.value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
      setTimeout(()=>dialog.close(),2300);
    }catch(err){status.textContent=err.message.includes('Failed to fetch')?'The report service is not configured yet. Your information was not sent.':'Could not submit: '+err.message;status.className='form-alert error';}
    finally{button.disabled=false;button.textContent='Send for review';}
  });
  loadReports();
})();