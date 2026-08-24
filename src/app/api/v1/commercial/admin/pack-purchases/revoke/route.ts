import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest,NextResponse } from "next/server";
import { clearRevokedExportObjectKey,revokePackPurchase } from "@/lib/commercial/storage";

export async function POST(req:NextRequest){
  const env=getCloudflareContext().env;
  const expected=env.ADMIN_REFUND_TOKEN;
  const supplied=req.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
  if(!expected||!supplied||supplied!==expected) return NextResponse.json({error:"ADMIN_AUTH_REQUIRED"},{status:401});
  try{
    const body=JSON.parse(await req.text()) as {packPurchaseId?:unknown;reason?:unknown};
    const packPurchaseId=String(body.packPurchaseId??"").trim();
    const reason=String(body.reason??"license_withdrawn").trim().slice(0,160);
    if(!packPurchaseId) return NextResponse.json({error:"PACK_PURCHASE_ID_REQUIRED"},{status:400});
    const objectKeys=await revokePackPurchase({packPurchaseId,reason});
    for(const objectKey of objectKeys){
      await env.COMMERCIAL_EXPORTS_R2.delete(objectKey);
      await clearRevokedExportObjectKey(objectKey);
    }
    return NextResponse.json({packPurchaseId,status:"revoked"});
  }catch(error){
    const code=error instanceof Error?error.message:"PACK_PURCHASE_REVOKE_FAILED";
    return NextResponse.json({error:code},{status:code==="PACK_PURCHASE_NOT_FOUND"?404:500});
  }
}
