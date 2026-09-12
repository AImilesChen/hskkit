import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  addWordToReview,
  applyDailyItemAction,
  buildDailySession,
  emptyLearningState,
  freezeDailySession,
  type DailySession,
  type LearningState,
} from "../src/lib/learning/domain.ts";
import {
  listTodayContent,
  selectTodayContent,
  todayContentByContentId,
  todayPlanLevel,
  todaySelectionContext,
} from "../src/lib/learning/today-content.ts";
import { canRefreshTodayWords } from "../src/lib/learning/today-plan.ts";

const ownerId = "today-rotation-user";
const day = "2026-09-12";
const now = `${day}T08:00:00.000Z`;
const root = new URL("../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");

function ready(level: number, count: number, context: Parameters<typeof selectTodayContent>[2] = {}) {
  const plan = selectTodayContent(level, count, { ownerId, localDay: day, ...context });
  if (plan.status !== "ready") throw new Error(`Expected a ready Today plan for HSK ${level}.`);
  return plan;
}

function session(input: Partial<DailySession> & Pick<DailySession, "localDay" | "items">): DailySession {
  return {
    id: `daily:${ownerId}:${input.localDay}`,
    ownerId,
    ruleVersion: "today-v10",
    createdAt: `${input.localDay}T08:00:00.000Z`,
    ...input,
  };
}

test("P0 selects only complete published words from the learner's exact HSK level", () => {
  const candidates = listTodayContent(2);
  assert.ok(candidates.length >= 100, "the real Level 2 release must be used instead of the former two-word demo pool");
  assert.ok(candidates.every((item) => item.level === 2));
  assert.ok(candidates.every((item) => item.releaseStatus === "published"));
  assert.ok(candidates.every((item) => item.assetId && item.hanzi && item.pinyin && item.meaning && item.partOfSpeech));

  const plan = ready(2, 5);
  assert.equal(plan.items.length, 5);
  assert.ok(plan.items.every((item) => item.level === 2));
});

test("P0 keeps a day stable, rotates on another day, and uses a controlled progress window", () => {
  const candidates = listTodayContent(3);
  const completed = candidates.slice(0, 18).map((item) => item.contentId);
  const context = { ownerId, localDay: day, completedContentIds: completed };
  const first = selectTodayContent(3, 5, context);
  const again = selectTodayContent(3, 5, context);
  assert.deepEqual(first, again, "refreshing the same day must not silently replace words");
  assert.equal(first.status, "ready");
  if (first.status !== "ready") return;
  const expectedWindow = new Set(candidates.slice(18, 48).map((item) => item.contentId));
  assert.ok(first.items.every((item) => expectedWindow.has(item.contentId)), "new words must stay near current progress, not come from the full level at random");

  const tomorrow = selectTodayContent(3, 5, { ...context, localDay: "2026-09-13" });
  assert.equal(tomorrow.status, "ready");
  if (tomorrow.status === "ready") assert.notDeepEqual(tomorrow.items.map((item) => item.contentId), first.items.map((item) => item.contentId));
});

test("P0 excludes completed, today's existing plan, and every word shown as New in the prior 14 days", () => {
  const candidates = listTodayContent(4);
  const completedContentIds = candidates.slice(0, 4).map((item) => item.contentId);
  const recentNewContentIds = candidates.slice(4, 12).map((item) => item.contentId);
  const excludedTodayContentIds = candidates.slice(12, 15).map((item) => item.contentId);
  const plan = ready(4, 5, { completedContentIds, recentNewContentIds, excludedCurrentPlanContentIds: excludedTodayContentIds });
  const forbidden = new Set([...completedContentIds, ...recentNewContentIds, ...excludedTodayContentIds]);
  assert.ok(plan.items.every((item) => !forbidden.has(item.contentId)));
});

test("P0 carries at most one started unfinished word and does not carry a merely displayed word", () => {
  const [started, displayed] = listTodayContent(2).slice(0, 2);
  const state: LearningState = {
    ...emptyLearningState(),
    dailySessions: [session({
      localDay: "2026-09-11",
      items: [
        { id: `dictionary:${started.assetId}`, kind: "learn", contentId: started.contentId, contentVersion: started.contentVersion, status: "pending", startedAt: "2026-09-11T09:00:00.000Z" },
        { id: `dictionary:${displayed.assetId}`, kind: "learn", contentId: displayed.contentId, contentVersion: displayed.contentVersion, status: "pending" },
      ],
    })],
  };
  const context = todaySelectionContext(state, ownerId, day);
  assert.deepEqual(context.continueContentIds, [started.contentId]);
  assert.ok(context.recentNewContentIds?.includes(displayed.contentId));
  const plan = ready(2, 3, context);
  assert.equal(plan.items[0].contentId, started.contentId);
  assert.equal(plan.items[0].todayStatus, "continue");
  assert.equal(plan.items.filter((item) => item.todayStatus === "continue").length, 1);
});

