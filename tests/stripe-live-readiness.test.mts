import assert from "node:assert/strict";
import test from "node:test";
import {createHmac} from "node:crypto";
import {readFile} from "node:fs/promises";
import {commercialPolicy,stripeSecretForMode,stripeWebhookSecretForMode,subscriptionCommercePolicy} from "../src/lib/commercial/domain.ts";
import {createStripeDigitalProductCheckout,createStripeSubscriptionCheckout,retrieveStripeDigitalProductCheckout,verifyStripeWebhook} from "../src/lib/commercial/stripe.ts";
import {DIGITAL_PRODUCTS} from "../src/lib/commercial/products.ts";

const exportSecret="x".repeat(32);

test("commerce policy enforces isolated Test/Live key-mode pairing and a separate checkout gate",()=>{
  assert.deepEqual(subscriptionCommercePolicy({COMMERCE_MODE:"test",STRIPE_SECRET_KEY:"sk_test_123",STRIPE_PAID_CHECKOUT_ENABLED:"true"}),{enabled:true,mode:"test",checkoutEnabled:true});
  assert.deepEqual(subscriptionCommercePolicy({COMMERCE_MODE:"live",STRIPE_LIVE_SECRET_KEY:"rk_live_123",STRIPE_PAID_CHECKOUT_ENABLED:"false"}),{enabled:true,mode:"live",checkoutEnabled:false});
  assert.equal(subscriptionCommercePolicy({COMMERCE_MODE:"live",STRIPE_SECRET_KEY:"rk_live_123"}).enabled,false);
  assert.equal(subscriptionCommercePolicy({COMMERCE_MODE:"live",STRIPE_LIVE_SECRET_KEY:"sk_test_123"}).enabled,false);
  assert.equal(subscriptionCommercePolicy({COMMERCE_MODE:"test",STRIPE_TEST_SECRET_KEY:"rk_live_123"}).enabled,false);
  assert.equal(commercialPolicy({COMMERCE_MODE:"live",STRIPE_LIVE_SECRET_KEY:"rk_live_123",STRIPE_PAID_CHECKOUT_ENABLED:"true",EXPORT_SIGNING_SECRET:exportSecret}).enabled,true);
  const isolated={STRIPE_SECRET_KEY:"sk_test_legacy",STRIPE_LIVE_SECRET_KEY:"rk_live_isolated",STRIPE_WEBHOOK_SECRET:"whsec_test",STRIPE_LIVE_WEBHOOK_SECRET:"whsec_live"};
  assert.equal(stripeSecretForMode(isolated,"test"),"sk_test_legacy");assert.equal(stripeSecretForMode(isolated,"live"),"rk_live_isolated");
  assert.equal(stripeWebhookSecretForMode(isolated,"test"),"whsec_test");assert.equal(stripeWebhookSecretForMode(isolated,"live"),"whsec_live");
});

test("Live digital checkout requires and verifies a fixed active matching Price before session creation",async()=>{
  const product=DIGITAL_PRODUCTS[0];
  const calls:Array<{url:string;method:string;body?:URLSearchParams}>=[];
  const original=globalThis.fetch;
  globalThis.fetch=async(input,init)=>{
    const url=String(input);calls.push({url,method:init?.method??"GET",body:init?.body as URLSearchParams|undefined});
    if(url.includes(`/prices/price_live_${product.id}`))return new Response(JSON.stringify({id:`price_live_${product.id}`,active:true,livemode:true,currency:product.currency,unit_amount:product.amountCents,type:"one_time"}),{status:200});
    return new Response(JSON.stringify({id:"cs_live_ready",url:"https://checkout.stripe.com/c/pay/cs_live_ready",livemode:true,amount_total:product.amountCents}),{status:200});
  };
  try{
    const result=await createStripeDigitalProductCheckout({orderId:"ord_live",userId:"user_live",product,successUrl:"https://hskkit.com/checkout/success",cancelUrl:"https://hskkit.com/checkout/cancel",secret:"rk_live_123",priceId:`price_live_${product.id}`});
    assert.equal(result.id,"cs_live_ready");
    assert.equal(calls.length,2);
    const form=calls[1].body!;
    assert.equal(form.get("line_items[0][price]"),`price_live_${product.id}`);
    assert.equal(form.get("line_items[0][price_data][unit_amount]"),null);
  }finally{globalThis.fetch=original;}
});

