import { normalizeStep7Answer } from "../learning/step7-content.ts";
import { PRACTICE_QUESTIONS, PRACTICE_VERSION, type PracticeQuestion } from "../practice/questions.ts";

export type MockBand = "basic" | "advanced";
export type MockDimension = "grammar" | "reading" | "listening" | "pragmatics";
export type MockAbilityInterval = "developing" | "functional" | "strong";
export const MOCK_QUESTION_SET_VERSION = "hsk3-level-diagnostic-v2";
export const BASIC_MOCK_DURATION_SECONDS = 30 * 60;
export const ADVANCED_MOCK_DURATION_SECONDS = 35 * 60;
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
  context?: string;
  options?: Record<string, string>;
  correctAnswer: string;
  explanation: string;
  audioSrc?: string;
  audioText?: string;
  instruction?: string;
  sourceGroupId?: string;
  sourceLevel?: number;
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

const QUESTIONS_PER_SKILL = 5;
const DIAGNOSTIC_SKILLS = ["grammar", "reading", "listening"] as const;
// This published passage contains a malformed sentence and must not enter a timed diagnostic.
const EXCLUDED_MOCK_SOURCE_GROUPS = new Set(["reading-library-v2-hsk9-09"]);
const fromPractice = (question: PracticeQuestion, band: MockBand): MockQuestion => ({
  id: question.id,
  contentId: question.id,
  contentVersion: question.contentVersion,
  sourceReleaseId: PRACTICE_VERSION,
  band,
  level: question.level,
  levelBand: band === "advanced" ? "7-9" : String(question.level),
  dimension: question.skill as MockDimension,
  prompt: question.prompt,
  context: question.context,
  options: { ...question.options },
  correctAnswer: question.correctAnswer,
  explanation: question.explanation,
  audioSrc: question.audioSrc,
  audioText: question.audioText,
  instruction: question.skill === "listening" ? "Listen to the recording before choosing your answer." : undefined,
  sourceGroupId: question.sourceGroupId ?? question.id,
  sourceLevel: question.sourceLevel,
  approval: "approved",
  authorization: "authorized",
  lifecycle: "published",
});

export const mockBank = (band: MockBand, targetLevel = 3): MockQuestion[] => PRACTICE_QUESTIONS
  .filter((question) => question.level === (band === "basic" ? targetLevel : 7) && DIAGNOSTIC_SKILLS.some((skill) => skill === question.skill) && !EXCLUDED_MOCK_SOURCE_GROUPS.has(question.sourceGroupId ?? ""))
  .map((question) => fromPractice(question, band));

export function evaluateMockGate(band: MockBand, questions = mockBank(band), targetLevel = 3): { ready: boolean; reason: string | null } {
  if (band === "basic" && (!Number.isInteger(targetLevel) || targetLevel < 1 || targetLevel > 6)) return { ready: false, reason: "INVALID_MOCK_LEVEL" };
  const level = band === "basic" ? targetLevel : 7;
  if (questions.length < QUESTIONS_PER_SKILL * DIAGNOSTIC_SKILLS.length) return { ready: false, reason: "CONTENT_COUNT_GATE" };
  if (questions.some((question) => question.band !== band || question.approval !== "approved" || question.authorization !== "authorized" || question.lifecycle !== "published")) return { ready: false, reason: "CONTENT_APPROVAL_GATE" };
  if (questions.some((question) => question.level !== level)) return { ready: false, reason: "LEVEL_COVERAGE_GATE" };
  if (new Set(questions.map((question) => question.id)).size !== questions.length) return { ready: false, reason: "QUESTION_ID_GATE" };
  if (questions.some((question) => !question.correctAnswer || !question.explanation || !question.contentVersion || !question.sourceReleaseId)) return { ready: false, reason: "SCORING_GATE" };
  if (DIAGNOSTIC_SKILLS.some((skill) => questions.filter((question) => question.dimension === skill).length < QUESTIONS_PER_SKILL)) return { ready: false, reason: "SKILL_COVERAGE_GATE" };
  if (band === "advanced" && DIAGNOSTIC_SKILLS.some((skill) => [7, 8, 9].some((sourceLevel) => !questions.some((question) => question.dimension === skill && question.sourceLevel === sourceLevel)))) return { ready: false, reason: "ADVANCED_LEVEL_COVERAGE_GATE" };
  if (DIAGNOSTIC_SKILLS.filter((skill) => skill !== "grammar").some((skill) => new Set(questions.filter((question) => question.dimension === skill).map((question) => question.sourceGroupId)).size < QUESTIONS_PER_SKILL)) return { ready: false, reason: "SOURCE_DIVERSITY_GATE" };
  if (questions.some((question) => question.dimension === "listening" && !question.audioSrc)) return { ready: false, reason: "LISTENING_AUDIO_GATE" };
  return { ready: true, reason: null };
}

