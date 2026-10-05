import {PDF_PACK_CURRENCY,PDF_PACK_PRICE_CENTS,PDF_PACK_SKU,stripeModeFromSecret,type StripeMode} from "./domain.ts";
import type {DigitalProduct} from "./products.ts";
import {buildSubscriptionCheckoutForm,subscriptionPlan,type SubscriptionPlanId} from "./subscription.ts";

const STRIPE_VERSION="2024-06-20";

type StripeObject=Record<string,unknown>;

function requireStripeMode(secret:string):StripeMode{
  const mode=stripeModeFromSecret(secret);
  if(!mode)throw new Error("STRIPE_KEY_REQUIRED");
  return mode;
}

function assertObjectMode(value:StripeObject,mode:StripeMode){
  if(typeof value.livemode==="boolean"&&value.livemode!==(mode==="live"))throw new Error("STRIPE_RESPONSE_MODE_MISMATCH");
}

async function stripeRequest(path:string,secret:string,options:{method?:"GET"|"POST"|"DELETE";form?:URLSearchParams;idempotencyKey?:string}={}){
  const mode=requireStripeMode(secret);const method=options.method??"POST";
  const response=await fetch(`https://api.stripe.com/v1/${path}`,{
    method,
    headers:{authorization:`Bearer ${secret}`,"Stripe-Version":STRIPE_VERSION,...(options.form?{"content-type":"application/x-www-form-urlencoded"}:{}),...(options.idempotencyKey?{"idempotency-key":options.idempotencyKey}:{})},
    body:options.form,
  });
  const value=await response.json() as StripeObject;
  if(!response.ok)throw new Error(`STRIPE_API_ERROR:${String((value.error as Record<string,unknown>|undefined)?.code??response.status)}`);
  assertObjectMode(value,mode);
  return {value,mode};
}

async function verifyFixedPrice(input:{priceId:string;secret:string;amountCents:number;currency:string;recurring?:{interval:"month"|"year";intervalCount:number}}){
  if(!input.priceId.startsWith("price_"))throw new Error("STRIPE_LIVE_PRICE_REQUIRED");
  const {value,mode}=await stripeRequest(`prices/${encodeURIComponent(input.priceId)}`,input.secret,{method:"GET"});
  const recurring=value.recurring as Record<string,unknown>|null|undefined;
  const recurringMatches=input.recurring
    ? value.type==="recurring"&&recurring?.interval===input.recurring.interval&&Number(recurring?.interval_count)===input.recurring.intervalCount
    : value.type==="one_time"&&!recurring;
  if(value.id!==input.priceId||value.active!==true||value.currency!==input.currency||Number(value.unit_amount)!==input.amountCents||!recurringMatches)throw new Error("STRIPE_PRICE_MISMATCH");
  return {mode,productId:typeof value.product==="string"?value.product:undefined};
}

export async function createStripeTestCheckout(input:{orderId:string;userId:string;selectedLevel:number;successUrl:string;cancelUrl:string;secret:string}){
  if(requireStripeMode(input.secret)!=="test")throw new Error("STRIPE_LIVE_PRICE_REQUIRED");
  const form=new URLSearchParams({
    mode:"payment",success_url:input.successUrl,cancel_url:input.cancelUrl,client_reference_id:input.userId,
    "line_items[0][quantity]":"1","line_items[0][price_data][currency]":PDF_PACK_CURRENCY,
    "line_items[0][price_data][unit_amount]":String(PDF_PACK_PRICE_CENTS),
    "line_items[0][price_data][product_data][name]":"HSKKit Advanced Study PDF Pack",
    "line_items[0][price_data][product_data][description]":"One-time purchase. Up to 3 successful downloads during a 14-day access window.",
    "metadata[order_id]":input.orderId,"metadata[user_id]":input.userId,"metadata[sku]":PDF_PACK_SKU,"metadata[selected_level]":String(input.selectedLevel),
    "payment_intent_data[metadata][order_id]":input.orderId,"payment_intent_data[metadata][user_id]":input.userId,
  });
  const {value}=await stripeRequest("checkout/sessions",input.secret,{form,idempotencyKey:`checkout:${input.orderId}`});
  if(typeof value.id!=="string"||typeof value.url!=="string"||!value.id.startsWith("cs_test_"))throw new Error("STRIPE_CHECKOUT_INVALID");
  return {id:value.id,url:value.url};
}

