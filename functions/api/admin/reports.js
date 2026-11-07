const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
function authorized(request,env){const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");return !!env.MODERATION_TOKEN&&!!token&&token===env.MODERATION_TOKEN;}
export async function onRequest({request,env}) {
 if(!env.DB||!env.MODERATION_TOKEN)return json({error:"Moderation service is not configured."},503);
 if(!authorized(request,env))return json({error:"Unauthorized."},401);
 if(request.method==="GET"){
  const {results=[]}=await env.DB.prepare("SELECT r.id,r.category,r.city,r.state,r.description,r.observed_date,r.observed_time,r.submitted_at,CASE WHEN p.report_id IS NULL THEN 0 ELSE 1 END AS has_photo FROM reports r LEFT JOIN report_photos p ON p.report_id=r.id WHERE r.status='pending' ORDER BY r.submitted_at ASC LIMIT 100").all();
  return json({reports:results});
 }
 if(request.method==="PATCH"){
  let body;try{body=await request.json();}catch{return json({error:"Invalid JSON."},400);}
  if(!body.id||!["approved","rejected"].includes(body.status))return json({error:"A report ID and approved/rejected status are required."},400);
  const row=await env.DB.prepare("SELECT id FROM reports WHERE id=? AND status='pending'").bind(String(body.id)).first();
  if(!row)return json({error:"Pending report not found."},404);
  if(body.status==="rejected")await env.DB.batch([env.DB.prepare("UPDATE reports SET status='rejected' WHERE id=? AND status='pending'").bind(String(body.id)),env.DB.prepare("DELETE FROM report_photos WHERE report_id=?").bind(String(body.id))]);
  else{const result=await env.DB.prepare("UPDATE reports SET status='approved' WHERE id=? AND status='pending'").bind(String(body.id)).run();if(!result.meta?.changes)return json({error:"Pending report not found."},404);}
  return json({updated:true});
 }
 return json({error:"Method not allowed."},405);
}
