import type { PracticeQuestion } from "./questions.ts";
import { practiceReviewIdentity } from "./questions.ts";

export type PracticeQualityRule = "exact-duplicate" | "near-duplicate" | "template-density" | "level-source";
export type PracticeQualityMetrics = {
  exactDuplicateGroups: number;
  nearDuplicatePairs: number;
  templateDensityViolations: number;
  levelSourceFailures: number;
};
export type PracticeQualityBaseline = PracticeQualityMetrics;
export type PracticeQualityFinding = {
  rule: PracticeQualityRule;
  summary: string;
  questionIds: string[];
  evidence: string;
};
export type PracticeQualityAudit = {
  questionCount: number;
  metrics: PracticeQualityMetrics;
  baseline?: PracticeQualityBaseline;
  regressions: Array<keyof PracticeQualityMetrics>;
  findings: PracticeQualityFinding[];
  editorialReviewQuestionIds: string[];
  blocked: boolean;
};

const normalize = (value: string | undefined) => (value ?? "")
  .normalize("NFKC")
  .toLocaleLowerCase("en")
  .replace(/[\p{P}\p{S}\s]+/gu, "")
  .trim();

const sourceText = (question: PracticeQuestion) => normalize(
  question.skill === "reading"
    ? question.context
    : question.skill === "listening"
      ? question.audioText
      : `${question.context ?? ""}${question.prompt}${question.options[question.correctAnswer]}`,
);

const exactFingerprint = (question: PracticeQuestion) => JSON.stringify([
  sourceText(question),
  normalize(question.prompt),
  Object.values(question.options).map(normalize),
  question.correctAnswer,
]);

const bigrams = (value: string) => {
  if (value.length < 2) return new Set(value ? [value] : []);
  return new Set(Array.from({ length: value.length - 1 }, (_, index) => value.slice(index, index + 2)));
};

const diceSimilarity = (left: string, right: string) => {
  const a = bigrams(left);
  const b = bigrams(right);
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  for (const token of a) if (b.has(token)) overlap += 1;
  return (2 * overlap) / (a.size + b.size);
};

function finding(rule: PracticeQualityRule, questionIds: string[], summary: string, evidence: string): PracticeQualityFinding {
  return { rule, questionIds, summary, evidence };
}

