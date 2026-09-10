import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { publishedAudioDurationBySrc } from "../src/lib/audio/assets.ts";
import { reviewAnswerIsCorrect } from "../src/lib/learning/review-session.ts";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");

test("a complete saved review question can be answered before memory rating", () => {
  assert.equal(reviewAnswerIsCorrect({ answerMode: "choice", correctAnswerKey: "B", correctAnswer: "正确答案" }, "B"), true);
  assert.equal(reviewAnswerIsCorrect({ answerMode: "choice", correctAnswerKey: "B", correctAnswer: "正确答案" }, "A"), false);
  assert.equal(reviewAnswerIsCorrect({ answerMode: "text", correctAnswerKey: "北京", correctAnswer: "北京" }, " 北 京。"), true);
  assert.equal(reviewAnswerIsCorrect({ answerMode: "self_recall", correctAnswerKey: "", correctAnswer: "北京" }, "北京"), false);
});

test("review UI answers every complete card and reserves reveal-only for incomplete legacy cards", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  assert.match(client, /const canAnswerReview = Boolean\(activeCard && !activeCard\.legacyReview && activeCard\.answerMode !== "self_recall"\)/);
  assert.match(client, /canAnswerReview && !answerChecked/);
  assert.match(client, /reviewAnswerIsCorrect\(card, answer\)/);
  assert.match(client, /How well did you remember it after answering\?/);
  assert.match(client, /activeCard\.legacyReview.*Reveal answer/s);
});

test("review audio uses trusted asset duration and completes immediately from the ended event", async () => {
  assert.equal(publishedAudioDurationBySrc("/audio/listening-library/v2/hsk1-001.mp3"), 1.104);
  const route = await source("src/app/api/v1/learning/route.ts");
  const client = await source("src/app/components/learning-dashboard.tsx");
  assert.match(route, /publishedAudioDurationBySrc\(card\.audioSrc\)/);
  assert.match(route, /createStep7PlaybackTicket\(identity\.id, exerciseKey, card\.audioText, new Date\(\), trustedDuration\)/);
  assert.doesNotMatch(client, /if \(remaining\) await new Promise/);
  assert.match(client, /onEnded=\{\(\) => void completeFormalPlayback\(activeCard\)\}/);
  assert.match(client, /Replay the full recording/);
});
