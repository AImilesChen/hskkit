import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { LearningState, PlacementAnswer, PlacementResult, PlacementSession } from "../learning/domain";
import { loadState, saveState } from "../learning/storage";
import { recordLearningTask, type LearningEngagementActivity } from "../engagement/storage";

export type PlacementDbMode = "legacy" | "shadow" | "primary";
export type PlacementState = {
  state: LearningState;
  revision: number;
};

type SessionRow = {
  id: string;
  owner_id: string;
  idempotency_key: string;
  question_version: string;
  question_ids_json: string;
  status: PlacementSession["status"];
  created_at: string;
  expires_at: string;
  submitted_at: string | null;
  result_id: string | null;
  adaptive_complete: number | null;
  adaptive_min_questions: number | null;
  adaptive_max_questions: number | null;
};
type AnswerRow = {
  session_id: string;
  question_id: string;
  answer: string;
  idempotency_key: string;
  answered_at: string;
};
type ResultRow = { result_json: string };

const empty = (): LearningState => ({ attempts: [], cards: [], mistakes: [], dailySessions: [], placementSessions: [], placementResults: [] });
const context = async () => getCloudflareContext({ async: true });
const placementDb = async () => (await context()).env.PLACEMENT_DB;
export const placementDbMode = (env: Pick<CloudflareEnv, "PLACEMENT_DB_MODE">): PlacementDbMode =>
  env.PLACEMENT_DB_MODE === "primary" ? "primary" : env.PLACEMENT_DB_MODE === "shadow" ? "shadow" : "legacy";

const placementOnly = (state: LearningState): LearningState => ({
  ...empty(),
  placementSessions: state.placementSessions ?? [],
  placementResults: state.placementResults ?? [],
});

async function loadLegacyPlacement(ownerId: string): Promise<PlacementState> {
  const loaded = await loadState(ownerId);
  return { state: placementOnly(loaded.state), revision: loaded.revision };
}

function sessionFromRow(row: SessionRow, answers: PlacementAnswer[]): PlacementSession {
  return {
    id: row.id,
    ownerId: row.owner_id,
    idempotencyKey: row.idempotency_key,
    questionVersion: row.question_version,
    questionIds: JSON.parse(row.question_ids_json) as string[],
    answers,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    submittedAt: row.submitted_at ?? undefined,
    resultId: row.result_id ?? undefined,
    adaptiveComplete: row.adaptive_complete === null ? undefined : Boolean(row.adaptive_complete),
    adaptiveMinQuestions: row.adaptive_min_questions ?? undefined,
    adaptiveMaxQuestions: row.adaptive_max_questions ?? undefined,
  };
}

async function loadNormalizedPlacement(ownerId: string): Promise<PlacementState | undefined> {
  const db = await placementDb();
  const [revisionRows, sessionRows, answerRows, resultRows] = await db.batch([
    db.prepare("SELECT revision FROM placement_owner_revisions WHERE owner_id=?").bind(ownerId),
    db.prepare("SELECT * FROM placement_sessions WHERE owner_id=? ORDER BY created_at ASC,id ASC").bind(ownerId),
    db.prepare("SELECT a.* FROM placement_answers a JOIN placement_sessions s ON s.id=a.session_id WHERE s.owner_id=? ORDER BY a.answered_at ASC,a.question_id ASC").bind(ownerId),
    db.prepare("SELECT result_json FROM placement_results WHERE owner_id=? ORDER BY created_at ASC,id ASC").bind(ownerId),
  ]);
  const revision = (revisionRows.results as Array<{ revision: number }>)[0];
  if (!revision) return undefined;
  const answers = new Map<string, PlacementAnswer[]>();
  for (const row of answerRows.results as AnswerRow[]) {
    const values = answers.get(row.session_id) ?? [];
    values.push({ questionId: row.question_id, answer: row.answer, idempotencyKey: row.idempotency_key, answeredAt: row.answered_at });
    answers.set(row.session_id, values);
  }
  const sessions = (sessionRows.results as SessionRow[]).map((row) => sessionFromRow(row, answers.get(row.id) ?? []));
  const results = (resultRows.results as ResultRow[]).map((row) => JSON.parse(row.result_json) as PlacementResult);
  return { state: { ...empty(), placementSessions: sessions, placementResults: results }, revision: Number(revision.revision) };
}

