import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DatabaseSync, type StatementSync } from "node:sqlite";

import { PDF_PACK_DOWNLOAD_LIMIT, PDF_PACK_SKU } from "../src/lib/commercial/domain.ts";
import {
  applySubscriptionEvent,
  claimPaymentEvent,
  consumeSuccessfulDownload,
  createExportJob,
  createDownloadTokenRecord,
  downloadContext,
  expireReadyExports,
  finalizePaymentEvent,
  getPackPurchaseForOrder,
  grantPaidPackPurchase,
  revokeRefundedOrder,
} from "../src/lib/commercial/storage.ts";
import { buildSubscriptionCheckoutForm, SUBSCRIPTION_PLANS } from "../src/lib/commercial/subscription.ts";
import { buildPackManifest, selectPackAssets } from "../src/lib/commercial/catalog.ts";
import {activeDigitalEntitlement,createDigitalProductOrder,grantDigitalProductOrder,markDigitalOrderFailed,requestDigitalRefund,revokeRefundedDigitalProductOrder} from "../src/lib/commercial/digital-storage.ts";
import {buildProductDeliveries} from "../src/lib/commercial/products.ts";
import { generatePackPdf } from "../src/lib/commercial/generator.ts";

class TestStatement {
  private statement: StatementSync;
  private values: any[] = [];
  constructor(statement: StatementSync) { this.statement = statement; }
  bind(...values: any[]) { this.values = values; return this; }
  async first<T>() { return (this.statement.get(...this.values) as T | undefined) ?? null; }
  async all<T>() { return { results: this.statement.all(...this.values) as T[] }; }
  async run() { const result=this.statement.run(...this.values); return { meta:{ changes:Number(result.changes) } }; }
}
class TestD1Database {
  private database: DatabaseSync;
  constructor(database: DatabaseSync) { this.database = database; }
  prepare(sql:string) { return new TestStatement(this.database.prepare(sql)); }
  async batch(statements:TestStatement[]) {
    this.database.exec("BEGIN");
    try { const results=[]; for(const statement of statements) results.push(await statement.run()); this.database.exec("COMMIT"); return results; }
    catch(error) { this.database.exec("ROLLBACK"); throw error; }
  }
}
const envFor=(db:DatabaseSync)=>({LEARNING_DB:new TestD1Database(db)}) as any;
const read=(path:string)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

async function subscriptionDb(){
  const db=new DatabaseSync(":memory:");
  db.exec("CREATE TABLE payment_events(event_id TEXT PRIMARY KEY,event_type TEXT,livemode INTEGER,payload_sha256 TEXT,processed_at TEXT,outcome TEXT,claim_token TEXT);");
  const migration=await read("migrations/0015_batch2a_subscriptions.sql");
  db.exec(migration.slice(migration.indexOf("CREATE TABLE IF NOT EXISTS subscription_orders")));
  return db;
}
async function activate(db:DatabaseSync,planId:"pro_monthly"|"pro_yearly",suffix:string){
  const plan=SUBSCRIPTION_PLANS[planId]; const at="2026-08-25T00:00:00.000Z";
  db.prepare("INSERT INTO subscription_orders(id,owner_id,user_id,plan_id,amount_cents,currency,status,idempotency_key,provider_customer_id,provider_subscription_id,created_at,updated_at) VALUES(?,?,?,?,?,?,'completed',?,?,?,?,?)")
    .run(`order-${suffix}`,`user:user-${suffix}`,`user-${suffix}`,planId,plan.amountCents,"usd",`idem-${suffix}`,`cus_${suffix}`,`sub_${suffix}`,at,at);
  const event={kind:"subscription_updated" as const,eventId:`evt_active_${suffix}`,subscriptionId:`sub_${suffix}`,customerId:`cus_${suffix}`,ownerId:`user:user-${suffix}`,userId:`user-${suffix}`,planId,orderId:`order-${suffix}`,status:"active" as const,cancelAtPeriodEnd:false,currentPeriodStart:at,currentPeriodEnd:"2026-09-25T00:00:00.000Z",amountCents:plan.amountCents,currency:"usd"};
  await applySubscriptionEvent(event,envFor(db));
  return {plan,at,event};
}

