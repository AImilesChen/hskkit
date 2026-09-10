import assert from "node:assert/strict";
import test from "node:test";

import { auditPracticeQuestionBank, renderPracticeEditorialReport, type PracticeQualityBaseline } from "../src/lib/practice/quality-gate.ts";
import type { PracticeQuestion } from "../src/lib/practice/questions.ts";

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

const zeroBaseline: PracticeQualityBaseline = {
  exactDuplicateGroups: 0,
  nearDuplicatePairs: 0,
  templateDensityViolations: 0,
  levelSourceFailures: 0,
};

test("quality gate detects exact and near-duplicate released questions", () => {
  const exact = question({ id: "q-2", sourceGroupId: "source-2", sourceRef: "hskkit-editorial:source-2" });
  const near = question({
    id: "q-3",
    sourceGroupId: "source-3",
    sourceRef: "hskkit-editorial:source-3",
    context: "王明星期一去学校，星期二在家认真学习。",
    prompt: "Which statement is supported by the passage?",
  });
  const audit = auditPracticeQuestionBank([question(), exact, near], zeroBaseline);
  assert.equal(audit.metrics.exactDuplicateGroups, 1);
  assert.ok(audit.metrics.nearDuplicatePairs >= 1);
  assert.equal(audit.blocked, true);
});

test("quality gate detects a template occupying more than the allowed share of a pool", () => {
  const questions = Array.from({ length: 8 }, (_, index) => question({
    id: `q-${index}`,
    sourceGroupId: `source-${index}`,
    sourceRef: `hskkit-editorial:source-${index}`,
    context: `材料${index}提供不同事实和人物。`,
    templateId: index < 7 ? "reading:detail" : "reading:inference",
  }));
  const audit = auditPracticeQuestionBank(questions, zeroBaseline);
  assert.equal(audit.metrics.templateDensityViolations, 1);
  assert.equal(audit.blocked, true);
});

test("quality gate rejects invalid or missing source levels while allowing the HSK 7-9 advanced band mapping", () => {
  const invalid = question({ id: "bad", level: 3, levelBand: "level-3", sourceLevel: 2 });
  const advanced = question({ id: "advanced", level: 7, levelBand: "advanced-7-9", sourceLevel: 9, sourceGroupId: "advanced-source" });
  const audit = auditPracticeQuestionBank([invalid, advanced], zeroBaseline);
  assert.equal(audit.metrics.levelSourceFailures, 1);
  assert.deepEqual(audit.findings.filter((finding) => finding.rule === "level-source").map((finding) => finding.questionIds), [["bad"]]);
});

test("checked-in baseline allows existing debt but any regression blocks build and release", () => {
  const duplicate = question({ id: "q-2", sourceGroupId: "source-2" });
  const current = auditPracticeQuestionBank([question(), duplicate]);
  const baseline: PracticeQualityBaseline = { ...current.metrics };
  assert.equal(auditPracticeQuestionBank([question(), duplicate], baseline).blocked, false);
  assert.equal(auditPracticeQuestionBank([question(), duplicate, question({ id: "q-3", sourceGroupId: "source-3" })], baseline).blocked, true);
});

test("editorial report contains scope, all five gate sections, metrics, and review-needed evidence", () => {
  const audit = auditPracticeQuestionBank([question()], zeroBaseline);
  const report = renderPracticeEditorialReport(audit);
  for (const heading of ["Released scope", "Duplicate and near-duplicate review", "Template density review", "Level source review", "Editorial review queue", "Build and release decision"]) {
    assert.match(report, new RegExp(heading));
  }
  assert.match(report, /Questions audited: 1/);
  assert.match(report, /BLOCKED|GO/);
});
