import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";
import audioManifest from "../src/lib/learning/listening-library-audio.json" with { type: "json" };

import {
  LISTENING_LIBRARY_COUNTS,
  listeningQuestionBySlug,
  listeningQuestionsForLevel,
  listeningSession,
  listeningSessionNext,
} from "../src/lib/learning/listening-library.ts";

const root = new URL("..", import.meta.url);
const expectedAudio = [40, 40, 30, 30, 30, 30, 24, 24, 24];
const expectedQuestions = [40, 40, 60, 60, 60, 60, 72, 72, 72];

test("HSKKit listening library publishes the approved HSK 1–9 V1 scale", () => {
  assert.equal(LISTENING_LIBRARY_COUNTS.audioGroups, 272);
  assert.equal(LISTENING_LIBRARY_COUNTS.questions, 536);
  assert.deepEqual(LISTENING_LIBRARY_COUNTS.byLevel.map((row) => row.audioGroups), expectedAudio);
  assert.deepEqual(LISTENING_LIBRARY_COUNTS.byLevel.map((row) => row.questions), expectedQuestions);
  for (let level = 1; level <= 9; level += 1) {
    const questions = listeningQuestionsForLevel(level);
    assert.equal(questions.length, expectedQuestions[level - 1], `HSK ${level}`);
    assert.ok(questions.every((question) => question.level === level));
    assert.ok(questions.every((question) => question.levelBand === (level >= 7 ? "7-9" : String(level))));
  }
});

test("every scored question has stable truth, approved audio, source and publication metadata", () => {
  const all = Array.from({ length: 9 }, (_, index) => listeningQuestionsForLevel(index + 1)).flat();
  assert.equal(new Set(all.map((question) => question.id)).size, 536);
  assert.equal(new Set(all.map((question) => question.slug)).size, 536);
  for (const question of all) {
    assert.match(question.id, /^listening-library-v1-hsk[1-9]-/);
    assert.match(question.contentVersion, /^hskkit-listening-library-v1:/);
    assert.match(question.audioSrc, /^\/audio\/listening-library\/hsk[1-9]-\d{3}\.mp3$/);
    assert.equal(question.authorizationStatus, "authorized");
    assert.equal(question.qaStatus, "approved");
    assert.equal(question.lifecycleStatus, "published");
    assert.equal(question.sourceRef.length > 10, true);
    assert.equal(question.voiceText.length > 0, true);
    assert.equal(Object.hasOwn(question.exercise.options ?? {}, question.exercise.correctAnswer), true);
    assert.deepEqual(listeningQuestionBySlug(question.slug), question);
  }
});

test("all 272 formal audio files pass checksum, duration, authorization and technical QA", () => {
  assert.equal(audioManifest.assets.length, 272);
  assert.equal(new Set(audioManifest.assets.map((asset) => asset.id)).size, 272);
  for (const asset of audioManifest.assets) {
    const path = new URL(`../public/${asset.storageKey}`, import.meta.url);
    assert.equal(existsSync(path), true, asset.storageKey);
    assert.ok(statSync(path).size > 1_000, asset.storageKey);
    assert.ok(asset.durationSeconds >= 0.5, asset.storageKey);
    assert.equal(asset.authorization.status, "authorized");
    assert.equal(asset.contentQaStatus, "approved");
    assert.equal(asset.technicalQaStatus, "approved");
    assert.equal(asset.lifecycleStatus, "published");
    assert.equal(createHash("sha256").update(readFileSync(path)).digest("hex"), asset.checksumSha256);
  }
});

test("10/20-question sessions stay inside the selected HSK level and expose results only at the end", () => {
  for (const size of [10, 20] as const) {
    const session = listeningSession(8, size, "qa-seed");
    assert.equal(session.questions.length, size);
    assert.ok(session.questions.every((question) => question.level === 8));
    for (let index = 0; index < size; index += 1) {
      const next = listeningSessionNext(session, index);
      assert.equal(next?.level, index === size - 1 ? undefined : 8);
    }
  }
});

test("HSK 1 truth and labels use mǎi and single-syllable tone recognition", () => {
  const first = listeningQuestionsForLevel(1)[0];
  assert.equal(first.voiceText, "买");
  assert.match(first.explanation, /mǎi/);
  assert.doesNotMatch(first.title.toLowerCase(), /tone pairs/);
});

test("listening UI uses the shared synthesized-audio state control and states the HSKKit coverage boundary", () => {
  const player = readFileSync(new URL("src/app/components/step7-exercise.tsx", root), "utf8");
  const page = readFileSync(new URL("src/app/listen/page.tsx", root), "utf8");
  assert.match(player, /AudioPlaybackControl/);
  assert.match(player, /beforePlay=\{authorizePlayback\}/);
  assert.doesNotMatch(player, /speechSynthesis/);
  assert.match(page, /HSKKit levelled listening practice library/);
  assert.match(page, /10 questions/);
  assert.match(page, /20 questions/);
  assert.match(page, /not an official exam question bank/i);
});
