import { db } from "@/lib/learning/storage";
import { AI_DAILY_ALLOWANCE, AI_RATE_LIMIT_PER_MINUTE, type AiFeature, type AiOutput, type AiRuntimePolicy, type ProductAiRuntimePolicy } from "./domain";
import { aiCreditCost } from "../commercial/capabilities";

const defaultPolicy: AiRuntimePolicy = { dailyAllowance: AI_DAILY_ALLOWANCE, rateLimitPerMinute: AI_RATE_LIMIT_PER_MINUTE, maxOutputTokens: 500 };
type RuntimePolicy = AiRuntimePolicy | ProductAiRuntimePolicy;

export type AiOperation = {
  id: string;
  ownerId: string;
  feature: AiFeature;
  idempotencyKey: string;
  requestHash: string;
  status: "reserved" | "succeeded" | "failed";
  quotaPeriod: string;
  costUnits: number;
  baseAllowance: number;
  response?: AiOutput;
  failureCode?: string;
};

type OperationRow = {
  id: string; owner_id: string; feature: AiFeature; idempotency_key: string; request_hash: string;
  status: AiOperation["status"]; quota_period: string; cost_units: number; base_credit_allowance: number; response_json: string | null; failure_code: string | null;
};
type BucketRow = { allowance: number; used: number; reserved: number };

const isProductPolicy = (policy: RuntimePolicy): policy is ProductAiRuntimePolicy => "quotaPeriod" in policy;
const periodKey = (policy: RuntimePolicy, now: Date) => isProductPolicy(policy) ? now.toISOString().slice(0, 7) : now.toISOString().slice(0, 10);
const requestFloor = (policy: RuntimePolicy, now: Date) => new Date(now.getTime() - (isProductPolicy(policy) ? 3_600_000 : 60_000)).toISOString();
const allowanceFor = (policy: RuntimePolicy) => isProductPolicy(policy) ? policy.allowance : policy.dailyAllowance;
const baseAllowanceFor = (policy: RuntimePolicy) => isProductPolicy(policy) ? policy.baseAllowance : policy.dailyAllowance;
const rateLimitFor = (policy: RuntimePolicy) => isProductPolicy(policy) ? policy.rateLimitPerHour : policy.rateLimitPerMinute;
async function activeAccountOwner(ownerId: string) {
  if (!ownerId.startsWith("user:")) return true;
  const row = await (await db()).prepare("SELECT 1 AS ok FROM accounts WHERE user_id=? AND status='active'").bind(ownerId.slice(5)).first<{ ok: number }>();
  return row?.ok === 1;
}
const rowToOperation = (row: OperationRow): AiOperation => ({
  id: row.id, ownerId: row.owner_id, feature: row.feature, idempotencyKey: row.idempotency_key,
  requestHash: row.request_hash, status: row.status, quotaPeriod: row.quota_period, costUnits: Number(row.cost_units), baseAllowance: Number(row.base_credit_allowance),
  response: row.response_json ? JSON.parse(row.response_json) as AiOutput : undefined,
  failureCode: row.failure_code ?? undefined,
});

async function operationByKey(ownerId: string, feature: AiFeature, idempotencyKey: string) {
  const row = await (await db()).prepare("SELECT id,owner_id,feature,idempotency_key,request_hash,status,quota_period,credit_units AS cost_units,base_credit_allowance,response_json,failure_code FROM ai_operations WHERE owner_id=? AND feature=? AND idempotency_key=?")
    .bind(ownerId, feature, idempotencyKey).first<OperationRow>();
  return row ? rowToOperation(row) : undefined;
}

async function ensureBucket(ownerId: string, period: string, now: string, allowance: number) {
  await (await db()).prepare("INSERT INTO ai_quota_buckets(owner_id,period_key,allowance,used,reserved,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(owner_id,period_key) DO UPDATE SET allowance=MAX(ai_quota_buckets.allowance,excluded.allowance,used+reserved),updated_at=excluded.updated_at")
    .bind(ownerId, period, allowance, 0, 0, now).run();
}

