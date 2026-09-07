import { createHash } from "node:crypto";
import type {
  LearningState,
  PlacementResult,
  PlacementSession,
} from "../learning/domain.ts";
import {
  ADAPTIVE_PLACEMENT_MAX_QUESTIONS,
  ADAPTIVE_PLACEMENT_MIN_QUESTIONS,
  PLACEMENT_INITIAL_QUESTIONS,
  PLACEMENT_QUESTIONS,
  PLACEMENT_VERSION,
  PREVIOUS_ADAPTIVE_PLACEMENT_VERSION,
  placementCatalog,
  trustedPlacementQuestion,
  type PlacementQuestion,
  type PlacementSkill,
} from "./questions.ts";

const stableId = (prefix: string, key: string) =>
  `${prefix}_${createHash("sha256").update(key).digest("base64url")}`;

const sessions = (state: LearningState) => state.placementSessions ?? [];
const results = (state: LearningState) => state.placementResults ?? [];
const PLACEMENT_SESSION_TTL_MS = 7 * 24 * 60 * 60_000;
const PLACEMENT_RETAKE_COOLDOWN_MS = 24 * 60 * 60_000;
const ADAPTIVE_SKILLS: PlacementSkill[] = ["vocabulary", "grammar", "reading", "listening"];
const INITIAL_TIERS = [[1, 2], [3, 4], [5, 6, 7]] as const;

type EvaluatedAnswer = { question: PlacementQuestion; correct: boolean };

function evaluatedAnswers(session: PlacementSession) {
  return session.answers.flatMap((answer) => {
    const question = trustedPlacementQuestion(answer.questionId, session.questionVersion);
    return question ? [{ question, correct: answer.answer === question.correctAnswer }] : [];
  });
}

export function adaptivePlacementEstimate(evaluated: EvaluatedAnswer[], maxLevel = 9) {
  if (evaluated.length === 0) return Math.ceil(maxLevel / 2);
  let bestLevel = 1;
  let bestLikelihood = Number.NEGATIVE_INFINITY;
  for (let candidate = 1; candidate <= maxLevel * 20; candidate += 1) {
    const ability = candidate / 20;
    const likelihood = evaluated.reduce((sum, entry) => {
      const probability = 1 / (1 + Math.exp((entry.question.level - ability) * 1.35));
      return sum + Math.log(entry.correct ? probability : 1 - probability);
    }, 0);
    if (likelihood > bestLikelihood) {
      bestLikelihood = likelihood;
      bestLevel = ability;
    }
  }
  return Math.min(maxLevel, Math.max(1, bestLevel));
}

const rank = (seed: string, value: string) => createHash("sha256").update(`${seed}:${value}`).digest("hex");

function recentPlacementQuestionIds(state: LearningState, ownerId: string) {
  return new Set(sessions(state)
    .filter((session) => session.ownerId === ownerId)
    .slice(-2)
    .flatMap((session) => session.questionIds));
}

function stratifiedInitialQuestions(catalog: PlacementQuestion[], seed: string, recent: Set<string>) {
  const selected: PlacementQuestion[] = [];
  for (const tier of INITIAL_TIERS) {
    for (const skill of ADAPTIVE_SKILLS) {
      const candidates = catalog.filter((question) => question.skill === skill && tier.some((level) => level === question.level));
      const fresh = candidates.filter((question) => !recent.has(question.id));
      const pool = fresh.length ? fresh : candidates;
      const question = [...pool].sort((a, b) => rank(seed, a.id).localeCompare(rank(seed, b.id)))[0];
      if (!question) throw new Error("PLACEMENT_NO_QUESTIONS");
      selected.push(question);
    }
  }
  return selected;
}

function adaptivePlacementComplete(evaluated: EvaluatedAnswer[], maxLevel = 7) {
  if (evaluated.length < ADAPTIVE_PLACEMENT_MIN_QUESTIONS) return false;
  if (evaluated.length >= ADAPTIVE_PLACEMENT_MAX_QUESTIONS) return true;
  const skillCounts = ADAPTIVE_SKILLS.map((skill) => evaluated.filter((entry) => entry.question.skill === skill).length);
  if (skillCounts.some((count) => count < 4)) return false;
  const estimate = adaptivePlacementEstimate(evaluated, maxLevel);
  if (estimate <= 1.15 || estimate >= maxLevel - 0.15) return true;
  const unexpected = evaluated.filter((entry) =>
    entry.correct ? entry.question.level > estimate + 1.5 : entry.question.level < estimate - 1.5).length;
  return unexpected <= 3;
}

