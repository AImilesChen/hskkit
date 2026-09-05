import assert from "node:assert/strict";
import test from "node:test";

import { emptyLearningState } from "../src/lib/learning/domain.ts";
import {
  answerPlacementQuestion,
  createPlacementSession,
  submitPlacement,
} from "../src/lib/placement/domain.ts";
import {
  ADAPTIVE_PLACEMENT_MAX_QUESTIONS,
  ADAPTIVE_PLACEMENT_MIN_QUESTIONS,
  PLACEMENT_QUESTIONS,
  PLACEMENT_VERSION,
  placementCatalog,
  trustedPlacementQuestion,
} from "../src/lib/placement/questions.ts";

const NOW = "2026-09-05T12:00:00.000Z";
const SKILLS = ["vocabulary", "grammar", "reading", "listening"];

test("adaptive Placement publishes a deep, versioned Level 1–9 four-skill bank", () => {
  assert.equal(PLACEMENT_VERSION, "hskkit-placement-adaptive-v3");
  assert.equal(ADAPTIVE_PLACEMENT_MIN_QUESTIONS, 18);
  assert.equal(ADAPTIVE_PLACEMENT_MAX_QUESTIONS, 24);
  for (const level of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    for (const skill of SKILLS) {
      const questions = PLACEMENT_QUESTIONS.filter((question) => question.level === level && question.skill === skill);
      assert.ok(questions.length >= 2, `Level ${level} ${skill} needs at least two approved diagnostic questions`);
      assert.ok(questions.every((question) => question.standardVersion === "HSK 3.0" && question.contentVersion === PLACEMENT_VERSION && question.qaStatus === "approved" && question.lifecycleStatus === "published"));
      if (skill === "listening") assert.ok(questions.every((question) => question.audioSrc && question.audioAssetId));
    }
  }
  assert.ok(placementCatalog("hskkit-placement-multiskill-v2").length >= 12, "v2 sessions must remain resumable");
});

function finish(answerFor: (question: (typeof PLACEMENT_QUESTIONS)[number], turn: number) => string) {
  let state = emptyLearningState();
  const created = createPlacementSession(state, { ownerId: "adaptive-owner", idempotencyKey: `start-${Math.random()}`, now: NOW });
  state = created.state;
  let session = created.session;
  assert.equal(session.questionIds.length, 1, "adaptive sessions reveal only the current path, not a fixed test");
  for (let turn = 0; turn < ADAPTIVE_PLACEMENT_MAX_QUESTIONS; turn += 1) {
    const questionId = session.questionIds[session.answers.length];
    assert.ok(questionId, "an unfinished adaptive session must expose its next question");
    const question = trustedPlacementQuestion(questionId, session.questionVersion)!;
    const answered = answerPlacementQuestion(state, {
      sessionId: session.id,
      questionId,
      answer: answerFor(question, turn),
      idempotencyKey: `answer-${turn}`,
      now: NOW,
    });
    state = answered.state;
    session = answered.session;
    if (session.adaptiveComplete) break;
  }
  assert.ok(session.adaptiveComplete, "adaptive session must stop by the hard cap");
  assert.ok(session.answers.length >= ADAPTIVE_PLACEMENT_MIN_QUESTIONS);
  assert.ok(session.answers.length <= ADAPTIVE_PLACEMENT_MAX_QUESTIONS);
  assert.equal(session.answers.length, session.questionIds.length);
  return submitPlacement(state, { sessionId: session.id, idempotencyKey: "submit", now: NOW });
}

test("adaptive Placement raises and lowers difficulty while reaching both recommendation boundaries", () => {
  const high = finish((question) => question.correctAnswer);
  assert.equal(high.result.recommendedLevel, 9);
  assert.equal(high.result.confidence, "high");
  assert.deepEqual(high.result.missingDimensions, []);

  const low = finish((question) => Object.keys(question.options).find((answer) => answer !== question.correctAnswer)!);
  assert.equal(low.result.recommendedLevel, 1);
  assert.equal(low.result.confidence, "high");
  assert.deepEqual(low.result.missingDimensions, []);
});

test("adaptive Placement is deterministic for the same answer pattern and covers every skill", () => {
  const first = finish((question, turn) => turn % 3 === 0 ? Object.keys(question.options).find((answer) => answer !== question.correctAnswer)! : question.correctAnswer);
  const second = finish((question, turn) => turn % 3 === 0 ? Object.keys(question.options).find((answer) => answer !== question.correctAnswer)! : question.correctAnswer);
  assert.equal(first.result.recommendedLevel, second.result.recommendedLevel);
  assert.equal(first.result.totalCount, second.result.totalCount);
  assert.deepEqual(first.result.weakSkills, second.result.weakSkills);
  const session = first.state.placementSessions!.find((candidate) => candidate.id === first.session.id)!;
  const measuredSkills = new Set(session.questionIds.map((id) => trustedPlacementQuestion(id, session.questionVersion)!.skill));
  assert.deepEqual([...measuredSkills].sort(), [...SKILLS].sort());
});