export async function createStripeDigitalProductCheckout(input:{orderId:string;userId:string;product:DigitalProduct;successUrl:string;cancelUrl:string;secret:string;priceId?:string}){
  const mode=requireStripeMode(input.secret);
  if(mode==="live"&&!input.priceId)throw new Error("STRIPE_LIVE_PRICE_REQUIRED");
  if(input.priceId)await verifyFixedPrice({priceId:input.priceId,secret:input.secret,amountCents:input.product.amountCents,currency:input.product.currency});
  const form=new URLSearchParams({
    mode:"payment",success_url:input.successUrl,cancel_url:input.cancelUrl,client_reference_id:input.userId,
    "line_items[0][quantity]":"1",
    "metadata[order_id]":input.orderId,"metadata[user_id]":input.userId,"metadata[product_id]":input.product.id,
    "payment_intent_data[metadata][order_id]":input.orderId,"payment_intent_data[metadata][user_id]":input.userId,"payment_intent_data[metadata][product_id]":input.product.id,
  });
  if(input.priceId)form.set("line_items[0][price]",input.priceId);else{
    form.set("line_items[0][price_data][currency]",input.product.currency);
    form.set("line_items[0][price_data][unit_amount]",String(input.product.amountCents));
    form.set("line_items[0][price_data][product_data][name]",input.product.name);
    form.set("line_items[0][price_data][product_data][description]","One-time purchase. Three successful downloads per delivery during a 14-day access window.");
  }
  const {value}=await stripeRequest("checkout/sessions",input.secret,{form,idempotencyKey:`digital-checkout:${input.orderId}`});
  const prefix=mode==="live"?"cs_live_":"cs_test_";
  if(typeof value.id!=="string"||typeof value.url!=="string"||!value.id.startsWith(prefix))throw new Error("STRIPE_CHECKOUT_INVALID");
  return {id:value.id,url:value.url};
}

export async function retrieveStripeDigitalProductCheckout(input:{sessionId:string;orderId:string;userId:string;product:DigitalProduct;secret:string}){
  const {value,mode}=await stripeRequest(`checkout/sessions/${encodeURIComponent(input.sessionId)}`,input.secret,{method:"GET"});
  const metadata=value.metadata as Record<string,unknown>|undefined;
  if(value.id!==input.sessionId||value.mode!=="payment"||value.client_reference_id!==input.userId||metadata?.order_id!==input.orderId||metadata?.user_id!==input.userId||metadata?.product_id!==input.product.id||Number(value.amount_total)!==input.product.amountCents||value.currency!==input.product.currency)throw new Error("STRIPE_CHECKOUT_MISMATCH");
  const prefix=mode==="live"?"cs_live_":"cs_test_";
  if(!input.sessionId.startsWith(prefix))throw new Error("STRIPE_RESPONSE_MODE_MISMATCH");
  if(value.status==="open"&&typeof value.url==="string"&&value.url.startsWith("https://checkout.stripe.com/"))return {status:"open" as const,url:value.url};
  if(value.status==="expired")return {status:"expired" as const};
  if(value.status==="complete")return {status:"complete" as const};
  throw new Error("STRIPE_CHECKOUT_INVALID");
}

export async function createStripeSubscriptionCheckout(input:{orderId:string;ownerId:string;userId:string;planId:SubscriptionPlanId;origin:string;secret:string;priceId?:string}){
  const mode=requireStripeMode(input.secret);const plan=subscriptionPlan(input.planId);if(!plan)throw new Error("INVALID_PLAN");
  if(mode==="live"&&!input.priceId)throw new Error("STRIPE_LIVE_PRICE_REQUIRED");
  if(input.priceId)await verifyFixedPrice({priceId:input.priceId,secret:input.secret,amountCents:plan.amountCents,currency:plan.currency,recurring:{interval:plan.interval,intervalCount:plan.intervalCount}});
  const form=buildSubscriptionCheckoutForm({planId:input.planId,priceId:input.priceId,ownerId:input.ownerId,userId:input.userId,orderId:input.orderId,origin:input.origin});
  const {value}=await stripeRequest("checkout/sessions",input.secret,{form,idempotencyKey:`subscription-checkout:${input.orderId}`});
  const prefix=mode==="live"?"cs_live_":"cs_test_";
  if(typeof value.id!=="string"||typeof value.url!=="string"||!value.id.startsWith(prefix))throw new Error("STRIPE_SUBSCRIPTION_CHECKOUT_INVALID");
  return {id:value.id,url:value.url};
}

