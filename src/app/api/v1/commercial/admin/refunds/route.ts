import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest,NextResponse } from "next/server";
import { commerceDb } from "@/lib/commercial/storage";
import { cancelStripeSubscriptionImmediately, createStripeTestRefund } from "@/lib/commercial/stripe";

export async function POST(req:NextRequest){
  const env=getCloudflareContext().env; const expected=env.ADMIN_REFUND_TOKEN; const supplied=req.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
  if(!expected||!supplied||supplied!==expected) return NextResponse.json({error:"ADMIN_AUTH_REQUIRED"},{status:401});
  try{
    const body=JSON.parse(await req.text()); const requestId=String(body.requestId??""); const db=commerceDb();
    const subscription=await db.prepare(`SELECT r.id,r.status,c.provider_payment_intent_id,s.provider_subscription_id FROM subscription_refund_requests r JOIN subscription_charges c ON c.id=r.charge_id JOIN subscriptions s ON s.id=c.subscription_id WHERE r.id=?`).bind(requestId).first<{id:string;status:string;provider_payment_intent_id:string|null;provider_subscription_id:string}>();
    if(subscription){
      if(subscription.status!=="requested"||!subscription.provider_payment_intent_id) throw new Error("REFUND_REQUEST_NOT_READY");
      const refund=await createStripeTestRefund({paymentIntentId:subscription.provider_payment_intent_id,secret:env.STRIPE_SECRET_KEY??"",idempotencyKey:`subscription-refund:${subscription.id}`});
      await cancelStripeSubscriptionImmediately({subscriptionId:subscription.provider_subscription_id,secret:env.STRIPE_SECRET_KEY??"",idempotencyKey:`subscription-refund-cancel:${subscription.id}`});
      await db.prepare(`UPDATE subscription_refund_requests SET status='approved',updated_at=? WHERE id=? AND status='requested'`).bind(new Date().toISOString(),subscription.id).run();
      return NextResponse.json({requestId:subscription.id,stripeRefundId:refund.id,status:refund.status,mode:"test",kind:"subscription"});
    }
    const pack=await db.prepare(`SELECT r.id,r.status,o.stripe_payment_intent_id FROM commercial_refund_requests r JOIN commerce_orders o ON o.id=r.order_id WHERE r.id=?`).bind(requestId).first<{id:string;status:string;stripe_payment_intent_id:string|null}>();
    if(!pack||pack.status!=="pending_review"||!pack.stripe_payment_intent_id) throw new Error("REFUND_REQUEST_NOT_READY");
    const refund=await createStripeTestRefund({paymentIntentId:pack.stripe_payment_intent_id,secret:env.STRIPE_SECRET_KEY??"",idempotencyKey:`refund:${pack.id}`});
    await db.prepare(`UPDATE commercial_refund_requests SET status='approved',reviewed_at=?,review_note=? WHERE id=? AND status='pending_review'`).bind(new Date().toISOString(),`Stripe Test refund ${refund.id} submitted`,pack.id).run();
    return NextResponse.json({requestId:pack.id,stripeRefundId:refund.id,status:refund.status,mode:"test",kind:"pdf_pack"});
  }catch(error){const code=error instanceof Error?error.message:"REFUND_FAILED";return NextResponse.json({error:code},{status:code.includes("NOT_READY")?409:502});}
}
