function imageBytes(value){
 if(value instanceof ArrayBuffer)return new Uint8Array(value);
 if(ArrayBuffer.isView(value))return new Uint8Array(value.buffer,value.byteOffset,value.byteLength);
 if(Array.isArray(value))return Uint8Array.from(value);
 return null;
}
function isWebp(bytes){return !!bytes&&bytes.length>=12&&bytes[0]===0x52&&bytes[1]===0x49&&bytes[2]===0x46&&bytes[3]===0x46&&bytes[8]===0x57&&bytes[9]===0x45&&bytes[10]===0x42&&bytes[11]===0x50;}
const notFound=()=>new Response("Not found.",{status:404,headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
export async function onRequestGet({params,env}){
 if(!env.DB)return new Response("Photo service unavailable.",{status:503});
 const id=String(params.id||"");if(!/^[0-9a-f-]{36}$/i.test(id))return notFound();
 try{
  const row=await env.DB.prepare("SELECT p.image FROM report_photos p JOIN reports r ON r.id=p.report_id WHERE p.report_id=? AND r.status='approved'").bind(id).first();
  const bytes=imageBytes(row?.image);
  if(!isWebp(bytes))return notFound();
  return new Response(bytes,{headers:{"content-type":"image/webp","content-length":String(bytes.byteLength),"cache-control":"no-store","x-content-type-options":"nosniff"}});
 }catch{return new Response("Unable to load photo.",{status:500});}
}
