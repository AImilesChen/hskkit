import assert from "node:assert/strict";
import test from "node:test";
import {activeHalfOffSale,halfOffAmountCents,validOrderAmount} from "../src/lib/commercial/sale.ts";
import {createStripeDigitalProductCheckout,createStripeSubscriptionCheckout} from "../src/lib/commercial/stripe.ts";
import {DIGITAL_PRODUCTS} from "../src/lib/commercial/products.ts";

test("a configured sale is active for exactly fourteen days and rounds odd cents",()=>{
  const env={STRIPE_HALF_OFF_COUPON_ID:"coupon_sale",STRIPE_HALF_OFF_START_AT:"2026-10-20T12:00:00.000Z",STRIPE_HALF_OFF_END_AT:"2026-11-03T12:00:00.000Z"};
  assert.equal(activeHalfOffSale(env,new Date("2026-10-20T11:59:59.999Z")),null);
  assert.equal(activeHalfOffSale(env,new Date("2026-10-20T12:00:00.000Z"))?.couponId,"coupon_sale");
  assert.equal(activeHalfOffSale(env,new Date("2026-11-03T12:00:00.000Z")),null);
  assert.equal(activeHalfOffSale({...env,STRIPE_HALF_OFF_END_AT:"2026-11-04T12:00:00.000Z"},new Date("2026-10-21T12:00:00.000Z")),null);
  assert.equal(halfOffAmountCents(399),200);
  assert.equal(validOrderAmount(399,200),true);
  assert.equal(validOrderAmount(399,199),true);
  assert.equal(validOrderAmount(399,198),false);
});

test("one-time purchase applies a verified single-use coupon and rejects a wrong Stripe total",async()=>{
  const product=DIGITAL_PRODUCTS[0];
  const original=globalThis.fetch;
  const calls:string[]=[];
  let total=halfOffAmountCents(product.amountCents);
  globalThis.fetch=async(input,init)=>{
    const url=String(input);calls.push(url);
    if(url.includes("/prices/"))return new Response(JSON.stringify({id:"price_sale",active:true,livemode:true,currency:"usd",unit_amount:product.amountCents,type:"one_time"}),{status:200});
    if(url.includes("/coupons/"))return new Response(JSON.stringify({id:"coupon_sale",valid:true,percent_off:50,duration:"once",amount_off:null,livemode:true}),{status:200});
    const form=init?.body as URLSearchParams;
    assert.equal(form.get("discounts[0][coupon]"),"coupon_sale");
    return new Response(JSON.stringify({id:"cs_live_sale",url:"https://checkout.stripe.com/c/pay/cs_live_sale",livemode:true,amount_total:total}),{status:200});
  };
  const input={orderId:"order_sale",userId:"user_sale",product,successUrl:"https://hskkit.com/checkout/success",cancelUrl:"https://hskkit.com/checkout/cancel",secret:"rk_live_placeholder",priceId:"price_sale",amountCents:total,couponId:"coupon_sale"};
  try{
    assert.equal((await createStripeDigitalProductCheckout(input)).id,"cs_live_sale");
    assert.equal(calls.length,3);
    total=Math.floor(product.amountCents/2);
    assert.equal((await createStripeDigitalProductCheckout(input)).amountCents,total);
    total=1;
    await assert.rejects(()=>createStripeDigitalProductCheckout(input),/STRIPE_CHECKOUT_INVALID/);
  }finally{globalThis.fetch=original;}
});

test("subscription coupon is once-only and the Stripe first-payment amount is checked",async()=>{
  const original=globalThis.fetch;
  const forms:URLSearchParams[]=[];
  globalThis.fetch=async(input,init)=>{
    const url=String(input);
    if(url.includes("/prices/"))return new Response(JSON.stringify({id:"price_month",active:true,livemode:true,currency:"usd",unit_amount:599,type:"recurring",recurring:{interval:"month",interval_count:1}}),{status:200});
    if(url.includes("/coupons/"))return new Response(JSON.stringify({id:"coupon_sale",valid:true,percent_off:50,duration:"once",amount_off:null,livemode:true}),{status:200});
    forms.push(init?.body as URLSearchParams);
    return new Response(JSON.stringify({id:"cs_live_month",url:"https://checkout.stripe.com/c/pay/cs_live_month",livemode:true,amount_total:299}),{status:200});
  };
  try{
    assert.equal((await createStripeSubscriptionCheckout({orderId:"order_month",ownerId:"user:u1",userId:"u1",planId:"pro_monthly",origin:"https://hskkit.com",secret:"rk_live_placeholder",priceId:"price_month",amountCents:300,couponId:"coupon_sale"})).amountCents,299);
    assert.equal(forms[0].get("discounts[0][coupon]"),"coupon_sale");
    assert.equal(forms[0].get("line_items[0][price]"),"price_month");
  }finally{globalThis.fetch=original;}
});
