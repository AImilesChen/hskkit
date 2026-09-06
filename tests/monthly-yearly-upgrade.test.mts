import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {DatabaseSync,type StatementSync} from "node:sqlite";
import {normalizeSubscriptionEvent} from "../src/lib/commercial/subscription.ts";
import {applySubscriptionEvent} from "../src/lib/commercial/storage.ts";
import {createStripeYearlyUpgradePortal} from "../src/lib/commercial/stripe.ts";

const jsonResponse=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{"content-type":"application/json"}});

test("subscription updates derive the yearly plan from the verified Stripe price instead of stale checkout metadata",()=>{
  const normalized=normalizeSubscriptionEvent({
    id:"evt_upgrade",type:"customer.subscription.updated",livemode:true,data:{object:{
      id:"sub_live_1",customer:"cus_live_1",status:"active",cancel_at_period_end:false,
      items:{data:[{id:"si_1",price:{id:"price_yearly",unit_amount:4900,currency:"usd"}}]},
      metadata:{owner_id:"user:u1",user_id:"u1",plan_id:"pro_monthly",order_id:"ord_1"},
    }},
  },{price_yearly:"pro_yearly"});
  assert.equal(normalized.kind,"subscription_updated");
  if(normalized.kind==="subscription_updated"){
    assert.equal(normalized.planId,"pro_yearly");
    assert.equal(normalized.amountCents,4900);
  }
});

test("Stripe yearly-upgrade portal is restricted to the authenticated monthly subscription and annual target price",async()=>{
  const original=globalThis.fetch;
  const calls:Array<{url:string;init?:RequestInit}>=[];
  globalThis.fetch=async(input:URL|RequestInfo,init?:RequestInit)=>{
    const url=String(input);calls.push({url,init});
    if(url.endsWith("/prices/price_monthly"))return jsonResponse({id:"price_monthly",active:true,livemode:true,type:"recurring",currency:"usd",unit_amount:599,product:"prod_pro",recurring:{interval:"month",interval_count:1}});
    if(url.endsWith("/prices/price_yearly"))return jsonResponse({id:"price_yearly",active:true,livemode:true,type:"recurring",currency:"usd",unit_amount:4900,product:"prod_pro",recurring:{interval:"year",interval_count:1}});
    if(url.endsWith("/subscriptions/sub_live_1"))return jsonResponse({id:"sub_live_1",customer:"cus_live_1",status:"active",cancel_at_period_end:false,livemode:true,items:{data:[{id:"si_live_1",quantity:1,price:{id:"price_monthly"}}]}});
    if(url.includes("/billing_portal/configurations?"))return jsonResponse({object:"list",data:[],has_more:false});
    if(url.endsWith("/billing_portal/configurations"))return jsonResponse({id:"bpc_upgrade",active:true,livemode:true});
    if(url.endsWith("/billing_portal/sessions"))return jsonResponse({id:"bps_upgrade",livemode:true,url:"https://billing.stripe.com/p/session/test"});
    return jsonResponse({error:{code:"unexpected_call"}},500);
  };
  try{
    const result=await createStripeYearlyUpgradePortal({
      subscriptionId:"sub_live_1",customerId:"cus_live_1",monthlyPriceId:"price_monthly",yearlyPriceId:"price_yearly",
      returnUrl:"https://hskkit.com/pricing?plan=updated",secret:"sk_live_test",idempotencyKey:"upgrade-u1",
    });
    assert.equal(result.url,"https://billing.stripe.com/p/session/test");
    const configForm=calls.find(call=>call.url.endsWith("/billing_portal/configurations"))?.init?.body as URLSearchParams;
    assert.equal(configForm.get("features[subscription_update][enabled]"),"true");
    assert.deepEqual(configForm.getAll("features[subscription_update][default_allowed_updates][]"),["price"]);
    assert.deepEqual(configForm.getAll("features[subscription_update][products][0][prices][]"),["price_monthly","price_yearly"]);
    const sessionForm=calls.find(call=>call.url.endsWith("/billing_portal/sessions"))?.init?.body as URLSearchParams;
    assert.equal(sessionForm.get("flow_data[type]"),"subscription_update_confirm");
    assert.equal(sessionForm.get("flow_data[subscription_update_confirm][subscription]"),"sub_live_1");
    assert.equal(sessionForm.get("flow_data[subscription_update_confirm][items][0][id]"),"si_live_1");
    assert.equal(sessionForm.get("flow_data[subscription_update_confirm][items][0][price]"),"price_yearly");
  }finally{globalThis.fetch=original;}
});

