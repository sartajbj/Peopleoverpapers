const json=(message,status)=>new Response(message,{status,headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
export async function onRequestGet({params,env}) {
 if(!env.DB||!env.REPORT_PHOTOS) return json("Photo service unavailable.",503);
 const id=String(params.id||"");
 if(!/^[0-9a-f-]{36}$/i.test(id)) return json("Not found.",404);
 try{
  const row=await env.DB.prepare("SELECT photo_key FROM reports WHERE id=? AND status='approved' AND submitted_at <= datetime('now','-24 hours')").bind(id).first();
  if(!row?.photo_key) return json("Not found.",404);
  const object=await env.REPORT_PHOTOS.get(row.photo_key);
  if(!object) return json("Not found.",404);
  const headers=new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-type","image/jpeg");
  headers.set("cache-control","public, max-age=3600");
  headers.set("x-content-type-options","nosniff");
  headers.set("content-security-policy","default-src 'none'; sandbox");
  return new Response(object.body,{headers});
 }catch{return json("Unable to load photo.",500);}
}