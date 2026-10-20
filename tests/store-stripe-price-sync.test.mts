import assert from "node:assert/strict";
import test from "node:test";
import {DIGITAL_PRODUCTS} from "../src/lib/commercial/products.ts";
import {createStripeDigitalProductCheckout} from "../src/lib/commercial/stripe.ts";

test("every Stripe Test checkout uses the frozen product identity and exact amount",async()=>{
  const original=globalThis.fetch;
  const captured:Array<URLSearchParams>=[];
  globalThis.fetch=async (_input,init)=>{
    captured.push(init?.body as URLSearchParams);
    return new Response(JSON.stringify({id:`cs_test_${captured.length}`,url:"https://checkout.stripe.test/session",livemode:false,amount_total:Number(captured.at(-1)?.get("line_items[0][price_data][unit_amount]"))}),{status:200,headers:{"content-type":"application/json"}});
  };
  try{
    for(const product of DIGITAL_PRODUCTS){
      const result=await createStripeDigitalProductCheckout({orderId:`order_${product.id}`,userId:"user_test",product,successUrl:"https://example.test/success",cancelUrl:"https://example.test/cancel",secret:"sk_test_placeholder"});
      assert.match(result.id,/^cs_test_/);
      const form=captured.at(-1)!;
      assert.equal(form.get("line_items[0][price_data][unit_amount]"),String(product.amountCents));
      assert.equal(form.get("line_items[0][price_data][currency]"),product.currency);
      assert.equal(form.get("line_items[0][price_data][product_data][name]"),product.name);
      assert.equal(form.get("metadata[product_id]"),product.id);
      assert.equal(form.get("payment_intent_data[metadata][product_id]"),product.id);
    }
  }finally{globalThis.fetch=original;}
  assert.equal(captured.length,DIGITAL_PRODUCTS.length);
});