test("monthly-to-yearly webhook transition updates the plan and accepts only a subscription-update proration",async()=>{
  class Statement{private values:any[]=[];private statement:StatementSync;constructor(statement:StatementSync){this.statement=statement;}bind(...values:any[]){this.values=values;return this;}async first<T>(){return (this.statement.get(...this.values) as T|undefined)??null;}async all<T>(){return {results:this.statement.all(...this.values) as T[]};}async run(){const result=this.statement.run(...this.values);return {meta:{changes:Number(result.changes)}};}}
  class D1{private database:DatabaseSync;constructor(database:DatabaseSync){this.database=database;}prepare(sql:string){return new Statement(this.database.prepare(sql));}async batch(statements:Statement[]){this.database.exec("BEGIN");try{const results=[];for(const statement of statements)results.push(await statement.run());this.database.exec("COMMIT");return results;}catch(error){this.database.exec("ROLLBACK");throw error;}}}
  const db=new DatabaseSync(":memory:");
  const migration=await readFile(new URL("../migrations/0015_batch2a_subscriptions.sql",import.meta.url),"utf8");
  db.exec(migration.slice(migration.indexOf("CREATE TABLE IF NOT EXISTS subscription_orders")));
  db.exec("ALTER TABLE subscription_orders ADD COLUMN stripe_livemode INTEGER NOT NULL DEFAULT 0; ALTER TABLE subscriptions ADD COLUMN stripe_livemode INTEGER NOT NULL DEFAULT 0; ALTER TABLE subscription_entitlements ADD COLUMN stripe_livemode INTEGER NOT NULL DEFAULT 0; CREATE UNIQUE INDEX subscription_entitlements_test_mode_idx ON subscription_entitlements(owner_id,stripe_livemode); ALTER TABLE subscription_charges ADD COLUMN stripe_livemode INTEGER NOT NULL DEFAULT 0; CREATE TABLE promotional_entitlements(owner_id TEXT,kind TEXT,status TEXT,updated_at TEXT,starts_at TEXT,ends_at TEXT,ai_credits INTEGER,created_at TEXT);");
  db.exec(await readFile(new URL("../migrations/0032_welcome_credit_rollover.sql",import.meta.url),"utf8"));
  const at="2026-09-06T00:00:00.000Z";
  db.prepare("INSERT INTO subscription_orders(id,owner_id,user_id,plan_id,amount_cents,currency,status,stripe_livemode,idempotency_key,provider_customer_id,provider_subscription_id,created_at,updated_at) VALUES('ord_1','user:u1','u1','pro_monthly',599,'usd','completed',1,'idem','cus_live_1','sub_live_1',?,?)").run(at,at);
  const env={LEARNING_DB:new D1(db)} as any;
  await applySubscriptionEvent({kind:"subscription_updated",eventId:"evt_monthly",orderId:"ord_1",ownerId:"user:u1",userId:"u1",planId:"pro_monthly",subscriptionId:"sub_live_1",customerId:"cus_live_1",status:"active",cancelAtPeriodEnd:false,amountCents:599,currency:"usd",currentPeriodStart:at,currentPeriodEnd:"2026-10-06T00:00:00.000Z"},env,true);
  await applySubscriptionEvent({kind:"subscription_updated",eventId:"evt_yearly",orderId:"ord_1",ownerId:"user:u1",userId:"u1",planId:"pro_yearly",subscriptionId:"sub_live_1",customerId:"cus_live_1",status:"active",cancelAtPeriodEnd:false,amountCents:4900,currency:"usd",currentPeriodStart:at,currentPeriodEnd:"2027-09-06T00:00:00.000Z"},env,true);
  assert.equal((db.prepare("SELECT plan_id FROM subscriptions").get() as {plan_id:string}).plan_id,"pro_yearly");
  assert.equal((db.prepare("SELECT plan_id FROM subscription_entitlements").get() as {plan_id:string}).plan_id,"pro_yearly");
  await applySubscriptionEvent({kind:"invoice_paid",eventId:"evt_proration",invoiceId:"in_proration",subscriptionId:"sub_live_1",customerId:"cus_live_1",paymentIntentId:"pi_1",chargeId:"ch_1",amountCents:4301,currency:"usd",chargedAt:at,billingReason:"subscription_update"},env,true);
  assert.equal((db.prepare("SELECT amount_cents FROM subscription_charges").get() as {amount_cents:number}).amount_cents,4301);
  await assert.rejects(()=>applySubscriptionEvent({kind:"invoice_paid",eventId:"evt_wrong",invoiceId:"in_wrong",subscriptionId:"sub_live_1",customerId:"cus_live_1",amountCents:1,currency:"usd",chargedAt:at,billingReason:"subscription_cycle"},env,true),/SUBSCRIPTION_INVOICE_MISMATCH/);
});

test("pricing and subscription endpoint expose unambiguous current-plan and monthly-to-yearly actions",async()=>{
  const [pricing,checkout,route,storage,webhook]=await Promise.all([
    readFile(new URL("../src/app/pricing/page.tsx",import.meta.url),"utf8"),
    readFile(new URL("../src/app/pricing/subscription-checkout.tsx",import.meta.url),"utf8"),
    readFile(new URL("../src/app/api/v1/commercial/subscription/route.ts",import.meta.url),"utf8"),
    readFile(new URL("../src/lib/commercial/storage.ts",import.meta.url),"utf8"),
    readFile(new URL("../src/app/api/v1/commercial/webhook/route.ts",import.meta.url),"utf8"),
  ]);
  assert.equal((pricing.match(/<SubscriptionCheckout /g)??[]).length,2);
  assert.match(checkout,/CURRENT PLAN/);
  assert.match(checkout,/Manage subscription/);
  assert.match(checkout,/Your Pro Monthly plan is active\./);
  assert.match(checkout,/Switch to Pro Yearly/);
  assert.match(checkout,/Review the prorated charge in Stripe before confirming\./);
  assert.match(checkout,/Current access: Pro/);
  assert.match(route,/switch_to_yearly/);
  assert.match(route,/createStripeYearlyUpgradePortal/);
  assert.match(storage,/order\?\.plan_id==="pro_monthly"&&event\.planId==="pro_yearly"/);
  assert.match(storage,/billingReason==="subscription_update"/);
  assert.match(webhook,/subscriptionPricePlans/);
});
