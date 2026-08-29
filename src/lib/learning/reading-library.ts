import bankJson from "./reading-library.json" with { type: "json" };
import type { ReadingDifficulty, ReadingLesson, ReadingQuestionType, Step7Exercise } from "./step7-content.ts";

export type ReadingLibrarySize = 10 | 20;
export interface ReadingLibraryQuestion extends ReadingLesson {
  id: string;
  passageId: string;
  questionIndex: number;
  sourceRef: string;
  sourceLicense: string;
  authorizationStatus: "authorized";
  qaStatus: "approved";
  lifecycleStatus: "published";
}
export interface ReadingLibrarySession {
  id: string;
  level: number;
  size: ReadingLibrarySize;
  seed: string;
  questions: ReadingLibraryQuestion[];
}

type RawQuestion = {
  prompt: string;
  options: Record<string, string>;
  correctAnswer: string;
  explanation: string;
  questionType: ReadingQuestionType;
};
type RawPassage = {
  id: string;
  slug: string;
  level: number;
  levelBand: string;
  title: string;
  passage: string;
  translation: string;
  vocabulary: Array<{ hanzi: string; pinyin: string; meaning: string }>;
  difficulty: ReadingDifficulty;
  sourceRef: string;
  sourceLicense: string;
  authorizationStatus: "authorized";
  qaStatus: "approved";
  lifecycleStatus: "published";
  questions: RawQuestion[];
};
const bank = bankJson as { version: string; label: string; coverageNotice: string; passages: RawPassage[] };
const GRAMMAR_SLUGS = ["basic-shi-negation", "comparison-with-bi", "ba-sentence-basics", "condition-with-zhiyao", "contrast-with-jinguan", "formal-causation-yu-youyu", "advanced-concession-guran", "advanced-concession-guran", "advanced-concession-guran"];

const QUESTIONS: ReadingLibraryQuestion[] = bank.passages.flatMap((passage) => passage.questions.map((raw, index) => {
  const number = index + 1;
  const slug = `${passage.slug}-q${number}`;
  const id = `${passage.id}-q${number}`;
  const exercise: Step7Exercise = {
    id,
    contentId: `reading:${slug}`,
    contentVersion: `${bank.version}:${passage.id}:q${number}`,
    kind: "reading",
    prompt: raw.prompt,
    options: raw.options,
    correctAnswer: raw.correctAnswer,
    explanation: raw.explanation,
  };
  return {
    id,
    passageId: passage.id,
    questionIndex: index,
    slug,
    level: passage.level,
    levelBand: passage.levelBand,
    contentVersion: exercise.contentVersion,
    title: passage.title,
    text: passage.passage,
    passage: passage.passage,
    translation: passage.translation,
    pinyin: "",
    vocabulary: passage.vocabulary.map((item) => ({ ...item, word: item.hanzi })),
    questionType: raw.questionType,
    difficulty: passage.difficulty,
    grammarSlug: GRAMMAR_SLUGS[passage.level - 1],
    relatedGrammarSlug: GRAMMAR_SLUGS[passage.level - 1],
    exercise,
    sourceRef: passage.sourceRef,
    sourceLicense: passage.sourceLicense,
    authorizationStatus: passage.authorizationStatus,
    qaStatus: passage.qaStatus,
    lifecycleStatus: passage.lifecycleStatus,
  };
}));

export const READING_LIBRARY_LABEL = bank.label;
export const READING_LIBRARY_COVERAGE_NOTICE = bank.coverageNotice;
export const READING_LIBRARY_QUESTIONS = QUESTIONS;
export const READING_LIBRARY_COUNTS = {
  passages: bank.passages.length,
  questions: QUESTIONS.length,
  byLevel: Array.from({ length: 9 }, (_, index) => {
    const level = index + 1;
    return {
      level,
      passages: bank.passages.filter((passage) => passage.level === level).length,
      questions: QUESTIONS.filter((question) => question.level === level).length,
    };
  }),
};

export function readingQuestionsForLevel(level: number) {
  return QUESTIONS.filter((question) => question.level === level);
}
export function readingQuestionBySlug(slug: string) {
  return QUESTIONS.find((question) => question.slug === slug);
}
function seedNumber(seed: string) {
  let value = 2166136261;
  for (const character of seed) value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return value >>> 0;
}
export function readingSession(level: number, size: ReadingLibrarySize, seed: string): ReadingLibrarySession {
  const source = readingQuestionsForLevel(level);
  if (!source.length) throw new Error("READING_LEVEL_NOT_FOUND");
  const start = seedNumber(`${level}:${seed}`) % source.length;
  const stride = source.length % 2 === 0 ? 7 : 8;
  const questions: ReadingLibraryQuestion[] = [];
  const used = new Set<string>();
  for (let cursor = 0; questions.length < size && cursor < source.length * 3; cursor += 1) {
    const question = source[(start + cursor * stride) % source.length];
    if (!used.has(question.id)) { used.add(question.id); questions.push(question); }
  }
  if (questions.length !== size) throw new Error("READING_SESSION_UNDERSIZED");
  return { id: `${bank.version}:hsk${level}:${size}:${seed}`, level, size, seed, questions };
}
export function readingSessionNext(session: ReadingLibrarySession, index: number) {
  return session.questions[index + 1];
}
