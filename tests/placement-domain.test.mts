import assert from "node:assert/strict";
import test from "node:test";

import { emptyLearningState } from "../src/lib/learning/domain.ts";
import {
  answerPlacementQuestion,
  createPlacementSession,
  restartPlacement,
  submitPlacement,
} from "../src/lib/placement/domain.ts";
import {
  PLACEMENT_QUESTIONS,
  PLACEMENT_VERSION,
  publicPlacementQuestion,
} from "../src/lib/placement/questions.ts";

test("public placement payload never exposes correct answers", () => {
  const publicQuestion = publicPlacementQuestion(PLACEMENT_QUESTIONS[0]);
  assert.equal(Object.hasOwn(publicQuestion, "correctAnswer"), false);
  assert.equal(publicQuestion.publicationStatus, "diagnostic-only");
});

test("placement creates one resumable versioned session for an idempotency key", () => {
  const initial = emptyLearningState();
  const first = createPlacementSession(initial, { ownerId: "guest-1", idempotencyKey: "start-1", now: "2026-08-21T00:00:00.000Z" });
  const replay = createPlacementSession(first.state, { ownerId: "guest-1", idempotencyKey: "start-1", now: "2026-08-21T00:01:00.000Z" });
  assert.equal(first.session.id, replay.session.id);
  assert.equal(replay.state.placementSessions?.length, 1);
  assert.equal(first.session.questionVersion, PLACEMENT_VERSION);
  assert.deepEqual(first.session.questionIds, PLACEMENT_QUESTIONS.map((question) => question.id));
});

test("placement answers persist without exposing scoring and replay idempotently", () => {
  const created = createPlacementSession(emptyLearningState(), { ownerId: "guest-1", idempotencyKey: "start-2", now: "2026-08-21T00:00:00.000Z" });
  const question = PLACEMENT_QUESTIONS[0];
  const answered = answerPlacementQuestion(created.state, { sessionId: created.session.id, questionId: question.id, answer: "a", idempotencyKey: "answer-1", now: "2026-08-21T00:01:00.000Z" });
  const replay = answerPlacementQuestion(answered.state, { sessionId: created.session.id, questionId: question.id, answer: "b", idempotencyKey: "answer-1", now: "2026-08-21T00:02:00.000Z" });
  assert.equal(replay.session.answers[0].answer, "a");
  assert.equal(replay.session.answers.length, 1);
});

test("placement refuses an incomplete submission", () => {
  const created = createPlacementSession(emptyLearningState(), { ownerId: "guest-1", idempotencyKey: "start-3", now: "2026-08-21T00:00:00.000Z" });
  assert.throws(() => submitPlacement(created.state, { sessionId: created.session.id, idempotencyKey: "submit-1", now: "2026-08-21T00:03:00.000Z" }), /PLACEMENT_INCOMPLETE/);
});

test("placement result is deterministic, idempotent and explicitly low confidence without listening", () => {
  let state = createPlacementSession(emptyLearningState(), { ownerId: "guest-1", idempotencyKey: "start-4", now: "2026-08-21T00:00:00.000Z" }).state;
  const sessionId = state.placementSessions![0].id;
  PLACEMENT_QUESTIONS.forEach((question, index) => {
    state = answerPlacementQuestion(state, { sessionId, questionId: question.id, answer: index < 4 ? question.correctAnswer : "__wrong__", idempotencyKey: `answer-${index}`, now: "2026-08-21T00:01:00.000Z" }).state;
  });
  const first = submitPlacement(state, { sessionId, idempotencyKey: "submit-2", now: "2026-08-21T00:05:00.000Z" });
  const replay = submitPlacement(first.state, { sessionId, idempotencyKey: "submit-2", now: "2026-08-21T00:06:00.000Z" });
  assert.equal(first.result.id, replay.result.id);
  assert.equal(first.result.recommendedLevel, 4);
  assert.equal(first.result.confidence, "low");
  assert.deepEqual(first.result.missingDimensions, ["listening"]);
  assert.equal(first.result.disclaimer.includes("not an official"), true);
});

test("restart closes the prior session and creates a separate clean attempt", () => {
  const created = createPlacementSession(emptyLearningState(), { ownerId: "guest-1", idempotencyKey: "start-5", now: "2026-08-21T00:00:00.000Z" });
  const restarted = restartPlacement(created.state, { ownerId: "guest-1", previousSessionId: created.session.id, idempotencyKey: "restart-1", now: "2026-08-21T00:10:00.000Z" });
  assert.notEqual(restarted.session.id, created.session.id);
  assert.equal(restarted.session.answers.length, 0);
  assert.equal(restarted.state.placementSessions?.find((entry) => entry.id === created.session.id)?.status, "abandoned");
});