function nextAdaptiveQuestion(
  evaluated: EvaluatedAnswer[],
  catalog: PlacementQuestion[],
  seed = "adaptive",
  recent = new Set<string>(),
  maxLevel = 7,
) {
  const used = new Set(evaluated.map((entry) => entry.question.id));
  const counts = new Map(ADAPTIVE_SKILLS.map((skill) => [skill, evaluated.filter((entry) => entry.question.skill === skill).length]));
  const minimum = Math.min(...counts.values());
  const offset = evaluated.length % ADAPTIVE_SKILLS.length;
  const skill = [...ADAPTIVE_SKILLS.slice(offset), ...ADAPTIVE_SKILLS.slice(0, offset)]
    .find((candidate) => counts.get(candidate) === minimum) ?? ADAPTIVE_SKILLS[0];
  const targetLevel = Math.round(adaptivePlacementEstimate(evaluated, maxLevel));
  const candidates = catalog.filter((question) => question.skill === skill && !used.has(question.id));
  const fresh = candidates.filter((question) => !recent.has(question.id));
  return [...(fresh.length ? fresh : candidates)]
    .sort((a, b) => Math.abs(a.level - targetLevel) - Math.abs(b.level - targetLevel)
      || rank(seed, a.id).localeCompare(rank(seed, b.id)))[0];
}

export function placementSessionExpiresAt(session: PlacementSession) {
  return session.expiresAt
    ?? new Date(Date.parse(session.createdAt) + PLACEMENT_SESSION_TTL_MS).toISOString();
}

export function placementSessionExpired(session: PlacementSession, now: string) {
  return Date.parse(placementSessionExpiresAt(session)) <= Date.parse(now);
}

export function createPlacementSession(
  state: LearningState,
  input: { ownerId: string; idempotencyKey: string; now: string; catalog?: PlacementQuestion[] },
) {
  const catalog = input.catalog ?? PLACEMENT_QUESTIONS;
  if (catalog.length === 0) throw new Error("PLACEMENT_NO_QUESTIONS");
  const questionVersion = catalog[0].contentVersion;
  if (catalog.some((question) => question.contentVersion !== questionVersion)) {
    throw new Error("PLACEMENT_CONTENT_VERSION_MISMATCH");
  }
  const prior = sessions(state).find(
    (session) => session.ownerId === input.ownerId
      && session.idempotencyKey === input.idempotencyKey,
  );
  if (prior) return { state, session: prior };

  if (!input.catalog) {
    const latestSubmitted = [...sessions(state)].reverse().find(
      (session) => session.ownerId === input.ownerId && session.status === "submitted",
    );
    const latestResult = latestSubmitted?.resultId
      ? results(state).find((result) => result.id === latestSubmitted.resultId)
      : undefined;
    const retakeAvailableAt = latestResult?.retakeAvailableAt
      ?? (latestSubmitted?.submittedAt
        ? new Date(Date.parse(latestSubmitted.submittedAt) + PLACEMENT_RETAKE_COOLDOWN_MS).toISOString()
        : undefined);
    if (retakeAvailableAt && Date.parse(input.now) < Date.parse(retakeAvailableAt)) {
      throw new Error("PLACEMENT_RETAKE_COOLDOWN");
    }
  }

  const adaptive = !input.catalog && questionVersion === PLACEMENT_VERSION;
  const recent = recentPlacementQuestionIds(state, input.ownerId);
  const initialQuestions = adaptive
    ? stratifiedInitialQuestions(catalog, `${input.ownerId}:${input.idempotencyKey}`, recent)
    : [];
  if (adaptive && initialQuestions.length !== PLACEMENT_INITIAL_QUESTIONS) throw new Error("PLACEMENT_NO_QUESTIONS");
  const session: PlacementSession = {
    id: stableId(
      "placement_session",
      `${input.ownerId}:${questionVersion}:${input.idempotencyKey}`,
    ),
    ownerId: input.ownerId,
    idempotencyKey: input.idempotencyKey,
    questionVersion,
    questionIds: adaptive ? initialQuestions.map((question) => question.id) : catalog.map((question) => question.id),
    answers: [],
    status: "in_progress",
    createdAt: input.now,
    expiresAt: new Date(Date.parse(input.now) + PLACEMENT_SESSION_TTL_MS).toISOString(),
    ...(adaptive ? {
      adaptiveComplete: false,
      adaptiveMinQuestions: ADAPTIVE_PLACEMENT_MIN_QUESTIONS,
      adaptiveMaxQuestions: ADAPTIVE_PLACEMENT_MAX_QUESTIONS,
    } : {}),
  };
  return {
    state: { ...state, placementSessions: [...sessions(state), session] },
    session,
  };
}

export function resumePlacement(state: LearningState, ownerId: string, now = new Date().toISOString()) {
  return [...sessions(state)]
    .reverse()
    .find((session) => session.ownerId === ownerId
      && session.status === "in_progress"
      && !placementSessionExpired(session, now));
}

