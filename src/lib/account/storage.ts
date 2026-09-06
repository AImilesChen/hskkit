import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { LearningState } from "../learning/domain";
import { loadState } from "../learning/storage";
import { listAllPlans } from "../planner/storage";
import { aiRuntimePolicy } from "../ai/domain";
import { AI_MERGE_BUCKET_SQL } from "../ai/merge";
import { createAuditEvent } from "./access-policy";
import { POLICY_AUDIT_SQL, policyAuditBindings } from "./audit-storage";
import {
  createDataRequest,
  mergeLearningStates,
  previewMerge,
  syncDecision,
  transitionDataRequest,
  type AccountDataRequest,
  type DataRequestAction,
  type DataRequestType,
} from "./domain";

export interface Account {
  userId: string;
  displayName: string;
  timezone: string;
  status: "active" | "deleted";
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

type AccountRow = {
  user_id: string;
  display_name: string;
  timezone: string;
  status: "active" | "deleted";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
type RequestRow = {
  id: string;
  type: DataRequestType;
  state: AccountDataRequest["state"];
  attempt: number;
  requested_at: string;
  updated_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  failure_code: string | null;
};
type AiMergeSnapshot = { operationCount: number; operationMax: string; bucketCount: number; bucketMax: string };

const db = () => getCloudflareContext().env.LEARNING_DB;
const now = () => new Date().toISOString();
const SESSION_TOUCH_INTERVAL_MS = 15 * 60_000;
const sessionTouchThreshold = (timestamp: string) => new Date(Date.parse(timestamp) - SESSION_TOUCH_INTERVAL_MS).toISOString();

async function stableSyncConflictId(userId: string, deviceId: string, clientRevision: number, serverRevision: number) {
  const input = new TextEncoder().encode(`${userId}\u0000${deviceId}\u0000${clientRevision}\u0000${serverRevision}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return `sync_conflict_${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
const ownerId = (userId: string) => `user:${userId}`;
const emptyLearningState = (): LearningState => ({ attempts: [], cards: [], mistakes: [], dailySessions: [] });
async function aiMergeSnapshot(owner: string): Promise<AiMergeSnapshot> {
  const row = await db().prepare("SELECT (SELECT COUNT(*) FROM ai_operations WHERE owner_id=?) AS operation_count,COALESCE((SELECT MAX(updated_at) FROM ai_operations WHERE owner_id=?),'') AS operation_max,(SELECT COUNT(*) FROM ai_quota_buckets WHERE owner_id=?) AS bucket_count,COALESCE((SELECT MAX(updated_at) FROM ai_quota_buckets WHERE owner_id=?),'') AS bucket_max")
    .bind(owner, owner, owner, owner).first<{ operation_count: number; operation_max: string; bucket_count: number; bucket_max: string }>();
  return { operationCount: Number(row?.operation_count ?? 0), operationMax: row?.operation_max ?? "", bucketCount: Number(row?.bucket_count ?? 0), bucketMax: row?.bucket_max ?? "" };
}
const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
function secret() { const bytes = crypto.getRandomValues(new Uint8Array(32)); return b64url(bytes); }
async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return b64url(new Uint8Array(digest));
}
function account(row: AccountRow): Account {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    timezone: row.timezone,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}
function request(row: RequestRow): AccountDataRequest {
  return {
    id: row.id,
    type: row.type,
    state: row.state,
    attempt: row.attempt,
    requestedAt: row.requested_at,
    updatedAt: row.updated_at,
    confirmedAt: row.confirmed_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    failureCode: row.failure_code ?? undefined,
  };
}
export function validTimezone(timezone: string) {
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }).format(new Date()); return true; }
  catch { return false; }
}

export async function createAccount(displayName: string, timezone: string) {
  if (!displayName.trim() || displayName.length > 60) throw new Error("INVALID_DISPLAY_NAME");
  if (!validTimezone(timezone)) throw new Error("INVALID_TIMEZONE");
  const userId = crypto.randomUUID();
  const syncKey = secret();
  const tokenHash = await hash(syncKey);
  const timestamp = now();
  const state = JSON.stringify(emptyLearningState());
  await db().batch([
    db().prepare("INSERT INTO accounts(user_id,display_name,timezone,status,created_at,updated_at) VALUES(?,?,?,'active',?,?)").bind(userId, displayName.trim(), timezone, timestamp, timestamp),
    db().prepare("INSERT INTO account_tokens(token_hash,user_id,created_at,last_used_at) VALUES(?,?,?,?)").bind(tokenHash, userId, timestamp, timestamp),
    db().prepare("INSERT INTO learning_states(owner_id,state_json,revision,updated_at) VALUES(?,?,0,?)").bind(ownerId(userId), state, timestamp),
    db().prepare("INSERT INTO account_audit(id,user_id,action,resource_type,resource_id,result,idempotency_key,created_at) VALUES(?,?,'account_created','account',?,'success',?,?)").bind(crypto.randomUUID(), userId, userId, `create:${userId}`, timestamp),
  ]);
  return { account: { userId, displayName: displayName.trim(), timezone, status: "active", createdAt: timestamp, updatedAt: timestamp } satisfies Account, syncKey };
}

export async function authenticateAccount(syncKey: string | undefined, touchSession = false) {
  if (!syncKey || syncKey.length < 20 || syncKey.length > 100) return undefined;
  const tokenHash = await hash(syncKey);
  const row = await db().prepare("SELECT a.* FROM account_tokens t JOIN accounts a ON a.user_id=t.user_id WHERE t.token_hash=? AND t.revoked_at IS NULL AND a.status='active'").bind(tokenHash).first<AccountRow>();
  if (!row) return undefined;
  const timestamp = now();
  if (touchSession) await db().prepare("UPDATE account_tokens SET last_used_at=? WHERE token_hash=? AND (last_used_at IS NULL OR last_used_at < ?)").bind(timestamp, tokenHash, sessionTouchThreshold(timestamp)).run().catch(() => undefined);
  return account(row);
}

export async function authenticateSession(sessionToken: string | undefined, touchSession = false) {
  if (!sessionToken || sessionToken.length < 20 || sessionToken.length > 100) return undefined;
  const tokenHash = await hash(sessionToken);
  const timestamp = now();
  const row = await db().prepare("SELECT a.* FROM account_sessions s JOIN accounts a ON a.user_id=s.user_id WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? AND a.status='active'").bind(tokenHash, timestamp).first<AccountRow>();
  if (!row) return undefined;
  if (touchSession) await db().prepare("UPDATE account_sessions SET last_used_at=? WHERE token_hash=? AND (last_used_at IS NULL OR last_used_at < ?)").bind(timestamp, tokenHash, sessionTouchThreshold(timestamp)).run().catch(() => undefined);
  return account(row);
}

export async function createAccountSession(userId: string) {
  const active = await db().prepare("SELECT 1 AS ok FROM accounts WHERE user_id=? AND status='active'").bind(userId).first<{ ok: number }>();
  if (!active) throw new Error("ACCOUNT_DELETED");
  const sessionToken = secret();
  const tokenHash = await hash(sessionToken);
  const timestamp = now();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString();
  await db().prepare("INSERT INTO account_sessions(token_hash,user_id,created_at,last_used_at,expires_at) VALUES(?,?,?,?,?)")
    .bind(tokenHash, userId, timestamp, timestamp, expiresAt).run();
  return { sessionToken, expiresAt };
}

export async function revokeAccountSession(sessionToken: string | undefined) {
  if (!sessionToken) return;
  const tokenHash = await hash(sessionToken);
  await db().prepare("UPDATE account_sessions SET revoked_at=? WHERE token_hash=? AND revoked_at IS NULL").bind(now(), tokenHash).run();
}

export async function upsertGoogleAccount(profile: { sub: string; name: string; email?: string; emailVerified: boolean }, timezone = "UTC") {
  if (!profile.sub || profile.sub.length > 255) throw new Error("GOOGLE_PROFILE_INVALID");
  if (!validTimezone(timezone)) timezone = "UTC";
  const existing = await db().prepare("SELECT a.* FROM account_oauth_identities i JOIN accounts a ON a.user_id=i.user_id WHERE i.provider='google' AND i.provider_subject=?").bind(profile.sub).first<AccountRow>();
  const timestamp = now();
  if (existing) {
    if (existing.status !== "active") throw new Error("ACCOUNT_DELETED");
    await db().batch([
      db().prepare("UPDATE account_oauth_identities SET email=?,email_verified=?,updated_at=? WHERE provider='google' AND provider_subject=?").bind(profile.email ?? null, profile.emailVerified ? 1 : 0, timestamp, profile.sub),
      db().prepare("INSERT OR IGNORE INTO account_audit(id,user_id,action,resource_type,resource_id,result,idempotency_key,created_at) VALUES(?,?,'google_login','account',?,'success',?,?)").bind(crypto.randomUUID(), existing.user_id, existing.user_id, `google-login:${profile.sub}:${timestamp}`, timestamp),
    ]);
    return account(existing);
  }
  const userId = crypto.randomUUID();
  const displayName = profile.name.trim().slice(0, 60) || "HSKKit learner";
  await db().batch([
    db().prepare("INSERT INTO accounts(user_id,display_name,timezone,status,created_at,updated_at) VALUES(?,?,?,'active',?,?)").bind(userId, displayName, timezone, timestamp, timestamp),
    db().prepare("INSERT INTO account_oauth_identities(id,user_id,provider,provider_subject,email,email_verified,created_at,updated_at) VALUES(?,?,'google',?,?,?,?,?)").bind(crypto.randomUUID(), userId, profile.sub, profile.email ?? null, profile.emailVerified ? 1 : 0, timestamp, timestamp),
    db().prepare("INSERT INTO learning_states(owner_id,state_json,revision,updated_at) VALUES(?,?,0,?)").bind(ownerId(userId), JSON.stringify(emptyLearningState()), timestamp),
    db().prepare("INSERT INTO account_audit(id,user_id,action,resource_type,resource_id,result,idempotency_key,created_at) VALUES(?,?,'google_account_created','account',?,'success',?,?)").bind(crypto.randomUUID(), userId, userId, `google-create:${profile.sub}`, timestamp),
  ]);
  return { userId, displayName, timezone, status: "active", createdAt: timestamp, updatedAt: timestamp } satisfies Account;
}

export async function rotateSyncKey(userId: string) {
  const accountRow = await getAccount(userId);
  if (!accountRow || accountRow.status !== "active") throw new Error("ACCOUNT_REQUIRED");
  const syncKey = secret();
  const tokenHash = await hash(syncKey);
  const timestamp = now();
  await db().batch([
    db().prepare("UPDATE account_tokens SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL").bind(timestamp, userId),
    db().prepare("INSERT INTO account_tokens(token_hash,user_id,label,created_at,last_used_at) VALUES(?,?,'recovery-key',?,?)").bind(tokenHash, userId, timestamp, timestamp),
    db().prepare("INSERT INTO account_audit(id,user_id,action,resource_type,resource_id,result,idempotency_key,created_at) VALUES(?,?,'sync_key_rotated','account',?,'success',?,?)").bind(crypto.randomUUID(), userId, userId, `sync-key-rotate:${timestamp}`, timestamp),
  ]);
  return { syncKey };
}

export async function revokeSyncKeys(userId: string) {
  const timestamp = now();
  await db().batch([
    db().prepare("UPDATE account_tokens SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL").bind(timestamp, userId),
    db().prepare("INSERT INTO account_audit(id,user_id,action,resource_type,resource_id,result,idempotency_key,created_at) VALUES(?,?,'sync_keys_revoked','account',?,'success',?,?)").bind(crypto.randomUUID(), userId, userId, `sync-key-revoke:${timestamp}`, timestamp),
  ]);
  return { state: "revoked" as const };
}

export async function updateTimezone(userId: string, timezone: string) {
  if (!validTimezone(timezone)) throw new Error("INVALID_TIMEZONE");
  const timestamp = now();
  await db().batch([
    db().prepare("UPDATE accounts SET timezone=?,updated_at=? WHERE user_id=? AND status='active'").bind(timezone, timestamp, userId),
    db().prepare("INSERT INTO account_audit(id,user_id,action,resource_type,resource_id,result,idempotency_key,created_at) VALUES(?,?,'timezone_updated','account',?,'success',?,?)").bind(crypto.randomUUID(), userId, userId, `timezone:${timezone}:${timestamp}`, timestamp),
  ]);
  return getAccount(userId);
}

export async function getAccount(userId: string) {
  const row = await db().prepare("SELECT * FROM accounts WHERE user_id=?").bind(userId).first<AccountRow>();
  return row ? account(row) : undefined;
}

export async function createMergePreview(userId: string, guestOwnerId: string) {
  const existing = await db().prepare("SELECT * FROM guest_merges WHERE user_id=? AND guest_owner_id=?").bind(userId, guestOwnerId).first<any>();
  if (existing?.state === "confirmed") throw new Error("GUEST_ALREADY_MERGED");
  const [accountState, guestState, accountPlans, guestPlans, accountAi, guestAi] = await Promise.all([
    loadState(ownerId(userId)), loadState(guestOwnerId), listAllPlans(ownerId(userId)), listAllPlans(guestOwnerId), aiMergeSnapshot(ownerId(userId)), aiMergeSnapshot(guestOwnerId),
  ]);
  const guestHasLearningData = guestState.state.attempts.length > 0
    || guestState.state.dailySessions.length > 0
    || (guestState.state.placementSessions?.length ?? 0) > 0
    || (guestState.state.placementResults?.length ?? 0) > 0
    || (guestState.state.practiceSessions?.length ?? 0) > 0
    || (guestState.state.questionReports?.length ?? 0) > 0;
  if (!guestHasLearningData && guestPlans.length === 0 && guestAi.operationCount === 0 && guestAi.bucketCount === 0) throw new Error("NO_GUEST_DATA");
  const preview = previewMerge(accountState.state, guestState.state);
  const storedPreview = { ...preview, plannerVersions: guestPlans.length, accountPlannerCount: accountPlans.length, accountPlannerMax: accountPlans[0]?.version ?? 0, guestPlannerCount: guestPlans.length, guestPlannerMax: guestPlans[0]?.version ?? 0, accountAi, guestAi };
  const id = existing?.id ?? crypto.randomUUID();
  const mergeKey = secret();
  const mergeTokenHash = await hash(mergeKey);
  const timestamp = now();
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
  const database = db();
  const assertionId = crypto.randomUUID();
  const mutation = existing
    ? database.prepare("UPDATE guest_merges SET merge_token_hash=?,state='previewed',preview_json=?,account_revision=?,guest_revision=?,updated_at=?,expires_at=? WHERE id=? AND user_id=? AND state!='confirmed'")
      .bind(mergeTokenHash, JSON.stringify(storedPreview), accountState.revision, guestState.revision, timestamp, expiresAt, id, userId)
    : database.prepare("INSERT INTO guest_merges(id,user_id,guest_owner_id,merge_token_hash,state,preview_json,account_revision,guest_revision,created_at,updated_at,expires_at) VALUES(?,?,?,?,'previewed',?,?,?,?,?,?)")
      .bind(id, userId, guestOwnerId, mergeTokenHash, JSON.stringify(storedPreview), accountState.revision, guestState.revision, timestamp, timestamp, expiresAt);
  const policyAudit = createAuditEvent({ subjectId: ownerId(userId), action: "merge_preview", resourceType: "account", resourceId: id, result: "success", idempotencyKey: `merge-preview:${id}:${timestamp}`, createdAt: timestamp, metadata: { conflicts: preview.conflicts, additions: preview.additions } });
  try {
    await database.batch([
      database.prepare("INSERT INTO account_cas_assertions(id,ok) VALUES(?, CASE WHEN EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND status='active') AND (?=0 OR EXISTS(SELECT 1 FROM guest_merges WHERE id=? AND user_id=? AND state!='confirmed')) THEN 1 ELSE 0 END)").bind(assertionId, userId, existing ? 1 : 0, id, userId),
      mutation,
      database.prepare("INSERT INTO account_audit(id,user_id,action,resource_type,resource_id,result,metadata_json,idempotency_key,created_at) VALUES(?,?,'guest_merge_previewed','guest_merge',?,'success',?,?,?)").bind(crypto.randomUUID(), userId, id, JSON.stringify({ conflicts: preview.conflicts, additions: preview.additions }), `merge-preview:${id}:${timestamp}`, timestamp),
      database.prepare(POLICY_AUDIT_SQL).bind(...policyAuditBindings(policyAudit)),
      database.prepare("DELETE FROM account_cas_assertions WHERE id=?").bind(assertionId),
    ]);
  } catch (error) {
    if (String(error).includes("account_cas_assertions") || String(error).includes("CHECK constraint")) throw new Error("GUEST_ALREADY_MERGED");
    throw error;
  }
  return { id, state: "previewed", preview: { ...preview, plannerVersions: guestPlans.length }, mergeKey, expiresAt };
}

export async function closeMerge(userId: string, mergeId: string, mergeKey: string, action: "confirm" | "cancel") {
  const row = await db().prepare("SELECT * FROM guest_merges WHERE id=? AND user_id=?").bind(mergeId, userId).first<any>();
  if (!row || row.merge_token_hash !== await hash(mergeKey)) throw new Error("MERGE_NOT_FOUND");
  if (row.state !== "previewed") throw new Error(row.state === "confirmed" ? "GUEST_ALREADY_MERGED" : "MERGE_ALREADY_CLOSED");
  if (Date.parse(row.expires_at) <= Date.now()) {
    await db().prepare("UPDATE guest_merges SET state='expired',updated_at=? WHERE id=? AND state='previewed'").bind(now(), mergeId).run();
    throw new Error("MERGE_EXPIRED");
  }
  const timestamp = now();
  if (action === "cancel") {
    const assertionId = crypto.randomUUID();
    await db().batch([
      db().prepare("INSERT INTO account_cas_assertions(id,ok) VALUES(?, CASE WHEN EXISTS(SELECT 1 FROM guest_merges WHERE id=? AND user_id=? AND state='previewed' AND merge_token_hash=?) AND EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND status='active') THEN 1 ELSE 0 END)").bind(assertionId, mergeId, userId, row.merge_token_hash, userId),
      db().prepare("UPDATE guest_merges SET state='cancelled',updated_at=? WHERE id=? AND state='previewed'").bind(timestamp, mergeId),
      db().prepare("INSERT INTO account_audit(id,user_id,action,resource_type,resource_id,result,idempotency_key,created_at) VALUES(?,?,'guest_merge_cancelled','guest_merge',?,'success',?,?)").bind(crypto.randomUUID(), userId, mergeId, `merge-cancel:${mergeId}`, timestamp),
      db().prepare(POLICY_AUDIT_SQL).bind(...policyAuditBindings(createAuditEvent({ subjectId: ownerId(userId), action: "merge_cancel", resourceType: "account", resourceId: mergeId, result: "success", idempotencyKey: `merge-cancel:${mergeId}`, createdAt: timestamp }))),
      db().prepare("DELETE FROM account_cas_assertions WHERE id=?").bind(assertionId),
    ]);
    return { state: "cancelled" as const };
  }
  const [accountState, guestState] = await Promise.all([loadState(ownerId(userId)), loadState(row.guest_owner_id)]);
  if (accountState.revision !== row.account_revision || guestState.revision !== row.guest_revision) throw new Error("MERGE_PREVIEW_STALE");
  const merged = mergeLearningStates(accountState.state, guestState.state, ownerId(userId));
  const plannerSnapshot = JSON.parse(row.preview_json) as { accountPlannerMax?: number; accountPlannerCount?: number; guestPlannerMax?: number; guestPlannerCount?: number; accountAi?: AiMergeSnapshot; guestAi?: AiMergeSnapshot };
  const accountPlanVersion = Number(plannerSnapshot.accountPlannerMax ?? -1);
  const accountPlanCount = Number(plannerSnapshot.accountPlannerCount ?? -1);
  const guestPlanVersion = Number(plannerSnapshot.guestPlannerMax ?? -1);
  const guestPlanCount = Number(plannerSnapshot.guestPlannerCount ?? -1);
  if (!plannerSnapshot.accountAi || !plannerSnapshot.guestAi) throw new Error("MERGE_PREVIEW_STALE");
  const [accountPlanNow, guestPlanNow, accountAiNow, guestAiNow] = await Promise.all([
    db().prepare("SELECT COALESCE(MAX(version),0) AS max_version, COUNT(*) AS plan_count FROM study_plan_versions WHERE owner_id=?").bind(ownerId(userId)).first<{ max_version: number; plan_count: number }>(),
    db().prepare("SELECT COALESCE(MAX(version),0) AS max_version, COUNT(*) AS plan_count FROM study_plan_versions WHERE owner_id=?").bind(row.guest_owner_id).first<{ max_version: number; plan_count: number }>(),
    aiMergeSnapshot(ownerId(userId)), aiMergeSnapshot(row.guest_owner_id),
  ]);
  if (Number(accountPlanNow?.max_version ?? 0) !== accountPlanVersion || Number(accountPlanNow?.plan_count ?? 0) !== accountPlanCount || Number(guestPlanNow?.max_version ?? 0) !== guestPlanVersion || Number(guestPlanNow?.plan_count ?? 0) !== guestPlanCount || JSON.stringify(accountAiNow) !== JSON.stringify(plannerSnapshot.accountAi) || JSON.stringify(guestAiNow) !== JSON.stringify(plannerSnapshot.guestAi)) throw new Error("MERGE_PREVIEW_STALE");
  const assertionId = crypto.randomUUID();
  const aiAllowance = aiRuntimePolicy(getCloudflareContext().env).dailyAllowance;
  try {
    await db().batch([
    db().prepare("INSERT INTO account_cas_assertions(id,ok) VALUES(?,CASE WHEN (SELECT COUNT(*) FROM ai_operations WHERE owner_id=?)=? AND COALESCE((SELECT MAX(updated_at) FROM ai_operations WHERE owner_id=?),'')=? AND (SELECT COUNT(*) FROM ai_quota_buckets WHERE owner_id=?)=? AND COALESCE((SELECT MAX(updated_at) FROM ai_quota_buckets WHERE owner_id=?),'')=? AND (SELECT COUNT(*) FROM ai_operations WHERE owner_id=?)=? AND COALESCE((SELECT MAX(updated_at) FROM ai_operations WHERE owner_id=?),'')=? AND (SELECT COUNT(*) FROM ai_quota_buckets WHERE owner_id=?)=? AND COALESCE((SELECT MAX(updated_at) FROM ai_quota_buckets WHERE owner_id=?),'')=? THEN 1 ELSE 0 END)")
      .bind(`${assertionId}:ai`, ownerId(userId), plannerSnapshot.accountAi.operationCount, ownerId(userId), plannerSnapshot.accountAi.operationMax, ownerId(userId), plannerSnapshot.accountAi.bucketCount, ownerId(userId), plannerSnapshot.accountAi.bucketMax, row.guest_owner_id, plannerSnapshot.guestAi.operationCount, row.guest_owner_id, plannerSnapshot.guestAi.operationMax, row.guest_owner_id, plannerSnapshot.guestAi.bucketCount, row.guest_owner_id, plannerSnapshot.guestAi.bucketMax),
    db().prepare("INSERT INTO account_cas_assertions(id,ok) VALUES(?, CASE WHEN COALESCE((SELECT revision FROM learning_states WHERE owner_id=?),0)=? AND COALESCE((SELECT revision FROM learning_states WHERE owner_id=?),0)=? AND COALESCE((SELECT MAX(version) FROM study_plan_versions WHERE owner_id=?),0)=? AND (SELECT COUNT(*) FROM study_plan_versions WHERE owner_id=?)=? AND COALESCE((SELECT MAX(version) FROM study_plan_versions WHERE owner_id=?),0)=? AND (SELECT COUNT(*) FROM study_plan_versions WHERE owner_id=?)=? AND EXISTS(SELECT 1 FROM guest_merges WHERE id=? AND user_id=? AND state='previewed' AND merge_token_hash=? AND expires_at>?) AND EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND status='active') THEN 1 ELSE 0 END)").bind(assertionId, ownerId(userId), accountState.revision, row.guest_owner_id, guestState.revision, ownerId(userId), accountPlanVersion, ownerId(userId), accountPlanCount, row.guest_owner_id, guestPlanVersion, row.guest_owner_id, guestPlanCount, mergeId, userId, row.merge_token_hash, timestamp, userId),
    db().prepare("UPDATE learning_states SET state_json=?,revision=revision+1,updated_at=? WHERE owner_id=? AND revision=?").bind(JSON.stringify(merged.state), timestamp, ownerId(userId), accountState.revision),
    db().prepare("DELETE FROM learning_states WHERE owner_id=? AND revision=?").bind(row.guest_owner_id, guestState.revision),
    db().prepare("DELETE FROM step7_playback_tickets WHERE owner_id=?").bind(row.guest_owner_id),
    db().prepare("INSERT INTO ai_operations(id,owner_id,feature,idempotency_key,request_hash,status,quota_period,cost_units,response_json,failure_code,provider_request_id,prompt_tokens,completion_tokens,created_at,updated_at) SELECT 'merged-ai:'||?||':'||id,?,feature,'merge:'||?||':'||id,request_hash,CASE WHEN status='reserved' THEN 'failed' ELSE status END,quota_period,cost_units,CASE WHEN status='reserved' THEN NULL ELSE response_json END,CASE WHEN status='reserved' THEN 'AI_MERGED_BEFORE_COMPLETION' ELSE failure_code END,provider_request_id,prompt_tokens,completion_tokens,created_at,updated_at FROM ai_operations WHERE owner_id=?")
      .bind(userId, ownerId(userId), row.merge_token_hash, row.guest_owner_id),
    db().prepare(AI_MERGE_BUCKET_SQL).bind(ownerId(userId), aiAllowance, aiAllowance, timestamp, row.guest_owner_id),
    db().prepare("DELETE FROM ai_operations WHERE owner_id=?").bind(row.guest_owner_id),
    db().prepare("DELETE FROM ai_quota_buckets WHERE owner_id=?").bind(row.guest_owner_id),
    db().prepare("INSERT INTO study_plan_versions(id,owner_id,version,parent_version,status,goal_level,target_date,weekly_minutes,preferred_days_json,weak_points_json,srs_load_json,warnings_json,sessions_json,signals_json,adjustment_reasons_json,idempotency_key,created_at) SELECT 'merged:'||?||':'||id,?,version+?,CASE WHEN parent_version IS NULL THEN NULL ELSE parent_version+? END,CASE WHEN ?>0 THEN 'superseded' ELSE status END,goal_level,target_date,weekly_minutes,preferred_days_json,weak_points_json,srs_load_json,warnings_json,sessions_json,signals_json,adjustment_reasons_json,'merge:'||?||':'||id,created_at FROM study_plan_versions WHERE owner_id=? ORDER BY version").bind(userId, ownerId(userId), accountPlanVersion, accountPlanVersion, accountPlanCount, row.merge_token_hash, row.guest_owner_id),
    db().prepare("DELETE FROM study_plan_versions WHERE owner_id=?").bind(row.guest_owner_id),
    db().prepare("UPDATE guest_merges SET state='confirmed',updated_at=? WHERE id=? AND state='previewed'").bind(timestamp, mergeId),
    db().prepare("INSERT INTO account_audit(id,user_id,action,resource_type,resource_id,result,metadata_json,idempotency_key,created_at) VALUES(?,?,'guest_merge_confirmed','guest_merge',?,'success',?,?,?)").bind(crypto.randomUUID(), userId, mergeId, JSON.stringify({ conflicts: merged.conflicts }), `merge-confirm:${mergeId}`, timestamp),
    db().prepare(POLICY_AUDIT_SQL).bind(...policyAuditBindings(createAuditEvent({ subjectId: ownerId(userId), action: "merge_confirm", resourceType: "account", resourceId: mergeId, result: "success", idempotencyKey: `merge-confirm:${mergeId}`, createdAt: timestamp, metadata: { conflicts: merged.conflicts } }))),
    db().prepare("DELETE FROM account_cas_assertions WHERE id IN (?,?)").bind(assertionId, `${assertionId}:ai`),
    ]);
  } catch (error) {
    if (String(error).includes("account_cas_assertions") || String(error).includes("CHECK constraint")) throw new Error("MERGE_PREVIEW_STALE");
    throw error;
  }
  return { state: "confirmed" as const, revision: accountState.revision + 1, conflicts: merged.conflicts };
}

export async function registerSyncDevice(userId: string, deviceId: string, limit: number) {
  if (!deviceId || deviceId.length > 80) throw new Error("INVALID_DEVICE_ID");
  const database = db();
  const timestamp = now();
  await database.prepare("UPDATE account_devices SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL AND device_id NOT IN (SELECT device_id FROM account_devices WHERE user_id=? AND revoked_at IS NULL ORDER BY first_seen_at ASC,device_id ASC LIMIT ?)").bind(timestamp, userId, userId, limit).run();
  const existing = await database.prepare("SELECT device_id FROM account_devices WHERE user_id=? AND device_id=? AND revoked_at IS NULL").bind(userId, deviceId).first<{ device_id: string }>();
  if (existing) {
    await database.prepare("UPDATE account_devices SET last_seen_at=? WHERE user_id=? AND device_id=? AND revoked_at IS NULL").bind(timestamp, userId, deviceId).run();
    return { deviceId, active: true, limit, existing: true };
  }
  const assertion = crypto.randomUUID();
  try {
    await database.batch([
      database.prepare("INSERT INTO account_devices(user_id,device_id,first_seen_at,last_seen_at,revoked_at) SELECT ?,?,?,?,NULL WHERE (SELECT COUNT(*) FROM account_devices WHERE user_id=? AND revoked_at IS NULL)<? ON CONFLICT(user_id,device_id) DO UPDATE SET last_seen_at=excluded.last_seen_at,revoked_at=NULL WHERE (SELECT COUNT(*) FROM account_devices WHERE user_id=excluded.user_id AND revoked_at IS NULL)<?").bind(userId, deviceId, timestamp, timestamp, userId, limit, limit),
      database.prepare("INSERT INTO entitlement_limit_assertions(id,ok) VALUES(?,CASE changes() WHEN 1 THEN 1 ELSE 0 END)").bind(assertion),
      database.prepare("DELETE FROM entitlement_limit_assertions WHERE id=?").bind(assertion),
    ]);
  } catch {
    const active = await database.prepare("SELECT COUNT(*) count FROM account_devices WHERE user_id=? AND revoked_at IS NULL").bind(userId).first<{ count: number }>();
    if (Number(active?.count ?? 0) >= limit) throw new Error("SYNC_DEVICE_LIMIT_REACHED");
    throw new Error("SYNC_DEVICE_REGISTRATION_FAILED");
  }
  return { deviceId, active: true, limit, existing: false };
}

export async function listSyncDevices(userId: string) {
  const rows = await db().prepare("SELECT device_id,first_seen_at,last_seen_at FROM account_devices WHERE user_id=? AND revoked_at IS NULL ORDER BY last_seen_at DESC").bind(userId).all();
  return rows.results;
}

export async function revokeSyncDevice(userId: string, deviceId: string) {
  await db().prepare("UPDATE account_devices SET revoked_at=? WHERE user_id=? AND device_id=? AND revoked_at IS NULL").bind(now(), userId, deviceId).run();
}

export async function syncCheckpoint(userId: string, clientRevision: number, deviceId: string) {
  if (!Number.isInteger(clientRevision) || clientRevision < 0) throw new Error("INVALID_REVISION");
  if (!deviceId || deviceId.length > 80) throw new Error("INVALID_DEVICE_ID");
  const loaded = await loadState(ownerId(userId));
  const decision = syncDecision(loaded.revision, clientRevision, deviceId);
  if (decision.state === "conflict") {
    const existing = await db().prepare("SELECT id FROM sync_conflicts WHERE user_id=? AND device_id=? AND client_revision=? AND server_revision=? AND state='open'")
      .bind(userId, deviceId, clientRevision, loaded.revision).first<{ id: string }>();
    if (existing) return { ...decision, conflictId: existing.id, snapshot: loaded.state };
    const id = await stableSyncConflictId(userId, deviceId, clientRevision, loaded.revision);
    const timestamp = now();
    await db().batch([
      db().prepare("INSERT OR IGNORE INTO sync_conflicts(id,user_id,device_id,client_revision,server_revision,state,created_at) VALUES(?,?,?,?,?,'open',?)").bind(id, userId, deviceId, clientRevision, loaded.revision, timestamp),
      db().prepare("INSERT OR IGNORE INTO account_audit(id,user_id,action,resource_type,resource_id,result,metadata_json,idempotency_key,created_at) VALUES(?,?,'sync_conflict','sync_conflict',?,'conflict',?,?,?)").bind(id, userId, id, JSON.stringify({ clientRevision, serverRevision: loaded.revision }), `sync-conflict:${id}`, timestamp),
      db().prepare(POLICY_AUDIT_SQL).bind(...policyAuditBindings(createAuditEvent({ subjectId: ownerId(userId), action: "account_sync", resourceType: "account", resourceId: id, result: "conflict", idempotencyKey: `sync-conflict:${id}`, createdAt: timestamp, metadata: { clientRevision, serverRevision: loaded.revision } }))),
    ]);
    return { ...decision, conflictId: id, snapshot: loaded.state };
  }
  return { ...decision, snapshot: loaded.state };
}

export async function listSyncConflicts(userId: string) {
  const rows = await db().prepare("SELECT id,device_id,client_revision,server_revision,state,created_at,resolved_at FROM sync_conflicts WHERE user_id=? ORDER BY created_at DESC LIMIT 20").bind(userId).all();
  return rows.results;
}

export async function audit(userId: string, action: string, resourceType: string, resourceId: string, result: string, idempotencyKey: string, metadata: Record<string, unknown> = {}) {
  await db().prepare("INSERT OR IGNORE INTO account_audit(id,user_id,action,resource_type,resource_id,result,metadata_json,idempotency_key,created_at) VALUES(?,?,?,?,?,?,?,?,?)")
    .bind(crypto.randomUUID(), userId, action, resourceType, resourceId, result, JSON.stringify(metadata), idempotencyKey, now()).run();
}

export async function createAccountDataRequest(userId: string, type: DataRequestType, idempotencyKey: string) {
  if (!idempotencyKey || idempotencyKey.length > 80) throw new Error("INVALID_IDEMPOTENCY_KEY");
  const existing = await db().prepare("SELECT * FROM account_data_requests WHERE user_id=? AND type=? AND idempotency_key=?").bind(userId, type, idempotencyKey).first<RequestRow>();
  if (existing) return request(existing);
  const value = createDataRequest(crypto.randomUUID(), type, now());
  await db().batch([
    db().prepare("INSERT INTO account_data_requests(id,user_id,type,state,attempt,requested_at,updated_at,idempotency_key) VALUES(?,?,?,?,?,?,?,?)").bind(value.id, userId, value.type, value.state, value.attempt, value.requestedAt, value.updatedAt, idempotencyKey),
    db().prepare("INSERT INTO account_audit(id,user_id,action,resource_type,resource_id,result,idempotency_key,created_at) VALUES(?,?,?,'account_data_request',?,'success',?,?)").bind(crypto.randomUUID(), userId, `${type}_requested`, value.id, `${type}-request:${idempotencyKey}`, value.requestedAt),
  ]);
  return value;
}

export async function listAccountDataRequests(userId: string) {
  const result = await db().prepare("SELECT * FROM account_data_requests WHERE user_id=? ORDER BY requested_at DESC LIMIT 50").bind(userId).all<RequestRow>();
  return result.results.map(request);
}

export async function getAccountDataRequest(userId: string, requestId: string) {
  const row = await db().prepare("SELECT * FROM account_data_requests WHERE id=? AND user_id=?").bind(requestId, userId).first<RequestRow & { result_json: string | null; expires_at: string | null }>();
  return row ? { ...request(row), resultJson: row.result_json, expiresAt: row.expires_at } : undefined;
}

async function persistTransition(userId: string, current: AccountDataRequest, action: DataRequestAction, failureCode?: string) {
  const next = transitionDataRequest(current, action, now(), failureCode);
  const assertionId = crypto.randomUUID();
  await db().batch([
    db().prepare("INSERT INTO account_cas_assertions(id,ok) VALUES(?, CASE WHEN EXISTS(SELECT 1 FROM account_data_requests WHERE id=? AND user_id=? AND state=?) AND EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND status='active') THEN 1 ELSE 0 END)").bind(assertionId, next.id, userId, current.state, userId),
    db().prepare("UPDATE account_data_requests SET state=?,attempt=?,updated_at=?,confirmed_at=?,completed_at=?,failure_code=? WHERE id=? AND user_id=? AND state=?")
      .bind(next.state, next.attempt, next.updatedAt, next.confirmedAt ?? null, next.completedAt ?? null, next.failureCode ?? null, next.id, userId, current.state),
    db().prepare("INSERT INTO account_audit(id,user_id,action,resource_type,resource_id,result,metadata_json,idempotency_key,created_at) VALUES(?,?,?,?,?,?,?,?,?)")
      .bind(crypto.randomUUID(), userId, `${next.type}_${action}`, "account_data_request", next.id, next.state, JSON.stringify({ from: current.state, to: next.state, failureCode }), `${next.id}:${action}:${current.attempt}`, next.updatedAt),
    db().prepare("DELETE FROM account_cas_assertions WHERE id=?").bind(assertionId),
  ]);
  return next;
}

export async function actOnDataRequest(userId: string, requestId: string, action: DataRequestAction) {
  const row = await db().prepare("SELECT * FROM account_data_requests WHERE id=? AND user_id=?").bind(requestId, userId).first<RequestRow>();
  if (!row) throw new Error("REQUEST_NOT_FOUND");
  const current = request(row);
  if (action !== "process") return persistTransition(userId, current, action);
  const processing = await persistTransition(userId, current, "process");
  try {
    if (processing.type === "export") {
      const [learning, accountRow, requests, audits, plans, aiOperations, aiQuota, rewardSessions, rewardHeartbeats, rewardDays, rewardTasks, rewardPoints, rewardBadges, rewardProfile] = await Promise.all([
        loadState(ownerId(userId)),
        getAccount(userId),
        listAccountDataRequests(userId),
        db().prepare("SELECT action,resource_type,resource_id,result,created_at FROM account_audit WHERE user_id=? ORDER BY created_at").bind(userId).all(),
        listAllPlans(ownerId(userId)),
        db().prepare("SELECT feature,status,quota_period,cost_units,response_json,failure_code,created_at,updated_at FROM ai_operations WHERE owner_id=? ORDER BY created_at").bind(ownerId(userId)).all(),
        db().prepare("SELECT period_key,allowance,used,reserved,updated_at FROM ai_quota_buckets WHERE owner_id=? ORDER BY period_key").bind(ownerId(userId)).all(),
        db().prepare("SELECT id,local_day,route,expires_at,created_at FROM learning_engagement_sessions WHERE owner_id=? ORDER BY created_at").bind(ownerId(userId)).all(),
        db().prepare("SELECT id,local_day,credited_seconds,created_at FROM learning_engagement_heartbeats WHERE owner_id=? ORDER BY created_at").bind(ownerId(userId)).all(),
        db().prepare("SELECT local_day,active_seconds,last_heartbeat_at,created_at,updated_at FROM learning_engagement_days WHERE owner_id=? ORDER BY local_day").bind(ownerId(userId)).all(),
        db().prepare("SELECT local_day,action,created_at FROM learning_qualifying_tasks WHERE owner_id=? ORDER BY created_at").bind(ownerId(userId)).all(),
        db().prepare("SELECT local_day,period_key,units,source,created_at FROM learning_point_ledger WHERE owner_id=? ORDER BY local_day").bind(ownerId(userId)).all(),
        db().prepare("SELECT badge_key,awarded_at FROM learning_badges WHERE owner_id=? ORDER BY awarded_at").bind(ownerId(userId)).all(),
        db().prepare("SELECT timezone,created_at FROM learning_reward_profiles WHERE owner_id=?").bind(ownerId(userId)).first(),
      ]);
      const resultJson = JSON.stringify({ schemaVersion: "account-export-v1", generatedAt: now(), account: accountRow, learning: learning.state, rewards: { profile: rewardProfile, sessions: rewardSessions.results, heartbeats: rewardHeartbeats.results, days: rewardDays.results, qualifyingTasks: rewardTasks.results, points: rewardPoints.results, badges: rewardBadges.results }, plans, ai: { operations: aiOperations.results, quota: aiQuota.results }, requests, audit: audits.results });
      const completed = transitionDataRequest(processing, "complete", now());
      const expiresAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
      const assertionId = crypto.randomUUID();
      await db().batch([
        db().prepare("INSERT INTO account_cas_assertions(id,ok) VALUES(?, CASE WHEN EXISTS(SELECT 1 FROM account_data_requests WHERE id=? AND user_id=? AND state='processing') AND EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND status='active') THEN 1 ELSE 0 END)").bind(assertionId, requestId, userId, userId),
        db().prepare("UPDATE account_data_requests SET state=?,updated_at=?,completed_at=?,failure_code=NULL,result_json=?,expires_at=? WHERE id=? AND user_id=? AND state='processing'").bind(completed.state, completed.updatedAt, completed.completedAt, resultJson, expiresAt, requestId, userId),
        db().prepare("INSERT INTO account_audit(id,user_id,action,resource_type,resource_id,result,idempotency_key,created_at) VALUES(?,?,'export_complete','account_data_request',?,'ready',?,?)").bind(crypto.randomUUID(), userId, requestId, `${requestId}:complete:${processing.attempt}`, completed.updatedAt),
        db().prepare("DELETE FROM account_cas_assertions WHERE id=?").bind(assertionId),
      ]);
      return completed;
    }
    const completed = transitionDataRequest(processing, "complete", now());
    const assertionId = crypto.randomUUID();
    await db().batch([
      db().prepare("INSERT INTO account_cas_assertions(id,ok) VALUES(?, CASE WHEN EXISTS(SELECT 1 FROM account_data_requests WHERE id=? AND user_id=? AND state='processing') AND EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND status='active') THEN 1 ELSE 0 END)").bind(assertionId, requestId, userId, userId),
      db().prepare("DELETE FROM learning_states WHERE owner_id=?").bind(ownerId(userId)),
      db().prepare("DELETE FROM learning_engagement_sessions WHERE owner_id=?").bind(ownerId(userId)),
      db().prepare("DELETE FROM learning_engagement_heartbeats WHERE owner_id=?").bind(ownerId(userId)),
      db().prepare("DELETE FROM learning_qualifying_tasks WHERE owner_id=?").bind(ownerId(userId)),
      db().prepare("DELETE FROM learning_badges WHERE owner_id=?").bind(ownerId(userId)),
      db().prepare("DELETE FROM learning_point_ledger WHERE owner_id=?").bind(ownerId(userId)),
      db().prepare("DELETE FROM learning_engagement_days WHERE owner_id=?").bind(ownerId(userId)),
      db().prepare("DELETE FROM learning_reward_profiles WHERE owner_id=?").bind(ownerId(userId)),
      db().prepare("DELETE FROM study_plan_versions WHERE owner_id=?").bind(ownerId(userId)),
      db().prepare("DELETE FROM step7_playback_tickets WHERE owner_id=?").bind(ownerId(userId)),
      db().prepare("DELETE FROM ai_operations WHERE owner_id=?").bind(ownerId(userId)),
      db().prepare("DELETE FROM ai_quota_buckets WHERE owner_id=?").bind(ownerId(userId)),
      db().prepare("UPDATE account_data_requests SET result_json=NULL,expires_at=NULL WHERE user_id=?").bind(userId),
      db().prepare("UPDATE account_tokens SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL").bind(completed.updatedAt, userId),
      db().prepare("UPDATE account_sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL").bind(completed.updatedAt, userId),
      db().prepare("UPDATE pack_purchases SET status='revoked',revoked_reason='account_deleted',version=version+1,updated_at=? WHERE user_id=? AND status='active'").bind(completed.updatedAt, userId),
      db().prepare("UPDATE commercial_export_jobs SET state='revoked',error_code='ACCOUNT_DELETED',lease_owner=NULL,lease_expires_at=NULL,updated_at=? WHERE user_id=? AND state!='revoked'").bind(completed.updatedAt,userId),
      db().prepare("DELETE FROM commercial_download_tokens WHERE user_id=? AND consumed_at IS NULL").bind(userId),
      db().prepare("UPDATE accounts SET status='deleted',deleted_at=?,updated_at=? WHERE user_id=? AND status='active'").bind(completed.completedAt, completed.updatedAt, userId),
      db().prepare("UPDATE account_data_requests SET state='completed',updated_at=?,completed_at=?,failure_code=NULL WHERE id=? AND user_id=? AND state='processing'").bind(completed.updatedAt, completed.completedAt, requestId, userId),
      db().prepare("INSERT INTO account_audit(id,user_id,action,resource_type,resource_id,result,idempotency_key,created_at) VALUES(?,?,'delete_complete','account_data_request',?,'completed',?,?)").bind(crypto.randomUUID(), userId, requestId, `${requestId}:complete:${processing.attempt}`, completed.updatedAt),
      db().prepare("DELETE FROM account_cas_assertions WHERE id=?").bind(assertionId),
    ]);
    return completed;
  } catch (error) {
    const code = error instanceof Error ? error.message.slice(0, 80) : "PROCESSING_FAILED";
    return persistTransition(userId, processing, "fail", code);
  }
}

export async function accountAudit(userId: string) {
  const result = await db().prepare("SELECT id,action,resource_type,resource_id,result,metadata_json,created_at FROM account_audit WHERE user_id=? ORDER BY created_at DESC LIMIT 50").bind(userId).all();
  return result.results;
}
