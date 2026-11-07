const ALLOWED = new Set(["critical","active","observed","support"]);
const MAX_PHOTO_BYTES = 100 * 1024;
const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
const clean = (v,max) => String(v??"").replace(/[<>]/g,"").trim().slice(0,max);
function unsafeText(s){return /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b\+?\d[\d ().-]{7,}\d\b|\b\d{1,6}\s+[\w .'-]+\s(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln)\b)/i.test(s);}
function validWebp(bytes){return bytes.length>=12&&bytes[0]===0x52&&bytes[1]===0x49&&bytes[2]===0x46&&bytes[3]===0x46&&bytes[8]===0x57&&bytes[9]===0x45&&bytes[10]===0x42&&bytes[11]===0x50;}
export async function onRequestGet({env}) {
 if(!env.DB) return json({error:"Report service is not configured yet."},503);
 try{
  const {results=[]}=await env.DB.prepare("SELECT r.id,r.category,r.city,r.state,r.lat,r.lng,r.description,r.observed_date,r.observed_time,r.submitted_at,CASE WHEN p.report_id IS NULL THEN 0 ELSE 1 END AS has_photo FROM reports r LEFT JOIN report_photos p ON p.report_id=r.id WHERE r.status='approved' ORDER BY r.submitted_at DESC LIMIT 100").all();
  const safe=results.filter(r=>/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(String(r.city||''))&&!unsafeText(r.city)&&!unsafeText(r.description)&&!/[0-9,#]/.test(String(r.city||'')));
  return json({reports:safe.slice(0,20)});
 }catch{return json({error:"Unable to load reports."},500);}
}
export async function onRequestPost({request,env}) {
 if(!env.DB) return json({error:"Report service is not configured yet."},503);
 const contentLength=Number(request.headers.get("content-length")||0);
 if(contentLength>180*1024) return json({error:"Submission is too large. Please use a smaller photo (maximum 100 KB)."},413);
 const origin=request.headers.get("origin");
 if(origin && origin!==new URL(request.url).origin) return json({error:"Cross-site submission blocked."},403);
 let form;try{form=await request.formData();}catch{return json({error:"Invalid form submission."},400);}
 if(form.get("website")) return json({received:true},202);
 const category=clean(form.get("category"),20);
 const enteredLocation=clean(form.get("city"),80);
 const locationMatch=enteredLocation.match(/^(.+?),\s*([A-Za-z]{2})$/);
 const city=clean(locationMatch?locationMatch[1]:enteredLocation,60);
 const state=locationMatch?locationMatch[2].toUpperCase():"";
 const lat=Number(form.get("lat")),lng=Number(form.get("lng")),description=clean(form.get("description"),500),date=clean(form.get("observedAt"),10),time=clean(form.get("observedTime"),5);
 if(form.get("consent")!=="on") return json({error:"Please confirm the privacy and review conditions before submitting."},400);
 if(!ALLOWED.has(category)||!/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(city)||unsafeText(city)||/[0-9,#]/.test(city)||!(state===""||/^[A-Z]{2}$/.test(state))||!Number.isFinite(lat)||!Number.isFinite(lng)||lat<24||lat>50||lng< -125||lng> -66) return json({error:"Please provide a valid U.S. category, city or location, and approximate U.S. map location."},400);
 if(description.length<20||unsafeText(description)) return json({error:"Please write at least 20 characters and remove phone numbers, email addresses, street addresses and identifying details."},400);
 if((time && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||date>new Date().toISOString().slice(0,10)) return json({error:"Please choose a valid date and time that are not in the future."},400);
 const photo=form.get("photo");let photoBytes=null;
 if(photo&&typeof photo==="object"&&photo.size>0){
  if(photo.size>MAX_PHOTO_BYTES)return json({error:"Photo must be 100 KB or smaller. Please choose a smaller image."},413);
  if(photo.type!=="image/webp")return json({error:"Photo must be converted to WebP before upload."},400);
  photoBytes=new Uint8Array(await photo.arrayBuffer());
  if(photoBytes.length>MAX_PHOTO_BYTES||!validWebp(photoBytes))return json({error:"The uploaded file is not a valid WebP image."},400);
 }
 const id=crypto.randomUUID();
 try{
  const insert=env.DB.prepare("INSERT INTO reports (id,category,city,state,lat,lng,description,observed_date,observed_time,status) VALUES (?,?,?,?,?,?,?,?,?, 'pending')").bind(id,category,city,state,Math.round(lat*10)/10,Math.round(lng*10)/10,description,date,time||null);
  if(photoBytes){const photoInsert=env.DB.prepare("INSERT INTO report_photos (report_id,image,mime,bytes) VALUES (?,?, 'image/webp', ?)").bind(id,photoBytes,photoBytes.length);await env.DB.batch([insert,photoInsert]);}
  else await insert.run();
  return json({received:true,message:"Your submission is waiting for manual review."},202);
 }catch{return json({error:"Unable to save this submission. Please try again later."},500);}
}
