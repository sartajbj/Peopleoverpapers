function decodeHexImage(hex){
 if(typeof hex!=="string"||hex.length<24||hex.length>204800||hex.length%2!==0||!/^[0-9a-f]+$/i.test(hex))return null;
 const bytes=new Uint8Array(hex.length/2);
 for(let i=0;i<bytes.length;i++)bytes[i]=parseInt(hex.slice(i*2,i*2+2),16);
 if(bytes[0]!==0x52||bytes[1]!==0x49||bytes[2]!==0x46||bytes[3]!==0x46||bytes[8]!==0x57||bytes[9]!==0x45||bytes[10]!==0x42||bytes[11]!==0x50)return null;
 return bytes;
}
const notFound=()=>new Response("Not found.",{status:404,headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
export async function onRequestGet({params,env}){
 if(!env.DB)return new Response("Photo service unavailable.",{status:503});
 const id=String(params.id||"");if(!/^[0-9a-f-]{36}$/i.test(id))return notFound();
 try{
  const row=await env.DB.prepare("SELECT hex(p.image) AS image_hex FROM report_photos p JOIN reports r ON r.id=p.report_id WHERE p.report_id=? AND r.status='approved'").bind(id).first();
  const bytes=decodeHexImage(row?.image_hex);
  if(!bytes)return notFound();
  return new Response(bytes,{headers:{"content-type":"image/webp","content-length":String(bytes.byteLength),"cache-control":"no-store","x-content-type-options":"nosniff"}});
 }catch{return new Response("Unable to load photo.",{status:500});}
}
