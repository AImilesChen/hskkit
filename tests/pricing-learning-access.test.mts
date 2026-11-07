import test from "node:test";
import assert from "node:assert/strict";
import { FREE_CAPABILITIES, PRO_CAPABILITIES, historyWindow } from "../src/lib/commercial/capabilities.ts";
import { projectLearningCheckpoint, projectLearningHistory } from "../src/lib/learning/projection.ts";
import { gradeReview, type LearningState } from "../src/lib/learning/domain.ts";

const now = new Date("2026-11-07T12:00:00Z");
function fixture(): LearningState {
  return {
    attempts: [{ id: "old-source", contentId: "reading-test", contentVersion: "1", observedAt: "2026-08-01T00:00:00Z", dimension: "reading" }, { id: "unrelated-old", observedAt: "2026-08-02T00:00:00Z" }, { id: "recent", observedAt: "2026-11-01T00:00:00Z" }],
    cards: [{ id: "old-card", sourceAttemptId: "old-source", contentId: "reading-test", contentVersion: "1", dimension: "reading", revision: 0, reviewCount: 0, gradeKeys: [], ease: 2.5, intervalDays: 1, dueAt: "2026-11-07T00:00:00Z" }],
    mistakes: [{ id: "open-old", sourceAttemptId: "old-source", status: "open", createdAt: "2026-08-01T00:00:00Z" }, { id: "resolved-old", sourceAttemptId: "old-source", status: "resolved", createdAt: "2026-08-01T00:00:00Z" }],
    dailySessions: [],
  } as unknown as LearningState;
}

test("the 30-day/500-entry activity window preserves its exact boundary and cap", () => {
  const boundary = new Date(now.getTime() - 30 * 86400000).toISOString();
  const rows = [{ id: "expired", observedAt: new Date(Date.parse(boundary) - 1).toISOString() }, { id: "boundary", observedAt: boundary }];
  assert.deepEqual(historyWindow(rows, FREE_CAPABILITIES, now).map(row => row.id), ["boundary"]);
  const many = Array.from({ length: 501 }, (_, i) => ({ id: i, observedAt: new Date(now.getTime() - i * 1000).toISOString() }));
  assert.equal(historyWindow(many, FREE_CAPABILITIES, now).length, 500);
  assert.equal(historyWindow(many, PRO_CAPABILITIES, now).length, 501);
});

test("old learned cards keep their schedule and source while unrelated history stays private to its window", () => {
  const source = fixture();
  assert.deepEqual(projectLearningHistory(source, FREE_CAPABILITIES, now).attempts.map(item => item.id), ["recent"]);
  const checkpoint = projectLearningCheckpoint(source, FREE_CAPABILITIES, now);
  assert.deepEqual(checkpoint.attempts.map(item => item.id), ["old-source", "recent"]);
  assert.equal(checkpoint.cards[0].id, "old-card");
  assert.deepEqual(checkpoint.mistakes.map(item => item.id), ["open-old"]);
  assert.equal(source.attempts.length, 3);
  assert.equal(source.mistakes.length, 2);
});

test("Free can rate past 20 reviews; a repeated operation does not grade twice", () => {
  assert.equal(FREE_CAPABILITIES.dailyReviewGrades, null);
  assert.equal(FREE_CAPABILITIES.dailyNewItems, 10);
  let state = projectLearningCheckpoint(fixture(), FREE_CAPABILITIES, now);
  for (let i = 0; i < 25; i++) state = gradeReview(state, { cardId: "old-card", grade: "hard", idempotencyKey: `rating-${i}`, clientRevision: i, observedAt: now.toISOString(), requireAudioPlayback: false }).state;
  assert.equal(state.cards[0].reviewCount, 25);
  const replay = gradeReview(state, { cardId: "old-card", grade: "hard", idempotencyKey: "rating-24", clientRevision: 24, observedAt: now.toISOString(), requireAudioPlayback: false });
  assert.equal(replay.state.cards[0].reviewCount, 25);
  assert.throws(() => gradeReview(state, { cardId: "old-card", grade: "hard", idempotencyKey: "stale", clientRevision: 0, observedAt: now.toISOString(), requireAudioPlayback: false }), /REVISION_CONFLICT/);
});
