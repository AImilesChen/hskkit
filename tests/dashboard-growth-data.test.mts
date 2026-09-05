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
