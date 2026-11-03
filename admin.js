(() => {
 const form=document.getElementById("login"),status=document.getElementById("status"),items=document.getElementById("items");let token="";
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 async function load(){
  status.textContent="Loading…";
  const r=await fetch("/api/admin/reports",{headers:{Authorization:"Bearer "+token}});
  const d=await r.json();if(!r.ok)throw Error(d.error||"Could not load queue.");
  items.innerHTML=d.reports.length?d.reports.map(x=>'<article class="moderation-card" data-id="'+esc(x.id)+'"><div class="moderation-meta">'+esc(x.category)+' · '+esc(x.city)+', '+esc(x.state)+' · occurred '+esc(x.observed_date)+(x.observed_time?' '+esc(x.observed_time):'')+' · submitted '+esc(x.submitted_at)+'</div><p>'+esc(x.description)+'</p><div class="moderation-actions"><button class="button approve" data-status="approved">Approve</button><button class="button reject" data-status="rejected">Reject</button></div></article>').join(""):"<p>No pending submissions.</p>";
  status.textContent=d.reports.length+" pending submissions.";
  items.querySelectorAll("button").forEach(b=>b.addEventListener("click",async()=>{
   const card=b.closest("[data-id]");b.disabled=true;
   try{const r=await fetch("/api/admin/reports",{method:"PATCH",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({id:card.dataset.id,status:b.dataset.status})});const d=await r.json();if(!r.ok)throw Error(d.error);card.remove();status.textContent="Review saved.";if(!items.children.length)items.innerHTML="<p>No pending submissions.</p>";}
   catch(e){status.textContent=e.message;b.disabled=false;}
  }));
 }
 form.addEventListener("submit",e=>{e.preventDefault();token=document.getElementById("token").value;load().catch(e=>status.textContent=e.message);});
})();