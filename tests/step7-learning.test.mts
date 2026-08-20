import assert from "node:assert/strict";
import test from "node:test";

import {
  grammarBySlug,
  readingBySlug,
  advancedListeningBySlug,
  isStep7AnswerAllowed,
  trustedStep7Exercise,
} from "../src/lib/learning/step7-content.ts";
import {
  buildPlannerDraft,
  plannerInputsFromJson,
  revisePlan,
  weakPointsFromLearning,
  type StudyPlan,
} from "../src/lib/planner/domain.ts";
import type { LearningState } from "../src/lib/learning/domain.ts";

const now = "2026-08-20T12:00:00.000Z";

function learning(overrides: Partial<LearningState> = {}): LearningState {
  return { attempts: [], cards: [], mistakes: [], dailySessions: [], ...overrides };
}

test("grammar and reading lessons expose only trusted exercises linked to the same content version", () => {
  const grammar = grammarBySlug("ba-sentence-basics");
  const reading = readingBySlug("morning-study-routine");
  assert.ok(grammar && reading);
  assert.equal(grammar.exercise.contentId, `grammar:${grammar.slug}`);
  assert.equal(reading.exercise.contentId, `reading:${reading.slug}`);
  assert.equal(grammar.exercise.contentVersion, grammar.contentVersion);
  assert.equal(reading.exercise.contentVersion, reading.contentVersion);
  assert.deepEqual(trustedStep7Exercise(grammar.exercise.id), grammar.exercise);
  assert.deepEqual(trustedStep7Exercise(reading.exercise.id), reading.exercise);
});

test("advanced listening is levelled and includes discrimination, tone and dictation", () => {
  const items = [
    advancedListeningBySlug("hsk1-tone-pairs"),
    advancedListeningBySlug("hsk2-syllable-discrimination"),
    advancedListeningBySlug("hsk3-sentence-dictation"),
  ];
  assert.ok(items.every(Boolean));
  assert.deepEqual(items.map((item) => item!.kind), ["tone", "discrimination", "dictation"]);
  assert.deepEqual(items.map((item) => item!.level), [1, 2, 3]);
  for (const item of items) {
    assert.equal(item!.exercise.contentId, `listening:${item!.slug}`);
    assert.equal(item!.exercise.contentVersion, item!.contentVersion);
    assert.ok(item!.voiceText.length > 0);
  }
});

