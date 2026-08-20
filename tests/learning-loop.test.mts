import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDailySession,
  completeDailyItem,
  gradeReview,
  markAudioReviewReady,
  recordAttempt,
  recordAudioAttempt,
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
  assert.equal(resumeDailySession(done.state, daily.session.id)?.kind, "listen");
});

test("daily session orders review before learn, listen, practice and summary", () => {
  const withReview = recordAttempt(emptyState(), {
    idempotencyKey: "order-review",
    contentId: "question:hsk1_001",
    contentVersion: "practice-v1",
    dimension: "reading",
    answer: "A",
    correctAnswer: "B",
    observedAt: now,
  }).state;
  const built = buildDailySession(withReview, {
    ownerId: "guest-order",
    localDay: "2026-08-20",
    ruleVersion: "today-v2",
    now,
  });
  assert.deepEqual(built.session.items.map((item) => item.kind), [
    "review", "learn", "listen", "listen", "practice", "summary",
  ]);
});

test("reading, audio and context audio create separate versioned mastery cards", () => {
  let state = recordAttempt(emptyState(), {
    idempotencyKey: "reading-ok", contentId: "question:hsk1_001", contentVersion: "practice-v1",
    dimension: "reading", answer: "B", correctAnswer: "B", observedAt: now,
  }).state;
  state = recordAudioAttempt(state, {
    idempotencyKey: "audio-ok", contentId: "word:word-ni-hao", contentVersion: "1",
    dimension: "audio", answer: "A", correctAnswer: "A", observedAt: now, playbackResult: "completed",
  }).state;
  state = recordAudioAttempt(state, {
    idempotencyKey: "context-ok", contentId: "word:word-ni-hao", contentVersion: "1",
    dimension: "context_audio", answer: "A", correctAnswer: "A", observedAt: now, playbackResult: "completed",
  }).state;
  assert.deepEqual(new Set(state.cards.map((card) => card.dimension)), new Set(["reading", "audio", "context_audio"]));
  assert.equal(state.attempts.length, 3);
});

test("failed audio playback writes neither attempt nor mastery", () => {
  const result = recordAudioAttempt(emptyState(), {
    idempotencyKey: "audio-failed", contentId: "word:word-ni-hao", contentVersion: "1",
    dimension: "audio", answer: "A", correctAnswer: "A", observedAt: now, playbackResult: "failed",
  });
  assert.equal(result.state.attempts.length, 0);
  assert.equal(result.state.cards.length, 0);
  assert.equal(result.recorded, false);
});

test("only the current learn item can be manually completed", () => {
  const daily = buildDailySession(emptyState(), { ownerId: "guest-order", localDay: "2026-08-20", ruleVersion: "today-v2", now });
  const listen = daily.session.items.find((item) => item.kind === "listen")!;
  assert.throws(() => completeDailyItem(daily.state, daily.session.id, listen.id), /ITEM_REQUIRES_ACTIVITY/);
  const learn = daily.session.items.find((item) => item.kind === "learn")!;
  const completed = completeDailyItem(daily.state, daily.session.id, learn.id);
  assert.equal(completed.state.dailySessions.find((session) => session.id === daily.session.id)?.items.find((item) => item.id === learn.id)?.status, "completed");
});

test("audio review cannot advance mastery until successful playback is recorded", () => {
  const attempted = recordAudioAttempt(emptyState(), {
    idempotencyKey: "audio-review-attempt", contentId: "word:word-ni-hao", contentVersion: "catalog-v1",
    dimension: "audio", answer: "A", correctAnswer: "B", observedAt: now, playbackResult: "completed",
  }).state;
  const card = attempted.cards[0];
  assert.throws(() => gradeReview(attempted, { cardId: card.id, grade: "good", idempotencyKey: "audio-grade", observedAt: now, clientRevision: 0 }), /AUDIO_PLAYBACK_REQUIRED/);
  const ready = markAudioReviewReady(attempted, card.id, 0, "playback-1");
  const graded = gradeReview(ready, { cardId: card.id, grade: "good", idempotencyKey: "audio-grade", observedAt: now, clientRevision: 0 });
  assert.equal(graded.card.reviewCount, 1);
  assert.equal(graded.state.audioReviewReady?.some((entry) => entry.cardId === card.id), false);
  const replayedReady = markAudioReviewReady(graded.state, card.id, 0, "playback-1");
  assert.equal(replayedReady.audioReviewReady?.some((entry) => entry.cardId === card.id), false);
  assert.throws(() => markAudioReviewReady({ ...graded.state, audioPlaybackKeys: [] }, card.id, 0, "playback-1"), /REVISION_CONFLICT/);
  assert.throws(() => gradeReview(replayedReady, { cardId: card.id, grade: "good", idempotencyKey: "audio-grade-next", observedAt: now, clientRevision: 1 }), /AUDIO_PLAYBACK_REQUIRED/);
});
