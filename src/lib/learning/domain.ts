import { createHash } from "node:crypto";

export type Grade = "again" | "hard" | "good" | "easy";
export type Dimension = "reading" | "audio" | "context_audio";
export type DailyItemKind = "review" | "learn" | "listen" | "practice" | "summary";

export interface Attempt {
  id: string;
  idempotencyKey: string;
  contentId: string;
  contentVersion: string;
  dimension: Dimension;
  answer: string;
  correctAnswer: string;
  prompt?: string;
  userAnswerText?: string;
  correctAnswerText?: string;
  correct: boolean;
  observedAt: string;
}
export interface SrsCard {
  id: string;
  contentId: string;
  contentVersion: string;
  dimension: Dimension;
  dueAt: string;
  intervalDays: number;
  ease: number;
  revision: number;
  reviewCount: number;
  algorithmVersion: "hskkit-srs-v1";
  sourceAttemptId: string;
  gradeKeys: string[];
}
export interface Mistake {
  id: string;
  contentId: string;
  contentVersion: string;
  sourceAttemptId: string;
  status: "open" | "resolved" | "retired";
  createdAt: string;
  resolvedAt?: string;
}
export interface DailyItem {
  id: string;
  kind: DailyItemKind;
  contentId: string;
  status: "pending" | "completed" | "skipped";
  dimension?: Dimension;
}
export interface DailySession {
  id: string;
  ownerId: string;
  localDay: string;
  ruleVersion: string;
  createdAt: string;
  completedAt?: string;
  items: DailyItem[];
}
export interface PlacementAnswer {
  questionId: string;
  answer: string;
  idempotencyKey: string;
  answeredAt: string;
}
export interface PlacementSession {
  id: string;
  ownerId: string;
  idempotencyKey: string;
  questionVersion: string;
  questionIds: string[];
  answers: PlacementAnswer[];
  status: "in_progress" | "submitted" | "abandoned";
  createdAt: string;
  submittedAt?: string;
  resultId?: string;
}
export interface PlacementResult {
  id: string;
  sessionId: string;
  submitIdempotencyKey: string;
  questionVersion: string;
  recommendedLevel: number;
  correctCount: number;
  totalCount: number;
  confidence: "low" | "medium" | "high";
  missingDimensions: string[];
  weakSkills: string[];
  evidenceSummary: string;
  disclaimer: string;
  createdAt: string;
}
export interface LearningState {
  attempts: Attempt[];
  cards: SrsCard[];
  mistakes: Mistake[];
  dailySessions: DailySession[];
  placementSessions?: PlacementSession[];
  placementResults?: PlacementResult[];
  audioReviewReady?: Array<{ cardId: string; cardRevision: number }>;
  audioPlaybackKeys?: string[];
}

const id = (prefix: string, key: string) => `${prefix}_${createHash("sha256").update(key).digest("base64url")}`;
const add = (iso: string, days: number, minutes = 0) => new Date(new Date(iso).getTime() + days * 86_400_000 + minutes * 60_000).toISOString();

function reconcileSummary(session: DailySession, completedAt?: string): DailySession {
  const unfinished = session.items.some((item) => item.kind !== "summary" && item.status === "pending");
  const wasComplete = session.items.some((item) => item.kind === "summary" && item.status === "completed");
  return {
    ...session,
    completedAt: !unfinished && !wasComplete ? completedAt ?? session.completedAt : session.completedAt,
    items: session.items.map((item) => item.kind === "summary"
      ? { ...item, status: unfinished ? "pending" as const : "completed" as const }
      : item),
  };
}

function applyAttemptToSessions(state: LearningState, attempt: Attempt, card: SrsCard): DailySession[] {
  return state.dailySessions.map((session) => {
    const firstPendingId = session.items.find((item) => item.status === "pending")?.id;
    let items = session.items.map((item) => {
      const practiceMatch = item.kind === "practice" && attempt.dimension === "reading";
      const listenMatch = item.kind === "listen" && item.contentId === attempt.contentId && item.dimension === attempt.dimension;
      return item.id === firstPendingId && (practiceMatch || listenMatch) ? { ...item, status: "completed" as const } : item;
    });
    if (!attempt.correct && !items.some((item) => item.id === `review:${card.id}`)) {
      const reviewItem: DailyItem = { id: `review:${card.id}`, kind: "review", contentId: card.contentId, dimension: card.dimension, status: "pending" };
      const summaryIndex = items.findIndex((item) => item.kind === "summary");
      items = summaryIndex < 0 ? [...items, reviewItem] : [...items.slice(0, summaryIndex), reviewItem, ...items.slice(summaryIndex)];
    }
    return reconcileSummary({ ...session, items }, attempt.observedAt);
  });
}

