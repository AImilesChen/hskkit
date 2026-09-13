import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { publishedAudioDurationBySrc } from "../src/lib/audio/assets.ts";
import { legacyListeningReviewPresentation } from "../src/lib/learning/review-content.ts";
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

test("recoverable legacy listening becomes an explicit vocabulary recall without revealing the answer", () => {
  const presentation = legacyListeningReviewPresentation({
    dimension: "audio",
    audioSrc: "/audio/word.mp3",
    vocabulary: {
      level: 2,
      hanzi: "旅游",
      pinyin: "lǚyóu",
      meaning: "to travel",
      example: { hanzi: "我喜欢旅游。", pinyin: "Wǒ xǐhuan lǚyóu.", meaning: "I like travelling." },
    },
  });
  assert.deepEqual(presentation, {
    reviewMode: "vocabulary_recall",
    reviewable: true,
    prompt: "Listen and recall the word and its meaning.",
    instruction: "Play the recording, recall the word and meaning, then reveal them to check your memory.",
    correctAnswer: "旅游 — to travel",
    level: 2,
    skill: "Listening · vocabulary recall",
  });
});

test("an unrecoverable legacy item is not eligible for a real review", () => {
  assert.deepEqual(legacyListeningReviewPresentation({ dimension: "audio" }), {
    reviewMode: "unsupported_legacy",
    reviewable: false,
  });
  assert.deepEqual(legacyListeningReviewPresentation({
    dimension: "reading",
    audioSrc: "/audio/word.mp3",
    vocabulary: { level: 2, hanzi: "旅游", pinyin: "lǚyóu", meaning: "to travel" },
  }), {
    reviewMode: "unsupported_legacy",
    reviewable: false,
  });
});

test("listening review keeps the question visible but withholds answer controls and answer hints until playback", async () => {
  const route = await source("src/app/api/v1/learning/route.ts");
  const client = await source("src/app/components/learning-dashboard.tsx");
  assert.match(route, /reviewMode: questionSnapshot \? "question_review" : legacyPresentation\.reviewMode/);
  assert.match(route, /\.filter\(\(card\) => card\.reviewable\)/);
  assert.match(client, /\{activeCard\.prompt\}<\/h2>/);
  assert.match(client, /activeCard\.playbackReady \? <div className="mt-7">/);
  assert.match(client, /activeCard\.reviewMode === "vocabulary_recall" \? "Reveal word and meaning" : "Reveal answer"/);
  assert.match(client, /revealed\[activeCard\.id\].*activeCard\.topic/s);
});

test("review audio uses trusted duration, verifies after the playback window, and locks answers", async () => {
  assert.equal(publishedAudioDurationBySrc("/audio/listening-library/v2/hsk1-001.mp3"), 1.104);
  const route = await source("src/app/api/v1/learning/route.ts");
  const client = await source("src/app/components/learning-dashboard.tsx");
  const verifier = await source("src/lib/learning/verified-playback.ts");
  assert.match(route, /publishedAudioDurationBySrc\(card\.audioSrc\)/);
  assert.match(route, /createStep7PlaybackTicket\(identity\.id, exerciseKey, card\.audioText, new Date\(\), trustedDuration\)/);
  assert.match(verifier, /waitForPlaybackWindow\(ticket\.notBefore/);
  assert.match(client, /<AudioPlaybackControl asset=/);
  assert.match(client, /beforePlay=\{\(\) => startFormalPlayback\(activeCard\)\}/);
  assert.match(client, /canAnswerReview && !answerChecked \? activeCard\.playbackReady \? <div/);
  assert.doesNotMatch(client, /<audio controls preload="metadata" src=\{activeCard\.audioSrc\}/);
});
