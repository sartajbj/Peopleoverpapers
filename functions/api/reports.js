const ALLOWED = new Set(["critical","active","observed","support"]);
const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
const clean = (v,max) => String(v??"").replace(/[<>]/g,"").trim().slice(0,max);
function unsafeText(s){return /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b\+?\d[\d ().-]{7,}\d\b|\b\d{1,6}\s+[\w .'-]+\s(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln)\b)/i.test(s);}
function validJpeg(bytes){return bytes.length>3 && bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff;}
export async function onRequestGet({env}) {
 if(!env.DB) return json({error:"Report service is not configured yet."},503);
 try{
  const {results=[]}=await env.DB.prepare("SELECT id,category,city,state,lat,lng,description,observed_date,observed_time,submitted_at,photo_key FROM reports WHERE status='approved' AND submitted_at <= datetime('now','-24 hours') ORDER BY submitted_at DESC LIMIT 10").all();
  return json({reports:results.map(({photo_key,...r})=>({...r,photo_url:photo_key?"/api/report-photo/"+encodeURIComponent(r.id):null}))});
 }catch{return json({error:"Unable to load reports."},500);}
}
export async function onRequestPost({request,env}) {
 if(!env.DB) return json({error:"Report service is not configured yet."},503);
 const contentLength=Number(request.headers.get("content-length")||0);
 if(contentLength>3*1024*1024) return json({error:"Submission is too large. The optional photo must be no larger than 2 MB."},413);
 const origin=request.headers.get("origin");
 if(origin && origin!==new URL(request.url).origin) return json({error:"Cross-site submission blocked."},403);
 let form;try{form=await request.formData();}catch{return json({error:"Invalid form submission."},400);}
 if(form.get("website")) return json({received:true},202);
 const category=clean(form.get("category"),20),city=clean(form.get("city"),80),state=clean(form.get("state"),2).toUpperCase();
 const lat=Number(form.get("lat")),lng=Number(form.get("lng")),description=clean(form.get("description"),500),date=clean(form.get("observedAt"),10),time=clean(form.get("observedTime"),5);
 if(!ALLOWED.has(category)||!city||!/^[A-Z]{2}$/.test(state)||!Number.isFinite(lat)||!Number.isFinite(lng)||lat<24||lat>50||lng< -125||lng> -66) return json({error:"Please provide a valid U.S. category, city, state and approximate map location."},400);
 if(description.length<20||unsafeText(description)) return json({error:"Please provide at least 20 characters and remove phone numbers, email addresses, street addresses and identifying details."},400);
 if((time && !/^\d{2}:\d{2}$/.test(time))||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||date>new Date().toISOString().slice(0,10)) return json({error:"Please choose a valid date and time that are not in the future."},400);
 const photo=form.get("photo");let photoKey=null;
 if(photo && typeof photo==="object" && photo.size){
  if(!env.REPORT_PHOTOS) return json({error:"Photo uploads are not configured yet. Please submit without a photo."},503);
  if(photo.type!=="image/jpeg"||photo.size>2*1024*1024) return json({error:"Photo must be a prepared JPEG no larger than 2 MB."},400);
  const bytes=new Uint8Array(await photo.arrayBuffer());
  if(!validJpeg(bytes)) return json({error:"The uploaded file is not a valid JPEG image."},400);
  photoKey="pending/"+crypto.randomUUID()+".jpg";
  try{await env.REPORT_PHOTOS.put(photoKey,bytes,{httpMetadata:{contentType:"image/jpeg",cacheControl:"private, no-store"}});}
  catch{return json({error:"Photo storage is temporarily unavailable. Please retry or submit without a photo."},503);}
 }
 const id=crypto.randomUUID();
 try{
  await env.DB.prepare("INSERT INTO reports (id,category,city,state,lat,lng,description,observed_date,observed_time,status,photo_key) VALUES (?,?,?,?,?,?,?,?,?, 'pending',?)")
   .bind(id,category,city,state,Math.round(lat*10)/10,Math.round(lng*10)/10,description,date,time||null,photoKey).run();
  return json({received:true,message:"Your submission is waiting for manual review."},202);
 }catch{
  if(photoKey) await env.REPORT_PHOTOS.delete(photoKey).catch(()=>{});
  return json({error:"Unable to save this submission. Please try again later."},500);
 }
}