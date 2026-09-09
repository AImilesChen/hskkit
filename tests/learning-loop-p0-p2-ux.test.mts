import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");

test("advanced HSK 7-9 Today plans degrade per capability instead of failing the whole plan", async () => {
  const { selectTodayContent } = await import("../src/lib/learning/today-content.ts");
  const { buildDailySession, emptyLearningState } = await import("../src/lib/learning/domain.ts");
  for (const level of [7, 8, 9]) {
    const plan = selectTodayContent(level);
    assert.equal(plan.status, "ready");
    if (plan.status !== "ready") continue;
    assert.equal(plan.startLevel, level);
    assert.equal(plan.levelBand, "7-9");
    const built = buildDailySession(emptyLearningState(), { ownerId: `advanced-${level}`, localDay: "2026-09-03", ruleVersion: "today-v5", now: "2026-09-03T09:00:00.000Z", dailyContent: plan, budgetMinutes: 30 });
    assert.ok(built.session.items.some((item) => item.kind === "learn"));
    assert.ok(built.session.items.some((item) => item.kind === "listen" && item.dimension === "audio"));
    assert.equal(built.session.items.some((item) => item.kind === "listen" && item.dimension === "context_audio"), false);
  }
});

test("Today budget caps both task count and displayed estimate", async () => {
  const { buildDailySession, emptyLearningState } = await import("../src/lib/learning/domain.ts");
  const { selectTodayContent } = await import("../src/lib/learning/today-content.ts");
  const built = buildDailySession(emptyLearningState(), { ownerId: "budget", localDay: "2026-09-03", ruleVersion: "today-v5", now: "2026-09-03T09:00:00.000Z", dailyContent: selectTodayContent(1), budgetMinutes: 10 });
  const planned = built.session.items.filter((item) => item.kind !== "summary");
  assert.ok((built.session.totalEstimatedMinutes ?? 0) <= 10);
  assert.equal(built.session.totalEstimatedMinutes, planned.reduce((sum, item) => sum + (item.estimatedMinutes ?? 0), 0));
});

test("same-day level changes keep completed history outside the new Today budget", async () => {
  const { addWordToToday, buildDailySession, completeDailyItem, emptyLearningState } = await import("../src/lib/learning/domain.ts");
  const { selectTodayContent } = await import("../src/lib/learning/today-content.ts");
  const first = buildDailySession(emptyLearningState(), { ownerId: "replan", localDay: "2026-09-03", ruleVersion: "today-v5", now: "2026-09-03T09:00:00.000Z", dailyContent: selectTodayContent(1), budgetMinutes: 10 });
  const learned = completeDailyItem(first.state, first.session.id, first.session.items.find((item) => item.kind === "learn")!.id);
  const levelTwo = selectTodayContent(2);
  const replanned = buildDailySession(learned.state, { ownerId: "replan", localDay: "2026-09-03", ruleVersion: "today-v5", now: "2026-09-03T10:00:00.000Z", dailyContent: levelTwo, budgetMinutes: 10 });
  assert.ok((replanned.session.totalEstimatedMinutes ?? 0) <= 10);
  assert.equal(replanned.session.items.find((item) => item.status === "completed" && item.contentId !== levelTwo.item.contentId)?.estimatedMinutes, 0);

  const withFirstDictionaryWord = addWordToToday(replanned.state, {
    sessionId: replanned.session.id,
    assetId: "word:ke-wai",
    contentId: "word:ke-wai",
    contentVersion: "hsk3-v1",
    title: "课外",
    href: "/vocabulary/1",
  });
  const withDictionary = addWordToToday(withFirstDictionaryWord, {
    sessionId: replanned.session.id,
    assetId: "word:ke-nei",
    contentId: "word:ke-nei",
    contentVersion: "hsk3-v1",
    title: "课内",
    href: "/vocabulary/1",
  });
  const deferred = withDictionary.dailySessions.find((session) => session.id === replanned.session.id)!;
  assert.equal(deferred.totalEstimatedMinutes, 10);
  assert.equal(deferred.items.find((item) => item.id === "dictionary:word:ke-nei")?.deferred, true);

  const expanded = buildDailySession(withDictionary, { ownerId: "replan", localDay: "2026-09-03", ruleVersion: "today-v5", now: "2026-09-03T11:00:00.000Z", dailyContent: levelTwo, budgetMinutes: 15 });
  assert.ok((expanded.session.totalEstimatedMinutes ?? 0) <= 15);
  assert.equal(expanded.session.items.find((item) => item.id === "dictionary:word:ke-nei")?.deferred, false);

  const withThirdDictionaryWord = addWordToToday(withDictionary, {
    sessionId: replanned.session.id,
    assetId: "word:ke-wai-2",
    contentId: "word:ke-wai-2",
    contentVersion: "hsk3-v1",
    title: "课外二",
    href: "/vocabulary/1",
  });
  const reduced = buildDailySession(withThirdDictionaryWord, { ownerId: "replan", localDay: "2026-09-03", ruleVersion: "today-v5", now: "2026-09-03T12:00:00.000Z", dailyContent: levelTwo, budgetMinutes: 5 });
  assert.ok((reduced.session.totalEstimatedMinutes ?? 0) <= 5);
  assert.ok(reduced.session.items.some((item) => item.deferred));
});

