(() => {
 const $=s=>document.querySelector(s), queue=$("#queue"), status=$("#queueStatus");
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 async function load(){
  status.textContent="Loading pending reports…";queue.innerHTML="";
  try{const r=await fetch("/api/admin/reports",{headers:{Accept:"application/json"}});const d=await r.json();if(!r.ok)throw new Error(d.error||"Access denied");
   if(!d.reports.length){status.textContent="Queue is clear. No pending submissions.";return;}
   status.textContent=d.reports.length+" pending report(s)";
   d.reports.forEach(item=>{const card=document.createElement("article");card.className="moderation-card";card.innerHTML='<div class="moderation-meta">#'+esc(item.id)+' · '+esc(item.category)+' · Submitted '+esc(item.created_at)+'</div><h2>'+esc(item.location_label)+'</h2><p>'+esc(item.description)+'</p><p class="moderation-meta">Observed: '+esc(item.observed_at)+' · Approx. coordinates: '+(item.lat==null?"not provided":esc(item.lat)+", "+esc(item.lng))+'</p><div class="moderation-actions"><button class="button approve" data-status="approved" data-id="'+esc(item.id)+'">Approve</button><button class="button reject" data-status="rejected" data-id="'+esc(item.id)+'">Reject</button></div>';queue.append(card);});
  }catch(e){status.textContent=e.message+". Protect /admin.html and /api/admin/* with Cloudflare Access and configure the API secrets.";}
 }
 queue.addEventListener("click",async e=>{const b=e.target.closest("button[data-status]");if(!b)return;const id=Number(b.dataset.id),next=b.dataset.status; if(!confirm("Are you sure you want to "+next+" report #"+id+"?"))return;b.disabled=true;
  try{const r=await fetch("/api/admin/reports",{method:"PATCH",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({id,status:next})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Update failed");await load();}
  catch(err){status.textContent=err.message;b.disabled=false;}
 });
 $("#refreshQueue").addEventListener("click",load);load();
})();