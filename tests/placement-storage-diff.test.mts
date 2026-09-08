import test from "node:test";
import assert from "node:assert/strict";
import { diffPlacementAnswers } from "../src/lib/placement/storage-diff.ts";

const answer = (questionId: string, value: string, key = `key-${questionId}`) => ({
  questionId,
  answer: value,
  idempotencyKey: key,
  answeredAt: "2026-09-08T00:00:00.000Z",
});

test("adding one answer leaves prior answers untouched", () => {
  const q1 = answer("q1", "A");
  const q2 = answer("q2", "B");
  const delta = diffPlacementAnswers([q1], [q1, q2]);
  assert.deepEqual(delta.removedQuestionIds, []);
  assert.deepEqual(delta.changedAnswers, [q2]);
});

test("re-answering updates only that question", () => {
  const q1 = answer("q1", "A");
  const q2 = answer("q2", "B");
  const revised = answer("q1", "C", "key-q1-revised");
  const delta = diffPlacementAnswers([q1, q2], [revised, q2]);
  assert.deepEqual(delta.removedQuestionIds, []);
  assert.deepEqual(delta.changedAnswers, [revised]);
});

test("removing an answer emits only its question id", () => {
  const q1 = answer("q1", "A");
  const q2 = answer("q2", "B");
  const delta = diffPlacementAnswers([q1, q2], [q2]);
  assert.deepEqual(delta.removedQuestionIds, ["q1"]);
  assert.deepEqual(delta.changedAnswers, []);
});
