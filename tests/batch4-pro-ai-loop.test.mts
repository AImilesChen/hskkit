import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";

import { FREE_CAPABILITIES, PRO_CAPABILITIES, aiCreditCost, capabilitiesForEntitlement } from "../src/lib/commercial/capabilities.ts";
import { entitlementFromSubscription } from "../src/lib/commercial/subscription.ts";
import { applySubscriptionEvent, claimPaymentEvent } from "../src/lib/commercial/storage.ts";
import { callAiProvider, providerConfig } from "../src/lib/ai/provider.ts";

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

class TestD1Statement {
  private db: DatabaseSync;
  private sql: string;
  private values: any[];
  constructor(db: DatabaseSync, sql: string, values: any[] = []) { this.db = db; this.sql = sql; this.values = values; }
  bind(...values: any[]) { return new TestD1Statement(this.db, this.sql, values); }
  async first<T>() { return (this.db.prepare(this.sql).get(...this.values) as T | undefined) ?? null; }
  async run() {
    const result = this.db.prepare(this.sql).run(...this.values);
    return { meta: { changes: Number(result.changes) } };
  }
}

class TestD1Database {
  private db: DatabaseSync;
  constructor(db: DatabaseSync) { this.db = db; }
  prepare(sql: string) { return new TestD1Statement(this.db, sql); }
  async batch(statements: TestD1Statement[]) {
    this.db.exec("BEGIN");
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      this.db.exec("COMMIT");
      return results;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
}

const rowCapabilities = (row: { status: "active" | "suspended" | "ended" | "revoked"; ends_at: string | null }) =>
  capabilitiesForEntitlement({ status: row.status, endsAt: row.ends_at });

test("Batch 4 freezes server-side Free and Pro value contracts", () => {
  assert.equal(FREE_CAPABILITIES.focusedReview, false);
  assert.equal(FREE_CAPABILITIES.syncDevices, 1);
  assert.equal(FREE_CAPABILITIES.historyMaxEntries, 100);
  assert.equal(FREE_CAPABILITIES.aiMonthlyCredits, 0);

  assert.equal(PRO_CAPABILITIES.focusedReview, true);
  assert.equal(PRO_CAPABILITIES.syncDevices, 3);
  assert.equal(PRO_CAPABILITIES.historyMaxEntries, 10_000);
  assert.equal(PRO_CAPABILITIES.aiMonthlyCredits, 500);
  assert.equal(PRO_CAPABILITIES.aiRequestsPerHour, 10);
  assert.equal(PRO_CAPABILITIES.aiConcurrency, 1);
  assert.equal(aiCreditCost("explanation"), 1);
  assert.equal(aiCreditCost("study_plan"), 5);
});

test("Batch 4 revokes Pro on failed, expired, canceled and refunded lifecycle states", () => {
  const now = new Date("2026-08-25T00:00:00.000Z");
  const future = "2026-09-25T00:00:00.000Z";
  assert.equal(capabilitiesForEntitlement({ status: "active", endsAt: future }, now).tier, "pro");
  for (const status of ["past_due", "unpaid", "incomplete", "incomplete_expired", "paused", "canceled"] as const) {
    const entitlement = entitlementFromSubscription({ status, currentPeriodEnd: future, cancelAtPeriodEnd: false }, now);
    assert.equal(capabilitiesForEntitlement({ status: entitlement.status, endsAt: entitlement.endsAt ?? null }, now).tier, "free");
  }
  assert.equal(capabilitiesForEntitlement({ status: "active", endsAt: "2026-08-24T23:59:59.000Z" }, now).tier, "free");
  const refunded = entitlementFromSubscription({ status: "active", currentPeriodEnd: future, cancelAtPeriodEnd: false, revoked: true }, now);
  assert.equal(capabilitiesForEntitlement({ status: refunded.status, endsAt: refunded.endsAt ?? null }, now).tier, "free");
});

test("Batch 4 persists payment failure, terminal and refund revocation without deleting history", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE payment_events(event_id TEXT PRIMARY KEY,event_type TEXT,livemode INTEGER,payload_sha256 TEXT,processed_at TEXT,outcome TEXT,claim_token TEXT);`);
  const migration = await read("migrations/0015_batch2a_subscriptions.sql");
  db.exec(migration.slice(migration.indexOf("CREATE TABLE IF NOT EXISTS subscription_orders")));
  db.exec(`CREATE TABLE learning_history(id TEXT PRIMARY KEY,payload TEXT NOT NULL); INSERT INTO learning_history VALUES('history-1','preserve-me');`);
  const at = "2026-08-25T00:00:00.000Z";
  db.prepare(`INSERT INTO subscription_orders(id,owner_id,user_id,plan_id,amount_cents,currency,status,idempotency_key,provider_customer_id,provider_subscription_id,created_at,updated_at) VALUES(?,?,?,?,?,?,'completed',?,?,?,?,?)`)
    .run("order-1", "user:user-1", "user-1", "pro_monthly", 599, "usd", "idem-1", "cus_test_1", "sub_test_1", at, at);
  const env = { LEARNING_DB: new TestD1Database(db) as unknown as D1Database } as Pick<CloudflareEnv, "LEARNING_DB">;
  const subscription = (status: "active" | "canceled") => ({
    kind: "subscription_updated" as const,
    eventId: `evt_${status}`,
    subscriptionId: "sub_test_1",
    customerId: "cus_test_1",
    ownerId: "user:user-1",
    userId: "user-1",
    planId: "pro_monthly" as const,
    orderId: "order-1",
    status,
    cancelAtPeriodEnd: false,
    currentPeriodStart: at,
    currentPeriodEnd: "2099-09-25T00:00:00.000Z",
    amountCents: 599,
    currency: "usd",
  });
  const entitlement = () => db.prepare(`SELECT status,ends_at FROM subscription_entitlements WHERE owner_id='user:user-1'`).get() as { status: "active" | "suspended" | "ended" | "revoked"; ends_at: string | null };

  await applySubscriptionEvent(subscription("active"), env);
  assert.equal(rowCapabilities(entitlement()).tier, "pro");
  await applySubscriptionEvent({ kind: "invoice_payment_failed", eventId: "evt_failed", invoiceId: "in_failed", subscriptionId: "sub_test_1", customerId: "cus_test_1", amountCents: 599, currency: "usd" }, env);
  assert.equal(entitlement().status, "suspended");
  assert.equal(rowCapabilities(entitlement()).tier, "free");

  await applySubscriptionEvent(subscription("active"), env);
  await applySubscriptionEvent(subscription("canceled"), env);
  assert.equal(entitlement().status, "ended");
  assert.equal(rowCapabilities(entitlement()).tier, "free");

  await applySubscriptionEvent(subscription("active"), env);
  await applySubscriptionEvent({ kind: "invoice_paid", eventId: "evt_paid", invoiceId: "in_paid", subscriptionId: "sub_test_1", customerId: "cus_test_1", paymentIntentId: "pi_test_1", chargeId: "ch_test_1", amountCents: 599, currency: "usd", chargedAt: at }, env);
  await applySubscriptionEvent({ kind: "charge_refunded", eventId: "evt_refund", chargeId: "ch_test_1", paymentIntentId: "pi_test_1", amountRefundedCents: 599, currency: "usd", fullyRefunded: true }, env);
  assert.equal(entitlement().status, "revoked");
  assert.equal(rowCapabilities(entitlement()).tier, "free");
  assert.equal((db.prepare(`SELECT COUNT(*) count FROM learning_history WHERE id='history-1'`).get() as { count: number }).count, 1);
  await assert.rejects(claimPaymentEvent({ eventId: "evt_live", eventType: "invoice.paid", livemode: true, payloadSha256: "hash" }, env), /LIVE_EVENT_REJECTED/);
});

test("Batch 4 AI provider hard timeout covers request and response body", async () => {
  const config = providerConfig({
    DEEPSEEK_API_KEY: "test-secret",
    DEEPSEEK_BASE_URL: "https://api.deepseek.com",
    DEEPSEEK_MODEL: "deepseek-chat",
  } as CloudflareEnv)!;

  let requestAttempts = 0;
  await assert.rejects(
    callAiProvider(config, "trusted prompt", 100, async (_input, init) => {
      requestAttempts += 1;
      return await new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
      });
    }, 5),
    /AI_PROVIDER_TIMEOUT/,
  );
  assert.equal(requestAttempts, 2);

  let bodyAttempts = 0;
  await assert.rejects(
    callAiProvider(config, "trusted prompt", 100, async () => {
      bodyAttempts += 1;
      return new Response(new ReadableStream({ start() {} }), { status: 200 });
    }, 5),
    /AI_PROVIDER_TIMEOUT/,
  );
  assert.equal(bodyAttempts, 2);
});

test("Batch 4 settlement is success-only and failures release credits and concurrency", async () => {
  const [route, storage] = await Promise.all([
    read("src/app/api/v1/ai/route.ts"),
    read("src/lib/ai/storage.ts"),
  ]);
  assert.match(route, /if \(capabilities\.tier !== "pro"\)/);
  assert.match(route, /parseAiOutput\(feature, provider\.content\)/);
  assert.match(route, /await finalizeSuccess\(\{ operation, output/);
  assert.match(route, /catch \(error\)[\s\S]*await finalizeFailure\(operation, failureCode\)/);
  assert.match(storage, /UPDATE ai_quota_buckets SET reserved=reserved-\?,used=used\+\?/);
  assert.match(storage, /UPDATE ai_quota_buckets SET reserved=reserved-\?/);
  assert.match(storage, /status='reserved'/);
  assert.match(storage, /AI_REQUEST_IN_PROGRESS/);
  assert.match(storage, /AI_RATE_LIMITED/);
  assert.match(storage, /allowance=MAX\(excluded\.allowance,used\+reserved\)/);
});

test("Batch 4 downgrade changes projection and authorization without deleting learning history", async () => {
  const [sync, projection, commercial] = await Promise.all([
    read("src/lib/account/storage.ts"),
    read("src/lib/learning/projection.ts"),
    read("src/lib/commercial/storage.ts"),
  ]);
  assert.match(sync, /SYNC_DEVICE_LIMIT_REACHED/);
  assert.match(sync, /LIMIT \?/);
  assert.match(projection, /historyMaxEntries/);
  assert.doesNotMatch(commercial, /DELETE FROM (learning_|account_learning|attempts|mistakes|srs_cards)/i);
});

test("Batch 4 Focused Review is computed only when the resolved capability permits it", async () => {
  const learningRoute = await read("src/app/api/v1/learning/route.ts");
  assert.match(learningRoute, /const focusedReview = capabilities\.focusedReview/);
  assert.match(learningRoute, /openMistakeContent/);
  assert.match(learningRoute, /focusReason/);
});
