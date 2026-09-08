import { createHash } from "node:crypto";
import { recordAttempt, type LearningState, type PracticeSession, type QuestionReport } from "../learning/domain.ts";
import { practiceQuestionLifecycle, practiceQuestionSet, publicPracticeQuestion, trustedPracticeQuestionVersion } from "./questions.ts";

const stableId = (prefix: string, key: string) => `${prefix}_${createHash("sha256").update(key).digest("base64url")}`;
const PRACTICE_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const sessions = (state: LearningState) => state.practiceSessions ?? [];
const reports = (state: LearningState) => state.questionReports ?? [];
const expiresAt = (session: PracticeSession) => session.expiresAt ?? new Date(new Date(session.createdAt).getTime() + PRACTICE_SESSION_TTL_MS).toISOString();
const isExpired = (session: PracticeSession, now: string) => session.status === "in_progress" && new Date(now).getTime() >= new Date(expiresAt(session)).getTime();

export function isPracticeSessionCurrent(session: PracticeSession) {
  const snapshots = session.questionIds.map((id) => trustedPracticeQuestionVersion(id, session.questionVersion));
  if (!snapshots.length || snapshots.some((question) => !question)) return false;
  return session.questionIds.every((id) => practiceQuestionLifecycle(id) === "published");
}

export function createPracticeSession(state: LearningState, input: {
  ownerId: string;
  level: number;
  skill: string;
  idempotencyKey: string;
  now: string;
  dailySessionId?: string;
  dailyItemId?: string;
}) {
  if ((input.dailySessionId && !input.dailyItemId) || (!input.dailySessionId && input.dailyItemId)) throw new Error("INVALID_DAILY_PRACTICE_BINDING");
  const questions = practiceQuestionSet(input.level, input.skill);
  if (!questions.length) throw new Error("PRACTICE_NOT_READY");
  const questionVersion = questions[0].contentVersion;
  if (questions.some((question) => question.contentVersion !== questionVersion)) throw new Error("PRACTICE_CONTENT_VERSION_MISMATCH");
  const currentQuestionIds = new Set(questions.map((question) => question.id));
  const priorByKey = sessions(state).find((session) => session.ownerId === input.ownerId && session.idempotencyKey === input.idempotencyKey);
  if (priorByKey) {
    if (priorByKey.level !== input.level || priorByKey.skill !== input.skill || priorByKey.dailySessionId !== input.dailySessionId || priorByKey.dailyItemId !== input.dailyItemId) throw new Error("IDEMPOTENCY_KEY_REUSED");
    if (!isPracticeSessionCurrent(priorByKey)) throw new Error("PRACTICE_SESSION_STALE");
    return { state, session: priorByKey };
  }
  if (input.dailySessionId) {
    const daily = state.dailySessions.find((candidate) => candidate.id === input.dailySessionId && candidate.ownerId === input.ownerId);
    const firstPending = daily?.items.find((item) => item.status === "pending");
    if (!daily || !firstPending || firstPending.id !== input.dailyItemId || firstPending.kind !== "practice" || firstPending.contentId !== `practice:${input.level}:${input.skill}` || firstPending.contentVersion !== questionVersion) throw new Error("INVALID_DAILY_PRACTICE_BINDING");
  }
  const active = [...sessions(state)].reverse().find((session) => session.ownerId === input.ownerId && session.level === input.level && session.skill === input.skill && session.questionVersion === questionVersion && session.questionIds.every((id) => currentQuestionIds.has(id)) && isPracticeSessionCurrent(session) && session.dailySessionId === input.dailySessionId && session.dailyItemId === input.dailyItemId && session.status === "in_progress" && !isExpired(session, input.now));
  if (active) return { state, session: active };
  const session: PracticeSession = {
    id: stableId("practice_session", `${input.ownerId}:${questionVersion}:${input.idempotencyKey}`),
    ownerId: input.ownerId,
    idempotencyKey: input.idempotencyKey,
    mode: "practice",
    standardVersion: "HSK 3.0",
    level: input.level,
    skill: input.skill,
    questionVersion,
    questionIds: questions.map((question) => question.id),
    dailySessionId: input.dailySessionId,
    dailyItemId: input.dailyItemId,
    answers: [],
    status: "in_progress",
    createdAt: input.now,
    expiresAt: new Date(new Date(input.now).getTime() + PRACTICE_SESSION_TTL_MS).toISOString(),
  };
  return { state: { ...state, practiceSessions: [...sessions(state), session] }, session };
}

