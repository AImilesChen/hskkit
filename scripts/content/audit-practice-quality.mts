import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PRACTICE_QUESTIONS } from "../../src/lib/practice/questions.ts";
import { auditPracticeQuestionBank, renderPracticeEditorialReport, type PracticeQualityBaseline } from "../../src/lib/practice/quality-gate.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const qualityDirectory = resolve(root, "docs/quality");
const baselinePath = resolve(qualityDirectory, "practice-quality-baseline.json");
const reportPath = resolve(qualityDirectory, "practice-editorial-quality-report.md");
const machineReportPath = resolve(qualityDirectory, "practice-editorial-quality-report.json");

const baseline = JSON.parse(readFileSync(baselinePath, "utf8")) as PracticeQualityBaseline;
const audit = auditPracticeQuestionBank(PRACTICE_QUESTIONS, baseline);
mkdirSync(qualityDirectory, { recursive: true });
writeFileSync(reportPath, renderPracticeEditorialReport(audit), "utf8");
writeFileSync(machineReportPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");

console.log(`[practice-quality] questions=${audit.questionCount} exact=${audit.metrics.exactDuplicateGroups} near=${audit.metrics.nearDuplicatePairs} template=${audit.metrics.templateDensityViolations} level=${audit.metrics.levelSourceFailures}`);
console.log(`[practice-quality] editorial-review=${audit.editorialReviewQuestionIds.length} decision=${audit.blocked ? "BLOCKED" : "GO"}`);
if (audit.blocked) {
  console.error(`[practice-quality] regressions=${audit.regressions.join(",")}`);
  process.exitCode = 1;
}