export function expiredPlacement(state: LearningState, ownerId: string, now = new Date().toISOString()) {
  return [...sessions(state)]
    .reverse()
    .find((session) => session.ownerId === ownerId
      && session.status === "in_progress"
      && placementSessionExpired(session, now));
}

export function answerPlacementQuestion(
  state: LearningState,
  input: {
    sessionId: string;
    questionId: string;
    answer: string;
    idempotencyKey: string;
    now: string;
  },
) {
  const session = sessions(state).find((candidate) => candidate.id === input.sessionId);
  if (!session) throw new Error("PLACEMENT_SESSION_NOT_FOUND");
  if (placementSessionExpired(session, input.now)) throw new Error("PLACEMENT_SESSION_EXPIRED");
  if (session.status !== "in_progress") throw new Error("PLACEMENT_SESSION_CLOSED");
  if (!session.questionIds.includes(input.questionId) || !trustedPlacementQuestion(input.questionId, session.questionVersion)) {
    throw new Error("PLACEMENT_QUESTION_NOT_FOUND");
  }
  const replay = session.answers.find(
    (answer) => answer.idempotencyKey === input.idempotencyKey,
  );
  if (replay) return { state, session };
  const existingAnswer = session.answers.find((answer) => answer.questionId === input.questionId);
  if (session.adaptiveMinQuestions && !existingAnswer && session.questionIds[session.answers.length] !== input.questionId) {
    throw new Error("PLACEMENT_QUESTION_OUT_OF_SEQUENCE");
  }

  const nextAnswer = {
    questionId: input.questionId,
    answer: input.answer,
    idempotencyKey: input.idempotencyKey,
    answeredAt: input.now,
  };
  let updated: PlacementSession = {
    ...session,
    answers: [
      ...session.answers.filter((answer) => answer.questionId !== input.questionId),
      nextAnswer,
    ],
  };
  const adaptiveVersion = session.questionVersion === PLACEMENT_VERSION
    || session.questionVersion === PREVIOUS_ADAPTIVE_PLACEMENT_VERSION;
  if (session.adaptiveMinQuestions && adaptiveVersion
    && updated.answers.length === updated.questionIds.length) {
    const evaluated = evaluatedAnswers(updated);
    const maxLevel = session.questionVersion === PLACEMENT_VERSION ? 7 : 9;
    const complete = adaptivePlacementComplete(evaluated, maxLevel);
    const next = complete ? undefined : nextAdaptiveQuestion(
      evaluated,
      placementCatalog(session.questionVersion),
      updated.id,
      recentPlacementQuestionIds(state, session.ownerId),
      maxLevel,
    );
    if (!complete && !next) throw new Error("PLACEMENT_NO_QUESTIONS");
    updated = {
      ...updated,
      questionIds: next ? [...updated.questionIds, next.id] : updated.questionIds,
      adaptiveComplete: complete,
    };
  }
  return {
    state: {
      ...state,
      placementSessions: sessions(state).map((candidate) => candidate.id === updated.id ? updated : candidate),
    },
    session: updated,
  };
}

