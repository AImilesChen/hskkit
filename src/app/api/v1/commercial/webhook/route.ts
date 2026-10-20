import {getCloudflareContext} from "@opennextjs/cloudflare";
import {NextRequest,NextResponse} from "next/server";
import {activeStripeWebhookSecret,normalizeDigitalProductCheckoutEvent,normalizePackCheckoutEvent,stripePriceId} from "@/lib/commercial/domain";
import {grantDigitalProductOrder,revokeRefundedDigitalProductOrder} from "@/lib/commercial/digital-storage";
import {normalizeSubscriptionEvent} from "@/lib/commercial/subscription";
import {applySubscriptionEvent,claimPaymentEvent,clearRevokedExportObjectKey,finalizePaymentEvent,grantPaidPackPurchase,revokeRefundedOrder} from "@/lib/commercial/storage";
import {sha256Hex} from "@/lib/commercial/signer";
import {verifyStripeWebhook} from "@/lib/commercial/stripe";
import {flagRefundedReferralCharge,rewardFirstPaidReferral} from "@/lib/commercial/referral-storage";

async function deleteRevokedObjects(objectKeys:string[],env:CloudflareEnv){for(const objectKey of objectKeys){await env.COMMERCIAL_EXPORTS_R2.delete(objectKey);if(await env.COMMERCIAL_EXPORTS_R2.head(objectKey))throw new Error("REFUND_OBJECT_DELETE_FAILED");await clearRevokedExportObjectKey(objectKey);}}
type RefundIdentity={paymentIntentId?:string;chargeId?:string;amountRefundedCents?:number;currency?:string;livemode?:boolean};
async function revokePackPurchaseDelivery(input:RefundIdentity,env:CloudflareEnv){if(input.livemode)throw new Error("LEGACY_PACK_LIVE_FORBIDDEN");await deleteRevokedObjects(await revokeRefundedOrder(input),env);}
async function revokeDigitalProductDelivery(input:RefundIdentity,env:CloudflareEnv){await deleteRevokedObjects(await revokeRefundedDigitalProductOrder(input),env);}
async function revokeOneTimeDelivery(input:RefundIdentity,env:CloudflareEnv){try{await revokePackPurchaseDelivery(input,env);return;}catch(error){if(error instanceof Error&&error.message==="PARTIAL_REFUND_NOT_FINAL")return;if(!(error instanceof Error)||!["ORDER_NOT_FOUND","LEGACY_PACK_LIVE_FORBIDDEN"].includes(error.message))throw error;}try{await revokeDigitalProductDelivery(input,env);}catch(error){if(error instanceof Error&&error.message==="PARTIAL_REFUND_NOT_FINAL")return;throw error;}}

export async function POST(req:NextRequest){
  const env=getCloudflareContext().env;const mode=env.COMMERCE_MODE;const webhookSecret=activeStripeWebhookSecret(env);if((mode!=="test"&&mode!=="live")||!webhookSecret)return NextResponse.json({error:"COMMERCE_NOT_CONFIGURED"},{status:503});
  const raw=await req.text();let claimedEventId:string|undefined;let claimToken:string|undefined;let livemode=false;
  try{
    const event=await verifyStripeWebhook(raw,req.headers.get("stripe-signature"),webhookSecret,Date.now(),mode);livemode=event.livemode;
    const claim=await claimPaymentEvent({eventId:event.id,eventType:event.type,livemode:event.livemode,payloadSha256:await sha256Hex(raw)});
    if(claim.state==="duplicate")return NextResponse.json({received:true,duplicate:true});if(claim.state==="busy")return NextResponse.json({error:"WEBHOOK_PROCESSING"},{status:409,headers:{"retry-after":"5"}});claimedEventId=event.id;claimToken=claim.claimToken;const object=event.data.object;
    const subscriptionPricePlans:Record<string,"pro_monthly"|"pro_yearly">={};
    if(mode==="live")for(const planId of ["pro_monthly","pro_yearly"] as const)subscriptionPricePlans[stripePriceId(env.STRIPE_PRICE_MAP,`subscription:${planId}`)]=planId;
    const normalized=normalizeSubscriptionEvent(event,subscriptionPricePlans);if(normalized.kind==="invalid")throw new Error("INVALID_SUBSCRIPTION_EVENT");
    if(normalized.kind!=="ignored"){
      if(normalized.kind==="charge_refunded"){try{await applySubscriptionEvent(normalized,undefined,livemode);await flagRefundedReferralCharge(normalized.chargeId,livemode);}catch(error){if(!(error instanceof Error)||error.message!=="SUBSCRIPTION_CHARGE_NOT_FOUND")throw error;await revokeOneTimeDelivery({chargeId:normalized.chargeId,paymentIntentId:normalized.paymentIntentId,amountRefundedCents:normalized.amountRefundedCents,currency:normalized.currency,livemode},env);}}else{await applySubscriptionEvent(normalized,undefined,livemode);if(normalized.kind==="invoice_paid")await rewardFirstPaidReferral(normalized.subscriptionId,livemode);}
      await finalizePaymentEvent(event.id,claimToken,"processed",undefined,livemode);return NextResponse.json({received:true});
    }
    if(event.type==="checkout.session.completed"&&object.mode==="payment"){
      const metadata=object.metadata&&typeof object.metadata==="object"?object.metadata as Record<string,unknown>:{};
      if(metadata.product_id){const product=normalizeDigitalProductCheckoutEvent(object,mode);await grantDigitalProductOrder({sessionId:product.sessionId,orderId:product.orderId,expectedUserId:product.userId,expectedProductId:product.productId,expectedAmountCents:product.amountCents,paymentIntentId:product.paymentIntentId,livemode});}
      else{if(livemode)throw new Error("LEGACY_PACK_LIVE_FORBIDDEN");const pack=normalizePackCheckoutEvent(object,mode);await grantPaidPackPurchase({sessionId:pack.sessionId,orderId:pack.orderId,expectedUserId:pack.userId,expectedSku:pack.sku,expectedSelectedLevel:pack.selectedLevel,paymentIntentId:pack.paymentIntentId});}
      await finalizePaymentEvent(event.id,claimToken,"processed",undefined,livemode);return NextResponse.json({received:true});
    }
    await finalizePaymentEvent(event.id,claimToken,"ignored",undefined,livemode);return NextResponse.json({received:true});
  }catch(error){if(claimedEventId&&claimToken)try{await finalizePaymentEvent(claimedEventId,claimToken,"failed",undefined,livemode);}catch{}const code=error instanceof Error?error.message:"WEBHOOK_FAILED";return NextResponse.json({error:code},{status:code.includes("SIGNATURE")||code.includes("MODE")||code.includes("CONFIGURED")||code.includes("MISMATCH")||code.includes("FORBIDDEN")?400:500});}
}
