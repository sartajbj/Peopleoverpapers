(() => {
 const form=document.getElementById("login");
 const status=document.getElementById("status");
 const items=document.getElementById("items");
 let token="";
 const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 async function api(url,options={}){
  const response=await fetch(url,{...options,headers:{Accept:"application/json",Authorization:"Bearer "+token,...(options.headers||{})}});
  let data={};try{data=await response.json();}catch{}
  if(!response.ok)throw Error(data.error||"Request failed. Please try again.");
  return data;
 }
 async function load(){
  status.textContent="Loading pending reports…";
  items.innerHTML="";
  const data=await api("/api/admin/reports");
  const reports=Array.isArray(data.reports)?data.reports:[];
  status.textContent=reports.length+" report"+(reports.length===1?"":"s")+" waiting for review.";
  if(!reports.length){items.innerHTML='<div class="moderation-card"><h2>All caught up</h2><p>No pending reports. New submissions will appear here.</p></div>';return;}
  items.innerHTML=reports.map(report=>`
   <article class="moderation-card" data-id="${esc(report.id)}">
    <div class="moderation-meta">${esc(report.category)} · ${esc(report.city)}, ${esc(report.state)}</div>
    <h2>${esc(report.city)}, ${esc(report.state)}</h2>
    <p>${esc(report.description)}</p>
    <div class="moderation-meta">Observed: ${esc(report.observed_date)} ${esc(report.observed_time||"time not supplied")} · Submitted: ${esc(report.submitted_at)}</div>
    ${report.has_photo?'<div class="moderation-photo-wrap"><p class="moderation-meta">Optional image · inspect for identifying details before approval</p><img class="moderation-photo" alt="Pending community resource photo" data-photo-id="'+esc(report.id)+'"></div>':''}
    <div class="moderation-actions">
     <button class="button approve" type="button" data-status="approved">✓ Approve</button>
     <button class="button reject" type="button" data-status="rejected">✕ Reject</button>
    </div>
   </article>`).join("");
  for(const img of items.querySelectorAll("img[data-photo-id]")){
   try{const response=await fetch("/api/admin/report-photo/"+encodeURIComponent(img.dataset.photoId),{headers:{Authorization:"Bearer "+token}});if(!response.ok)throw new Error("Photo unavailable");const blob=await response.blob();img.src=URL.createObjectURL(blob);}
   catch{img.alt="Photo preview unavailable";img.replaceWith(Object.assign(document.createElement("p"),{className:"moderation-meta",textContent:"Photo preview unavailable. Do not approve until reviewed."}));}
  }
  items.querySelectorAll(".moderation-actions button").forEach(button=>button.addEventListener("click",async()=>{
   const card=button.closest("[data-id]");
   const buttons=card.querySelectorAll("button");
   buttons.forEach(item=>item.disabled=true);
   status.textContent=button.dataset.status==="approved"?"Approving report…":"Rejecting report…";
   try{
    await api("/api/admin/reports",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:card.dataset.id,status:button.dataset.status})});
    card.remove();
    const remaining=items.querySelectorAll("[data-id]").length;
    status.textContent=button.dataset.status==="approved"?"Report approved. It will be eligible for the public feed after the 24-hour delay.":"Report rejected and kept off the public map.";
    if(!remaining)items.innerHTML='<div class="moderation-card"><h2>All caught up</h2><p>No pending reports. New submissions will appear here.</p></div>';
   }catch(error){status.textContent=error.message;buttons.forEach(item=>item.disabled=false);}
  }));
 }
 form.addEventListener("submit",event=>{
  event.preventDefault();
  token=document.getElementById("token").value.trim();
  if(!token){status.textContent="Enter your moderation token.";return;}
  load().catch(error=>{status.textContent=error.message;items.innerHTML="";});
 });
})();