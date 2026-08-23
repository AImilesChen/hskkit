import { db } from "@/lib/learning/storage";
import { AI_DAILY_ALLOWANCE, AI_RATE_LIMIT_PER_MINUTE, type AiFeature, type AiOutput, type AiRuntimePolicy } from "./domain";

const defaultPolicy: AiRuntimePolicy = { dailyAllowance: AI_DAILY_ALLOWANCE, rateLimitPerMinute: AI_RATE_LIMIT_PER_MINUTE, maxOutputTokens: 500 };

export type AiOperation = {
  id: string;
  ownerId: string;
  feature: AiFeature;
  idempotencyKey: string;
  requestHash: string;
  status: "reserved" | "succeeded" | "failed";
  quotaPeriod: string;
  response?: AiOutput;
  failureCode?: string;
};

type OperationRow = {
  id: string; owner_id: string; feature: AiFeature; idempotency_key: string; request_hash: string;
  status: AiOperation["status"]; quota_period: string; response_json: string | null; failure_code: string | null;
};
type BucketRow = { allowance: number; used: number; reserved: number };

const periodKey = (now: Date) => now.toISOString().slice(0, 10);
const minuteFloor = (now: Date) => new Date(now.getTime() - 60_000).toISOString();
async function activeAccountOwner(ownerId: string) {
  if (!ownerId.startsWith("user:")) return true;
  const row = await (await db()).prepare("SELECT 1 AS ok FROM accounts WHERE user_id=? AND status='active'").bind(ownerId.slice(5)).first<{ ok: number }>();
  return row?.ok === 1;
}
const rowToOperation = (row: OperationRow): AiOperation => ({
  id: row.id, ownerId: row.owner_id, feature: row.feature, idempotencyKey: row.idempotency_key,
  requestHash: row.request_hash, status: row.status, quotaPeriod: row.quota_period,
  response: row.response_json ? JSON.parse(row.response_json) as AiOutput : undefined,
  failureCode: row.failure_code ?? undefined,
});

async function operationByKey(ownerId: string, feature: AiFeature, idempotencyKey: string) {
  const row = await (await db()).prepare("SELECT id,owner_id,feature,idempotency_key,request_hash,status,quota_period,response_json,failure_code FROM ai_operations WHERE owner_id=? AND feature=? AND idempotency_key=?")
    .bind(ownerId, feature, idempotencyKey).first<OperationRow>();
  return row ? rowToOperation(row) : undefined;
}

async function ensureBucket(ownerId: string, period: string, now: string, allowance: number) {
  await (await db()).prepare("INSERT INTO ai_quota_buckets(owner_id,period_key,allowance,used,reserved,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(owner_id,period_key) DO UPDATE SET allowance=excluded.allowance,updated_at=excluded.updated_at")
    .bind(ownerId, period, allowance, 0, 0, now).run();
}

async function releaseStale(ownerId: string, now: Date) {
  const database = await db();
  const cutoff = new Date(now.getTime() - 5 * 60_000).toISOString();
  const stale = await database.prepare("SELECT id,quota_period FROM ai_operations WHERE owner_id=? AND status='reserved' AND updated_at<? LIMIT 20").bind(ownerId, cutoff).all<{ id: string; quota_period: string }>();
  for (const item of stale.results) {
    const assertion = crypto.randomUUID();
    try {
      await database.batch([
        database.prepare("UPDATE ai_operations SET status='failed',failure_code='AI_RESERVATION_EXPIRED',updated_at=? WHERE id=? AND owner_id=? AND status='reserved'").bind(now.toISOString(), item.id, ownerId),
        database.prepare("INSERT INTO ai_quota_assertions(id,ok) VALUES(?,CASE changes() WHEN 1 THEN 1 ELSE 0 END)").bind(assertion),
        database.prepare("UPDATE ai_quota_buckets SET reserved=reserved-1,updated_at=? WHERE owner_id=? AND period_key=? AND reserved>0").bind(now.toISOString(), ownerId, item.quota_period),
        database.prepare("INSERT INTO ai_quota_assertions(id,ok) VALUES(?,CASE changes() WHEN 1 THEN 1 ELSE 0 END)").bind(`${assertion}:bucket`),
        database.prepare("DELETE FROM ai_quota_assertions WHERE id IN (?,?)").bind(assertion, `${assertion}:bucket`),
      ]);
    } catch { /* another finalizer won; leave its terminal state */ }
  }
}

const fixedPolicy = (policy: AiRuntimePolicy): AiRuntimePolicy => ({ ...policy, dailyAllowance: AI_DAILY_ALLOWANCE, rateLimitPerMinute: AI_RATE_LIMIT_PER_MINUTE });

export async function quotaView(ownerId: string, requestedPolicy = defaultPolicy, now = new Date()) {
  const policy = fixedPolicy(requestedPolicy);
  if (!await activeAccountOwner(ownerId)) {
    const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();
    return { period: periodKey(now), allowance: policy.dailyAllowance, used: 0, reserved: 0, remaining: 0, rateLimitPerMinute: policy.rateLimitPerMinute, recentRequests: 0, resetAt: reset, accountDeleted: true };
  }
  await releaseStale(ownerId, now);
  const period = periodKey(now);
  await ensureBucket(ownerId, period, now.toISOString(), policy.dailyAllowance);
  const database = await db();
  const bucket = await database.prepare("SELECT allowance,used,reserved FROM ai_quota_buckets WHERE owner_id=? AND period_key=?").bind(ownerId, period).first<BucketRow>();
  const minute = await database.prepare("SELECT COUNT(*) AS count FROM ai_operations WHERE owner_id=? AND created_at>=?").bind(ownerId, minuteFloor(now)).first<{ count: number }>();
  const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();
  const allowance = bucket?.allowance ?? policy.dailyAllowance;
  const used = bucket?.used ?? 0;
  const reserved = bucket?.reserved ?? 0;
  return { period, allowance, used, reserved, remaining: Math.max(0, allowance - used - reserved), rateLimitPerMinute: policy.rateLimitPerMinute, recentRequests: minute?.count ?? 0, resetAt: reset };
}

