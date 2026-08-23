import {
  ADVANCED_LISTENING_LESSONS,
  publishedGrammarLessons,
  publishedReadingLessons,
  normalizeStep7Answer,
  type Step7Exercise,
} from "../learning/step7-content.ts";
import { STEP7_RELEASE_ID } from "../learning/step7-release.ts";

export type MockBand = "basic" | "advanced";
export type MockDimension = "grammar" | "reading" | "listening" | "pragmatics";
export type MockAbilityInterval = "developing" | "functional" | "strong";
export const MOCK_QUESTION_SET_VERSION = "hsk3-batch14-mock-v1";
export const BASIC_MOCK_DURATION_SECONDS = 30 * 60;
export const ADVANCED_MOCK_DURATION_SECONDS = 20 * 60;
export const BASIC_MOCK_SCORING_VERSION = "basic-raw-v1";
export const ADVANCED_MOCK_SCORING_VERSION = "advanced-band-v1";

export interface MockQuestion {
  id: string;
  contentId: string;
  contentVersion: string;
  sourceReleaseId: string;
  band: MockBand;
  level: number;
  levelBand: string;
  dimension: MockDimension;
  prompt: string;
  options?: Record<string, string>;
  correctAnswer: string;
  explanation: string;
  audioSrc?: string;
  instruction?: string;
  approval: "approved" | "pending";
  authorization: "authorized" | "missing";
  lifecycle: "published" | "withdrawn";
}
export interface MockAnswer {
  questionId: string;
  answer: string;
  idempotencyKey: string;
  savedAt: string;
}
export interface MockResultItem {
  questionId: string;
  dimension: MockDimension;
  prompt: string;
  answer?: string;
  correctAnswer: string;
  correct: boolean;
  explanation: string;
}
export interface MockResult {
  id: string;
  sessionId: string;
  band: MockBand;
  questionSetVersion: string;
  scoringVersion: string;
  submitIdempotencyKey: string;
  correctCount: number;
  totalCount: number;
  percentage: number;
  abilityInterval?: MockAbilityInterval;
  dimensionEvidence: Partial<Record<MockDimension, { correct: number; total: number }>>;
  items: MockResultItem[];
  questionSnapshots: MockQuestion[];
  nextRoutes: string[];
  disclaimer: string;
  createdAt: string;
}
export interface MockSession {
  id: string;
  ownerId: string;
  band: MockBand;
  startIdempotencyKey: string;
  questionSetVersion: string;
  scoringVersion: string;
  questions: MockQuestion[];
  answers: MockAnswer[];
  answerKeys: string[];
  revision: number;
  status: "in_progress" | "submitted";
  startedAt: string;
  deadlineAt: string;
  submittedAt?: string;
  result?: MockResult;
}

const fromExercise = (exercise: Step7Exercise, input: Pick<MockQuestion, "band" | "level" | "levelBand" | "dimension"> & Pick<MockQuestion, "audioSrc" | "instruction">): MockQuestion => ({
  id: exercise.id,
  contentId: exercise.contentId,
  contentVersion: exercise.contentVersion,
  sourceReleaseId: STEP7_RELEASE_ID,
  ...input,
  prompt: exercise.prompt,
  options: exercise.options,
  correctAnswer: exercise.correctAnswer,
  explanation: exercise.explanation,
  approval: "approved",
  authorization: "authorized",
  lifecycle: "published",
});

