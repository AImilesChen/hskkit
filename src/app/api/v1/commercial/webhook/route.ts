import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { grantPaidEntitlement, paymentEventExists, recordPaymentEvent, revokeRefundedOrder } from "@/lib/commercial/storage";
import { sha256Hex } from "@/lib/commercial/signer";
import { verifyStripeWebhook } from "@/lib/commercial/stripe";

export async function POST(req:NextRequest) {
  const env=getCloudflareContext().env; const raw=await req.text();
  try {
    const event=await verifyStripeWebhook(raw,req.headers.get("stripe-signature"),env.STRIPE_WEBHOOK_SECRET??"");
    if(await paymentEventExists(event.id)) return NextResponse.json({received:true,duplicate:true});
    const object=event.data.object;
    if(event.type==="checkout.session.completed") {
      if(object.mode!=="payment"||object.payment_status!=="paid") throw new Error("CHECKOUT_NOT_PAID");
      const metadata=object.metadata&&typeof object.metadata==="object"?object.metadata as Record<string,unknown>:{};
      await grantPaidEntitlement({
        sessionId:String(object.id),
        orderId:String(metadata.order_id??""),
        expectedUserId:String(metadata.user_id??""),
        expectedSku:String(metadata.sku??""),
        expectedSelectedLevel:Number(metadata.selected_level),
        paymentIntentId:typeof object.payment_intent==="string"?object.payment_intent:undefined,
      });
    } else if(event.type==="charge.refunded") {
      await revokeRefundedOrder({chargeId:String(object.id),paymentIntentId:typeof object.payment_intent==="string"?object.payment_intent:undefined});
    }
    await recordPaymentEvent({eventId:event.id,eventType:event.type,livemode:event.livemode,payloadSha256:await sha256Hex(raw),outcome:["checkout.session.completed","charge.refunded"].includes(event.type)?"processed":"ignored"});
    return NextResponse.json({received:true});
  } catch(error) { const code=error instanceof Error?error.message:"WEBHOOK_FAILED"; return NextResponse.json({error:code},{status:code.includes("SIGNATURE")||code.includes("LIVE")||code.includes("CONFIGURED")?400:500}); }
}
