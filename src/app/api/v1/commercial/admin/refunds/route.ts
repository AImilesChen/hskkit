import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest,NextResponse } from "next/server";
import { commerceDb } from "@/lib/commercial/storage";
import { cancelStripeSubscriptionImmediately, createStripeTestRefund, findStripeInvoicePaymentIntent } from "@/lib/commercial/stripe";

export async function POST(req:NextRequest){
  const env=getCloudflareContext().env; const expected=env.ADMIN_REFUND_TOKEN; const supplied=req.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
  if(!expected||!supplied||supplied!==expected) return NextResponse.json({error:"ADMIN_AUTH_REQUIRED"},{status:401});
  try{
    const body=JSON.parse(await req.text()); const requestId=String(body.requestId??""); const db=commerceDb();
    const subscription=await db.prepare(`SELECT r.id,r.status,r.charge_id,c.provider_invoice_id,c.provider_payment_intent_id,s.provider_subscription_id FROM subscription_refund_requests r JOIN subscription_charges c ON c.id=r.charge_id JOIN subscriptions s ON s.id=c.subscription_id WHERE r.id=?`).bind(requestId).first<{id:string;status:string;charge_id:string;provider_invoice_id:string;provider_payment_intent_id:string|null;provider_subscription_id:string}>();
    if(subscription){
      if(subscription.status!=="requested") throw new Error("REFUND_REQUEST_NOT_READY");
      const paymentIntentId=subscription.provider_payment_intent_id??await findStripeInvoicePaymentIntent({invoiceId:subscription.provider_invoice_id,secret:env.STRIPE_SECRET_KEY??""});
      if(!subscription.provider_payment_intent_id) await db.prepare(`UPDATE subscription_charges SET provider_payment_intent_id=?,updated_at=? WHERE id=? AND provider_payment_intent_id IS NULL`).bind(paymentIntentId,new Date().toISOString(),subscription.charge_id).run();
      const refund=await createStripeTestRefund({paymentIntentId,secret:env.STRIPE_SECRET_KEY??"",idempotencyKey:`subscription-refund:${subscription.id}`});
      await cancelStripeSubscriptionImmediately({subscriptionId:subscription.provider_subscription_id,secret:env.STRIPE_SECRET_KEY??"",idempotencyKey:`subscription-refund-cancel:${subscription.id}`});
      await db.prepare(`UPDATE subscription_refund_requests SET status='approved',updated_at=? WHERE id=? AND status='requested'`).bind(new Date().toISOString(),subscription.id).run();
      return NextResponse.json({requestId:subscription.id,stripeRefundId:refund.id,status:refund.status,mode:"test",kind:"subscription"});
    }
    const digital=await db.prepare(`SELECT r.id,r.status,r.order_id,o.stripe_payment_intent_id,COALESCE(SUM(e.successful_downloads),0) successful_downloads,SUM(CASE WHEN e.status='refund_pending' THEN 1 ELSE 0 END) frozen_deliveries,COUNT(e.id) delivery_count FROM digital_product_refund_requests r JOIN digital_product_orders o ON o.id=r.order_id LEFT JOIN digital_product_entitlements e ON e.order_id=o.id WHERE r.id=? GROUP BY r.id,r.status,r.order_id,o.stripe_payment_intent_id`).bind(requestId).first<{id:string;status:string;order_id:string;stripe_payment_intent_id:string|null;successful_downloads:number;frozen_deliveries:number;delivery_count:number}>();
    if(digital){
      if(digital.status!=="pending_review"||!digital.stripe_payment_intent_id||Number(digital.successful_downloads)!==0||Number(digital.delivery_count)<=0||Number(digital.frozen_deliveries)!==Number(digital.delivery_count))throw new Error("REFUND_REQUEST_NOT_READY");
      const refund=await createStripeTestRefund({paymentIntentId:digital.stripe_payment_intent_id,secret:env.STRIPE_SECRET_KEY??"",idempotencyKey:`digital-refund:${digital.id}`});
      await db.prepare(`UPDATE digital_product_refund_requests SET status='approved',reviewed_at=?,review_note=? WHERE id=? AND status='pending_review'`).bind(new Date().toISOString(),`Stripe Test refund ${refund.id} submitted`,digital.id).run();
      return NextResponse.json({requestId:digital.id,stripeRefundId:refund.id,status:refund.status,mode:"test",kind:"digital_product"});
    }
    const pack=await db.prepare(`SELECT r.id,r.status,o.stripe_payment_intent_id FROM commercial_refund_requests r JOIN commerce_orders o ON o.id=r.order_id WHERE r.id=?`).bind(requestId).first<{id:string;status:string;stripe_payment_intent_id:string|null}>();
    if(!pack||pack.status!=="pending_review"||!pack.stripe_payment_intent_id) throw new Error("REFUND_REQUEST_NOT_READY");
    const refund=await createStripeTestRefund({paymentIntentId:pack.stripe_payment_intent_id,secret:env.STRIPE_SECRET_KEY??"",idempotencyKey:`refund:${pack.id}`});
    await db.prepare(`UPDATE commercial_refund_requests SET status='approved',reviewed_at=?,review_note=? WHERE id=? AND status='pending_review'`).bind(new Date().toISOString(),`Stripe Test refund ${refund.id} submitted`,pack.id).run();
    return NextResponse.json({requestId:pack.id,stripeRefundId:refund.id,status:refund.status,mode:"test",kind:"pdf_pack"});
  }catch(error){const code=error instanceof Error?error.message:"REFUND_FAILED";return NextResponse.json({error:code},{status:code.includes("NOT_READY")?409:502});}
}