test("planner uses goal, available time, weak points and due SRS load", () => {
  const state = learning({
    cards: [
      { id: "due-reading", contentId: "grammar:ba-sentence-basics", contentVersion: "v1", dimension: "reading", dueAt: "2026-08-20T10:00:00.000Z", intervalDays: 1, stability: 1, difficulty: 5, algorithmVersion: "hskkit-srs-v1", sourceAttemptId: "a1", lastGrade: "again", reviewCount: 0, revision: 0 },
      { id: "due-audio", contentId: "listening:hsk1-tone-pairs", contentVersion: "v1", dimension: "audio", dueAt: "2026-08-20T11:00:00.000Z", intervalDays: 1, stability: 1, difficulty: 5, algorithmVersion: "hskkit-srs-v1", sourceAttemptId: "a2", lastGrade: "again", reviewCount: 0, revision: 0 },
    ],
    mistakes: [
      { id: "m1", contentId: "grammar:ba-sentence-basics", contentVersion: "v1", sourceAttemptId: "a1", status: "open", createdAt: now, updatedAt: now },
      { id: "m2", contentId: "listening:hsk1-tone-pairs", contentVersion: "v1", sourceAttemptId: "a2", status: "open", createdAt: now, updatedAt: now },
    ],
    attempts: [
      { id: "a1", idempotencyKey: "a1", contentId: "grammar:ba-sentence-basics", contentVersion: "v1", dimension: "reading", answer: "B", correctAnswer: "A", correct: false, observedAt: now },
      { id: "a2", idempotencyKey: "a2", contentId: "listening:hsk1-tone-pairs", contentVersion: "v1", dimension: "audio", answer: "B", correctAnswer: "A", correct: false, observedAt: now },
    ],
  });
  const weak = weakPointsFromLearning(state);
  const result = buildPlannerDraft({
    goalLevel: 3,
    targetDate: "2026-11-30",
    weeklyMinutes: 210,
    preferredDays: [1, 3, 5],
    weakPoints: weak,
    state,
    now,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.plan.inputs.goalLevel, 3);
  assert.equal(result.plan.inputs.weeklyMinutes, 210);
  assert.equal(result.plan.srsLoad.dueCards, 2);
  assert.ok(result.plan.sessions.every((session) => session.minutes <= 70));
  assert.ok(result.plan.sessions.some((session) => session.tasks.some((task) => task.source === "weak-point")));
  assert.ok(result.plan.sessions.some((session) => session.tasks.some((task) => task.source === "srs")));
});

test("planner refuses impossible targets instead of persisting an unfinishable plan", () => {
  const manyCards = Array.from({ length: 120 }, (_, index) => ({
    id: `c${index}`, contentId: `word:${index}`, contentVersion: "v1", dimension: "reading" as const,
    dueAt: "2026-08-20T10:00:00.000Z", intervalDays: 1, stability: 1, difficulty: 5,
    algorithmVersion: "hskkit-srs-v1", sourceAttemptId: `a${index}`, lastGrade: "again" as const,
    reviewCount: 0, revision: 0,
  }));
  const result = buildPlannerDraft({
    goalLevel: 9,
    targetDate: "2026-08-27",
    weeklyMinutes: 30,
    preferredDays: [1],
    weakPoints: [],
    state: learning({ cards: manyCards }),
    now,
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "PLAN_INFEASIBLE");
  assert.ok(result.minimumWeeklyMinutes > 30);
  assert.ok(result.warnings.includes("SRS_LOAD_EXCEEDS_CAPACITY"));
});

test("editing creates an immutable next plan version", () => {
  const original: StudyPlan = {
    id: "plan-1", ownerId: "user-1", version: 1, createdAt: now,
    inputs: { goalLevel: 2, targetDate: "2026-12-01", weeklyMinutes: 180, preferredDays: [1, 3, 5], weakPoints: ["reading"] },
    srsLoad: { dueCards: 0, weeklyMinutes: 0 }, warnings: [], sessions: [], status: "active",
  };
  const next = revisePlan(original, { weeklyMinutes: 240, preferredDays: [1, 2, 4, 6] }, "2026-08-21T12:00:00.000Z");
  assert.equal(original.version, 1);
  assert.equal(original.inputs.weeklyMinutes, 180);
  assert.equal(next.version, 2);
  assert.equal(next.inputs.weeklyMinutes, 240);
  assert.equal(next.parentVersion, 1);
});

test("multiple-choice Step 7 answers must be one of the trusted server options", () => {
  const exercise = grammarBySlug("ba-sentence-basics")!.exercise;
  assert.equal(isStep7AnswerAllowed(exercise, "A"), true);
  assert.equal(isStep7AnswerAllowed(exercise, "D"), false);
  assert.equal(isStep7AnswerAllowed(exercise, "我把作业写完了。"), false);
});

test("planner JSON inputs reject coercion, fractions and impossible calendar dates", () => {
  const valid = { goalLevel: 3, targetDate: "2026-11-30", weeklyMinutes: 210, preferredDays: [1, 3, 5] };
  assert.deepEqual(plannerInputsFromJson(valid), valid);
  assert.equal(plannerInputsFromJson({ ...valid, goalLevel: "3" }), undefined);
  assert.equal(plannerInputsFromJson({ ...valid, weeklyMinutes: 210.5 }), undefined);
  assert.equal(plannerInputsFromJson({ ...valid, preferredDays: [1, "3"] }), undefined);
  assert.equal(plannerInputsFromJson({ ...valid, targetDate: "2026-02-30" }), undefined);
  assert.equal(plannerInputsFromJson({ ...valid, targetDate: "2026-2-3" }), undefined);
});

test("a feasible plan visibly warns when SRS consumes at least half of weekly capacity", () => {
  const cards = Array.from({ length: 30 }, (_, index) => ({
    id: `high-srs-${index}`, contentId: `word:${index}`, contentVersion: "v1", dimension: "reading" as const,
    dueAt: "2026-08-20T10:00:00.000Z", intervalDays: 1, stability: 1, difficulty: 5,
    algorithmVersion: "hskkit-srs-v1", sourceAttemptId: `high-srs-a${index}`, lastGrade: "again" as const,
    reviewCount: 0, revision: 0,
  }));
  const result = buildPlannerDraft({ goalLevel: 1, targetDate: "2027-08-20", weeklyMinutes: 120, preferredDays: [1, 3, 5], weakPoints: [], state: learning({ cards }), now });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(result.plan.warnings.includes("SRS_LOAD_HIGH"));
});
