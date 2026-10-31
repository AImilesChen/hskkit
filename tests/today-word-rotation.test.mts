import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { addWordToReview, buildDailySession, emptyLearningState } from "../src/lib/learning/domain.ts";
import { trustedTodayAudioExercise } from "../src/lib/learning/audio.ts";
import { selectTodayContent, todayWordHistory } from "../src/lib/learning/today-content.ts";
import { getWordBySlug } from "../src/lib/dictionary/catalog.ts";

const now = "2026-10-04T09:00:00.000Z";

function firstDay() {
  const content = selectTodayContent(2, 1);
  assert.equal(content.status, "ready");
  const built = buildDailySession(emptyLearningState(), {
    ownerId: "learner", localDay: "2026-10-04", ruleVersion: "today-v10", now,
    dailyContent: content, budgetMinutes: 20, newWordCount: 1, listeningEnabled: true,
  });
  return { content, session: built.session };
}

test("Today has a larger usable pool and each planned word opens a published study page", () => {
  const content = selectTodayContent(2, 5);
  assert.equal(content.status, "ready");
  if (content.status !== "ready") return;
  assert.equal(content.items.length, 5);
  assert.equal(new Set(content.items.map((item) => item.contentId)).size, 5);
  for (const item of content.items) {
    assert.equal(getWordBySlug(item.studySlug).status, "published");
    if (item.audioSrc) {
      const listening = trustedTodayAudioExercise(item.assetId, "audio");
      assert.equal(listening?.contentId, item.contentId);
      assert.equal(listening?.voiceText, item.hanzi);
    }
  }
});

test("a learned word with unfinished listening resumes at audio without repeating Learn", () => {
  const { content, session } = firstDay();
  assert.equal(content.status, "ready");
  if (content.status !== "ready") return;
  const unfinished = { ...session, items: session.items.map((item) => item.kind === "learn" ? { ...item, status: "completed" as const } : item) };
  const state = { ...emptyLearningState(), dailySessions: [unfinished] };
  const history = todayWordHistory(state.dailySessions, "learner", "2026-10-05", 2);
  const next = selectTodayContent(2, 1, { ...history, listeningEnabled: true });
  assert.equal(next.status, "ready");
  if (next.status !== "ready") return;
  assert.equal(next.items[0].contentId, content.item.contentId);
  assert.equal(next.items[0].isContinuing, true);
  assert.equal(next.items.filter((item) => !item.isContinuing).length, 1);
  const built = buildDailySession(state, {
    ownerId: "learner", localDay: "2026-10-05", ruleVersion: "today-v10", now: "2026-10-05T09:00:00.000Z",
    dailyContent: next, budgetMinutes: 20, newWordCount: 1, listeningEnabled: true,
  });
  const continued = built.session.items.find((item) => item.kind === "learn" && item.contentId === content.item.contentId);
  assert.equal(continued, undefined);
  const listening = built.session.items.find((item) => item.kind === "listen" && item.contentId === content.item.contentId && item.dimension === "audio");
  assert.equal(listening?.isContinuing, true);
  assert.match(listening?.title ?? "", /^Continue listening to /);
  const newLearn = built.session.items.find((item) => item.kind === "learn" && !item.isContinuing);
  assert.ok(newLearn);
  assert.ok(built.session.items.indexOf(listening!) < built.session.items.indexOf(newLearn));
});

test("a word whose Learn step is unfinished still resumes Learn and its available listening", () => {
  const { content, session } = firstDay();
  assert.equal(content.status, "ready");
  if (content.status !== "ready") return;
  const history = todayWordHistory([session], "learner", "2026-10-05", 2);
  const next = selectTodayContent(2, 1, { ...history, listeningEnabled: true });
  assert.equal(next.status, "ready");
  if (next.status !== "ready") return;
  assert.equal(next.items[0].resumeSteps?.learn, true);
  const built = buildDailySession({ ...emptyLearningState(), dailySessions: [session] }, {
    ownerId: "learner", localDay: "2026-10-05", ruleVersion: "today-v10", now: "2026-10-05T09:00:00.000Z",
    dailyContent: next, budgetMinutes: 20, newWordCount: 1, listeningEnabled: true,
  });
  assert.ok(built.session.items.some((item) => item.kind === "learn" && item.contentId === content.item.contentId && item.isContinuing));
  assert.ok(built.session.items.some((item) => item.kind === "listen" && item.contentId === content.item.contentId));
});