export function auditPracticeQuestionBank(questions: PracticeQuestion[], baseline?: PracticeQualityBaseline): PracticeQualityAudit {
  const released = questions.filter((question) => question.authorizationStatus === "authorized" && question.qaStatus === "approved" && question.lifecycleStatus === "published");
  const findings: PracticeQualityFinding[] = [];

  const exactGroups = new Map<string, PracticeQuestion[]>();
  for (const question of released) {
    const key = exactFingerprint(question);
    exactGroups.set(key, [...(exactGroups.get(key) ?? []), question]);
  }
  for (const group of exactGroups.values()) {
    if (group.length > 1) findings.push(finding(
      "exact-duplicate",
      group.map((question) => question.id),
      "Released questions have identical material, prompt, options, and answer.",
      `fingerprint=${exactFingerprint(group[0]).slice(0, 180)}`,
    ));
  }

  const sourceRepresentatives = new Map<string, PracticeQuestion>();
  for (const question of released) {
    const identity = practiceReviewIdentity(question);
    sourceRepresentatives.set(`${question.level}:${question.skill}:${identity.sourceGroupId}`, question);
  }
  const representatives = [...sourceRepresentatives.values()].filter((question) =>
    (question.skill === "reading" || question.skill === "listening") && sourceText(question).length >= 12,
  );
  for (let leftIndex = 0; leftIndex < representatives.length; leftIndex += 1) {
    const left = representatives[leftIndex];
    const leftText = sourceText(left);
    for (let rightIndex = leftIndex + 1; rightIndex < representatives.length; rightIndex += 1) {
      const right = representatives[rightIndex];
      if (left.level !== right.level || left.skill !== right.skill) continue;
      const rightText = sourceText(right);
      if (leftText === rightText) continue;
      const similarity = diceSimilarity(leftText, rightText);
      if (similarity < 0.80) continue;
      findings.push(finding(
        "near-duplicate",
        [left.id, right.id],
        "Released source materials are above the near-duplicate similarity threshold.",
        `dice=${similarity.toFixed(3)}; left=${leftText.slice(0, 90)}; right=${rightText.slice(0, 90)}`,
      ));
    }
  }

  const pools = new Map<string, PracticeQuestion[]>();
  for (const question of released) {
    const key = `${question.level}:${question.skill}`;
    pools.set(key, [...(pools.get(key) ?? []), question]);
  }
  for (const [poolKey, pool] of pools) {
    if (pool.length < 8) continue;
    const templates = new Map<string, PracticeQuestion[]>();
    for (const question of pool) {
      const templateId = practiceReviewIdentity(question).templateId;
      templates.set(templateId, [...(templates.get(templateId) ?? []), question]);
    }
    const dominant = [...templates.entries()].sort((left, right) => right[1].length - left[1].length)[0];
    const ratio = dominant[1].length / pool.length;
    if (ratio <= 0.75) continue;
    findings.push(finding(
      "template-density",
      dominant[1].map((question) => question.id),
      `One template occupies ${(ratio * 100).toFixed(1)}% of pool ${poolKey}.`,
      `template=${dominant[0]}; count=${dominant[1].length}/${pool.length}`,
    ));
  }

  for (const question of released) {
    const sourceLevel = question.sourceLevel;
    const validSourceLevel = Number.isInteger(sourceLevel) && Number(sourceLevel) >= 1 && Number(sourceLevel) <= 9;
    const validMapping = question.level === 7
      ? Number(sourceLevel) >= 7 && Number(sourceLevel) <= 9
      : sourceLevel === question.level;
    const validBand = question.level === 7
      ? question.levelBand === "advanced-7-9"
      : question.levelBand === `level-${question.level}`;
    if (!validSourceLevel || !validMapping || !validBand) findings.push(finding(
      "level-source",
      [question.id],
      "Question level does not match its traceable source level and level band.",
      `level=${question.level}; sourceLevel=${String(sourceLevel)}; levelBand=${question.levelBand}; sourceRef=${question.sourceRef}`,
    ));
  }

  const metrics: PracticeQualityMetrics = {
    exactDuplicateGroups: [...exactGroups.values()].reduce((count, group) => count + Math.max(0, group.length - 1), 0),
    nearDuplicatePairs: findings.filter((item) => item.rule === "near-duplicate").length,
    templateDensityViolations: findings.filter((item) => item.rule === "template-density").length,
    levelSourceFailures: findings.filter((item) => item.rule === "level-source").length,
  };
  const regressions = baseline
    ? (Object.keys(metrics) as Array<keyof PracticeQualityMetrics>).filter((key) => metrics[key] > baseline[key])
    : [];
  const blocked = baseline ? regressions.length > 0 : Object.values(metrics).some((count) => count > 0);
  return {
    questionCount: released.length,
    metrics,
    baseline,
    regressions,
    findings,
    editorialReviewQuestionIds: [...new Set(findings.flatMap((item) => item.questionIds))],
    blocked,
  };
}

export function renderPracticeEditorialReport(audit: PracticeQualityAudit) {
  const decision = audit.blocked ? "BLOCKED" : "GO";
  const lines = [
    "# Practice question-bank editorial quality report",
    "",
    "## Released scope",
    `- Questions audited: ${audit.questionCount}`,
    "- Scope: authorized, approved, published Practice questions only.",
    "",
    "## Duplicate and near-duplicate review",
    `- Exact duplicate groups: ${audit.metrics.exactDuplicateGroups}`,
    `- Near-duplicate source pairs: ${audit.metrics.nearDuplicatePairs}`,
    "",
    "## Template density review",
    `- Pools above the 75% dominant-template threshold: ${audit.metrics.templateDensityViolations}`,
    "",
    "## Level source review",
    `- Missing or inconsistent source-level records: ${audit.metrics.levelSourceFailures}`,
    "",
    "## Editorial review queue",
    `- Questions requiring human Chinese/editorial review: ${audit.editorialReviewQuestionIds.length}`,
    ...audit.findings.slice(0, 100).map((item) => `- [${item.rule}] ${item.questionIds.join(", ")}: ${item.summary} Evidence: ${item.evidence}`),
    ...(audit.findings.length > 100 ? [`- ${audit.findings.length - 100} additional findings omitted from this concise report; see machine JSON.`] : []),
    "",
    "## Build and release decision",
    `- ${decision}`,
    `- Regression keys: ${audit.regressions.length ? audit.regressions.join(", ") : "none"}`,
    "- Existing reviewed debt is frozen by the checked-in baseline; any metric increase blocks build and content release.",
    "- Automated checks triage evidence only. Human Chinese/editorial review remains required before reducing the baseline.",
    "",
  ];
  return lines.join("\n");
}
