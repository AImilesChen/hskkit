import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { accountOwnerId, requestIdentity } from "@/lib/account/identity";
import { stripeModeFromSecret,stripePriceId,stripeSecretForMode,subscriptionCommercePolicy } from "@/lib/commercial/domain";
import { markSubscriptionCancelAtPeriodEnd, requestSubscriptionRefund, resolveCapabilities, subscriptionSummaryForOwner } from "@/lib/commercial/storage";
import { cancelStripeSubscriptionAtPeriodEnd,createStripeYearlyUpgradePortal } from "@/lib/commercial/stripe";

async function context(){
  const identity=await requestIdentity();
  if(!identity.account||identity.account.status!=="active") return null;
  return {account:identity.account,ownerId:accountOwnerId(identity.account.userId)};
}
const publicSummary=(value:Awaited<ReturnType<typeof subscriptionSummaryForOwner>>)=>({
  order:value.latestOrder?{id:value.latestOrder.id,planId:value.latestOrder.plan_id,amountCents:value.latestOrder.amount_cents,currency:value.latestOrder.currency,status:value.latestOrder.status,createdAt:value.latestOrder.created_at}:null,
  subscription:value.subscription?{planId:value.subscription.plan_id,status:value.subscription.status,cancelAtPeriodEnd:Boolean(value.subscription.cancel_at_period_end),currentPeriodStart:value.subscription.current_period_start,currentPeriodEnd:value.subscription.current_period_end}:null,
  entitlement:value.entitlement?{planId:value.entitlement.plan_id,status:value.entitlement.status,startsAt:value.entitlement.starts_at,endsAt:value.entitlement.ends_at}:null,
  latestCharge:value.latestCharge?{id:value.latestCharge.id,amountCents:value.latestCharge.amount_cents,amountRefundedCents:value.latestCharge.amount_refunded_cents,currency:value.latestCharge.currency,status:value.latestCharge.status,chargedAt:value.latestCharge.charged_at}:null,
});

export async function GET(){
  const identity=await context(); if(!identity) return NextResponse.json({error:"ACCOUNT_REQUIRED"},{status:401});
  const livemode=getCloudflareContext().env.COMMERCE_MODE==="live";
  const [summary,capabilities]=await Promise.all([subscriptionSummaryForOwner(identity.ownerId,livemode),resolveCapabilities(identity.ownerId)]);
  return NextResponse.json({...publicSummary(summary),capabilities},{headers:{"cache-control":"no-store"}});
}

export async function POST(req:NextRequest){
  const identity=await context(); if(!identity) return NextResponse.json({error:"ACCOUNT_REQUIRED"},{status:401});
  try{
    const body=JSON.parse(await req.text()) as Record<string,unknown>; const action=String(body.action??"");
    const livemode=getCloudflareContext().env.COMMERCE_MODE==="live";
    const summary=await subscriptionSummaryForOwner(identity.ownerId,livemode);
    if(action==="switch_to_yearly"){
      if(!summary.subscription||summary.subscription.plan_id!=="pro_monthly"||!["active","trialing"].includes(summary.subscription.status)||summary.subscription.cancel_at_period_end) return NextResponse.json({error:"MONTHLY_SUBSCRIPTION_REQUIRED"},{status:409});
      const key=String(body.idempotencyKey??""); if(!key||key.length>80) return NextResponse.json({error:"INVALID_IDEMPOTENCY_KEY"},{status:422});
      const env=getCloudflareContext().env;const policy=subscriptionCommercePolicy(env);if(!policy.enabled)return NextResponse.json({error:policy.code},{status:503});
      const stripeMode=Number(summary.subscription.stripe_livemode)===1?"live":"test";if(stripeMode!=="live")return NextResponse.json({error:"LIVE_SUBSCRIPTION_REQUIRED"},{status:409});
      const stripeSecret=stripeSecretForMode(env,stripeMode);if(stripeModeFromSecret(stripeSecret)!==stripeMode)return NextResponse.json({error:"STRIPE_MODE_MISMATCH"},{status:503});
      const portal=await createStripeYearlyUpgradePortal({subscriptionId:summary.subscription.provider_subscription_id,customerId:summary.subscription.provider_customer_id,monthlyPriceId:stripePriceId(env.STRIPE_PRICE_MAP,"subscription:pro_monthly"),yearlyPriceId:stripePriceId(env.STRIPE_PRICE_MAP,"subscription:pro_yearly"),returnUrl:`${req.nextUrl.origin}/pricing?plan=updated`,secret:stripeSecret!,idempotencyKey:key});
      return NextResponse.json({portalUrl:portal.url});
    }
    if(action==="cancel"){
      if(!summary.subscription||!["active","trialing"].includes(summary.subscription.status)) return NextResponse.json({error:"ACTIVE_SUBSCRIPTION_REQUIRED"},{status:409});
      if(summary.subscription.cancel_at_period_end) return NextResponse.json({...publicSummary(summary),reused:true});
      const env=getCloudflareContext().env; const policy=subscriptionCommercePolicy(env); if(!policy.enabled) return NextResponse.json({error:policy.code},{status:503});
      const key=String(body.idempotencyKey??""); if(!key||key.length>80) return NextResponse.json({error:"INVALID_IDEMPOTENCY_KEY"},{status:422});
      const stripeMode=Number(summary.subscription.stripe_livemode)===1?"live":"test";const stripeSecret=stripeSecretForMode(env,stripeMode);if(stripeModeFromSecret(stripeSecret)!==stripeMode)return NextResponse.json({error:"STRIPE_MODE_MISMATCH"},{status:503});
      const cancelled=await cancelStripeSubscriptionAtPeriodEnd({subscriptionId:summary.subscription.provider_subscription_id,secret:stripeSecret!,idempotencyKey:`subscription-cancel:${key}`});
      await markSubscriptionCancelAtPeriodEnd(cancelled.id,cancelled.periodEnd);
      return NextResponse.json({...publicSummary(await subscriptionSummaryForOwner(identity.ownerId,livemode)),cancelled:true});
    }
    if(action==="request_refund"){
      if(!summary.latestCharge) return NextResponse.json({error:"SUBSCRIPTION_CHARGE_NOT_ELIGIBLE"},{status:409});
      const request=await requestSubscriptionRefund({ownerId:identity.ownerId,chargeId:summary.latestCharge.id,reason:String(body.reason??"Customer requested refund")});
      return NextResponse.json({refundRequest:request},{status:201});
    }
    return NextResponse.json({error:"INVALID_SUBSCRIPTION_ACTION"},{status:422});
  }catch(error){const code=error instanceof Error?error.message:"SUBSCRIPTION_ACTION_FAILED";return NextResponse.json({error:code},{status:code.includes("NOT_ELIGIBLE")||code.includes("WINDOW")||code.includes("CREDIT")||code.includes("ALREADY")?409:502});}
}
