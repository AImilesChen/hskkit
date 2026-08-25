import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { requestIdentity } from "@/lib/account/identity";
import { manifestStillAuthorized } from "@/lib/commercial/catalog";
import { canIssueDownload } from "@/lib/commercial/domain";
import {
  clearExportObjectKey,
  createDownloadTokenRecord,
  expireExportJob,
  getExportJob,
  revokeExportJob,
} from "@/lib/commercial/storage";
import { sha256Hex, signDownloadToken } from "@/lib/commercial/signer";

async function revokePackExportDelivery(jobId:string,reason:string,env:CloudflareEnv){
  const objectKey=await revokeExportJob(jobId,reason);
  if(objectKey){await env.COMMERCIAL_EXPORTS_R2.delete(objectKey);await clearExportObjectKey(jobId,objectKey);}
}

async function expirePackExportDelivery(jobId:string,env:CloudflareEnv){
  const objectKey=await expireExportJob(jobId);
  if(objectKey){await env.COMMERCIAL_EXPORTS_R2.delete(objectKey);await clearExportObjectKey(jobId,objectKey);}
}

export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const identity=await requestIdentity();
  if(!identity.account||identity.account.status!=="active") return NextResponse.json({error:"ACCOUNT_REQUIRED"},{status:401});
  const env=getCloudflareContext().env;
  if(!env.EXPORT_SIGNING_SECRET||env.EXPORT_SIGNING_SECRET.length<32) return NextResponse.json({error:"DOWNLOAD_SIGNING_NOT_CONFIGURED"},{status:503});
  const job=await getExportJob((await params).id,identity.account.userId);
  if(!job) return NextResponse.json({error:"EXPORT_NOT_FOUND"},{status:404});
  if(!job.expires_at||Date.parse(job.expires_at)<=Date.now()){
    if(job.state==="ready") await expirePackExportDelivery(job.id,env);
    return NextResponse.json({error:"EXPORT_EXPIRED"},{status:410});
  }
  let accessExpiresAt=job.expires_at;
  if(job.kind==="account_data") {
    if(job.state!=="ready") return NextResponse.json({error:"EXPORT_NOT_READY"},{status:409});
  } else {
    if(!manifestStillAuthorized(job.manifest_json)){
      await revokePackExportDelivery(job.id,"CONTENT_RIGHTS_CHANGED",env);
      return NextResponse.json({error:"CONTENT_RIGHTS_CHANGED"},{status:410});
    }
    const purchase=job.pack_purchase_id
      ?await env.LEARNING_DB.prepare(`SELECT status,expires_at,download_limit,successful_downloads FROM pack_purchases WHERE id=?`).bind(job.pack_purchase_id).first<{status:string;expires_at:string;download_limit:number;successful_downloads:number}>()
      :job.product_entitlement_id
        ?await env.LEARNING_DB.prepare(`SELECT status,expires_at,download_limit,successful_downloads FROM digital_product_entitlements WHERE id=?`).bind(job.product_entitlement_id).first<{status:string;expires_at:string;download_limit:number;successful_downloads:number}>()
        :null;
    if(purchase?.expires_at&&Date.parse(purchase.expires_at)<Date.parse(accessExpiresAt))accessExpiresAt=purchase.expires_at;
    const decision=canIssueDownload({
      actorUserId:identity.account.userId,
      ownerUserId:job.user_id,
      packPurchaseStatus:purchase?.status??"revoked",
      jobState:job.state,
      expiresAt:accessExpiresAt,
      successfulDownloads:purchase?.successful_downloads??0,
      downloadLimit:purchase?.download_limit??0,
    });
    if(!decision.allowed) return NextResponse.json({error:decision.code},{status:decision.code==="ACCESS_DENIED"?403:decision.code==="EXPORT_EXPIRED"?410:409});
  }
  const tokenId=`tok_${crypto.randomUUID()}`;
  const exp=Math.min(Math.floor(Date.now()/1000)+600,Math.floor(Date.parse(accessExpiresAt)/1000));
  const token=await signDownloadToken({jobId:job.id,userId:identity.account.userId,jti:tokenId,exp},env.EXPORT_SIGNING_SECRET);
  await createDownloadTokenRecord({tokenId,jobId:job.id,userId:identity.account.userId,tokenSha256:await sha256Hex(token),expiresAt:new Date(exp*1000).toISOString()});
  return NextResponse.json({url:`${req.nextUrl.origin}/api/v1/commercial/download/${encodeURIComponent(token)}`,expiresAt:new Date(exp*1000).toISOString(),singleUse:true},{headers:{"cache-control":"private, no-store"}});
}
