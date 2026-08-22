import { getCloudflareContext } from "@opennextjs/cloudflare";
import { POLICY_AUDIT_SQL, policyAuditBindings } from "../account/audit-storage";
import type { AuditEvent } from "../account/access-policy";
import type { StudyPlan } from "./domain";

const db = () => getCloudflareContext().env.LEARNING_DB;

type PlanRow = {
  id: string;
  owner_id: string;
  version: number;
  parent_version: number | null;
  status: "active" | "superseded";
  goal_level: number;
  target_date: string;
  weekly_minutes: number;
  preferred_days_json: string;
  weak_points_json: string;
  srs_load_json: string;
  warnings_json: string;
  sessions_json: string;
  signals_json: string;
  adjustment_reasons_json: string;
  created_at: string;
};

function parse<T>(json: string, fallback: T): T {
  try { return JSON.parse(json) as T; } catch { return fallback; }
}
function plan(row: PlanRow): StudyPlan {
  return {
    id: row.id,
    ownerId: row.owner_id,
    version: row.version,
    parentVersion: row.parent_version ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    inputs: {
      goalLevel: row.goal_level,
      targetDate: row.target_date,
      weeklyMinutes: row.weekly_minutes,
      preferredDays: parse<number[]>(row.preferred_days_json, []),
      weakPoints: parse<StudyPlan["inputs"]["weakPoints"]>(row.weak_points_json, []),
    },
    srsLoad: parse<StudyPlan["srsLoad"]>(row.srs_load_json, { dueCards: 0, weeklyMinutes: 0 }),
    warnings: parse<string[]>(row.warnings_json, []),
    sessions: parse<StudyPlan["sessions"]>(row.sessions_json, []),
    signals: parse<NonNullable<StudyPlan["signals"]>>(row.signals_json, { weakPoints: [], dueCards: 0 }),
    adjustmentReasons: parse<NonNullable<StudyPlan["adjustmentReasons"]>>(row.adjustment_reasons_json, []),
  };
}

export async function listPlans(ownerId: string, limit = 20) {
  const result = await db().prepare("SELECT * FROM study_plan_versions WHERE owner_id=? ORDER BY version DESC LIMIT ?").bind(ownerId, Math.min(Math.max(limit, 1), 50)).all<PlanRow>();
  return result.results.map(plan);
}

export async function listAllPlans(ownerId: string) {
  const result = await db().prepare("SELECT * FROM study_plan_versions WHERE owner_id=? ORDER BY version DESC").bind(ownerId).all<PlanRow>();
  return result.results.map(plan);
}

export async function latestPlan(ownerId: string) {
  const row = await db().prepare("SELECT * FROM study_plan_versions WHERE owner_id=? ORDER BY version DESC LIMIT 1").bind(ownerId).first<PlanRow>();
  return row ? plan(row) : undefined;
}

export async function findPlanByIdempotency(ownerId: string, key: string) {
  const row = await db().prepare("SELECT * FROM study_plan_versions WHERE owner_id=? AND idempotency_key=?").bind(ownerId, key).first<PlanRow>();
  return row ? plan(row) : undefined;
}

export async function persistPlan(value: StudyPlan, idempotencyKey: string, expectedVersion: number, audit?: AuditEvent) {
  const existing = await findPlanByIdempotency(value.ownerId, idempotencyKey);
  if (existing) return existing;
  const assertionId = crypto.randomUUID();
  try {
    const database = db();
    const statements = [
      database.prepare("INSERT INTO account_cas_assertions(id,ok) VALUES(?, CASE WHEN COALESCE((SELECT MAX(version) FROM study_plan_versions WHERE owner_id=?),0)=? AND (substr(?,1,5)!='user:' OR EXISTS(SELECT 1 FROM accounts WHERE user_id=substr(?,6) AND status='active')) AND NOT EXISTS(SELECT 1 FROM guest_merges WHERE guest_owner_id=? AND state='confirmed') THEN 1 ELSE 0 END)").bind(assertionId, value.ownerId, expectedVersion, value.ownerId, value.ownerId, value.ownerId),
      database.prepare("UPDATE study_plan_versions SET status='superseded' WHERE owner_id=? AND status='active'").bind(value.ownerId),
      database.prepare("INSERT INTO study_plan_versions(id,owner_id,version,parent_version,status,goal_level,target_date,weekly_minutes,preferred_days_json,weak_points_json,srs_load_json,warnings_json,sessions_json,signals_json,adjustment_reasons_json,idempotency_key,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
        .bind(value.id, value.ownerId, value.version, value.parentVersion ?? null, "active", value.inputs.goalLevel, value.inputs.targetDate, value.inputs.weeklyMinutes, JSON.stringify(value.inputs.preferredDays), JSON.stringify(value.inputs.weakPoints), JSON.stringify(value.srsLoad), JSON.stringify(value.warnings), JSON.stringify(value.sessions), JSON.stringify(value.signals ?? { weakPoints: value.inputs.weakPoints, dueCards: value.srsLoad.dueCards }), JSON.stringify(value.adjustmentReasons ?? []), idempotencyKey, value.createdAt),
    ];
    if (audit) statements.push(database.prepare(POLICY_AUDIT_SQL).bind(...policyAuditBindings(audit)));
    statements.push(database.prepare("DELETE FROM account_cas_assertions WHERE id=?").bind(assertionId));
    await database.batch(statements);
  } catch (error) {
    const replay = await findPlanByIdempotency(value.ownerId, idempotencyKey);
    if (replay) return replay;
    throw new Error(String(error).includes("account_cas_assertions") || String(error).includes("CHECK constraint") ? "REVISION_CONFLICT" : "PLAN_SAVE_FAILED");
  }
  return value;
}

export async function deletePlans(ownerId: string) {
  await db().prepare("DELETE FROM study_plan_versions WHERE owner_id=?").bind(ownerId).run();
}
