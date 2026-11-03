(() => {
 const $=s=>document.querySelector(s), queue=$("#queue"), status=$("#queueStatus");
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 async function load(){
  status.textContent="Loading pending reports…";queue.innerHTML="";
  try{const r=await fetch("/api/admin/reports",{headers:{Accept:"application/json"}});const d=await r.json();if(!r.ok)throw new Error(d.error||"Access denied");
   if(!d.reports.length){status.textContent="Queue is clear. No pending submissions.";return;}
   status.textContent=d.reports.length+" pending report(s)";
   d.reports.forEach(item=>{const card=document.createElement("article");card.className="moderation-card";card.innerHTML='<div class="moderation-meta">#'+esc(item.id)+' · '+esc(item.category)+' · Submitted '+esc(item.created_at)+'</div><label>Public location label<input class="edit-location" maxlength="120" value="'+esc(item.location_label)+'"></label><label>Public report description<textarea class="edit-description" minlength="30" maxlength="1500" rows="5">'+esc(item.description)+'</textarea></label><p class="moderation-meta">Observed: '+esc(item.observed_at)+' · Approx. coordinates: '+(item.lat==null?"not provided":esc(item.lat)+", "+esc(item.lng))+'</p><p class="moderation-meta">Remove names, faces, exact addresses, license plates, identifying details and unsupported claims before approval.</p><div class="moderation-actions"><button class="button approve" data-status="approved" data-id="'+esc(item.id)+'">Save edits & approve</button><button class="button reject" data-status="rejected" data-id="'+esc(item.id)+'">Reject</button></div>';queue.append(card);});
  }catch(e){status.textContent=e.message+". Protect /admin.html and /api/admin/* with Cloudflare Access and configure the API secrets.";}
 }
 queue.addEventListener("click",async e=>{const b=e.target.closest("button[data-status]");if(!b)return;const id=Number(b.dataset.id),next=b.dataset.status; if(!confirm("Are you sure you want to "+next+" report #"+id+"?"))return;b.disabled=true;
  try{const r=await fetch("/api/admin/reports",{method:"PATCH",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({id,status:next,location_label:b.closest(".moderation-card").querySelector(".edit-location").value,description:b.closest(".moderation-card").querySelector(".edit-description").value})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Update failed");await load();}
  catch(err){status.textContent=err.message;b.disabled=false;}
 });
 $("#refreshQueue").addEventListener("click",load);load();
})();