export function resumePracticeSession(state: LearningState, ownerId: string, now: string) {
  return [...sessions(state)].reverse().find((session) => session.ownerId === ownerId && session.status === "in_progress" && !isExpired(session, now) && isPracticeSessionCurrent(session));
}

export function selectPracticeSession(state: LearningState, input: {
  ownerId: string;
  level: number;
  skill: string;
  dailySessionId?: string;
  dailyItemId?: string;
}, now?: string) {
  const selected = [...sessions(state)].reverse().find((session) => session.ownerId === input.ownerId
    && session.level === input.level
    && session.skill === input.skill
    && session.dailySessionId === input.dailySessionId
    && session.dailyItemId === input.dailyItemId
    && isPracticeSessionCurrent(session));
  return selected && (!now || !isExpired(selected, now)) ? selected : undefined;
}

function feedbackFor(session: PracticeSession) {
  return session.answers.map((answer) => {
    const question = trustedPracticeQuestionVersion(answer.questionId, session.questionVersion);
    if (!question) throw new Error("PRACTICE_QUESTION_WITHDRAWN");
    return {
      questionId: answer.questionId,
      selectedAnswer: answer.answer,
      correct: answer.correct,
      correctAnswer: question.correctAnswer,
      correctAnswerText: question.options[question.correctAnswer],
      explanation: question.explanation,
      weaknessTag: question.weaknessTag,
    };
  });
}

export function publicPracticeSession(session: PracticeSession, now = session.createdAt) {
  const questions = session.questionIds.map((questionId) => {
    if (practiceQuestionLifecycle(questionId) === "withdrawn") throw new Error("PRACTICE_QUESTION_WITHDRAWN");
    const question = trustedPracticeQuestionVersion(questionId, session.questionVersion);
    if (!question) throw new Error("PRACTICE_QUESTION_WITHDRAWN");
    return publicPracticeQuestion(question);
  });
  return {
    id: session.id,
    mode: session.mode,
    standardVersion: session.standardVersion,
    level: session.level,
    skill: session.skill,
    questionVersion: session.questionVersion,
    status: isExpired(session, now) ? "expired" as const : session.status,
    createdAt: session.createdAt,
    expiresAt: expiresAt(session),
    completedAt: session.completedAt,
    result: session.result,
    questions,
    feedback: feedbackFor(session),
  };
}

function finishTodayPractice(state: LearningState, session: PracticeSession, completedAt: string) {
  if (!session.dailySessionId || !session.dailyItemId) return state;
  return {
    ...state,
    dailySessions: state.dailySessions.map((daily) => {
      if (daily.ownerId !== session.ownerId || daily.id !== session.dailySessionId) return daily;
      const firstPendingId = daily.items.find((item) => item.status === "pending")?.id;
      let changed = false;
      let items = daily.items.map((item) => {
        if (item.id === firstPendingId && item.id === session.dailyItemId && item.kind === "practice" && item.contentId === `practice:${session.level}:${session.skill}` && item.contentVersion === session.questionVersion && item.status === "pending") {
          changed = true;
          return { ...item, status: "completed" as const };
        }
        return item;
      });
      if (!changed) return daily;
      const summaryReady = items.filter((item) => item.kind !== "summary").every((item) => item.status !== "pending");
      if (summaryReady) items = items.map((item) => item.kind === "summary" ? { ...item, status: "completed" as const } : item);
      return { ...daily, items, completedAt: summaryReady ? (daily.completedAt ?? completedAt) : daily.completedAt };
    }),
  };
}

