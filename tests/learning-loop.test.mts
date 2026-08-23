import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
import { selectTodayContent } from "../src/lib/learning/today-content.ts";
import { audioPlaybackSubject, publicAudioExercise, trustedTodayAudioExercise } from "../src/lib/learning/audio.ts";
import { practiceQuestionSet } from "../src/lib/practice/questions.ts";

const emptyState = (): LearningState => ({ attempts: [], cards: [], mistakes: [], dailySessions: [] });
const now = "2026-08-20T09:00:00.000Z";

test("Today request path does not run the full 11k-asset repository validator", () => {
  const source = readFileSync(new URL("../src/lib/learning/today-content.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /validateRepository\s*\(/);
});

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
  const earlyAudio = recordAudioAttempt(daily.state, { idempotencyKey: "early-audio", contentId: "word:word-ni-hao", contentVersion: "catalog-v1", dimension: "audio", answer: "A", correctAnswer: "A", observedAt: now, playbackResult: "completed" }).state;
  assert.equal(earlyAudio.dailySessions[0].items.find((item) => item.id === listen.id)?.status, "pending");
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

test("Today selects a source-locked word from the active versioned HSK 3.0 release", () => {
  const plan = selectTodayContent(1);
  assert.equal(plan.status, "ready");
  if (plan.status !== "ready") return;
  assert.equal(plan.releaseId, "hsk3-batch13-formal-learning-v4");
  assert.match(plan.item.contentId, /^catalog:hsk3\.word\.l1\./);
  assert.match(plan.item.contentVersion, /^hsk3-batch13-formal-learning-v4:/);
  assert.equal(plan.item.level, 1);
  assert.ok(plan.item.example.hanzi.includes(plan.item.hanzi));
});

test("Today exposes formal Practice for every approved Level 1-6 queue", () => {
  for (let level = 1; level <= 6; level += 1) {
    const plan = selectTodayContent(level);
    assert.equal(plan.status, "ready");
    if (plan.status !== "ready") continue;
    assert.equal(plan.practiceHref, `/practice/${level}/vocabulary`);
  }
});

test("Placement start level drives a same-day resumable Daily Session without duplicate creation", () => {
  const plan = selectTodayContent(2);
  assert.equal(plan.status, "ready");
  if (plan.status !== "ready") return;
  const input = { ownerId: "guest-b5", localDay: "2026-08-20", ruleVersion: "today-v3", now, dailyContent: plan };
  const first = buildDailySession(emptyState(), input);
  const replay = buildDailySession(first.state, input);
  assert.equal(replay.session.id, first.session.id);
  assert.equal(replay.state.dailySessions.length, 1);
  assert.equal(first.session.startLevel, 2);
  assert.equal(first.session.contentReleaseId, plan.releaseId);
  assert.equal(first.session.items.find((item) => item.kind === "learn")?.contentVersion, plan.item.contentVersion);
  assert.equal(first.session.items.find((item) => item.kind === "listen" && item.dimension === "audio")?.contentId, plan.item.contentId);
});

test("next local day creates a new session at the same Placement-selected start", () => {
  const plan = selectTodayContent(1);
  assert.equal(plan.status, "ready");
  if (plan.status !== "ready") return;
  const first = buildDailySession(emptyState(), { ownerId: "guest-next", localDay: "2026-08-20", ruleVersion: "today-v3", now, dailyContent: plan });
  const next = buildDailySession(first.state, { ownerId: "guest-next", localDay: "2026-08-21", ruleVersion: "today-v3", now: "2026-08-21T09:00:00.000Z", dailyContent: plan });
  assert.notEqual(next.session.id, first.session.id);
  assert.equal(next.session.startLevel, 1);
  assert.equal(next.state.dailySessions.length, 2);
});

test("empty formal-content queue exposes a recovery action instead of demo tasks", () => {
  const gap = selectTodayContent(9);
  assert.equal(gap.status, "empty");
  if (gap.status !== "empty") return;
  const built = buildDailySession(emptyState(), { ownerId: "guest-gap", localDay: "2026-08-20", ruleVersion: "today-v3", now, dailyContent: gap });
  assert.equal(built.session.startLevel, 9);
  assert.equal(built.session.items.some((item) => item.kind === "learn"), false);
  assert.equal(built.session.notice?.code, "EMPTY_CONTENT_QUEUE");
  assert.ok(built.session.notice?.actionHref);
});

test("a listening attempt only completes the bound Daily item with the exact content version", () => {
  const plan = selectTodayContent(1);
  assert.equal(plan.status, "ready");
  if (plan.status !== "ready") return;
  const daily = buildDailySession(emptyState(), { ownerId: "guest-bind", localDay: "2026-08-20", ruleVersion: "today-v3", now, dailyContent: plan });
  const learned = completeDailyItem(daily.state, daily.session.id, daily.session.items.find((item) => item.kind === "learn")!.id).state;
  const wrongVersion = recordAudioAttempt(learned, {
    idempotencyKey: "wrong-version", contentId: plan.item.contentId, contentVersion: "withdrawn-v1", dimension: "audio",
    answer: "A", correctAnswer: "A", observedAt: now, playbackResult: "completed", dailySessionId: daily.session.id,
  }).state;
  assert.equal(wrongVersion.dailySessions[0].items.find((item) => item.dimension === "audio")?.status, "pending");
  const exact = recordAudioAttempt(learned, {
    idempotencyKey: "exact-version", contentId: plan.item.contentId, contentVersion: plan.item.contentVersion, dimension: "audio",
    answer: "A", correctAnswer: "A", observedAt: now, playbackResult: "completed", dailySessionId: daily.session.id,
  }).state;
  assert.equal(exact.dailySessions[0].items.find((item) => item.dimension === "audio")?.status, "completed");
});

test("public listening payload never exposes the trusted answer before submission", () => {
  const plan = selectTodayContent(1);
  assert.equal(plan.status, "ready");
  if (plan.status !== "ready") return;
  const trusted = trustedTodayAudioExercise(plan.item.assetId, "audio");
  assert.ok(trusted);
  assert.equal(JSON.stringify(publicAudioExercise(trusted!)).includes("correctAnswer"), false);
});

test("same-day Placement change refreshes pending work without creating another Daily Session", () => {
  const level1 = selectTodayContent(1);
  const level2 = selectTodayContent(2);
  assert.equal(level1.status, "ready");
  assert.equal(level2.status, "ready");
  if (level1.status !== "ready" || level2.status !== "ready") return;
  const first = buildDailySession(emptyState(), { ownerId: "guest-replace", localDay: "2026-08-20", ruleVersion: "today-v3", now, dailyContent: level1 });
  const refreshed = buildDailySession(first.state, { ownerId: "guest-replace", localDay: "2026-08-20", ruleVersion: "today-v3", now, dailyContent: level2 });
  assert.equal(refreshed.state.dailySessions.length, 1);
  assert.equal(refreshed.session.id, first.session.id);
  assert.equal(refreshed.session.startLevel, 2);
  assert.ok(refreshed.session.items.some((item) => item.id === `learn:${level2.item.contentId}:${level2.item.contentVersion}`));
  assert.equal(refreshed.session.items.some((item) => item.id === `learn:${level1.item.contentId}:${level1.item.contentVersion}`), false);
});

test("empty formal-content queue is already summarized and has no inaccessible pending item", () => {
  const gap = selectTodayContent(9);
  assert.equal(gap.status, "empty");
  if (gap.status !== "empty") return;
  const built = buildDailySession(emptyState(), { ownerId: "guest-empty-summary", localDay: "2026-08-20", ruleVersion: "today-v3", now, dailyContent: gap });
  assert.equal(built.session.items.find((item) => item.kind === "summary")?.status, "completed");
  assert.equal(resumeDailySession(built.state, built.session.id), undefined);
});

test("Daily Practice item is bound to the exact trusted question version", () => {
  const plan = selectTodayContent(2);
  assert.equal(plan.status, "ready");
  if (plan.status !== "ready") return;
  const built = buildDailySession(emptyState(), { ownerId: "guest-practice-version", localDay: "2026-08-20", ruleVersion: "today-v3", now, dailyContent: plan });
  const item = built.session.items.find((candidate) => candidate.kind === "practice");
  assert.equal(item?.contentVersion, practiceQuestionSet(2, "vocabulary")[0].contentVersion);
});

test("audio attempt idempotency binds both Daily Session and Daily item", () => {
  const base = { idempotencyKey: "audio-binding-key", contentId: "catalog:word", contentVersion: "release:v1", dimension: "audio" as const, answer: "A", correctAnswer: "A", observedAt: now, mode: "listening" as const, dailySessionId: "day-1", dailyItemId: "listen-1" };
  const first = recordAttempt(emptyState(), base);
  assert.throws(() => recordAttempt(first.state, { ...base, dailySessionId: "day-2" }), /IDEMPOTENCY_KEY_REUSED/);
  assert.throws(() => recordAttempt(first.state, { ...base, dailyItemId: "listen-2" }), /IDEMPOTENCY_KEY_REUSED/);
});

test("Daily playback subjects cannot be replayed across standalone or other Daily bindings", () => {
  const plan = selectTodayContent(2);
  assert.equal(plan.status, "ready");
  if (plan.status !== "ready") return;
  const exercise = trustedTodayAudioExercise(plan.item.assetId, "audio")!;
  const standalone = audioPlaybackSubject(exercise);
  const daily = audioPlaybackSubject(exercise, "day-1", "listen-1");
  assert.notEqual(standalone, daily);
  assert.notEqual(daily, audioPlaybackSubject(exercise, "day-2", "listen-1"));
  assert.notEqual(daily, audioPlaybackSubject(exercise, "day-1", "listen-2"));
  assert.throws(() => audioPlaybackSubject(exercise, "day-1", undefined), /INVALID_DAILY_AUDIO_BINDING/);
});

test("same-day synchronization inserts newly due review work without duplicating the Daily Session", () => {
  const first = buildDailySession(emptyState(), { ownerId: "guest:sync", localDay: "2026-08-21", ruleVersion: "today-v3", now });
  const withDue = { ...first.state, cards: [{ id: "card-sync", contentId: "word:sync", contentVersion: "v1", dimension: "reading" as const, dueAt: now, intervalDays: 0, ease: 2.5, revision: 0, reviewCount: 0, algorithmVersion: "hskkit-srs-v1" as const, sourceAttemptId: "attempt-sync", gradeKeys: [] }] };
  const refreshed = buildDailySession(withDue, { ownerId: "guest:sync", localDay: "2026-08-21", ruleVersion: "today-v3", now });
  assert.equal(refreshed.state.dailySessions.length, 1);
  assert.equal(refreshed.session.items[0].id, "review:card-sync:0");
});

test("ready-to-empty refresh removes stale pending actions and exposes the current recovery notice", () => {
  const ready = selectTodayContent(1);
  assert.equal(ready.status, "ready");
  if (ready.status !== "ready") return;
  const first = buildDailySession(emptyState(), { ownerId: "guest:withdraw", localDay: "2026-08-21", ruleVersion: "today-v3", now, dailyContent: ready });
  const empty = { status: "empty" as const, startLevel: 1, releaseId: ready.releaseId, code: "CONTENT_UPDATED", message: "The selected content is no longer available. Refresh Today to load the current approved queue.", actionHref: "/today", actionLabel: "Refresh Today" };
  const refreshed = buildDailySession(first.state, { ownerId: "guest:withdraw", localDay: "2026-08-21", ruleVersion: "today-v3", now, dailyContent: empty });
  assert.equal(refreshed.state.dailySessions.length, 1);
  assert.equal(refreshed.session.notice?.code, "CONTENT_UPDATED");
  assert.equal(refreshed.session.items.some((item) => item.kind === "learn" && item.status === "pending"), false);
});

test("refreshing a completed same-day plan clears completion while replacement work is pending", () => {
  const level1 = selectTodayContent(1);
  const level2 = selectTodayContent(2);
  assert.equal(level1.status, "ready");
  assert.equal(level2.status, "ready");
  if (level1.status !== "ready" || level2.status !== "ready") return;
  const built = buildDailySession(emptyState(), { ownerId: "guest:reopen", localDay: "2026-08-21", ruleVersion: "today-v3", now, dailyContent: level1 });
  const completed = { ...built.state, dailySessions: built.state.dailySessions.map((session) => ({ ...session, completedAt: now, items: session.items.map((item) => ({ ...item, status: "completed" as const })) })) };
  const refreshed = buildDailySession(completed, { ownerId: "guest:reopen", localDay: "2026-08-21", ruleVersion: "today-v3", now, dailyContent: level2 });
  assert.equal(refreshed.session.completedAt, undefined);
  assert.ok(refreshed.session.items.some((item) => item.status === "pending"));
});

test("a review graded again can become due again later on the same local day", () => {
  const card = { id: "card-repeat", contentId: "word:repeat", contentVersion: "v1", dimension: "reading" as const, dueAt: now, intervalDays: 0, ease: 2.5, revision: 0, reviewCount: 0, algorithmVersion: "hskkit-srs-v1" as const, sourceAttemptId: "attempt-repeat", gradeKeys: [] };
  const first = buildDailySession({ ...emptyState(), cards: [card] }, { ownerId: "guest:repeat", localDay: "2026-08-21", ruleVersion: "today-v3", now });
  const progressed = { ...first.state, cards: [{ ...card, revision: 1, dueAt: "2026-08-21T10:10:00.000Z" }], dailySessions: first.state.dailySessions.map((session) => ({ ...session, items: session.items.map((item) => item.kind === "review" ? { ...item, status: "completed" as const } : item) })) };
  const refreshed = buildDailySession(progressed, { ownerId: "guest:repeat", localDay: "2026-08-21", ruleVersion: "today-v3", now: "2026-08-21T10:11:00.000Z" });
  assert.equal(refreshed.session.items.filter((item) => item.kind === "review" && item.status === "pending").length, 1);
  assert.equal(refreshed.session.items.find((item) => item.kind === "review" && item.status === "pending")?.id, "review:card-repeat:1");
});

test("same-level Practice version refresh keeps history without suppressing current pending work", () => {
  const plan = selectTodayContent(2);
  assert.equal(plan.status, "ready");
  if (plan.status !== "ready") return;
  const first = buildDailySession(emptyState(), { ownerId: "guest:practice-refresh", localDay: "2026-08-21", ruleVersion: "today-v3", now, dailyContent: plan });
  const oldState = { ...first.state, dailySessions: first.state.dailySessions.map((session) => ({ ...session, planFingerprint: "old-plan", items: session.items.map((item) => item.kind === "practice" ? { ...item, id: "practice:2:vocabulary:old-version", contentVersion: "old-version", status: "completed" as const } : item) })) };
  const refreshed = buildDailySession(oldState, { ownerId: "guest:practice-refresh", localDay: "2026-08-21", ruleVersion: "today-v3", now, dailyContent: plan });
  const practices = refreshed.session.items.filter((item) => item.kind === "practice");
  assert.ok(practices.some((item) => item.contentVersion === "old-version" && item.status === "completed"));
  assert.ok(practices.some((item) => item.contentVersion === practiceQuestionSet(2, "vocabulary")[0].contentVersion && item.status === "pending"));
});
