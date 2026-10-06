import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { MockResult, MockSession } from "./domain.ts";

type MockRow = {
  id: string;
  owner_id: string;
  band: MockSession["band"];
  status: MockSession["status"];
  start_idempotency_key: string;
  question_set_version: string;
  scoring_version: string;
  snapshot_json: string;
  answers_json: string;
  answer_keys_json: string;
  result_json: string | null;
  revision: number;
  started_at: string;
  deadline_at: string;
  submitted_at: string | null;
};
const database = async () => (await getCloudflareContext({ async: true })).env.LEARNING_DB;
const fromRow = (row: MockRow): MockSession => ({
  id: row.id,
  ownerId: row.owner_id,
  band: row.band,
  status: row.status,
  startIdempotencyKey: row.start_idempotency_key,
  questionSetVersion: row.question_set_version,
  scoringVersion: row.scoring_version,
  questions: JSON.parse(row.snapshot_json) as MockSession["questions"],
  answers: JSON.parse(row.answers_json) as MockSession["answers"],
  answerKeys: JSON.parse(row.answer_keys_json) as string[],
  result: row.result_json ? JSON.parse(row.result_json) as MockResult : undefined,
  revision: row.revision,
  startedAt: row.started_at,
  deadlineAt: row.deadline_at,
  submittedAt: row.submitted_at ?? undefined,
});
const columns = "id,owner_id,band,status,start_idempotency_key,question_set_version,scoring_version,snapshot_json,answers_json,answer_keys_json,result_json,revision,started_at,deadline_at,submitted_at";
export async function withdrawnMockQuestionIds(questionIds: string[], now = new Date().toISOString()) {
  if (!questionIds.length) return new Set<string>();
  const placeholders = questionIds.map(() => "?").join(",");
  const result = await (await database()).prepare(`SELECT question_id,lifecycle FROM (SELECT question_id,lifecycle,ROW_NUMBER() OVER(PARTITION BY question_id ORDER BY effective_at DESC,id DESC) AS rank FROM mock_content_events WHERE question_id IN (${placeholders}) AND effective_at<=?) WHERE rank=1`)
    .bind(...questionIds, now).all<{ question_id: string; lifecycle: "published" | "withdrawn" }>();
  const events = result.results as Array<{ question_id: string; lifecycle: "published" | "withdrawn" }>;
  return new Set(events.filter((event) => event.lifecycle === "withdrawn").map((event) => event.question_id));
}

export async function findMockByStartKey(ownerId: string, band: MockSession["band"], key: string) {
  const row = await (await database()).prepare(`SELECT ${columns} FROM mock_sessions WHERE owner_id=? AND band=? AND start_idempotency_key=?`).bind(ownerId, band, key).first<MockRow>();
  return row ? fromRow(row) : undefined;
}
export async function loadMockSession(ownerId: string, sessionId: string) {
  const row = await (await database()).prepare(`SELECT ${columns} FROM mock_sessions WHERE id=? AND owner_id=?`).bind(sessionId, ownerId).first<MockRow>();
  return row ? fromRow(row) : undefined;
}
export async function recentMockExposure(ownerId: string, band: MockSession["band"], targetLevel?: number) {
  const rows = await (await database()).prepare("SELECT snapshot_json FROM mock_attempts WHERE owner_id=? AND band=? ORDER BY submitted_at DESC LIMIT 6")
    .bind(ownerId, band).all<{ snapshot_json: string }>();
  const questions: MockSession["questions"] = (rows.results as Array<{ snapshot_json: string }>).flatMap((row) => {
    try { return JSON.parse(row.snapshot_json) as MockSession["questions"]; }
    catch { return []; }
  }).filter((question: MockSession["questions"][number]) => band === "advanced" || question.level === targetLevel);
  return {
    questionIds: [...new Set(questions.map((question) => question.id))],
    groupIds: [...new Set(questions.map((question) => question.sourceGroupId ?? question.id))],
  };
}
export async function createMockSession(session: MockSession) {
  const now = session.startedAt;
  try {
    await (await database()).prepare("INSERT INTO mock_sessions(id,owner_id,band,status,start_idempotency_key,question_set_version,scoring_version,snapshot_json,answers_json,answer_keys_json,result_json,revision,started_at,deadline_at,submitted_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(session.id, session.ownerId, session.band, session.status, session.startIdempotencyKey, session.questionSetVersion, session.scoringVersion, JSON.stringify(session.questions), "[]", "[]", null, 0, session.startedAt, session.deadlineAt, null, now, now).run();
  } catch {
    const prior = await findMockByStartKey(session.ownerId, session.band, session.startIdempotencyKey);
    if (prior) return prior;
    throw new Error("MOCK_START_FAILED");
  }
  return session;
}
export async function saveMockProgress(session: MockSession, expectedRevision: number) {
  const result = await (await database()).prepare("UPDATE mock_sessions SET answers_json=?,answer_keys_json=?,revision=?,updated_at=? WHERE id=? AND owner_id=? AND status='in_progress' AND revision=?")
    .bind(JSON.stringify(session.answers), JSON.stringify(session.answerKeys), session.revision, session.answers.at(-1)?.savedAt ?? new Date().toISOString(), session.id, session.ownerId, expectedRevision).run();
  if (!(result.meta.changes ?? 0)) throw new Error("REVISION_CONFLICT");
}
export async function discardMockSession(session: MockSession, expectedRevision: number) {
  const result = await (await database()).prepare("DELETE FROM mock_sessions WHERE id=? AND owner_id=? AND status='in_progress' AND revision=?")
    .bind(session.id, session.ownerId, expectedRevision).run();
  if (!(result.meta.changes ?? 0)) throw new Error("REVISION_CONFLICT");
}
export async function saveMockSubmission(session: MockSession, expectedRevision: number) {
  if (!session.result || !session.submittedAt) throw new Error("MOCK_RESULT_REQUIRED");
  const db = await database();
  try {
    const results = await db.batch([
      db.prepare("UPDATE mock_sessions SET status='submitted',answers_json=?,answer_keys_json=?,result_json=?,revision=?,submitted_at=?,updated_at=? WHERE id=? AND owner_id=? AND status='in_progress' AND revision=?")
        .bind(JSON.stringify(session.answers), JSON.stringify(session.answerKeys), JSON.stringify(session.result), session.revision, session.submittedAt, session.submittedAt, session.id, session.ownerId, expectedRevision),
      db.prepare("INSERT INTO mock_attempts(id,session_id,owner_id,band,question_set_version,scoring_version,snapshot_json,answers_json,result_json,submitted_at,created_at) SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM mock_sessions WHERE id=? AND owner_id=? AND status='submitted') ON CONFLICT(session_id) DO NOTHING")
        .bind(session.result.id, session.id, session.ownerId, session.band, session.questionSetVersion, session.scoringVersion, JSON.stringify(session.questions), JSON.stringify(session.answers), JSON.stringify(session.result), session.submittedAt, session.submittedAt, session.id, session.ownerId),
    ]);
    if (!(results[0].meta.changes ?? 0)) {
      const prior = await loadMockSession(session.ownerId, session.id);
      if (prior?.status === "submitted" && prior.result?.submitIdempotencyKey === session.result.submitIdempotencyKey) return prior;
      throw new Error("REVISION_CONFLICT");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "REVISION_CONFLICT") throw error;
    throw new Error("MOCK_SUBMIT_FAILED");
  }
  return session;
}