const BASIC_BANK: MockQuestion[] = Array.from({ length: 6 }, (_, index) => index + 1).flatMap((level) => {
  const grammar = publishedGrammarLessons.find((item) => item.level === level);
  const reading = publishedReadingLessons.find((item) => item.level === level);
  const listening = ADVANCED_LISTENING_LESSONS.find((item) => item.level === level);
  if (!grammar || !reading || !listening) return [];
  return [
    fromExercise(grammar.exercise, { band: "basic", level, levelBand: String(level), dimension: "grammar" }),
    fromExercise(reading.exercise, { band: "basic", level, levelBand: String(level), dimension: "reading" }),
    fromExercise(listening.exercise, { band: "basic", level, levelBand: String(level), dimension: "listening", audioSrc: listening.audioSrc, instruction: listening.instruction }),
  ];
});
const advancedGrammar = publishedGrammarLessons.find((item) => item.levelBand === "7-9");
const advancedReading = publishedReadingLessons.find((item) => item.levelBand === "7-9");
const advancedListening = ADVANCED_LISTENING_LESSONS.filter((item) => item.level >= 7 && item.level <= 9);
const ADVANCED_BANK: MockQuestion[] = [
  ...(advancedGrammar ? [fromExercise(advancedGrammar.exercise, { band: "advanced" as const, level: 7, levelBand: "7-9", dimension: "pragmatics" as const })] : []),
  ...(advancedReading ? [fromExercise(advancedReading.exercise, { band: "advanced" as const, level: 7, levelBand: "7-9", dimension: "reading" as const })] : []),
  ...advancedListening.map((item) => fromExercise(item.exercise, { band: "advanced" as const, level: item.level, levelBand: "7-9", dimension: "listening" as const, audioSrc: item.audioSrc, instruction: item.instruction })),
];

export const mockBank = (band: MockBand): MockQuestion[] => (band === "basic" ? BASIC_BANK : ADVANCED_BANK).map((question) => ({ ...question, options: question.options ? { ...question.options } : undefined }));
export function evaluateMockGate(band: MockBand, questions = mockBank(band)): { ready: boolean; reason: string | null } {
  const expected = band === "basic" ? 18 : 5;
  if (questions.length !== expected) return { ready: false, reason: "CONTENT_COUNT_GATE" };
  if (questions.some((question) => question.band !== band || question.approval !== "approved" || question.authorization !== "authorized" || question.lifecycle !== "published")) return { ready: false, reason: "CONTENT_APPROVAL_GATE" };
  if (new Set(questions.map((question) => question.id)).size !== expected) return { ready: false, reason: "QUESTION_ID_GATE" };
  if (questions.some((question) => !question.correctAnswer || !question.explanation || !question.contentVersion || !question.sourceReleaseId)) return { ready: false, reason: "SCORING_GATE" };
  if (band === "basic" && [1, 2, 3, 4, 5, 6].some((level) => questions.filter((question) => question.level === level).length !== 3)) return { ready: false, reason: "BASIC_LEVEL_COVERAGE_GATE" };
  if (band === "advanced" && ["reading", "listening", "pragmatics"].some((dimension) => !questions.some((question) => question.dimension === dimension))) return { ready: false, reason: "ADVANCED_DIMENSION_GATE" };
  return { ready: true, reason: null };
}

