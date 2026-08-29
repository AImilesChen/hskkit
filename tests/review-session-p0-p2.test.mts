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
    "Why this is here", "Choose an answer", "Check answer", "Your current answer",
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