test("review planning supports composition, difficult-only queues, recommendations, tips and continuous correction", async () => {
  const { buildIntentReviewQueue, reviewComposition, recommendReviewCount, filterReviewCards, reviewTip } = await import("../src/lib/learning/review-session.ts");
  const cards = [
    { id: "a", contentId: "a", isMistake: true, dimension: "reading" as const, dueAt: "2026-09-01T00:00:00.000Z", ease: 2.1, level: 1, skill: "Vocabulary" },
    { id: "b", contentId: "b", isMistake: false, dimension: "audio" as const, dueAt: "2026-09-02T00:00:00.000Z", ease: 2.8, level: 4, skill: "Listening" },
  ];
  assert.deepEqual(reviewComposition(cards), { mistakes: 1, reading: 1, listening: 1 });
  assert.deepEqual(filterReviewCards(cards, { difficultOnly: true }).map((card) => card.id), ["a"]);
  assert.equal(recommendReviewCount(cards), 2);
  assert.match(reviewTip(cards[0]), /HSK 1|meaning/i);
  const continuous = buildIntentReviewQueue([
    ...cards,
    { id: "c", contentId: "c", isMistake: true, dimension: "audio" as const, dueAt: "2026-09-03T00:00:00.000Z" },
  ], { kind: "mistake", contentId: "c", cardId: "c" }, 1);
  assert.deepEqual(continuous.map((card) => card.id), ["c"]);
});

test("Today listening opens an available advanced word-audio task without requiring context audio", async () => {
  const [page, client] = await Promise.all([
    source("src/app/listen/today/[assetId]/page.tsx"),
    source("src/app/components/audio-exercise.tsx"),
  ]);
  assert.match(page, /if \(!exercises\[initialMode\]\) notFound\(\)/);
  assert.doesNotMatch(page, /if \(!audio \|\| !contextAudio\) notFound\(\)/);
  assert.match(client, /Partial<Record<AudioMode, PublicAudioExercise>>/);
  assert.match(client, /exercises\.context_audio/);
});

test("Today, Review and Mistakes expose the approved P0-P2 interaction contract", async () => {
  const [client, route] = await Promise.all([source("src/app/components/learning-dashboard.tsx"), source("src/app/api/v1/learning/route.ts")]);
  for (const token of [
    "Learning level", "Continue Today Session", "Recommended review", "Review composition", "How to rate your memory",
    "Review tip", "Difficult items only", "Next review", "Review report", "Mistake correction", "Continue correcting",
    "Back to Mistakes", "HSK level", "Question type", "When added", "No difficult items are due",
  ]) assert.match(client, new RegExp(token));
  assert.doesNotMatch(client, /version today-v4/);
  assert.match(client, /data\.cards\.filter\(\(card\) => card\.isMistake && !ratedLegacyMistakeIds\.includes\(card\.id\)\)/);
  assert.match(client, /item\.kind === "review" && item\.status === "pending"/);
  assert.match(client, /reviewedSessionCards/);
  assert.match(client, /ratedLegacyMistakeIds/);
  assert.match(route, /preferredLearningLevel/);
  assert.match(route, /ruleVersion: "today-v5"/);
});