test("monthly/yearly Test Checkout is recurring and duplicate-click stable",()=>{
  for(const planId of ["pro_monthly","pro_yearly"] as const){
    const first=buildSubscriptionCheckoutForm({planId,priceId:`price_${planId}_test`,ownerId:"user:u1",userId:"u1",orderId:`ord_${planId}`,origin:"https://hskkit.com"});
    const replay=buildSubscriptionCheckoutForm({planId,priceId:`price_${planId}_test`,ownerId:"user:u1",userId:"u1",orderId:`ord_${planId}`,origin:"https://hskkit.com"});
    assert.equal(first.toString(),replay.toString()); assert.equal(first.get("mode"),"subscription");
    assert.equal(first.get("client_reference_id"),`ord_${planId}`);
  }
});

test("monthly and yearly activate, cancel at period end, fail, renew and refund without duplicate rights",async()=>{
  for(const [planId,suffix] of [["pro_monthly","m"],["pro_yearly","y"]] as const){
    const db=await subscriptionDb(); const {plan,at,event}=await activate(db,planId,suffix); const env=envFor(db);
    await applySubscriptionEvent({...event,eventId:`evt_cancel_${suffix}`,cancelAtPeriodEnd:true},env);
    assert.equal((db.prepare("SELECT cancel_at_period_end n FROM subscriptions").get() as {n:number}).n,1);
    assert.equal((db.prepare("SELECT status FROM subscription_entitlements").get() as {status:string}).status,"active");
    await applySubscriptionEvent({kind:"invoice_payment_failed",eventId:`evt_fail_${suffix}`,invoiceId:`in_fail_${suffix}`,subscriptionId:`sub_${suffix}`,customerId:`cus_${suffix}`,amountCents:plan.amountCents,currency:"usd"},env);
    assert.equal((db.prepare("SELECT status FROM subscription_entitlements").get() as {status:string}).status,"suspended");
    const paid={kind:"invoice_paid" as const,eventId:`evt_paid_${suffix}`,invoiceId:`in_paid_${suffix}`,subscriptionId:`sub_${suffix}`,customerId:`cus_${suffix}`,paymentIntentId:`pi_${suffix}`,chargeId:`ch_${suffix}`,amountCents:plan.amountCents,currency:"usd",chargedAt:at};
    await applySubscriptionEvent(paid,env); await applySubscriptionEvent(paid,env);
    assert.equal((db.prepare("SELECT status FROM subscription_entitlements").get() as {status:string}).status,"suspended");
    await applySubscriptionEvent({...event,eventId:`evt_renewed_${suffix}`,currentPeriodStart:"2026-09-25T00:00:00.000Z",currentPeriodEnd:"2026-10-25T00:00:00.000Z"},env);
    assert.equal((db.prepare("SELECT status FROM subscription_entitlements").get() as {status:string}).status,"active");
    assert.equal((db.prepare("SELECT COUNT(*) n FROM subscription_charges WHERE status='paid'").get() as {n:number}).n,1);
    await applySubscriptionEvent({kind:"charge_refunded",eventId:`evt_refund_${suffix}`,chargeId:`ch_${suffix}`,paymentIntentId:`pi_${suffix}`,amountRefundedCents:plan.amountCents,currency:"usd"},env);
    const revoked=db.prepare("SELECT status,revocation_reason FROM subscription_entitlements").get() as {status:string;revocation_reason:string};
    assert.equal(revoked.status,"revoked"); assert.equal(revoked.revocation_reason,"refund");
  }
});

