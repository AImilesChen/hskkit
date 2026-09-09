import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { assertCurrentDailySession, assertTodayLearnItemMatches, buildDailySession, emptyLearningState } from "../src/lib/learning/domain.ts";
import { selectTodayContent } from "../src/lib/learning/today-content.ts";
import { isTodayBudgetMinutes, recommendTodayMinutes, TODAY_BUDGET_OPTIONS } from "../src/lib/learning/today-plan.ts";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");
const now = "2026-09-09T09:00:00.000Z";

test("Today Learn opens the exact planned word and removes the technical content-update notice", () => {
  const plan = selectTodayContent(1);
  assert.equal(plan.status, "ready");
  if (plan.status !== "ready") return;
  const first = buildDailySession(emptyLearningState(), {
    ownerId: "today-p0",
    localDay: "2026-09-09",
    ruleVersion: "today-v6",
    now,
    dailyContent: plan,
    budgetMinutes: 30,
  });
  const learn = first.session.items.find((item) => item.kind === "learn");
  assert.equal(learn?.href, `/word/${plan.item.studySlug}`);

  const replanned = buildDailySession(first.state, {
    ownerId: "today-p0",
    localDay: "2026-09-09",
    ruleVersion: "today-v6",
    now: "2026-09-09T10:00:00.000Z",
    dailyContent: selectTodayContent(2),
    budgetMinutes: 20,
  });
  assert.notEqual(replanned.session.notice?.code, "CONTENT_UPDATED");
});

test("Today has one dominant start action, explicit plan save feedback, progress, remaining time and plan-gap reason", async () => {
  const dashboard = await source("src/app/components/learning-dashboard.tsx");
  for (const token of [
    "Continue Today Session",
    "Current step",
    "of {plannedTodayTasks.length}",
    "min remaining",
    "Why this plan",
    "Update plan",
    "Plan updated",
    "Plan change is pending. Use Retry sync",
    "Recommended time",
    "Why today arranged this",
  ]) assert.match(dashboard, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(dashboard, /onChange=\{\(event\) => void configureToday/);
  assert.doesNotMatch(dashboard, /Open word list/);
  assert.doesNotMatch(dashboard, /Mark learned/);
});

test("Today budget is restricted to the approved presets and personalization uses score, mistakes, streak and mastery", () => {
  assert.deepEqual(TODAY_BUDGET_OPTIONS, [5, 10, 15, 20, 30]);
  for (const allowed of TODAY_BUDGET_OPTIONS) assert.equal(isTodayBudgetMinutes(allowed), true);
  for (const rejected of [6, 9, 45, 60, 180, 20.5, "20"]) assert.equal(isTodayBudgetMinutes(rejected), false);
  assert.equal(recommendTodayMinutes({ monthPoints: 0, openMistakes: 0, currentStreak: 0, mastery: { reading: 0, audio: 0, context_audio: 0 }, cardCount: 0 }), 15);
  assert.equal(recommendTodayMinutes({ monthPoints: 100, openMistakes: 0, currentStreak: 0, mastery: { reading: 4, audio: 4, context_audio: 4 }, cardCount: 4 }), 20);
  assert.equal(recommendTodayMinutes({ monthPoints: 0, openMistakes: 3, currentStreak: 0, mastery: { reading: 4, audio: 4, context_audio: 4 }, cardCount: 4 }), 30);
  assert.equal(recommendTodayMinutes({ monthPoints: 0, openMistakes: 0, currentStreak: 0, mastery: { reading: 5, audio: 1, context_audio: 5 }, cardCount: 6 }), 30);
});

test("Today Learn completion is bound to the exact planned content and version", () => {
  const plan = selectTodayContent(1);
  assert.equal(plan.status, "ready");
  if (plan.status !== "ready") return;
  const built = buildDailySession(emptyLearningState(), { ownerId: "today-bind", localDay: "2026-09-09", ruleVersion: "today-v6", now, dailyContent: plan, budgetMinutes: 30 });
  const learn = built.session.items.find((item) => item.kind === "learn");
  assert.ok(learn?.contentVersion);
  assert.doesNotThrow(() => assertCurrentDailySession(built.session, built.session.id));
  assert.throws(() => assertCurrentDailySession(built.session, "day_from_yesterday"), /STALE_TODAY_SESSION/);
  assert.doesNotThrow(() => assertTodayLearnItemMatches(built.state, { sessionId: built.session.id, itemId: learn!.id, contentId: plan.item.contentId, contentVersion: plan.item.contentVersion }));
  assert.throws(() => assertTodayLearnItemMatches(built.state, { sessionId: built.session.id, itemId: learn!.id, contentId: "word:wrong", contentVersion: plan.item.contentVersion }), /TODAY_LEARN_WORD_MISMATCH/);
});

test("Today subpages preserve Today Session context and finish through the saved server item", async () => {
  const [wordPage, wordAction, audio, practice] = await Promise.all([
    source("src/app/word/[slug]/page.tsx"),
    source("src/app/components/today-word-completion.tsx"),
    source("src/app/components/audio-exercise.tsx"),
    source("src/app/practice/[level]/[skill]/practice-client.tsx"),
  ]);
  assert.match(wordPage, /TodayWordCompletion/);
  assert.match(wordAction, /action: "complete_item"/);
  assert.match(wordAction, /assetId, idempotencyKey: idempotencyKey\.current/);
  assert.match(wordAction, /sessionStorage\.getItem\(storageKey\)/);
  assert.match(wordAction, /window\.location\.assign\("\/today\?resume=1"\)/);
  const learningRoute = await source("src/app/api/v1/learning/route.ts");
  const practiceRoute = await source("src/app/api/v1/practice/route.ts");
  assert.match(learningRoute, /assertCurrentDailySession\(activeToday\.session, sessionId\)/);
  assert.match(learningRoute, /assertDailyAudioBinding\(state, dailySessionId, dailyItemId, exercise, activeToday\.session\.id\)/);
  assert.match(practiceRoute, /assertCurrentDailyPracticeBinding/);
  assert.match(practiceRoute, /PRACTICE_DAILY_SESSION_STALE/);
  assert.match(audio, /tzOffset: new Date\(\)\.getTimezoneOffset\(\)/);
  assert.match(practice, /tzOffset: new Date\(\)\.getTimezoneOffset\(\)/);
  for (const content of [audio, practice]) {
    assert.match(content, /Today Session/);
    assert.match(content, /Continue Today Session/);
  }
});

test("completed Today renders a truthful summary, recovery path, personalization reason and bonus task", async () => {
  const dashboard = await source("src/app/components/learning-dashboard.tsx");
  for (const token of [
    "Daily Summary",
    "Completed tasks",
    "Skipped tasks",
    "Open mistakes",
    "Recommended focus",
    "Monthly learning score",
    "Bonus task",
    "Current streak",
  ]) assert.match(dashboard, new RegExp(token));
  assert.match(dashboard, /Back to Today/);
});