const comparable = (loaded: PlacementState | undefined) => loaded ? JSON.stringify({
  sessions: loaded.state.placementSessions ?? [],
  results: loaded.state.placementResults ?? [],
}) : "missing";

export async function loadPlacementState(ownerId: string, options: { initializeIfMissing?: boolean } = {}): Promise<PlacementState> {
  const env = (await context()).env;
  const mode = placementDbMode(env);
  if (mode === "legacy") return loadLegacyPlacement(ownerId);
  if (mode === "shadow") {
    const [legacy, normalized] = await Promise.all([loadLegacyPlacement(ownerId), loadNormalizedPlacement(ownerId)]);
    if (normalized && comparable(legacy) !== comparable(normalized)) {
      console.error("PLACEMENT_STATE_MISMATCH", { legacyRevision: legacy.revision, placementRevision: normalized.revision });
    }
    return legacy;
  }
  const normalized = await loadNormalizedPlacement(ownerId);
  if (normalized) return normalized;
  if (options.initializeIfMissing) return { state: empty(), revision: 0 };
  const legacy = await loadLegacyPlacement(ownerId);
  await importPlacementState(ownerId, legacy.state, 0);
  return (await loadNormalizedPlacement(ownerId)) ?? { state: empty(), revision: 0 };
}

function changedById<T extends { id: string }>(before: T[], after: T[]) {
  const prior = new Map(before.map((value) => [value.id, JSON.stringify(value)]));
  return after.filter((value) => prior.get(value.id) !== JSON.stringify(value));
}

function sessionStatements(db: Awaited<ReturnType<typeof placementDb>>, session: PlacementSession, now: string) {
  const statements: Array<ReturnType<typeof db.prepare>> = [
    db.prepare("INSERT INTO placement_sessions(id,owner_id,idempotency_key,question_version,question_ids_json,status,created_at,expires_at,submitted_at,result_id,adaptive_complete,adaptive_min_questions,adaptive_max_questions,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET owner_id=excluded.owner_id,idempotency_key=excluded.idempotency_key,question_version=excluded.question_version,question_ids_json=excluded.question_ids_json,status=excluded.status,expires_at=excluded.expires_at,submitted_at=excluded.submitted_at,result_id=excluded.result_id,adaptive_complete=excluded.adaptive_complete,adaptive_min_questions=excluded.adaptive_min_questions,adaptive_max_questions=excluded.adaptive_max_questions,updated_at=excluded.updated_at")
      .bind(session.id, session.ownerId, session.idempotencyKey, session.questionVersion, JSON.stringify(session.questionIds), session.status, session.createdAt, session.expiresAt ?? session.createdAt, session.submittedAt ?? null, session.resultId ?? null, session.adaptiveComplete === undefined ? null : session.adaptiveComplete ? 1 : 0, session.adaptiveMinQuestions ?? null, session.adaptiveMaxQuestions ?? null, now),
    db.prepare("DELETE FROM placement_answers WHERE session_id=?").bind(session.id),
  ];
  for (const answer of session.answers) {
    statements.push(db.prepare("INSERT INTO placement_answers(session_id,question_id,answer,idempotency_key,answered_at) VALUES(?,?,?,?,?) ON CONFLICT(session_id,question_id) DO UPDATE SET answer=excluded.answer,idempotency_key=excluded.idempotency_key,answered_at=excluded.answered_at")
      .bind(session.id, answer.questionId, answer.answer, answer.idempotencyKey, answer.answeredAt));
  }
  return statements;
}

