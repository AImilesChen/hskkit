import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { emptyLearningState, type LearningState, type PlacementSession } from "../src/lib/learning/domain.ts";
import {
  answerPlacementQuestion,
  createPlacementSession,
  restartPlacement,
  submitPlacement,
} from "../src/lib/placement/domain.ts";
import {
  ADAPTIVE_PLACEMENT_MAX_QUESTIONS,
  ADAPTIVE_PLACEMENT_MIN_QUESTIONS,
  PLACEMENT_INITIAL_QUESTIONS,
  PLACEMENT_QUESTIONS,
  PLACEMENT_VERSION,
  placementCatalog,
  trustedPlacementQuestion,
} from "../src/lib/placement/questions.ts";

const NOW = "2026-09-05T12:00:00.000Z";
const SKILLS = ["vocabulary", "grammar", "reading", "listening"];
const resultClient = fs.readFileSync(new URL("../src/app/placement/result/[id]/placement-result-client.tsx", import.meta.url), "utf8");

const wrongAnswer = (question: (typeof PLACEMENT_QUESTIONS)[number]) =>
  Object.keys(question.options).find((answer) => answer !== question.correctAnswer)!;

function finish(
  ownerId: string,
  answerFor: (question: (typeof PLACEMENT_QUESTIONS)[number], turn: number) => string,
) {
  let state = emptyLearningState();
  const created = createPlacementSession(state, { ownerId, idempotencyKey: `start-${ownerId}`, now: NOW });
  state = created.state;
  let session = created.session;
  assert.equal(session.questionIds.length, PLACEMENT_INITIAL_QUESTIONS);
  for (let turn = 0; turn < ADAPTIVE_PLACEMENT_MAX_QUESTIONS; turn += 1) {
    const questionId = session.questionIds[session.answers.length];
    assert.ok(questionId, "unfinished adaptive sessions expose one queued question");
    const question = trustedPlacementQuestion(questionId, session.questionVersion)!;
    const answered = answerPlacementQuestion(state, {
      sessionId: session.id,
      questionId,
      answer: answerFor(question, turn),
      idempotencyKey: `answer-${turn}`,
      now: new Date(Date.parse(NOW) + turn * 1_000).toISOString(),
    });
    state = answered.state;
    session = answered.session;
    if (session.adaptiveComplete) break;
  }
  assert.ok(session.adaptiveComplete);
  assert.ok(session.answers.length >= ADAPTIVE_PLACEMENT_MIN_QUESTIONS);
  assert.ok(session.answers.length <= ADAPTIVE_PLACEMENT_MAX_QUESTIONS);
  assert.equal(session.answers.length, session.questionIds.length);
  return submitPlacement(state, { sessionId: session.id, idempotencyKey: "submit", now: "2026-09-05T12:10:00.000Z" });
}

test("P1 bank has seven bands, four skills and at least five candidates per cell", () => {
  assert.equal(PLACEMENT_VERSION, "hskkit-placement-accuracy-v4");
  assert.equal(PLACEMENT_INITIAL_QUESTIONS, 12);
  assert.equal(ADAPTIVE_PLACEMENT_MIN_QUESTIONS, 18);
  assert.equal(ADAPTIVE_PLACEMENT_MAX_QUESTIONS, 24);
  assert.ok(PLACEMENT_QUESTIONS.length >= 140);
  for (const band of [1, 2, 3, 4, 5, 6, 7]) {
    for (const skill of SKILLS) {
      const questions = PLACEMENT_QUESTIONS.filter((question) => question.level === band && question.skill === skill);
      assert.ok(questions.length >= 5, `band ${band} ${skill} needs at least five candidates`);
    }
  }
  assert.equal(PLACEMENT_QUESTIONS.some((question) => question.level > 7), false, "HSK 7–9 stays one advanced band");
  assert.ok(placementCatalog("hskkit-placement-adaptive-v3").some((question) => question.level === 9), "v3 sessions remain resumable");
});

test("first round is stable on refresh and stratified 4/4/4 across all skills", () => {
  const first = createPlacementSession(emptyLearningState(), { ownerId: "stratified-owner", idempotencyKey: "same", now: NOW });
  const replay = createPlacementSession(first.state, { ownerId: "stratified-owner", idempotencyKey: "same", now: NOW });
  assert.deepEqual(replay.session.questionIds, first.session.questionIds);
  const questions = first.session.questionIds.map((id) => trustedPlacementQuestion(id, first.session.questionVersion)!);
  assert.deepEqual(SKILLS.map((skill) => questions.filter((question) => question.skill === skill).length), [3, 3, 3, 3]);
  const tiers = [
    questions.filter((question) => question.level <= 2).length,
    questions.filter((question) => question.level >= 3 && question.level <= 4).length,
    questions.filter((question) => question.level >= 5).length,
  ];
  assert.deepEqual(tiers, [4, 4, 4]);
  assert.equal(new Set(first.session.questionIds).size, PLACEMENT_INITIAL_QUESTIONS);
});

