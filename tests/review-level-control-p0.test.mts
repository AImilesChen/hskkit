import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

type Card = {
  id: string;
  contentId: string;
  isMistake: boolean;
  dimension: "reading" | "audio" | "context_audio";
  dueAt: string;
  level?: number;
};

const cards: Card[] = [
  { id: "l2", contentId: "l2", isMistake: false, dimension: "reading", dueAt: "2026-01-01T00:00:00.000Z", level: 2 },
  { id: "l3-mistake", contentId: "l3-mistake", isMistake: true, dimension: "audio", dueAt: "2026-01-02T00:00:00.000Z", level: 3 },
  { id: "l3-due", contentId: "l3-due", isMistake: false, dimension: "reading", dueAt: "2026-01-03T00:00:00.000Z", level: 3 },
  { id: "l7", contentId: "l7", isMistake: false, dimension: "context_audio", dueAt: "2026-01-04T00:00:00.000Z", level: 7 },
  { id: "legacy", contentId: "legacy", isMistake: false, dimension: "reading", dueAt: "2026-01-05T00:00:00.000Z" },
];

test("review level control defaults to current HSK level and keeps zero-count levels explicit", async () => {
  const { reviewLevelControl } = await import("../src/lib/learning/review-session.ts");
  const control = reviewLevelControl(cards, 3);

  assert.equal(control.currentLevel, 3);
  assert.deepEqual(control.currentCardIds, ["l3-mistake", "l3-due"]);
  assert.equal(control.allCount, 5);
  assert.deepEqual(control.levels.map((entry: { level: number; count: number }) => entry), [
    { level: 1, count: 0 },
    { level: 2, count: 1 },
    { level: 3, count: 2 },
    { level: 4, count: 0 },
    { level: 5, count: 0 },
    { level: 6, count: 0 },
    { level: 7, count: 1 },
    { level: 8, count: 0 },
    { level: 9, count: 0 },
  ]);
});

test("review level queues use server-produced IDs for current, all, and one exact level", async () => {
  const { reviewLevelControl, reviewCardIdsForScope } = await import("../src/lib/learning/review-session.ts");
  const control = reviewLevelControl(cards, 3);

  assert.deepEqual(reviewCardIdsForScope(control, "current"), ["l3-mistake", "l3-due"]);
  assert.deepEqual(reviewCardIdsForScope(control, "all"), ["l3-mistake", "l2", "l3-due", "l7", "legacy"]);
  assert.deepEqual(reviewCardIdsForScope(control, 7), ["l7"]);
  assert.deepEqual(reviewCardIdsForScope(control, 6), []);
});

test("ordinary Review exposes an explicit level selector and blocks zero-count starts", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  const route = await source("src/app/api/v1/learning/route.ts");
  const reviewService = await source("src/lib/learning/review-session.ts");

  for (const token of ["Choose review level", "Current level", "All levels", "label: `HSK ${level}`", "has no due reviews", "View all levels"]) {
    assert.ok(client.includes(token), `missing Review level control token: ${token}`);
  }
  assert.match(client, /reviewLevelControl/);
  assert.match(route, /reviewLevelControl/);
  assert.match(reviewService, /Array\.from\(\{ length: 9 \}/);
  assert.match(client, /reviewCardIdsForScope/);
  assert.match(client, /disabled=\{selectedReviewCount === 0\}/);
  assert.match(client, /window\.history\.pushState/);
  assert.match(client, /addEventListener\("popstate"/);
  assert.doesNotMatch(client, /Review one early/);
  assert.doesNotMatch(client, /queue is selected by default/);
  assert.match(client, /recommendedCount === 1 \? "" : "s"/);
  assert.match(client, /selectedReviewCount\)\} item\{Math\.min\(reviewMinutes, selectedReviewCount\) === 1 \? "" : "s"\}/);
});

test("review card header shows the actual advanced level rather than a broad 7–9 band", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  assert.match(client, /`HSK \$\{activeCard\.level\}`/);
  assert.doesNotMatch(client, /`HSK \$\{activeCard\.levelBand\}`/);
});
