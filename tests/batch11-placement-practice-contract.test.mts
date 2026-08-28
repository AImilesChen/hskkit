import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { emptyLearningState } from "../src/lib/learning/domain.ts";
import catalog from "../src/lib/content/catalog.json" with { type: "json" };
import { answerPlacementQuestion, createPlacementSession, submitPlacement } from "../src/lib/placement/domain.ts";
import { LEGACY_PLACEMENT_VERSION, PLACEMENT_QUESTIONS, PLACEMENT_VERSION, placementCatalog, trustedPlacementQuestion } from "../src/lib/placement/questions.ts";
import { answerPracticeQuestion, createPracticeSession, publicPracticeSession, selectPracticeSession } from "../src/lib/practice/domain.ts";
import { PRACTICE_QUESTIONS, PRACTICE_SKILLS, practiceQuestionSet, trustedPracticeQuestionVersion } from "../src/lib/practice/questions.ts";

const source = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const NOW = "2026-08-22T09:00:00.000Z";

function completePlacement(catalog = PLACEMENT_QUESTIONS) {
  let state = createPlacementSession(emptyLearningState(), { ownerId: "batch11-placement", idempotencyKey: `start:${catalog.length}`, now: NOW, catalog }).state;
  const sessionId = state.placementSessions![0].id;
  for (const [index, question] of catalog.entries()) {
    state = answerPlacementQuestion(state, { sessionId, questionId: question.id, answer: question.correctAnswer, idempotencyKey: `answer:${index}`, now: NOW }).state;
  }
  return submitPlacement(state, { sessionId, idempotencyKey: "submit", now: NOW });
}

test("Placement v2 includes approved formal Listening while retaining an honest no-listening fallback", () => {
  assert.notEqual(PLACEMENT_VERSION, "hskkit-placement-v1");
  const listening = PLACEMENT_QUESTIONS.filter((question) => question.skill === "listening");
  assert.ok(listening.length >= 3);
  assert.ok(listening.every((question) => question.audioSrc && question.sourceRef && question.qaStatus === "approved" && question.lifecycleStatus === "published"));

  const measured = completePlacement();
  assert.equal(measured.result.missingDimensions.includes("listening"), false);
  assert.notEqual(measured.result.confidence, "low");
  assert.match(measured.result.evidenceSummary, /Listening was measured/i);

  const textOnly = PLACEMENT_QUESTIONS.filter((question) => question.skill !== "listening");
  const degraded = completePlacement(textOnly);
  assert.equal(degraded.result.confidence, "low");
  assert.deepEqual(degraded.result.missingDimensions, ["listening"]);
  assert.match(degraded.result.evidenceSummary, /Listening was not measured/i);

  const withdrawn = structuredClone(catalog);
  withdrawn.audioAssets = withdrawn.audioAssets.map((asset) => ({ ...asset, withdrawnAt: "2026-08-22T09:00:00.000Z" }));
  assert.equal(placementCatalog(PLACEMENT_VERSION, withdrawn).some((question) => question.skill === "listening"), false);
});

test("legacy Placement and Practice snapshots remain available to version-fenced sessions", () => {
  assert.ok(placementCatalog(LEGACY_PLACEMENT_VERSION).length >= 9);
  assert.ok(trustedPlacementQuestion("placement-v1-l1-vocab", LEGACY_PLACEMENT_VERSION));
  assert.ok(trustedPracticeQuestionVersion("practice-v1-l1-vocab-hello", "hskkit-practice-l1-vocabulary-v1"));
  const legacySession = {
    id: "legacy-practice-session",
    ownerId: "legacy-owner",
    idempotencyKey: "legacy-start",
    mode: "practice" as const,
    standardVersion: "HSK 3.0" as const,
    level: 1,
    skill: "vocabulary",
    questionVersion: "hskkit-practice-l1-vocabulary-v1",
    questionIds: ["practice-v1-l1-vocab-hello", "practice-v1-l1-vocab-thanks", "practice-v1-l1-vocab-goodbye"],
    answers: [],
    status: "in_progress" as const,
    createdAt: NOW,
    expiresAt: "2026-08-23T09:00:00.000Z",
  };
  const legacyState = { ...emptyLearningState(), practiceSessions: [legacySession] };
  const selected = selectPracticeSession(legacyState, { ownerId: "legacy-owner", level: 1, skill: "vocabulary" });
  assert.equal(selected?.id, legacySession.id);
  assert.equal(publicPracticeSession(selected!, NOW).questions.length, 3);
});

