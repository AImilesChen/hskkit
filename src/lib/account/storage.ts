import { getCloudflareContext } from "@opennextjs/cloudflare";
import { emptyLearningState, type LearningState } from "../learning/domain";
import { loadState } from "../learning/storage";
import { listAllPlans } from "../planner/storage";
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

const db = () => getCloudflareContext().env.LEARNING_DB;
const now = () => new Date().toISOString();
const ownerId = (userId: string) => `user:${userId}`;
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

export async function authenticateAccount(syncKey: string | undefined) {
  if (!syncKey || syncKey.length < 20 || syncKey.length > 100) return undefined;
  const tokenHash = await hash(syncKey);
  const row = await db().prepare("SELECT a.* FROM account_tokens t JOIN accounts a ON a.user_id=t.user_id WHERE t.token_hash=? AND t.revoked_at IS NULL").bind(tokenHash).first<AccountRow>();
  if (!row) return undefined;
  await db().prepare("UPDATE account_tokens SET last_used_at=? WHERE token_hash=?").bind(now(), tokenHash).run();
  return account(row);
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
  const [accountState, guestState, accountPlans, guestPlans] = await Promise.all([loadState(ownerId(userId)), loadState(guestOwnerId), listAllPlans(ownerId(userId)), listAllPlans(guestOwnerId)]);
  if (guestState.state.attempts.length === 0 && guestState.state.dailySessions.length === 0 && guestPlans.length === 0) throw new Error("NO_GUEST_DATA");
  const preview = previewMerge(accountState.state, guestState.state);
  const storedPreview = { ...preview, plannerVersions: guestPlans.length, accountPlannerCount: accountPlans.length, accountPlannerMax: accountPlans[0]?.version ?? 0, guestPlannerCount: guestPlans.length, guestPlannerMax: guestPlans[0]?.version ?? 0 };
  const id = existing?.id ?? crypto.randomUUID();
  const mergeKey = secret();
  const mergeTokenHash = await hash(mergeKey);
  const timestamp = now();
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
  if (existing) {
    const updated = await db().prepare("UPDATE guest_merges SET merge_token_hash=?,state='previewed',preview_json=?,account_revision=?,guest_revision=?,updated_at=?,expires_at=? WHERE id=? AND user_id=? AND state!='confirmed'")
      .bind(mergeTokenHash, JSON.stringify(storedPreview), accountState.revision, guestState.revision, timestamp, expiresAt, id, userId).run();
    if ((updated.meta.changes ?? 0) !== 1) throw new Error("GUEST_ALREADY_MERGED");
  } else {
    await db().prepare("INSERT INTO guest_merges(id,user_id,guest_owner_id,merge_token_hash,state,preview_json,account_revision,guest_revision,created_at,updated_at,expires_at) VALUES(?,?,?,?,'previewed',?,?,?,?,?,?)")
      .bind(id, userId, guestOwnerId, mergeTokenHash, JSON.stringify(storedPreview), accountState.revision, guestState.revision, timestamp, timestamp, expiresAt).run();
  }
  await audit(userId, "guest_merge_previewed", "guest_merge", id, "success", `merge-preview:${id}:${timestamp}`, { conflicts: preview.conflicts, additions: preview.additions });
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
      db().prepare("DELETE FROM account_cas_assertions WHERE id=?").bind(assertionId),
    ]);
    return { state: "cancelled" as const };
  }
  const [accountState, guestState] = await Promise.all([loadState(ownerId(userId)), loadState(row.guest_owner_id)]);
  if (accountState.revision !== row.account_revision || guestState.revision !== row.guest_revision) throw new Error("MERGE_PREVIEW_STALE");
  const merged = mergeLearningStates(accountState.state, guestState.state, ownerId(userId));
  const plannerSnapshot = JSON.parse(row.preview_json) as { accountPlannerMax?: number; accountPlannerCount?: number; guestPlannerMax?: number; guestPlannerCount?: number };
  const accountPlanVersion = Number(plannerSnapshot.accountPlannerMax ?? -1);
  const accountPlanCount = Number(plannerSnapshot.accountPlannerCount ?? -1);
  const guestPlanVersion = Number(plannerSnapshot.guestPlannerMax ?? -1);
  const guestPlanCount = Number(plannerSnapshot.guestPlannerCount ?? -1);
  const [accountPlanNow, guestPlanNow] = await Promise.all([
    db().prepare("SELECT COALESCE(MAX(version),0) AS max_version, COUNT(*) AS plan_count FROM study_plan_versions WHERE owner_id=?").bind(ownerId(userId)).first<{ max_version: number; plan_count: number }>(),
    db().prepare("SELECT COALESCE(MAX(version),0) AS max_version, COUNT(*) AS plan_count FROM study_plan_versions WHERE owner_id=?").bind(row.guest_owner_id).first<{ max_version: number; plan_count: number }>(),
  ]);
  if (Number(accountPlanNow?.max_version ?? 0) !== accountPlanVersion || Number(accountPlanNow?.plan_count ?? 0) !== accountPlanCount || Number(guestPlanNow?.max_version ?? 0) !== guestPlanVersion || Number(guestPlanNow?.plan_count ?? 0) !== guestPlanCount) throw new Error("MERGE_PREVIEW_STALE");
  const assertionId = crypto.randomUUID();
  try {
    await db().batch([
    db().prepare("INSERT INTO account_cas_assertions(id,ok) VALUES(?, CASE WHEN COALESCE((SELECT revision FROM learning_states WHERE owner_id=?),0)=? AND COALESCE((SELECT revision FROM learning_states WHERE owner_id=?),0)=? AND COALESCE((SELECT MAX(version) FROM study_plan_versions WHERE owner_id=?),0)=? AND (SELECT COUNT(*) FROM study_plan_versions WHERE owner_id=?)=? AND COALESCE((SELECT MAX(version) FROM study_plan_versions WHERE owner_id=?),0)=? AND (SELECT COUNT(*) FROM study_plan_versions WHERE owner_id=?)=? AND EXISTS(SELECT 1 FROM guest_merges WHERE id=? AND user_id=? AND state='previewed' AND merge_token_hash=? AND expires_at>?) AND EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND status='active') THEN 1 ELSE 0 END)").bind(assertionId, ownerId(userId), accountState.revision, row.guest_owner_id, guestState.revision, ownerId(userId), accountPlanVersion, ownerId(userId), accountPlanCount, row.guest_owner_id, guestPlanVersion, row.guest_owner_id, guestPlanCount, mergeId, userId, row.merge_token_hash, timestamp, userId),
    db().prepare("UPDATE learning_states SET state_json=?,revision=revision+1,updated_at=? WHERE owner_id=? AND revision=?").bind(JSON.stringify(merged.state), timestamp, ownerId(userId), accountState.revision),
    db().prepare("DELETE FROM learning_states WHERE owner_id=? AND revision=?").bind(row.guest_owner_id, guestState.revision),
    db().prepare("DELETE FROM step7_playback_tickets WHERE owner_id=?").bind(row.guest_owner_id),
    db().prepare("INSERT INTO study_plan_versions(id,owner_id,version,parent_version,status,goal_level,target_date,weekly_minutes,preferred_days_json,weak_points_json,srs_load_json,warnings_json,sessions_json,idempotency_key,created_at) SELECT 'merged:'||?||':'||id,?,version+?,CASE WHEN parent_version IS NULL THEN NULL ELSE parent_version+? END,CASE WHEN ?>0 THEN 'superseded' ELSE status END,goal_level,target_date,weekly_minutes,preferred_days_json,weak_points_json,srs_load_json,warnings_json,sessions_json,'merge:'||?||':'||id,created_at FROM study_plan_versions WHERE owner_id=? ORDER BY version").bind(userId, ownerId(userId), accountPlanVersion, accountPlanVersion, accountPlanCount, row.merge_token_hash, row.guest_owner_id),
    db().prepare("DELETE FROM study_plan_versions WHERE owner_id=?").bind(row.guest_owner_id),
    db().prepare("UPDATE guest_merges SET state='confirmed',updated_at=? WHERE id=? AND state='previewed'").bind(timestamp, mergeId),
    db().prepare("INSERT INTO account_audit(id,user_id,action,resource_type,resource_id,result,metadata_json,idempotency_key,created_at) VALUES(?,?,'guest_merge_confirmed','guest_merge',?,'success',?,?,?)").bind(crypto.randomUUID(), userId, mergeId, JSON.stringify({ conflicts: merged.conflicts }), `merge-confirm:${mergeId}`, timestamp),
    db().prepare("DELETE FROM account_cas_assertions WHERE id=?").bind(assertionId),
    ]);
  } catch (error) {
    if (String(error).includes("account_cas_assertions") || String(error).includes("CHECK constraint")) throw new Error("MERGE_PREVIEW_STALE");
    throw error;
  }
  return { state: "confirmed" as const, revision: accountState.revision + 1, conflicts: merged.conflicts };
}

