import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { requestIdentity } from "@/lib/account/identity";
import { consumeSuccessfulDownload,downloadContext,revokeExportJob } from "@/lib/commercial/storage";
import { manifestStillAuthorized } from "@/lib/commercial/catalog";
import { sha256Hex, verifyDownloadToken } from "@/lib/commercial/signer";

export async function GET(_:Request,{params}:{params:Promise<{token:string}>}) {
  const identity=await requestIdentity(); if(!identity.account||identity.account.status!=="active") return NextResponse.json({error:"ACCOUNT_REQUIRED"},{status:401});
  const env=getCloudflareContext().env; const token=decodeURIComponent((await params).token);
  try {
    if(!env.EXPORT_SIGNING_SECRET) throw new Error("DOWNLOAD_SIGNING_NOT_CONFIGURED"); const payload=await verifyDownloadToken(token,env.EXPORT_SIGNING_SECRET); if(payload.userId!==identity.account.userId) throw new Error("ACCESS_DENIED");
    const context=await downloadContext(await sha256Hex(token)); if(!context||context.user_id!==identity.account.userId||context.id!==payload.jobId||context.token_id!==payload.jti) throw new Error("DOWNLOAD_TOKEN_NOT_FOUND");
    if(context.consumed_at) throw new Error("DOWNLOAD_TOKEN_CONSUMED"); if(Date.parse(String(context.token_expires_at))<=Date.now()) throw new Error("DOWNLOAD_TOKEN_EXPIRED"); if(context.state!=="ready"||!context.object_key) throw new Error("EXPORT_NOT_READY"); if(!context.expires_at||Date.parse(String(context.expires_at))<=Date.now()) throw new Error("EXPORT_EXPIRED");
    if(context.entitlement_id&&(context.entitlement_status!=="active"||Number(context.successful_downloads)>=Number(context.download_limit))) throw new Error("DOWNLOAD_NOT_ALLOWED");
    if(context.kind!=="account_data"&&!manifestStillAuthorized(String(context.manifest_json??""))){await revokeExportJob(String(context.id),"CONTENT_RIGHTS_CHANGED");throw new Error("CONTENT_RIGHTS_CHANGED");}
    const object=await env.COMMERCIAL_EXPORTS_R2.get(String(context.object_key)); if(!object) throw new Error("EXPORT_OBJECT_MISSING"); const checksum=String(context.checksum_sha256??""); if(object.customMetadata?.checksumSha256&&object.customMetadata.checksumSha256!==checksum) throw new Error("EXPORT_CHECKSUM_MISMATCH");
    await consumeSuccessfulDownload({tokenId:String(context.token_id),jobId:String(context.id),entitlementId:context.entitlement_id?String(context.entitlement_id):null,userId:identity.account.userId,byteSize:Number(context.byte_size),checksumSha256:checksum});
    const extension=String(context.format); const contentType=object.httpMetadata?.contentType??(extension==="pdf"?"application/pdf":extension==="zip"?"application/zip":"application/json");
    return new Response(object.body,{headers:{"content-type":contentType,"content-length":String(object.size),"content-disposition":`attachment; filename="hskkit-${String(context.kind)}.${extension}"`,"x-content-sha256":checksum,"cache-control":"private, no-store","x-content-type-options":"nosniff"}});
  } catch(error) { const code=error instanceof Error?error.message:"DOWNLOAD_FAILED"; const status=code==="ACCESS_DENIED"?403:code.includes("EXPIRED")||code==="CONTENT_RIGHTS_CHANGED"?410:code.includes("NOT_FOUND")||code.includes("MISSING")?404:409; return NextResponse.json({error:code},{status,headers:{"cache-control":"private, no-store"}}); }
}
