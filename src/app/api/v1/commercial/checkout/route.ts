import {getCloudflareContext} from "@opennextjs/cloudflare";
import {NextRequest,NextResponse} from "next/server";
import {accountOwnerId,requestIdentity} from "@/lib/account/identity";
import {activeStripeSecret,commercialPolicy,stripePriceId,subscriptionCommercePolicy} from "@/lib/commercial/domain";
import {attachDigitalCheckoutSession,createDigitalProductOrder,markDigitalOrderFailed} from "@/lib/commercial/digital-storage";
import {digitalProduct} from "@/lib/commercial/products";
import {subscriptionPlan} from "@/lib/commercial/subscription";
import {attachSubscriptionCheckout,createSubscriptionOrder,markSubscriptionOrderFailed,openSubscriptionCheckout,subscriptionSummaryForOwner} from "@/lib/commercial/storage";
import {createStripeDigitalProductCheckout,createStripeSubscriptionCheckout,retrieveStripeDigitalProductCheckout} from "@/lib/commercial/stripe";

export async function POST(req:NextRequest){
  const identity=await requestIdentity();
  if(!identity.account||identity.account.status!=="active")return NextResponse.json({error:"ACCOUNT_REQUIRED"},{status:401});
  const env=getCloudflareContext().env;const stripeSecret=activeStripeSecret(env);
  try{
    const body=JSON.parse(await req.text()) as Record<string,unknown>;
    const idempotencyKey=String(body.idempotencyKey??"");
    if(!idempotencyKey||idempotencyKey.length>80)throw new Error("INVALID_IDEMPOTENCY_KEY");
    const plan=subscriptionPlan(body.planRef);
    if(plan){
      const policy=subscriptionCommercePolicy(env);
      if(!policy.enabled)return NextResponse.json({error:policy.code},{status:503});
      if(!policy.checkoutEnabled)return NextResponse.json({error:"PAID_CHECKOUT_DISABLED"},{status:503});
      const livemode=policy.mode==="live";const ownerId=accountOwnerId(identity.account.userId);const current=await subscriptionSummaryForOwner(ownerId,livemode);
      if(current.entitlement?.status==="active"&&(!current.entitlement.ends_at||String(current.entitlement.ends_at)>new Date().toISOString()))return NextResponse.json({error:"SUBSCRIPTION_ALREADY_ACTIVE"},{status:409});
      const open=await openSubscriptionCheckout(ownerId,plan.id,livemode);
      if(open?.provider_checkout_url)return NextResponse.json({orderId:open.id,checkoutUrl:open.provider_checkout_url,planId:open.plan_id,mode:policy.mode,reused:true});
      const order=await createSubscriptionOrder({ownerId,userId:identity.account.userId,planId:plan.id,idempotencyKey,livemode});
      if(order.status==="completed")return NextResponse.json({orderId:order.id,status:order.status,reused:true});
      try{
        const priceId=livemode?stripePriceId(env.STRIPE_PRICE_MAP,`subscription:${plan.id}`):env.STRIPE_TEST_PRO_PRICE_ID;
        const checkout=await createStripeSubscriptionCheckout({orderId:order.id,ownerId,userId:identity.account.userId,planId:plan.id,origin:req.nextUrl.origin,secret:stripeSecret!,priceId});
        await attachSubscriptionCheckout(order.id,checkout.id,checkout.url);
        return NextResponse.json({orderId:order.id,checkoutUrl:checkout.url,planId:plan.id,mode:policy.mode},{status:201});
      }catch(error){await markSubscriptionOrderFailed(order.id);throw error;}
    }
    const policy=commercialPolicy(env);
    if(!policy.enabled)return NextResponse.json({error:policy.code},{status:503});
    if(!policy.checkoutEnabled)return NextResponse.json({error:"PAID_CHECKOUT_DISABLED"},{status:503});
    const requested=body.productId??(Number.isInteger(Number(body.level))?`level-${Number(body.level)}`:"");const product=digitalProduct(requested);
    if(!product)throw new Error("INVALID_PRODUCT");
    const livemode=policy.mode==="live";
    let order=await createDigitalProductOrder(identity.account.userId,product.id,idempotencyKey,undefined,livemode);
    if(order.status!=="pending")return NextResponse.json({orderId:order.id,status:order.status,reused:true});
    if(order.stripe_checkout_session_id){
      const session=await retrieveStripeDigitalProductCheckout({sessionId:order.stripe_checkout_session_id,orderId:order.id,userId:identity.account.userId,product,secret:stripeSecret!});
      if(session.status==="open")return NextResponse.json({orderId:order.id,checkoutUrl:session.url,productId:product.id,mode:policy.mode,reused:true});
      if(session.status==="complete")return NextResponse.json({error:"CHECKOUT_PAYMENT_PROCESSING"},{status:409});
      await markDigitalOrderFailed(order.id);
      order=await createDigitalProductOrder(identity.account.userId,product.id,crypto.randomUUID(),undefined,livemode);
    }
    const priceId=livemode?stripePriceId(env.STRIPE_PRICE_MAP,`product:${product.id}`):undefined;
    const checkout=await createStripeDigitalProductCheckout({orderId:order.id,userId:identity.account.userId,product,successUrl:`${req.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,cancelUrl:`${req.nextUrl.origin}/checkout/cancel`,secret:stripeSecret!,priceId});
    await attachDigitalCheckoutSession(order.id,checkout.id);
    return NextResponse.json({orderId:order.id,checkoutUrl:checkout.url,productId:product.id,mode:policy.mode},{status:201});
  }catch(error){const code=error instanceof Error?error.message:"CHECKOUT_FAILED";const status=code==="IDEMPOTENCY_CONFLICT"||code==="PRODUCT_ALREADY_ACTIVE"||code==="PRODUCT_CHECKOUT_PENDING"?409:code.startsWith("INVALID")?422:502;return NextResponse.json({error:code},{status});}
}