test("Live digital checkout fails closed on missing or mismatched Price",async()=>{
  const product=DIGITAL_PRODUCTS[0];
  await assert.rejects(()=>createStripeDigitalProductCheckout({orderId:"ord",userId:"user",product,successUrl:"https://hskkit.com/s",cancelUrl:"https://hskkit.com/c",secret:"rk_live_123"}),/STRIPE_LIVE_PRICE_REQUIRED/);
  const original=globalThis.fetch;
  globalThis.fetch=async()=>new Response(JSON.stringify({id:"price_bad",active:true,livemode:true,currency:"usd",unit_amount:1,type:"one_time"}),{status:200});
  try{await assert.rejects(()=>createStripeDigitalProductCheckout({orderId:"ord",userId:"user",product,successUrl:"https://hskkit.com/s",cancelUrl:"https://hskkit.com/c",secret:"rk_live_123",priceId:"price_bad"}),/STRIPE_PRICE_MISMATCH/);}finally{globalThis.fetch=original;}
});

test("an abandoned digital checkout resumes only its verified open Stripe session",async()=>{
  const product=DIGITAL_PRODUCTS[0];const original=globalThis.fetch;let status="open";
  globalThis.fetch=async(input,init)=>{
    assert.equal(String(input),"https://api.stripe.com/v1/checkout/sessions/cs_live_resume");assert.equal(init?.method,"GET");
    return new Response(JSON.stringify({id:"cs_live_resume",livemode:true,mode:"payment",status,url:status==="open"?"https://checkout.stripe.com/c/pay/cs_live_resume":null,client_reference_id:"user_resume",metadata:{order_id:"order_resume",user_id:"user_resume",product_id:product.id},amount_total:product.amountCents,currency:product.currency}),{status:200});
  };
  try{
    const input={sessionId:"cs_live_resume",orderId:"order_resume",userId:"user_resume",product,secret:"rk_live_test"};
    assert.deepEqual(await retrieveStripeDigitalProductCheckout(input),{status:"open",url:"https://checkout.stripe.com/c/pay/cs_live_resume"});
    status="expired";assert.deepEqual(await retrieveStripeDigitalProductCheckout(input),{status:"expired"});
    status="complete";assert.deepEqual(await retrieveStripeDigitalProductCheckout(input),{status:"complete"});
    await assert.rejects(()=>retrieveStripeDigitalProductCheckout({...input,userId:"another_user"}),/STRIPE_CHECKOUT_MISMATCH/);
  }finally{globalThis.fetch=original;}
});

test("Live subscription Checkout uses only the mapped recurring Price",async()=>{
  const original=globalThis.fetch;const calls:Array<{url:string;init?:RequestInit}>=[];
  globalThis.fetch=async(input,init)=>{const url=String(input);calls.push({url,init});if(url.includes("/prices/"))return new Response(JSON.stringify({id:"price_live_month",active:true,livemode:true,type:"recurring",unit_amount:599,currency:"usd",recurring:{interval:"month",interval_count:1}}),{status:200});return new Response(JSON.stringify({id:"cs_live_subscription",url:"https://checkout.stripe.com/live",livemode:true,amount_total:599}),{status:200});};
  try{const result=await createStripeSubscriptionCheckout({orderId:"ord_live",ownerId:"user:u1",userId:"u1",planId:"pro_monthly",priceId:"price_live_month",origin:"https://hskkit.com",secret:"rk_"+"live_123"});assert.equal(result.id,"cs_live_subscription");const form=calls[1].init?.body as URLSearchParams;assert.equal(form.get("line_items[0][price]"),"price_live_month");assert.equal(form.has("line_items[0][price_data][unit_amount]"),false);}finally{globalThis.fetch=original;}
});

