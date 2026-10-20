import {NextResponse} from "next/server";
import {getCloudflareContext} from "@opennextjs/cloudflare";
import {commercialPolicy,stripePriceId} from "@/lib/commercial/domain";
import {DIGITAL_ACCESS_DAYS,DIGITAL_DOWNLOAD_LIMIT,DIGITAL_PRODUCTS,DIGITAL_REFUND_DAYS} from "@/lib/commercial/products";
import {SUBSCRIPTION_PLANS} from "@/lib/commercial/subscription";
import {activeHalfOffSale,halfOffAmountCents} from "@/lib/commercial/sale";

export async function GET(){
  const env=(await getCloudflareContext({async:true})).env;
  const policy=commercialPolicy(env);
  let pricesReady=policy.enabled;
  if(policy.enabled&&policy.mode==="live"){
    try{
      for(const product of DIGITAL_PRODUCTS)stripePriceId(env.STRIPE_PRICE_MAP,`product:${product.id}`);
      for(const plan of Object.values(SUBSCRIPTION_PLANS))stripePriceId(env.STRIPE_PRICE_MAP,`subscription:${plan.id}`);
    }catch{pricesReady=false;}
  }
  const sale=policy.enabled&&policy.mode==="live"&&policy.checkoutEnabled&&pricesReady?activeHalfOffSale(env):null;
  return NextResponse.json({
    enabled:policy.enabled,
    checkoutEnabled:Boolean(policy.enabled&&policy.checkoutEnabled&&pricesReady),
    mode:policy.enabled?policy.mode:null,
    accessDays:DIGITAL_ACCESS_DAYS,
    successfulDownloadLimit:DIGITAL_DOWNLOAD_LIMIT,
    refundDays:DIGITAL_REFUND_DAYS,
    sale:sale?{percentOff:sale.percentOff,endAt:sale.endAt}:null,
    products:DIGITAL_PRODUCTS.map(product=>({...product,saleAmountCents:sale?halfOffAmountCents(product.amountCents):null})),
    subscriptions:Object.values(SUBSCRIPTION_PLANS).map(plan=>({...plan,saleAmountCents:sale?halfOffAmountCents(plan.amountCents):null})),
  },{headers:{"cache-control":"no-store"}});
}