test("an older unfinished audio step does not reopen after a later completion", () => {
  const { content, session } = firstDay();
  assert.equal(content.status, "ready");
  if (content.status !== "ready") return;
  const first = { ...session, items: session.items.map((item) => item.kind === "learn" ? { ...item, status: "completed" as const } : item) };
  const second = {
    ...first, id: "second-day", localDay: "2026-10-05",
    items: first.items.map((item) => item.kind === "listen" ? { ...item, status: "completed" as const } : item),
  };
  const history = todayWordHistory([first, second], "learner", "2026-10-06", 2);
  assert.ok(!history.continuingContentIds?.includes(content.item.contentId));
});

test("when only context listening is unfinished, it resumes without replaying Learn or word audio", () => {
  const { content, session } = firstDay();
  assert.equal(content.status, "ready");
  if (content.status !== "ready") return;
  assert.ok(content.item.example);
  const yesterday = {
    ...session,
    items: session.items.map((item) => item.kind === "learn" || item.dimension === "audio"
      ? { ...item, status: "completed" as const } : item),
  };
  const history = todayWordHistory([yesterday], "learner", "2026-10-05", 2);
  const next = selectTodayContent(2, 1, { ...history, listeningEnabled: true });
  assert.equal(next.status, "ready");
  if (next.status !== "ready") return;
  const built = buildDailySession({ ...emptyLearningState(), dailySessions: [yesterday] }, {
    ownerId: "learner", localDay: "2026-10-05", ruleVersion: "today-v10", now: "2026-10-05T09:00:00.000Z",
    dailyContent: next, budgetMinutes: 20, newWordCount: 1, listeningEnabled: true,
  });
  const continued = built.session.items.filter((item) => item.contentId === content.item.contentId);
  assert.deepEqual(continued.map((item) => [item.kind, item.dimension]), [["listen", "context_audio"]]);
  assert.equal(continued[0].title, `Continue context listening: ${content.item.hanzi}`);
});

test("an existing Today plan drops a redundant Learn step when yesterday's Learn was saved", () => {
  const { content, session } = firstDay();
  assert.equal(content.status, "ready");
  if (content.status !== "ready") return;
  const yesterday = { ...session, items: session.items.map((item) => item.kind === "learn" ? { ...item, status: "completed" as const } : item) };
  const current = {
    ...session, id: "old-current-plan", localDay: "2026-10-05", planFingerprint: "old-plan",
    items: session.items.map((item) => ({ ...item, status: "pending" as const, isContinuing: true })),
  };
  const state = { ...emptyLearningState(), dailySessions: [yesterday, current] };
  const history = todayWordHistory(state.dailySessions, "learner", "2026-10-05", 2);
  const next = selectTodayContent(2, 1, { ...history, listeningEnabled: true });
  assert.equal(next.status, "ready");
  if (next.status !== "ready") return;
  const built = buildDailySession(state, {
    ownerId: "learner", localDay: "2026-10-05", ruleVersion: "today-v10", now: "2026-10-05T09:00:00.000Z",
    dailyContent: next, budgetMinutes: 20, newWordCount: 1, listeningEnabled: true,
  });
  assert.equal(built.session.id, current.id);
  assert.ok(!built.session.items.some((item) => item.kind === "learn" && item.contentId === content.item.contentId && item.status === "pending"));
  assert.ok(built.session.items.some((item) => item.kind === "listen" && item.contentId === content.item.contentId && item.status === "pending"));
  const afterRefresh = todayWordHistory(built.state.dailySessions, "learner", "2026-10-05", 2);
  assert.ok(afterRefresh.pinnedContentIds?.includes(content.item.contentId));
  const refreshedContent = selectTodayContent(2, 1, { ...afterRefresh, listeningEnabled: true });
  assert.equal(refreshedContent.status, "ready");
  if (refreshedContent.status !== "ready") return;
  const refreshed = buildDailySession(built.state, {
    ownerId: "learner", localDay: "2026-10-05", ruleVersion: "today-v10", now: "2026-10-05T09:05:00.000Z",
    dailyContent: refreshedContent, budgetMinutes: 20, newWordCount: 1, listeningEnabled: true,
  });
  assert.ok(refreshed.session.items.some((item) => item.kind === "listen" && item.contentId === content.item.contentId && item.status === "pending"));
  assert.ok(!refreshed.session.items.some((item) => item.kind === "learn" && item.contentId === content.item.contentId && item.status === "pending"));
});