const hash = (value: string) => {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return result >>> 0;
};

export function selectMockQuestions(pool: MockQuestion[], seed: string, recentQuestionIds: readonly string[] = [], recentGroupIds: readonly string[] = []): MockQuestion[] {
  const recentQuestions = new Set(recentQuestionIds);
  const recentGroups = new Set(recentGroupIds);
  const selected = DIAGNOSTIC_SKILLS.flatMap((skill) => {
    const groupUsed = new Set<string>();
    const ranked = pool.filter((question) => question.dimension === skill).sort((left, right) => {
      const penalty = (question: MockQuestion) => Number(recentQuestions.has(question.id)) * 2 + Number(recentGroups.has(question.sourceGroupId ?? question.id));
      return penalty(left) - penalty(right) || hash(`${seed}:${left.id}`) - hash(`${seed}:${right.id}`) || left.id.localeCompare(right.id);
    });
    const chosen: MockQuestion[] = [];
    const add = (question: MockQuestion) => {
      const group = question.sourceGroupId ?? question.id;
      if (groupUsed.has(group)) return;
      groupUsed.add(group);
      chosen.push(question);
    };
    if (pool[0]?.band === "advanced") {
      for (const sourceLevel of [7, 8, 9]) {
        const candidate = ranked.find((question) => question.sourceLevel === sourceLevel && !groupUsed.has(question.sourceGroupId ?? question.id));
        if (candidate) add(candidate);
      }
    }
    for (const question of ranked) {
      if (chosen.length === QUESTIONS_PER_SKILL) break;
      add(question);
    }
    if (chosen.length !== QUESTIONS_PER_SKILL) throw new Error("SOURCE_DIVERSITY_GATE");
    return chosen;
  });
  return selected.sort((left, right) => hash(`${seed}:order:${left.id}`) - hash(`${seed}:order:${right.id}`) || left.id.localeCompare(right.id));
}

const publicQuestion = ({ correctAnswer: _correctAnswer, explanation: _explanation, approval: _approval, authorization: _authorization, lifecycle: _lifecycle, audioText: _audioText, ...question }: MockQuestion) => question;
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
export function startMock(input: { band: MockBand; ownerId: string; idempotencyKey: string; now: string; targetLevel?: number; recentQuestionIds?: string[]; recentGroupIds?: string[] }): MockSession {
  const pool = mockBank(input.band, input.targetLevel);
  const gate = evaluateMockGate(input.band, pool, input.targetLevel);
  if (!gate.ready) throw new Error(gate.reason ?? "MOCK_NOT_READY");
  const questions = selectMockQuestions(pool, input.idempotencyKey, input.recentQuestionIds, input.recentGroupIds);
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
    dimensionEvidence: evidence(items),
    items,
    questionSnapshots: session.questions,
    nextRoutes: session.band === "basic" ? ["/mistakes", "/review", "/planner"] : ["/planner"],
    disclaimer: session.band === "advanced" ? "This is feedback on 15 selected HSK 7-9 practice questions. It is not an official score or a reliable estimate of overall HSK 7-9 ability; writing, translation and speaking were not assessed." : "This is feedback on 15 selected practice questions at one HSK level. It is not an official exam or scaled score; writing and speaking were not assessed.",
    createdAt: input.now,
  };
  const submitted: MockSession = { ...session, status: "submitted", submittedAt: input.now, revision: session.revision + 1, result };
  return { session: submitted, result };
}