test("checkout gate and Live webhook idempotency fail closed in source contracts",async()=>{
  const read=(path:string)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");
  const [checkout,webhook,config,storage,digitalStorage,referralStorage,aiStorage,download,adminRefund,migration,publicCatalog]=await Promise.all([read("src/app/api/v1/commercial/checkout/route.ts"),read("src/app/api/v1/commercial/webhook/route.ts"),read("src/app/api/v1/commercial/config/route.ts"),read("src/lib/commercial/storage.ts"),read("src/lib/commercial/digital-storage.ts"),read("src/lib/commercial/referral-storage.ts"),read("src/lib/ai/storage.ts"),read("src/app/api/v1/commercial/download/[token]/route.ts"),read("src/app/api/v1/commercial/admin/refunds/route.ts"),read("migrations/0034_stripe_live_readiness.sql"),read("src/lib/commercial/public-catalog.ts")]);
  assert.match(checkout,/PAID_CHECKOUT_DISABLED/);assert.match(checkout,/stripePriceId\(env\.STRIPE_PRICE_MAP/);
  assert.match(webhook,/activeStripeWebhookSecret\(env\)/);assert.match(webhook,/verifyStripeWebhook\(raw,[\s\S]*Date\.now\(\),mode\)/);assert.match(webhook,/rewardFirstPaidReferral\(normalized\.subscriptionId,livemode\)/);assert.match(storage,/live_payment_events/);
  assert.match(config,/publicCommerceConfig\(env\)/);assert.match(publicCatalog,/accessDays: DIGITAL_ACCESS_DAYS/);assert.match(publicCatalog,/successfulDownloadLimit: DIGITAL_DOWNLOAD_LIMIT/);assert.match(publicCatalog,/DIGITAL_PRODUCTS\.map/);
  assert.match(storage,/subscription_entitlements WHERE owner_id=\? AND stripe_livemode=\?/);assert.match(digitalStorage,/product_id=\? AND stripe_livemode=\?/);
  assert.match(referralStorage,/subscription_entitlements WHERE owner_id=\? AND stripe_livemode=\?/);assert.match(referralStorage,/provider_subscription_id=\? AND stripe_livemode=\?/);assert.match(referralStorage,/c\.stripe_livemode=\?/);assert.match(aiStorage,/e\.stripe_livemode=\?/);assert.match(download,/product_entitlement_livemode/);
  assert.match(adminRefund,/refund\.status!=="succeeded"/);assert.match(adminRefund,/status:202/);
  assert.match(migration,/ALTER TABLE digital_product_orders ADD COLUMN stripe_livemode/);assert.doesNotMatch(migration,/DROP TABLE digital_product_orders/);assert.match(migration,/PRIMARY KEY\(owner_id,stripe_livemode\)/);assert.match(migration,/CREATE TABLE IF NOT EXISTS live_payment_events/);
});

test("webhook verifier accepts only the configured Stripe mode",async()=>{
  const secret="whsec_mode_test";const timestamp=Math.floor(Date.now()/1000);
  const liveRaw=JSON.stringify({id:"evt_live",type:"checkout.session.completed",livemode:true,data:{object:{}}});
  const signature=createHmac("sha256",secret).update(`${timestamp}.${liveRaw}`).digest("hex");
  assert.equal((await verifyStripeWebhook(liveRaw,`t=${timestamp},v1=${signature}`,secret,Date.now(),"live")).livemode,true);
  await assert.rejects(()=>verifyStripeWebhook(liveRaw,`t=${timestamp},v1=${signature}`,secret,Date.now(),"test"),/STRIPE_EVENT_MODE_MISMATCH/);
});