test("P0 preserves an already frozen same-day plan even if candidate inputs later change", () => {
  const original = ready(3, 3);
  const built = buildDailySession(emptyLearningState(), {
    ownerId,
    localDay: day,
    ruleVersion: "today-v10",
    now,
    dailyContent: original,
    budgetMinutes: 20,
    newWordCount: 3,
  });
  const fixed = todaySelectionContext(built.state, ownerId, day);
  const rebuiltPlan = ready(3, 3, { ...fixed, recentNewContentIds: original.items.map((item) => item.contentId) });
  assert.deepEqual(rebuiltPlan.items.map((item) => item.contentId), original.items.map((item) => item.contentId));
});

test("P1 records a real start without completing the word and limits replacement to once per day", () => {
  const plan = ready(1, 2);
  const built = buildDailySession(emptyLearningState(), {
    ownerId,
    localDay: day,
    ruleVersion: "today-v10",
    now,
    dailyContent: plan,
    budgetMinutes: 20,
    newWordCount: 2,
  });
  const learn = built.session.items.find((item) => item.kind === "learn")!;
  const started = applyDailyItemAction(built.state, {
    sessionId: built.session.id,
    itemId: learn.id,
    action: "start",
    idempotencyKey: "start-word-once",
    observedAt: now,
  });
  assert.equal(started.item.status, "pending");
  assert.equal(started.item.startedAt, now);
  assert.equal(canRefreshTodayWords(started.state.dailySessions[0]), true);
  assert.equal(canRefreshTodayWords({ ...started.state.dailySessions[0], wordRefreshesUsed: 1 }), false);
});

