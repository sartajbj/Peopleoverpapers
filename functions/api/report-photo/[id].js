const notFound=()=>new Response("Not found.",{status:404,headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
export async function onRequestGet({params,env}){
 if(!env.DB)return new Response("Photo service unavailable.",{status:503});
 const id=String(params.id||"");if(!/^[0-9a-f-]{36}$/i.test(id))return notFound();
 try{
  const row=await env.DB.prepare("SELECT p.image FROM report_photos p JOIN reports r ON r.id=p.report_id WHERE p.report_id=? AND r.status='approved'").bind(id).first();
  if(!row?.image)return notFound();
  return new Response(row.image,{headers:{"content-type":"image/webp","cache-control":"public, max-age=3600","x-content-type-options":"nosniff","content-security-policy":"default-src 'none'; sandbox"}});
 }catch{return new Response("Unable to load photo.",{status:500});}
}
