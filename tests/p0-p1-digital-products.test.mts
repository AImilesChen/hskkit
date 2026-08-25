import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const read=(path:string)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

const expectedProducts=[
  "level-8","level-9","advanced-7-9","complete-1-9",
  "worksheet-pack","assessment-tracker","30-day-planner","mock-exam-pack","teacher-lesson-plan-pack",
];

test("P0/P1 public catalog exposes the approved products and frozen Test prices",async()=>{
  const products=await import("../src/lib/commercial/products.ts") as any;
  for(const id of expectedProducts) assert.ok(products.digitalProduct(id),`missing ${id}`);
  assert.equal(products.digitalProduct("level-8").amountCents,999);
  assert.equal(products.digitalProduct("level-9").amountCents,999);
  assert.equal(products.digitalProduct("advanced-7-9").amountCents,2499);
  assert.deepEqual(products.digitalProduct("advanced-7-9").levels,[7,8,9]);
  assert.equal(products.digitalProduct("complete-1-9").amountCents,6499);
  assert.deepEqual(products.digitalProduct("complete-1-9").levels,[1,2,3,4,5,6,7,8,9]);
  for(const id of expectedProducts.slice(4)) assert.equal(products.digitalProduct(id).amountCents,999);
  assert.equal(products.digitalProduct("unknown"),null);
});

test("bundle fulfillment creates separate level rights and one combined delivery",async()=>{
  const products=await import("../src/lib/commercial/products.ts") as any;
  const advanced=products.buildProductDeliveries("advanced-7-9");
  assert.deepEqual(advanced.map((item:any)=>item.deliveryKey),["level-7","level-8","level-9","bundle-zip"]);
  assert.deepEqual(advanced.slice(0,3).map((item:any)=>item.level),[7,8,9]);
  assert.ok(advanced.every((item:any)=>item.downloadLimit===3));
  const complete=products.buildProductDeliveries("complete-1-9");
  assert.equal(complete.length,10);
  assert.deepEqual(complete.slice(0,9).map((item:any)=>item.level),[1,2,3,4,5,6,7,8,9]);
  assert.equal(complete.at(-1).deliveryKey,"bundle-zip");
});

test("digital checkout normalization binds exact product, price, currency and owner",async()=>{
  const domain=await import("../src/lib/commercial/domain.ts") as any;
  const event={id:"cs_test_digital",mode:"payment",payment_status:"paid",amount_total:2499,currency:"usd",payment_intent:"pi_digital",metadata:{order_id:"ord_digital",user_id:"user_digital",product_id:"advanced-7-9"}};
  assert.deepEqual(domain.normalizeDigitalProductCheckoutEvent(event),{sessionId:"cs_test_digital",orderId:"ord_digital",userId:"user_digital",productId:"advanced-7-9",amountCents:2499,currency:"usd",paymentIntentId:"pi_digital"});
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
  const [font,emoji]=await Promise.all([
    readFile(new URL("../assets/fonts/HskKitSansSubset.ttf",import.meta.url)),
    readFile(new URL("../assets/fonts/HskKitEmoji.ttf",import.meta.url)),
  ]);
  for(const productId of expectedProducts.slice(4)){
    const artifact=await generator.generateDifferentiatedProductArtifact(productId,new Uint8Array(font),new Uint8Array(emoji));
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
  for(const label of ["Level 8 PDF Pack","Level 9 PDF Pack","Advanced 7–9 Bundle","Complete 1–9 Bundle","HSK Worksheet Pack","HSK Assessment Tracker","HSK 30-Day Planner","HSK Mock Exam Pack","HSK Teacher Lesson Plan Pack"]) assert.ok(catalog.DIGITAL_PRODUCTS.some(product=>product.name.includes(label)));
  assert.doesNotMatch(purchase,/<select/);
  assert.match(purchase,/productId/);
  assert.match(exportsUi,/product_entitlement_id|productEntitlementId/);
  assert.match(ordersUi,/product_name|productName/);
  assert.match(successUi,/product_name|productName/);
});
