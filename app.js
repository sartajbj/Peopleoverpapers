(() => {
  const $ = (id) => document.getElementById(id);
  const mapEl = $("mapCanvas");
  if (!mapEl || !window.L) return;
  const colors = {critical:"#c94d38",active:"#d99b16",observed:"#79a94c",support:"#286b9b"};
  const labels = {critical:"Urgent concern",active:"Community update",observed:"Resource / support",support:"Other"};
  const map = L.map(mapEl,{scrollWheelZoom:false,zoomSnap:0.5}).setView([39.2,-98.5],4.5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
    maxZoom:18, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  // Official U.S. Census Bureau label overlay: county names appear as users zoom in,
  // with incorporated-place names at closer city-level zooms. The overlay is transparent,
  // so the existing OpenStreetMap basemap and report markers remain visible.
  L.tileLayer.wms("https://tigerweb.geo.census.gov/arcgis/services/TIGERweb/tigerWMS_Current/MapServer/WMSServer",{
    layers:"83,29",
    format:"image/png",
    transparent:true,
    version:"1.3.0",
    opacity:0.88,
    zIndex:350,
    attribution:'&copy; <a href="https://www.census.gov/">U.S. Census Bureau</a>'
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
      const marker=L.marker([r.lat,r.lng],{icon:L.divIcon({className:"community-pin-wrap",html:'<span class="community-pin '+(colors[r.category]?"":"") + escapeHtml(r.category)+'"><i></i></span>',iconSize:[28,36],iconAnchor:[14,34],popupAnchor:[0,-30]})});
      marker.bindPopup('<strong>'+escapeHtml(labels[r.category]||"Community information")+'</strong><br>'+escapeHtml(r.city)+', '+escapeHtml(r.state)+'<br><small>'+escapeHtml(r.observed_date||"Date not supplied")+'</small><p>'+escapeHtml(r.description)+'</p><small>Approximate area · reviewed report</small>');
      marker.addTo(layer);
    });
    $("reportCount").textContent=shown.length;
    $("feedCount").textContent=shown.length+" shown";
    $("reportFeed").innerHTML=shown.slice(0,10).map(r=>'<button type="button" class="report-feed-item" data-lat="'+Number(r.lat)+'" data-lng="'+Number(r.lng)+'"><span class="dot '+escapeHtml(r.category)+'"></span><span><b>'+escapeHtml(labels[r.category]||"Community information")+'</b><small>'+escapeHtml(r.city)+", "+escapeHtml(r.state)+'</small><small class="feed-meta">Occurred: '+escapeHtml(r.observed_date||"Date not supplied")+(r.observed_time?" · "+escapeHtml(r.observed_time):"")+"</small><small class=\"feed-meta\">Submitted: "+escapeHtml(r.submitted_at||"Time unavailable")+'</small>'+(r.photo_url?'<img class="feed-photo" src="'+escapeHtml(r.photo_url)+'" alt="Approved community resource photo" loading="lazy">':'')+'<span class="feed-description">'+escapeHtml(r.description)+'</span></span></button>').join("") || '<p class="sidebar-intro">No reviewed reports in the selected categories yet.</p>';
    $("reportFeed").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{map.setView([Number(b.dataset.lat),Number(b.dataset.lng)],9);}));
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
  map.on("click",async e=>{
    if(!pickingLocation) return;
    if(e.latlng.lat<24||e.latlng.lat>50||e.latlng.lng< -125||e.latlng.lng> -66){status("Choose an approximate location within the United States.");return;}
    const lat=Number(e.latlng.lat.toFixed(1)),lng=Number(e.latlng.lng.toFixed(1));
    $("reportLat").value=lat.toFixed(1); $("reportLng").value=lng.toFixed(1);
    pickingLocation=false; map.getContainer().style.cursor="";
    if($("locationStatus")) $("locationStatus").textContent="Approximate area selected. Looking up city and state…";
    dialog.showModal();
    $("formAlert").textContent="Approximate area selected. Only a generalized area is saved.";
    try{
      const url="https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat="+encodeURIComponent(lat)+"&lon="+encodeURIComponent(lng)+"&zoom=10&addressdetails=1";
      const res=await fetch(url,{headers:{Accept:"application/json"}});
      if(!res.ok) throw new Error("Location details unavailable.");
      const result=await res.json(),addr=result.address||{};
      const city=addr.city||addr.town||addr.village||addr.municipality||addr.county||"";
      const stateName=addr.state||"";
      const stateMap={"Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA","Colorado":"CO","Connecticut":"CT","Delaware":"DE","Florida":"FL","Georgia":"GA","Hawaii":"HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA","Kansas":"KS","Kentucky":"KY","Louisiana":"LA","Maine":"ME","Maryland":"MD","Massachusetts":"MA","Michigan":"MI","Minnesota":"MN","Mississippi":"MS","Missouri":"MO","Montana":"MT","Nebraska":"NE","Nevada":"NV","New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND","Ohio":"OH","Oklahoma":"OK","Oregon":"OR","Pennsylvania":"PA","Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD","Tennessee":"TN","Texas":"TX","Utah":"UT","Vermont":"VT","Virginia":"VA","Washington":"WA","West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY","District of Columbia":"DC"};
      if(city && !$("reportForm").elements.city.value) $("reportForm").elements.city.value=city;
      if(stateMap[stateName] && !$("reportForm").elements.state.value) $("reportForm").elements.state.value=stateMap[stateName];
      if($("locationStatus")) $("locationStatus").textContent=(city?city+", ":"")+"Approximate area selected. Check city/state before submitting.";
    }catch{
      if($("locationStatus")) $("locationStatus").textContent="Approximate area selected. Please enter city and state manually.";
    }
  });
  document.querySelectorAll(".filter-row input").forEach(x=>x.addEventListener("change",render));
  $("resetMap").addEventListener("click",()=>{map.setView([39.2,-98.5],4.5);if(searchMarker){map.removeLayer(searchMarker);searchMarker=null;}$("mapSearch").value="";status("Showing the U.S. overview.");});
  let searchMarker=null;
  async function searchPlace(){
    const q=$("mapSearch").value.trim();
    if(!q){status("Enter a U.S. city or state to search.");$("mapSearch").focus();return;}
    status("Searching for "+q+"…");
    try{
      const url="https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=us&limit=1&addressdetails=1&q="+encodeURIComponent(q);
      const res=await fetch(url,{headers:{Accept:"application/json"}});
      if(!res.ok) throw new Error("The place search service returned an error.");
      const hits=await res.json();
      if(!Array.isArray(hits)||!hits.length){status("No U.S. place found. Try a city and state, such as New York, NY.");return;}
      const lat=Number(hits[0].lat),lng=Number(hits[0].lon);
      if(!Number.isFinite(lat)||!Number.isFinite(lng)){status("We couldn't read that location. Try a city and state.");return;}
      map.invalidateSize(true);
      map.setView([lat,lng],10,{animate:false});
      if(searchMarker) map.removeLayer(searchMarker);
      searchMarker=L.circleMarker([lat,lng],{radius:8,color:"#ffffff",weight:3,fillColor:"#07545a",fillOpacity:1}).addTo(map);
      searchMarker.bindTooltip("Search location",{direction:"top",offset:[0,-8]}).openTooltip();
      const name=hits[0].display_name ? hits[0].display_name.split(",").slice(0,2).join(",") : q;
      status("Map centered on "+name+".");
    }catch(error){status("Place search is temporarily unavailable. Please try again.");}
  }
  $("searchMap").addEventListener("click",searchPlace);
  $("mapSearch").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();searchPlace();}});
  const dialog=$("reportDialog"),form=$("reportForm");
  function close(){dialog.close();form.reset();$("formAlert").textContent="";if($("locationStatus"))$("locationStatus").textContent="No location selected yet.";}
  $("openReport").addEventListener("click",()=>dialog.showModal());
  $("pickLocation").addEventListener("click",()=>{pickingLocation=true;dialog.close();status("Tap an approximate area on the map to select it.");map.getContainer().style.cursor="crosshair";});
  map.on("click",()=>{if(!pickingLocation)map.getContainer().style.cursor="";});
  $("closeReport").addEventListener("click",close); $("cancelReport").addEventListener("click",close);
  async function prepareResourcePhoto(file){
    if(!file) return null;
    if(!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Please choose a JPG, PNG or WebP image.");
    if(file.size>5*1024*1024) throw new Error("Choose an image smaller than 5 MB.");
    const bitmap=await createImageBitmap(file);
    const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=canvas.getContext("2d");ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",.82));
    if(!blob) throw new Error("This image could not be prepared. Please choose another.");
    if(blob.size>2*1024*1024) throw new Error("After image preparation, the photo must be under 2 MB.");
    return new File([blob],"community-resource.jpg",{type:"image/jpeg"});
  }
  $("reportPhoto")?.addEventListener("change",()=>{
    const f=$("reportPhoto").files?.[0];
    $("photoStatus").textContent=f?f.name+" selected. It will be resized and metadata removed before upload.":"No photo selected.";
  });
  form.addEventListener("submit",async e=>{
    e.preventDefault(); const btn=$("submitReport"),alert=$("formAlert");
    if(!form.reportValidity())return; if(!form.lat.value||!form.lng.value){alert.textContent="Please choose an approximate area on the map first.";return;}
    const data=Object.fromEntries(new FormData(form).entries());
    if(!data.consent){alert.textContent="Please confirm the privacy and review conditions.";return;}
    btn.disabled=true; alert.className="form-alert"; alert.textContent="Preparing your submission for manual review…";
    try{
      const photo=await prepareResourcePhoto(data.photo && data.photo.size?data.photo:null);
      const payload=new FormData();
      for(const key of ["category","city","state","lat","lng","observedAt","observedTime","description","website"]) payload.append(key,String(data[key]||""));
      if(photo) payload.append("photo",photo,"community-resource.jpg");
      const res=await fetch("/api/reports",{method:"POST",headers:{Accept:"application/json"},body:payload});
      const body=await res.json(); if(!res.ok)throw new Error(body.error||"Submission could not be accepted.");
      alert.textContent="Thank you. Your report and optional resource photo are pending manual review. Nothing is public until approved and delayed.";
      form.reset(); $("photoStatus").textContent="No photo selected.";
      setTimeout(()=>{dialog.close();alert.textContent="";},3200);
    }catch(err){alert.className="form-alert error";alert.textContent=err.message||"Network error. Please try again.";}
    finally{btn.disabled=false;}
  });
  load();
  setTimeout(()=>map.invalidateSize(),250);
  window.addEventListener("resize",()=>map.invalidateSize());
})();