export async function importPlacementState(ownerId: string, state: LearningState, revision: number) {
  const db = await placementDb();
  const now = new Date().toISOString();
  const assertionId = crypto.randomUUID();
  const statements: Array<ReturnType<typeof db.prepare>> = [
    db.prepare("INSERT INTO placement_owner_revisions(owner_id,revision,migrated_at,updated_at) SELECT ?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM placement_owner_fences WHERE owner_id=?) ON CONFLICT(owner_id) DO UPDATE SET revision=excluded.revision,migrated_at=COALESCE(placement_owner_revisions.migrated_at,excluded.migrated_at),updated_at=excluded.updated_at WHERE placement_owner_revisions.revision<=excluded.revision AND NOT EXISTS(SELECT 1 FROM placement_owner_fences WHERE owner_id=excluded.owner_id)")
      .bind(ownerId, revision, now, now, ownerId),
    db.prepare("INSERT INTO placement_cas_assertions(id,ok) VALUES(?,CASE changes() WHEN 1 THEN 1 ELSE 0 END)").bind(assertionId),
    db.prepare("DELETE FROM placement_sessions WHERE owner_id=?").bind(ownerId),
    db.prepare("DELETE FROM placement_results WHERE owner_id=?").bind(ownerId),
  ];
  for (const session of state.placementSessions ?? []) statements.push(...sessionStatements(db, session, now));
  for (const result of state.placementResults ?? []) {
    const session = (state.placementSessions ?? []).find((candidate) => candidate.id === result.sessionId);
    if (!session) continue;
    statements.push(db.prepare("INSERT INTO placement_results(id,owner_id,session_id,submit_idempotency_key,result_json,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET owner_id=excluded.owner_id,session_id=excluded.session_id,submit_idempotency_key=excluded.submit_idempotency_key,result_json=excluded.result_json,created_at=excluded.created_at")
      .bind(result.id, ownerId, result.sessionId, result.submitIdempotencyKey, JSON.stringify(result), result.createdAt));
  }
  statements.push(db.prepare("DELETE FROM placement_cas_assertions WHERE id=?").bind(assertionId));
  try {
    await db.batch(statements);
  } catch (error) {
    if (String(error).includes("placement_cas_assertions") || String(error).includes("CHECK constraint")) throw new Error("STALE_PLACEMENT_IMPORT");
    throw error;
  }
}

async function saveNormalizedPlacement(ownerId: string, before: LearningState, after: LearningState, revision: number) {
  const db = await placementDb();
  const now = new Date().toISOString();
  const assertionId = crypto.randomUUID();
  const beforeSessions = before.placementSessions ?? [];
  const afterSessions = after.placementSessions ?? [];
  const beforeResults = before.placementResults ?? [];
  const afterResults = after.placementResults ?? [];
  const statements: Array<ReturnType<typeof db.prepare>> = [
    db.prepare("INSERT INTO placement_owner_revisions(owner_id,revision,updated_at) SELECT ?,1,? WHERE NOT EXISTS(SELECT 1 FROM placement_owner_fences WHERE owner_id=?) ON CONFLICT(owner_id) DO UPDATE SET revision=placement_owner_revisions.revision+1,updated_at=excluded.updated_at WHERE placement_owner_revisions.revision=? AND NOT EXISTS(SELECT 1 FROM placement_owner_fences WHERE owner_id=excluded.owner_id)")
      .bind(ownerId, now, ownerId, revision),
    db.prepare("INSERT INTO placement_cas_assertions(id,ok) VALUES(?,CASE changes() WHEN 1 THEN 1 ELSE 0 END)").bind(assertionId),
  ];
  const afterSessionIds = new Set(afterSessions.map((session) => session.id));
  for (const session of beforeSessions) if (!afterSessionIds.has(session.id)) statements.push(db.prepare("DELETE FROM placement_sessions WHERE id=? AND owner_id=?").bind(session.id, ownerId));
  for (const session of changedById(beforeSessions, afterSessions)) statements.push(...sessionStatements(db, session, now));
  for (const result of changedById(beforeResults, afterResults)) {
    statements.push(db.prepare("INSERT INTO placement_results(id,owner_id,session_id,submit_idempotency_key,result_json,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET owner_id=excluded.owner_id,session_id=excluded.session_id,submit_idempotency_key=excluded.submit_idempotency_key,result_json=excluded.result_json")
      .bind(result.id, ownerId, result.sessionId, result.submitIdempotencyKey, JSON.stringify(result), result.createdAt));
  }
  statements.push(db.prepare("DELETE FROM placement_cas_assertions WHERE id=?").bind(assertionId));
  try {
    await db.batch(statements);
  } catch (error) {
    if (String(error).includes("placement_cas_assertions") || String(error).includes("CHECK constraint")) throw new Error("REVISION_CONFLICT");
    throw error;
  }
}

async function syncLegacyPlacementProjection(ownerId: string, placement: LearningState, engagement?: LearningEngagementActivity) {
  const sessionsById = new Map((placement.placementSessions ?? []).map((session) => [session.id, session]));
  const projectedSessions = (placement.placementResults ?? []).flatMap((result) => {
    const session = sessionsById.get(result.sessionId);
    return session ? [{ ...session, answers: [] }] : [];
  });
  for (let turn = 0; turn < 3; turn += 1) {
    const legacy = await loadState(ownerId);
    const next = {
      ...legacy.state,
      placementSessions: projectedSessions,
      placementResults: placement.placementResults ?? [],
    };
    try {
      await saveState(ownerId, next, legacy.revision, undefined, undefined, undefined, engagement);
      return;
    } catch (error) {
      if (String(error).includes("REVISION_CONFLICT") && turn < 2) continue;
      throw error;
    }
  }
}

