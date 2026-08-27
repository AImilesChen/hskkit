import {getCloudflareContext} from "@opennextjs/cloudflare";
import {NextRequest,NextResponse} from "next/server";
import {requestIdentity} from "@/lib/account/identity";
import {activeDigitalEntitlement,listDigitalEntitlements} from "@/lib/commercial/digital-storage";
import {activePackPurchaseForLevel,cancelExportJob,createExportJob,listExportJobs,listPackPurchases,retryExportJob} from "@/lib/commercial/storage";
import {currentProductDelivery,generationVersionForProduct} from "@/lib/commercial/products";

export async function GET(){const identity=await requestIdentity();if(!identity.account||identity.account.status!=="active")return NextResponse.json({error:"ACCOUNT_REQUIRED"},{status:401});const [jobs,purchases,digitalEntitlements]=await Promise.all([listExportJobs(identity.account.userId),listPackPurchases(identity.account.userId),listDigitalEntitlements(identity.account.userId)]);return NextResponse.json({jobs,purchases,digitalEntitlements},{headers:{"cache-control":"private, no-store"}});}

export async function POST(req:NextRequest){
  const identity=await requestIdentity();if(!identity.account||identity.account.status!=="active")return NextResponse.json({error:"ACCOUNT_REQUIRED"},{status:401});
  try{
    const body=JSON.parse(await req.text()) as Record<string,unknown>;const kind=String(body.kind??"");const idempotencyKey=String(body.idempotencyKey??"");if(!["pdf_pack","offline_pack","account_data"].includes(kind))throw new Error("INVALID_EXPORT_KIND");if(!idempotencyKey||idempotencyKey.length>80)throw new Error("INVALID_IDEMPOTENCY_KEY");
    let packPurchaseId:string|undefined;let productEntitlementId:string|undefined;let productId:string|undefined;let deliveryKey:string|undefined;let level:number|undefined;let format:"pdf"|"zip"|"json"="json";let resolvedKind=kind as "pdf_pack"|"offline_pack"|"account_data";
    if(kind!=="account_data"&&body.productEntitlementId){
      const entitlement=await activeDigitalEntitlement(identity.account.userId,String(body.productEntitlementId));if(!entitlement)throw new Error("PRODUCT_NOT_PURCHASED");productEntitlementId=entitlement.id;productId=entitlement.product_id;deliveryKey=entitlement.delivery_key;level=entitlement.level??undefined;
      const currentDelivery=currentProductDelivery(productId,deliveryKey,entitlement.level);if(!currentDelivery)throw new Error("PRODUCT_DELIVERY_MISMATCH");
      if(currentDelivery.artifactType==="level"){if(kind!=="pdf_pack"||currentDelivery.format!=="pdf")throw new Error("INVALID_DELIVERY_FORMAT");format="pdf";}
      else{resolvedKind=currentDelivery.format==="pdf"?"pdf_pack":"offline_pack";format=currentDelivery.format;if(kind!==resolvedKind)throw new Error("INVALID_DELIVERY_FORMAT");}
    }else if(kind!=="account_data"){
      level=Number(body.level);if(!Number.isInteger(level)||level<1||level>7)throw new Error("INVALID_LEVEL");const purchase=await activePackPurchaseForLevel(identity.account.userId,level);if(!purchase)throw new Error("LEVEL_NOT_PURCHASED");packPurchaseId=purchase.id;format=kind==="pdf_pack"?"pdf":"zip";
    }
    const job=await createExportJob({userId:identity.account.userId,packPurchaseId,productEntitlementId,productId,deliveryKey,kind:resolvedKind,format,level,idempotencyKey,generationVersion:generationVersionForProduct(productId)});if(!job)throw new Error("EXPORT_CREATE_FAILED");if(job.state==="queued")await getCloudflareContext().env.COMMERCIAL_EXPORT_QUEUE.send({jobId:job.id},{contentType:"json"});return NextResponse.json({job},{status:201});
  }catch(error){const code=error instanceof Error?error.message:"EXPORT_REQUEST_FAILED";const status=code==="LEVEL_NOT_PURCHASED"||code==="PRODUCT_NOT_PURCHASED"?403:code==="IDEMPOTENCY_CONFLICT"?409:code.startsWith("INVALID")?422:500;return NextResponse.json({error:code},{status});}
}

export async function PATCH(req:NextRequest){const identity=await requestIdentity();if(!identity.account||identity.account.status!=="active")return NextResponse.json({error:"ACCOUNT_REQUIRED"},{status:401});try{const body=JSON.parse(await req.text()) as Record<string,unknown>;const action=String(body.action);const jobId=String(body.jobId??"");if(!jobId||!["cancel","retry"].includes(action))throw new Error("INVALID_ACTION");const changed=action==="cancel"?await cancelExportJob(jobId,identity.account.userId):await retryExportJob(jobId,identity.account.userId);if(!changed)throw new Error("EXPORT_TRANSITION_REJECTED");if(action==="retry")await getCloudflareContext().env.COMMERCIAL_EXPORT_QUEUE.send({jobId},{contentType:"json"});return NextResponse.json({jobId,state:action==="cancel"?"cancelled":"queued"});}catch(error){const code=error instanceof Error?error.message:"EXPORT_UPDATE_FAILED";return NextResponse.json({error:code},{status:code==="INVALID_ACTION"?422:409});}}
