import { createHash } from "node:crypto";
import type {
  LearningState,
  PlacementResult,
  PlacementSession,
} from "../learning/domain.ts";
import {
  PLACEMENT_QUESTIONS,
  PLACEMENT_VERSION,
  trustedPlacementQuestion,
} from "./questions.ts";

const stableId = (prefix: string, key: string) =>
  `${prefix}_${createHash("sha256").update(key).digest("base64url")}`;

const sessions = (state: LearningState) => state.placementSessions ?? [];
const results = (state: LearningState) => state.placementResults ?? [];

export function createPlacementSession(
  state: LearningState,
  input: { ownerId: string; idempotencyKey: string; now: string },
) {
  const prior = sessions(state).find(
    (session) => session.ownerId === input.ownerId
      && session.idempotencyKey === input.idempotencyKey,
  );
  if (prior) return { state, session: prior };

  const session: PlacementSession = {
    id: stableId(
      "placement_session",
      `${input.ownerId}:${PLACEMENT_VERSION}:${input.idempotencyKey}`,
    ),
    ownerId: input.ownerId,
    idempotencyKey: input.idempotencyKey,
    questionVersion: PLACEMENT_VERSION,
    questionIds: PLACEMENT_QUESTIONS.map((question) => question.id),
    answers: [],
    status: "in_progress",
    createdAt: input.now,
  };
  return {
    state: { ...state, placementSessions: [...sessions(state), session] },
    session,
  };
}

export function resumePlacement(state: LearningState, ownerId: string) {
  return [...sessions(state)]
    .reverse()
    .find((session) => session.ownerId === ownerId && session.status === "in_progress");
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
  if (session.status !== "in_progress") throw new Error("PLACEMENT_SESSION_CLOSED");
  if (!session.questionIds.includes(input.questionId) || !trustedPlacementQuestion(input.questionId)) {
    throw new Error("PLACEMENT_QUESTION_NOT_FOUND");
  }
  const replay = session.answers.find(
    (answer) => answer.idempotencyKey === input.idempotencyKey,
  );
  if (replay) return { state, session };

  const nextAnswer = {
    questionId: input.questionId,
    answer: input.answer,
    idempotencyKey: input.idempotencyKey,
    answeredAt: input.now,
  };
  const updated: PlacementSession = {
    ...session,
    answers: [
      ...session.answers.filter((answer) => answer.questionId !== input.questionId),
      nextAnswer,
    ],
  };
  return {
    state: {
      ...state,
      placementSessions: sessions(state).map((candidate) =>
        candidate.id === updated.id ? updated : candidate),
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
  if (session.status !== "in_progress") throw new Error("PLACEMENT_SESSION_CLOSED");
  if (session.answers.length !== session.questionIds.length) {
    throw new Error("PLACEMENT_INCOMPLETE");
  }

  const evaluated = session.questionIds.map((questionId) => {
    const question = trustedPlacementQuestion(questionId);
    const answer = session.answers.find((candidate) => candidate.questionId === questionId);
    if (!question || !answer) throw new Error("PLACEMENT_INCOMPLETE");
    return { question, correct: answer.answer === question.correctAnswer };
  });
  const correctCount = evaluated.filter((entry) => entry.correct).length;
  const recommendedLevel = Math.min(9, Math.max(1, correctCount));
  const weakSkills = [...new Set(
    evaluated.filter((entry) => !entry.correct).map((entry) => entry.question.skill),
  )];
  const result: PlacementResult = {
    id: stableId("placement_result", `${session.id}:${input.idempotencyKey}`),
    sessionId: session.id,
    submitIdempotencyKey: input.idempotencyKey,
    questionVersion: session.questionVersion,
    recommendedLevel,
    correctCount,
    totalCount: evaluated.length,
    confidence: "low",
    missingDimensions: ["listening"],
    weakSkills,
    evidenceSummary: `${correctCount} of ${evaluated.length} diagnostic items were answered correctly. Listening was not measured.`,
    disclaimer: "This is a learning suggestion, not an official HSK score, certificate, or guarantee.",
    createdAt: input.now,
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
