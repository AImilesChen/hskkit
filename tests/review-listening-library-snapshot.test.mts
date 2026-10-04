import assert from "node:assert/strict";
import test from "node:test";
import { LISTENING_LIBRARY_QUESTIONS } from "../src/lib/learning/listening-library.ts";
import { reviewSnapshotFromStep7Exercise } from "../src/lib/learning/review-content.ts";
import { resolvedReviewSnapshotForAttempt } from "../src/lib/learning/review-content-resolver.ts";
import type { Attempt } from "../src/lib/learning/domain.ts";

const question = LISTENING_LIBRARY_QUESTIONS.find((item) => item.level === 1 && item.audioSrc);
assert.ok(question, "a published HSK 1 listening library question is needed");

function wrongAttempt(): Attempt {
  const wrong = Object.keys(question!.exercise.options!).find((key) => key !== question!.exercise.correctAnswer);
  assert.ok(wrong);
  return {
    id: "test-attempt", idempotencyKey: "test-attempt", contentId: question!.exercise.contentId,
    contentVersion: question!.exercise.contentVersion, dimension: "audio", answer: wrong,
    correctAnswer: question!.exercise.correctAnswer, correct: false,
    observedAt: "2026-10-04T00:00:00.000Z", prompt: question!.exercise.prompt,
  };
}

test("a newly submitted listening-library mistake saves its original question and recording", () => {
  const snapshot = reviewSnapshotFromStep7Exercise(question!.exercise);
  assert.equal(snapshot?.answerMode, "choice");
  assert.equal(snapshot?.level, question!.level);
  assert.deepEqual(snapshot?.options, question!.exercise.options);
  assert.equal(snapshot?.audioSrc, question!.audioSrc);
  assert.equal(snapshot?.audioText, question!.voiceText);
});

test("an already-saved same-version listening-library mistake without a snapshot recovers the original recording", () => {
  const snapshot = resolvedReviewSnapshotForAttempt(wrongAttempt());
  assert.equal(snapshot?.answerMode, "choice");
  assert.equal(snapshot?.audioSrc, question!.audioSrc);
  assert.equal(snapshot?.correctAnswer, question!.exercise.correctAnswer);
  assert.equal(snapshot?.level, question!.level);
});

test("a different-version listening-library mistake never receives a possibly wrong recording", () => {
  assert.equal(resolvedReviewSnapshotForAttempt({ ...wrongAttempt(), contentVersion: "unknown-version" }), undefined);
});