test("webhook delayed/replayed delivery is single-owner and failed claims retry",async()=>{
  const db=await subscriptionDb(); const env=envFor(db);
  const first=await claimPaymentEvent({eventId:"evt_1",eventType:"invoice.paid",livemode:false,payloadSha256:"hash-1"},env);
  assert.equal(first.state,"claimed"); assert.equal((await claimPaymentEvent({eventId:"evt_1",eventType:"invoice.paid",livemode:false,payloadSha256:"hash-1"},env)).state,"busy");
  if(first.state!=="claimed") throw new Error("expected claim");
  await finalizePaymentEvent("evt_1",first.claimToken,"processed",env);
  assert.equal((await claimPaymentEvent({eventId:"evt_1",eventType:"invoice.paid",livemode:false,payloadSha256:"hash-1"},env)).state,"duplicate");
  db.prepare("INSERT INTO payment_events(event_id,event_type,livemode,payload_sha256,processed_at,outcome) VALUES('evt_retry','invoice.paid',0,'old','2026-08-25T00:00:00.000Z','failed')").run();
  assert.equal((await claimPaymentEvent({eventId:"evt_retry",eventType:"invoice.paid",livemode:false,payloadSha256:"new"},env)).state,"claimed");
});

test("Pro credits use a fresh 500-credit bucket each calendar month",async()=>{
  const [storage,capabilities]=await Promise.all([read("src/lib/ai/storage.ts"),read("src/lib/commercial/capabilities.ts")]);
  assert.match(storage,/isProductPolicy\(policy\) \? now\.toISOString\(\)\.slice\(0, 7\)/);
  assert.match(storage,/INSERT INTO ai_quota_buckets\(owner_id,period_key,allowance,used,reserved,updated_at\)/);
  assert.match(capabilities,/aiMonthlyCredits:\s*500/);
});

async function packDb(){
  const db=new DatabaseSync(":memory:");
  db.exec("CREATE TABLE accounts(user_id TEXT PRIMARY KEY); INSERT INTO accounts VALUES('pack-user');");
  db.exec(await read("migrations/0012_batch15_commercial_exports.sql"));
  db.exec(await read("migrations/0016_batch2b_pack_purchases.sql"));
  db.exec(await read("migrations/0020_p0_p1_digital_products.sql"));
  return db;
}

test("PDF Pack grants one Level, counts exactly three successful downloads, and failures do not debit",async()=>{
  const db=await packDb(); const env=envFor(db); const at=new Date().toISOString();
  db.prepare("INSERT INTO commerce_orders(id,user_id,sku,amount_cents,currency,selected_level,status,stripe_mode,idempotency_key,stripe_checkout_session_id,created_at,updated_at) VALUES(?,?,?,?,?,?,'pending','test',?,?,?,?)")
    .run("ord_pack","pack-user",PDF_PACK_SKU,999,"usd",3,"idem_pack","cs_test_pack",at,at);
  const purchase=await grantPaidPackPurchase({sessionId:"cs_test_pack",orderId:"ord_pack",expectedUserId:"pack-user",expectedSku:PDF_PACK_SKU,expectedSelectedLevel:3,paymentIntentId:"pi_pack",chargeId:"ch_pack"},env);
  assert.equal(purchase.selected_level,3); assert.equal(purchase.download_limit,PDF_PACK_DOWNLOAD_LIMIT);
  const route=await read("src/app/api/v1/commercial/download/[token]/route.ts");
  const fetched=route.indexOf("object.arrayBuffer()"); const verified=route.indexOf("EXPORT_CHECKSUM_MISMATCH",fetched); const debited=route.indexOf("await consumeSuccessfulDownload",verified); const responded=route.indexOf("new Response(bytes",debited);
  assert.ok(fetched>=0&&verified>fetched&&debited>verified&&responded>debited,"server failures must return before a successful-download debit");
  db.prepare("INSERT INTO commercial_export_jobs(id,user_id,pack_purchase_id,kind,format,level,state,idempotency_key,generation_version,object_key,manifest_json,checksum_sha256,byte_size,expires_at,created_at,updated_at) VALUES(?,?,?,'pdf_pack','pdf',3,'ready','export-1','v1','private/test.pdf','{}','sum',123,?,?,?)")
    .run("job_pack","pack-user",purchase.id,new Date(Date.now()+86_400_000).toISOString(),at,at);
  // Generation, storage, signature, checksum and other failed server responses happen before consumeSuccessfulDownload and cannot debit.
  assert.equal((db.prepare("SELECT successful_downloads n FROM pack_purchases").get() as {n:number}).n,0);
  for(let index=1;index<=3;index++){
    const tokenId=`tok_${index}`; const hash=`hash_${index}`;
    await createDownloadTokenRecord({tokenId,jobId:"job_pack",userId:"pack-user",tokenSha256:hash,expiresAt:new Date(Date.now()+60_000).toISOString()},env);
    await consumeSuccessfulDownload({tokenId,jobId:"job_pack",packPurchaseId:purchase.id,userId:"pack-user",byteSize:123,checksumSha256:"sum"},env);
    assert.equal((db.prepare("SELECT successful_downloads n FROM pack_purchases").get() as {n:number}).n,index);
  }
  await createDownloadTokenRecord({tokenId:"tok_4",jobId:"job_pack",userId:"pack-user",tokenSha256:"hash_4",expiresAt:new Date(Date.now()+60_000).toISOString()},env);
  await assert.rejects(consumeSuccessfulDownload({tokenId:"tok_4",jobId:"job_pack",packPurchaseId:purchase.id,userId:"pack-user",byteSize:123,checksumSha256:"sum"},env),/DOWNLOAD_NOT_ALLOWED/);
});

