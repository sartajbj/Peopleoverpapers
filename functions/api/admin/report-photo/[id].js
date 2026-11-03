const json=(message,status)=>new Response(message,{status,headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
function authorized(request,env){const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");return !!env.MODERATION_TOKEN&&!!token&&token===env.MODERATION_TOKEN;}
export async function onRequestGet({request,params,env}) {
 if(!env.DB||!env.REPORT_PHOTOS||!env.MODERATION_TOKEN) return json("Moderation photo service unavailable.",503);
 if(!authorized(request,env)) return json("Unauthorized.",401);
 const id=String(params.id||"");
 if(!/^[0-9a-f-]{36}$/i.test(id)) return json("Not found.",404);
 try{
  const row=await env.DB.prepare("SELECT photo_key FROM reports WHERE id=? AND status='pending'").bind(id).first();
  if(!row?.photo_key) return json("Not found.",404);
  const object=await env.REPORT_PHOTOS.get(row.photo_key);
  if(!object) return json("Not found.",404);
  const headers=new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-type","image/jpeg");
  headers.set("cache-control","private, no-store");
  headers.set("x-content-type-options","nosniff");
  return new Response(object.body,{headers});
 }catch{return json("Unable to load photo.",500);}
}