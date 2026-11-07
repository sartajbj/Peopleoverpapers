const json=(message,status)=>new Response(message,{status,headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
function imageBytes(value){
 if(value instanceof ArrayBuffer)return new Uint8Array(value);
 if(ArrayBuffer.isView(value))return new Uint8Array(value.buffer,value.byteOffset,value.byteLength);
 if(Array.isArray(value))return Uint8Array.from(value);
 return null;
}
function isWebp(bytes){return !!bytes&&bytes.length>=12&&bytes[0]===0x52&&bytes[1]===0x49&&bytes[2]===0x46&&bytes[3]===0x46&&bytes[8]===0x57&&bytes[9]===0x45&&bytes[10]===0x42&&bytes[11]===0x50;}
function authorized(request,env){const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");return !!env.MODERATION_TOKEN&&!!token&&token===env.MODERATION_TOKEN;}
export async function onRequestGet({request,params,env}) {
 if(!env.DB||!env.MODERATION_TOKEN)return json("Moderation photo service unavailable.",503);
 if(!authorized(request,env))return json("Unauthorized.",401);
 const id=String(params.id||"");if(!/^[0-9a-f-]{36}$/i.test(id))return json("Not found.",404);
 try{
  const row=await env.DB.prepare("SELECT p.image FROM report_photos p JOIN reports r ON r.id=p.report_id WHERE p.report_id=? AND r.status='pending'").bind(id).first();
  const bytes=imageBytes(row?.image);
  if(!isWebp(bytes))return json("Stored photo is missing or is not a valid WebP image.",404);
  return new Response(bytes,{headers:{"content-type":"image/webp","content-length":String(bytes.byteLength),"cache-control":"private, no-store","x-content-type-options":"nosniff"}});
 }catch{return json("Unable to load photo.",500);}
}