async function releaseStale(ownerId: string, now: Date) {
  const database = await db();
  const cutoff = new Date(now.getTime() - 5 * 60_000).toISOString();
  const stale = await database.prepare("SELECT id,quota_period,credit_units AS cost_units FROM ai_operations WHERE owner_id=? AND status='reserved' AND updated_at<? LIMIT 20").bind(ownerId, cutoff).all<{ id: string; quota_period: string; cost_units: number }>();
  for (const item of stale.results) {
    const assertion = crypto.randomUUID();
    try {
      await database.batch([
        database.prepare("UPDATE ai_operations SET status='failed',failure_code='AI_RESERVATION_EXPIRED',updated_at=? WHERE id=? AND owner_id=? AND status='reserved'").bind(now.toISOString(), item.id, ownerId),
        database.prepare("INSERT INTO ai_quota_assertions(id,ok) VALUES(?,CASE changes() WHEN 1 THEN 1 ELSE 0 END)").bind(assertion),
        database.prepare("UPDATE ai_quota_buckets SET reserved=reserved-?,updated_at=? WHERE owner_id=? AND period_key=? AND reserved>=?").bind(item.cost_units, now.toISOString(), ownerId, item.quota_period, item.cost_units),
        database.prepare("INSERT INTO ai_quota_assertions(id,ok) VALUES(?,CASE changes() WHEN 1 THEN 1 ELSE 0 END)").bind(`${assertion}:bucket`),
        database.prepare("DELETE FROM ai_quota_assertions WHERE id IN (?,?)").bind(assertion, `${assertion}:bucket`),
      ]);
    } catch { /* another finalizer won; leave its terminal state */ }
  }
}

const fixedPolicy = (policy: RuntimePolicy): RuntimePolicy => isProductPolicy(policy) ? policy : { ...policy, dailyAllowance: AI_DAILY_ALLOWANCE, rateLimitPerMinute: AI_RATE_LIMIT_PER_MINUTE };

export async function quotaView(ownerId: string, requestedPolicy: RuntimePolicy = defaultPolicy, now = new Date()) {
  const policy = fixedPolicy(requestedPolicy);
  const allowanceConfigured = allowanceFor(policy);
  const reset = isProductPolicy(policy)
    ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString()
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();
  if (!await activeAccountOwner(ownerId)) {
    return { period: periodKey(policy, now), allowance: allowanceConfigured, used: 0, reserved: 0, remaining: 0, rateLimitPerMinute: policy.rateLimitPerMinute, rateLimitPerHour: isProductPolicy(policy) ? policy.rateLimitPerHour : null, recentRequests: 0, resetAt: reset, accountDeleted: true };
  }
  await releaseStale(ownerId, now);
  const period = periodKey(policy, now);
  await ensureBucket(ownerId, period, now.toISOString(), allowanceConfigured);
  const database = await db();
  const bucket = await database.prepare("SELECT allowance,used,reserved FROM ai_quota_buckets WHERE owner_id=? AND period_key=?").bind(ownerId, period).first<BucketRow>();
  const recent = await database.prepare("SELECT COUNT(*) AS count FROM ai_operations WHERE owner_id=? AND created_at>=?").bind(ownerId, requestFloor(policy, now)).first<{ count: number }>();
  const allowance = bucket?.allowance ?? allowanceConfigured;
  const used = bucket?.used ?? 0;
  const reserved = bucket?.reserved ?? 0;
  return { period, allowance, used, reserved, remaining: Math.max(0, allowance - used - reserved), rateLimitPerMinute: policy.rateLimitPerMinute, rateLimitPerHour: isProductPolicy(policy) ? policy.rateLimitPerHour : null, recentRequests: recent?.count ?? 0, resetAt: reset };
}

