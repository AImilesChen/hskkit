import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");

test("Placement start explains the learner task and folds technical release detail", async () => {
  const client = await source("src/app/placement/placement-client.tsx");
  assert.match(client, /12 questions/);
  assert.match(client, /Vocabulary, grammar, reading and listening/);
  assert.match(client, /Your answers are saved as you go/);
  assert.match(client, /<details/);
  assert.match(client, /How this placement works/);
  assert.doesNotMatch(client, /multiskill version 2/);
  assert.doesNotMatch(client, /version-locked session/);
});

test("Placement result keeps the recommendation and next action in one first-fold decision", async () => {
  const client = await source("src/app/placement/result/[id]/placement-result-client.tsx");
  assert.match(client, /Your strengths/);
  assert.match(client, /Focus areas/);
  assert.match(client, /Continue from this result/);
  assert.match(client, /max-w-4xl px-5 py-5 sm:py-14/);
  assert.match(client, /bg-blue-50 p-4 sm:mt-4 sm:p-9/);
  assert.match(client, /Start learning HSK \{result\.recommendedLevel\}/);
  assert.match(client, /mode=flashcards#vocabulary-activities/);
  assert.match(client, /Practice \{primaryWeakSkill\}/);
  assert.match(client, /<details/);
  assert.match(client, /More options/);
  assert.doesNotMatch(client, /Evidence used/);
  assert.doesNotMatch(client, /Your next step/);
});

test("Mock start uses learner-facing summaries while keeping release detail available", async () => {
  const client = await source("src/app/components/mock-exam.tsx");
  for (const token of ["18 questions", "30 minutes", "5 tasks", "20 minutes", "Autosaved", "How this Mock works", "<details"]) {
    assert.match(client, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(client, /className="btn btn-primary mt-7 min-h-11/);
  assert.doesNotMatch(client, /approved practice assessment/);
});

test("Mock result distinguishes correct, incorrect and unanswered work with filtered review", async () => {
  const client = await source("src/app/components/mock-exam.tsx");
  for (const token of ["correctCount", "incorrectCount", "unansweredCount", "Review mistakes", "Review unanswered", "All", "Incorrect", "Unanswered", "Correct", "reviewFilter", "id=\"mock-question-review\""]) {
    assert.match(client, new RegExp(token));
  }
  assert.match(client, /broad HSK 7–9 readiness estimate/);
  assert.match(client, /<details/);
  assert.doesNotMatch(client, />Open Mistakes</);
});

test("Traditional HSK 1–6 shared result gives review and retake actions before collapsed detail", async () => {
  const client = await source("src/app/components/practice-test.tsx");
  assert.match(client, /max-w-\[720px\] px-4 py-4 sm:px-8 sm:py-12/);
  assert.match(client, /bg-\[#EFF6FF\] p-4 sm:p-8/);
  assert.match(client, /Review \{wrongQuestions\.length\} mistakes/);
  assert.match(client, /id=\"practice-test-review\"/);
  assert.match(client, /Retake HSK \{level\} test/);
  assert.match(client, /Continue HSK \{level\} learning/);
  assert.match(client, /<details/);
  assert.doesNotMatch(client, /text-\[64px\]/);
  assert.doesNotMatch(client, /Next loop: review missed words/);
});
