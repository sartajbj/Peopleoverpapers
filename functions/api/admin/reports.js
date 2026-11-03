const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
function authorized(request,env){const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");return !!env.MODERATION_TOKEN&&!!token&&token===env.MODERATION_TOKEN;}
export async function onRequest({request,env}) {
 if(!env.DB||!env.MODERATION_TOKEN)return json({error:"Moderation service is not configured."},503);
 if(!authorized(request,env))return json({error:"Unauthorized."},401);
 if(request.method==="GET"){
  const {results=[]}=await env.DB.prepare("SELECT id,category,city,state,description,observed_date,submitted_at FROM reports WHERE status='pending' ORDER BY submitted_at ASC LIMIT 100").all();
  return json({reports:results});
 }
 if(request.method==="PATCH"){
  let body;try{body=await request.json();}catch{return json({error:"Invalid JSON."},400);}
  if(!body.id||!["approved","rejected"].includes(body.status))return json({error:"A report ID and approved/rejected status are required."},400);
  const result=await env.DB.prepare("UPDATE reports SET status=? WHERE id=? AND status='pending'").bind(body.status,String(body.id)).run();
  if(!result.meta?.changes)return json({error:"Pending report not found."},404);
  return json({updated:true});
 }
 return json({error:"Method not allowed."},405);
}