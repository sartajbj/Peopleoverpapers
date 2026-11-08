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
  const layer = L.markerClusterGroup ? L.markerClusterGroup({
    showCoverageOnHover:false,
    spiderfyOnMaxZoom:true,
    zoomToBoundsOnClick:true,
    maxClusterRadius:48,
    iconCreateFunction(cluster){
      const count=cluster.getChildCount();
      const size=count<10?"small":count<50?"medium":"large";
      return L.divIcon({
        html:"<span>"+count+"</span>",
        className:"report-marker-cluster report-marker-cluster-"+size,
        iconSize:L.point(42,42)
      });
    }
  }).addTo(map) : L.layerGroup().addTo(map);
  let reports = [];
  let miniMaps = [];
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
    $("feedCount").textContent=shown.length+" "+(shown.length===1?"report":"reports");
    miniMaps.forEach(m=>m.remove());
    miniMaps=[];
    $("reportFeed").innerHTML = shown.slice(0, 20).map(r => {
      const category = escapeHtml(r.category);
      const location = [r.city, r.state, "USA"].filter(Boolean).map(escapeHtml).join(", ");
      const lat=Number(r.lat),lng=Number(r.lng);
      return `<article class="report-feed-item" data-lat="${lat}" data-lng="${lng}">
        <div class="report-card-main">
          <div class="report-card-top">
            <b class="category-pill ${category}">${escapeHtml(labels[r.category] || "Community information")}</b>
            <span class="reviewed-label">Reviewed · not independently verified</span>
            <time>${escapeHtml(r.observed_date || "Date not supplied")}</time>
          </div>
          <strong class="report-card-location">${location}</strong>
          <p class="feed-description">${escapeHtml(r.description)}</p>
          <div class="report-card-times">
            <span>Observed: ${escapeHtml(r.observed_time || "Time not supplied")}</span>
            <span>Submitted: ${escapeHtml(r.submitted_at || "Time unavailable")}</span>
          </div>
          <button class="report-map-jump" type="button">View area on map</button>
        </div>
        <div class="feed-map-wrap">${r.has_photo?`<img class="feed-photo" src="/api/report-photo/${encodeURIComponent(r.id)}" alt="Approved community resource notice" loading="lazy" decoding="async">`:`<div class="feed-map-preview" data-lat="${lat}" data-lng="${lng}" role="img" aria-label="Approximate map preview for ${location}"></div><small class="map-attribution">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a></small>`}</div>
      </article>`;
    }).join("") || '<p class="sidebar-intro">No reviewed reports in the selected categories yet.</p>';
    $("reportFeed").querySelectorAll(".report-map-jump").forEach(b=>b.addEventListener("click",()=>{
      const card=b.closest(".report-feed-item");
      map.setView([Number(card.dataset.lat),Number(card.dataset.lng)],9);
      $("map").scrollIntoView({behavior:"smooth",block:"center"});
    }));
    $("reportFeed").querySelectorAll(".feed-map-preview").forEach(el=>{
      const lat=Number(el.dataset.lat),lng=Number(el.dataset.lng);
      if(!Number.isFinite(lat)||!Number.isFinite(lng))return;
      const preview=L.map(el,{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,touchZoom:false});
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'}).addTo(preview);
      L.circleMarker([lat,lng],{radius:7,color:"#fff",weight:2,fillColor:"#c94d38",fillOpacity:1}).addTo(preview);
      preview.setView([lat,lng],11);
      miniMaps.push(preview);
      setTimeout(()=>preview.invalidateSize(),80);
    });
  }
  async function readApiResponse(res){
    const type=res.headers.get("content-type")||"";
    const raw=await res.text();
    if(!type.includes("application/json")){
      if(raw.trim().startsWith("<")) throw new Error("The report API returned a web page instead of JSON. The latest Cloudflare Pages Functions deployment or /api route is not active yet.");
      throw new Error("The report service returned an unexpected response. Please try again later.");
    }
    let data;try{data=JSON.parse(raw);}catch{throw new Error("The report service returned invalid data. Please try again later.");}
    if(!res.ok) throw new Error(data.error||"The report request could not be completed.");
    return data;
  }
  async function load(){
    status("Loading approved reports…");
    try{
      const res=await fetch("/api/reports",{headers:{Accept:"application/json"},cache:"no-store"});
      const data=await readApiResponse(res);
      reports=Array.isArray(data.reports)?data.reports:[];
      render();
      status(reports.length ? "Showing up to 20 of the most recent approved reports." : "No reports are publicly available yet. Approved submissions appear here after admin review.");
    }catch(e){status(e.message||"Unable to load reports. Please try again later.");}
  }
  let pickingLocation=false;
  const pickerHint=document.createElement("div");
  pickerHint.id="mapPickerHint";
  pickerHint.setAttribute("role","status");
  pickerHint.style.cssText="display:none;position:absolute;z-index:900;left:12px;right:12px;bottom:32px;padding:14px 16px;background:#fffdfa;color:#07545a;border:2px solid #07545a;border-radius:12px;box-shadow:0 5px 22px #0003;font-weight:700;text-align:center";
  pickerHint.textContent="Tap the map to select an approximate area for your report.";
  $("map").appendChild(pickerHint);
  function stopPicking(){pickingLocation=false;pickerHint.style.display="none";map.getContainer().style.cursor="";}

  map.on("click",async e=>{
    if(!pickingLocation) return;
    if(e.latlng.lat<24||e.latlng.lat>50||e.latlng.lng< -125||e.latlng.lng> -66){status("Choose an approximate location within the United States.");return;}
    const lat=Number(e.latlng.lat.toFixed(1)),lng=Number(e.latlng.lng.toFixed(1));
    $("reportLat").value=lat.toFixed(1); $("reportLng").value=lng.toFixed(1);
    stopPicking();
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
      const stateCode=stateMap[stateName]||(/^[A-Z]{2}$/.test(stateName)?stateName:"");
      const safeArea=String(city||"").replace(/[^A-Za-z .'-]/g," ").replace(/\\s+/g," ").trim().slice(0,55);
      if(safeArea) cityInput.value=stateCode?safeArea+", "+stateCode:safeArea;
      else cityInput.value="";
      if($("locationStatus")) $("locationStatus").textContent=safeArea ? "Approximate area selected: "+cityInput.value+". Exact street details are not included." : "Map point selected. Please enter a U.S. city or area name before submitting.";
    }catch{
      if($("locationStatus")) $("locationStatus").textContent="Approximate area selected. Please enter a U.S. city or location manually.";
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
  const photoInput=$("reportPhoto"),photoStatus=$("photoStatus"),photoPreview=$("photoPreview");
  const cityInput=$("reportCity");
  const stateAbbreviations={Alabama:"AL",Alaska:"AK",Arizona:"AZ",Arkansas:"AR",California:"CA",Colorado:"CO",Connecticut:"CT",Delaware:"DE",Florida:"FL",Georgia:"GA",Hawaii:"HI",Idaho:"ID",Illinois:"IL",Indiana:"IN",Iowa:"IA",Kansas:"KS",Kentucky:"KY",Louisiana:"LA",Maine:"ME",Maryland:"MD",Massachusetts:"MA",Michigan:"MI",Minnesota:"MN",Mississippi:"MS",Missouri:"MO",Montana:"MT",Nebraska:"NE",Nevada:"NV","New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND",Ohio:"OH",Oklahoma:"OK",Oregon:"OR",Pennsylvania:"PA","Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD",Tennessee:"TN",Texas:"TX",Utah:"UT",Vermont:"VT",Virginia:"VA",Washington:"WA","West Virginia":"WV",Wisconsin:"WI",Wyoming:"WY","District of Columbia":"DC"};
  function safeCityState(address,fallback){
    const place=address?.city||address?.town||address?.village||address?.municipality||address?.borough||address?.hamlet||address?.county||"";
    const stateName=address?.state||"";
    const stateCode=stateAbbreviations[stateName]||(/^[A-Z]{2}$/.test(stateName)?stateName:"");
    const cleanPlace=String(place).replace(/[^A-Za-z .'-]/g," ").replace(/\s+/g," ").trim().slice(0,55);
    if(cleanPlace)return stateCode?cleanPlace+", "+stateCode:cleanPlace;
    const safeFallback=String(fallback||"").trim();
    return /^[A-Za-z][A-Za-z .'-]{1,59}(?:,\s*[A-Za-z]{2})?$/.test(safeFallback)?safeFallback:"";
  }
  async function resolveEnteredLocation(){
    const query=cityInput?.value.trim()||"";
    if(query.length<2)throw new Error("Enter a U.S. city or location, such as Fort Lauderdale, FL.");
    if($("locationStatus"))$("locationStatus").textContent="Finding an approximate U.S. map location…";
    const url="https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=us&limit=1&addressdetails=1&q="+encodeURIComponent(query);
    const response=await fetch(url,{headers:{Accept:"application/json"}});
    if(!response.ok)throw new Error("Location lookup is temporarily unavailable. Please try again or choose the area on the map.");
    const hits=await response.json();
    if(!Array.isArray(hits)||!hits.length)throw new Error("We couldn't find that U.S. location. Try a city and state, or choose an approximate point on the map.");
    const hit=hits[0],lat=Number(hit.lat),lng=Number(hit.lon);
    if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<24||lat>50||lng< -125||lng> -66)throw new Error("Please enter a location within the United States.");
    const publicLocation=safeCityState(hit.address,query);
    if(!publicLocation)throw new Error("We found the map point, but couldn't identify a safe city or area name. Please enter a city and state, such as Fort Lauderdale, FL.");
    // Never send a street address to the API or store it in the report.
    cityInput.value=publicLocation;
    $("reportLat").value=lat.toFixed(1);$("reportLng").value=lng.toFixed(1);
    map.setView([lat,lng],10,{animate:false});
    if(searchMarker)map.removeLayer(searchMarker);
    searchMarker=L.circleMarker([lat,lng],{radius:8,color:"#fff",weight:3,fillColor:"#07545a",fillOpacity:1}).addTo(map);
    if($("locationStatus"))$("locationStatus").textContent="Approximate map location found for "+publicLocation+". Your exact street address is not included in the report.";
  }
  if(cityInput){
    cityInput.addEventListener("input",()=>{
      $("reportLat").value="";$("reportLng").value="";
      if($("locationStatus"))$("locationStatus").textContent="Location will be found automatically when you submit.";
    });
    cityInput.addEventListener("change",()=>{
      resolveEnteredLocation().catch(error=>{if($("locationStatus"))$("locationStatus").textContent=error.message;});
    });
  }

  let preparedPhoto=null,previewUrl=null;
  function clearPhoto(){
    preparedPhoto=null;
    if(previewUrl)URL.revokeObjectURL(previewUrl);
    previewUrl=null;
    if(photoPreview){photoPreview.removeAttribute("src");photoPreview.hidden=true;}
    if(photoStatus)photoStatus.textContent="No photo selected. Your report can be submitted without one.";
  }
  function imageBlob(file,type,quality,maxDimension){return new Promise((resolve,reject)=>{
    const img=new Image(),url=URL.createObjectURL(file);
    img.onload=()=>{URL.revokeObjectURL(url);const scale=Math.min(1,maxDimension/Math.max(img.width,img.height));const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const ctx=canvas.getContext("2d");if(!ctx){reject(new Error("Image processing is unavailable in this browser."));return;}ctx.drawImage(img,0,0,canvas.width,canvas.height);canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("This image could not be processed.")),type,quality);};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Please choose a valid image file."));};
    img.src=url;
  });}
  async function preparePhoto(file){
    if(!file)return null;
    if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error("Choose a JPG, PNG or WebP image.");
    let blob=null;
    for(const dimension of [1280,1024,800,640]){
      for(const quality of [.82,.70,.58,.46]){
        blob=await imageBlob(file,"image/webp",quality,dimension);
        if(blob.size<=50*1024)break;
      }
      if(blob.size<=50*1024)break;
    }
    if(blob.size>100*1024)throw new Error("This image is still over 100 KB after compression. Please choose a smaller image.");
    return new File([blob],"community-photo.webp",{type:"image/webp",lastModified:Date.now()});
  }
  if(photoInput)photoInput.addEventListener("change",async()=>{
    clearPhoto();const file=photoInput.files?.[0];if(!file)return;
    photoStatus.textContent="Preparing a smaller, metadata-free WebP image…";
    try{
      preparedPhoto=await preparePhoto(file);
      previewUrl=URL.createObjectURL(preparedPhoto);photoPreview.src=previewUrl;photoPreview.hidden=false;
      photoStatus.textContent="Ready: "+Math.round(preparedPhoto.size/1024)+" KB WebP. It will remain private until moderator approval.";
    }catch(error){photoInput.value="";clearPhoto();photoStatus.textContent=error.message;}
  });
  function close(){dialog.close();form.reset();clearPhoto();$("formAlert").textContent="";if($("locationStatus"))$("locationStatus").textContent="No location selected yet.";}
  $("openReport").addEventListener("click",()=>dialog.showModal());
  $("pickLocation").addEventListener("click",()=>{
    pickingLocation=true;
    dialog.close();
    pickerHint.style.display="block";
    status("Tap an approximate area on the map to select it.");
    $("map").scrollIntoView({behavior:"smooth",block:"center"});
    setTimeout(()=>{map.invalidateSize(true);map.getContainer().style.cursor="crosshair";},350);
  });
  map.on("click",()=>{if(!pickingLocation)map.getContainer().style.cursor="";});
  $("closeReport").addEventListener("click",close); $("cancelReport").addEventListener("click",close);
  form.addEventListener("submit",async e=>{
    e.preventDefault(); const btn=$("submitReport"),alert=$("formAlert");
    if(!form.reportValidity())return;
    if(!$("reportLat").value||!$("reportLng").value){
      btn.disabled=true;
      try{await resolveEnteredLocation();}
      catch(error){alert.className="form-alert error";alert.textContent=error.message;btn.disabled=false;return;}
      finally{if(!$("reportLat").value||!$("reportLng").value)btn.disabled=false;}
    }
    const data=Object.fromEntries(new FormData(form).entries());
    if(!data.consent){alert.textContent="Please confirm the privacy and review conditions.";return;}
    btn.disabled=true; alert.className="form-alert"; alert.textContent="Sending your report for manual review…";
    try{
      const payload=new FormData();
      for(const key of ["category","city","lat","lng","observedAt","observedTime","description","website","consent"]) payload.append(key,String(data[key]||""));
      if(preparedPhoto)payload.append("photo",preparedPhoto,preparedPhoto.name);
      const res=await fetch("/api/reports",{method:"POST",headers:{Accept:"application/json"},body:payload});
      await readApiResponse(res);
      alert.textContent="✓ Thank you! Your report has been submitted and is awaiting admin review.";
      alert.className="form-alert success";
      form.reset();clearPhoto();
      setTimeout(()=>{dialog.close();alert.textContent="";alert.className="form-alert";if($("official-map"))$("official-map").scrollIntoView({behavior:"smooth",block:"start"});},2000);
    }catch(err){alert.className="form-alert error";alert.textContent=err.message||"Network error. Please try again.";}
    finally{btn.disabled=false;}
  });
  load();
  setTimeout(()=>map.invalidateSize(),250);
  window.addEventListener("resize",()=>map.invalidateSize());
})();