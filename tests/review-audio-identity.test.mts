import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { trustedAudioExercise, trustedTodayAudioExercise } from "../src/lib/learning/audio.ts";
import { selectTodayContent } from "../src/lib/learning/today-content.ts";
import { resolvedReviewSnapshotForAttempt, trustedReviewAudioExerciseForAttempt } from "../src/lib/learning/review-content-resolver.ts";
import type { Attempt } from "../src/lib/learning/domain.ts";

function attemptForLevel(level: number): Attempt {
  const item = selectTodayContent(level);
  if (item.status !== "ready") throw new Error(`Missing Today word at level ${level}`);
  const exercise = trustedTodayAudioExercise(item.item.assetId, "audio");
  assert.ok(exercise);
  return {
    id: `audio-attempt-${level}`, idempotencyKey: `audio-attempt-${level}`,
    contentId: exercise.contentId, contentVersion: exercise.contentVersion,
    dimension: "audio", answer: "A", correctAnswer: exercise.correctAnswer, correct: false,
    observedAt: "2026-10-04T00:00:00.000Z",
    reviewSnapshot: {
      level, levelBand: String(level), skillLabel: "Listening · word",
      prompt: exercise.prompt, answerMode: "choice", options: { ...exercise.options },
      correctAnswer: exercise.correctAnswer, correctAnswerText: exercise.options[exercise.correctAnswer],
      explanation: "Old stored snapshot", audioSrc: "/audio/formal/word-mai-v1.mp3", audioText: "买",
    },
  };
}

test("different word cards bind distinct recordings even when their saved snapshots share one clip", () => {
  const first = attemptForLevel(1);
  const second = attemptForLevel(2);
  const firstSnapshot = resolvedReviewSnapshotForAttempt(first);
  const secondSnapshot = resolvedReviewSnapshotForAttempt(second);
  assert.equal(firstSnapshot?.audioSrc, trustedReviewAudioExerciseForAttempt(first)?.word.audio.src);
  assert.equal(secondSnapshot?.audioSrc, trustedReviewAudioExerciseForAttempt(second)?.word.audio.src);
  assert.notEqual(firstSnapshot?.audioSrc, secondSnapshot?.audioSrc);
  assert.equal(secondSnapshot?.audioText, "旅行");
});

test("a version mismatch never falls back to a current recording or a saved snapshot", () => {
  const attempt = { ...attemptForLevel(2), contentVersion: "unknown-version" };
  assert.equal(trustedReviewAudioExerciseForAttempt(attempt), undefined);
  assert.equal(resolvedReviewSnapshotForAttempt(attempt), undefined);
});

test("a catalog word that also appears in Today resolves its original catalog version", () => {
  const today = attemptForLevel(2);
  const item = selectTodayContent(2);
  if (item.status !== "ready") throw new Error("Missing Today word at level 2");
  const assetId = item.item.assetId;
  const catalogExercise = trustedAudioExercise(assetId, "audio");
  assert.ok(catalogExercise);
  const catalogAttempt = { ...today, contentId: catalogExercise.contentId, contentVersion: catalogExercise.contentVersion };
  assert.equal(trustedReviewAudioExerciseForAttempt(catalogAttempt)?.contentVersion, catalogExercise.contentVersion);
  assert.equal(resolvedReviewSnapshotForAttempt(catalogAttempt)?.audioSrc, catalogExercise.word.audio.src);
});

test("a valid saved choice order stays intact while its recording is repaired", () => {
  const attempt = attemptForLevel(2);
  const exercise = trustedReviewAudioExerciseForAttempt(attempt)!;
  const originalOptions = { ...exercise.options, A: exercise.options[exercise.correctAnswer], [exercise.correctAnswer]: exercise.options.A };
  const original = { ...attempt.reviewSnapshot!, options: originalOptions, correctAnswer: "A", correctAnswerText: originalOptions.A };
  const recovered = resolvedReviewSnapshotForAttempt({ ...attempt, reviewSnapshot: original });
  assert.deepEqual(recovered?.options, originalOptions);
  assert.equal(recovered?.correctAnswer, "A");
  assert.equal(recovered?.audioSrc, exercise.word.audio.src);
});

test("review API only exposes audio from the verified snapshot", async () => {
  const route = await readFile(new URL("../src/app/api/v1/learning/route.ts", import.meta.url), "utf8");
  assert.match(route, /const formalAudioSrc = snapshot\?\.audioSrc;/);
  assert.match(route, /const formalAudioText = snapshot\?\.audioText;/);
});
