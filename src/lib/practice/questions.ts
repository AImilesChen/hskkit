import { createHash } from "node:crypto";
import catalog from "../content/catalog.json" with { type: "json" };
import { queryCatalog, type ContentRepository } from "../content/repository.ts";

export const PRACTICE_VERSION = "hskkit-practice-l1-vocabulary-v1";
export type PracticeSkill = "vocabulary";
export type PracticeAnswerChoice = "a" | "b" | "c" | "d";

export interface PracticeQuestion {
  id: string;
  standardVersion: "HSK 3.0";
  contentVersion: string;
  level: number;
  skill: PracticeSkill;
  prompt: string;
  context?: string;
  options: Record<PracticeAnswerChoice, string>;
  correctAnswer: PracticeAnswerChoice;
  explanation: string;
  weaknessTag: string;
  qaStatus: "approved-for-bounded-practice";
  publicationStatus: "practice-only";
  lifecycleStatus: "published" | "withdrawn";
}

const repository = catalog as ContentRepository;

export function practiceSetContentVersion(releaseId: string, sources: Array<{ logicalId: string; version: string | number }>) {
  const digest = createHash("sha256")
    .update(JSON.stringify(sources.map((source) => [source.logicalId, String(source.version)])))
    .digest("base64url")
    .slice(0, 24);
  return `${releaseId}:practice-set-${digest}`;
}

function catalogPracticeQuestions(level: number): PracticeQuestion[] {
  const result = queryCatalog(repository, { standard: "hsk3", level });
  const words = result.contentAssets.filter((asset) => asset.kind === "word").slice(0, 4);
  if (words.length < 4) return [];
  const contentVersion = practiceSetContentVersion(result.releaseId, words.map((asset) => ({ logicalId: asset.logicalId, version: asset.content_version ?? `asset-v${asset.version}` })));
  const options = words.map((asset) => String(asset.payload.hanzi)) as [string, string, string, string];
  return words.slice(0, 3).map((asset, index) => {
    const correctIndex = createHash("sha256")
      .update(`hskkit-practice-option-order:${result.releaseId}:${asset.logicalId}:${asset.content_version ?? asset.version}`)
      .digest()[0] % 4;
    const ordered = options.filter((_, optionIndex) => optionIndex !== index);
    ordered.splice(correctIndex, 0, options[index]);
    const correctAnswer = (["a", "b", "c", "d"] as const)[correctIndex];
    return {
      id: `practice-catalog-l${level}-${asset.logicalId}`,
      standardVersion: "HSK 3.0",
      contentVersion,
      level,
      skill: "vocabulary",
      prompt: `Which Chinese entry means “${String(asset.payload.meaning)}”?`,
      options: { a: ordered[0], b: ordered[1], c: ordered[2], d: ordered[3] },
      correctAnswer,
      explanation: `${String(asset.payload.hanzi)} means “${String(asset.payload.meaning)}.”`,
      weaknessTag: `hsk3-level-${level}-vocabulary`,
      qaStatus: "approved-for-bounded-practice",
      publicationStatus: "practice-only",
      lifecycleStatus: "published",
    };
  });
}

export const WITHDRAWN_PRACTICE_QUESTION_ID = "practice-v1-l1-vocab-retired-sample";
const PRACTICE_QUESTION_STATUS: Record<string, "published" | "withdrawn"> = {
  [WITHDRAWN_PRACTICE_QUESTION_ID]: "withdrawn",
};

export const PRACTICE_QUESTIONS: PracticeQuestion[] = [
  {
    id: "practice-v1-l1-vocab-hello",
    standardVersion: "HSK 3.0",
    contentVersion: PRACTICE_VERSION,
    level: 1,
    skill: "vocabulary",
    prompt: "Which Chinese expression means “hello”?",
    options: { a: "你好", b: "谢谢", c: "再见", d: "对不起" },
    correctAnswer: "a",
    explanation: "你好 is the standard greeting for “hello.”",
    weaknessTag: "basic-greetings",
    qaStatus: "approved-for-bounded-practice",
    publicationStatus: "practice-only",
    lifecycleStatus: "published",
  },
  {
    id: "practice-v1-l1-vocab-thanks",
    standardVersion: "HSK 3.0",
    contentVersion: PRACTICE_VERSION,
    level: 1,
    skill: "vocabulary",
    prompt: "Which expression means “thank you”?",
    options: { a: "谢谢", b: "你好", c: "再见", d: "没关系" },
    correctAnswer: "a",
    explanation: "谢谢 is used to express thanks.",
    weaknessTag: "basic-greetings",
    qaStatus: "approved-for-bounded-practice",
    publicationStatus: "practice-only",
    lifecycleStatus: "published",
  },
  {
    id: "practice-v1-l1-vocab-goodbye",
    standardVersion: "HSK 3.0",
    contentVersion: PRACTICE_VERSION,
    level: 1,
    skill: "vocabulary",
    prompt: "Which expression means “goodbye”?",
    options: { a: "再见", b: "请", c: "是", d: "有" },
    correctAnswer: "a",
    explanation: "再见 literally means “see you again” and is used for “goodbye.”",
    weaknessTag: "basic-greetings",
    qaStatus: "approved-for-bounded-practice",
    publicationStatus: "practice-only",
    lifecycleStatus: "published",
  },
  ...[2, 3, 4, 5, 6].flatMap(catalogPracticeQuestions),
];

export function practiceQuestionLifecycle(id: string) {
  return PRACTICE_QUESTION_STATUS[id] ?? PRACTICE_QUESTIONS.find((question) => question.id === id)?.lifecycleStatus;
}

export function practiceQuestionSet(level: number, skill: string) {
  return PRACTICE_QUESTIONS.filter((question) => question.level === level && question.skill === skill && question.lifecycleStatus === "published");
}

export function trustedPracticeQuestion(id: string) {
  return PRACTICE_QUESTIONS.find((question) => question.id === id);
}

export function publicPracticeQuestion(question: PracticeQuestion) {
  return {
    id: question.id,
    standardVersion: question.standardVersion,
    contentVersion: question.contentVersion,
    level: question.level,
    skill: question.skill,
    prompt: question.prompt,
    context: question.context,
    options: question.options,
  };
}
