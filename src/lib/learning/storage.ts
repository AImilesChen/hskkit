import { getCloudflareContext } from "@opennextjs/cloudflare";
import { POLICY_AUDIT_SQL, policyAuditBindings } from "../account/audit-storage";
import type { AuditEvent } from "../account/access-policy";
import type { LearningState } from "./domain";
import { engagementTaskStatements, type LearningEngagementActivity } from "../engagement/storage";
const emptyLearningState = (): LearningState => ({ attempts: [], cards: [], mistakes: [], dailySessions: [] });
export async function db(){return (await getCloudflareContext({async:true})).env.LEARNING_DB;}
export async function loadState(ownerId:string){const row=await (await db()).prepare("SELECT state_json,revision FROM learning_states WHERE owner_id=?").bind(ownerId).first<{state_json:string;revision:number}>();return row?{state:JSON.parse(row.state_json) as LearningState,revision:row.revision}:{state:emptyLearningState(),revision:0};}
export type UsageCharge = {
  metric: "daily_new_items" | "daily_review_grades";
  periodKey: string;
  idempotencyKey: string;
  units: number;
  limit: number;
};

export type ReferralLearningActivity = {
  userId: string;
  eventType: string;
  eventId: string;
  units: number;
  localDay: string;
};

export async function usageSnapshot(ownerId: string, periodKey: string): Promise<{ dailyNewItems: number; dailyReviewGrades: number }> {
  const rows = await (await db()).prepare("SELECT metric,used FROM entitlement_usage_counters WHERE owner_id=? AND period_key=?").bind(ownerId, periodKey).all<{ metric: UsageCharge["metric"]; used: number }>();
  const snapshot = { dailyNewItems: 0, dailyReviewGrades: 0 };
  for (const row of rows.results as Array<{ metric: UsageCharge["metric"]; used: number }>) {
    if (row.metric === "daily_new_items") snapshot.dailyNewItems = Number(row.used);
    if (row.metric === "daily_review_grades") snapshot.dailyReviewGrades = Number(row.used);
  }
  return snapshot;
}

export async function learningActivitySince(ownerId: string, sinceIso: string): Promise<Array<{ action: string; createdAt: string }>> {
  const rows = await (await db()).prepare(
    "SELECT action,created_at FROM policy_audit_events WHERE subject_id=? AND resource_type='learning' AND result='success' AND created_at>=? ORDER BY created_at ASC",
  ).bind(ownerId, sinceIso).all<{ action: string; created_at: string }>();
  return (rows.results as Array<{ action: string; created_at: string }>).map((row) => ({ action: row.action, createdAt: row.created_at }));
}

