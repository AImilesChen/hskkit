import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { normalizeSubscriptionEvent } from "@/lib/commercial/subscription";
import { applySubscriptionEvent, claimPaymentEvent, finalizePaymentEvent, grantPaidEntitlement, revokeRefundedOrder } from "@/lib/commercial/storage";
import { sha256Hex } from "@/lib/commercial/signer";
import { verifyStripeWebhook } from "@/lib/commercial/stripe";

export async function POST(req:NextRequest) {
  const env=getCloudflareContext().env; const raw=await req.text(); let claimedEventId:string|undefined; let claimToken:string|undefined;
  try {
    const event=await verifyStripeWebhook(raw,req.headers.get("stripe-signature"),env.STRIPE_WEBHOOK_SECRET??"");
    const claim=await claimPaymentEvent({eventId:event.id,eventType:event.type,livemode:event.livemode,payloadSha256:await sha256Hex(raw)});
    if(claim.state==="duplicate") return NextResponse.json({received:true,duplicate:true});
    if(claim.state==="busy") return NextResponse.json({error:"WEBHOOK_PROCESSING"},{status:409,headers:{"retry-after":"5"}});
    claimedEventId=event.id; claimToken=claim.claimToken;
    const object=event.data.object;
    const normalized=normalizeSubscriptionEvent(event);
    if(normalized.kind==="invalid") throw new Error("INVALID_SUBSCRIPTION_EVENT");
    if(normalized.kind!=="ignored"){
      if(normalized.kind==="charge_refunded"){
        try{await applySubscriptionEvent(normalized);}
        catch(error){if(!(error instanceof Error)||error.message!=="SUBSCRIPTION_CHARGE_NOT_FOUND") throw error;await revokeRefundedOrder({chargeId:normalized.chargeId,paymentIntentId:normalized.paymentIntentId});}
      }else await applySubscriptionEvent(normalized);
      await finalizePaymentEvent(event.id,claimToken,"processed");
      return NextResponse.json({received:true});
    }
    if(event.type==="checkout.session.completed"&&object.mode==="payment"){
      if(object.payment_status!=="paid") throw new Error("CHECKOUT_NOT_PAID");
      const metadata=object.metadata&&typeof object.metadata==="object"?object.metadata as Record<string,unknown>:{};
      await grantPaidEntitlement({sessionId:String(object.id),orderId:String(metadata.order_id??""),expectedUserId:String(metadata.user_id??""),expectedSku:String(metadata.sku??""),expectedSelectedLevel:Number(metadata.selected_level),paymentIntentId:typeof object.payment_intent==="string"?object.payment_intent:undefined});
      await finalizePaymentEvent(event.id,claimToken,"processed");
      return NextResponse.json({received:true});
    }
    await finalizePaymentEvent(event.id,claimToken,"ignored");
    return NextResponse.json({received:true});
  } catch(error) {
    if(claimedEventId&&claimToken) try{await finalizePaymentEvent(claimedEventId,claimToken,"failed");}catch{}
    const code=error instanceof Error?error.message:"WEBHOOK_FAILED";
    return NextResponse.json({error:code},{status:code.includes("SIGNATURE")||code.includes("LIVE")||code.includes("CONFIGURED")?400:500});
  }
}
