const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const decodePart=(part)=>{const value=part.replace(/-/g,"+").replace(/_/g,"/");return JSON.parse(atob(value+"=".repeat((4-value.length%4)%4)));};
async function verifyAccess(request,env){
  const token=request.headers.get("Cf-Access-Jwt-Assertion");
  if(!token||!env.ACCESS_TEAM_DOMAIN||!env.ACCESS_AUD) return false;
  const issuer=env.ACCESS_TEAM_DOMAIN.replace(/\/$/,"");
  const parts=token.split(".");if(parts.length!==3)return false;
  try{
    const header=decodePart(parts[0]),claims=decodePart(parts[1]);
    if(header.alg!=="RS256"||!header.kid||claims.iss!==issuer||!Array.isArray(claims.aud)||!claims.aud.includes(env.ACCESS_AUD))return false;
    const now=Math.floor(Date.now()/1000);if(!claims.exp||claims.exp<now||(claims.nbf&&claims.nbf>now))return false;
    const response=await fetch(issuer+"/cdn-cgi/access/certs",{headers:{Accept:"application/json"}});
    if(!response.ok)return false;
    const certs=await response.json();const jwk=certs.keys?.find(k=>k.kid===header.kid);if(!jwk)return false;
    const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
    const signature=Uint8Array.from(atob(parts[2].replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,signature,new TextEncoder().encode(parts[0]+"."+parts[1]));
  }catch{return false;}
}
export async function onRequest({request,env}){
  if(!await verifyAccess(request,env))return json({error:"Moderator authentication required."},401);
  if(!env.DB)return json({error:"Reports database is not configured."},503);
  if(request.method==="GET"){
    try{const {results=[]}=await env.DB.prepare("SELECT id,location_label,category,description,observed_at,lat,lng,status,created_at,reviewed_at FROM reports WHERE status='pending' ORDER BY created_at ASC LIMIT 200").all();return json({reports:results});}
    catch{return json({error:"Could not load moderation queue."},500);}
  }
  if(request.method==="PATCH"){
    let body;try{body=await request.json();}catch{return json({error:"Invalid JSON."},400);}
    const id=Number(body.id),status=String(body.status||"");
    const location=String(body.location_label||"").trim(),description=String(body.description||"").trim();
    if(!Number.isInteger(id)||id<1||!["approved","rejected"].includes(status))return json({error:"A valid report ID and approved/rejected status are required."},400);
    if(location.length<2||location.length>120||description.length<30||description.length>1500)return json({error:"Edited location or description is outside the allowed length."},400);
    try{
      const claims=decodePart(request.headers.get("Cf-Access-Jwt-Assertion").split(".")[1]);
      const actor=String(claims.email||"cloudflare-access-user").slice(0,254);
      const results=await env.DB.batch([
        env.DB.prepare("INSERT INTO moderation_log (report_id,action,actor_email) SELECT ?,?,? WHERE EXISTS (SELECT 1 FROM reports WHERE id=? AND status='pending')").bind(id,status,actor,id),
        env.DB.prepare("UPDATE reports SET location_label=?, description=?, status=?, reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'").bind(location,description,status,id)
      ]);
      if(!results[1]?.meta?.changes)return json({error:"Report not found or already reviewed."},404);
      return json({ok:true,id,status});
    }catch{return json({error:"Could not update report. Check that the latest database migration is applied."},500);}
  }
  return json({error:"Method not allowed."},405);
}