export async function saveState(ownerId: string, state: LearningState, revision: number, audit?: AuditEvent, usage?: UsageCharge, referralActivity?: ReferralLearningActivity, engagementActivity?: LearningEngagementActivity) {
  const now = new Date().toISOString();
  const database = await db();
  const isAccount = ownerId.startsWith("user:");
  const userId = isAccount ? ownerId.slice(5) : "";
  const stateStatement = database.prepare(
    "INSERT INTO learning_states(owner_id,state_json,revision,updated_at) SELECT ?,?,?,? WHERE (?=0 OR EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND status='active')) AND NOT EXISTS(SELECT 1 FROM guest_merges WHERE guest_owner_id=? AND state='confirmed') ON CONFLICT(owner_id) DO UPDATE SET state_json=excluded.state_json,revision=learning_states.revision+1,updated_at=excluded.updated_at WHERE learning_states.revision=? AND (?=0 OR EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND status='active')) AND NOT EXISTS(SELECT 1 FROM guest_merges WHERE guest_owner_id=? AND state='confirmed')",
  ).bind(ownerId, JSON.stringify(state), 1, now, isAccount ? 1 : 0, userId, ownerId, revision, isAccount ? 1 : 0, userId, ownerId);
  let changes = 0;
  if (audit || usage || referralActivity || engagementActivity) {
    const statements: Array<ReturnType<typeof database.prepare>> = [];
    const accountAssertionId = audit ? crypto.randomUUID() : undefined;
    const usageAssertionId = usage ? crypto.randomUUID() : undefined;
    if (accountAssertionId) {
      statements.push(database.prepare("INSERT INTO account_cas_assertions(id,ok) VALUES(?, CASE WHEN COALESCE((SELECT revision FROM learning_states WHERE owner_id=?),0)=? AND (?=0 OR EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND status='active')) AND NOT EXISTS(SELECT 1 FROM guest_merges WHERE guest_owner_id=? AND state='confirmed') THEN 1 ELSE 0 END)").bind(accountAssertionId, ownerId, revision, isAccount ? 1 : 0, userId, ownerId));
    }
    if (usage && usageAssertionId) {
      statements.push(
        database.prepare("INSERT INTO entitlement_usage_counters(owner_id,metric,period_key,used,updated_at) VALUES(?,?,?,0,?) ON CONFLICT(owner_id,metric,period_key) DO NOTHING").bind(ownerId, usage.metric, usage.periodKey, now),
        database.prepare("UPDATE entitlement_usage_counters SET used=used+?,updated_at=? WHERE owner_id=? AND metric=? AND period_key=? AND used+?<=? AND NOT EXISTS(SELECT 1 FROM entitlement_usage_events WHERE owner_id=? AND metric=? AND idempotency_key=?)").bind(usage.units, now, ownerId, usage.metric, usage.periodKey, usage.units, usage.limit, ownerId, usage.metric, usage.idempotencyKey),
        database.prepare("INSERT INTO entitlement_limit_assertions(id,ok) VALUES(?,CASE changes() WHEN 1 THEN 1 ELSE 0 END)").bind(usageAssertionId),
        database.prepare("INSERT INTO entitlement_usage_events(id,owner_id,metric,period_key,idempotency_key,units,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(), ownerId, usage.metric, usage.periodKey, usage.idempotencyKey, usage.units, now),
      );
    }
    const stateIndex = statements.length;
    statements.push(stateStatement);
    if (referralActivity) statements.push(database.prepare("INSERT OR IGNORE INTO referral_learning_events(id,relationship_id,referred_user_id,local_day,units,idempotency_key,created_at) SELECT ?,id,?,?,?,?,? FROM referral_relationships WHERE referred_user_id=? AND status='signed_up'").bind(crypto.randomUUID(), referralActivity.userId, referralActivity.localDay, referralActivity.units, referralActivity.eventId, now, referralActivity.userId));
    if (engagementActivity) statements.push(...engagementTaskStatements(database, ownerId, engagementActivity, now));
    if (audit) statements.push(database.prepare(POLICY_AUDIT_SQL).bind(...policyAuditBindings(audit)));
    if (usageAssertionId) statements.push(database.prepare("DELETE FROM entitlement_limit_assertions WHERE id=?").bind(usageAssertionId));
    if (accountAssertionId) statements.push(database.prepare("DELETE FROM account_cas_assertions WHERE id=?").bind(accountAssertionId));
    try {
      const results = await database.batch(statements);
      changes = results[stateIndex].meta.changes ?? 0;
    } catch {
      if (isAccount) {
        const account = await database.prepare("SELECT status FROM accounts WHERE user_id=?").bind(userId).first<{ status: string }>();
        if (account?.status === "deleted") throw new Error("ACCOUNT_DELETED");
      }
      if (usage) {
        const replay = await database.prepare("SELECT 1 replayed FROM entitlement_usage_events WHERE owner_id=? AND metric=? AND idempotency_key=?").bind(ownerId, usage.metric, usage.idempotencyKey).first<{ replayed: number }>();
        if (replay) throw new Error("REVISION_CONFLICT");
        const counter = await database.prepare("SELECT used FROM entitlement_usage_counters WHERE owner_id=? AND metric=? AND period_key=?").bind(ownerId, usage.metric, usage.periodKey).first<{ used: number }>();
        if (Number(counter?.used ?? 0) + usage.units > usage.limit) {
          throw new Error(usage.metric === "daily_new_items" ? "FREE_DAILY_NEW_ITEM_LIMIT" : "FREE_DAILY_REVIEW_LIMIT");
        }
      }
      throw new Error("REVISION_CONFLICT");
    }
  } else {
    changes = (await stateStatement.run()).meta.changes ?? 0;
  }
  if (!changes) {
    if (isAccount) {
      const account = await database.prepare("SELECT status FROM accounts WHERE user_id=?").bind(userId).first<{ status: string }>();
      if (account?.status === "deleted") throw new Error("ACCOUNT_DELETED");
    }
    throw new Error("REVISION_CONFLICT");
  }
}