test("formal Practice publishes four skills for Levels 1–6 and one unified Advanced 7–9 band", () => {
  assert.deepEqual(PRACTICE_SKILLS, ["vocabulary", "grammar", "reading", "listening"]);
  for (const level of [1, 2, 3, 4, 5, 6, 7]) {
    for (const skill of PRACTICE_SKILLS) {
      const set = practiceQuestionSet(level, skill);
      assert.ok(set.length >= 8, `Level/band ${level} ${skill} must have at least 8 formal questions`);
      assert.equal(new Set(set.map((question) => question.contentVersion)).size, 1);
      assert.ok(set.every((question) => question.standardVersion === "HSK 3.0" && question.sourceRef && question.qaStatus === "approved" && question.lifecycleStatus === "published"));
      if (skill === "listening") assert.ok(set.every((question) => question.audioSrc));
    }
  }
  for (const skill of PRACTICE_SKILLS) {
    assert.equal(practiceQuestionSet(8, skill).length, 0);
    assert.equal(practiceQuestionSet(9, skill).length, 0);
  }
  assert.ok(PRACTICE_QUESTIONS.every((question) => new Set(Object.values(question.options).map((value) => value.normalize("NFC"))).size === 4), "all published options must be visually unique");
});

test("Practice snapshots remain traceable and wrong Listening answers enter audio Mistakes and SRS exactly once", () => {
  const question = practiceQuestionSet(7, "listening")[0];
  assert.equal(trustedPracticeQuestionVersion(question.id, question.contentVersion)?.id, question.id);
  assert.equal(trustedPracticeQuestionVersion(question.id, "retired-version"), undefined);

  const created = createPracticeSession(emptyLearningState(), { ownerId: "batch11-practice", level: 7, skill: "listening", idempotencyKey: "start", now: NOW });
  const wrong = Object.keys(question.options).find((answer) => answer !== question.correctAnswer)!;
  const input = { ownerId: "batch11-practice", sessionId: created.session.id, questionId: question.id, answer: wrong, idempotencyKey: "answer", now: NOW };
  const answered = answerPracticeQuestion(created.state, input);
  const replay = answerPracticeQuestion(answered.state, input);
  assert.equal(replay.state.attempts.length, 1);
  assert.equal(replay.state.mistakes.length, 1);
  assert.equal(replay.state.cards.length, 1);
  assert.equal(replay.state.attempts[0].dimension, "audio");
  assert.equal(replay.state.attempts[0].questionVersion, question.contentVersion);
});

test("Practice and Placement results expose explicit create/update Planner entry points and listening playback", () => {
  const selector = source("../src/app/practice/practice-selector-client.tsx");
  const practice = source("../src/app/practice/[level]/[skill]/practice-client.tsx");
  const placement = source("../src/app/placement/placement-client.tsx");
  const placementResult = source("../src/app/placement/result/[id]/placement-result-client.tsx");
  assert.match(selector, /Vocabulary/);
  assert.match(selector, /Grammar/);
  assert.match(selector, /Reading/);
  assert.match(selector, /Listening/);
  assert.match(selector, /Advanced 7–9/);
  assert.match(practice, /audioSrc/);
  assert.match(practice, /Update learning plan/);
  assert.match(placement, /<audio/);
  assert.match(placementResult, /Create or update learning plan/);
  assert.match(placementResult, /\/practice\/\$\{Math\.min\(result\.recommendedLevel, 7\)\}/);
});
