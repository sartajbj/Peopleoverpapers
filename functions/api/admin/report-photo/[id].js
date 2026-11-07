const json=(message,status)=>new Response(message,{status,headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
function authorized(request,env){const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");return !!env.MODERATION_TOKEN&&!!token&&token===env.MODERATION_TOKEN;}
export async function onRequestGet({request,params,env}) {
 if(!env.DB||!env.MODERATION_TOKEN)return json("Moderation photo service unavailable.",503);
 if(!authorized(request,env))return json("Unauthorized.",401);
 const id=String(params.id||"");if(!/^[0-9a-f-]{36}$/i.test(id))return json("Not found.",404);
 try{
  const row=await env.DB.prepare("SELECT p.image FROM report_photos p JOIN reports r ON r.id=p.report_id WHERE p.report_id=? AND r.status='pending'").bind(id).first();
  if(!row?.image)return json("Not found.",404);
  return new Response(row.image,{headers:{"content-type":"image/webp","cache-control":"private, no-store","x-content-type-options":"nosniff","content-security-policy":"default-src 'none'; sandbox"}});
 }catch{return json("Unable to load photo.",500);}
}
