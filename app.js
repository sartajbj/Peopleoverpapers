(() => {
  const $ = (id) => document.getElementById(id);
  const mapEl = $("map");
  if (!mapEl || !window.L) return;
  const colors = {critical:"#c94d38",active:"#d99b16",observed:"#79a94c",support:"#286b9b"};
  const labels = {critical:"Urgent concern",active:"Community update",observed:"Resource / support",support:"Other"};
  const map = L.map(mapEl,{scrollWheelZoom:false}).setView([39.2,-98.5],4);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
    maxZoom:18, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  const layer = L.layerGroup().addTo(map);
  let reports = [];
  const status = (message) => { if($("mapStatus")) $("mapStatus").textContent=message; };
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function visibleCategories(){return [...document.querySelectorAll(".filter-row input:checked")].map(x=>x.value);}
  function render(){
    layer.clearLayers();
    const chosen=visibleCategories();
    const shown=reports.filter(r=>chosen.includes(r.category));
    shown.forEach(r=>{
      const marker=L.circleMarker([r.lat,r.lng],{radius:9,color:"#fff",weight:2,fillColor:colors[r.category]||colors.support,fillOpacity:.9});
      marker.bindPopup('<strong>'+escapeHtml(labels[r.category]||"Community information")+'</strong><br>'+escapeHtml(r.city)+', '+escapeHtml(r.state)+'<br><small>'+escapeHtml(r.observed_date||"Date not supplied")+'</small><p>'+escapeHtml(r.description)+'</p><small>Approximate area · reviewed report</small>');
      marker.addTo(layer);
    });
    $("reportCount").textContent=shown.length;
  }
  async function load(){
    status("Loading approved reports…");
    try{
      const res=await fetch("/api/reports",{headers:{Accept:"application/json"}});
      if(!res.ok) throw new Error("Reports are temporarily unavailable.");
      const data=await res.json(); reports=Array.isArray(data.reports)?data.reports:[];
      render(); status(reports.length ? "Showing reviewed reports. New submissions are delayed at least 24 hours." : "No approved reports yet. Be the first to submit useful, non-identifying information.");
    }catch(e){status(e.message||"Unable to load reports. Please try again later.");}
  }
  let pickingLocation=false;
  map.on("click",e=>{
    if(!pickingLocation) return;
    if(e.latlng.lat<24||e.latlng.lat>50||e.latlng.lng< -125||e.latlng.lng> -66){status("Choose an approximate location within the United States.");return;}
    $("reportLat").value=e.latlng.lat.toFixed(2); $("reportLng").value=e.latlng.lng.toFixed(2);
    pickingLocation=false; dialog.showModal(); $("formAlert").textContent="Approximate area selected. Exact coordinates are generalized before storage.";
  });
  document.querySelectorAll(".filter-row input").forEach(x=>x.addEventListener("change",render));
  $("resetMap").addEventListener("click",()=>map.setView([39.2,-98.5],4));
  $("searchMap").addEventListener("click",async()=>{
    const q=$("mapSearch").value.trim(); if(!q)return;
    status("Searching…");
    try{
      const url="https://nominatim.openstreetmap.org/search?format=json&country=United%20States&limit=1&q="+encodeURIComponent(q);
      const res=await fetch(url,{headers:{Accept:"application/json"}}); const hits=await res.json();
      if(!hits.length){status("No U.S. place found. Try a city and state.");return;}
      map.setView([Number(hits[0].lat),Number(hits[0].lon)],10); status("Map centered on "+q+".");
    }catch{status("Place search is temporarily unavailable.");}
  });
  const dialog=$("reportDialog"),form=$("reportForm");
  function close(){dialog.close();form.reset();$("formAlert").textContent="";}
  $("openReport").addEventListener("click",()=>dialog.showModal());
  $("pickLocation").addEventListener("click",()=>{pickingLocation=true;dialog.close();status("Tap an approximate area on the map to select it.");map.getContainer().style.cursor="crosshair";});
  map.on("click",()=>{if(!pickingLocation)map.getContainer().style.cursor="";});
  $("closeReport").addEventListener("click",close); $("cancelReport").addEventListener("click",close);
  form.addEventListener("submit",async e=>{
    e.preventDefault(); const btn=$("submitReport"),alert=$("formAlert");
    if(!form.reportValidity())return;
    const data=Object.fromEntries(new FormData(form).entries());
    if(!data.consent){alert.textContent="Please confirm the privacy and review conditions.";return;}
    const payload={category:data.category,city:data.city,state:data.state,lat:Number(data.lat),lng:Number(data.lng),observedAt:data.observedAt,description:data.description,website:data.website||""};
    btn.disabled=true; alert.className="form-alert"; alert.textContent="Sending securely for review…";
    try{
      const res=await fetch("/api/reports",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(payload)});
      const body=await res.json(); if(!res.ok)throw new Error(body.error||"Submission could not be accepted.");
      alert.textContent="Thank you. Your report was received for moderation. It will not appear publicly until approved and delayed.";
      form.reset(); setTimeout(()=>{dialog.close();alert.textContent="";},2800);
    }catch(err){alert.className="form-alert error";alert.textContent=err.message||"Network error. Please try again.";}
    finally{btn.disabled=false;}
  });
  load();
  setTimeout(()=>map.invalidateSize(),250);
  window.addEventListener("resize",()=>map.invalidateSize());
})();