export function recordAttempt(state: LearningState, input: {
  idempotencyKey: string;
  contentId: string;
  contentVersion: string;
  dimension: Dimension;
  answer: string;
  correctAnswer: string;
  prompt?: string;
  userAnswerText?: string;
  correctAnswerText?: string;
  observedAt: string;
}) {
  const prior = state.attempts.find((attempt) => attempt.idempotencyKey === input.idempotencyKey);
  if (prior) return { state, attempt: prior };

  const attempt: Attempt = { ...input, id: id("att", input.idempotencyKey), correct: input.answer === input.correctAnswer };
  const card: SrsCard = {
    id: id("card", `${input.contentId}:${input.contentVersion}:${input.dimension}`),
    contentId: input.contentId,
    contentVersion: input.contentVersion,
    dimension: input.dimension,
    dueAt: attempt.correct ? add(input.observedAt, 1) : input.observedAt,
    intervalDays: attempt.correct ? 1 : 0,
    ease: 2.5,
    revision: 0,
    reviewCount: 0,
    algorithmVersion: "hskkit-srs-v1",
    sourceAttemptId: attempt.id,
    gradeKeys: [],
  };
  const existingCard = state.cards.find((candidate) => candidate.id === card.id);
  const activeCard = existingCard ?? card;
  const cards = existingCard ? state.cards : [...state.cards, card];
  const mistakes = attempt.correct ? state.mistakes : [...state.mistakes, {
    id: id("mistake", attempt.id),
    contentId: input.contentId,
    contentVersion: input.contentVersion,
    sourceAttemptId: attempt.id,
    status: "open" as const,
    createdAt: input.observedAt,
  }];
  const withAttempt: LearningState = { ...state, attempts: [...state.attempts, attempt], cards, mistakes };
  return { state: { ...withAttempt, dailySessions: applyAttemptToSessions(withAttempt, attempt, activeCard) }, attempt };
}

export function recordAudioAttempt(state: LearningState, input: Parameters<typeof recordAttempt>[1] & {
  dimension: "audio" | "context_audio";
  playbackResult: "completed" | "failed";
}) {
  if (input.playbackResult !== "completed") return { state, recorded: false as const };
  const { playbackResult: _playbackResult, ...attemptInput } = input;
  return { ...recordAttempt(state, attemptInput), recorded: true as const };
}

export function gradeReview(state: LearningState, input: {
  cardId: string;
  grade: Grade;
  idempotencyKey: string;
  observedAt: string;
  clientRevision: number;
}) {
  const old = state.cards.find((card) => card.id === input.cardId);
  if (!old) throw new Error("CARD_NOT_FOUND");
  if (old.gradeKeys.includes(input.idempotencyKey)) return { state, card: old };
  if (old.revision !== input.clientRevision) throw new Error("REVISION_CONFLICT");
  if (old.dimension !== "reading" && !state.audioReviewReady?.some((ready) => ready.cardId === old.id && ready.cardRevision === old.revision)) throw new Error("AUDIO_PLAYBACK_REQUIRED");
  const schedule = {
    again: { days: 0, minutes: 10, ease: -0.2 },
    hard: { days: 1, minutes: 0, ease: -0.1 },
    good: { days: Math.max(2, Math.round(Math.max(1, old.intervalDays) * old.ease)), minutes: 0, ease: 0 },
    easy: { days: Math.max(4, Math.round(Math.max(1, old.intervalDays) * (old.ease + 0.3))), minutes: 0, ease: 0.1 },
  }[input.grade];
  const card: SrsCard = {
    ...old,
    dueAt: add(input.observedAt, schedule.days, schedule.minutes),
    intervalDays: schedule.days,
    ease: Math.max(1.3, old.ease + schedule.ease),
    revision: old.revision + 1,
    reviewCount: old.reviewCount + 1,
    gradeKeys: [...old.gradeKeys, input.idempotencyKey],
  };
  const mistakes = state.mistakes.map((mistake) =>
    mistake.contentId === old.contentId && mistake.contentVersion === old.contentVersion && mistake.status === "open" && input.grade !== "again"
      ? { ...mistake, status: "resolved" as const, resolvedAt: input.observedAt }
      : mistake);
  const dailySessions = state.dailySessions.map((session) => reconcileSummary({
    ...session,
    items: session.items.map((item) => item.id === `review:${card.id}` ? { ...item, status: "completed" as const } : item),
  }, input.observedAt));
  return { state: { ...state, cards: state.cards.map((candidate) => candidate.id === card.id ? card : candidate), mistakes, dailySessions, audioReviewReady: state.audioReviewReady?.filter((ready) => ready.cardId !== old.id) }, card };
}