export async function reserveOperation(input: { ownerId: string; feature: AiFeature; idempotencyKey: string; requestHash: string; policy?: AiRuntimePolicy; now?: Date }) {
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
  const period = periodKey(now);
  const timestamp = now.toISOString();
  const id = crypto.randomUUID();
  const assertion = crypto.randomUUID();
  try {
    await database.batch([
      database.prepare("INSERT INTO ai_quota_buckets(owner_id,period_key,allowance,used,reserved,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(owner_id,period_key) DO UPDATE SET allowance=excluded.allowance,updated_at=excluded.updated_at").bind(input.ownerId, period, policy.dailyAllowance, 0, 0, timestamp),
      database.prepare("UPDATE ai_quota_buckets SET reserved=reserved+1,updated_at=? WHERE owner_id=? AND period_key=? AND reserved=0 AND used+reserved<allowance AND (SELECT COUNT(*) FROM ai_operations WHERE owner_id=? AND created_at>=?)<? AND (substr(?,1,5)!='user:' OR EXISTS(SELECT 1 FROM accounts WHERE user_id=substr(?,6) AND status='active'))")
        .bind(timestamp, input.ownerId, period, input.ownerId, minuteFloor(now), policy.rateLimitPerMinute, input.ownerId, input.ownerId),
      database.prepare("INSERT INTO ai_quota_assertions(id,ok) VALUES(?,CASE changes() WHEN 1 THEN 1 ELSE 0 END)").bind(assertion),
      database.prepare("INSERT INTO ai_operations(id,owner_id,feature,idempotency_key,request_hash,status,quota_period,cost_units,created_at,updated_at) VALUES(?,?,?,?,?,'reserved',?,1,?,?)")
        .bind(id, input.ownerId, input.feature, input.idempotencyKey, input.requestHash, period, timestamp, timestamp),
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
    if (quota.recentRequests >= policy.rateLimitPerMinute) throw new Error("AI_RATE_LIMITED");
    throw new Error("AI_RESERVATION_FAILED");
  }
  return { operation: { id, ownerId: input.ownerId, feature: input.feature, idempotencyKey: input.idempotencyKey, requestHash: input.requestHash, status: "reserved" as const, quotaPeriod: period }, replayed: false };
}

export async function finalizeSuccess(input: { operation: AiOperation; output: AiOutput; providerRequestId?: string; promptTokens?: number; completionTokens?: number; now?: Date }) {
  const database = await db();
  const now = (input.now ?? new Date()).toISOString();
  const assertion = crypto.randomUUID();
  try {
    await database.batch([
      database.prepare("UPDATE ai_operations SET status='succeeded',response_json=?,provider_request_id=?,prompt_tokens=?,completion_tokens=?,updated_at=? WHERE id=? AND owner_id=? AND status='reserved' AND (substr(?,1,5)!='user:' OR EXISTS(SELECT 1 FROM accounts WHERE user_id=substr(?,6) AND status='active'))")
        .bind(JSON.stringify(input.output), input.providerRequestId ?? null, input.promptTokens ?? null, input.completionTokens ?? null, now, input.operation.id, input.operation.ownerId, input.operation.ownerId, input.operation.ownerId),
      database.prepare("INSERT INTO ai_quota_assertions(id,ok) VALUES(?,CASE changes() WHEN 1 THEN 1 ELSE 0 END)").bind(assertion),
      database.prepare("UPDATE ai_quota_buckets SET reserved=reserved-1,used=used+1,updated_at=? WHERE owner_id=? AND period_key=? AND reserved>0 AND used<allowance")
        .bind(now, input.operation.ownerId, input.operation.quotaPeriod),
      database.prepare("INSERT INTO ai_quota_assertions(id,ok) VALUES(?,CASE changes() WHEN 1 THEN 1 ELSE 0 END)").bind(`${assertion}:bucket`),
      database.prepare("DELETE FROM ai_quota_assertions WHERE id IN (?,?)").bind(assertion, `${assertion}:bucket`),
    ]);
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
      database.prepare("UPDATE ai_quota_buckets SET reserved=reserved-1,updated_at=? WHERE owner_id=? AND period_key=? AND reserved>0").bind(now.toISOString(), operation.ownerId, operation.quotaPeriod),
      database.prepare("INSERT INTO ai_quota_assertions(id,ok) VALUES(?,CASE changes() WHEN 1 THEN 1 ELSE 0 END)").bind(`${assertion}:bucket`),
      database.prepare("DELETE FROM ai_quota_assertions WHERE id IN (?,?)").bind(assertion, `${assertion}:bucket`),
    ]);
  } catch {
    const current = await operationByKey(operation.ownerId, operation.feature, operation.idempotencyKey);
    if (current?.status === "failed" || current?.status === "succeeded") return current;
    throw new Error("AI_RELEASE_FAILED");
  }
}