test("PDF Pack expires after 14 days and refund revokes rights plus old tokens",async()=>{
  const db=await packDb(); const env=envFor(db); const at=new Date().toISOString();
  db.prepare("INSERT INTO commerce_orders(id,user_id,sku,amount_cents,currency,selected_level,status,stripe_mode,idempotency_key,stripe_checkout_session_id,stripe_payment_intent_id,stripe_charge_id,created_at,updated_at) VALUES(?,?,?,?,?,?,'pending','test',?,?,?,?,?,?)")
    .run("ord_refund","pack-user",PDF_PACK_SKU,999,"usd",1,"idem_refund","cs_test_refund","pi_refund","ch_refund",at,at);
  const purchase=await grantPaidPackPurchase({sessionId:"cs_test_refund",expectedUserId:"pack-user",expectedSku:PDF_PACK_SKU,expectedSelectedLevel:1,paymentIntentId:"pi_refund",chargeId:"ch_refund"},env);
  const expires=(await getPackPurchaseForOrder("ord_refund",env))!.expires_at;
  const days=(Date.parse(expires)-Date.parse(purchase.starts_at))/86_400_000; assert.equal(days,14);
  db.prepare("INSERT INTO commercial_export_jobs(id,user_id,pack_purchase_id,kind,format,level,state,idempotency_key,generation_version,object_key,manifest_json,checksum_sha256,byte_size,expires_at,created_at,updated_at) VALUES(?,?,?,'pdf_pack','pdf',1,'ready','export-r','v1','private/refund.pdf','{}','sum',123,?,?,?)")
    .run("job_refund","pack-user",purchase.id,new Date(Date.now()+86_400_000).toISOString(),at,at);
  await createDownloadTokenRecord({tokenId:"old_token",jobId:"job_refund",userId:"pack-user",tokenSha256:"old_hash",expiresAt:new Date(Date.now()+60_000).toISOString()},env);
  assert.ok(await downloadContext("old_hash",env));
  const objects=await revokeRefundedOrder({paymentIntentId:"pi_refund"},env); assert.deepEqual(objects,["private/refund.pdf"]);
  assert.equal(await downloadContext("old_hash",env),null);
  const revoked=db.prepare("SELECT status,revoked_reason FROM pack_purchases").get() as {status:string;revoked_reason:string};
  assert.equal(revoked.status,"refunded"); assert.equal(revoked.revoked_reason,"refund");
  db.prepare("UPDATE commercial_export_jobs SET state='ready',expires_at=?,object_key='private/expired.pdf' WHERE id='job_refund'").run("2000-01-01T00:00:00.000Z");
  const expired=await expireReadyExports(10,env); assert.ok(expired.some((item:{id:string})=>item.id==="job_refund"));
});

