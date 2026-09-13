import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { publishedAudioDurationBySrc } from "../src/lib/audio/assets.ts";
import * as reviewContent from "../src/lib/learning/review-content.ts";
import { reviewAnswerIsCorrect } from "../src/lib/learning/review-session.ts";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");

test("a complete saved review question can be answered before memory rating", () => {
  assert.equal(reviewAnswerIsCorrect({ answerMode: "choice", correctAnswerKey: "B", correctAnswer: "正确答案" }, "B"), true);
  assert.equal(reviewAnswerIsCorrect({ answerMode: "choice", correctAnswerKey: "B", correctAnswer: "正确答案" }, "A"), false);
  assert.equal(reviewAnswerIsCorrect({ answerMode: "text", correctAnswerKey: "北京", correctAnswer: "北京" }, " 北 京。"), true);
  assert.equal(reviewAnswerIsCorrect({ answerMode: "self_recall", correctAnswerKey: "", correctAnswer: "北京" }, "北京"), false);
});

test("Today listening review keeps complete questions hidden-answer and playback-gated", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  assert.match(client, /const todayListeningReview = entryIntent\.kind === "today" && activeCard\?\.dimension !== "reading"/);
  assert.match(client, /todayListeningReview && !activeCard\.playbackReady/);
  assert.match(client, /Listen to the full recording to open the answer step\./);
  assert.match(client, /reviewAnswerIsCorrect\(card, answer\)/);
  assert.match(client, /How well did you remember it after answering\?/);
});

test("non-Today and Reading review behavior stay on the existing path", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  assert.match(client, /const useTodayListeningFlow = Boolean\(todayListeningReview/);
  assert.match(client, /const canAnswerReview = Boolean\(activeCard && !activeCard\.legacyReview && activeCard\.answerMode !== "self_recall"\)/);
  assert.match(client, /!useTodayListeningFlow/);
});

test("review audio uses trusted duration, verifies after the playback window, and locks answers", async () => {
  assert.equal(publishedAudioDurationBySrc("/audio/listening-library/v2/hsk1-001.mp3"), 1.104);
  const route = await source("src/app/api/v1/learning/route.ts");
  const client = await source("src/app/components/learning-dashboard.tsx");
  const verifier = await source("src/lib/learning/verified-playback.ts");
  assert.match(route, /publishedAudioDurationBySrc\(audioSrc\)/);
  assert.match(route, /createStep7PlaybackTicket\(identity\.id, exerciseKey, audioText, new Date\(\), trustedDuration\)/);
  assert.match(verifier, /waitForPlaybackWindow\(ticket\.notBefore/);
  assert.match(client, /<AudioPlaybackControl asset=/);
  assert.match(client, /beforePlay=\{\(\) => startFormalPlayback\(activeCard\)\}/);
  assert.match(client, /<fieldset disabled=\{activeCard\.playbackRequired && !activeCard\.playbackReady\}>/);
  assert.doesNotMatch(client, /<audio controls preload="metadata" src=\{activeCard\.audioSrc\}/);
});

test("legacy listening recall requires a real word and formal audio", () => {
  const presentation = (reviewContent as Record<string, unknown>).legacyListeningReviewPresentation;
  assert.equal(typeof presentation, "function");
  const classify = presentation as (word: unknown, audioSrc?: string, audioText?: string) => unknown;
  const word = {
    assetId: "hsk3.word.l3.0002.v1",
    hanzi: "安排",
    pinyin: "ānpái",
    meaning: "to arrange",
    example: { hanzi: "我来安排。", pinyin: "Wǒ lái ānpái.", meaning: "I will arrange it." },
  };
  assert.deepEqual(classify(word, "/audio/formal/arrange.mp3", "安排"), {
    reviewMode: "vocabulary_recall",
    reviewable: true,
    prompt: "Listen and recall the word and its meaning.",
    instruction: "播放音频，在脑中回忆这个词及其意思。",
  });
  assert.deepEqual(classify(word, undefined, "安排"), {
    reviewMode: "unsupported_legacy",
    reviewable: false,
  });
});

test("unsupported listening cards are skipped only from their Today entry", async () => {
  const route = await source("src/app/api/v1/learning/route.ts");
  const client = await source("src/app/components/learning-dashboard.tsx");
  assert.match(route, /const todayReviewable = card\.dimension === "reading" \|\|/);
  assert.match(route, /const todayReviewMode = card\.dimension === "reading"/);
  assert.doesNotMatch(route, /const reviewableCards = cards\.filter/);
  assert.match(route, /state: built\.state,/);
  assert.match(route, /cards,/);
  assert.match(route, /dueCount: built\.state\.cards\.filter/);
  assert.doesNotMatch(route, /reviewCardIds: built\.session\.reviewCardIds\?\.filter/);
  assert.match(client, /todayListeningReview\?\.todayReviewMode === "unsupported_legacy"/);
  assert.match(client, /skipUnsupportedTodayReview/);
  assert.match(client, /post\("skip_item"/);
});

test("Today vocabulary recall reveals answer details only after playback", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  assert.match(client, /useTodayVocabularyRecall/);
  assert.match(client, /Reveal word and meaning/);
  assert.match(client, /const useTodayQuestionReview = Boolean\(todayListeningReview && todayListeningReview\.todayReviewMode === "question_review"\)/);
  assert.match(client, /!useTodayQuestionReview && !revealed\[activeCard\.id\] && !answerChecked/);
  assert.match(client, /disabled=\{!activeCard\.playbackReady\}/);
  assert.match(client, /activeCard\.hanzi/);
  assert.match(client, /How well did you remember it after revealing the word\?/);
});

test("trusted practice listening restoration retains the transcript for verified playback", async () => {
  const resolver = await source("src/lib/learning/review-content-resolver.ts");
  assert.match(resolver, /audioText: question\.audioText/);
});
