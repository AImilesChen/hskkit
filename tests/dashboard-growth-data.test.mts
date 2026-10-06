import assert from "node:assert/strict";
import test from "node:test";
import { buildGrowthSnapshot } from "../src/lib/learning/growth.ts";

const levelTotals = [
  { level: 1, label: "HSK 1", total: 500 },
  { level: 2, label: "HSK 2", total: 772 },
  { level: 3, label: "HSK 3", total: 973 },
  { level: 4, label: "HSK 4", total: 1000 },
  { level: 5, label: "HSK 5", total: 1071 },
  { level: 6, label: "HSK 6", total: 1140 },
  { level: 7, label: "HSK 7–9", total: 5636 },
];

test("growth snapshot uses account timezone and only successful learning actions", () => {
  const snapshot = buildGrowthSnapshot({
    now: new Date("2026-09-05T12:00:00.000Z"),
    timezone: "America/Los_Angeles",
    activity: [
      { action: "attempt", createdAt: "2026-09-01T00:30:00.000Z" },
      { action: "grade", createdAt: "2026-09-05T08:00:00.000Z" },
      { action: "configure_today", createdAt: "2026-09-05T09:00:00.000Z" },
    ],
    attempts: [],
    levelTotals,
  });
  assert.equal(snapshot.timezone, "America/Los_Angeles");
  assert.equal(snapshot.curve30.at(-1)?.date, "2026-09-05");
  assert.equal(snapshot.curve30.find((day) => day.date === "2026-08-31")?.count, 1);
  assert.equal(snapshot.curve30.find((day) => day.date === "2026-09-05")?.count, 1);
  assert.equal(snapshot.calendar.days.find((day) => day.date === "2026-09-05")?.count, 1);
  assert.equal(snapshot.totalActions30, 2);
});

test("HSK progress counts unique tracked words and merges the truthful HSK 7–9 band", () => {
  const snapshot = buildGrowthSnapshot({
    now: new Date("2026-09-05T12:00:00.000Z"),
    timezone: "UTC",
    activity: [],
    attempts: [
      { contentId: "word:l1-a", reviewSnapshot: { level: 1 } },
      { contentId: "word:l1-a", reviewSnapshot: { level: 1 } },
      { contentId: "word:l2-a", reviewSnapshot: { level: 2 } },
      { contentId: "word:l8-a", reviewSnapshot: { level: 8 } },
      { contentId: "practice:not-a-word", reviewSnapshot: { level: 1 } },
    ],
    levelTotals,
  });
  assert.equal(snapshot.levelProgress.find((row) => row.level === 1)?.learned, 1);
  assert.equal(snapshot.levelProgress.find((row) => row.level === 2)?.learned, 1);
  assert.equal(snapshot.levelProgress.find((row) => row.level === 7)?.learned, 1);
  assert.equal(snapshot.levelProgress.length, 7);
  assert.equal(snapshot.totalTrackedWords, 3);
});

test("empty state remains genuinely empty instead of inventing activity", () => {
  const snapshot = buildGrowthSnapshot({
    now: new Date("2026-09-05T12:00:00.000Z"),
    timezone: "UTC",
    activity: [],
    attempts: [],
    levelTotals,
  });
  assert.equal(snapshot.hasActivity, false);
  assert.equal(snapshot.hasCalendarActivity, false);
  assert.equal(snapshot.hasLevelProgress, false);
  assert.ok(snapshot.curve30.every((day) => day.count === 0));
  assert.ok(snapshot.calendar.days.every((day) => !day.active));
  assert.ok(snapshot.levelProgress.every((row) => row.learned === 0));
});

test("calendar explains saved work and the accuracy trend excludes synthetic dictionary cards", () => {
  const snapshot = buildGrowthSnapshot({
    now: new Date("2026-10-06T12:00:00.000Z"),
    timezone: "Europe/London",
    activity: [
      { action: "attempt", createdAt: "2026-10-05T23:30:00.000Z" },
      { action: "grade", createdAt: "2026-10-06T08:00:00.000Z" },
      { action: "complete_item", createdAt: "2026-10-06T08:05:00.000Z" },
    ],
    attempts: [
      { contentId: "word:travel", observedAt: "2026-10-05T23:30:00.000Z", correct: true },
      { contentId: "practice:1", observedAt: "2026-10-06T08:10:00.000Z", correct: false },
      { contentId: "word:manual", idempotencyKey: "dictionary-review:manual:v1", observedAt: "2026-10-06T08:11:00.000Z", correct: true },
    ],
    sessions: [{ id: "today-1", localDay: "2026-10-06", items: [
      { id: "learn-1", kind: "learn", status: "completed", title: "Learn 旅行" },
      { id: "listen-1", kind: "listen", status: "completed" },
    ] }],
    cards: [
      { dueAt: "2026-10-01T00:00:00.000Z" },
      { dueAt: "2026-10-07T12:00:00.000Z" },
      { dueAt: "2026-10-20T12:00:00.000Z" },
    ],
    levelTotals,
  });
  const today = snapshot.calendar.days.find((day) => day.date === "2026-10-06");
  assert.equal(today?.count, 3);
  assert.deepEqual(today?.activity, { practice: 1, review: 1, todaySteps: 1 });
  assert.deepEqual(today?.completedSteps, { review: 0, learn: 1, listen: 1, practice: 0 });
  assert.deepEqual(today?.learnedTitles, ["Learn 旅行"]);
  assert.deepEqual(today?.answers, { correct: 1, total: 2 });
  assert.deepEqual(snapshot.reviewForecast.map((day) => day.count).slice(0, 2), [1, 1]);
  assert.equal(snapshot.reviewForecast.reduce((sum, day) => sum + day.count, 0), 2);
});