test("adaptive result reaches boundaries and reports each skill separately", () => {
  const high = finish("high-owner", (question) => question.correctAnswer);
  assert.equal(high.result.recommendedLevel, 7);
  assert.equal(high.result.confidence, "high");
  assert.deepEqual(Object.keys(high.result.skillPerformance ?? {}).sort(), [...SKILLS].sort());
  for (const skill of SKILLS) assert.ok((high.result.skillPerformance?.[skill]?.total ?? 0) >= 4);

  const low = finish("low-owner", (question) => wrongAnswer(question));
  assert.equal(low.result.recommendedLevel, 1);
  assert.equal(low.result.confidence, "high");
});

test("inconsistent evidence extends the test but never exceeds 24 questions", () => {
  const result = finish("unstable-owner", (question, turn) => turn % 2 === 0 ? question.correctAnswer : wrongAnswer(question));
  assert.ok(result.result.totalCount >= 18);
  assert.ok(result.result.totalCount <= 24);
});

test("short retakes show a cooldown and later retakes avoid the prior first round", () => {
  const completed = finish("retake-owner", (question) => question.correctAnswer);
  assert.ok(completed.result.retakeAvailableAt);
  assert.throws(() => restartPlacement(completed.state, {
    ownerId: "retake-owner",
    previousSessionId: completed.session.id,
    idempotencyKey: "too-soon",
    now: "2026-09-05T13:00:00.000Z",
  }), /PLACEMENT_RETAKE_COOLDOWN/);
  assert.throws(() => createPlacementSession(completed.state, {
    ownerId: "retake-owner",
    idempotencyKey: "bypass-start",
    now: "2026-09-05T13:00:00.000Z",
  }), /PLACEMENT_RETAKE_COOLDOWN/);
  const restarted = restartPlacement(completed.state, {
    ownerId: "retake-owner",
    previousSessionId: completed.session.id,
    idempotencyKey: "after-cooldown",
    now: "2026-09-06T13:00:00.000Z",
  });
  assert.equal(restarted.session.questionIds.some((id) => completed.session.questionIds.includes(id)), false);
});

test("v3 in-progress sessions remain resumable after the accuracy upgrade", () => {
  const legacyCatalog = placementCatalog("hskkit-placement-adaptive-v3");
  const firstQuestion = legacyCatalog[0];
  const v3Session: PlacementSession = {
    id: "v3-session",
    ownerId: "v3-owner",
    idempotencyKey: "v3-start",
    questionVersion: "hskkit-placement-adaptive-v3",
    questionIds: [firstQuestion.id],
    answers: [],
    status: "in_progress",
    createdAt: NOW,
    adaptiveComplete: false,
    adaptiveMinQuestions: 18,
    adaptiveMaxQuestions: 24,
  };
  let state: LearningState = {
    ...emptyLearningState(),
    placementSessions: [v3Session],
  };
  let current = v3Session;
  for (let turn = 0; turn < 24 && !current.adaptiveComplete; turn += 1) {
    const questionId = current.questionIds[current.answers.length];
    const question = legacyCatalog.find((candidate) => candidate.id === questionId)!;
    const answered = answerPlacementQuestion(state, {
      sessionId: "v3-session",
      questionId,
      answer: question.correctAnswer,
      idempotencyKey: `v3-answer-${turn}`,
      now: NOW,
    });
    state = answered.state;
    current = answered.session;
  }
  assert.equal(current.adaptiveComplete, true);
  assert.equal(current.answers.length >= 18 && current.answers.length <= 24, true);
  assert.deepEqual(new Set(current.questionIds.map((id) => legacyCatalog.find((question) => question.id === id)?.skill)), new Set(SKILLS));
});

test("result UI exposes test suggestion, four-skill performance, manual level choice and cooldown copy", () => {
  for (const token of ["Test suggestion", "Vocabulary", "Grammar", "Reading", "Listening", "Adjust your starting level", "Retake available"]) {
    assert.match(resultClient, new RegExp(token));
  }
  assert.match(resultClient, /Start learning/);
});
