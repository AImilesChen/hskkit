import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");

test("review queue prioritizes mistakes, preserves mixed skills, and respects a session cap", async () => {
  const { buildReviewQueue } = await import("../src/lib/learning/review-session.ts");
  const cards = [
    { id: "reading-due", isMistake: false, dimension: "reading", dueAt: "2026-01-01T00:00:00.000Z" },
    { id: "audio-mistake", isMistake: true, dimension: "audio", dueAt: "2026-01-03T00:00:00.000Z" },
    { id: "context-due", isMistake: false, dimension: "context_audio", dueAt: "2026-01-02T00:00:00.000Z" },
  ];
  assert.deepEqual(buildReviewQueue(cards, 2).map((card: { id: string }) => card.id), ["audio-mistake", "reading-due"]);
  assert.deepEqual(buildReviewQueue(cards, 20).map((card: { id: string }) => card.id), ["audio-mistake", "reading-due", "context-due"]);
});

test("rating copy explains memory outcome and interval without unexplained SRS jargon", async () => {
  const { reviewGradeOptions } = await import("../src/lib/learning/review-session.ts");
  assert.deepEqual(reviewGradeOptions(2.5, 1).map((option: { label: string; hint: string }) => [option.label, option.hint]), [
    ["Forgot", "Review again in 10 min"],
    ["Difficult", "Review tomorrow"],
    ["Remembered", "Review in 3 days"],
    ["Easy", "Review in 4 days"],
  ]);
});

test("review API exposes practice context for real mistake retry and transparent review reasons", async () => {
  const route = await source("src/app/api/v1/learning/route.ts");
  for (const token of ["isMistake", "choices", "level", "skill", "reviewReason", "priorAnswerLabel"]) assert.match(route, new RegExp(token));
  assert.match(route, /Answer from your earlier practice/);
});

test("review is a single-card session with setup, progress, retry, summary, and undo", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  const surface = client + await source("src/lib/learning/review-session.ts") + await source("src/app/api/v1/learning/route.ts");
  for (const token of [
    "Review setup", "[5, 10, 20]", "Start review", "Review progress",
    "Why this is here", "Choose an answer", "Check answer", "Your answer this time",
    "Answer from your earlier practice", "Forgot", "Difficult", "Remembered", "Easy",
    "Undo last rating", "Session complete", "Back to Today", "Continue practice",
  ]) assert.match(surface, new RegExp(token));
  assert.match(client, /activeCard/);
  assert.doesNotMatch(client, /due\.map\(\(card\)/);
  assert.doesNotMatch(client, />again<|>hard<|>good<|>easy</);
});

test("review layout stays task-first, responsive, and avoids dashboard-card sprawl", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  assert.match(client, /max-w-\[880px\]/);
  assert.match(client, /min-h-\[48px\]/);
  assert.match(client, /aria-live="polite"/);
  assert.match(client, /focus-visible:ring/);
  assert.match(client, /sm:grid-cols-4/);
});

test("Today presents one truthful review entry with due count, time, level, and skill mix", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  for (const token of ["dueForToday", "estimated review", "HSK mix", "Skill mix", "firstReviewIndex", "orderedTodayItems"]) {
    assert.match(client, new RegExp(token));
  }
  assert.match(client, /if \(item\.kind === "review" && index !== firstReviewIndex\) return null/);
});

test("revealed catalog review content uses published vocabulary details and only formal audio URLs", async () => {
  const route = await source("src/app/api/v1/learning/route.ts");
  const audio = await source("src/lib/learning/audio.ts");
  const client = await source("src/app/components/learning-dashboard.tsx");
  for (const token of ["pinyin", "meaning", "example", "formalAudioSrc"]) assert.match(route, new RegExp(token));
  for (const token of ["Pinyin", "Meaning", "Example", "Example translation", "Formal recording"]) assert.match(client, new RegExp(token));
  assert.match(route, /audio\?\.word\.audio\.status === "formal"/);
  assert.match(audio, /formalWordAudioUrlByContentId\.get\(item\.assetId\)/);
  assert.match(client, /<audio[^>]+controls[^>]+src=\{activeCard\.formalAudioSrc\}/);
});

test("Today starts its due queue directly while Mistakes targets the selected mistake", async () => {
  const { reviewEntryIntent, buildIntentReviewQueue } = await import("../src/lib/learning/review-session.ts");
  const cards = [
    { id: "due-1", contentId: "word:one", isMistake: false, dimension: "reading", dueAt: "2026-01-01T00:00:00.000Z" },
    { id: "mistake-1", contentId: "question:target", isMistake: true, dimension: "reading", dueAt: "2026-01-02T00:00:00.000Z" },
    { id: "mistake-2", contentId: "question:other", isMistake: true, dimension: "audio", dueAt: "2026-01-03T00:00:00.000Z" },
  ];
  assert.deepEqual(reviewEntryIntent("?source=today"), { kind: "today" });
  assert.deepEqual(reviewEntryIntent("?source=mistakes&contentId=question%3Atarget"), { kind: "mistake", contentId: "question:target" });
  assert.equal(reviewEntryIntent("").kind, "setup");
  assert.deepEqual(buildIntentReviewQueue(cards, { kind: "today" }, 10).map((card: { id: string }) => card.id), ["mistake-1", "mistake-2", "due-1"]);
  assert.deepEqual(buildIntentReviewQueue(cards, { kind: "mistake", contentId: "question:target" }, 10).map((card: { id: string }) => card.id), ["mistake-1"]);
});

test("review entry links preserve Today and selected-mistake context", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  assert.match(client, /href="\/review\?source=today"/);
  assert.match(client, /`\/review\?source=mistakes&contentId=\$\{encodeURIComponent\(mistake\.contentId\)\}`/);
  assert.match(client, /href: "\/review"/);
});

test("mistake retry and self-recall use distinct truthful interactions", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  const route = await source("src/app/api/v1/learning/route.ts");
  for (const token of ["Mistake retry", "Memory review", "Your answer this time", "Think of the answer before revealing it", "Earlier attempt", "Why the answer fits"]) {
    assert.match(client, new RegExp(token));
  }
  assert.doesNotMatch(route, /say the answer once before continuing/);
  assert.doesNotMatch(client, /Your current answer/);
});

test("loading and sync-error states keep the full learning workspace and footer below it", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  for (const token of ["LearningStatePage", "Preparing your review", "Loading due items and restoring progress", "min-h-\\[70vh\\]", "aria-busy"]) {
    assert.match(client, new RegExp(token));
  }
  assert.doesNotMatch(client, /if \(!data\) return <State/);
  assert.doesNotMatch(client, /if \(error\) return <State/);
});