export async function syncCheckpoint(userId: string, clientRevision: number, deviceId: string) {
  if (!Number.isInteger(clientRevision) || clientRevision < 0) throw new Error("INVALID_REVISION");
  if (!deviceId || deviceId.length > 80) throw new Error("INVALID_DEVICE_ID");
  const loaded = await loadState(ownerId(userId));
  const decision = syncDecision(loaded.revision, clientRevision, deviceId);
  if (decision.state === "conflict") {
    const id = crypto.randomUUID();
    const timestamp = now();
    await db().batch([
      db().prepare("INSERT INTO sync_conflicts(id,user_id,device_id,client_revision,server_revision,state,created_at) VALUES(?,?,?,?,?,'open',?)").bind(id, userId, deviceId, clientRevision, loaded.revision, timestamp),
      db().prepare("INSERT INTO account_audit(id,user_id,action,resource_type,resource_id,result,metadata_json,idempotency_key,created_at) VALUES(?,?,'sync_conflict','sync_conflict',?,'conflict',?,?,?)").bind(crypto.randomUUID(), userId, id, JSON.stringify({ clientRevision, serverRevision: loaded.revision }), `sync-conflict:${id}`, timestamp),
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
      const [learning, accountRow, requests, audits, plans] = await Promise.all([
        loadState(ownerId(userId)),
        getAccount(userId),
        listAccountDataRequests(userId),
        db().prepare("SELECT action,resource_type,resource_id,result,created_at FROM account_audit WHERE user_id=? ORDER BY created_at").bind(userId).all(),
        listAllPlans(ownerId(userId)),
      ]);
      const resultJson = JSON.stringify({ schemaVersion: "account-export-v1", generatedAt: now(), account: accountRow, learning: learning.state, plans, requests, audit: audits.results });
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
      db().prepare("DELETE FROM study_plan_versions WHERE owner_id=?").bind(ownerId(userId)),
      db().prepare("DELETE FROM step7_playback_tickets WHERE owner_id=?").bind(ownerId(userId)),
      db().prepare("UPDATE account_data_requests SET result_json=NULL,expires_at=NULL WHERE user_id=?").bind(userId),
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
