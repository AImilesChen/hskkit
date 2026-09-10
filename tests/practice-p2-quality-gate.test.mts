import assert from "node:assert/strict";
import test from "node:test";

import { auditPracticeQuestionBank, renderPracticeEditorialReport } from "../src/lib/practice/quality-gate.ts";
import { PRACTICE_QUESTIONS, type PracticeQuestion } from "../src/lib/practice/questions.ts";

function question(overrides: Partial<PracticeQuestion> = {}): PracticeQuestion {
  return {
    id: "q-1",
    standardVersion: "HSK 3.0",
    standardRef: "GF0025-2021",
    contentVersion: "v1",
    setVersion: "set-v1",
    level: 2,
    levelBand: "level-2",
    sourceLevel: 2,
    sourceGroupId: "source-1",
    templateId: "reading:detail",
    skill: "reading",
    prompt: "Which statement is supported?",
    context: "王明星期一去学校，星期二在家学习。",
    options: { a: "星期一去学校", b: "星期一在家", c: "星期二去学校", d: "从不学习" },
    correctAnswer: "a",
    explanation: "The passage says 王明星期一去学校。",
    weaknessTag: "level-2-reading-detail",
    sourceRef: "hskkit-editorial:source-1",
    sourceUrl: "https://hskkit.com/content-license",
    authorizationStatus: "authorized",
    qaStatus: "approved",
    publicationStatus: "formal-practice",
    lifecycleStatus: "published",
    ...overrides,
  };
}

function distinctQuestions(count: number, overrides: (index: number) => Partial<PracticeQuestion> = () => ({})) {
  return Array.from({ length: count }, (_, index) => question({
    id: `q-${index}`,
    sourceGroupId: `source-${index}`,
    sourceRef: `hskkit-editorial:source-${index}`,
    context: `材料${index}围绕主题${String.fromCharCode(65 + index)}提供独立事实。`,
    correctAnswer: (index % 4 === 0 ? "a" : index % 4 === 1 ? "b" : index % 4 === 2 ? "c" : "d"),
    ...overrides(index),
  }));
}

test("quality gate detects exact and near-duplicate released questions with no baseline allowance", () => {
  const exact = question({ id: "q-2", sourceGroupId: "source-2", sourceRef: "hskkit-editorial:source-2" });
  const near = question({ id: "q-3", sourceGroupId: "source-3", sourceRef: "hskkit-editorial:source-3", context: "王明星期一去学校，星期二在家认真学习。" });
  const audit = auditPracticeQuestionBank([question(), exact, near]);
  assert.equal(audit.metrics.exactDuplicateGroups, 1);
  assert.ok(audit.metrics.nearDuplicatePairs >= 1);
  assert.equal(audit.blocked, true);
});

test("quality gate enforces a strict 25 percent dominant-template ceiling", () => {
  const atLimit = distinctQuestions(12, (index) => ({ templateId: `template-${index % 4}` }));
  const aboveLimit = distinctQuestions(12, (index) => ({ templateId: index < 4 ? "dominant" : `template-${index}` }));
  assert.equal(auditPracticeQuestionBank(atLimit).metrics.templateDensityViolations, 0);
  assert.equal(auditPracticeQuestionBank(aboveLimit).metrics.templateDensityViolations, 1);
});

test("quality gate rejects invalid source levels while allowing the HSK 7-9 advanced band mapping", () => {
  const invalid = question({ id: "bad", level: 3, levelBand: "level-3", sourceLevel: 2 });
  const advanced = question({ id: "advanced", level: 7, levelBand: "advanced-7-9", sourceLevel: 9, sourceGroupId: "advanced-source" });
  const audit = auditPracticeQuestionBank([invalid, advanced]);
  assert.equal(audit.metrics.levelSourceFailures, 1);
  assert.deepEqual(audit.findings.filter((finding) => finding.rule === "level-source").map((finding) => finding.questionIds), [["bad"]]);
});

test("quality gate blocks a bank that cannot compose a diverse ten-question Review queue", () => {
  const singleSkill = distinctQuestions(10, (index) => ({ templateId: `template-${index}`, skill: "reading" }));
  const audit = auditPracticeQuestionBank(singleSkill);
  assert.equal(audit.metrics.sessionCompositionViolations, 1);
  assert.equal(audit.blocked, true);
});

test("injecting one duplicate into the released bank always fails the publication gate", () => {
  const original = PRACTICE_QUESTIONS[0];
  const injected = { ...original, id: `${original.id}-injected-duplicate`, sourceGroupId: `${original.sourceGroupId}-injected` };
  const audit = auditPracticeQuestionBank([...PRACTICE_QUESTIONS, injected]);
  assert.ok(audit.metrics.exactDuplicateGroups >= 1);
  assert.equal(audit.blocked, true);
});

test("editorial report exposes all zero-tolerance release sections", () => {
  const report = renderPracticeEditorialReport(auditPracticeQuestionBank([question()]));
  for (const heading of ["Released scope", "Duplicate and near-duplicate review", "Template density review", "Level source review", "Review session composition", "Editorial review queue", "Build and release decision"]) {
    assert.match(report, new RegExp(heading));
  }
  assert.match(report, /25% dominant-template threshold/);
  assert.match(report, /No baseline allowances apply/);
});
