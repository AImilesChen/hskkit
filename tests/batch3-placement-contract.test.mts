import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { emptyLearningState } from "../src/lib/learning/domain.ts";
import { answerPlacementQuestion, createPlacementSession, placementResult, resumePlacement, submitPlacement } from "../src/lib/placement/domain.ts";
import { PLACEMENT_QUESTIONS, PLACEMENT_VERSION, trustedPlacementQuestion } from "../src/lib/placement/questions.ts";

const start = (now = "2026-08-21T00:00:00.000Z") => createPlacementSession(emptyLearningState(), {
  ownerId: "batch3-guest",
  idempotencyKey: "batch3-start",
  now,
});

function finishAdaptive(state: ReturnType<typeof emptyLearningState>, sessionId: string, answer: "correct" | "wrong") {
  for (let index = 0; index < 24; index += 1) {
    const session = state.placementSessions!.find((candidate) => candidate.id === sessionId)!;
    if (session.adaptiveComplete) return state;
    const questionId = session.questionIds[session.answers.length];
    const question = trustedPlacementQuestion(questionId, session.questionVersion)!;
    state = answerPlacementQuestion(state, { sessionId, questionId, answer: answer === "correct" ? question.correctAnswer : "__wrong__", idempotencyKey: `${answer}-${index}`, now: "2026-08-21T01:00:00.000Z" }).state;
  }
  return state;
}

const source = (path: string) => {
  const url = new URL(path, import.meta.url);
  return fs.existsSync(url) ? fs.readFileSync(url, "utf8") : "";
};

test("production diagnostic catalog is versioned and covers the confirmed Level 1–9 path", () => {
  assert.equal(PLACEMENT_VERSION.length > 0, true);
  assert.deepEqual([...new Set(PLACEMENT_QUESTIONS.map((question) => question.level))], [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(PLACEMENT_QUESTIONS.every((question) => question.contentVersion === PLACEMENT_VERSION && question.standardVersion === "HSK 3.0"), true);
  assert.equal(trustedPlacementQuestion(PLACEMENT_QUESTIONS[0].id, "retired-version"), undefined);
});

test("placement session freezes its content version and expires explicitly", () => {
  const created = start();
  assert.equal(created.session.questionVersion, PLACEMENT_VERSION);
  assert.equal(typeof created.session.expiresAt, "string");
  assert.equal(resumePlacement(created.state, "batch3-guest", "2026-08-21T01:00:00.000Z")?.id, created.session.id);
  assert.equal(resumePlacement(created.state, "batch3-guest", "2026-08-29T00:00:01.000Z"), undefined);
  const question = PLACEMENT_QUESTIONS[0];
  assert.throws(() => answerPlacementQuestion(created.state, {
    sessionId: created.session.id,
    questionId: question.id,
    answer: question.correctAnswer,
    idempotencyKey: "late-answer",
    now: "2026-08-29T00:00:01.000Z",
  }), /PLACEMENT_SESSION_EXPIRED/);
});

test("placement refuses to create a misleading empty diagnostic", () => {
  assert.throws(() => createPlacementSession(emptyLearningState(), {
    ownerId: "batch3-empty",
    idempotencyKey: "empty-start",
    now: "2026-08-21T00:00:00.000Z",
    catalog: [],
  } as Parameters<typeof createPlacementSession>[1]), /PLACEMENT_NO_QUESTIONS/);
});

test("duplicate final submission is idempotent, private, and can recommend both ends of Level 1–9", () => {
  let lowState = start().state;
  const lowSessionId = lowState.placementSessions![0].id;
  lowState = finishAdaptive(lowState, lowSessionId, "wrong");
  const low = submitPlacement(lowState, { sessionId: lowSessionId, idempotencyKey: "low-submit", now: "2026-08-21T02:00:00.000Z" });
  const replay = submitPlacement(low.state, { sessionId: lowSessionId, idempotencyKey: "low-submit", now: "2026-08-21T02:01:00.000Z" });
  assert.equal(low.result.id, replay.result.id);
  assert.equal(low.result.recommendedLevel, 1);
  assert.equal(placementResult(low.state, "another-owner", low.result.id), undefined);
  assert.match(low.result.disclaimer, /learning suggestion, not an official HSK score/i);

  let highState = createPlacementSession(emptyLearningState(), { ownerId: "batch3-high", idempotencyKey: "high-start", now: "2026-08-21T00:00:00.000Z" }).state;
  const highSessionId = highState.placementSessions![0].id;
  highState = finishAdaptive(highState, highSessionId, "correct");
  const high = submitPlacement(highState, { sessionId: highSessionId, idempotencyKey: "high-submit", now: "2026-08-21T02:00:00.000Z" });
  assert.equal(high.result.recommendedLevel, 7);
});

test("batch 3 REST entry points exist and the placement UI uses them", () => {
  const sessionsRoute = source("../src/app/api/v1/placement/sessions/route.ts");
  const placementServer = source("../src/lib/placement/server.ts");
  const attemptsRoute = source("../src/app/api/v1/attempts/[id]/submit/route.ts");
  const client = source("../src/app/placement/placement-client.tsx");
  const clientRecovery = source("../src/app/placement/client-recovery.ts");
  const resultClient = source("../src/app/placement/result/[id]/placement-result-client.tsx");
  assert.match(sessionsRoute, /export async function GET/);
  assert.match(sessionsRoute, /export async function POST/);
  for (const field of ["status", "latestResultId", "retakeAvailableAt", "canRetake", "serverNow"]) {
    assert.match(placementServer, new RegExp(field));
  }
  assert.match(attemptsRoute, /export async function POST/);
  assert.match(client, /\/api\/v1\/placement\/sessions/);
  assert.match(client, /\/api\/v1\/attempts\/\$\{encodeURIComponent\(session\.id\)\}\/submit/);
  assert.match(client, /session\.id\.slice\(-24\)/);
  assert.doesNotMatch(client, /placement-answer:\$\{session\.id\}:/);
  assert.match(client, /setManualIndex\(index\)/);
  assert.match(client, /PLACEMENT_SESSION_EXPIRED/);
  assert.match(client, /const \[loadError, setLoadError\]/);
  assert.match(client, /const \[startError, setStartError\]/);
  assert.match(client, /const \[answerError, setAnswerError\]/);
  assert.match(client, /Your latest placement is ready/);
  assert.match(client, /View my result/);
  assert.match(client, /Retake available/);
  assert.match(client, /const cooldownActive = placementStatus === "cooldown"/);
  assert.match(client, /placementRetakeLocked\(placementStatus, canRetake\)/);
  assert.match(client, /serverClockOffsetMs/);
  assert.match(client, /void load\(\)/);
  assert.doesNotMatch(client, /const \[error, setError\]/);
  assert.match(clientRecovery, /PLACEMENT_NO_QUESTIONS/);
  assert.match(resultClient, /\/vocabulary\/\$\{catalogLevel\}/);
});