export async function savePlacementState(ownerId: string, before: LearningState, after: LearningState, revision: number, engagement?: LearningEngagementActivity, projectLegacy = false) {
  const env = (await context()).env;
  const mode = placementDbMode(env);
  const changed = before !== after;
  if (mode === "legacy") {
    if (changed) return saveState(ownerId, after, revision, undefined, undefined, undefined, engagement);
    if (engagement) return recordLearningTask(ownerId, engagement);
    return;
  }
  if (mode === "shadow") {
    let targetRevision = revision;
    if (changed) {
      await saveState(ownerId, after, revision, undefined, undefined, undefined, engagement);
      targetRevision = revision + 1;
    } else if (engagement) {
      await recordLearningTask(ownerId, engagement);
    }
    await importPlacementState(ownerId, after, targetRevision);
    return;
  }
  // Submit projection is written first so any successful normalized result always has a rollback-safe legacy copy.
  if (projectLegacy || engagement) await syncLegacyPlacementProjection(ownerId, after, engagement);
  if (changed) await saveNormalizedPlacement(ownerId, before, after, revision);
}

export async function deletePlacementOwner(ownerId: string) {
  const db = await placementDb();
  await db.batch([
    db.prepare("INSERT INTO placement_owner_fences(owner_id,state,target_owner_id,created_at) VALUES(?,'deleted',NULL,?) ON CONFLICT(owner_id) DO UPDATE SET state='deleted',target_owner_id=NULL,created_at=excluded.created_at").bind(ownerId, new Date().toISOString()),
    db.prepare("DELETE FROM placement_sessions WHERE owner_id=?").bind(ownerId),
    db.prepare("DELETE FROM placement_results WHERE owner_id=?").bind(ownerId),
    db.prepare("DELETE FROM placement_owner_revisions WHERE owner_id=?").bind(ownerId),
  ]);
}

export async function restorePlacementOwnerAfterFailedDeletion(ownerId: string) {
  const db = await placementDb();
  await db.prepare("DELETE FROM placement_owner_fences WHERE owner_id=? AND state='deleted'").bind(ownerId).run();
}

export async function mergePlacementOwners(accountOwnerId: string, guestOwnerId: string) {
  const mode = placementDbMode((await context()).env);
  if (mode === "legacy") return;
  const db = await placementDb();
  await db.prepare("INSERT INTO placement_owner_fences(owner_id,state,target_owner_id,created_at) VALUES(?,'merged',?,?) ON CONFLICT(owner_id) DO UPDATE SET state='merged',target_owner_id=excluded.target_owner_id")
    .bind(guestOwnerId, accountOwnerId, new Date().toISOString()).run();
  const [accountLoaded, guestLoaded] = await Promise.all([loadNormalizedPlacement(accountOwnerId), loadNormalizedPlacement(guestOwnerId)]);
  const account = accountLoaded ?? { state: empty(), revision: 0 };
  const guest = guestLoaded ?? { state: empty(), revision: 0 };
  if (guest.state.placementSessions?.length || guest.state.placementResults?.length) {
    const sessions = [...new Map([...(account.state.placementSessions ?? []), ...(guest.state.placementSessions ?? []).map((session) => ({ ...session, ownerId: accountOwnerId }))].map((session) => [session.id, session])).values()];
    const results = [...new Map([...(account.state.placementResults ?? []), ...(guest.state.placementResults ?? [])].map((result) => [result.id, result])).values()];
    const next = { ...empty(), placementSessions: sessions, placementResults: results };
    await saveNormalizedPlacement(accountOwnerId, account.state, next, account.revision);
  }
  await db.batch([
    db.prepare("DELETE FROM placement_sessions WHERE owner_id=?").bind(guestOwnerId),
    db.prepare("DELETE FROM placement_results WHERE owner_id=?").bind(guestOwnerId),
    db.prepare("DELETE FROM placement_owner_revisions WHERE owner_id=?").bind(guestOwnerId),
  ]);
}
