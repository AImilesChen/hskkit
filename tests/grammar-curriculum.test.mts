import assert from "node:assert/strict";
import test from "node:test";
import { GRAMMAR_CURRICULUM, GRAMMAR_LESSONS, grammarLessonBySlug, trustedStep7Exercise } from "../src/lib/learning/step7-content.ts";
import { grammarProgressSnapshot } from "../src/lib/learning/grammar-progress.ts";
import { reviewSnapshotFromStep7Exercise } from "../src/lib/learning/review-content.ts";

test("grammar curriculum covers seven bands with distinct, trusted questions", () => {
  assert.equal(GRAMMAR_CURRICULUM.length, 21);
  assert.deepEqual([...new Set(GRAMMAR_CURRICULUM.map((item) => item.levelBand))], ["1", "2", "3", "4", "5", "6", "7-9"]);
  assert.deepEqual(GRAMMAR_CURRICULUM.slice(0, 3).map((item) => item.slug), ["basic-shi-negation", "you-meiyou-possession", "ma-yes-no-questions"]);
  assert.deepEqual(GRAMMAR_CURRICULUM.map((item) => item.levelBand).reduce((counts, band) => ({ ...counts, [band]: (counts[band] ?? 0) + 1 }), {} as Record<string, number>), { "1": 3, "2": 3, "3": 3, "4": 3, "5": 3, "6": 3, "7-9": 3 });
  const ids = new Set<string>();
  const contentKeys = new Set<string>();
  for (const lesson of GRAMMAR_CURRICULUM) {
    assert.equal(grammarLessonBySlug(lesson.slug), lesson);
    assert.equal(lesson.exercises.length, 2);
    assert.ok(lesson.usage && lesson.pitfall && lesson.examples.length >= 2);
    for (const exercise of lesson.exercises) {
      assert.equal(trustedStep7Exercise(exercise.id), exercise);
      const review = reviewSnapshotFromStep7Exercise(exercise);
      assert.equal(review?.skillLabel, "Grammar");
      assert.equal(review?.prompt, exercise.prompt);
      assert.equal(review?.levelBand, lesson.levelBand === "7-9" ? "7–9" : lesson.levelBand);
      assert.ok(exercise.options?.[exercise.correctAnswer]);
      assert.ok(exercise.explanation.length >= 30);
      assert.ok(!ids.has(exercise.id));
      const key = `${exercise.contentId}:${exercise.contentVersion}`;
      assert.ok(!contentKeys.has(key));
      ids.add(exercise.id);
      contentKeys.add(key);
    }
  }
  assert.equal(ids.size, 42);
  assert.equal(GRAMMAR_LESSONS.length, 7);
  assert.equal(GRAMMAR_LESSONS[0].exercise.id, "grammar-basic-shi-negation-v1");
});

test("grammar progress counts each saved question and flags weak points", () => {
  const unit = grammarLessonBySlug("you-meiyou-possession")!;
  const first = unit.exercises[0];
  const second = unit.exercises[1];
  const state = {
    attempts: [
      { contentId: first.contentId, contentVersion: first.contentVersion, correct: false },
      { contentId: first.contentId, contentVersion: first.contentVersion, correct: true },
      { contentId: second.contentId, contentVersion: second.contentVersion, correct: true },
    ],
    mistakes: [{ contentId: first.contentId, contentVersion: first.contentVersion, status: "open" }],
    cards: [{ contentId: first.contentId, contentVersion: first.contentVersion, dueAt: "2026-10-01T00:00:00Z" }],
  } as Parameters<typeof grammarProgressSnapshot>[0];
  assert.deepEqual(grammarProgressSnapshot(state, "2026-10-06T00:00:00Z")[unit.slug], { practiced: 2, total: 2, correct: 2, openMistakes: 1, due: 1 });
  assert.equal(grammarProgressSnapshot(state)["ma-yes-no-questions"].practiced, 0);
});
