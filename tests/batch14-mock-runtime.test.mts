import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { applyMockResultToLearning } from "../src/lib/mock/learning.ts";
import { saveMockAnswer, startMock, submitMock } from "../src/lib/mock/domain.ts";
import type { LearningState } from "../src/lib/learning/domain.ts";

const root = new URL("../", import.meta.url);
const source = async (path: string) => readFile(new URL(path, root), "utf8");
const empty = (): LearningState => ({ attempts: [], cards: [], mistakes: [], dailySessions: [] });

test("Basic result writes traceable Mock attempts, SRS cards and Mistakes idempotently", () => {
  const now = "2026-08-23T04:00:00.000Z";
  let session = startMock({ band: "basic", ownerId: "guest-runtime", idempotencyKey: "runtime-start", now });
  const first = session.questions[0];
  session = saveMockAnswer(session, { questionId: first.id, answer: first.correctAnswer, idempotencyKey: "runtime-answer", now });
  const { result } = submitMock(session, { idempotencyKey: "runtime-submit", now });
  const once = applyMockResultToLearning(empty(), result);
  assert.equal(once.attempts.length, 18);
  assert.equal(once.cards.length, 18);
  assert.equal(once.mistakes.length, 17);
  assert.ok(once.attempts.every((attempt) => attempt.sessionId === session.id && attempt.questionVersion === session.questionSetVersion));
  const replay = applyMockResultToLearning(once, result);
  assert.equal(replay.attempts.length, 18);
  assert.equal(replay.mistakes.length, 17);
});

test("Batch 14 runtime has durable trace schema and no answer key in in-progress public route", async () => {
  const migration = await source("migrations/0011_batch14_mock.sql");
  for (const token of ["mock_sessions", "mock_attempts", "question_set_version", "scoring_version", "snapshot_json", "result_json", "owner_id", "deadline_at"]) assert.match(migration, new RegExp(token));
  const route = await source("src/app/api/v1/mock/route.ts");
  assert.match(route, /publicMockSession/);
  assert.match(route, /saveMockAnswer/);
  assert.match(route, /submitMock/);
  assert.match(route, /applyMockResultToLearning/);
  assert.match(route, /REVISION_CONFLICT/);
  assert.doesNotMatch(route, /correctAnswer\s*:/);
});

test("Batch 14 client implements timer, autosave, restore, submit and required result routes", async () => {
  const client = await source("src/app/components/mock-exam.tsx");
  for (const token of ["deadlineAt", "localStorage", "action: \"answer\"", "action: \"submit\"", "Autosaved", "/mistakes", "/review", "/planner"]) assert.match(client, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(client, /setInterval/);
  assert.match(client, /390/);
  const page = await source("src/app/mock/[band]/page.tsx");
  assert.match(page, /MockExam/);
  assert.doesNotMatch(page, /Mock is not open/);
});
