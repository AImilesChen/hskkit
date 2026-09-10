import assert from "node:assert/strict";
import test from "node:test";

import { buildReviewQueue } from "../src/lib/learning/review-session.ts";
import { normalizeReviewState, recordAttempt, type LearningState, type SrsCard } from "../src/lib/learning/domain.ts";

const due = "2026-01-01T00:00:00.000Z";
const card = (id: string, skill: string, sourceGroupId: string, templateId: string, canonicalContentKey = id) => ({
  id,
  contentId: id,
  isMistake: false,
  dimension: "reading" as const,
  dueAt: due,
  level: 3,
  skill,
  sourceGroupId,
  templateId,
  canonicalContentKey,
});

test("review queue disperses source material, templates, and skill runs without changing priority groups", () => {
  const cards = [
    { ...card("a1", "Reading", "passage-a", "detail"), isMistake: true },
    { ...card("a2", "Reading", "passage-a", "detail"), isMistake: true },
    { ...card("b1", "Reading", "passage-b", "detail") },
    { ...card("c1", "Grammar", "grammar-c", "connector") },
    { ...card("d1", "Listening", "audio-d", "detail") },
    { ...card("e1", "Vocabulary", "word-e", "meaning") },
  ];

  const queue = buildReviewQueue(cards, cards.length);
  assert.equal(queue[0].id, "a1");
  assert.equal(queue.at(-1)?.id, "a2");
  assert.equal(new Set(queue.slice(0, -1).map((item) => item.sourceGroupId)).size, queue.length - 1);
  assert.ok(queue.slice(0, 4).every((item, index, all) => index === 0 || item.templateId !== all[index - 1].templateId));
  assert.ok(queue.every((item, index, all) => index < 2 || item.skill !== all[index - 1].skill || item.skill !== all[index - 2].skill));
  assert.deepEqual(new Set(queue.map((item) => item.id)).size, cards.length);
});

test("review queue removes cross-version duplicates by canonical identity", () => {
  const queue = buildReviewQueue([
    card("question-v3", "Reading", "passage-a", "detail", "reading:passage-a:q1"),
    card("question-v4", "Reading", "passage-a", "detail", "reading:passage-a:q1"),
    card("question-other", "Reading", "passage-a", "inference", "reading:passage-a:q2"),
  ], 10);
  assert.deepEqual(queue.map((item) => item.id), ["question-v3", "question-other"]);
});

const emptyState = (): LearningState => ({ attempts: [], cards: [], mistakes: [], dailySessions: [] });

test("recording a new content version reuses one canonical card and keeps its SRS history", () => {
  const first = recordAttempt(emptyState(), {
    idempotencyKey: "attempt-v3",
    contentId: "practice:q-v3",
    contentVersion: "v3",
    canonicalContentKey: "reading:source:q1",
    dimension: "reading",
    answer: "a",
    correctAnswer: "a",
    observedAt: "2026-01-01T00:00:00.000Z",
  }).state;
  const scheduled: LearningState = { ...first, cards: first.cards.map((entry) => ({ ...entry, dueAt: "2026-03-01T00:00:00.000Z", intervalDays: 21, ease: 2.2, reviewCount: 5, revision: 5 })) };
  const second = recordAttempt(scheduled, {
    idempotencyKey: "attempt-v4",
    contentId: "practice:q-v4",
    contentVersion: "v4",
    canonicalContentKey: "reading:source:q1",
    dimension: "reading",
    answer: "b",
    correctAnswer: "a",
    observedAt: "2026-02-01T00:00:00.000Z",
  }).state;

  assert.equal(second.cards.length, 1);
  assert.equal(second.cards[0].contentId, "practice:q-v4");
  assert.equal(second.cards[0].contentVersion, "v4");
  assert.equal(second.cards[0].reviewCount, 5);
  assert.equal(second.cards[0].ease, 2.2);
  assert.equal(second.cards[0].intervalDays, 0);
  assert.equal(second.cards[0].dueAt, "2026-02-01T00:00:00.000Z");
  assert.equal(second.cards[0].sourceAttemptId, second.attempts.at(-1)?.id);
});

test("legacy duplicate cards are lazily merged while unknown legacy cards remain usable", () => {
  const attempts = [
    { id: "att-old", idempotencyKey: "old", contentId: "practice:q-v3", contentVersion: "v3", canonicalContentKey: "reading:source:q1", dimension: "reading" as const, answer: "a", correctAnswer: "a", correct: true, observedAt: "2026-01-01T00:00:00.000Z" },
    { id: "att-new", idempotencyKey: "new", contentId: "practice:q-v4", contentVersion: "v4", canonicalContentKey: "reading:source:q1", dimension: "reading" as const, answer: "a", correctAnswer: "a", correct: true, observedAt: "2026-02-01T00:00:00.000Z" },
    { id: "att-unknown", idempotencyKey: "unknown", contentId: "legacy-opaque", contentVersion: "legacy", dimension: "reading" as const, answer: "", correctAnswer: "", correct: true, observedAt: "2025-01-01T00:00:00.000Z" },
  ];
  const cards: SrsCard[] = [
    { id: "card-old", contentId: "practice:q-v3", contentVersion: "v3", canonicalContentKey: "reading:source:q1", dimension: "reading", dueAt: "2026-03-01T00:00:00.000Z", intervalDays: 10, ease: 2.4, revision: 2, reviewCount: 2, algorithmVersion: "hskkit-srs-v1", sourceAttemptId: "att-old", gradeKeys: ["g1"], gradeResults: { g1: "good" } },
    { id: "card-new", contentId: "practice:q-v4", contentVersion: "v4", canonicalContentKey: "reading:source:q1", dimension: "reading", dueAt: "2026-02-15T00:00:00.000Z", intervalDays: 4, ease: 2.1, revision: 1, reviewCount: 1, algorithmVersion: "hskkit-srs-v1", sourceAttemptId: "att-new", gradeKeys: ["g2"], gradeResults: { g2: "hard" } },
    { id: "card-unknown", contentId: "legacy-opaque", contentVersion: "legacy", dimension: "reading", dueAt: due, intervalDays: 1, ease: 2.5, revision: 0, reviewCount: 0, algorithmVersion: "hskkit-srs-v1", sourceAttemptId: "att-unknown", gradeKeys: [] },
  ];

  const migrated = normalizeReviewState({ attempts, cards, mistakes: [], dailySessions: [] });
  assert.equal(migrated.cards.length, 2);
  const merged = migrated.cards.find((entry) => entry.canonicalContentKey === "reading:source:q1")!;
  assert.equal(merged.contentVersion, "v4");
  assert.equal(merged.sourceAttemptId, "att-new");
  assert.equal(merged.dueAt, "2026-02-15T00:00:00.000Z");
  assert.equal(merged.intervalDays, 4);
  assert.equal(merged.ease, 2.1);
  assert.equal(merged.reviewCount, 3);
  assert.deepEqual(merged.gradeKeys, ["g1", "g2"]);
  assert.ok(migrated.cards.some((entry) => entry.id === "card-unknown"));
});