const publicQuestion = ({ correctAnswer: _correctAnswer, explanation: _explanation, approval: _approval, authorization: _authorization, lifecycle: _lifecycle, ...question }: MockQuestion) => question;
export function publicMockSession(session: MockSession) {
  return {
    id: session.id,
    band: session.band,
    questionSetVersion: session.questionSetVersion,
    scoringVersion: session.scoringVersion,
    questions: session.questions.map(publicQuestion),
    answers: session.answers,
    revision: session.revision,
    status: session.status,
    startedAt: session.startedAt,
    deadlineAt: session.deadlineAt,
    submittedAt: session.submittedAt,
    result: session.result,
  };
}
export function startMock(input: { band: MockBand; ownerId: string; idempotencyKey: string; now: string }): MockSession {
  const questions = mockBank(input.band);
  const gate = evaluateMockGate(input.band, questions);
  if (!gate.ready) throw new Error(gate.reason ?? "MOCK_NOT_READY");
  const duration = input.band === "basic" ? BASIC_MOCK_DURATION_SECONDS : ADVANCED_MOCK_DURATION_SECONDS;
  return {
    id: `mock_${crypto.randomUUID()}`,
    ownerId: input.ownerId,
    band: input.band,
    startIdempotencyKey: input.idempotencyKey,
    questionSetVersion: MOCK_QUESTION_SET_VERSION,
    scoringVersion: input.band === "basic" ? BASIC_MOCK_SCORING_VERSION : ADVANCED_MOCK_SCORING_VERSION,
    questions,
    answers: [],
    answerKeys: [],
    revision: 0,
    status: "in_progress",
    startedAt: input.now,
    deadlineAt: new Date(Date.parse(input.now) + duration * 1000).toISOString(),
  };
}
export function saveMockAnswer(session: MockSession, input: { questionId: string; answer: string; idempotencyKey: string; now: string }): MockSession {
  const priorKey = session.answerKeys.includes(input.idempotencyKey);
  const prior = session.answers.find((answer) => answer.idempotencyKey === input.idempotencyKey);
  if (priorKey || prior) {
    if (prior?.questionId !== input.questionId || prior?.answer !== input.answer) throw new Error("IDEMPOTENCY_KEY_REUSED");
    return session;
  }
  if (session.status !== "in_progress") throw new Error("MOCK_ALREADY_SUBMITTED");
  if (Date.parse(input.now) > Date.parse(session.deadlineAt)) throw new Error("MOCK_TIME_EXPIRED");
  const question = session.questions.find((candidate) => candidate.id === input.questionId);
  if (!question) throw new Error("MOCK_QUESTION_NOT_FOUND");
  if (!input.answer || input.answer.length > 180 || (question.options && !Object.hasOwn(question.options, input.answer))) throw new Error("INVALID_MOCK_ANSWER");
  const answer: MockAnswer = { ...input, savedAt: input.now };
  return {
    ...session,
    answers: [...session.answers.filter((candidate) => candidate.questionId !== input.questionId), answer],
    answerKeys: [...session.answerKeys, input.idempotencyKey],
    revision: session.revision + 1,
  };
}
const evidence = (items: MockResultItem[]) => items.reduce<MockResult["dimensionEvidence"]>((result, item) => {
  const prior = result[item.dimension] ?? { correct: 0, total: 0 };
  result[item.dimension] = { correct: prior.correct + (item.correct ? 1 : 0), total: prior.total + 1 };
  return result;
}, {});
export function submitMock(session: MockSession, input: { idempotencyKey: string; now: string }): { session: MockSession; result: MockResult } {
  if (session.status === "submitted" && session.result) {
    if (session.result.submitIdempotencyKey !== input.idempotencyKey) throw new Error("MOCK_ALREADY_SUBMITTED");
    return { session, result: session.result };
  }
  const items: MockResultItem[] = session.questions.map((question) => {
    const answer = session.answers.find((candidate) => candidate.questionId === question.id)?.answer;
    const correct = Boolean(answer) && (question.options ? answer === question.correctAnswer : normalizeStep7Answer(answer ?? "") === normalizeStep7Answer(question.correctAnswer));
    return { questionId: question.id, dimension: question.dimension, prompt: question.prompt, answer, correctAnswer: question.correctAnswer, correct, explanation: question.explanation };
  });
  const correctCount = items.filter((item) => item.correct).length;
  const percentage = Math.round((correctCount / items.length) * 100);
  const abilityInterval: MockAbilityInterval | undefined = session.band === "advanced" ? percentage >= 80 ? "strong" : percentage >= 40 ? "functional" : "developing" : undefined;
  const result: MockResult = {
    id: `mock_result_${crypto.randomUUID()}`,
    sessionId: session.id,
    band: session.band,
    questionSetVersion: session.questionSetVersion,
    scoringVersion: session.scoringVersion,
    submitIdempotencyKey: input.idempotencyKey,
    correctCount,
    totalCount: items.length,
    percentage,
    abilityInterval,
    dimensionEvidence: evidence(items),
    items,
    questionSnapshots: session.questions,
    nextRoutes: session.band === "basic" ? ["/mistakes", "/review", "/planner"] : ["/planner"],
    disclaimer: session.band === "advanced" ? "This unified HSK 7–9 advanced ability band result is HSKKit learning feedback, not a single-level official score." : "This raw practice score is HSKKit learning feedback, not an official HSK scaled score.",
    createdAt: input.now,
  };
  const submitted: MockSession = { ...session, status: "submitted", submittedAt: input.now, revision: session.revision + 1, result };
  return { session: submitted, result };
}
