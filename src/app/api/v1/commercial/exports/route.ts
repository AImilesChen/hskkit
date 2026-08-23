import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { requestIdentity } from "@/lib/account/identity";
import { activeEntitlementForLevel, cancelExportJob, createExportJob, listEntitlements, listExportJobs, retryExportJob } from "@/lib/commercial/storage";

export async function GET() { const identity=await requestIdentity(); if(!identity.account||identity.account.status!=="active") return NextResponse.json({error:"ACCOUNT_REQUIRED"},{status:401}); const [jobs,entitlements]=await Promise.all([listExportJobs(identity.account.userId),listEntitlements(identity.account.userId)]); return NextResponse.json({jobs,entitlements},{headers:{"cache-control":"private, no-store"}}); }
export async function POST(req:NextRequest) {
  const identity=await requestIdentity(); if(!identity.account||identity.account.status!=="active") return NextResponse.json({error:"ACCOUNT_REQUIRED"},{status:401});
  try {
    const body=JSON.parse(await req.text()); const kind=String(body.kind??""); const idempotencyKey=String(body.idempotencyKey??"");
    if(!["pdf_pack","offline_pack","account_data"].includes(kind)) throw new Error("INVALID_EXPORT_KIND");
    if(!idempotencyKey||idempotencyKey.length>80) throw new Error("INVALID_IDEMPOTENCY_KEY");
    let entitlementId:string|undefined; let level:number|undefined; let format:"pdf"|"zip"|"json"="json";
    if(kind!=="account_data") { level=Number(body.level); if(!Number.isInteger(level)||level<1||level>7) throw new Error("INVALID_LEVEL"); const entitlement=await activeEntitlementForLevel(identity.account.userId,level); if(!entitlement) throw new Error("LEVEL_NOT_ENTITLED"); entitlementId=entitlement.id; format=kind==="pdf_pack"?"pdf":"zip"; }
    const job=await createExportJob({userId:identity.account.userId,entitlementId,kind:kind as "pdf_pack"|"offline_pack"|"account_data",format,level,idempotencyKey,generationVersion:"batch15-v1"}); if(!job) throw new Error("EXPORT_CREATE_FAILED");
    if(job.state==="queued") await getCloudflareContext().env.COMMERCIAL_EXPORT_QUEUE.send({jobId:job.id},{contentType:"json"});
    return NextResponse.json({job},{status:201});
  } catch(error) { const code=error instanceof Error?error.message:"EXPORT_REQUEST_FAILED"; const status=code==="LEVEL_NOT_ENTITLED"?403:code.startsWith("INVALID")?422:500; return NextResponse.json({error:code},{status}); }
}
export async function PATCH(req:NextRequest) {
  const identity=await requestIdentity(); if(!identity.account||identity.account.status!=="active") return NextResponse.json({error:"ACCOUNT_REQUIRED"},{status:401});
  try { const body=JSON.parse(await req.text()); const action=String(body.action); const jobId=String(body.jobId??""); if(!jobId||!["cancel","retry"].includes(action)) throw new Error("INVALID_ACTION"); const changed=action==="cancel"?await cancelExportJob(jobId,identity.account.userId):await retryExportJob(jobId,identity.account.userId); if(!changed) throw new Error("EXPORT_TRANSITION_REJECTED"); if(action==="retry") await getCloudflareContext().env.COMMERCIAL_EXPORT_QUEUE.send({jobId},{contentType:"json"}); return NextResponse.json({jobId,state:action==="cancel"?"cancelled":"queued"}); }
  catch(error){const code=error instanceof Error?error.message:"EXPORT_UPDATE_FAILED";return NextResponse.json({error:code},{status:code==="INVALID_ACTION"?422:409});}
}
