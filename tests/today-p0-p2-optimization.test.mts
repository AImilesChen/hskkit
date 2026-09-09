import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { assertCurrentDailySession, assertTodayLearnItemMatches, buildDailySession, emptyLearningState } from "../src/lib/learning/domain.ts";
import { selectTodayContent } from "../src/lib/learning/today-content.ts";
import { isTodayBudgetMinutes, recommendTodayMinutes, resolveTodayCelebration, TODAY_BUDGET_OPTIONS } from "../src/lib/learning/today-plan.ts";

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
  assert.match(wordAction, /completed=learn&completedSession=/);
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

test("Today return celebration is truthful and upgrades the final step to a whole-session celebration", () => {
  assert.equal(resolveTodayCelebration({ returnedKind: null, completedCount: 1, summaryComplete: false }), null);
  assert.equal(resolveTodayCelebration({ returnedKind: "listen", completedCount: 0, summaryComplete: false }), null);
  assert.deepEqual(resolveTodayCelebration({ returnedKind: "review", completedCount: 2, summaryComplete: false }), {
    kind: "step",
    icon: "review",
    eyebrow: "Step complete",
    title: "Review complete!",
    message: "2 review items saved. Your next Today step is ready.",
  });
  assert.deepEqual(resolveTodayCelebration({ returnedKind: "practice", completedCount: 1, summaryComplete: true }), {
    kind: "session",
    icon: "target",
    eyebrow: "Today complete",
    title: "Today’s session wrapped up!",
    message: "Completed work is saved, and any skipped steps remain visible to restore.",
  });
});

test("Today journey makes current, completed, locked and skipped states unmistakable with local actions", async () => {
  const [dashboard, todayPlan] = await Promise.all([
    source("src/app/components/learning-dashboard.tsx"),
    source("src/lib/learning/today-plan.ts"),
  ]);
  for (const token of [
    "HomeIcon",
    "TodayHeroArtwork",
    "TodayJourneyIcon",
    "Today’s plan",
    "Balanced",
    "Adjust",
    "Locked",
    "Complete the previous step to unlock",
    "Step complete",
    "Moved to tomorrow",
    "today-mobile-action",
    "Learning Points",
    "Correct open mistakes",
  ]) assert.match(dashboard, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(dashboard, /primaryTodayAction\(item,/);
  assert.match(dashboard, /min-h-\[64px\][\s\S]{0,500}Today’s plan/);
  assert.match(todayPlan, /Today’s session wrapped up!/);
  assert.match(dashboard, /event\.key === "Escape"/);
  assert.match(dashboard, /querySelectorAll<HTMLElement>/);
});

test("every Today-bound completion route returns a celebration signal without changing completion authority", async () => {
  const [wordAction, audio, practice, dashboard] = await Promise.all([
    source("src/app/components/today-word-completion.tsx"),
    source("src/app/components/audio-exercise.tsx"),
    source("src/app/practice/[level]/[skill]/practice-client.tsx"),
    source("src/app/components/learning-dashboard.tsx"),
  ]);
  assert.match(wordAction, /completed=learn&completedSession=.*completedItem=/);
  assert.match(audio, /completed=listen&completedSession=.*completedItem=/);
  assert.match(practice, /completed=practice&completedSession=.*completedItem=/);
  assert.match(dashboard, /completed=review&completedSession=.*completedItem=/);
  assert.match(wordAction, /sessionStorage\.setItem\(todayCompletionProofKey\(dailySessionId, dailyItemId\), "armed"\)[\s\S]*window\.location\.assign/);
  assert.match(audio, /if \(dailySessionId && dailyItemId\) sessionStorage\.setItem\(todayCompletionProofKey/);
  assert.match(practice, /data\.session\?\.status === "completed"[\s\S]*sessionStorage\.setItem\(todayCompletionProofKey/);
  assert.match(dashboard, /targetBefore\.reviewCardId === card\.id/);
  assert.match(dashboard, /targetBefore\.status === "pending"/);
  assert.match(dashboard, /targetAfter\?\.status === "completed"/);
  assert.match(dashboard, /sessionStorage\.setItem\(todayCompletionProofKey\(entryTodaySessionId, entryTodayItemId\), "armed"\)/);
  assert.match(dashboard, /returnedSessionId !== data\.session\.id \|\| !returnedItemId/);
  assert.match(dashboard, /sessionStorage\.getItem\(completionProofKey\) !== "armed"/);
  assert.match(dashboard, /sessionStorage\.removeItem\(completionProofKey\)/);
  assert.match(dashboard, /cleanUrl\.searchParams\.delete\("completedSession"\)/);
  assert.match(dashboard, /cleanUrl\.searchParams\.delete\("completedItem"\)/);
  assert.match(dashboard, /calc\(76px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(dashboard, /sessionStorage\.setItem\(celebrationKey/);
  assert.match(dashboard, /prefers-reduced-motion/);
});