test("completed word is not assigned as new tomorrow, but today's saved selection stays fixed", () => {
  const { content, session } = firstDay();
  assert.equal(content.status, "ready");
  if (content.status !== "ready") return;
  const finished = { ...session, items: session.items.map((item) => item.kind === "learn" || item.kind === "listen" ? { ...item, status: "completed" as const } : item) };
  const sameDay = todayWordHistory([finished], "learner", "2026-10-04", 2);
  const frozen = selectTodayContent(2, 3, sameDay);
  assert.equal(frozen.status, "ready");
  if (frozen.status !== "ready") return;
  assert.deepEqual(frozen.items.map((item) => item.contentId), [content.item.contentId]);
  const reconfigured = selectTodayContent(2, 3, { ...sameDay, freezePinned: false });
  assert.equal(reconfigured.status, "ready");
  if (reconfigured.status !== "ready") return;
  assert.equal(reconfigured.items.length, 3);
  const tomorrow = todayWordHistory([finished], "learner", "2026-10-05", 2);
  const next = selectTodayContent(2, 1, tomorrow);
  assert.equal(next.status, "ready");
  if (next.status !== "ready") return;
  assert.notEqual(next.item.contentId, content.item.contentId);
  assert.equal(next.item.isContinuing, undefined);
});

test("an unfinished word survives a later day with no room for a Learn step", () => {
  const { content, session } = firstDay();
  assert.equal(content.status, "ready");
  if (content.status !== "ready") return;
  const noRoom = {
    ...session, id: "review-only-day", localDay: "2026-10-05", startLevel: 2,
    items: session.items.filter((item) => item.kind === "summary"),
  };
  const history = todayWordHistory([session, noRoom], "learner", "2026-10-06", 2);
  const next = selectTodayContent(2, 1, history);
  assert.equal(next.status, "ready");
  if (next.status !== "ready") return;
  assert.equal(next.items[0].contentId, content.item.contentId);
  assert.equal(next.items[0].isContinuing, true);
});

test("words without a verified recording stay in Learn without a broken listening step", () => {
  const content = selectTodayContent(6, 1, { listeningEnabled: true });
  assert.equal(content.status, "ready");
  if (content.status !== "ready") return;
  assert.equal(content.item.audioSrc, undefined);
  const built = buildDailySession(emptyLearningState(), {
    ownerId: "reading-only", localDay: "2026-10-04", ruleVersion: "today-v10", now,
    dailyContent: content, budgetMinutes: 20, newWordCount: 1, listeningEnabled: true,
  });
  assert.equal(built.session.items.filter((item) => item.kind === "learn").length, 1);
  assert.equal(built.session.items.filter((item) => item.kind === "listen").length, 0);
});

test("Today continues through all published HSK 2 words before reporting completion", () => {
  const completed: string[] = [];
  for (let batch = 0; batch < 45; batch++) {
    const content = selectTodayContent(2, 5, { completedContentIds: completed });
    if (content.status === "empty") {
      assert.equal(content.code, "NO_NEW_WORDS");
      assert.equal(completed.length, 200);
      assert.equal(new Set(completed).size, 200);
      return;
    }
    completed.push(...content.items.map((item) => item.contentId));
  }
  assert.fail("Today kept reusing completed words");
});

test("completing a Today word schedules one later reading review and replays safely", async () => {
  const word = {
    assetId: "hsk3.word.l2.0368.v1", contentId: "word:hsk3.word.l2.0368.v1",
    contentVersion: "hsk3-content-truth-v5:2026.08.21-batch1", level: 2, levelBand: "2",
    hanzi: "旅行", traditional: "旅行", pinyin: "lǚxíng", meaning: "travel",
  };
  const dueAt = "2026-10-05T09:00:00.000Z";
  const first = addWordToReview(emptyLearningState(), { word, observedAt: now, dueAt });
  assert.equal(first.cards.length, 1);
  assert.equal(first.cards[0].dueAt, dueAt);
  assert.equal(addWordToReview(first, { word, observedAt: now, dueAt }).cards.length, 1);
  const recalledLate = addWordToReview(first, { word, observedAt: "2026-10-04T10:00:00.000Z" });
  assert.equal(recalledLate.cards[0].dueAt, "2026-10-04T10:00:00.000Z");
  assert.equal(recalledLate.cards[0].intervalDays, 0);
  const route = await readFile(new URL("../src/app/api/v1/learning/route.ts", import.meta.url), "utf8");
  assert.match(route, /state = addWordToReview\(state, \{ word: completedLearnContext\.current, observedAt: completedAt, dueAt:/);
});