export function answerPracticeQuestion(state: LearningState, input: {
  ownerId: string;
  sessionId: string;
  questionId: string;
  answer: string;
  idempotencyKey: string;
  now: string;
}) {
  const session = sessions(state).find((candidate) => candidate.id === input.sessionId && candidate.ownerId === input.ownerId);
  if (!session) throw new Error("PRACTICE_SESSION_NOT_FOUND");
  const replay = session.answers.find((answer) => answer.idempotencyKey === input.idempotencyKey);
  if (replay) {
    if (replay.questionId !== input.questionId || replay.answer !== input.answer) throw new Error("IDEMPOTENCY_KEY_REUSED");
    const feedback = feedbackFor(session).find((entry) => entry.questionId === replay.questionId)!;
    return { state, session, feedback };
  }
  if (isExpired(session, input.now)) throw new Error("PRACTICE_SESSION_EXPIRED");
  const question = trustedPracticeQuestionVersion(input.questionId, session.questionVersion);
  if (practiceQuestionLifecycle(input.questionId) !== "published" || !question || !session.questionIds.includes(question.id) || question.contentVersion !== session.questionVersion) throw new Error("PRACTICE_QUESTION_WITHDRAWN");
  if (!Object.hasOwn(question.options, input.answer)) throw new Error("INVALID_PRACTICE_ANSWER");
  if (session.status !== "in_progress") throw new Error("PRACTICE_SESSION_CLOSED");
  if (session.answers.some((answer) => answer.questionId === question.id)) throw new Error("PRACTICE_QUESTION_ALREADY_ANSWERED");
  const attempted = recordAttempt(state, {
    idempotencyKey: input.idempotencyKey,
    contentId: `practice:${question.id}`,
    contentVersion: question.contentVersion,
    dimension: question.skill === "listening" ? "audio" : "reading",
    answer: input.answer,
    correctAnswer: question.correctAnswer,
    prompt: [question.context, question.prompt].filter(Boolean).join(" — "),
    userAnswerText: question.options[input.answer as keyof typeof question.options],
    correctAnswerText: question.options[question.correctAnswer],
    observedAt: input.now,
    mode: "practice",
    skill: session.skill,
    standardVersion: session.standardVersion,
    sessionId: session.id,
    questionVersion: session.questionVersion,
    dailySessionId: session.dailySessionId,
    dailyItemId: session.dailyItemId,
    reviewSnapshot: {
      level: question.level,
      levelBand: question.levelBand === "7-9" ? "7–9" : question.levelBand,
      skillLabel: question.skill[0].toUpperCase() + question.skill.slice(1),
      topic: question.weaknessTag,
      context: question.context,
      prompt: question.prompt,
      answerMode: "choice",
      options: { ...question.options },
      correctAnswer: question.correctAnswer,
      correctAnswerText: question.options[question.correctAnswer],
      explanation: question.explanation,
      audioSrc: question.audioSrc,
      audioText: question.audioText,
    },
  });
  const answers = [...session.answers, {
    questionId: question.id,
    answer: input.answer,
    idempotencyKey: input.idempotencyKey,
    attemptId: attempted.attempt.id,
    correct: attempted.attempt.correct,
    answeredAt: input.now,
  }];
  const complete = answers.length === session.questionIds.length;
  const updated: PracticeSession = {
    ...session,
    answers,
    status: complete ? "completed" : "in_progress",
    completedAt: complete ? input.now : undefined,
    result: complete ? {
      correctCount: answers.filter((answer) => answer.correct).length,
      totalCount: answers.length,
      weaknessTags: [...new Set(answers.filter((answer) => !answer.correct).map((answer) => trustedPracticeQuestionVersion(answer.questionId, session.questionVersion)?.weaknessTag).filter((value): value is string => Boolean(value)))],
    } : undefined,
  };
  const nextState = { ...attempted.state, practiceSessions: sessions(attempted.state).map((candidate) => candidate.id === updated.id ? updated : candidate) };
  const finalState = complete ? finishTodayPractice(nextState, updated, input.now) : nextState;
  return { state: finalState, session: updated, feedback: feedbackFor(updated).at(-1)! };
}

export function reportPracticeQuestion(state: LearningState, input: {
  ownerId: string;
  sessionId: string;
  questionId: string;
  reason: string;
  idempotencyKey: string;
  now: string;
}) {
  const replay = reports(state).find((report) => report.ownerId === input.ownerId && report.idempotencyKey === input.idempotencyKey);
  if (replay) {
    if (replay.sessionId !== input.sessionId || replay.questionId !== input.questionId || replay.reason !== input.reason) throw new Error("IDEMPOTENCY_KEY_REUSED");
    return { state, report: replay };
  }
  const session = sessions(state).find((candidate) => candidate.id === input.sessionId && candidate.ownerId === input.ownerId);
  if (!session || !session.questionIds.includes(input.questionId)) throw new Error("PRACTICE_QUESTION_NOT_FOUND");
  const question = trustedPracticeQuestionVersion(input.questionId, session.questionVersion);
  if (!question) throw new Error("PRACTICE_QUESTION_WITHDRAWN");
  const report: QuestionReport = {
    id: stableId("question_report", `${input.ownerId}:${input.sessionId}:${input.questionId}:${input.idempotencyKey}`),
    ownerId: input.ownerId,
    sessionId: input.sessionId,
    questionId: input.questionId,
    questionVersion: question.contentVersion,
    reason: input.reason,
    idempotencyKey: input.idempotencyKey,
    status: "open",
    createdAt: input.now,
  };
  return { state: { ...state, questionReports: [...reports(state), report] }, report };
}