test("P1 exposes honest New/Continue/Review/Mistake reasons, one replacement, level completion, and summary copy", async () => {
  const [dashboard, route, content] = await Promise.all([
    source("src/app/components/learning-dashboard.tsx"),
    source("src/app/api/v1/learning/route.ts"),
    source("src/lib/learning/today-content.ts"),
  ]);
  for (const token of ["New", "Continue", "Review", "Mistake", "Why today", "Change today's words", "Level complete", "Words learned"]) {
    assert.match(dashboard, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(route, /start_item/);
  assert.match(route, /refresh_today_words/);
  assert.match(route, /addWordToReview/);
  assert.match(content, /progressWindowSize/);
});

test("P0 uses the complete formal release rather than the 120-word preview", () => {
  assert.equal(listTodayContent(1).length, 500);
  assert.equal(listTodayContent(2).length, 772);
  assert.equal(listTodayContent(6).length, 1_140);
  assert.equal(listTodayContent(8).length, 5_636);
  const beyondPreview = listTodayContent(1).at(-1);
  assert.ok(beyondPreview);
  assert.equal(todayContentByContentId(beyondPreview.contentId)?.assetId, beyondPreview.assetId);
});

test("P0 does not call a level complete when its only remaining words are temporarily excluded", () => {
  const candidates = listTodayContent(1);
  const plan = selectTodayContent(1, 1, {
    ownerId,
    localDay: day,
    completedContentIds: candidates.slice(1).map((item) => item.contentId),
    recentNewContentIds: [candidates[0].contentId],
  });
  assert.equal(plan.status, "empty");
  if (plan.status === "empty") assert.equal(plan.code, "EMPTY_CONTENT_QUEUE");
});

test("P0 attributes the shared advanced band to the learner's selected HSK level", () => {
  for (const level of [7, 8, 9]) {
    const candidates = listTodayContent(level);
    assert.equal(candidates.length, 5_636);
    assert.ok(candidates.every((item) => item.level === level));
    const plan = ready(level, 3);
    assert.ok(plan.items.every((item) => item.level === level));
  }
});

test("P1 keeps a completed advanced word in the learner's selected review level", async () => {
  const route = await source("src/app/api/v1/learning/route.ts");
  assert.match(route, /const selectedTodayLevel = activeToday\.session\.startLevel/);
  assert.match(route, /level: reviewLevel/);
});

test("P0 freezes a saved daily session with a stable idempotency key", async () => {
  const dashboard = await source("src/app/components/learning-dashboard.tsx");
  const freezeBlock = dashboard.slice(dashboard.indexOf("async function freezeTodayPlan"), dashboard.indexOf("async function load"));
  assert.match(freezeBlock, /const key = operation;/);
  assert.doesNotMatch(freezeBlock, /crypto\.randomUUID/);
});

test("P0 treats existing vocabulary review cards as learned, not New", () => {
  const word = listTodayContent(2)[0];
  const learned = addWordToReview(emptyLearningState(), {
    word: {
      assetId: word.assetId,
      contentId: word.contentId,
      contentVersion: word.contentVersion,
      level: 2,
      levelBand: "2",
      hanzi: word.hanzi,
      traditional: word.hanzi,
      pinyin: word.pinyin,
      meaning: word.meaning,
    },
    observedAt: now,
  });
  const context = todaySelectionContext(learned, ownerId, day);
  assert.ok(context.completedContentIds?.includes(word.contentId));
  const plan = ready(2, 3, context);
  assert.ok(plan.items.every((item) => item.contentId !== word.contentId));
});

test("P0 keeps the persisted same-day HSK level when preferences change", () => {
  const state: LearningState = {
    ...emptyLearningState(),
    dailySessions: [session({ localDay: day, startLevel: 3, items: [] })],
  };
  assert.equal(todayPlanLevel(state, ownerId, day, 8), 3);
  assert.equal(todayPlanLevel(emptyLearningState(), ownerId, day, 8), 8);
});

test("P0 freeze is durable and repeated calls do not mutate the session", () => {
  const built = buildDailySession(emptyLearningState(), {
    ownerId,
    localDay: day,
    ruleVersion: "today-v10",
    now,
    dailyContent: ready(1, 1),
    budgetMinutes: 20,
    newWordCount: 1,
  });
  const first = freezeDailySession(built.state, built.session.id, now);
  assert.equal(first.replayed, false);
  assert.equal(first.session.frozenAt, now);
  const second = freezeDailySession(first.state, built.session.id, "2026-09-12T09:00:00.000Z");
  assert.equal(second.replayed, true);
  assert.equal(second.state, first.state);
  assert.equal(second.session.frozenAt, now);
  const rebuilt = buildDailySession(first.state, {
    ownerId,
    localDay: day,
    ruleVersion: "today-v11",
    now: "2026-09-12T10:00:00.000Z",
    dailyContent: ready(2, 5),
    budgetMinutes: 10,
    newWordCount: 5,
  });
  assert.equal(rebuilt.state, first.state);
  assert.deepEqual(rebuilt.session, first.session);
});

test("P1 updates an existing shared-band review card to the selected advanced level", () => {
  const word = listTodayContent(8)[0];
  const baseWord = {
    assetId: word.assetId,
    contentId: word.contentId,
    contentVersion: word.contentVersion,
    level: 7,
    levelBand: "7–9",
    hanzi: word.hanzi,
    traditional: word.hanzi,
    pinyin: word.pinyin,
    meaning: word.meaning,
  };
  const initial = addWordToReview(emptyLearningState(), { word: baseWord, observedAt: now });
  const reassigned = addWordToReview(initial, {
    word: { ...baseWord, level: 8 },
    observedAt: "2026-09-12T09:00:00.000Z",
  });
  assert.equal(reassigned.cards.length, 1);
  assert.equal(reassigned.attempts.find((attempt) => attempt.id === reassigned.cards[0].sourceAttemptId)?.reviewSnapshot?.level, 8);
});

test("P1 refresh preserves every started or skipped Learn item even when due reviews consume the budget", () => {
  const original = buildDailySession(emptyLearningState(), {
    ownerId,
    localDay: day,
    ruleVersion: "today-v10",
    now,
    dailyContent: ready(1, 3),
    budgetMinutes: 20,
    newWordCount: 3,
  });
  const learns = original.session.items.filter((item) => item.kind === "learn");
  assert.ok(learns.length >= 2);
  const preservedContentIds = [learns[0].contentId, learns[1].contentId];
  let markedState: LearningState = {
    ...original.state,
    dailySessions: original.state.dailySessions.map((current) => current.id === original.session.id ? {
      ...current,
      items: current.items.map((item) => item.id === learns[0].id
        ? { ...item, status: "skipped" as const }
        : item.id === learns[1].id
          ? { ...item, startedAt: "2026-09-12T08:30:00.000Z" }
          : item),
    } : current),
  };
  for (const word of listTodayContent(2).slice(0, 5)) {
    markedState = addWordToReview(markedState, {
      word: {
        assetId: word.assetId,
        contentId: word.contentId,
        contentVersion: word.contentVersion,
        level: word.level,
        levelBand: String(word.level),
        hanzi: word.hanzi,
        traditional: word.hanzi,
        pinyin: word.pinyin,
        meaning: word.meaning,
      },
      observedAt: now,
      dueAt: now,
    });
  }
  const refreshedContent = selectTodayContent(1, 3, {
    ownerId,
    localDay: day,
    fixedTodayContentIds: preservedContentIds,
    excludedCurrentPlanContentIds: learns.map((item) => item.contentId),
  });
  const refreshed = buildDailySession(markedState, {
    ownerId,
    localDay: day,
    ruleVersion: "today-v10",
    now: "2026-09-12T09:00:00.000Z",
    dailyContent: refreshedContent,
    budgetMinutes: 10,
    newWordCount: 3,
    focus: "review_first",
    allowFrozenUpdate: true,
    preservedTodayContentIds: preservedContentIds,
  });
  const first = refreshed.session.items.find((item) => item.id === learns[0].id);
  const second = refreshed.session.items.find((item) => item.id === learns[1].id);
  assert.equal(first?.status, "skipped");
  assert.equal(second?.startedAt, "2026-09-12T08:30:00.000Z");
});
