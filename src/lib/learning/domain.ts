import { createHash } from "node:crypto";
import type { TodayContentPlan } from "./today-content.ts";
import { practiceQuestionSet } from "../practice/questions.ts";
import type { ReviewSnapshot } from "./review-content.ts";

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
  mode?: "practice" | "placement" | "legacy_practice" | "listening";
  skill?: string;
  standardVersion?: "HSK 3.0" | "HSK 2.0";
  sessionId?: string;
  questionVersion?: string;
  dailySessionId?: string;
  dailyItemId?: string;
  reviewSnapshot?: ReviewSnapshot;
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
  gradeResults?: Record<string, Grade>;
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
  contentVersion?: string;
  title?: string;
  href?: string;
  estimatedMinutes?: number;
}
export interface DailySession {
  id: string;
  ownerId: string;
  localDay: string;
  ruleVersion: string;
  createdAt: string;
  completedAt?: string;
  startLevel?: number;
  contentReleaseId?: string;
  planFingerprint?: string;
  notice?: { code: string; message: string; actionHref: string; actionLabel: string };
  budgetMinutes?: number;
  totalEstimatedMinutes?: number;
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
  expiresAt?: string;
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
export interface PracticeAnswer {
  questionId: string;
  answer: string;
  idempotencyKey: string;
  attemptId: string;
  correct: boolean;
  answeredAt: string;
}
export interface PracticeSession {
  id: string;
  ownerId: string;
  idempotencyKey: string;
  mode: "practice";
  standardVersion: "HSK 3.0";
  level: number;
  skill: string;
  questionVersion: string;
  questionIds: string[];
  dailySessionId?: string;
  dailyItemId?: string;
  answers: PracticeAnswer[];
  status: "in_progress" | "completed" | "abandoned";
  createdAt: string;
  expiresAt?: string;
  completedAt?: string;
  result?: { correctCount: number; totalCount: number; weaknessTags: string[] };
}
export interface QuestionReport {
  id: string;
  ownerId: string;
  sessionId: string;
  questionId: string;
  questionVersion: string;
  reason: string;
  idempotencyKey: string;
  status: "open" | "reviewing" | "resolved" | "rejected";
  createdAt: string;
}
export interface LearningState {
  attempts: Attempt[];
  cards: SrsCard[];
  mistakes: Mistake[];
  dailySessions: DailySession[];
  placementSessions?: PlacementSession[];
  placementResults?: PlacementResult[];
  practiceSessions?: PracticeSession[];
  questionReports?: QuestionReport[];
  audioReviewReady?: Array<{ cardId: string; cardRevision: number }>;
  audioPlaybackKeys?: string[];
  dailyOperationKeys?: string[];
  savedWordIds?: string[];
  lastReviewUndo?: {
    cardId: string;
    gradeKey: string;
    previousCard: SrsCard;
    previousMistakes: Mistake[];
    previousDailySessions: DailySession[];
    previousAudioReviewReady?: Array<{ cardId: string; cardRevision: number }>;
  };
  reviewUndoKeys?: string[];
}

const id = (prefix: string, key: string) => `${prefix}_${createHash("sha256").update(key).digest("base64url")}`;
const add = (iso: string, days: number, minutes = 0) => new Date(new Date(iso).getTime() + days * 86_400_000 + minutes * 60_000).toISOString();

function reconcileSummary(session: DailySession, completedAt?: string): DailySession {
  const unfinished = session.items.some((item) => item.kind !== "summary" && item.status === "pending");
  const wasComplete = session.items.some((item) => item.kind === "summary" && item.status === "completed");
  return {
    ...session,
    completedAt: unfinished ? undefined : !wasComplete ? completedAt ?? session.completedAt : session.completedAt,
    items: session.items.map((item) => item.kind === "summary"
      ? { ...item, status: unfinished ? "pending" as const : "completed" as const }
      : item),
  };
}

const reviewItemId = (card: Pick<SrsCard, "id" | "revision">) => `review:${card.id}:${card.revision}`;

export function toggleSavedWord(state: LearningState, input: { assetId: string; save: boolean }): LearningState {
  const saved = new Set(state.savedWordIds ?? []);
  if (input.save) saved.add(input.assetId);
  else saved.delete(input.assetId);
  return { ...state, savedWordIds: [...saved] };
}

export function addWordToToday(state: LearningState, input: {
  sessionId: string;
  assetId: string;
  contentId: string;
  contentVersion: string;
  title: string;
  href: string;
}): LearningState {
  const session = state.dailySessions.find((candidate) => candidate.id === input.sessionId);
  if (!session) throw new Error("DAILY_SESSION_NOT_FOUND");
  const itemId = `dictionary:${input.assetId}`;
  if (session.items.some((item) => item.id === itemId)) return state;
  const item: DailyItem = {
    id: itemId,
    kind: "learn",
    contentId: input.contentId,
    contentVersion: input.contentVersion,
    title: input.title,
    href: input.href,
    estimatedMinutes: 2,
    status: "pending",
  };
  const summaryIndex = session.items.findIndex((candidate) => candidate.kind === "summary");
  const items = summaryIndex < 0
    ? [...session.items, item]
    : [...session.items.slice(0, summaryIndex), item, ...session.items.slice(summaryIndex)];
  return {
    ...state,
    dailySessions: state.dailySessions.map((candidate) => candidate.id === session.id
      ? reconcileSummary({ ...candidate, items })
      : candidate),
  };
}

function applyAttemptToSessions(state: LearningState, attempt: Attempt, card: SrsCard): DailySession[] {
  return state.dailySessions.map((session) => {
    if ((attempt.mode === "practice" || attempt.mode === "listening") && session.id !== attempt.dailySessionId) return session;
    const firstPendingId = session.items.find((item) => item.status === "pending")?.id;
    let items = session.items.map((item) => {
      const practiceMatch = item.kind === "practice" && attempt.dimension === "reading" && attempt.mode !== "practice" && attempt.mode !== "placement";
      const listenMatch = item.kind === "listen" && item.contentId === attempt.contentId && item.contentVersion === attempt.contentVersion && item.dimension === attempt.dimension;
      return item.id === firstPendingId && (practiceMatch || listenMatch) ? { ...item, status: "completed" as const } : item;
    });
    if (!attempt.correct && !items.some((item) => item.id === reviewItemId(card))) {
      const reviewItem: DailyItem = { id: reviewItemId(card), kind: "review", contentId: card.contentId, dimension: card.dimension, status: "pending" };
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
  mode?: Attempt["mode"];
  skill?: string;
  standardVersion?: Attempt["standardVersion"];
  sessionId?: string;
  questionVersion?: string;
  dailySessionId?: string;
  dailyItemId?: string;
  reviewSnapshot?: ReviewSnapshot;
}) {
  const prior = state.attempts.find((attempt) => attempt.idempotencyKey === input.idempotencyKey);
  if (prior) {
    const samePayload = prior.contentId === input.contentId
      && prior.contentVersion === input.contentVersion
      && prior.dimension === input.dimension
      && prior.answer === input.answer
      && prior.correctAnswer === input.correctAnswer
      && prior.mode === input.mode
      && prior.sessionId === input.sessionId
      && prior.questionVersion === input.questionVersion
      && prior.dailySessionId === input.dailySessionId
      && prior.dailyItemId === input.dailyItemId;
    if (!samePayload) throw new Error("IDEMPOTENCY_KEY_REUSED");
    return { state, attempt: prior };
  }

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
  const activeCard = existingCard && !attempt.correct ? {
    ...existingCard,
    dueAt: input.observedAt,
    intervalDays: 0,
    revision: existingCard.revision + 1,
    sourceAttemptId: attempt.id,
  } : existingCard ?? card;
  const cards = existingCard
    ? state.cards.map((candidate) => candidate.id === activeCard.id ? activeCard : candidate)
    : [...state.cards, card];
  const mistakes = attempt.correct ? state.mistakes : [...state.mistakes, {
    id: id("mistake", attempt.id),
    contentId: input.contentId,
    contentVersion: input.contentVersion,
    sourceAttemptId: attempt.id,
    status: "open" as const,
    createdAt: input.observedAt,
  }];
  const withAttempt: LearningState = {
    ...state,
    attempts: [...state.attempts, attempt],
    cards,
    mistakes,
    audioReviewReady: !attempt.correct ? state.audioReviewReady?.filter((ready) => ready.cardId !== activeCard.id) : state.audioReviewReady,
  };
  return { state: { ...withAttempt, dailySessions: applyAttemptToSessions(withAttempt, attempt, activeCard) }, attempt };
}

export function recordAudioAttempt(state: LearningState, input: Parameters<typeof recordAttempt>[1] & {
  dimension: "audio" | "context_audio";
  playbackResult: "completed" | "failed";
}) {
  if (input.playbackResult !== "completed") return { state, recorded: false as const };
  const { playbackResult, ...attemptInput } = input;
  void playbackResult;
  return { ...recordAttempt(state, attemptInput), recorded: true as const };
}

export function gradeReview(state: LearningState, input: {
  cardId: string;
  grade: Grade;
  idempotencyKey: string;
  observedAt: string;
  clientRevision: number;
  requireAudioPlayback?: boolean;
  resolveMistakes?: boolean;
}) {
  const old = state.cards.find((card) => card.id === input.cardId);
  if (!old) throw new Error("CARD_NOT_FOUND");
  if (old.gradeKeys.includes(input.idempotencyKey)) return { state, card: old };
  if (old.revision !== input.clientRevision) throw new Error("REVISION_CONFLICT");
  const requireAudioPlayback = input.requireAudioPlayback ?? old.dimension !== "reading";
  if (requireAudioPlayback && !state.audioReviewReady?.some((ready) => ready.cardId === old.id && ready.cardRevision === old.revision)) throw new Error("AUDIO_PLAYBACK_REQUIRED");
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
    gradeResults: { ...(old.gradeResults ?? {}), [input.idempotencyKey]: input.grade },
  };
  const mistakes = state.mistakes.map((mistake) => {
    const sourceAttempt = state.attempts.find((attempt) => attempt.id === mistake.sourceAttemptId);
    return (input.resolveMistakes ?? true) && mistake.contentId === old.contentId && mistake.contentVersion === old.contentVersion && sourceAttempt?.dimension === old.dimension && mistake.status === "open" && input.grade !== "again"
      ? { ...mistake, status: "resolved" as const, resolvedAt: input.observedAt }
      : mistake;
  });
  const dailySessions = state.dailySessions.map((session) => reconcileSummary({
    ...session,
    items: session.items.map((item) => item.id === reviewItemId(old) || item.id === `review:${old.id}` ? { ...item, status: "completed" as const } : item),
  }, input.observedAt));
  return {
    state: {
      ...state,
      cards: state.cards.map((candidate) => candidate.id === card.id ? card : candidate),
      mistakes,
      dailySessions,
      audioReviewReady: state.audioReviewReady?.filter((ready) => ready.cardId !== old.id),
      lastReviewUndo: {
        cardId: old.id,
        gradeKey: input.idempotencyKey,
        previousCard: old,
        previousMistakes: state.mistakes,
        previousDailySessions: state.dailySessions,
        previousAudioReviewReady: state.audioReviewReady,
      },
    },
    card,
  };
}

export function undoLastReview(state: LearningState, input: { idempotencyKey: string; cardId: string }) {
  if ((state.reviewUndoKeys ?? []).includes(input.idempotencyKey)) return state;
  const snapshot = state.lastReviewUndo;
  if (!snapshot || snapshot.cardId !== input.cardId) throw new Error("REVIEW_UNDO_UNAVAILABLE");
  const current = state.cards.find((card) => card.id === input.cardId);
  if (!current || current.revision !== snapshot.previousCard.revision + 1) throw new Error("REVIEW_UNDO_CONFLICT");
  return {
    ...state,
    cards: state.cards.map((card) => card.id === input.cardId ? snapshot.previousCard : card),
    mistakes: snapshot.previousMistakes,
    dailySessions: snapshot.previousDailySessions,
    audioReviewReady: snapshot.previousAudioReviewReady,
    lastReviewUndo: undefined,
    reviewUndoKeys: [...(state.reviewUndoKeys ?? []), input.idempotencyKey].slice(-100),
  };
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

export function applyDailyItemAction(state: LearningState, input: {
  sessionId: string;
  itemId: string;
  action: "complete" | "skip" | "restore";
  idempotencyKey: string;
  observedAt: string;
}) {
  if (!input.idempotencyKey) throw new Error("INVALID_IDEMPOTENCY_KEY");
  if ((state.dailyOperationKeys ?? []).includes(input.idempotencyKey)) {
    const replay = state.dailySessions.find((session) => session.id === input.sessionId)?.items.find((item) => item.id === input.itemId);
    if (!replay) throw new Error("ITEM_NOT_FOUND");
    return { state, item: replay, replayed: true as const };
  }
  const session = state.dailySessions.find((candidate) => candidate.id === input.sessionId);
  if (!session) throw new Error("SESSION_NOT_FOUND");
  const current = session.items.find((item) => item.id === input.itemId);
  if (!current || current.kind === "summary") throw new Error("ITEM_NOT_FOUND");
  if (input.action !== "restore" && session.items.find((item) => item.status === "pending")?.id !== current.id) throw new Error("ITEM_OUT_OF_ORDER");
  if (input.action === "complete" && current.kind !== "learn") throw new Error("ITEM_REQUIRES_ACTIVITY");
  if (input.action === "restore" && current.status !== "skipped") throw new Error("ITEM_NOT_SKIPPED");
  const status = input.action === "restore" ? "pending" as const : input.action === "skip" ? "skipped" as const : "completed" as const;
  const dailySessions = state.dailySessions.map((candidate) => candidate.id === input.sessionId
    ? reconcileSummary({ ...candidate, completedAt: input.action === "restore" ? undefined : candidate.completedAt, items: candidate.items.map((item) => item.id === input.itemId ? { ...item, status } : item) }, input.observedAt)
    : candidate);
  const next = { ...state, dailySessions, dailyOperationKeys: [...(state.dailyOperationKeys ?? []).slice(-499), input.idempotencyKey] };
  return { state: next, item: dailySessions.find((candidate) => candidate.id === input.sessionId)!.items.find((item) => item.id === input.itemId)!, replayed: false as const };
}

export function buildDailySession(state: LearningState, input: { ownerId: string; localDay: string; ruleVersion: string; now: string; dailyContent?: TodayContentPlan; budgetMinutes?: number }) {
  const prior = state.dailySessions.find((session) => session.ownerId === input.ownerId && session.localDay === input.localDay);
  const due: DailyItem[] = state.cards
    .filter((card) => card.dueAt <= input.now)
    .slice(0, 20)
    .map((card) => ({ id: reviewItemId(card), kind: "review", contentId: card.contentId, dimension: card.dimension, status: "pending" }));
  const content = input.dailyContent;
  const planFingerprint = content?.status === "ready"
    ? `ready:${content.releaseId}:${content.startLevel}:${content.item.contentId}:${content.item.contentVersion}`
    : content?.status === "empty"
      ? `empty:${content.releaseId}:${content.startLevel}:${content.code}`
      : "legacy";
  const practiceVersion = content?.status === "ready" && content.practiceHref
    ? practiceQuestionSet(content.startLevel, "vocabulary")[0]?.contentVersion
    : undefined;
  const core: DailyItem[] = content?.status === "ready" ? [
    { id: `learn:${content.item.contentId}:${content.item.contentVersion}`, kind: "learn", contentId: content.item.contentId, contentVersion: content.item.contentVersion, title: `Learn ${content.item.hanzi}`, href: `/vocabulary/${content.startLevel}`, status: "pending" },
    { id: `listen:${content.item.contentId}:${content.item.contentVersion}:audio`, kind: "listen", contentId: content.item.contentId, contentVersion: content.item.contentVersion, dimension: "audio", title: `Listen to ${content.item.hanzi}`, href: `/listen/today/${content.item.assetId}?mode=audio`, status: "pending" },
    { id: `listen:${content.item.contentId}:${content.item.contentVersion}:context_audio`, kind: "listen", contentId: content.item.contentId, contentVersion: content.item.contentVersion, dimension: "context_audio", title: "Listen in context", href: `/listen/today/${content.item.assetId}?mode=context_audio`, status: "pending" },
    ...(content.practiceHref && practiceVersion ? [{ id: `practice:${content.startLevel}:vocabulary:${practiceVersion}`, kind: "practice" as const, contentId: `practice:${content.startLevel}:vocabulary`, contentVersion: practiceVersion, dimension: "reading" as const, title: `Level ${content.startLevel} vocabulary practice`, href: content.practiceHref, status: "pending" as const }] : []),
    { id: "summary", kind: "summary", contentId: "summary", status: "pending" },
  ] : content?.status === "empty" ? [
    { id: "summary", kind: "summary", contentId: "summary", status: "pending" },
  ] : [
    { id: "learn:word:ni-hao", kind: "learn", contentId: "word:ni-hao", status: "pending" },
    { id: "listen:word:word-ni-hao:audio", kind: "listen", contentId: "word:word-ni-hao", dimension: "audio", status: "pending" },
    { id: "listen:word:word-ni-hao:context_audio", kind: "listen", contentId: "word:word-ni-hao", dimension: "context_audio", status: "pending" },
    { id: "practice:1:vocabulary", kind: "practice", contentId: "practice:1:vocabulary", contentVersion: practiceQuestionSet(1, "vocabulary")[0]?.contentVersion, dimension: "reading", status: "pending" },
    { id: "summary", kind: "summary", contentId: "summary", status: "pending" },
  ];
  const estimate = (item: DailyItem) => item.kind === "summary" ? 0 : item.kind === "review" || item.kind === "listen" ? 3 : item.kind === "learn" ? 5 : 8;
  const budgetMinutes = Number.isInteger(input.budgetMinutes) && Number(input.budgetMinutes) >= 5 && Number(input.budgetMinutes) <= 180 ? Number(input.budgetMinutes) : prior?.budgetMinutes ?? 30;
  const candidates = [...due, ...core.filter((item) => item.kind !== "summary")].map((item) => ({ ...item, estimatedMinutes: item.estimatedMinutes ?? estimate(item) }));
  let used = 0;
  const planned = candidates.filter((item) => {
    const minutes = item.estimatedMinutes ?? 0;
    if (used + minutes > budgetMinutes) return false;
    used += minutes;
    return true;
  });
  const summary = { ...(core.find((item) => item.kind === "summary") ?? { id: "summary", kind: "summary" as const, contentId: "summary", status: "pending" as const }), estimatedMinutes: 0 };
  const plannedItems = [...planned, summary];
  if (prior) {
    const dueIds = new Set(due.map((item) => item.id));
    const priorPendingReviewIds = prior.items.filter((item) => item.kind === "review" && item.status === "pending").map((item) => item.id);
    const duePlanMatches = due.every((item) => prior.items.some((priorItem) => priorItem.id === item.id))
      && priorPendingReviewIds.every((itemId) => dueIds.has(itemId));
    const samePlan = prior.ruleVersion === input.ruleVersion
      && prior.planFingerprint === planFingerprint
      && (prior.budgetMinutes ?? 30) === budgetMinutes
      && duePlanMatches;
    if (samePlan) return { state, session: prior };
    const activePlanned = plannedItems.filter((item) => item.kind !== "summary");
    const retained = activePlanned.map((item) => {
      const previous = prior.items.find((candidate) => candidate.id === item.id && candidate.contentVersion === item.contentVersion);
      return previous?.status === "completed" || previous?.status === "skipped" ? { ...item, status: previous.status } : item;
    });
    const archivedCompleted = prior.items.filter((item) => item.kind !== "summary" && item.status === "completed" && !activePlanned.some((plannedItem) => plannedItem.id === item.id));
    const replacement = [...archivedCompleted, ...retained, summary];
    const refreshed: DailySession = {
      ...prior,
      ruleVersion: input.ruleVersion,
      budgetMinutes,
      totalEstimatedMinutes: replacement.reduce((sum, item) => sum + (item.estimatedMinutes ?? estimate(item)), 0),
      startLevel: content?.startLevel,
      contentReleaseId: content?.releaseId,
      planFingerprint,
      notice: content?.status === "empty"
        ? { code: content.code, message: content.message, actionHref: content.actionHref, actionLabel: content.actionLabel }
        : content?.status === "ready"
          ? { code: "CONTENT_UPDATED", message: "Daily content was updated to the current approved learning plan. Completed history was kept.", actionHref: "/today", actionLabel: "Continue updated session" }
          : undefined,
      items: replacement,
    };
    const reconciled = reconcileSummary(refreshed, input.now);
    return { state: { ...state, dailySessions: state.dailySessions.map((session) => session.id === prior.id ? reconciled : session) }, session: reconciled };
  }
  const session: DailySession = {
    id: id("day", `${input.ownerId}:${input.localDay}:${input.ruleVersion}`),
    ownerId: input.ownerId,
    localDay: input.localDay,
    ruleVersion: input.ruleVersion,
    createdAt: input.now,
    startLevel: content?.startLevel,
    contentReleaseId: content?.releaseId,
    planFingerprint,
    budgetMinutes,
    totalEstimatedMinutes: plannedItems.reduce((sum, item) => sum + (item.estimatedMinutes ?? estimate(item)), 0),
    notice: content?.status === "empty" ? { code: content.code, message: content.message, actionHref: content.actionHref, actionLabel: content.actionLabel } : undefined,
    items: plannedItems,
  };
  const reconciled = reconcileSummary(session, input.now);
  return { state: { ...state, dailySessions: [...state.dailySessions, reconciled] }, session: reconciled };
}

export function resumeDailySession(state: LearningState, sessionId: string) {
  return state.dailySessions.find((session) => session.id === sessionId)?.items.find((item) => item.status === "pending");
}

export const emptyLearningState = (): LearningState => ({ attempts: [], cards: [], mistakes: [], dailySessions: [] });