export async function createStripeYearlyUpgradePortal(input:{subscriptionId:string;customerId:string;monthlyPriceId:string;yearlyPriceId:string;returnUrl:string;secret:string;idempotencyKey:string}){
  const [monthly,yearly]=await Promise.all([
    verifyFixedPrice({priceId:input.monthlyPriceId,secret:input.secret,amountCents:599,currency:"usd",recurring:{interval:"month",intervalCount:1}}),
    verifyFixedPrice({priceId:input.yearlyPriceId,secret:input.secret,amountCents:4900,currency:"usd",recurring:{interval:"year",intervalCount:1}}),
  ]);
  if(!monthly.productId||monthly.productId!==yearly.productId)throw new Error("STRIPE_SUBSCRIPTION_PRODUCT_MISMATCH");
  const {value:subscription}=await stripeRequest(`subscriptions/${encodeURIComponent(input.subscriptionId)}`,input.secret,{method:"GET"});
  const items=subscription.items as {data?:Array<Record<string,unknown>>}|undefined;
  const item=items?.data?.[0];const price=item?.price as Record<string,unknown>|undefined;
  if(subscription.id!==input.subscriptionId||subscription.customer!==input.customerId||!["active","trialing"].includes(String(subscription.status))||subscription.cancel_at_period_end===true||items?.data?.length!==1||typeof item?.id!=="string"||price?.id!==input.monthlyPriceId)throw new Error("MONTHLY_SUBSCRIPTION_REQUIRED");
  const marker=`${input.monthlyPriceId}:${input.yearlyPriceId}`;
  const {value:list}=await stripeRequest("billing_portal/configurations?active=true&limit=100",input.secret,{method:"GET"});
  const configurations=Array.isArray(list.data)?list.data as Array<Record<string,unknown>>:[];
  let configuration=configurations.find(entry=>{
    const metadata=entry.metadata as Record<string,unknown>|undefined;
    return entry.active===true&&metadata?.hskkit_yearly_upgrade===marker;
  });
  if(!configuration){
    const form=new URLSearchParams();
    form.set("features[payment_method_update][enabled]","true");
    form.set("features[subscription_cancel][enabled]","true");
    form.set("features[subscription_cancel][mode]","at_period_end");
    form.set("features[subscription_update][enabled]","true");
    form.append("features[subscription_update][default_allowed_updates][]","price");
    form.set("features[subscription_update][proration_behavior]","always_invoice");
    form.set("features[subscription_update][products][0][product]",monthly.productId);
    form.append("features[subscription_update][products][0][prices][]",input.monthlyPriceId);
    form.append("features[subscription_update][products][0][prices][]",input.yearlyPriceId);
    form.set("metadata[hskkit_yearly_upgrade]",marker);
    const created=await stripeRequest("billing_portal/configurations",input.secret,{form,idempotencyKey:`hskkit-yearly-upgrade-config:${input.monthlyPriceId}:${input.yearlyPriceId}`});
    configuration=created.value;
  }
  if(typeof configuration.id!=="string")throw new Error("STRIPE_PORTAL_CONFIGURATION_INVALID");
  const form=new URLSearchParams({customer:input.customerId,configuration:configuration.id,return_url:input.returnUrl,"flow_data[type]":"subscription_update_confirm","flow_data[subscription_update_confirm][subscription]":input.subscriptionId,"flow_data[subscription_update_confirm][items][0][id]":String(item.id),"flow_data[subscription_update_confirm][items][0][price]":input.yearlyPriceId,"flow_data[subscription_update_confirm][items][0][quantity]":String(Number(item.quantity??1)),"flow_data[after_completion][type]":"redirect","flow_data[after_completion][redirect][return_url]":input.returnUrl});
  const {value}=await stripeRequest("billing_portal/sessions",input.secret,{form,idempotencyKey:`hskkit-yearly-upgrade:${input.idempotencyKey}`});
  if(typeof value.id!=="string"||typeof value.url!=="string")throw new Error("STRIPE_PORTAL_SESSION_INVALID");
  return {id:value.id,url:value.url};
}