export function markAudioReviewReady(state: LearningState, cardId: string, cardRevision: number, idempotencyKey: string) {
  const card = state.cards.find((candidate) => candidate.id === cardId);
  if (!card) throw new Error("CARD_NOT_FOUND");
  if (card.dimension === "reading") throw new Error("AUDIO_CARD_REQUIRED");
  const keys = state.audioPlaybackKeys ?? [];
  if (keys.includes(idempotencyKey)) return state;
  if (card.revision !== cardRevision) throw new Error("REVISION_CONFLICT");
  const ready = (state.audioReviewReady ?? []).filter((entry) => entry.cardId !== cardId);
  return {
    ...state,
    audioReviewReady: [...ready, { cardId, cardRevision: card.revision }],
    audioPlaybackKeys: [...keys.slice(-499), idempotencyKey],
  };
}

export function retireContent(state: LearningState, contentId: string): LearningState {
  return {
    ...state,
    cards: state.cards.filter((card) => card.contentId !== contentId),
    mistakes: state.mistakes.map((mistake) => mistake.contentId === contentId && mistake.status === "open" ? { ...mistake, status: "retired" as const } : mistake),
    dailySessions: state.dailySessions.map((session) => reconcileSummary({ ...session, items: session.items.filter((item) => item.contentId !== contentId) })),
  };
}

export function completeDailyItem(state: LearningState, sessionId: string, itemId: string, observedAt = new Date().toISOString()) {
  const session = state.dailySessions.find((candidate) => candidate.id === sessionId);
  if (!session) throw new Error("SESSION_NOT_FOUND");
  if (!session.items.some((item) => item.id === itemId)) throw new Error("ITEM_NOT_FOUND");
  const item = session.items.find((candidate) => candidate.id === itemId)!;
  if (item.kind !== "learn") throw new Error("ITEM_REQUIRES_ACTIVITY");
  if (session.items.find((candidate) => candidate.status === "pending")?.id !== itemId) throw new Error("ITEM_OUT_OF_ORDER");
  const dailySessions = state.dailySessions.map((candidate) => candidate.id === sessionId
    ? reconcileSummary({ ...candidate, items: candidate.items.map((item) => item.id === itemId ? { ...item, status: "completed" as const } : item) }, observedAt)
    : candidate);
  const updated = dailySessions.find((candidate) => candidate.id === sessionId)!;
  return { state: { ...state, dailySessions }, item: updated.items.find((item) => item.id === itemId)! };
}

export function buildDailySession(state: LearningState, input: { ownerId: string; localDay: string; ruleVersion: string; now: string }) {
  const prior = state.dailySessions.find((session) => session.ownerId === input.ownerId && session.localDay === input.localDay && session.ruleVersion === input.ruleVersion);
  if (prior) return { state, session: prior };
  const due: DailyItem[] = state.cards
    .filter((card) => card.dueAt <= input.now)
    .slice(0, 20)
    .map((card) => ({ id: `review:${card.id}`, kind: "review", contentId: card.contentId, dimension: card.dimension, status: "pending" }));
  const core: DailyItem[] = [
    { id: "learn:word:ni-hao", kind: "learn", contentId: "word:ni-hao", status: "pending" },
    { id: "listen:word:word-ni-hao:audio", kind: "listen", contentId: "word:word-ni-hao", dimension: "audio", status: "pending" },
    { id: "listen:word:word-ni-hao:context_audio", kind: "listen", contentId: "word:word-ni-hao", dimension: "context_audio", status: "pending" },
    { id: "practice:question:hsk1_001", kind: "practice", contentId: "question:hsk1_001", dimension: "reading", status: "pending" },
    { id: "summary", kind: "summary", contentId: "summary", status: "pending" },
  ];
  const session: DailySession = {
    id: id("day", `${input.ownerId}:${input.localDay}:${input.ruleVersion}`),
    ownerId: input.ownerId,
    localDay: input.localDay,
    ruleVersion: input.ruleVersion,
    createdAt: input.now,
    items: [...due, ...core],
  };
  return { state: { ...state, dailySessions: [...state.dailySessions, session] }, session };
}

export function resumeDailySession(state: LearningState, sessionId: string) {
  return state.dailySessions.find((session) => session.id === sessionId)?.items.find((item) => item.status === "pending");
}

export const emptyLearningState = (): LearningState => ({ attempts: [], cards: [], mistakes: [], dailySessions: [] });
