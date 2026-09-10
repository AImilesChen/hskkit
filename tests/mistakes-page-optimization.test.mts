import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Mistakes exposes the approved two-tab task hierarchy without changing learning data rules", async () => {
  const dashboard = await source("src/app/components/learning-dashboard.tsx");
  for (const token of [
    "Retry your wrong answers. A mistake moves to Corrected after you answer it correctly.",
    "To correct",
    "Corrected",
    "mistakes to correct",
    "Retry them correctly to clear your mistake queue.",
    "Retry question",
    "These records stay available for review.",
  ]) assert.match(dashboard, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  assert.match(dashboard, /useState<"open" \| "corrected">\("open"\)/);
  assert.match(dashboard, /role="tablist"/);
  assert.match(dashboard, /aria-selected=\{mistakeTab === "open"\}/);
  assert.match(dashboard, /aria-selected=\{mistakeTab === "corrected"\}/);
  assert.match(dashboard, /grid-cols-2/);
  assert.match(dashboard, /switchMistakeTab/);
  assert.doesNotMatch(dashboard, /Wrong answer ·/);
  assert.doesNotMatch(dashboard, /Correct this mistake/);
  assert.doesNotMatch(dashboard, /Retry, check the answer, then continue/);
});

test("Mistakes keeps only the approved All, Reading and Listening filters with explicit selected state", async () => {
  const dashboard = await source("src/app/components/learning-dashboard.tsx");
  assert.match(dashboard, /type MistakeFilter = "all" \| "reading" \| "listening"/);
  assert.match(dashboard, /\["all", "reading", "listening"\]/);
  assert.match(dashboard, /aria-pressed=\{mistakeFilter === filter\}/);
  assert.match(dashboard, /overflow-x-auto/);
  assert.doesNotMatch(dashboard, /Filter by HSK level/);
  assert.doesNotMatch(dashboard, /Filter by error time/);
});

test("Corrected history is compact, time-grouped and rendered ten at a time", async () => {
  const dashboard = await source("src/app/components/learning-dashboard.tsx");
  for (const token of ["Today", "Yesterday", "Earlier", "Load more", "Loading…", "All corrected mistakes loaded"]) {
    assert.match(dashboard, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(dashboard, /useState\(10\)/);
  assert.match(dashboard, /slice\(0, correctedVisible\)/);
  assert.match(dashboard, /setCorrectedVisible\(\(count\) => count \+ 10\)/);
});

test("Mistakes has the approved empty, loading, failure and correction-return feedback", async () => {
  const dashboard = await source("src/app/components/learning-dashboard.tsx");
  for (const token of [
    "All caught up",
    "You have corrected every mistake in your queue.",
    "Keep practicing",
    "View corrected history",
    "No corrected mistakes yet",
    "Correct a mistake successfully and it will appear here.",
    "View mistakes to correct",
    "We couldn’t load your mistakes.",
    "Corrected — moved to your history.",
    "Next mistake",
  ]) assert.match(dashboard, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(dashboard, /mistakes-skeleton/);
  assert.match(dashboard, /disabled=\{retryingLoad\}/);
});

test("Mistakes mobile contract keeps tabs equal, page bounded and actions touch-safe", async () => {
  const dashboard = await source("src/app/components/learning-dashboard.tsx");
  assert.match(dashboard, /max-w-full overflow-x-hidden/);
  assert.match(dashboard, /min-h-\[44px\]/);
  assert.match(dashboard, /grid grid-cols-2/);
  assert.match(dashboard, /whitespace-nowrap/);
});
