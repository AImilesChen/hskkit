import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDailySession,
  completeDailyItem,
  gradeReview,
  recordAttempt,
  resumeDailySession,
  retireContent,
  type LearningState,
} from "../src/lib/learning/domain.ts";

const emptyState = (): LearningState => ({ attempts: [], cards: [], mistakes: [], dailySessions: [] });
const now = "2026-08-20T09:00:00.000Z";

test("wrong practice answer creates one versioned attempt, mistake and due review", () => {
  const state = emptyState();
  const first = recordAttempt(state, {
    idempotencyKey: "attempt-1", contentId: "word:ni-hao", contentVersion: "hsk3-v1",
    dimension: "reading", answer: "B", correctAnswer: "A", observedAt: now,
  });
  const replay = recordAttempt(first.state, {
    idempotencyKey: "attempt-1", contentId: "word:ni-hao", contentVersion: "hsk3-v1",
    dimension: "reading", answer: "B", correctAnswer: "A", observedAt: now,
  });
  assert.equal(replay.state.attempts.length, 1);
  assert.equal(replay.state.mistakes.length, 1);
  assert.equal(replay.state.cards.length, 1);
  assert.equal(replay.state.cards[0].algorithmVersion, "hskkit-srs-v1");
  assert.equal(replay.state.cards[0].sourceAttemptId, first.attempt.id);
});

test("review grades schedule distinct due times and replay does not double count", () => {
  const initial = recordAttempt(emptyState(), {
    idempotencyKey: "attempt-2", contentId: "word:ni-hao", contentVersion: "hsk3-v1",
    dimension: "reading", answer: "B", correctAnswer: "A", observedAt: now,
  }).state;
  const again = gradeReview(initial, { cardId: initial.cards[0].id, grade: "again", idempotencyKey: "grade-a", observedAt: now, clientRevision: 0 });
  const replay = gradeReview(again.state, { cardId: initial.cards[0].id, grade: "again", idempotencyKey: "grade-a", observedAt: now, clientRevision: 0 });
  assert.equal(replay.state.cards[0].reviewCount, 1);
  const good = gradeReview(initial, { cardId: initial.cards[0].id, grade: "good", idempotencyKey: "grade-g", observedAt: now, clientRevision: 0 });
  assert.notEqual(again.card.dueAt, good.card.dueAt);
});

test("daily session is idempotent for owner day and rule and resumes unfinished item", () => {
  const learned = recordAttempt(emptyState(), {
    idempotencyKey: "attempt-3", contentId: "word:ni-hao", contentVersion: "hsk3-v1",
    dimension: "reading", answer: "B", correctAnswer: "A", observedAt: now,
  }).state;
  const first = buildDailySession(learned, { ownerId: "guest-1", localDay: "2026-08-20", ruleVersion: "today-v1", now });
  const replay = buildDailySession(first.state, { ownerId: "guest-1", localDay: "2026-08-20", ruleVersion: "today-v1", now });
  assert.equal(replay.session.id, first.session.id);
  assert.equal(resumeDailySession(replay.state, first.session.id)?.status, "pending");
});

test("withdrawn content is retired from new review queues without deleting history", () => {
  const initial = recordAttempt(emptyState(), {
    idempotencyKey: "attempt-4", contentId: "word:withdrawn", contentVersion: "v1",
    dimension: "reading", answer: "B", correctAnswer: "A", observedAt: now,
  }).state;
  const retired = retireContent(initial, "word:withdrawn");
  assert.equal(retired.attempts.length, 1);
  assert.equal(retired.cards.length, 0);
  assert.equal(retired.mistakes[0].status, "retired");
});

test("content versions keep separate cards and a learn item can be completed", () => {
  let state = recordAttempt(emptyState(), { idempotencyKey:"v1", contentId:"question:q", contentVersion:"v1", dimension:"reading", answer:"B", correctAnswer:"A", observedAt:now }).state;
  state = recordAttempt(state, { idempotencyKey:"v2", contentId:"question:q", contentVersion:"v2", dimension:"reading", answer:"B", correctAnswer:"A", observedAt:now }).state;
  assert.equal(state.cards.length, 2);
  const graded = gradeReview(state, { cardId:state.cards.find(c=>c.contentVersion==="v1")!.id, grade:"good", idempotencyKey:"grade-v1", observedAt:now, clientRevision:0 }).state;
  assert.equal(graded.mistakes.find(m=>m.contentVersion==="v1")!.status, "resolved");
  assert.equal(graded.mistakes.find(m=>m.contentVersion==="v2")!.status, "open");
  const daily = buildDailySession(emptyState(), { ownerId:"guest", localDay:"2026-08-20", ruleVersion:"today-v1", now });
  const done = completeDailyItem(daily.state, daily.session.id, daily.session.items[0].id);
  assert.equal(done.item.status, "completed");
  assert.equal(resumeDailySession(done.state, daily.session.id), undefined);
});