export async function reserveOperation(input: { ownerId: string; feature: AiFeature; idempotencyKey: string; requestHash: string; policy?: RuntimePolicy; now?: Date }) {
  const now = input.now ?? new Date();
  const policy = fixedPolicy(input.policy ?? defaultPolicy);
  if (!await activeAccountOwner(input.ownerId)) throw new Error("ACCOUNT_DELETED");
  await releaseStale(input.ownerId, now);
  const replay = await operationByKey(input.ownerId, input.feature, input.idempotencyKey);
  if (replay) {
    if (replay.requestHash !== input.requestHash) throw new Error("AI_IDEMPOTENCY_CONFLICT");
    return { operation: replay, replayed: true };
  }
  const database = await db();
  const period = periodKey(policy, now);
  const timestamp = now.toISOString();
  const id = crypto.randomUUID();
  const assertion = crypto.randomUUID();
  const costUnits = aiCreditCost(input.feature);
  const allowance = allowanceFor(policy);
  const baseAllowance = baseAllowanceFor(policy);
  const rateLimit = rateLimitFor(policy);
  try {
    await database.batch([
      database.prepare("INSERT INTO ai_quota_buckets(owner_id,period_key,allowance,used,reserved,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(owner_id,period_key) DO UPDATE SET allowance=MAX(ai_quota_buckets.allowance,excluded.allowance,used+reserved),updated_at=excluded.updated_at").bind(input.ownerId, period, allowance, 0, 0, timestamp),
      database.prepare("UPDATE ai_quota_buckets SET reserved=reserved+?,updated_at=? WHERE owner_id=? AND period_key=? AND reserved=0 AND used+reserved+?<=allowance AND (SELECT COUNT(*) FROM ai_operations WHERE owner_id=? AND created_at>=?)<? AND (substr(?,1,5)!='user:' OR EXISTS(SELECT 1 FROM accounts WHERE user_id=substr(?,6) AND status='active'))")
        .bind(costUnits, timestamp, input.ownerId, period, costUnits, input.ownerId, requestFloor(policy, now), rateLimit, input.ownerId, input.ownerId),
      database.prepare("INSERT INTO ai_quota_assertions(id,ok) VALUES(?,CASE changes() WHEN 1 THEN 1 ELSE 0 END)").bind(assertion),
      database.prepare("INSERT INTO ai_operations(id,owner_id,feature,idempotency_key,request_hash,status,quota_period,cost_units,credit_units,base_credit_allowance,created_at,updated_at) VALUES(?,?,?,?,?,'reserved',?,1,?,?,?,?)")
        .bind(id, input.ownerId, input.feature, input.idempotencyKey, input.requestHash, period, costUnits, baseAllowance, timestamp, timestamp),
      database.prepare("DELETE FROM ai_quota_assertions WHERE id=?").bind(assertion),
    ]);
  } catch {
    const raced = await operationByKey(input.ownerId, input.feature, input.idempotencyKey);
    if (raced) {
      if (raced.requestHash !== input.requestHash) throw new Error("AI_IDEMPOTENCY_CONFLICT");
      return { operation: raced, replayed: true };
    }
    const quota = await quotaView(input.ownerId, policy, now);
    if (quota.accountDeleted) throw new Error("ACCOUNT_DELETED");
    if (quota.reserved > 0) throw new Error("AI_REQUEST_IN_PROGRESS");
    if (quota.remaining <= 0) throw new Error("AI_QUOTA_EXHAUSTED");
    if (quota.recentRequests >= rateLimit) throw new Error("AI_RATE_LIMITED");
    throw new Error("AI_RESERVATION_FAILED");
  }
  return { operation: { id, ownerId: input.ownerId, feature: input.feature, idempotencyKey: input.idempotencyKey, requestHash: input.requestHash, status: "reserved" as const, quotaPeriod: period, costUnits, baseAllowance }, replayed: false };
}