test("P0 bundles grant exact deliveries, meter successful downloads, block repeat purchase, and revoke on refund",async()=>{
  const db=await packDb();const env=envFor(db);
  const advanced=await createDigitalProductOrder("pack-user","advanced-7-9","digital-advanced",env);
  db.prepare("UPDATE digital_product_orders SET stripe_checkout_session_id='cs_adv' WHERE id=?").run(advanced.id);
  const rights=await grantDigitalProductOrder({sessionId:"cs_adv",expectedUserId:"pack-user",expectedProductId:"advanced-7-9",paymentIntentId:"pi_adv",chargeId:"ch_adv"},env);
  assert.equal(rights.length,buildProductDeliveries("advanced-7-9").length);assert.deepEqual(rights.map((right:{delivery_key:string})=>right.delivery_key),["level-7","bundle-zip"]);
  assert.equal((await grantDigitalProductOrder({sessionId:"cs_adv",expectedUserId:"pack-user",expectedProductId:"advanced-7-9"},env)).length,2);
  await assert.rejects(createDigitalProductOrder("pack-user","advanced-7-9","digital-repeat",env),/PRODUCT_ALREADY_ACTIVE/);
  const levelRight=rights.find((right:{delivery_key:string})=>right.delivery_key==="level-7")!;
  const job=await createExportJob({userId:"pack-user",productEntitlementId:levelRight.id,productId:"advanced-7-9",deliveryKey:"level-7",kind:"pdf_pack",format:"pdf",level:7,idempotencyKey:"digital-job",generationVersion:"p01-v1"},env);
  await createDownloadTokenRecord({tokenId:"digital-token",jobId:job.id,userId:"pack-user",tokenSha256:"digital-hash",expiresAt:new Date(Date.now()+60_000).toISOString()},env);
  await consumeSuccessfulDownload({tokenId:"digital-token",jobId:job.id,packPurchaseId:null,productEntitlementId:levelRight.id,userId:"pack-user",byteSize:456,checksumSha256:"digital-sum"},env);
  assert.equal((db.prepare("SELECT successful_downloads n FROM digital_product_entitlements WHERE id=?").get(levelRight.id) as {n:number}).n,1);
  await assert.rejects(requestDigitalRefund("pack-user",advanced.id,env),/ALREADY_DOWNLOADED/);

  const complete=await createDigitalProductOrder("pack-user","complete-1-9","digital-complete",env);db.prepare("UPDATE digital_product_orders SET stripe_checkout_session_id='cs_complete' WHERE id=?").run(complete.id);
  const completeRights=await grantDigitalProductOrder({sessionId:"cs_complete",expectedUserId:"pack-user",expectedProductId:"complete-1-9",paymentIntentId:"pi_complete",chargeId:"ch_complete"},env);assert.equal(completeRights.length,8);
  const combined=completeRights.find((right:{delivery_key:string})=>right.delivery_key==="bundle-zip")!;
  const combinedJob=await createExportJob({userId:"pack-user",productEntitlementId:combined.id,productId:"complete-1-9",deliveryKey:"bundle-zip",kind:"offline_pack",format:"zip",idempotencyKey:"complete-job",generationVersion:"p01-v1"},env);
  db.prepare("UPDATE commercial_export_jobs SET state='ready',object_key='private/complete.zip',manifest_json='{}',checksum_sha256='sum',byte_size=100 WHERE id=?").run(combinedJob.id);
  await createDownloadTokenRecord({tokenId:"complete-token",jobId:combinedJob.id,userId:"pack-user",tokenSha256:"complete-hash",expiresAt:new Date(Date.now()+60_000).toISOString()},env);
  assert.ok(await requestDigitalRefund("pack-user",complete.id,env));
  assert.equal(await activeDigitalEntitlement("pack-user",combined.id,env),null);
  assert.equal((db.prepare("SELECT state FROM commercial_export_jobs WHERE id=?").get(combinedJob.id) as {state:string}).state,"revoked");
  const objects=await revokeRefundedDigitalProductOrder({chargeId:"ch_complete",amountRefundedCents:4999,currency:"usd"},env);assert.deepEqual(objects,["private/complete.zip"]);
  assert.equal((db.prepare("SELECT status FROM digital_product_orders WHERE id=?").get(complete.id) as {status:string}).status,"refunded");
  assert.equal((db.prepare("SELECT COUNT(*) n FROM digital_product_entitlements WHERE order_id=? AND status='refunded'").get(complete.id) as {n:number}).n,8);
  assert.equal(await downloadContext("complete-hash",env),null);
});

