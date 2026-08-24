import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { accountOwnerId, requestIdentity } from "@/lib/account/identity";
import { commercialPolicy } from "@/lib/commercial/domain";
import { markSubscriptionCancelAtPeriodEnd, requestSubscriptionRefund, subscriptionSummaryForOwner } from "@/lib/commercial/storage";
import { cancelStripeSubscriptionAtPeriodEnd } from "@/lib/commercial/stripe";

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
  return NextResponse.json(publicSummary(await subscriptionSummaryForOwner(identity.ownerId)),{headers:{"cache-control":"no-store"}});
}

export async function POST(req:NextRequest){
  const identity=await context(); if(!identity) return NextResponse.json({error:"ACCOUNT_REQUIRED"},{status:401});
  try{
    const body=JSON.parse(await req.text()) as Record<string,unknown>; const action=String(body.action??"");
    const summary=await subscriptionSummaryForOwner(identity.ownerId);
    if(action==="cancel"){
      if(!summary.subscription||!["active","trialing"].includes(summary.subscription.status)) return NextResponse.json({error:"ACTIVE_SUBSCRIPTION_REQUIRED"},{status:409});
      if(summary.subscription.cancel_at_period_end) return NextResponse.json({...publicSummary(summary),reused:true});
      const env=getCloudflareContext().env; const policy=commercialPolicy(env); if(!policy.enabled) return NextResponse.json({error:policy.code},{status:503});
      const key=String(body.idempotencyKey??""); if(!key||key.length>80) return NextResponse.json({error:"INVALID_IDEMPOTENCY_KEY"},{status:422});
      const cancelled=await cancelStripeSubscriptionAtPeriodEnd({subscriptionId:summary.subscription.provider_subscription_id,secret:env.STRIPE_SECRET_KEY!,idempotencyKey:`subscription-cancel:${key}`});
      await markSubscriptionCancelAtPeriodEnd(cancelled.id,cancelled.periodEnd);
      return NextResponse.json({...publicSummary(await subscriptionSummaryForOwner(identity.ownerId)),cancelled:true});
    }
    if(action==="request_refund"){
      if(!summary.latestCharge) return NextResponse.json({error:"SUBSCRIPTION_CHARGE_NOT_ELIGIBLE"},{status:409});
      const request=await requestSubscriptionRefund({ownerId:identity.ownerId,chargeId:summary.latestCharge.id,reason:String(body.reason??"Customer requested refund")});
      return NextResponse.json({refundRequest:request},{status:201});
    }
    return NextResponse.json({error:"INVALID_SUBSCRIPTION_ACTION"},{status:422});
  }catch(error){const code=error instanceof Error?error.message:"SUBSCRIPTION_ACTION_FAILED";return NextResponse.json({error:code},{status:code.includes("NOT_ELIGIBLE")||code.includes("WINDOW")||code.includes("CREDIT")||code.includes("ALREADY")?409:502});}
}
