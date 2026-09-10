import assert from "node:assert/strict";
import test from "node:test";

import {
  LISTENING_LIBRARY_COUNTS,
  LISTENING_LIBRARY_QUESTIONS,
  listeningQuestionsForLevel,
} from "../src/lib/learning/listening-library.ts";
import { auditPracticeQuestionBank } from "../src/lib/practice/quality-gate.ts";
import {
  PRACTICE_QUESTIONS,
  trustedPracticeQuestion,
} from "../src/lib/practice/questions.ts";

const retiredDuplicateId = "practice-v4-level-3-listening-listening-library-v2-hsk3-026-q1";

test("P1 publishes no known near-duplicate listening material while preserving retired history", () => {
  const audit = auditPracticeQuestionBank(PRACTICE_QUESTIONS);
  assert.deepEqual(audit.metrics, {
    exactDuplicateGroups: 0,
    nearDuplicatePairs: 0,
    templateDensityViolations: 0,
    levelSourceFailures: 0,
    sessionCompositionViolations: 0,
  });
  assert.equal(audit.blocked, false);
  assert.equal(PRACTICE_QUESTIONS.some((question) => question.id === retiredDuplicateId), false);
  assert.equal(trustedPracticeQuestion(retiredDuplicateId)?.lifecycleStatus, "withdrawn");
});

test("P1 reports honest published listening counts and every HSK level remains session-usable", () => {
  assert.equal(LISTENING_LIBRARY_COUNTS.questions, LISTENING_LIBRARY_QUESTIONS.length);
  assert.equal(
    LISTENING_LIBRARY_COUNTS.audioGroups,
    new Set(LISTENING_LIBRARY_QUESTIONS.map((question) => question.audioSrc)).size,
  );
  for (let level = 1; level <= 9; level += 1) {
    assert.ok(listeningQuestionsForLevel(level).length >= 10, `HSK ${level} needs at least 10 published listening questions`);
  }
});