export async function cancelStripeSubscriptionAtPeriodEnd(input:{subscriptionId:string;secret:string;idempotencyKey:string}){
  const {value}=await stripeRequest(`subscriptions/${encodeURIComponent(input.subscriptionId)}`,input.secret,{form:new URLSearchParams({cancel_at_period_end:"true"}),idempotencyKey:input.idempotencyKey});
  if(typeof value.id!=="string"||value.cancel_at_period_end!==true)throw new Error("STRIPE_SUBSCRIPTION_CANCEL_INVALID");
  const periodEnd=typeof value.current_period_end==="number"?new Date(value.current_period_end*1000).toISOString():undefined;
  return {id:value.id,status:String(value.status??"active"),cancelAtPeriodEnd:true,periodEnd};
}

export async function cancelStripeSubscriptionImmediately(input:{subscriptionId:string;secret:string;idempotencyKey:string}){
  const {value}=await stripeRequest(`subscriptions/${encodeURIComponent(input.subscriptionId)}`,input.secret,{method:"DELETE",idempotencyKey:input.idempotencyKey});
  if(typeof value.id!=="string"||value.status!=="canceled")throw new Error("STRIPE_SUBSCRIPTION_CANCEL_INVALID");
  return {id:value.id,status:"canceled" as const};
}

export async function findStripeInvoicePaymentIntent(input:{invoiceId:string;secret:string}){
  const {value}=await stripeRequest(`invoice_payments?invoice=${encodeURIComponent(input.invoiceId)}&limit=10`,input.secret,{method:"GET"});
  const data=value.data as Array<{status?:string;payment?:{type?:string;payment_intent?:string}}>|undefined;
  const payment=data?.find(item=>item.status==="paid"&&item.payment?.type==="payment_intent"&&item.payment.payment_intent);
  if(!payment?.payment?.payment_intent)throw new Error("STRIPE_PAYMENT_INTENT_NOT_FOUND");
  return payment.payment.payment_intent;
}

export async function createStripeRefund(input:{paymentIntentId:string;secret:string;idempotencyKey:string}){
  const {value}=await stripeRequest("refunds",input.secret,{form:new URLSearchParams({payment_intent:input.paymentIntentId,reason:"requested_by_customer","metadata[hskkit_refund_request]":input.idempotencyKey}),idempotencyKey:input.idempotencyKey});
  if(typeof value.id!=="string")throw new Error("STRIPE_REFUND_INVALID");
  return {id:value.id,status:String(value.status??"pending")};
}
export const createStripeTestRefund=createStripeRefund;

const encoder=new TextEncoder();
const hexBytes=(hex:string)=>hex.length%2?new Uint8Array():Uint8Array.from(hex.match(/.{2}/g)??[],pair=>Number.parseInt(pair,16));
export async function verifyStripeWebhook(rawBody:string,signatureHeader:string|null,secret:string,now=Date.now(),expectedMode:StripeMode="test"){
  if(!signatureHeader||!secret.startsWith("whsec_"))throw new Error("STRIPE_WEBHOOK_NOT_CONFIGURED");
  const fields=signatureHeader.split(",").map(part=>part.trim().split("=",2));
  const timestamp=fields.find(([key])=>key==="t")?.[1];const signatures=fields.filter(([key])=>key==="v1").map(([,value])=>value);
  if(!timestamp||!signatures.length||Math.abs(Math.floor(now/1000)-Number(timestamp))>300)throw new Error("STRIPE_SIGNATURE_EXPIRED");
  const key=await crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const expected=new Uint8Array(await crypto.subtle.sign("HMAC",key,encoder.encode(`${timestamp}.${rawBody}`)));
  const valid=signatures.some(hex=>{const supplied=hexBytes(hex);if(supplied.length!==expected.length)return false;let diff=0;for(let i=0;i<expected.length;i++)diff|=expected[i]^supplied[i];return diff===0;});
  if(!valid)throw new Error("STRIPE_SIGNATURE_INVALID");
  const event=JSON.parse(rawBody) as {id:string;type:string;livemode:boolean;data:{object:Record<string,unknown>}};
  if(!event.id||!event.type||typeof event.livemode!=="boolean")throw new Error("STRIPE_EVENT_INVALID");
  if(event.livemode!==(expectedMode==="live"))throw new Error("STRIPE_EVENT_MODE_MISMATCH");
  return event;
}