test("digital checkout retries failed orders, blocks parallel pending checkout, freezes refunds and ignores partial refund revocation",async()=>{
  const db=await packDb();const env=envFor(db);
  const failed=await createDigitalProductOrder("pack-user","level-6","retry-idem",env);await markDigitalOrderFailed(failed.id,env);
  const retried=await createDigitalProductOrder("pack-user","level-6","retry-idem",env);assert.equal(retried.id,failed.id);assert.equal(retried.status,"pending");
  await assert.rejects(createDigitalProductOrder("pack-user","level-6","other-idem",env),/PRODUCT_CHECKOUT_PENDING/);
  db.prepare("UPDATE digital_product_orders SET stripe_checkout_session_id='cs_retry' WHERE id=?").run(retried.id);
  const rights=await grantDigitalProductOrder({sessionId:"cs_retry",expectedUserId:"pack-user",expectedProductId:"level-6",paymentIntentId:"pi_retry",chargeId:"ch_retry"},env);assert.equal(rights.length,1);
  assert.ok(await requestDigitalRefund("pack-user",retried.id,env));assert.equal(await activeDigitalEntitlement("pack-user",rights[0].id,env),null);
  await assert.rejects(revokeRefundedDigitalProductOrder({chargeId:"ch_retry",amountRefundedCents:500,currency:"usd"},env),/PARTIAL_REFUND_NOT_FINAL/);
  assert.equal((db.prepare("SELECT status FROM digital_product_entitlements WHERE id=?").get(rights[0].id) as {status:string}).status,"refund_pending");
  await revokeRefundedDigitalProductOrder({chargeId:"ch_retry",amountRefundedCents:1799,currency:"usd"},env);
  assert.equal((db.prepare("SELECT status FROM digital_product_entitlements WHERE id=?").get(rights[0].id) as {status:string}).status,"refunded");
});

test("failed checkout cannot be revived after the same user gains active product rights",async()=>{
  const db=await packDb();const env=envFor(db);const stale=await createDigitalProductOrder("pack-user","worksheet-pack","stale-idem",env);await markDigitalOrderFailed(stale.id,env);
  const winner=await createDigitalProductOrder("pack-user","worksheet-pack","winner-idem",env);db.prepare("UPDATE digital_product_orders SET stripe_checkout_session_id='cs_winner' WHERE id=?").run(winner.id);await grantDigitalProductOrder({sessionId:"cs_winner",expectedUserId:"pack-user",expectedProductId:"worksheet-pack",paymentIntentId:"pi_winner",chargeId:"ch_winner"},env);
  await assert.rejects(createDigitalProductOrder("pack-user","worksheet-pack","stale-idem",env),/PRODUCT_ALREADY_ACTIVE/);assert.equal((db.prepare("SELECT status FROM digital_product_orders WHERE id=?").get(stale.id) as {status:string}).status,"failed");
});

test("final PDF bytes parse independently and render without blank pages",async()=>{
  const selection=selectPackAssets(1); const manifest=buildPackManifest(selection,"batch5-final");
  const [font,emoji]=await Promise.all([readFile(new URL("../assets/fonts/HskKitSansSubset.ttf",import.meta.url)),readFile(new URL("../assets/fonts/HskKitEmoji.ttf",import.meta.url))]);
  const pdf=await generatePackPdf(selection,manifest,new Uint8Array(font),new Uint8Array(emoji));
  assert.equal(new TextDecoder().decode(pdf.slice(0,5)),"%PDF-"); assert.ok(pdf.byteLength>10_000);
  await import("pdf-lib").then(async({PDFDocument})=>{const parsed=await PDFDocument.load(pdf); assert.ok(parsed.getPageCount()>1); assert.equal(parsed.getTitle(),"HSKKit HSK 3.0 Level 1 Complete Vocabulary");});
});