export async function finalizeSuccess(input: { operation: AiOperation; output: AiOutput; providerRequestId?: string; promptTokens?: number; completionTokens?: number; now?: Date }) {
  const database = await db();
  const now = (input.now ?? new Date()).toISOString();
  const assertion = crypto.randomUUID();
  const welcomeAssertion = `${assertion}:welcome`;
  const [bucket, rollover] = await Promise.all([
    database.prepare("SELECT used FROM ai_quota_buckets WHERE owner_id=? AND period_key=?").bind(input.operation.ownerId, input.operation.quotaPeriod).first<{ used: number }>(),
    database.prepare("SELECT w.remaining_units,w.conversion_period,w.conversion_period_used FROM welcome_credit_rollovers w JOIN subscription_entitlements e ON e.owner_id=w.owner_id AND e.status='active' AND (e.ends_at IS NULL OR e.ends_at>?) WHERE w.owner_id=?").bind(now, input.operation.ownerId).first<{ remaining_units: number; conversion_period: string; conversion_period_used: number }>(),
  ]);
  const spendThreshold = input.operation.baseAllowance + (rollover?.conversion_period === input.operation.quotaPeriod ? Number(rollover.conversion_period_used) : 0);
  const bonusSpend = Math.min(input.operation.costUnits, Math.max(0, Number(bucket?.used ?? 0) + input.operation.costUnits - spendThreshold));
  const welcomeSpend = Math.min(bonusSpend, Number(rollover?.remaining_units ?? 0));
  const referralSpend = bonusSpend - welcomeSpend;
  const statements = [
    database.prepare("UPDATE ai_operations SET status='succeeded',response_json=?,provider_request_id=?,prompt_tokens=?,completion_tokens=?,updated_at=? WHERE id=? AND owner_id=? AND status='reserved' AND (substr(?,1,5)!='user:' OR EXISTS(SELECT 1 FROM accounts WHERE user_id=substr(?,6) AND status='active'))")
      .bind(JSON.stringify(input.output), input.providerRequestId ?? null, input.promptTokens ?? null, input.completionTokens ?? null, now, input.operation.id, input.operation.ownerId, input.operation.ownerId, input.operation.ownerId),
    database.prepare("INSERT INTO ai_quota_assertions(id,ok) VALUES(?,CASE changes() WHEN 1 THEN 1 ELSE 0 END)").bind(assertion),
    database.prepare("UPDATE ai_quota_buckets SET reserved=reserved-?,used=used+?,updated_at=? WHERE owner_id=? AND period_key=? AND reserved>=? AND used+?<=allowance")
      .bind(input.operation.costUnits, input.operation.costUnits, now, input.operation.ownerId, input.operation.quotaPeriod, input.operation.costUnits, input.operation.costUnits),
    database.prepare("INSERT INTO ai_quota_assertions(id,ok) VALUES(?,CASE changes() WHEN 1 THEN 1 ELSE 0 END)").bind(`${assertion}:bucket`),
  ];
  if (referralSpend > 0) statements.push(database.prepare("INSERT INTO credit_ledger(id,owner_id,units,source,reward_id,operation_id,expires_at,created_at) VALUES(?,?,?,'referral_spend',NULL,?,?,?)")
    .bind(crypto.randomUUID(), input.operation.ownerId, -referralSpend, input.operation.id, `${new Date(now).getUTCFullYear() + 1}-01-01T00:00:00.000Z`, now));
  if (welcomeSpend > 0) statements.push(
    database.prepare("UPDATE welcome_credit_rollovers SET remaining_units=remaining_units-? WHERE owner_id=? AND remaining_units>=? AND EXISTS(SELECT 1 FROM subscription_entitlements WHERE owner_id=? AND status='active' AND (ends_at IS NULL OR ends_at>?))").bind(welcomeSpend, input.operation.ownerId, welcomeSpend, input.operation.ownerId, now),
    database.prepare("INSERT INTO ai_quota_assertions(id,ok) VALUES(?,CASE changes() WHEN 1 THEN 1 ELSE 0 END)").bind(welcomeAssertion),
  );
  statements.push(database.prepare("DELETE FROM ai_quota_assertions WHERE id IN (?,?,?)").bind(assertion, `${assertion}:bucket`, welcomeAssertion));
  try {
    await database.batch(statements);
  } catch {
    if (!await activeAccountOwner(input.operation.ownerId)) throw new Error("ACCOUNT_DELETED");
    const current = await operationByKey(input.operation.ownerId, input.operation.feature, input.operation.idempotencyKey);
    if (current?.status === "succeeded") return current;
    throw new Error("AI_FINALIZE_FAILED");
  }
}

export async function finalizeFailure(operation: AiOperation, failureCode: string, now = new Date()) {
  const database = await db();
  const assertion = crypto.randomUUID();
  try {
    await database.batch([
      database.prepare("UPDATE ai_operations SET status='failed',failure_code=?,updated_at=? WHERE id=? AND owner_id=? AND status='reserved'").bind(failureCode.slice(0, 80), now.toISOString(), operation.id, operation.ownerId),
      database.prepare("INSERT INTO ai_quota_assertions(id,ok) VALUES(?,CASE changes() WHEN 1 THEN 1 ELSE 0 END)").bind(assertion),
      database.prepare("UPDATE ai_quota_buckets SET reserved=reserved-?,updated_at=? WHERE owner_id=? AND period_key=? AND reserved>=?").bind(operation.costUnits, now.toISOString(), operation.ownerId, operation.quotaPeriod, operation.costUnits),
      database.prepare("INSERT INTO ai_quota_assertions(id,ok) VALUES(?,CASE changes() WHEN 1 THEN 1 ELSE 0 END)").bind(`${assertion}:bucket`),
      database.prepare("DELETE FROM ai_quota_assertions WHERE id IN (?,?)").bind(assertion, `${assertion}:bucket`),
    ]);
  } catch {
    const current = await operationByKey(operation.ownerId, operation.feature, operation.idempotencyKey);
    if (current?.status === "failed" || current?.status === "succeeded") return current;
    throw new Error("AI_RELEASE_FAILED");
  }
}
