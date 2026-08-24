import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { normalizePackCheckoutEvent } from "@/lib/commercial/domain";
import { normalizeSubscriptionEvent } from "@/lib/commercial/subscription";
import {
  applySubscriptionEvent,
  claimPaymentEvent,
  clearRevokedExportObjectKey,
  finalizePaymentEvent,
  grantPaidPackPurchase,
  revokeRefundedOrder,
} from "@/lib/commercial/storage";
import { sha256Hex } from "@/lib/commercial/signer";
import { verifyStripeWebhook } from "@/lib/commercial/stripe";

async function revokePackPurchaseDelivery(input:{paymentIntentId?:string;chargeId?:string},env:CloudflareEnv){
  const objectKeys=await revokeRefundedOrder(input);
  for(const objectKey of objectKeys??[]){await env.COMMERCIAL_EXPORTS_R2.delete(objectKey);await clearRevokedExportObjectKey(objectKey);}
}

export async function POST(req:NextRequest) {
  const env=getCloudflareContext().env;
  const raw=await req.text();
  let claimedEventId:string|undefined;
  let claimToken:string|undefined;
  try {
    const event=await verifyStripeWebhook(raw,req.headers.get("stripe-signature"),env.STRIPE_WEBHOOK_SECRET??"");
    const claim=await claimPaymentEvent({eventId:event.id,eventType:event.type,livemode:event.livemode,payloadSha256:await sha256Hex(raw)});
    if(claim.state==="duplicate") return NextResponse.json({received:true,duplicate:true});
    if(claim.state==="busy") return NextResponse.json({error:"WEBHOOK_PROCESSING"},{status:409,headers:{"retry-after":"5"}});
    claimedEventId=event.id;
    claimToken=claim.claimToken;
    const object=event.data.object;
    const normalized=normalizeSubscriptionEvent(event);
    if(normalized.kind==="invalid") throw new Error("INVALID_SUBSCRIPTION_EVENT");
    if(normalized.kind!=="ignored"){
      if(normalized.kind==="charge_refunded"){
        try{await applySubscriptionEvent(normalized);}
        catch(error){
          if(!(error instanceof Error)||error.message!=="SUBSCRIPTION_CHARGE_NOT_FOUND") throw error;
          await revokePackPurchaseDelivery({chargeId:normalized.chargeId,paymentIntentId:normalized.paymentIntentId},env);
        }
      }else await applySubscriptionEvent(normalized);
      await finalizePaymentEvent(event.id,claimToken,"processed");
      return NextResponse.json({received:true});
    }
    if(event.type==="checkout.session.completed"&&object.mode==="payment"){
      const pack=normalizePackCheckoutEvent(object);
      await grantPaidPackPurchase({
        sessionId:pack.sessionId,
        orderId:pack.orderId,
        expectedUserId:pack.userId,
        expectedSku:pack.sku,
        expectedSelectedLevel:pack.selectedLevel,
        paymentIntentId:pack.paymentIntentId,
      });
      await finalizePaymentEvent(event.id,claimToken,"processed");
      return NextResponse.json({received:true});
    }
    await finalizePaymentEvent(event.id,claimToken,"ignored");
    return NextResponse.json({received:true});
  } catch(error) {
    if(claimedEventId&&claimToken) try{await finalizePaymentEvent(claimedEventId,claimToken,"failed");}catch{}
    const code=error instanceof Error?error.message:"WEBHOOK_FAILED";
    return NextResponse.json({error:code},{status:code.includes("SIGNATURE")||code.includes("LIVE")||code.includes("CONFIGURED")||code.includes("MISMATCH")?400:500});
  }
}
