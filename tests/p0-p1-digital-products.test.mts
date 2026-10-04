import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import {loadAssessmentLevelAudio} from "./assessment-level-audio-fixture.mts";

const read=(path:string)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

const expectedPrices:Record<string,number>={
  "level-1":399,"level-2":599,"level-3":799,"level-4":1099,"level-5":1399,"level-6":1799,
  "starter-1-3":999,"progression-4-6":2999,"advanced-7-9":3999,"complete-1-9":4999,
  "worksheet-pack":1299,"assessment-tracker":499,"30-day-planner":699,"practice-assessment-pack":1699,
  "learner-practice-toolkit":1699,"exam-preparation-bundle":2499,"teacher-lesson-plan-pack":1999,
};
const generatorProducts=["worksheet-pack","assessment-tracker","30-day-planner","practice-assessment-pack","teacher-lesson-plan-pack"];

test("P0/P1 public catalog exposes the approved products and frozen Test prices",async()=>{
  const products=await import("../src/lib/commercial/products.ts") as any;
  assert.equal(products.DIGITAL_PRODUCTS.length,17);
  for(const [id,amount] of Object.entries(expectedPrices)) assert.equal(products.digitalProduct(id)?.amountCents,amount,`price mismatch ${id}`);
  assert.equal(products.digitalProduct("level-7"),null);
  assert.equal(products.digitalProduct("level-8"),null);
  assert.equal(products.digitalProduct("level-9"),null);
  assert.deepEqual(products.digitalProduct("advanced-7-9").levels,[7]);
  assert.deepEqual(products.digitalProduct("complete-1-9").levels,[1,2,3,4,5,6,7]);
  assert.equal(products.digitalProduct("unknown"),null);
});

test("bundle fulfillment creates separate level rights and one combined delivery",async()=>{
  const products=await import("../src/lib/commercial/products.ts") as any;
  const advanced=products.buildProductDeliveries("advanced-7-9");
  assert.deepEqual(advanced.map((item:any)=>item.deliveryKey),["level-7","bundle-zip"]);
  assert.deepEqual(advanced.slice(0,1).map((item:any)=>item.level),[7]);
  assert.ok(advanced.every((item:any)=>item.downloadLimit===3));
  const complete=products.buildProductDeliveries("complete-1-9");
  assert.equal(complete.length,8);
  assert.deepEqual(complete.slice(0,7).map((item:any)=>item.level),[1,2,3,4,5,6,7]);
  assert.equal(complete.at(-1).deliveryKey,"bundle-zip");
});

test("digital checkout normalization binds exact product, price, currency and owner",async()=>{
  const domain=await import("../src/lib/commercial/domain.ts") as any;
  const event={id:"cs_test_digital",mode:"payment",payment_status:"paid",amount_total:3999,currency:"usd",payment_intent:"pi_digital",metadata:{order_id:"ord_digital",user_id:"user_digital",product_id:"advanced-7-9"}};
  assert.deepEqual(domain.normalizeDigitalProductCheckoutEvent(event),{sessionId:"cs_test_digital",orderId:"ord_digital",userId:"user_digital",productId:"advanced-7-9",amountCents:3999,currency:"usd",paymentIntentId:"pi_digital"});
  assert.throws(()=>domain.normalizeDigitalProductCheckoutEvent({...event,amount_total:999}),/DIGITAL_CHECKOUT_MISMATCH/);
  assert.throws(()=>domain.normalizeDigitalProductCheckoutEvent({...event,metadata:{...event.metadata,product_id:"unknown"}}),/DIGITAL_CHECKOUT_MISMATCH/);
});

