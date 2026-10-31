import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import runtimeIndex from "../src/lib/content/runtime-content-index.json" with { type: "json" };
import previousVocabulary from "../src/lib/practice/practice-v4-vocabulary-history.json" with { type: "json" };
import { PRACTICE_QUESTIONS, practiceQuestionSet, trustedPracticeQuestionVersion } from "../src/lib/practice/questions.ts";
import { evaluateMockGate, mockBank, selectMockQuestions } from "../src/lib/mock/domain.ts";

test("current vocabulary practice uses the active 2025 release throughout every level", () => {
  const release = runtimeIndex as { releaseId: string; runtimeWords: Record<string, Array<{ id: string }>> };
  for (const level of [1, 2, 3, 4, 5, 6, 7]) {
    const questions = practiceQuestionSet(level, "vocabulary");
    const sourceIds = new Set((level === 7 ? [7, 8, 9] : [level]).flatMap((sourceLevel) => release.runtimeWords[String(sourceLevel)].map((word) => word.id)));
    assert.ok(questions.length >= 96, `HSK ${level} should offer more than the old first-page sample`);
    assert.ok(questions.every((question) => question.standardRef === "HSK-EXAM-2025"));
    assert.ok(questions.every((question) => question.sourceRef.startsWith(`${release.releaseId}:`) && sourceIds.has(question.sourceRef.slice(release.releaseId.length + 1))));
    assert.ok(questions.every((question) => new Set(Object.values(question.options).map((value) => value.normalize("NFKC").trim().toLowerCase())).size === 4));
  }
});

test("previous vocabulary sessions retain their exact question version and answer", () => {
  assert.equal(previousVocabulary.length, 168);
  for (const prior of previousVocabulary) {
    const restored = trustedPracticeQuestionVersion(prior.id, prior.setVersion);
    assert.deepEqual(restored, prior);
  }
});

test("each level and skill has complete approved questions and working listening media", () => {
  for (const level of [1, 2, 3, 4, 5, 6, 7]) {
    for (const skill of ["vocabulary", "grammar", "reading", "listening"]) {
      const questions = practiceQuestionSet(level, skill);
      assert.ok(questions.length >= 8, `${level}:${skill}`);
      for (const question of questions) {
        assert.ok(question.prompt.trim() && question.explanation.trim());
        assert.ok(question.options[question.correctAnswer]?.trim());
        if (skill === "listening") assert.ok(question.audioSrc && existsSync(`public${question.audioSrc}`));
      }
    }
  }
  assert.equal(PRACTICE_QUESTIONS.length >= 2000, true);
});

test("each mock pool supports two distinct short diagnostics", () => {
  for (const [band, targetLevel] of [["basic", 1], ["basic", 2], ["basic", 3], ["basic", 4], ["basic", 5], ["basic", 6], ["advanced", 7]] as const) {
    const pool = mockBank(band, targetLevel);
    assert.deepEqual(evaluateMockGate(band, pool, targetLevel), { ready: true, reason: null });
    const first = selectMockQuestions(pool, `${band}:${targetLevel}:first`);
    const second = selectMockQuestions(pool, `${band}:${targetLevel}:second`, first.map((question) => question.id), first.map((question) => question.sourceGroupId ?? question.id));
    assert.equal(first.length, 15);
    assert.equal(second.length, 15);
    assert.equal(second.filter((question) => first.some((prior) => prior.id === question.id || prior.sourceGroupId === question.sourceGroupId)).length, 0);
  }
});
