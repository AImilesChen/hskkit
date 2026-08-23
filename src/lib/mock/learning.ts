import type { Attempt, Dimension, LearningState, Mistake, SrsCard } from "../learning/domain.ts";
import type { MockResult, MockResultItem } from "./domain.ts";

const dimension = (item: MockResultItem): Dimension => item.dimension === "listening" ? "context_audio" : "reading";
const plusDay = (iso: string) => new Date(Date.parse(iso) + 86_400_000).toISOString();

export function applyMockResultToLearning(state: LearningState, result: MockResult): LearningState {
  let next = state;
  for (const item of result.items) {
    const key = `mock:${result.id}:${item.questionId}`;
    if (next.attempts.some((attempt) => attempt.idempotencyKey === key)) continue;
    const question = result.questionSnapshots.find((candidate) => candidate.id === item.questionId);
    if (!question) throw new Error("MOCK_SNAPSHOT_MISSING");
    const attempt: Attempt = {
      id: `att_${key}`,
      idempotencyKey: key,
      contentId: question.contentId,
      contentVersion: question.contentVersion,
      dimension: dimension(item),
      answer: item.answer ?? "",
      correctAnswer: item.correctAnswer,
      prompt: item.prompt,
      userAnswerText: item.answer && question.options ? question.options[item.answer] : item.answer,
      correctAnswerText: question.options?.[item.correctAnswer] ?? item.correctAnswer,
      correct: item.correct,
      observedAt: result.createdAt,
      mode: "practice",
      skill: `mock:${item.dimension}`,
      standardVersion: "HSK 3.0",
      sessionId: result.sessionId,
      questionVersion: result.questionSetVersion,
    };
    const cardId = `card_mock:${question.contentId}:${question.contentVersion}:${dimension(item)}`;
    const existing = next.cards.find((card) => card.id === cardId);
    const card: SrsCard = existing ? {
      ...existing,
      dueAt: item.correct ? existing.dueAt : result.createdAt,
      intervalDays: item.correct ? existing.intervalDays : 0,
      revision: item.correct ? existing.revision : existing.revision + 1,
      sourceAttemptId: attempt.id,
    } : {
      id: cardId,
      contentId: question.contentId,
      contentVersion: question.contentVersion,
      dimension: dimension(item),
      dueAt: item.correct ? plusDay(result.createdAt) : result.createdAt,
      intervalDays: item.correct ? 1 : 0,
      ease: 2.5,
      revision: 0,
      reviewCount: 0,
      algorithmVersion: "hskkit-srs-v1",
      sourceAttemptId: attempt.id,
      gradeKeys: [],
    };
    const mistake: Mistake | undefined = item.correct ? undefined : {
      id: `mistake_${key}`,
      contentId: question.contentId,
      contentVersion: question.contentVersion,
      sourceAttemptId: attempt.id,
      status: "open",
      createdAt: result.createdAt,
    };
    next = {
      ...next,
      attempts: [...next.attempts, attempt],
      cards: existing ? next.cards.map((candidate) => candidate.id === card.id ? card : candidate) : [...next.cards, card],
      mistakes: mistake && !next.mistakes.some((candidate) => candidate.id === mistake.id) ? [...next.mistakes, mistake] : next.mistakes,
    };
  }
  return next;
}