test("schema and routes cover atomic grants, repeat blocking, refund revocation and generic exports",async()=>{
  const [migration,storage,checkout,webhook,exportsRoute]=await Promise.all([
    read("migrations/0020_p0_p1_digital_products.sql"),read("src/lib/commercial/digital-storage.ts"),
    read("src/app/api/v1/commercial/checkout/route.ts"),read("src/app/api/v1/commercial/webhook/route.ts"),read("src/app/api/v1/commercial/exports/route.ts"),
  ]);
  assert.match(migration,/CREATE TABLE IF NOT EXISTS digital_product_orders/);
  assert.match(migration,/CREATE TABLE IF NOT EXISTS digital_product_entitlements/);
  assert.match(migration,/product_entitlement_id TEXT REFERENCES digital_product_entitlements/);
  assert.match(storage,/PRODUCT_ALREADY_ACTIVE/);
  assert.match(storage,/buildProductDeliveries/);
  assert.match(storage,/successful_downloads\?\?0\)>0/);
  assert.match(storage,/status='refunded'/);
  assert.match(storage,/DELETE FROM commercial_download_tokens/);
  assert.match(checkout,/createDigitalProductOrder/);
  assert.match(webhook,/grantDigitalProductOrder/);
  assert.match(webhook,/revokeRefundedDigitalProductOrder/);
  assert.match(exportsRoute,/activeDigitalEntitlement/);
});

test("five differentiated MVP generators produce real PDF or ZIP artifacts",async()=>{
  const generator=await import("../src/lib/commercial/product-generator.ts") as any;
  const [font,emoji,audioA,audioB,audioC]=await Promise.all([
    readFile(new URL("../assets/fonts/HskKitSansSubset.ttf",import.meta.url)),
    readFile(new URL("../assets/fonts/HskKitEmoji.ttf",import.meta.url)),
    readFile(new URL("../assets/audio/mock-assessment-v2/form-A.mp3",import.meta.url)),
    readFile(new URL("../assets/audio/mock-assessment-v2/form-B.mp3",import.meta.url)),
    readFile(new URL("../assets/audio/mock-assessment-v2/form-C.mp3",import.meta.url)),
  ]);
  const assessmentAudio={A:new Uint8Array(audioA),B:new Uint8Array(audioB),C:new Uint8Array(audioC)};
  for(const productId of generatorProducts){
    const artifact=await generator.generateDifferentiatedProductArtifact(productId,new Uint8Array(font),new Uint8Array(emoji),"p0-p1-v2",assessmentAudio,await loadAssessmentLevelAudio());
    assert.ok(artifact.bytes.byteLength>1000,`${productId} artifact too small`);
    assert.ok(["pdf","zip"].includes(artifact.format));
    const magic=new TextDecoder().decode(artifact.bytes.slice(0,4));
    assert.ok(magic.startsWith("%PDF")||magic.startsWith("PK"),`${productId} invalid magic`);
    assert.equal(artifact.manifest.productId,productId);
    assert.equal(artifact.manifest.standard,"HSK 3.0");
    assert.equal(artifact.manifest.standardVersion,"GF0025-2021");
    assert.equal(artifact.manifest.officialExam,false);
  }
});

test("Store and account UI expose P0/P1 products without hidden level dropdowns",async()=>{
  const [purchase,exportsUi,ordersUi,successUi]=await Promise.all([
    read("src/app/store/store-purchase.tsx"),read("src/app/exports/exports-client.tsx"),read("src/app/orders/orders-client.tsx"),read("src/app/checkout/success/checkout-success-client.tsx"),
  ]);
  const catalog=await import("../src/lib/commercial/products.ts");
  for(const id of Object.keys(expectedPrices)) assert.ok(catalog.DIGITAL_PRODUCTS.some(product=>product.id===id),`missing ${id}`);
  assert.doesNotMatch(purchase,/<select/);
  assert.match(purchase,/storeProductDetail\(product\.id\)/);
  assert.match(exportsUi,/product_entitlement_id|productEntitlementId/);
  assert.match(ordersUi,/product_name|productName/);
  assert.match(successUi,/product_name|productName/);
  assert.match(successUi,/\/api\/v1\/commercial\/checkout\/result\?session_id=/);
});