export function submitPlacement(
  state: LearningState,
  input: { sessionId: string; idempotencyKey: string; now: string },
) {
  const session = sessions(state).find((candidate) => candidate.id === input.sessionId);
  if (!session) throw new Error("PLACEMENT_SESSION_NOT_FOUND");
  if (session.resultId) {
    const prior = results(state).find((result) => result.id === session.resultId);
    if (!prior) throw new Error("PLACEMENT_RESULT_NOT_FOUND");
    return { state, session, result: prior };
  }
  if (placementSessionExpired(session, input.now)) throw new Error("PLACEMENT_SESSION_EXPIRED");
  if (session.status !== "in_progress") throw new Error("PLACEMENT_SESSION_CLOSED");
  if (session.answers.length !== session.questionIds.length) {
    throw new Error("PLACEMENT_INCOMPLETE");
  }

  const evaluated = session.questionIds.map((questionId) => {
    const question = trustedPlacementQuestion(questionId, session.questionVersion);
    const answer = session.answers.find((candidate) => candidate.questionId === questionId);
    if (!question || !answer) throw new Error("PLACEMENT_INCOMPLETE");
    return { question, correct: answer.answer === question.correctAnswer };
  });
  const correctCount = evaluated.filter((entry) => entry.correct).length;
  const correctTextCount = evaluated.filter((entry) => entry.question.skill !== "listening" && entry.correct).length;
  const currentAdaptive = session.questionVersion === PLACEMENT_VERSION;
  const recommendedLevel = session.adaptiveMinQuestions
    ? Math.round(adaptivePlacementEstimate(evaluated, currentAdaptive ? 7 : 9))
    : Math.min(9, Math.max(1, correctTextCount));
  const hasListeningEvidence = evaluated.some((entry) => entry.question.skill === "listening");
  const listeningCorrect = evaluated.filter((entry) => entry.question.skill === "listening" && entry.correct).length;
  const skillPerformance = Object.fromEntries(ADAPTIVE_SKILLS.map((skill) => {
    const measured = evaluated.filter((entry) => entry.question.skill === skill);
    const correct = measured.filter((entry) => entry.correct).length;
    return [skill, { correct, total: measured.length, accuracy: measured.length ? Math.round(correct / measured.length * 100) : 0 }];
  }));
  const weakSkills = ADAPTIVE_SKILLS.filter((skill) => {
    const performance = skillPerformance[skill];
    return performance.total > 0 && performance.accuracy < 65;
  });
  const adaptiveMeasuredSkills = ADAPTIVE_SKILLS.filter((skill) => evaluated.some((entry) => entry.question.skill === skill));
  const estimate = currentAdaptive ? adaptivePlacementEstimate(evaluated, 7) : 0;
  const boundaryConfidence = currentAdaptive && (estimate <= 1.15 || estimate >= 6.85);
  const unexpected = currentAdaptive ? evaluated.filter((entry) =>
    entry.correct ? entry.question.level > estimate + 1.5 : entry.question.level < estimate - 1.5).length : 0;
  const adaptiveHighConfidence = Boolean(session.adaptiveComplete)
    && evaluated.length >= ADAPTIVE_PLACEMENT_MIN_QUESTIONS
    && adaptiveMeasuredSkills.length === ADAPTIVE_SKILLS.length
    && (boundaryConfidence || unexpected <= 3);
  const result: PlacementResult = {
    id: stableId("placement_result", `${session.id}:${input.idempotencyKey}`),
    sessionId: session.id,
    submitIdempotencyKey: input.idempotencyKey,
    questionVersion: session.questionVersion,
    recommendedLevel,
    correctCount,
    totalCount: evaluated.length,
    confidence: !hasListeningEvidence ? "low" : adaptiveHighConfidence ? "high" : "medium",
    missingDimensions: hasListeningEvidence ? [] : ["listening"],
    weakSkills,
    skillPerformance,
    evidenceSummary: hasListeningEvidence
      ? `${correctCount} of ${evaluated.length} diagnostic items were answered correctly. Listening was measured with ${listeningCorrect} of ${evaluated.filter((entry) => entry.question.skill === "listening").length} approved audio items correct.`
      : `${correctCount} of ${evaluated.length} diagnostic items were answered correctly. Listening was not measured.`,
    disclaimer: "This is a learning suggestion, not an official HSK score, certificate, or guarantee.",
    createdAt: input.now,
    retakeAvailableAt: new Date(Date.parse(input.now) + PLACEMENT_RETAKE_COOLDOWN_MS).toISOString(),
  };
  const updated: PlacementSession = {
    ...session,
    status: "submitted",
    submittedAt: input.now,
    resultId: result.id,
  };
  const nextState: LearningState = {
    ...state,
    placementSessions: sessions(state).map((candidate) =>
      candidate.id === updated.id ? updated : candidate),
    placementResults: [...results(state), result],
  };
  return { state: nextState, session: updated, result };
}

export function restartPlacement(
  state: LearningState,
  input: {
    ownerId: string;
    previousSessionId: string;
    idempotencyKey: string;
    now: string;
  },
) {
  const prior = sessions(state).find((session) => session.id === input.previousSessionId);
  if (!prior || prior.ownerId !== input.ownerId) {
    throw new Error("PLACEMENT_SESSION_NOT_FOUND");
  }
  const priorResult = prior.resultId
    ? results(state).find((result) => result.id === prior.resultId)
    : undefined;
  const retakeAvailableAt = priorResult?.retakeAvailableAt
    ?? (prior.submittedAt ? new Date(Date.parse(prior.submittedAt) + PLACEMENT_RETAKE_COOLDOWN_MS).toISOString() : undefined);
  if (retakeAvailableAt && Date.parse(input.now) < Date.parse(retakeAvailableAt)) {
    throw new Error("PLACEMENT_RETAKE_COOLDOWN");
  }
  const abandoned = sessions(state).map((session) =>
    session.id === prior.id && session.status === "in_progress"
      ? { ...session, status: "abandoned" as const }
      : session,
  );
  return createPlacementSession(
    { ...state, placementSessions: abandoned },
    { ownerId: input.ownerId, idempotencyKey: input.idempotencyKey, now: input.now },
  );
}

export function placementResult(state: LearningState, ownerId: string, resultId: string) {
  const result = results(state).find((candidate) => candidate.id === resultId);
  if (!result) return undefined;
  const session = sessions(state).find((candidate) => candidate.id === result.sessionId);
  return session?.ownerId === ownerId ? result : undefined;
}
