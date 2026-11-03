const ALLOWED = new Set(["critical","active","observed","support"]);
const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
const clean = (v,max) => String(v??"").replace(/[<>]/g,"").trim().slice(0,max);
function unsafeText(s){return /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b\+?\d[\d ().-]{7,}\d\b|\b\d{1,6}\s+[\w .'-]+\s(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln)\b)/i.test(s);}
export async function onRequestGet({env}) {
  if(!env.DB) return json({error:"Report service is not configured yet."},503);
  try{
    const {results=[]}=await env.DB.prepare("SELECT id,category,city,state,lat,lng,description,observed_date,observed_time,submitted_at FROM reports WHERE status='approved' AND submitted_at <= datetime('now','-24 hours') ORDER BY submitted_at DESC LIMIT 10").all();
    return json({reports:results});
  }catch{return json({error:"Unable to load reports."},500);}
}
export async function onRequestPost({request,env}) {
  if(!env.DB) return json({error:"Report service is not configured yet."},503);
  if(request.headers.get("content-type")?.includes("application/json")!==true) return json({error:"JSON submissions only."},415);
  const origin=request.headers.get("origin");
  if(origin && origin!==new URL(request.url).origin) return json({error:"Cross-site submission blocked."},403);
  let body; try{body=await request.json();}catch{return json({error:"Invalid request."},400);}
  if(body.website) return json({received:true},202);
  const category=clean(body.category,20),city=clean(body.city,80),state=clean(body.state,2).toUpperCase();
  const lat=Number(body.lat),lng=Number(body.lng),description=clean(body.description,500),date=clean(body.observedAt,10),time=clean(body.observedTime,5);
  if(!ALLOWED.has(category)||!city||!/^[A-Z]{2}$/.test(state)||!Number.isFinite(lat)||!Number.isFinite(lng)||lat<24||lat>50||lng< -125||lng> -66) return json({error:"Please provide a valid U.S. category, city, state and approximate map location."},400);
  if(description.length<20||unsafeText(description)) return json({error:"Please provide at least 20 characters and remove phone numbers, email addresses, street addresses and identifying details."},400);
  if((time && !/^\d{2}:\d{2}$/.test(time))||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||date>new Date().toISOString().slice(0,10)) return json({error:"Please choose a valid date and time that are not in the future."},400);
  const id=crypto.randomUUID();
  try{
    await env.DB.prepare("INSERT INTO reports (id,category,city,state,lat,lng,description,observed_date,observed_time,status) VALUES (?,?,?,?,?,?,?,?,?, 'pending')")
      .bind(id,category,city,state,Math.round(lat*10)/10,Math.round(lng*10)/10,description,date,time||null).run();
    return json({received:true,message:"Your submission is waiting for review."},202);
  }catch{return json({error:"Unable to save this submission. Please try again later."},500);}
}