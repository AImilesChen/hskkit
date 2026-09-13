"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import AiAssist from "./ai-assist";
import { AudioPlaybackControl } from "./audio-playback-control";
import HomeIcon, { type HomeIconName } from "./home-icon";
import LearningLoopNav, { type LearningLoopLabel } from "./learning-loop-nav";
import { PlaybackRequestError, PlaybackVerificationCoordinator, playbackErrorCode, playbackVerificationMessage, type PlaybackVerificationState } from "../../lib/learning/verified-playback";
import { LearningLoadError, loadLearningData, type LearningLoadErrorCode } from "../../lib/learning/client-load";
import { activeReviewCardId, activeTodayReviewCardId, buildIntentReviewQueue, filterReviewCards, recommendReviewCount, reviewAnswerIsCorrect, reviewCardIdsForScope, reviewComposition, reviewEntryIntent, reviewGradeOptions, reviewTip, type ReviewEntryIntent, type ReviewGrade, type ReviewLevelControl, type ReviewLevelScope } from "../../lib/learning/review-session";
import { canRefreshTodayWords, completionProofNeedsSync, parseTodayCompletionProof, recommendTodayMinutes, recommendTodayNewWordCount, resolveTodayCelebration, todayCompletionProofKey, todaySummaryChanges, todaySummaryStats, todayJourneyProgress, TODAY_BUDGET_OPTIONS, TODAY_FOCUS_OPTIONS, TODAY_NEW_WORD_OPTIONS, type TodayBudgetMinutes, type TodayCelebration, type TodayCompletedKind, type TodayFocus, type TodayNewWordCount } from "../../lib/learning/today-plan";

type Dimension = "reading" | "audio" | "context_audio";
type MistakeFilter = "all" | "reading" | "listening";
type MistakeTab = "open" | "corrected";
type LearnContent = { assetId: string; hanzi: string; pinyin: string; meaning: string; partOfSpeech: string; example?: { hanzi: string; pinyin: string; meaning: string }; audioSrc?: string };
type Item = { id: string; kind: "review" | "learn" | "listen" | "practice" | "summary"; contentId: string; contentVersion?: string; status: "pending" | "completed" | "skipped"; dimension?: Dimension; title?: string; href?: string; estimatedMinutes?: number; deferred?: boolean; reviewCardId?: string; learnContent?: LearnContent; todayStatus?: "new" | "continue"; selectionReason?: string; startedAt?: string };
type Notice = { code: string; message: string; actionHref: string; actionLabel: string };
type Card = { id: string; contentId: string; contentVersion: string; dimension: Dimension; dueAt: string; revision: number; prompt: string; context?: string; instruction?: string; answerMode: "choice" | "text" | "self_recall"; correctAnswer: string; correctAnswerKey: string; userAnswer: string; priorAnswerLabel: string; choices: Array<{ key: string; text: string }>; isMistake: boolean; legacyReview: boolean; todayReviewMode: "question_review" | "vocabulary_recall" | "unsupported_legacy" | "reading_unchanged"; todayReviewable: boolean; todayPrompt?: string; todayInstruction?: string; todayAudioSrc?: string; todayAudioText?: string; todayPlaybackRequired: boolean; todayPlaybackReady: boolean; todayHanzi?: string; todayPinyin?: string; todayMeaning?: string; todayExample?: { hanzi: string; pinyin: string; meaning: string }; reviewReason: string; explanation: string; level?: number; levelBand: string; skill: string; topic?: string; intervalDays: number; ease: number; reviewCount: number; audioText?: string; audioSrc?: string; assetId?: string; hanzi?: string; pinyin?: string; meaning?: string; example?: { hanzi: string; pinyin: string; meaning: string }; formalAudioSrc?: string; playbackRequired: boolean; playbackReady: boolean };
type Mistake = { id: string; contentId: string; cardId?: string; status: string; createdAt: string; resolvedAt?: string; dimension: Dimension; prompt: string; level?: number; skill: string };
type RewardSnapshot = { monthLearningDays: number; monthPoints: number; currentStreak: number; remainingSeconds: number; nextAward: number; nextMonthLearningDay: number; todayQualified: boolean; todayAwarded: boolean; todayAward: number };
type Data = {
  session: { id: string; startLevel?: number; contentReleaseId?: string; notice?: Notice; budgetMinutes?: number; newWordCount?: TodayNewWordCount; plannedNewWordCount?: number; listeningEnabled?: boolean; focus?: TodayFocus; totalEstimatedMinutes?: number; reviewBatchId?: string; reviewCardIds?: string[]; reviewItemIds?: string[]; wordRefreshesUsed?: number; items: Item[] };
  cards: Card[];
  focusedReview: (Card & { focusReason: "open_mistake" | "due" })[];
  reviewLevelControl: ReviewLevelControl;
  canUndoReview: { cardId: string } | null;
  capabilities: { tier: "free" | "pro"; dailyNewItems: number | null; dailyReviewGrades: number | null; focusedReview: boolean };
  usage: { dailyNewItems: number; dailyReviewGrades: number };
  mistakes: Mistake[];
  mastery: Record<Dimension, number>;
  streak: { current: number; longest: number; lastLearningDay: string | null };
  streakBasis: string;
  practiceQuestionsCompleted: number;
  scope: "guest" | "account";
  queueBinding: string;
  revision: number;
};
const tz = () => new Date().getTimezoneOffset();
const OFFLINE_KEY = "hskkit_learning_pending_v1";
type PendingOperation = { action: string; payload: Record<string, unknown>; idempotencyKey: string; clientRevision: number; queueBinding: string };
function allPending(): PendingOperation[] {
  const raw = localStorage.getItem(OFFLINE_KEY);
  if (!raw) return [];
  try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : [parsed]; } catch { return []; }
}
function pendingQueue(binding: string) { return allPending().filter((item) => item.queueBinding === binding); }
function savePending(binding: string, queue: PendingOperation[]) {
  const next = [...allPending().filter((item) => item.queueBinding !== binding), ...queue];
  if (next.length) localStorage.setItem(OFFLINE_KEY, JSON.stringify(next)); else localStorage.removeItem(OFFLINE_KEY);
}
function appendPending(operation: PendingOperation) {
  const queue = pendingQueue(operation.queueBinding);
  if (!queue.some((item) => item.idempotencyKey === operation.idempotencyKey)) queue.push(operation);
  savePending(operation.queueBinding, queue);
}

export default function LearningDashboard({ mode }: { mode: "today" | "review" | "mistakes" }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loadFailure, setLoadFailure] = useState<LearningLoadErrorCode | "">("");
  const [retryingLoad, setRetryingLoad] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [audioError, setAudioError] = useState("");
  const [celebration, setCelebration] = useState<(TodayCelebration & { animate: boolean }) | null>(null);
  const [returnedKind, setReturnedKind] = useState<TodayCompletedKind | null>(null);
  const [returnedSessionId, setReturnedSessionId] = useState("");
  const [returnedItemId, setReturnedItemId] = useState("");
  const [completionSyncState, setCompletionSyncState] = useState<"idle" | "syncing" | "failed">("idle");
  const completionSyncAttempts = useRef(0);
  const celebrationPanelRef = useRef<HTMLDivElement | null>(null);
  const [reviewMinutes, setReviewMinutes] = useState<5 | 10 | 20>(10);
  const [selectedReviewScope, setSelectedReviewScope] = useState<ReviewLevelScope>("current");
  const [difficultOnly, setDifficultOnly] = useState(false);
  const [mistakeTab, setMistakeTab] = useState<"open" | "corrected">("open");
  const [mistakeFilter, setMistakeFilter] = useState<MistakeFilter>("all");
  const [correctedVisible, setCorrectedVisible] = useState(10);
  const [loadingMoreCorrected, setLoadingMoreCorrected] = useState(false);
  const [mistakeNotice, setMistakeNotice] = useState("");
  const mistakeScrollPositions = useRef<Record<MistakeTab, number>>({ open: 0, corrected: 0 });
  const [reviewIds, setReviewIds] = useState<string[] | null>(null);
  const [entryIntent, setEntryIntent] = useState<ReviewEntryIntent>({ kind: "setup" });
  const [entryTodaySessionId, setEntryTodaySessionId] = useState("");
  const [entryTodayItemId, setEntryTodayItemId] = useState("");
  const [entryResolved, setEntryResolved] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [reviewDraft, setReviewDraft] = useState("");
  const [answerChecked, setAnswerChecked] = useState(false);
  const [retryFeedback, setRetryFeedback] = useState<{ correct: boolean; correctAnswerText: string } | null>(null);
  const [retryResult, setRetryResult] = useState<Data | null>(null);
  const [lastRatedCardId, setLastRatedCardId] = useState<string | null>(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [learnSavingId, setLearnSavingId] = useState("");
  const [syncState, setSyncState] = useState<"synced" | "local_pending" | "syncing" | "conflict" | "failed">("synced");
  const [planDraftMinutes, setPlanDraftMinutes] = useState<TodayBudgetMinutes>(20);
  const [planDraftLevel, setPlanDraftLevel] = useState(1);
  const [planDraftNewWords, setPlanDraftNewWords] = useState<TodayNewWordCount>(3);
  const [planDraftListening, setPlanDraftListening] = useState(true);
  const [planDraftFocus, setPlanDraftFocus] = useState<TodayFocus>("balanced");
  const [planOpen, setPlanOpen] = useState(false);
  const planDialogRef = useRef<HTMLDivElement | null>(null);
  const [planFeedback, setPlanFeedback] = useState("");
  const [reward, setReward] = useState<RewardSnapshot | null>(null);
  const operationKeys = useRef<Record<string, string>>({});
  const dataRef = useRef<Data | null>(null);
  const reviewPlayback = useRef<{ cardKey: string; coordinator: PlaybackVerificationCoordinator } | null>(null);
  const [reviewPlaybackState, setReviewPlaybackState] = useState<PlaybackVerificationState>("idle");

  async function freezeTodayPlan(loaded: Data) {
    if (mode !== "today") return;
    const operation = `freeze:${loaded.session.id}`;
    const key = operation;
    operationKeys.current[operation] = key;
    try {
      const response = await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "freeze_today", payload: { sessionId: loaded.session.id, idempotencyKey: key }, clientRevision: loaded.revision, tzOffset: tz(), queueBinding: loaded.queueBinding }) });
      if (!response.ok) return;
      const frozen = await response.json() as Data;
      delete operationKeys.current[operation];
      if ((dataRef.current?.revision ?? -1) <= frozen.revision) { dataRef.current = frozen; setData(frozen); }
    } catch { /* deterministic daily selection remains stable; the next write persists it */ }
  }

  async function load(manualRetry = false) {
    setError("");
    setLoadFailure("");
    setRetryingLoad(manualRetry);
    try {
      const loaded = await loadLearningData<Data>(
        () => fetch(`/api/v1/learning?tzOffset=${tz()}`, { cache: "no-store" }),
        {
          isOnline: () => navigator.onLine,
          onTransientRetry: () => {
            setLoadFailure("temporarily_unavailable");
            setRetryingLoad(true);
          },
        },
      );
      dataRef.current = loaded;
      setData(loaded);
      setPlanDraftMinutes((loaded.session.budgetMinutes ?? 20) as TodayBudgetMinutes);
      setPlanDraftLevel(loaded.session.startLevel ?? 1);
      setPlanDraftNewWords(loaded.session.newWordCount ?? recommendTodayNewWordCount((loaded.session.budgetMinutes ?? 20) as TodayBudgetMinutes));
      setPlanDraftListening(loaded.session.listeningEnabled ?? true);
      setPlanDraftFocus(loaded.session.focus ?? "balanced");
      if (loaded.scope === "account") {
        void fetch("/api/v1/account/learning-rewards", { cache: "no-store" })
          .then((response) => response.ok ? response.json() : null)
          .then((snapshot) => setReward(snapshot))
          .catch(() => setReward(null));
      }
      setLoadFailure("");
      if (pendingQueue(loaded.queueBinding).length) void retryPending(loaded);
      else { setSyncState("synced"); void freezeTodayPlan(loaded); }
    } catch (caught) {
      setLoadFailure(caught instanceof LearningLoadError ? caught.code : navigator.onLine ? "unavailable" : "offline");
    } finally {
      setRetryingLoad(false);
    }
  }
  // The initial restore intentionally runs once; retries use the latest data through dataRef.
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setEntryIntent(reviewEntryIntent(window.location.search));
    const reviewLevel = Number(search.get("level"));
    setSelectedReviewScope(search.get("level") === "all" ? "all" : Number.isInteger(reviewLevel) && reviewLevel >= 1 && reviewLevel <= 9 ? reviewLevel : "current");
    setEntryTodaySessionId(search.get("dailySessionId") ?? "");
    setEntryTodayItemId(search.get("dailyItemId") ?? "");
    const completed = search.get("completed");
    if (completed === "review" || completed === "learn" || completed === "listen" || completed === "practice") {
      const completedSession = search.get("completedSession") ?? "";
      const completedItem = search.get("completedItem") ?? "";
      setReturnedKind(completed);
      setReturnedSessionId(completedSession);
      setReturnedItemId(completedItem);
      if (completedSession && completedItem && sessionStorage.getItem(todayCompletionProofKey(completedSession, completedItem))) setCompletionSyncState("syncing");
    }
    setEntryResolved(true);
    void load();
    const online = () => { void retryPending(dataRef.current); };
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode !== "mistakes" || !data) return;
    const correctedCount = data.mistakes.filter((mistake) => mistake.status === "resolved").length;
    const savedCount = sessionStorage.getItem("hskkit_mistakes_corrected_count_v1");
    if (savedCount !== null && correctedCount > Number(savedCount)) setMistakeNotice("Corrected — moved to your history.");
    sessionStorage.setItem("hskkit_mistakes_corrected_count_v1", String(correctedCount));
  }, [data, mode]);

  useEffect(() => {
    if (mode !== "review") return;
    const syncReviewScopeFromUrl = () => {
      const value = new URLSearchParams(window.location.search).get("level");
      const level = Number(value);
      setSelectedReviewScope(value === "all" ? "all" : Number.isInteger(level) && level >= 1 && level <= 9 ? level : "current");
      setReviewIds(null);
    };
    window.addEventListener("popstate", syncReviewScopeFromUrl);
    return () => window.removeEventListener("popstate", syncReviewScopeFromUrl);
  }, [mode]);

  useEffect(() => {
    if (mode !== "today" || !data || !returnedKind) return;
    if (returnedSessionId !== data.session.id || !returnedItemId) {
      setCompletionSyncState("idle");
      return;
    }
    const completionProofKey = todayCompletionProofKey(returnedSessionId, returnedItemId);
    const rawProof = sessionStorage.getItem(completionProofKey);
    const proof = parseTodayCompletionProof(rawProof) ?? (rawProof === "armed" ? {
      dailySessionId: returnedSessionId,
      dailyItemId: returnedItemId,
      revision: 0,
      summaryComplete: false,
    } : null);
    const returnedItem = data.session.items.find((item) => item.id === returnedItemId);
    const summaryIsComplete = data.session.items.some((item) => item.kind === "summary" && item.status === "completed");
    if (proof && completionProofNeedsSync(proof, {
      sessionId: data.session.id,
      revision: data.revision,
      completedItemId: returnedItemId,
      completedItem: returnedItem?.status === "completed",
      summaryComplete: summaryIsComplete,
    })) {
      if (completionSyncAttempts.current >= 8) {
        setCompletionSyncState("failed");
        return;
      }
      setCompletionSyncState("syncing");
      completionSyncAttempts.current += 1;
      const timer = window.setTimeout(() => void load(), 350);
      return () => window.clearTimeout(timer);
    }
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("completed");
    cleanUrl.searchParams.delete("completedSession");
    cleanUrl.searchParams.delete("completedItem");
    window.history.replaceState({}, "", `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
    setCompletionSyncState("idle");
    completionSyncAttempts.current = 0;
    const completedItem = data.session.items.find((item) => item.id === returnedItemId && item.kind === returnedKind && item.status === "completed");
    if (!completedItem || !proof) return;
    sessionStorage.removeItem(completionProofKey);
    const completedCount = data.session.items.filter((item) => item.kind === returnedKind && item.status === "completed").length;
    const summaryComplete = data.session.items.some((item) => item.kind === "summary" && item.status === "completed");
    const resolved = resolveTodayCelebration({ returnedKind, completedCount, summaryComplete });
    if (!resolved) return;
    const celebrationKey = `today-celebration:${data.session.id}:${returnedKind}:${completedCount}:${summaryComplete ? "session" : "step"}`;
    if (sessionStorage.getItem(celebrationKey)) return;
    sessionStorage.setItem(celebrationKey, "shown");
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setCelebration({ ...resolved, animate });
    // load is stable for this client component; data changes drive bounded completion reconciliation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mode, returnedItemId, returnedKind, returnedSessionId]);

  useEffect(() => {
    if (!planOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = planDialogRef.current;
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])") ?? []);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (focusable()[0] ?? panel)?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setPlanOpen(false); return; }
      if (event.key !== "Tab") return;
      const controls = focusable();
      if (!controls.length) { event.preventDefault(); panel?.focus(); return; }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handleKeyDown); previousFocus?.focus(); };
  }, [planOpen]);

  useEffect(() => {
    if (!celebration) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = celebrationPanelRef.current;
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])") ?? []);
    (focusable()[0] ?? panel)?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setCelebration(null);
        return;
      }
      if (event.key !== "Tab") return;
      const controls = focusable();
      if (!controls.length) {
        event.preventDefault();
        panel?.focus();
        return;
      }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [celebration]);

  useEffect(() => {
    if (mode !== "review" || !data || !entryResolved || entryIntent.kind === "setup" || reviewIds !== null) return;
    const reviewCards = entryIntent.kind === "mistake"
      ? data.cards
      : entryIntent.kind === "today"
        ? (data.session.reviewCardIds ?? []).map((id) => data.cards.find((card) => card.id === id)).filter((card): card is Card => Boolean(card))
      : data.capabilities.focusedReview
        ? data.focusedReview
        : data.cards.filter((card) => card.dueAt <= new Date().toISOString());
    setReviewIds(entryIntent.kind === "today" ? (data.session.reviewCardIds ?? []) : buildIntentReviewQueue(reviewCards, entryIntent, reviewMinutes).map((card) => card.id));
    setReviewedCount(0);
  }, [data, entryIntent, entryResolved, mode, reviewIds, reviewMinutes]);

  useEffect(() => {
    setSelectedAnswer("");
    setReviewDraft("");
    setAnswerChecked(false);
    setRetryFeedback(null);
    setRetryResult(null);
    setAudioError("");
    reviewPlayback.current?.coordinator.reset();
    reviewPlayback.current = null;
    setReviewPlaybackState("idle");
  }, [reviewedCount, reviewIds]);

  async function retryPending(current: Data | null = data) {
    if (!current?.queueBinding) return;
    const binding = current.queueBinding;
    const queue = pendingQueue(binding);
    if (!queue.length) { setSyncState("synced"); return; }
    setSyncState("syncing");
    try {
      let revision = queue[0].clientRevision;
      while (queue.length) {
        const pending = queue[0];
        const response = await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: pending.action, payload: { ...pending.payload, idempotencyKey: pending.idempotencyKey }, clientRevision: revision, tzOffset: tz(), queueBinding: binding }) });
        const result = await response.json();
        if (response.status === 429) {
          queue.shift(); savePending(binding, queue);
          setError(result.error === "FREE_DAILY_NEW_ITEM_LIMIT" ? "Free daily new-item limit reached." : "Free daily SRS rating limit reached.");
          setSyncState("synced");
          return;
        }
        if (response.status === 409) {
          setSyncState("conflict");
          const latest = await fetch(`/api/v1/learning?tzOffset=${tz()}`, { cache: "no-store" });
          const latestData = await latest.json();
          dataRef.current = latestData;
          setData(latestData);
          if (latestData.queueBinding !== binding) { setSyncState("failed"); return; }
          queue[0] = { ...pending, clientRevision: latestData.revision }; savePending(binding, queue);
          return;
        }
        if (!response.ok) throw new Error(result.error ?? "SYNC_FAILED");
        revision = result.revision; dataRef.current = result; setData(result); queue.shift(); savePending(binding, queue);
      }
      setSyncState("synced");
    } catch { setSyncState("failed"); }
  }

  async function post(action: string, payload: Record<string, unknown>, operation: string, applyResult = true) {
    const key = operationKeys.current[operation] ?? crypto.randomUUID();
    operationKeys.current[operation] = key;
    const body = JSON.stringify({ action, payload: { ...payload, idempotencyKey: key }, clientRevision: data?.revision, tzOffset: tz(), queueBinding: data?.queueBinding });
    let response: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        response = await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body });
        if (response.ok || response.status < 500 && response.status !== 409) break;
      } catch { /* retry with the same idempotency key */ }
    }
    if (response?.ok) {
      delete operationKeys.current[operation];
      const result = await response.json();
      if (applyResult) {
        dataRef.current = result;
        setData(result);
      }
      setSyncState("synced");
      return result;
    }
    if (response?.status === 429) {
      const limited = await response.json();
      delete operationKeys.current[operation];
      setError(limited.error === "FREE_DAILY_NEW_ITEM_LIMIT" ? "Free daily new-item limit reached." : "Free daily SRS rating limit reached.");
      return false;
    }
    if (response?.status === 409) {
      const conflict = await response.json();
      appendPending({ action, payload, idempotencyKey: key, clientRevision: conflict.serverRevision ?? data?.revision ?? 0, queueBinding: data!.queueBinding });
      setSyncState("conflict");
      return action === "configure_today" ? "queued_conflict" : false;
    }
    if (["start_item", "complete_item", "skip_item", "restore_item", "configure_today"].includes(action) && data) {
      appendPending({ action, payload, idempotencyKey: key, clientRevision: data.revision, queueBinding: data.queueBinding });
      setSyncState("local_pending");
      if (payload.itemId) setData({ ...data, session: { ...data.session, items: data.session.items.map((item) => item.id === payload.itemId ? { ...item, status: action === "start_item" ? item.status : action === "restore_item" ? "pending" : action === "skip_item" ? "skipped" : "completed", ...(action === "start_item" ? { startedAt: new Date().toISOString() } : {}) } : item) } });
      return true;
    }
    setError("Your progress could not be confirmed. Reload to restore the server copy, then retry.");
    return false;
  }
  async function grade(card: Card, gradeName: ReviewGrade) {
    if (reviewSaving) return;
    setReviewSaving(true);
    try {
      if (entryIntent.kind === "today" && activeTodayReviewCardId(reviewIds, todayCompletedReviewIds) !== card.id) {
        await load(true);
        return;
      }
      const targetBefore = data?.session.id === entryTodaySessionId ? data.session.items.find((item) => item.id === entryTodayItemId) : undefined;
      const result = await post("grade", { cardId: card.id, grade: gradeName, clientRevision: card.revision }, `grade:${card.id}:${gradeName}`) as Data | false;
      if (result) {
        const targetAfter = result.session.id === entryTodaySessionId ? result.session.items.find((item) => item.id === entryTodayItemId) : undefined;
        if (entryIntent.kind === "today" && targetBefore?.kind === "review" && targetBefore.status === "pending" && targetBefore.reviewCardId === card.id && targetAfter?.status === "completed") sessionStorage.setItem(todayCompletionProofKey(entryTodaySessionId, entryTodayItemId), JSON.stringify({ dailySessionId: entryTodaySessionId, dailyItemId: entryTodayItemId, revision: result.revision, summaryComplete: result.session.items.some((item) => item.kind === "summary" && item.status === "completed") }));
        setRevealed((current) => ({ ...current, [card.id]: false }));
        setSelectedAnswer("");
        setReviewDraft("");
        setAnswerChecked(false);
        setRetryFeedback(null);
        setRetryResult(null);
        setReviewedCount((count) => count + 1);
        setLastRatedCardId(card.id);
      }
    } finally {
      setReviewSaving(false);
    }
  }
  async function submitRetry(card: Card) {
    const answer = card.answerMode === "choice" ? selectedAnswer : reviewDraft.trim();
    if (!answer || reviewSaving) return;
    if (entryIntent.kind === "today" && activeTodayReviewCardId(reviewIds, todayCompletedReviewIds) !== card.id) {
      await load(true);
      return;
    }
    if (!card.isMistake) {
      setRetryFeedback({ correct: reviewAnswerIsCorrect(card, answer), correctAnswerText: card.correctAnswer });
      setAnswerChecked(true);
      return;
    }
    setReviewSaving(true);
    try {
      const targetBefore = data?.session.id === entryTodaySessionId ? data.session.items.find((item) => item.id === entryTodayItemId) : undefined;
      const result = await post("retry_review", { cardId: card.id, answer, cardRevision: card.revision }, `retry-review:${card.id}:${card.revision}`, false) as (Data & { feedback?: { correct: boolean; correctAnswerText: string } }) | false;
      if (result && result.feedback) {
        const targetAfter = result.session.id === entryTodaySessionId ? result.session.items.find((item) => item.id === entryTodayItemId) : undefined;
        if (entryIntent.kind === "today" && targetBefore?.kind === "review" && targetBefore.status === "pending" && targetBefore.reviewCardId === card.id && targetAfter?.status === "completed") sessionStorage.setItem(todayCompletionProofKey(entryTodaySessionId, entryTodayItemId), JSON.stringify({ dailySessionId: entryTodaySessionId, dailyItemId: entryTodayItemId, revision: result.revision, summaryComplete: result.session.items.some((item) => item.kind === "summary" && item.status === "completed") }));
        setRetryFeedback(result.feedback);
        setRetryResult(result);
        setAnswerChecked(true);
      }
    } finally { setReviewSaving(false); }
  }
  function continueAfterRetry(card: Card) {
    if (!retryResult) return;
    dataRef.current = retryResult;
    setData(retryResult);
    if (retryFeedback?.correct || entryIntent.kind === "today") setReviewedCount((count) => count + 1);
    setLastRatedCardId(card.id);
    setSelectedAnswer("");
    setReviewDraft("");
    setAnswerChecked(false);
    setRetryFeedback(null);
    setRetryResult(null);
    setAudioError("");
  }
  async function undoLastRating() {
    if (!lastRatedCardId || !data?.canUndoReview || reviewSaving) return;
    setReviewSaving(true);
    try {
      if (await post("undo_review", { cardId: lastRatedCardId }, `undo-review:${lastRatedCardId}`)) {
        if (entryIntent.kind === "today" && entryTodaySessionId && entryTodayItemId) sessionStorage.removeItem(todayCompletionProofKey(entryTodaySessionId, entryTodayItemId));
        setReviewedCount((count) => Math.max(0, count - 1));
        setLastRatedCardId(null);
      }
    } finally {
      setReviewSaving(false);
    }
  }
  async function skip(item: Item) { await post("skip_item", { sessionId: data!.session.id, itemId: item.id }, `skip:${data!.session.id}:${item.id}`); }
  async function skipUnsupportedTodayReview() {
    const item = data?.session.id === entryTodaySessionId ? data.session.items.find((candidate) => candidate.id === entryTodayItemId) : undefined;
    if (!item || item.kind !== "review" || item.status !== "pending") return;
    if (await post("skip_item", { sessionId: data!.session.id, itemId: item.id }, `skip:${data!.session.id}:${item.id}`)) window.location.assign("/today");
  }
  async function restore(item: Item) { await post("restore_item", { sessionId: data!.session.id, itemId: item.id }, `restore:${data!.session.id}:${item.id}`); }
  async function startLearn(item: Item) {
    if (!data || item.kind !== "learn" || item.status !== "pending" || item.startedAt) return;
    await post("start_item", { sessionId: data.session.id, itemId: item.id }, `start:${data.session.id}:${item.id}`);
  }
  async function refreshTodayWords() {
    if (!data || !canRefreshTodayWords(data.session)) return;
    const result = await post("refresh_today_words", { sessionId: data.session.id }, `refresh-words:${data.session.id}`);
    if (result) setPlanFeedback("Today’s unstarted words changed once. Started work stayed in place.");
  }
  function switchMistakeTab(nextTab: MistakeTab) {
    mistakeScrollPositions.current[mistakeTab] = window.scrollY;
    setMistakeTab(nextTab);
    window.requestAnimationFrame(() => window.scrollTo({ top: mistakeScrollPositions.current[nextTab], behavior: "instant" }));
  }

  function loadMoreCorrected() {
    if (loadingMoreCorrected) return;
    setLoadingMoreCorrected(true);
    window.setTimeout(() => {
      setCorrectedVisible((count) => count + 10);
      setLoadingMoreCorrected(false);
    }, 150);
  }

  async function completeLearn(item: Item) {
    if (!data || !item.learnContent || learnSavingId) return;
    setLearnSavingId(item.id);
    try {
      const result = await post("complete_item", { sessionId: data.session.id, itemId: item.id, assetId: item.learnContent.assetId }, `complete-learn:${data.session.id}:${item.id}`) as Data | true | false;
      if (!result) return;
      const nextSession = typeof result === "object" ? result.session : { ...data.session, items: data.session.items.map((entry) => entry.id === item.id ? { ...entry, status: "completed" as const } : entry) };
      const nextItem = nextSession.items.find((entry) => !entry.deferred && entry.status === "pending" && entry.kind !== "summary");
      if (nextItem) window.requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-today-item-id="${CSS.escape(nextItem.id)}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
    } finally {
      setLearnSavingId("");
    }
  }
  async function configureToday() {
    setPlanFeedback("");
    const payload = { budgetMinutes: planDraftMinutes, startLevel: planDraftLevel, newWordCount: planDraftNewWords, listeningEnabled: planDraftListening, focus: planDraftFocus };
    const result = await post("configure_today", payload, `today-plan:${data!.session.id}:${planDraftMinutes}:${planDraftLevel}:${planDraftNewWords}:${planDraftListening}:${planDraftFocus}`);
    setPlanFeedback(result === "queued_conflict" ? "Plan change is pending. Use Retry sync to apply it to the latest server copy." : result === true ? "Plan change saved on this device. It will apply after sync." : result ? `Plan updated: HSK ${planDraftLevel}, ${planDraftMinutes} minutes, ${planDraftNewWords} new word${planDraftNewWords === 1 ? "" : "s"}.` : "Plan was not updated. Reload the server copy and try again.");
    if (result) setPlanOpen(false);
  }
  async function playbackResponse<T>(response: Response) {
    const body = await response.json() as T & { code?: string; message?: string };
    if (!response.ok) throw new PlaybackRequestError(body.code ?? "UNKNOWN_ERROR", body.message);
    return body;
  }
  async function startFormalPlayback(card: Card) {
    setAudioError("");
    const cardKey = `${card.id}:${card.revision}`;
    const coordinator = new PlaybackVerificationCoordinator({
      onStateChange: setReviewPlaybackState,
      start: async () => playbackResponse<{ playbackTicket: string; notBefore?: string }>(await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "audio_review_playback_start", payload: { idempotencyKey: crypto.randomUUID(), cardId: card.id, cardRevision: card.revision, todayReview: entryIntent.kind === "today", dailySessionId: entryTodaySessionId, dailyItemId: entryTodayItemId }, tzOffset: tz(), queueBinding: data?.queueBinding }) })),
      complete: async (playbackTicket) => {
        await playbackResponse(await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "audio_review_playback_complete", payload: { idempotencyKey: crypto.randomUUID(), cardId: card.id, cardRevision: card.revision, playbackTicket, todayReview: entryIntent.kind === "today", dailySessionId: entryTodaySessionId, dailyItemId: entryTodayItemId }, tzOffset: tz(), queueBinding: data?.queueBinding }) }));
        await post("audio_review_ready", { cardId: card.id, cardRevision: card.revision, playbackTicket }, `audio-ready:${card.id}:${card.revision}`);
      },
    });
    reviewPlayback.current?.coordinator.reset();
    reviewPlayback.current = { cardKey, coordinator };
    try { return await coordinator.prepare(); }
    catch (error) {
      const code = playbackErrorCode(error);
      console.warn("[playback-verification]", { context: "review", phase: "start", code });
      setAudioError(playbackVerificationMessage(code, "start"));
      return false;
    }
  }
  async function completeFormalPlayback(card: Card) {
    const active = reviewPlayback.current;
    if (!active || active.cardKey !== `${card.id}:${card.revision}`) { setAudioError(playbackVerificationMessage("AUDIO_PLAYBACK_REQUIRED", "complete")); return; }
    try {
      await active.coordinator.finish();
      setAudioError("");
    } catch (error) {
      const code = playbackErrorCode(error);
      console.warn("[playback-verification]", { context: "review", phase: "complete", code });
      setAudioError(playbackVerificationMessage(code, "complete"));
    }
  }

  if (loadFailure) {
    const offline = loadFailure === "offline";
    const temporarilyUnavailable = loadFailure === "temporarily_unavailable";
    const title = mode === "mistakes" ? "We couldn’t load your mistakes." : offline ? "You're offline" : temporarilyUnavailable ? "Learning data is temporarily busy" : "We couldn't load this page";
    const text = offline
      ? "Reconnect and try again. Your progress is unchanged."
      : temporarilyUnavailable
        ? retryingLoad ? "We're reconnecting automatically. Your progress is unchanged." : "Please try again in a moment. Your progress is unchanged."
        : "We couldn't load your learning data right now. Your progress is unchanged.";
    return <LearningStatePage mode={mode} title={title} text={text} eyebrow={offline ? "Offline" : "Service temporarily busy"} note="Your existing progress is unchanged.">
      <button onClick={() => void load(true)} className="btn" disabled={retryingLoad}>{retryingLoad ? "Retrying…" : "Try again"}</button>
    </LearningStatePage>;
  }
  if (error) return <LearningStatePage mode={mode} title={error.startsWith("Free daily") ? "Daily limit reached" : "We couldn't load this page"} text={error} error>{error.startsWith("Free daily") ? <Link href="/pricing" className="btn">Compare Pro</Link> : <button onClick={() => void load(true)} className="btn">Try again</button>}</LearningStatePage>;
  if (mode === "today" && completionSyncState !== "idle") return <LearningStatePage mode={mode} title={completionSyncState === "syncing" ? "Syncing your completed session…" : "Your completion is saved, but the latest session is still syncing"} text={completionSyncState === "syncing" ? "Checking the latest server progress before showing your next step." : "We will not show an outdated locked step. Retry to load the latest saved session."} loading={completionSyncState === "syncing"}>
    {completionSyncState === "failed" && <button className="btn" onClick={() => { completionSyncAttempts.current = 0; setCompletionSyncState("syncing"); void load(true); }}>Retry sync</button>}
  </LearningStatePage>;
  if (!data && mode === "mistakes") return <Shell title="Mistakes" active="Mistakes" sub="Retry your wrong answers. A mistake moves to Corrected after you answer it correctly.">
    <div className="mistakes-skeleton mx-auto grid max-w-[880px] gap-3" role="status" aria-label="Loading your mistakes" aria-live="polite">
      <span className="sr-only">Loading your mistakes</span>
      <div className="grid grid-cols-2 gap-2"><div className="h-12 animate-pulse rounded-xl bg-slate-200"/><div className="h-12 animate-pulse rounded-xl bg-slate-200"/></div>
      <div className="h-28 animate-pulse rounded-2xl bg-slate-100"/>
      <div className="h-20 animate-pulse rounded-2xl bg-slate-100"/>
      <div className="h-20 animate-pulse rounded-2xl bg-slate-100"/>
    </div>
  </Shell>;
  if (!data) return <LearningStatePage mode={mode} title={mode === "review" ? "Preparing your review" : "Preparing today's plan"} text="Loading due items and restoring progress." loading />;
  const open = data.mistakes.filter((mistake) => mistake.status === "open");
  const corrected = data.mistakes
    .filter((mistake) => mistake.status === "resolved")
    .sort((a, b) => (b.resolvedAt ?? b.createdAt).localeCompare(a.resolvedAt ?? a.createdAt));
  const filteredOpen = open.filter((mistake) => mistakeFilter === "all"
    || (mistakeFilter === "reading" ? mistake.dimension === "reading" : mistake.dimension === "audio" || mistake.dimension === "context_audio"));
  const visibleCorrected = corrected.slice(0, correctedVisible);
  const correctedGroups = groupCorrectedMistakes(visibleCorrected);
  const dueForToday = data.capabilities.focusedReview
    ? data.focusedReview
    : data.cards.filter((card) => card.dueAt <= new Date().toISOString());
  const firstReviewIndex = (() => {
    const pending = data.session.items.findIndex((item) => item.kind === "review" && item.status === "pending");
    return pending >= 0 ? pending : data.session.items.findIndex((item) => item.kind === "review");
  })();


  if (mode === "today") {
    const currentTodayItems = data.session.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.kind === "summary" || (!item.deferred && (item.estimatedMinutes ?? 0) > 0));
    const deferredTodayItems = data.session.items.filter((item) => item.deferred);
    const plannedTodayTasks = currentTodayItems.map(({ item }) => item).filter((item) => item.kind !== "summary");
    const reviewGroupItems = plannedTodayTasks.filter((item) => item.kind === "review");
    const completedReviewCount = reviewGroupItems.filter((item) => item.status === "completed").length;
    const reviewHasOpenMistake = (review: Item) => open.some((mistake) => mistake.cardId
      ? mistake.cardId === review.reviewCardId
      : mistake.contentId === review.contentId && mistake.dimension === review.dimension);
    const incorrectReviewCount = reviewGroupItems.filter((item) => item.status === "completed" && reviewHasOpenMistake(item)).length;
    const hasMistakeReview = reviewGroupItems.some(reviewHasOpenMistake);
    const canChangeTodayWords = canRefreshTodayWords(data.session);
    const nextTodayReviewAt = data.cards.map((card) => card.dueAt).filter((dueAt) => new Date(dueAt).getTime() > Date.now()).sort()[0];
    const selectedReviewItems = currentTodayItems.map(({ item }) => item).filter((item) => item.kind === "review" && item.status === "pending");
    const selectedReviewCards = selectedReviewItems
      .map((item) => dueForToday.find((card) => card.id === item.reviewCardId || (!item.reviewCardId && card.contentId === item.contentId && card.dimension === item.dimension)))
      .filter((card): card is Card => Boolean(card));
    const orderedTodayItems = [...currentTodayItems];
    const activeToday = orderedTodayItems.find(({ item }) => item.kind !== "summary" && item.status === "pending")?.item;
    const completionSummary = todaySummaryStats(data.session.items);
    const summaryChanges = todaySummaryChanges(data.session.items, data.cards);
    const completedTasks = completionSummary.completedTasks;
    const skippedTasks = completionSummary.skippedTasks;
    const remainingMinutes = plannedTodayTasks.filter((item) => item.status === "pending").reduce((sum, item) => sum + (item.estimatedMinutes ?? 0), 0);
    const journeyProgress = todayJourneyProgress(plannedTodayTasks);
    const currentStep = journeyProgress.currentPhase;
    const gapMinutes = Math.max(0, (data.session.budgetMinutes ?? 20) - (data.session.totalEstimatedMinutes ?? 0));
    const weakest = Object.entries(data.mastery).sort((a, b) => a[1] - b[1])[0]?.[0]?.replace("context_audio", "context listening").replace("audio", "listening") ?? "vocabulary";
    const recommendedMinutes = recommendTodayMinutes({ monthPoints: reward?.monthPoints ?? 0, openMistakes: open.length, currentStreak: data.streak.current, mastery: data.mastery, cardCount: data.cards.length });
    const summaryComplete = data.session.items.some((item) => item.kind === "summary" && item.status === "completed");
    const progressPercent = journeyProgress.totalPhases ? Math.round((journeyProgress.completedPhases / journeyProgress.totalPhases) * 100) : 0;
    return <Shell title="Today" active="Today" sub="One guided session: review what matters, learn distinct new words, practise them, then see your result.">
      <div className="today-page">
      <section className="mb-5 overflow-hidden rounded-[28px] border border-blue-200 bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 text-white shadow-[0_24px_70px_rgba(30,64,175,0.18)]">
        <div className="grid items-center gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_240px] sm:p-7">
          <div>
            <p className="text-sm font-semibold text-blue-200">Today Session · HSK {data.session.startLevel ?? 1}</p>
            <h2 className="mt-2 text-3xl font-bold text-white">{summaryComplete ? "Today is complete" : activeToday ? label(activeToday) : "Your next session is ready"}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">Today chooses the order for you: urgent memory first, then the exact next learning step.</p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-sm"><p><strong className="block text-white">Current phase</strong>{currentStep} of {journeyProgress.totalPhases}</p><p><strong className="block text-white">Overall progress</strong>{journeyProgress.completedPhases}/{journeyProgress.totalPhases}</p><p><strong className="block text-white">Time</strong>{remainingMinutes} min remaining</p></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-950/80" role="progressbar" aria-label="Today progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}><div className="h-full rounded-full bg-blue-300 transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${progressPercent}%` }} /></div>
            {activeToday && <button className="mt-4 min-h-[44px] text-sm font-semibold text-blue-100 underline underline-offset-4" onClick={() => void skip(activeToday)}>Skip and move to tomorrow</button>}
          </div>
          <TodayHeroArtwork progress={progressPercent} complete={summaryComplete} />
        </div>
      </section>
      {activeToday && activeToday.kind !== "learn" && <div className="today-mobile-action sticky z-30 mb-5 rounded-2xl border border-blue-200 bg-white/95 p-2 shadow-[0_16px_42px_rgba(15,23,42,0.2)] backdrop-blur md:hidden" style={{ bottom: "calc(76px + env(safe-area-inset-bottom))" }}>{primaryTodayAction(activeToday, data.session.id, currentStep, journeyProgress.totalPhases, selectedReviewItems, selectedReviewCards)}</div>}
      <section className="mb-5 flex min-h-[72px] flex-col items-stretch gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <span className="min-w-0"><strong className="block text-slate-950">Today’s plan</strong><span className="block text-sm leading-6 text-slate-600 sm:truncate">HSK {data.session.startLevel ?? 1} · {data.session.budgetMinutes ?? 20} min · {data.session.plannedNewWordCount ?? data.session.newWordCount ?? 3} new · {(data.session.listeningEnabled ?? true) ? "Listening on" : "Listening off"} · {({ balanced: "Balanced", review_first: "Review first", fix_mistakes: "Fix mistakes", listening_focus: "Listening focus" } as const)[data.session.focus ?? "balanced"]}</span></span>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><button type="button" disabled={!canChangeTodayWords} className="min-h-[48px] rounded-xl border border-blue-200 px-4 font-bold text-blue-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400" onClick={() => void refreshTodayWords()}>Change today’s words</button><button className="min-h-[48px] flex-none rounded-xl px-4 font-bold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100" onClick={() => setPlanOpen(true)}>Adjust today’s plan</button></div>
      </section>
      <p className="-mt-3 mb-5 text-sm text-slate-500">Choices are limited to once per day. Started words stay fixed; only unstarted New words can change.</p>
      {planFeedback && <p className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700" role="status">{planFeedback}</p>}
      <section className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
        <p><strong>{plannedTodayTasks.length} tasks · {data.session.totalEstimatedMinutes ?? 0} min planned</strong></p>
        <p className="mt-1 text-sm text-slate-600"><strong>Why this plan:</strong> mistakes and due memory come first, then the exact new word, its available listening, and a saved practice result.</p>
        {gapMinutes > 0 && <p className="mt-2 text-sm text-slate-600">{gapMinutes} min remains unfilled because no approved ready task fits the remaining budget. Today does not add filler.</p>}
        <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2"><p><strong>Learning Points:</strong> {reward ? `${reward.monthPoints} this month across ${reward.monthLearningDays} qualified days` : "Build from qualified learning days"}</p><p><strong>Why today arranged this:</strong> {open.length ? `${open.length} open mistake${open.length === 1 ? "" : "s"} are prioritised before new work.` : `No open mistake is blocking you; ${weakest} is your lowest mastery area.`}</p></div>
        {deferredTodayItems.length > 0 && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="status"><strong>{deferredTodayItems.length} saved word{deferredTodayItems.length === 1 ? " is" : "s are"} waiting for room.</strong> Increase the budget to bring {deferredTodayItems.length === 1 ? "it" : "them"} into this session.</p>}
      </section>
      {syncState !== "synced" && <div className={`step7-alert ${syncState === "failed" || syncState === "conflict" ? "error" : "warning"}`} role="status"><strong>Offline sync: {syncState.replaceAll("_", " ")}</strong><p>{syncState === "conflict" ? "Another device changed this learning record. Your action remains pending; retry it against the latest server copy." : syncState === "failed" ? "Sync failed. Your pending action remains on this device." : "Your action is stored locally and will sync with the same operation key."}</p><button className="btn secondary" onClick={() => void retryPending()}>Retry sync</button></div>}
      {data.session.notice && <article className="mb-4 rounded-2xl bg-amber-50 p-5 text-amber-950" role="status"><span className="eyebrow">{data.session.notice.code === "LEVEL_COMPLETE" ? "Level complete" : "Plan availability"}</span><h2>{data.session.notice.message}</h2><Link className="btn mt-3" href={data.session.notice.actionHref}>{data.session.notice.actionLabel}</Link></article>}
      <div className="relative grid gap-3 pl-3 sm:pl-5" aria-label="Today task sequence">
        <span className="absolute bottom-10 left-[35px] top-10 w-0.5 bg-slate-200 sm:left-[43px]" aria-hidden="true" />
        {orderedTodayItems.map(({ item, index }) => {
          const locked = item.status === "pending" && activeToday?.id !== item.id;
          const journeyState = item.status === "completed" ? "completed" : item.status === "skipped" ? "skipped" : locked ? "locked" : "current";
          if (item.kind === "review" && index !== firstReviewIndex) return null;
          if (item.kind === "review") return <article data-today-item-id={item.id} className={`relative z-[1] grid grid-cols-[48px_minmax(0,1fr)] gap-4 rounded-2xl border p-4 sm:p-5 ${todayJourneyTone("review", journeyState)}`} key={item.id}>
            <TodayJourneyIcon item={item} state={journeyState} />
            <div className="min-w-0"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-extrabold uppercase tracking-[.14em] text-violet-700">{hasMistakeReview ? "Mistake · Review" : "Review"}</span><TodayStatus state={journeyState} /></div>
              <h2 className="mt-1 text-xl font-bold text-slate-950">{completedReviewCount === reviewGroupItems.length ? `Today review complete · ${completedReviewCount}/${reviewGroupItems.length}` : `${completedReviewCount}/${reviewGroupItems.length} reviewed`}</h2>
              <p className="mt-1 text-slate-600">{journeyState === "locked" ? "Complete the previous step to unlock." : selectedReviewItems.length > 0 ? `About ${selectedReviewItems.reduce((sum, entry) => sum + (entry.estimatedMinutes ?? 0), 0)} min · ${dueForToday.length} total due.` : "Step complete · memory checks saved."}</p>
              {completedReviewCount === reviewGroupItems.length && <p className="mt-2 text-sm font-semibold text-violet-800">{incorrectReviewCount ? `${incorrectReviewCount} wrong ${incorrectReviewCount === 1 ? "answer remains" : "answers remain"} in later review.` : "No wrong answer remains from this review phase."}</p>}
              <p className="mt-2 text-sm text-violet-800"><strong>Why now:</strong> due memory and open mistakes come before new material.</p>
              <ul className="mt-3 grid gap-2 text-sm text-violet-900">{reviewGroupItems.map((review, reviewIndex) => {
                const isMistake = reviewHasOpenMistake(review);
                return <li className="rounded-xl border border-violet-200 bg-white/70 px-3 py-2" key={review.id}><strong>{isMistake ? "Mistake" : "Review"} {reviewIndex + 1}:</strong> {isMistake ? "You previously answered this word incorrectly." : "This word is due for memory review."}</li>;
              })}</ul>
              {completedReviewCount === reviewGroupItems.length && <details className="mt-3 rounded-xl border border-violet-200 bg-white/70 px-4 py-3"><summary className="cursor-pointer font-semibold text-violet-900">View completed review record</summary><ul className="mt-2 space-y-1 text-sm text-slate-600">{reviewGroupItems.map((review, reviewIndex) => <li key={review.id}>✓ Review {reviewIndex + 1} · saved</li>)}</ul></details>}
              {journeyState === "current" && <div className="mt-4 hidden md:block">{primaryTodayAction(item, data.session.id, currentStep, journeyProgress.totalPhases, selectedReviewItems, selectedReviewCards)}</div>}
            </div>
          </article>;
          if (item.kind === "summary") return <article className={`relative z-[1] grid grid-cols-[48px_minmax(0,1fr)] gap-4 rounded-2xl border p-4 sm:p-5 ${item.status === "completed" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`} key={item.id} aria-live="polite">
            <TodayJourneyIcon item={item} state={item.status === "completed" ? "completed" : "locked"} />
            <div className="min-w-0"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-extrabold uppercase tracking-[.14em] text-emerald-700">Daily Summary</span><TodayStatus state={item.status === "completed" ? "completed" : "locked"} /></div><h2 className="mt-1 text-xl font-bold text-slate-950">{item.status === "completed" ? "Daily session complete" : "Finish the steps above"}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3"><p><strong>Stage progress</strong><br />{journeyProgress.completedPhases}/{journeyProgress.totalPhases} stages complete</p><p><strong>Completed tasks</strong><br />{completedTasks}</p><p><strong>Skipped tasks</strong><br />{skippedTasks}</p></div>
              <div className="mt-3 grid gap-2 rounded-2xl bg-white/80 p-4 text-sm sm:grid-cols-2"><p><strong>Words learned</strong><br />{completionSummary.wordsLearned}</p><p><strong>Reviews completed</strong><br />{completionSummary.reviewsCompleted}</p><p><strong>Estimated minutes</strong><br />{data.session.totalEstimatedMinutes ?? 0}</p><p><strong>Next review</strong><br />{nextTodayReviewAt ? new Date(nextTodayReviewAt).toLocaleString() : "Nothing scheduled"}</p><p><strong>Listening checks</strong><br />{completionSummary.listeningCompleted}</p><p><strong>Practice questions</strong><br />{Math.max(completionSummary.practiceCompleted, data.practiceQuestionsCompleted)}</p><p><strong>Open mistakes</strong><br />{open.length}</p></div>
              {item.status === "completed" && <div className="mt-3 grid gap-2 rounded-2xl border border-emerald-200 bg-white/90 p-4 text-sm">
                <p><strong>Learned today:</strong> {summaryChanges.learnedWords.length ? summaryChanges.learnedWords.join("、") : "No new word completed."}</p>
                <p><strong>Entered review:</strong> {summaryChanges.enteredReviewWords.length ? summaryChanges.enteredReviewWords.join("、") : "No new review entry."}</p>
                <p><strong>Continue tomorrow:</strong> {summaryChanges.continueTomorrowWords.length ? summaryChanges.continueTomorrowWords.join("、") : "None."}</p>
                <p><strong>Tomorrow:</strong> Eligible vocabulary, if available, will form a new controlled combination; at most one genuinely started word can continue.</p>
              </div>}
              <div className="mt-4 rounded-2xl bg-white/80 p-4 text-sm"><p><strong>Monthly learning score:</strong> {reward ? `${reward.monthPoints} Learning Points across ${reward.monthLearningDays} qualified days` : data.scope === "guest" ? "Sign in to track Learning Points." : "Score is temporarily unavailable."}</p><p className="mt-2"><strong>Today&apos;s learning reward:</strong> {reward ? reward.todayAwarded ? `+${reward.todayAward} Learning Points earned today.` : reward.todayQualified ? `${reward.todayAward} Learning Points are ready to be recorded.` : `${Math.ceil(reward.remainingSeconds / 60)} active minutes remain; day ${reward.nextMonthLearningDay} is worth ${reward.nextAward} points.` : "Reward status is unavailable; no points are being claimed here."}</p>{reward && item.status === "completed" && <p className="mt-2 font-bold text-blue-800">Learning Points track qualified learning days. Conversion is not open yet; subscription AI credits stay separate.</p>}</div>
              <p className="mt-4"><strong>Recommended focus:</strong> {open.length ? "Correct open mistakes before adding more new material." : `Continue HSK ${data.session.startLevel ?? 1}, with extra ${weakest} practice.`}</p>
              <p><strong>Current streak:</strong> {data.streak.current} day{data.streak.current === 1 ? "" : "s"} · longest {data.streak.longest}. {reward && reward.remainingSeconds > 0 ? `${Math.ceil(reward.remainingSeconds / 60)} active minutes remain for today’s qualification.` : data.streakBasis}</p>
              {item.status === "completed" && <div className="mt-5 flex flex-wrap gap-3"><Link className="btn" href={`/vocabulary/${data.session.startLevel ?? 1}`}>Learn {data.session.plannedNewWordCount ?? data.session.newWordCount ?? 3} more words</Link><Link className="btn secondary" href="/mistakes">Review {open.length} open mistakes</Link><Link className="btn secondary" href="/dashboard">Done for today</Link></div>}
            </div>
          </article>;
          return <article data-today-item-id={item.id} className={`relative z-[1] grid grid-cols-[48px_minmax(0,1fr)] gap-4 rounded-2xl border p-4 sm:p-5 ${todayJourneyTone(item.kind, journeyState)}`} key={item.id}>
            <TodayJourneyIcon item={item} state={journeyState} />
            <div className="min-w-0"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-extrabold uppercase tracking-[.14em]">{item.kind === "learn" ? item.todayStatus === "continue" ? "Continue" : "New" : item.dimension?.replace("_", " ") ?? item.kind}</span><TodayStatus state={journeyState} /></div><h2 className="mt-1 text-xl font-bold text-slate-950">{label(item)}</h2>
              <p className="mt-1 text-slate-600">{journeyState === "completed" ? "Step complete · progress saved." : journeyState === "skipped" ? "Moved to tomorrow · available to restore." : journeyState === "locked" ? "Complete the previous step to unlock." : `Ready now · ${item.estimatedMinutes ?? 0} min`}</p>
              <p className="mt-2 text-sm text-blue-800"><strong>Why now:</strong> {todayReason(item, open.length, weakest)}</p>
              {journeyState === "current" && item.kind === "learn" && item.learnContent && <section className="mt-4 rounded-2xl border border-blue-200 bg-white p-5" aria-label={`Learn ${item.learnContent.hanzi}`}>
                <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-4xl font-bold text-slate-950" lang="zh-Hans">{item.learnContent.hanzi}</p><p className="mt-1 text-lg font-semibold text-blue-700">{item.learnContent.pinyin}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">{item.learnContent.partOfSpeech}</span></div>
                <p className="mt-4 text-lg text-slate-800"><strong>Meaning:</strong> {item.learnContent.meaning}</p>
                {item.learnContent.audioSrc && <div className="mt-4"><p className="mb-2 text-sm font-semibold text-slate-700">Formal pronunciation</p><audio controls preload="metadata" src={item.learnContent.audioSrc} className="w-full max-w-full" onPlay={() => void startLearn(item)} /></div>}
                {item.learnContent.example && <div className="mt-4 border-t border-slate-200 pt-4"><p className="text-lg font-semibold text-slate-950" lang="zh-Hans">{item.learnContent.example.hanzi}</p><p className="mt-1 text-blue-700">{item.learnContent.example.pinyin}</p><p className="mt-1 text-sm text-slate-600"><strong>Example translation:</strong> {item.learnContent.example.meaning}</p></div>}
                <button type="button" disabled={learnSavingId === item.id} onClick={() => void completeLearn(item)} className="mt-5 min-h-[50px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">{learnSavingId === item.id ? "Saving…" : <>I’ve learned “{item.learnContent.hanzi}” · {plannedTodayTasks.find((entry) => entry.status === "pending" && entry.id !== item.id)?.kind === "listen" ? "Continue to listening" : "Continue to next step"}</>}</button>
              </section>}
              {journeyState === "current" && (item.kind !== "learn" || !item.learnContent) && <div className="mt-4 hidden md:block">{primaryTodayAction(item, data.session.id, currentStep, journeyProgress.totalPhases, selectedReviewItems, selectedReviewCards)}</div>}
              {item.status === "skipped" && <button className="mt-4 min-h-[48px] rounded-xl border border-blue-300 bg-white px-5 py-3 font-bold text-blue-700" onClick={() => void restore(item)}>Restore step</button>}
            </div>
          </article>;
        })}
      </div>
      <Mastery values={data.mastery} scope={data.scope} />
      {planOpen && <div className="today-plan-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPlanOpen(false); }}>
        <div ref={planDialogRef} tabIndex={-1} className="today-plan-dialog" role="dialog" aria-modal="true" aria-labelledby="today-plan-title">
          <header className="today-plan-header"><div><span className="eyebrow">Today settings</span><h2 id="today-plan-title">Adjust today’s plan</h2><p>Change today’s workload and priority. Your completed steps stay saved.</p></div><button type="button" className="today-plan-close" aria-label="Close plan settings" onClick={() => setPlanOpen(false)}>×</button></header>
          <form className="today-plan-form" onSubmit={(event) => { event.preventDefault(); void configureToday(); }}>
            <p className="today-plan-recommendation"><strong>Recommended time:</strong> {recommendedMinutes} minutes, based on your score, streak, open mistakes and recent mastery.</p>
            <div className="today-plan-grid"><label>HSK level<select aria-label="Learning level" value={planDraftLevel} onChange={(event) => setPlanDraftLevel(Number(event.target.value))}>{Array.from({ length: 9 }, (_, index) => index + 1).map((level) => <option key={level} value={level}>{level >= 7 ? `HSK ${level} · Advanced 7–9 band` : `HSK ${level}`}</option>)}</select></label>
              <label>Learning time<select aria-label="Today&apos;s time budget" value={planDraftMinutes} onChange={(event) => { const minutes = Number(event.target.value) as TodayBudgetMinutes; setPlanDraftMinutes(minutes); setPlanDraftNewWords(recommendTodayNewWordCount(minutes)); }}>{TODAY_BUDGET_OPTIONS.map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes{minutes === recommendedMinutes ? " · Recommended" : ""}</option>)}</select></label></div>
            <fieldset><legend>New words</legend><div className="today-plan-segments">{TODAY_NEW_WORD_OPTIONS.map((count) => <label key={count} className={planDraftNewWords === count ? "selected" : ""}><input type="radio" name="new-words" value={count} checked={planDraftNewWords === count} onChange={() => setPlanDraftNewWords(count)} /><strong>{count}</strong><span>{count === 1 ? "word" : "words"}</span></label>)}</div></fieldset>
            <label className="today-plan-switch"><span><strong>Include listening</strong><small>Add available word and context audio to today’s route.</small></span><input type="checkbox" checked={planDraftListening} onChange={(event) => setPlanDraftListening(event.target.checked)} /></label>
            <fieldset><legend>Priority</legend><div className="today-plan-focus">{TODAY_FOCUS_OPTIONS.map((focus) => { const copy = { balanced: ["Balanced", "Mix due memory and new work."], review_first: ["Review first", "Clear all due reviews before new work."], fix_mistakes: ["Fix mistakes", "Put unresolved mistakes first."], listening_focus: ["Listening focus", "Lead with available listening tasks."] }[focus]; return <label key={focus} className={planDraftFocus === focus ? "selected" : ""}><input type="radio" name="today-focus" value={focus} checked={planDraftFocus === focus} onChange={() => setPlanDraftFocus(focus)} /><strong>{copy[0]}</strong><span>{copy[1]}</span></label>; })}</div></fieldset>
            <footer className="today-plan-actions"><button type="button" className="btn secondary" onClick={() => setPlanOpen(false)}>Cancel</button><button type="submit" className="btn">Save changes</button></footer>
          </form>
        </div>
      </div>}
      {celebration && <div className="today-celebration" role="dialog" aria-modal="true" aria-labelledby="today-celebration-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setCelebration(null); }}>
        {celebration.animate && <div className="today-confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div>}
        <div ref={celebrationPanelRef} tabIndex={-1} className="today-celebration-panel"><span className="today-celebration-icon"><HomeIcon name={celebration.icon} /></span><span className="eyebrow">{celebration.eyebrow}</span><h2 id="today-celebration-title">{celebration.title}</h2><p>{celebration.message}</p>
          <div className="today-reward"><strong>Learning Points</strong><span>{reward ? reward.todayAwarded ? `+${reward.todayAward} earned today` : `${Math.ceil(reward.remainingSeconds / 60)} active min to today’s reward` : data.scope === "guest" ? "Sign in to earn daily points" : "Progress saved"}</span></div>
          {celebration.kind === "step" && activeToday ? <div className="mt-5 w-full" onClick={() => setCelebration(null)}>{primaryTodayAction(activeToday, data.session.id, currentStep, plannedTodayTasks.length, selectedReviewItems, selectedReviewCards)}</div> : <button className="btn mt-5" type="button" onClick={() => setCelebration(null)}>Done for today</button>}
        </div>
      </div>}
      </div>
    </Shell>;
  }

  if (mode === "mistakes") {
    const firstOpenHref = open[0] ? mistakeReviewHref(open[0]) : "/practice";
    return <Shell title="Mistakes" active="Mistakes" sub="Retry your wrong answers. A mistake moves to Corrected after you answer it correctly.">
      <div className="mx-auto max-w-full overflow-x-hidden">
        <div className="mb-5 grid grid-cols-2 gap-2" role="tablist" aria-label="Mistake status">
          <button type="button" role="tab" aria-selected={mistakeTab === "open"} onClick={() => switchMistakeTab("open")} className={`min-h-[48px] rounded-xl border px-3 font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${mistakeTab === "open" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-700"}`}>To correct <span aria-label={`${open.length} mistakes`}>{open.length}</span></button>
          <button type="button" role="tab" aria-selected={mistakeTab === "corrected"} onClick={() => switchMistakeTab("corrected")} className={`min-h-[48px] rounded-xl border px-3 font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${mistakeTab === "corrected" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-700"}`}>Corrected <span aria-label={`${corrected.length} corrected mistakes`}>{corrected.length}</span></button>
        </div>

        {mistakeNotice && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900" role="status"><strong>{mistakeNotice}</strong>{open[0] && <Link className="min-h-[44px] rounded-lg border border-emerald-700 px-4 py-2 font-bold" href={firstOpenHref}>Next mistake</Link>}</div>}

        {mistakeTab === "open" ? <section role="tabpanel" aria-label="Mistakes to correct">
          {open.length ? <>
            <section className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6" aria-label="Correction task">
              <div><h2 className="text-2xl font-bold text-slate-950">{open.length} {open.length === 1 ? "mistake" : "mistakes"} to correct</h2><p className="mt-1 text-slate-600">Retry them correctly to clear your mistake queue.</p></div>
              <Link href={firstOpenHref} className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 sm:mt-0 sm:w-auto">Correct {open.length} mistake{open.length === 1 ? "" : "s"}</Link>
            </section>
            <div className="mb-4 overflow-x-auto" aria-label="Filter mistakes"><div className="flex min-w-max gap-2 pb-1">{(["all", "reading", "listening"] as const).map((filter) => <button type="button" key={filter} aria-pressed={mistakeFilter === filter} onClick={() => setMistakeFilter(filter)} className={`min-h-[44px] whitespace-nowrap rounded-full border px-5 py-2 font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${mistakeFilter === filter ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-300 bg-white text-slate-700"}`}>{filter === "all" ? "All" : filter === "reading" ? "Reading" : "Listening"}</button>)}</div></div>
            {filteredOpen.length ? <div className="grid gap-3">{filteredOpen.map((mistake) => <article className="rounded-2xl border border-blue-200 border-l-4 border-l-blue-600 bg-blue-50/40 p-4 sm:p-5" key={mistake.id}>
              <span className="text-xs font-extrabold uppercase tracking-[.14em] text-blue-700">To correct · {mistakeDimensionLabel(mistake.dimension)}</span>
              <h2 className="mt-2 text-xl font-bold leading-snug text-slate-950 sm:text-2xl">{mistake.prompt}</h2>
              <p className="mt-3 text-sm text-slate-600">{mistake.level ? `HSK ${mistake.level} · ` : ""}{mistake.skill} · Added {formatMistakeDate(mistake.createdAt)}</p>
              <Link className="mt-4 inline-flex min-h-[44px] items-center rounded-xl border border-blue-600 bg-white px-4 py-2 font-bold text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" href={mistakeReviewHref(mistake)}>Retry question</Link>
            </article>)}</div> : <State title="No mistakes match this filter" text="Choose another question type to see other corrections." />}
          </> : <State title="All caught up" text="You have corrected every mistake in your queue."><div className="mt-5 flex flex-col gap-3 sm:flex-row"><Link className="btn" href="/practice">Keep practicing</Link><button type="button" className="btn secondary" onClick={() => switchMistakeTab("corrected")}>View corrected history</button></div></State>}
        </section> : <section role="tabpanel" aria-label="Corrected mistakes">
          {corrected.length ? <>
            <div className="mb-5"><h2 className="text-2xl font-bold text-slate-950">{corrected.length} corrected mistake{corrected.length === 1 ? "" : "s"}</h2><p className="mt-1 text-slate-600">These records stay available for review.</p></div>
            <div className="grid gap-6">{correctedGroups.map((group) => <section key={group.label} aria-labelledby={`mistake-group-${group.label.toLowerCase()}`}><h3 id={`mistake-group-${group.label.toLowerCase()}`} className="mb-2 text-sm font-bold uppercase tracking-[.12em] text-slate-500">{group.label}</h3><div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">{group.items.map((mistake) => <article className="p-4 sm:px-5" key={mistake.id}>
              <span className="text-xs font-extrabold uppercase tracking-[.14em] text-emerald-700">✓ Corrected · {mistakeDimensionLabel(mistake.dimension)}</span>
              <h4 className="mt-1 text-base font-bold leading-snug text-slate-950 sm:text-lg">{mistake.prompt}</h4>
              <p className="mt-2 text-sm text-slate-600">{mistake.level ? `HSK ${mistake.level} · ` : ""}{mistake.skill}</p>
              <p className="mt-1 text-sm text-emerald-700">Corrected {formatMistakeDateTime(mistake.resolvedAt ?? mistake.createdAt)}</p>
            </article>)}</div></section>)}</div>
            {correctedVisible < corrected.length ? <button type="button" onClick={loadMoreCorrected} disabled={loadingMoreCorrected} className="mt-5 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">{loadingMoreCorrected ? "Loading…" : "Load more"}</button> : <p className="mt-5 text-center text-sm font-semibold text-slate-500" role="status">All corrected mistakes loaded</p>}
          </> : <State title="No corrected mistakes yet" text="Correct a mistake successfully and it will appear here."><button type="button" className="btn mt-5" onClick={() => switchMistakeTab("open")}>View mistakes to correct</button></State>}
        </section>}
      </div>
    </Shell>;
  }

  const due = data.capabilities.focusedReview ? data.focusedReview : data.cards.filter((card) => card.dueAt <= new Date().toISOString());
  const serverScopedReviewIds = reviewCardIdsForScope(data.reviewLevelControl, selectedReviewScope);
  const dueById = new Map<string, Card>();
  for (const card of due) dueById.set(card.id, card);
  const scopedDue = serverScopedReviewIds.map((id) => dueById.get(id)).filter((card): card is Card => Boolean(card));
  const selectableDue = filterReviewCards(scopedDue, { difficultOnly });
  const selectedReviewCount = selectableDue.length;
  const composition = reviewComposition(selectableDue);
  const recommendedCount = recommendReviewCount(scopedDue);
  const reviewedSessionCards = (reviewIds ?? []).map((id) => data.cards.find((card) => card.id === id)).filter((card): card is Card => Boolean(card));
  const nextReviewAt = reviewedSessionCards.map((card) => card.dueAt).filter((dueAt) => new Date(dueAt).getTime() > Date.now()).sort()[0];
  const todayReviewItemIds = new Set(data.session.reviewItemIds ?? []);
  const todayCompletedReviewIds = new Set(data.session.items.filter((item) => todayReviewItemIds.has(item.id) && item.kind === "review" && item.status === "completed").map((item) => item.reviewCardId).filter((id): id is string => Boolean(id)));
  const sessionTotal = reviewIds?.length ?? 0;
  const todayReviewedCount = entryIntent.kind === "today" ? (reviewIds ?? []).filter((id) => todayCompletedReviewIds.has(id)).length : reviewedCount;
  const displayReviewedCount = entryIntent.kind === "today" ? todayReviewedCount : reviewedCount;
  const activeReviewId = entryIntent.kind === "today"
    ? activeTodayReviewCardId(reviewIds, todayCompletedReviewIds)
    : activeReviewCardId(reviewIds, reviewedCount);
  const storedActiveCard = activeReviewId ? data.cards.find((card) => card.id === activeReviewId) : undefined;
  const activeCard = storedActiveCard && entryIntent.kind === "today" && storedActiveCard.dimension !== "reading" ? {
    ...storedActiveCard,
    prompt: storedActiveCard.todayPrompt ?? storedActiveCard.prompt,
    instruction: storedActiveCard.todayInstruction,
    audioSrc: storedActiveCard.todayAudioSrc,
    audioText: storedActiveCard.todayAudioText,
    formalAudioSrc: storedActiveCard.todayAudioSrc,
    playbackRequired: storedActiveCard.todayPlaybackRequired,
    playbackReady: storedActiveCard.todayPlaybackReady,
    legacyReview: storedActiveCard.todayReviewMode !== "question_review",
    answerMode: storedActiveCard.todayReviewMode === "vocabulary_recall" ? "self_recall" as const : storedActiveCard.answerMode,
    correctAnswer: storedActiveCard.todayReviewMode === "vocabulary_recall" ? storedActiveCard.todayHanzi ?? "" : storedActiveCard.correctAnswer,
    topic: undefined,
    explanation: storedActiveCard.todayReviewMode === "vocabulary_recall" && storedActiveCard.todayHanzi && storedActiveCard.todayPinyin && storedActiveCard.todayMeaning
      ? `${storedActiveCard.todayHanzi} (${storedActiveCard.todayPinyin}) means “${storedActiveCard.todayMeaning}.”`
      : storedActiveCard.explanation,
    hanzi: storedActiveCard.todayHanzi,
    pinyin: storedActiveCard.todayPinyin,
    meaning: storedActiveCard.todayMeaning,
    example: storedActiveCard.todayExample,
  } : storedActiveCard;
  const activeFocusReason = data.focusedReview.find((card) => card.id === activeCard?.id)?.focusReason;
  const directEntryPreparing = !entryResolved || (entryIntent.kind !== "setup" && reviewIds === null);
  const directEntryEmpty = entryIntent.kind !== "setup" && reviewIds !== null && reviewIds.length === 0;
  const sessionComplete = Boolean(reviewIds?.length && (displayReviewedCount >= sessionTotal || !activeCard));
  const selectedText = activeCard?.choices.find((choice) => choice.key === selectedAnswer)?.text ?? reviewDraft;
  const currentAnswerCorrect = retryFeedback?.correct ?? false;
  const isMistakeRetry = Boolean(activeCard?.isMistake && !activeCard.legacyReview && activeCard.answerMode !== "self_recall");
  const canAnswerReview = Boolean(activeCard && !activeCard.legacyReview && activeCard.answerMode !== "self_recall");
  const todayListeningReview = entryIntent.kind === "today" && activeCard?.dimension !== "reading" ? activeCard : undefined;
  const useTodayListeningFlow = Boolean(todayListeningReview && (todayListeningReview.todayReviewMode === "question_review" || todayListeningReview.todayReviewMode === "vocabulary_recall"));
  const useTodayQuestionReview = Boolean(todayListeningReview && todayListeningReview.todayReviewMode === "question_review");
  const useTodayVocabularyRecall = Boolean(todayListeningReview && todayListeningReview.todayReviewMode === "vocabulary_recall");
  const chooseReviewScope = (scope: ReviewLevelScope) => {
    setSelectedReviewScope(scope);
    const url = new URL(window.location.href);
    if (scope === "current") url.searchParams.delete("level");
    else url.searchParams.set("level", String(scope));
    window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
  };
  const reviewScopeOptions: Array<{ scope: ReviewLevelScope; label: string; count: number }> = [
    { scope: "current", label: `Current level · HSK ${data.reviewLevelControl.currentLevel}`, count: data.reviewLevelControl.currentCardIds.length },
    { scope: "all", label: "All levels", count: data.reviewLevelControl.allCount },
    ...data.reviewLevelControl.levels.map(({ level, count }) => ({ scope: level, label: `HSK ${level}`, count })),
  ];
  const selectedReviewLevel = selectedReviewScope === "current" ? data.reviewLevelControl.currentLevel : typeof selectedReviewScope === "number" ? selectedReviewScope : null;

  return <Shell title={entryIntent.kind === "mistake" ? "Mistake correction" : "Review"} active="Review" sub={entryIntent.kind === "mistake" ? "Correct the original wrong answer, understand it, and continue or return to Mistakes." : "Review due memories with a short, explained rating flow."} compact={Boolean(reviewIds?.length)}>
    <div className="mx-auto max-w-[880px]">
      {entryIntent.kind === "today" && <section className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Today Session</p><p className="mt-1 text-sm text-slate-700">These due cards are the current saved Today step. Your position is restored after refresh or back navigation.</p></section>}
      {directEntryPreparing && <State title="Preparing your review" text="Loading the review items from where you started." />}
      {!reviewIds && entryResolved && entryIntent.kind === "setup" && <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 bg-slate-950 px-[24px] py-[24px] text-white sm:px-[32px] sm:py-[32px]">
          <p className="text-sm font-semibold text-blue-300">{data.capabilities.focusedReview ? "Focused Review · Pro" : "Review setup"}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Choose a focused session</h2>
          <p className="mt-3 max-w-2xl text-slate-300">{data.reviewLevelControl.allCount} item{data.reviewLevelControl.allCount === 1 ? " is" : "s are"} due across all levels. Your current level is HSK {data.reviewLevelControl.currentLevel}.</p>
          <p className="mt-4 text-sm font-semibold text-blue-200">Recommended review: {recommendedCount} item{recommendedCount === 1 ? "" : "s"} from the selected level and difficult-item history.</p>
        </div>
        <div className="p-[24px] sm:p-[32px]">
          <fieldset>
            <legend className="font-semibold text-slate-950">Choose review level</legend>
            <p className="mt-1 text-sm text-slate-600">Pick a level, then start when you are ready. Counts come from the same due-card filter used to build the session.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {reviewScopeOptions.map((option) => <button type="button" key={String(option.scope)} onClick={() => chooseReviewScope(option.scope)} aria-pressed={selectedReviewScope === option.scope} className={`min-h-[60px] rounded-xl border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${selectedReviewScope === option.scope ? "border-blue-600 bg-blue-50 text-blue-950" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`}><strong className="block">{option.label}</strong><span className="text-sm">{option.count} due</span></button>)}
            </div>
          </fieldset>
          <fieldset className="mt-6">
            <legend className="font-semibold text-slate-950">How long do you want to review?</legend>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {([5, 10, 20] as const).map((minutes) => <button type="button" key={minutes} onClick={() => setReviewMinutes(minutes)} aria-pressed={reviewMinutes === minutes} className={`min-h-[72px] rounded-2xl border px-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${reviewMinutes === minutes ? "border-blue-600 bg-blue-50 text-blue-950" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`}><strong className="block text-lg">{minutes} min</strong><span className="text-sm">Up to {Math.min(minutes, selectedReviewCount)} item{Math.min(minutes, selectedReviewCount) === 1 ? "" : "s"}</span></button>)}
            </div>
          </fieldset>
          <label className="mt-5 flex min-h-[48px] items-center gap-3 rounded-xl border border-slate-200 p-3"><input type="checkbox" checked={difficultOnly} onChange={(event) => setDifficultOnly(event.target.checked)} /><span><strong>Difficult items only</strong><small className="block text-slate-500">Open mistakes and cards below normal ease</small></span></label>
          <div aria-label="Review composition" className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3"><p><strong>Mistakes</strong><br />{composition.mistakes}</p><p><strong>Reading</strong><br />{composition.reading}</p><p><strong>Listening</strong><br />{composition.listening}</p></div>
          <details className="mt-4 rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-semibold">How to rate your memory</summary><p className="mt-2 text-sm text-slate-600">Choose Forgot if you could not recall it, Difficult if recall was slow or uncertain, Remembered if correct with normal effort, and Easy only when recall was immediate. Your choice schedules the next review.</p></details>
          <button disabled={selectedReviewCount === 0} className="mt-6 min-h-[48px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" onClick={() => { setReviewIds(selectableDue.slice(0, reviewMinutes).map((card) => card.id)); setReviewedCount(0); }}>Start review · {Math.min(reviewMinutes, selectedReviewCount)} item{Math.min(reviewMinutes, selectedReviewCount) === 1 ? "" : "s"}</button>
          {selectedReviewCount === 0 && <div className="mt-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="status"><p>{difficultOnly ? "No difficult items are due at this level. Turn off “Difficult items only” to check the full selected queue." : selectedReviewLevel ? `HSK ${selectedReviewLevel} has no due reviews.` : "No reviews are due across all levels."}</p>{!difficultOnly && selectedReviewScope !== "all" && <button type="button" className="mt-3 min-h-[44px] rounded-lg border border-amber-700 px-4 py-2 font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200" onClick={() => chooseReviewScope("all")}>View all levels</button>}</div>}
          {data.capabilities.tier === "free" && <p className="mt-4 text-sm text-slate-500"><strong>Free remaining today:</strong> {Math.max(0, (data.capabilities.dailyReviewGrades ?? 0) - data.usage.dailyReviewGrades)} successful SRS ratings. <Link className="font-semibold text-blue-700 underline-offset-4 hover:underline" href="/pricing">Pro removes the Free daily learning and review limits and prioritizes unresolved mistakes.</Link></p>}
        </div>
      </div>}

      {reviewIds && !sessionComplete && activeCard && todayListeningReview?.todayReviewMode === "unsupported_legacy" && <article className="rounded-[28px] border border-amber-200 bg-white p-[24px] shadow-[0_22px_60px_rgba(15,23,42,0.08)] sm:p-[32px]" aria-live="polite">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-amber-700">Older listening item</p>
        <h2 className="mt-3 text-2xl font-bold text-slate-950">This item cannot be restored safely.</h2>
        <p className="mt-3 text-slate-600">The saved item has neither a complete original question nor a verified word recording, so Today will skip only this item without changing your other Review cards.</p>
        <button type="button" disabled={reviewSaving} onClick={() => void skipUnsupportedTodayReview()} className="mt-6 min-h-[48px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{reviewSaving ? "Skipping…" : "Skip unavailable item"}</button>
      </article>}

      {reviewIds && !sessionComplete && activeCard && todayListeningReview?.todayReviewMode !== "unsupported_legacy" && <div aria-live="polite">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-sm font-semibold text-slate-500">Review progress</p><p className="mt-1 text-lg font-bold text-slate-950">{displayReviewedCount + 1} of {sessionTotal}</p></div>
          <p className="text-sm text-slate-500">{Math.max(0, sessionTotal - displayReviewedCount - 1)} after this</p>
        </div>
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600 transition-[width]" style={{ width: `${Math.min(100, displayReviewedCount / sessionTotal * 100)}%` }} /></div>
        <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-[24px] py-[16px] sm:px-[32px]">
            <p className="text-sm font-bold text-slate-700">{isMistakeRetry ? "Mistake retry" : "Memory review"} · {activeCard.level ? `HSK ${activeCard.level}` : "Older saved item"} · {activeCard.skill}</p>
            <div className="flex flex-wrap items-center gap-2">{data.capabilities.focusedReview && activeFocusReason && <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">Focused Review · Pro · {activeFocusReason === "open_mistake" ? "Open mistake prioritized" : "Due memory prioritized"}</span>}{activeCard.topic && <p className="text-sm text-slate-500">{activeCard.topic}</p>}</div>
          </div>
          <div className="p-[24px] sm:p-[32px]">
            <div className="mb-6 border-l-4 border-blue-600 pl-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Why this is here</p><p className="mt-1 text-sm text-slate-600">{activeCard.reviewReason}</p><p className="mt-2 text-sm font-semibold text-blue-800">Review tip: {reviewTip(activeCard)}</p><p className="mt-1 text-xs text-slate-500">Current schedule: {new Date(activeCard.dueAt).toLocaleString()}</p></div>
            {activeCard.instruction && <p className="mb-4 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-950">{activeCard.instruction}</p>}
            {activeCard.context && <p className="mb-5 rounded-2xl bg-slate-50 p-5 text-lg leading-8 text-slate-900" lang="zh-Hans">{activeCard.context}</p>}
            <h2 className="text-2xl font-bold leading-snug tracking-tight text-slate-950 sm:text-3xl">{activeCard.prompt}</h2>
            {activeCard.audioSrc && <div className="mt-5"><p className="mb-2 text-sm font-semibold text-slate-700">Original recording</p><AudioPlaybackControl asset={{ id: `${activeCard.id}:${activeCard.revision}`, src: activeCard.audioSrc, sourceLabel: "Synthesized listening audio" }} beforePlay={() => startFormalPlayback(activeCard)} onComplete={() => void completeFormalPlayback(activeCard)} onFailure={() => { reviewPlayback.current?.coordinator.fail(); setAudioError("Audio playback failed. Retry the recording before answering."); }} verificationState={reviewPlaybackState === "preparing" || reviewPlaybackState === "verifying" ? "verifying" : activeCard.playbackReady ? "verified" : "idle"} showProgress /></div>}
            {!activeCard.audioSrc && activeCard.dimension !== "reading" && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">The original recording is not available for this older item. It cannot be treated as a full listening retry.</p>}
            {!activeCard.playbackReady && activeCard.playbackRequired && <p className="mt-3 text-sm font-semibold text-amber-700">Finish audio playback before answering.</p>}
            {todayListeningReview && !activeCard.playbackReady && <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-900">Listen to the full recording to open the answer step.</p>}

            {canAnswerReview && !answerChecked && (!useTodayListeningFlow || activeCard.playbackReady) ? <div className="mt-7">
              {activeCard.answerMode === "choice" ? <fieldset disabled={activeCard.playbackRequired && !activeCard.playbackReady}><legend className="font-bold text-slate-950">Choose an answer</legend><div className="mt-3 grid gap-3">{activeCard.choices.map((choice) => <label key={choice.key} className={`flex min-h-[52px] items-center gap-3 rounded-xl border px-4 py-3 transition ${activeCard.playbackRequired && !activeCard.playbackReady ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400" : selectedAnswer === choice.key ? "cursor-pointer border-blue-600 bg-blue-50" : "cursor-pointer border-slate-200 hover:border-slate-400"}`}><input type="radio" name={`review-${activeCard.id}`} value={choice.key} checked={selectedAnswer === choice.key} onChange={() => setSelectedAnswer(choice.key)} /><span><strong className="mr-2">{choice.key}.</strong>{choice.text}</span></label>)}</div></fieldset> : <><label className="font-bold text-slate-950" htmlFor={`review-answer-${activeCard.id}`}>Type your answer</label><textarea id={`review-answer-${activeCard.id}`} maxLength={180} value={reviewDraft} disabled={activeCard.playbackRequired && !activeCard.playbackReady} onChange={(event) => setReviewDraft(event.target.value)} className="mt-3 min-h-[112px] w-full rounded-xl border border-slate-300 p-4 text-base focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" /></>}
              <button disabled={!(activeCard.answerMode === "choice" ? selectedAnswer : reviewDraft.trim()) || !activeCard.playbackReady || reviewSaving} onClick={() => void submitRetry(activeCard)} className="mt-5 min-h-[48px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">{reviewSaving ? "Checking…" : "Check answer"}</button>
            </div> : !useTodayQuestionReview && !revealed[activeCard.id] && !answerChecked ? <div className="mt-7">{activeCard.legacyReview && !useTodayVocabularyRecall && <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">This older saved item has no complete original question. It is available only as a memory prompt and will not be presented as a real mistake retry.</p>}<p className="mb-3 text-sm text-slate-600">{useTodayVocabularyRecall ? "Play the recording, recall the word and meaning, then reveal the answer." : "Think of the answer before revealing it. There is no answer field in this incomplete legacy review."}</p><button className="min-h-[48px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" disabled={!activeCard.playbackReady} onClick={() => setRevealed((current) => ({ ...current, [activeCard.id]: true }))}>{useTodayVocabularyRecall ? "Reveal word and meaning" : "Reveal answer"}</button></div> : null}

            {(revealed[activeCard.id] || answerChecked) && <div className="mt-7" aria-live="polite">
              {answerChecked && <div className={`rounded-2xl border p-4 ${currentAnswerCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-rose-200 bg-rose-50 text-rose-950"}`}><p className="font-bold">{currentAnswerCorrect ? (isMistakeRetry ? "Correct this time — this mistake is resolved" : "Correct") : entryIntent.kind === "today" && isMistakeRetry ? "Saved for later review — today’s step still counts" : "Not yet — review the difference"}</p><p className="mt-1"><strong>Your answer this time:</strong> {selectedText}</p>{entryIntent.kind === "today" && isMistakeRetry && !currentAnswerCorrect && <p className="mt-2 text-sm">This mistake stays open and will return later without blocking the next Today step.</p>}</div>}
              <div className="mt-4 rounded-2xl bg-slate-50 p-[20px] text-slate-800">
                <p><strong>{isMistakeRetry ? "Correct answer" : "Answer"}:</strong> {activeCard.correctAnswer}</p>
                {isMistakeRetry && <details className="mt-3 border-t border-slate-200 pt-3 text-sm"><summary className="cursor-pointer font-semibold text-slate-700">Earlier attempt</summary><p className="mt-2"><strong>{activeCard.priorAnswerLabel}:</strong> {activeCard.userAnswer || "No answer"}</p></details>}
                <p className="mt-3 text-sm text-slate-600"><strong className="mb-1 block text-slate-800">Why the answer fits</strong>{activeCard.explanation}</p>
              </div>
              {(activeCard.hanzi || activeCard.pinyin || activeCard.meaning || activeCard.example) && <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-[20px]" aria-label="Vocabulary answer details">
                {activeCard.hanzi && <p><strong>Word:</strong> <span lang="zh-Hans">{activeCard.hanzi}</span></p>}
                {activeCard.pinyin && <p className={activeCard.hanzi ? "mt-2" : undefined}><strong>Pinyin:</strong> {activeCard.pinyin}</p>}
                {activeCard.meaning && <p className="mt-2"><strong>Meaning:</strong> {activeCard.meaning}</p>}
                {activeCard.example && <div className="mt-4 border-t border-slate-200 pt-4">
                  <p><strong>Example:</strong> <span lang="zh-Hans">{activeCard.example.hanzi}</span></p>
                  <p className="mt-1 text-sm text-blue-700">{activeCard.example.pinyin}</p>
                  <p className="mt-1 text-sm text-slate-600"><strong>Example translation:</strong> {activeCard.example.meaning}</p>
                </div>}
                {activeCard.formalAudioSrc && activeCard.formalAudioSrc !== activeCard.audioSrc && <div className="mt-4"><p className="mb-2 text-sm font-semibold text-slate-700">Formal recording</p><audio controls preload="none" src={activeCard.formalAudioSrc} className="max-w-full" /></div>}
              </section>}
              {isMistakeRetry && answerChecked && <><p className="mt-4 text-sm text-slate-600">AI explanation available after you retry. It uses this saved question and feedback and costs one AI credit.</p><AiAssist feature="explanation" reviewCardId={activeCard.id} /></>}
              {isMistakeRetry && answerChecked ? <button disabled={reviewSaving} onClick={() => continueAfterRetry(activeCard)} className="mt-5 min-h-[48px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">Continue</button> : <div className="mt-5"><p className="font-bold text-slate-950">{answerChecked ? "How well did you remember it after answering?" : useTodayVocabularyRecall ? "How well did you remember it after revealing the word?" : "How well did you remember it before revealing?"}</p><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{reviewGradeOptions(activeCard.ease, activeCard.intervalDays).map((option) => <button disabled={reviewSaving} key={option.grade} onClick={() => void grade(activeCard, option.grade)} className="min-h-[76px] rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-blue-500 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"><strong className="block text-slate-950">{option.label}</strong><span className="mt-1 block text-xs text-slate-500">{option.hint}</span></button>)}</div></div>}
            </div>}
          </div>
        </article>
        {lastRatedCardId && data.canUndoReview && <button className="mt-4 min-h-[48px] px-2 text-sm font-semibold text-slate-600 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" onClick={() => void undoLastRating()}>Undo last rating</button>}
      </div>}

      {sessionComplete && <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-6 text-emerald-950 sm:p-9" aria-live="polite">
        <p className="text-sm font-bold text-emerald-800">Review report · Session complete</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">You reviewed {displayReviewedCount} item{displayReviewedCount === 1 ? "" : "s"}.</h2>
        <p className="mt-3 max-w-xl text-emerald-900">This report uses the {displayReviewedCount} answers and memory ratings saved in this session.</p>
        <div className="mt-5 grid gap-3 rounded-2xl bg-white/70 p-4 sm:grid-cols-3"><p><strong>Reviewed</strong><br />{displayReviewedCount}</p><p><strong>Open mistakes now</strong><br />{open.length}</p><p><strong>Next review</strong><br />{nextReviewAt ? new Date(nextReviewAt).toLocaleString() : "Nothing scheduled"}</p></div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">{entryIntent.kind === "mistake" && open.length > 0 && <Link href="/mistakes" className="min-h-[48px] rounded-xl bg-blue-600 px-5 py-3 text-center font-bold text-white">Continue correcting</Link>}<Link href={entryIntent.kind === "today" && entryTodaySessionId && entryTodayItemId ? `/today?resume=1&completed=review&completedSession=${encodeURIComponent(entryTodaySessionId)}&completedItem=${encodeURIComponent(entryTodayItemId)}` : "/today"} className="min-h-[48px] rounded-xl bg-emerald-900 px-5 py-3 text-center font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">{entryIntent.kind === "today" ? `Continue Today — ${data.session.items.find((item) => !item.deferred && item.status === "pending")?.title ?? "next step"}` : "Back to Today"}</Link>{entryIntent.kind !== "today" && <><Link href="/mistakes" className="min-h-[48px] rounded-xl border border-emerald-800 px-5 py-3 text-center font-bold text-emerald-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">Back to Mistakes</Link><Link href="/practice" className="min-h-[48px] rounded-xl border border-emerald-800 px-5 py-3 text-center font-bold text-emerald-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">Continue practice</Link></>}</div>
        {lastRatedCardId && data.canUndoReview && <button className="mt-4 min-h-[48px] text-sm font-semibold underline underline-offset-4" onClick={() => void undoLastRating()}>Undo last rating</button>}
      </div>}

      {directEntryEmpty && <State title={entryIntent.kind === "mistake" ? "This mistake is no longer open" : "You're caught up"} text={entryIntent.kind === "mistake" ? "It may already have been resolved or is no longer available for review." : "There are no reviews due in today's queue."}><Link className="btn" href={entryIntent.kind === "mistake" ? "/mistakes" : "/today"}>{entryIntent.kind === "mistake" ? "Back to Mistakes" : "Back to Today"}</Link></State>}
      {entryResolved && entryIntent.kind === "setup" && reviewIds === null && due.length === 0 && data.cards.length > 0 && <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 bg-slate-950 px-6 py-6 text-white sm:px-8"><p className="text-sm font-semibold text-blue-300">Schedule clear</p><h2 className="mt-2 text-3xl font-bold text-white">Upcoming reviews</h2><p className="mt-2 text-slate-300">Nothing is due now. You can inspect the schedule without changing a future review.</p></div>
        <div className="p-6 sm:p-8"><div className="grid gap-3">{[...data.cards].sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 3).map((card) => <article className="rounded-2xl border border-slate-200 p-4" key={card.id}><p className="font-bold text-slate-950">{card.prompt}</p><p className="mt-1 text-sm text-slate-600">{card.skill} · Scheduled {new Date(card.dueAt).toLocaleString()}</p></article>)}</div></div>
      </section>}
      {entryResolved && entryIntent.kind === "setup" && reviewIds === null && due.length === 0 && data.cards.length === 0 && <State title="No review history yet" text="A completed Practice or Listening answer creates your first scheduled memory card. Wrong answers become due immediately."><div className="flex flex-wrap gap-2"><Link className="btn" href="/practice">Start practice</Link><Link className="btn secondary" href="/listen">Start listening</Link></div></State>}
      {audioError && <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">{audioError}</p>}
    </div>
  </Shell>;
}

function mistakeReviewHref(mistake: Mistake) {
  return `/review?source=mistakes&contentId=${encodeURIComponent(mistake.contentId)}${mistake.cardId ? `&cardId=${encodeURIComponent(mistake.cardId)}` : ""}`;
}

function mistakeDimensionLabel(dimension: Dimension) {
  return dimension === "reading" ? "Reading" : "Listening";
}

function formatMistakeDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function formatMistakeDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function groupCorrectedMistakes(mistakes: Mistake[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86_400_000;
  const groups: Array<{ label: "Today" | "Yesterday" | "Earlier"; items: Mistake[] }> = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Earlier", items: [] },
  ];
  for (const mistake of mistakes) {
    const correctedAt = new Date(mistake.resolvedAt ?? mistake.createdAt).getTime();
    if (correctedAt >= todayStart) groups[0].items.push(mistake);
    else if (correctedAt >= yesterdayStart) groups[1].items.push(mistake);
    else groups[2].items.push(mistake);
  }
  return groups.filter((group) => group.items.length > 0);
}

type TodayJourneyState = "current" | "completed" | "locked" | "skipped";

function TodayHeroArtwork({ progress, complete }: { progress: number; complete: boolean }) {
  return <div className="relative mx-auto flex h-[190px] w-full max-w-[240px] items-center justify-center" aria-hidden="true">
    <span className="absolute left-3 top-5 flex h-12 w-12 rotate-[-8deg] items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-blue-100 shadow-lg"><HomeIcon name="review" className="h-6 w-6" /></span>
    <span className="absolute bottom-5 right-2 flex h-12 w-12 rotate-[8deg] items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-cyan-100 shadow-lg"><HomeIcon name="headphones" className="h-6 w-6" /></span>
    <div className="relative grid h-36 w-36 place-items-center rounded-full p-[10px] shadow-[0_18px_45px_rgba(15,23,42,0.28)]" style={{ background: `conic-gradient(#93c5fd ${progress}%, rgba(255,255,255,.14) ${progress}% 100%)` }}>
      <div className="grid h-full w-full place-items-center rounded-full border border-white/10 bg-blue-950 text-center"><span><strong className="block text-3xl text-white">{complete ? "✓" : `${progress}%`}</strong><small className="text-blue-200">{complete ? "Journey saved" : "Today progress"}</small></span></div>
    </div>
    <span className="absolute right-5 top-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300 text-amber-950 shadow-lg"><HomeIcon name="target" className="h-5 w-5" /></span>
  </div>;
}

function todayJourneyIcon(item: Item): HomeIconName {
  if (item.kind === "review") return "review";
  if (item.kind === "learn") return "book";
  if (item.kind === "listen") return "headphones";
  if (item.kind === "practice") return "pencil";
  return "target";
}

function TodayJourneyIcon({ item, state }: { item: Item; state: TodayJourneyState }) {
  const stateClass = state === "completed" ? "border-emerald-300 bg-emerald-100 text-emerald-700" : state === "skipped" ? "border-amber-300 bg-amber-100 text-amber-800" : state === "locked" ? "border-slate-300 bg-white text-slate-500" : item.kind === "review" ? "border-violet-300 bg-violet-100 text-violet-700" : item.kind === "listen" ? "border-cyan-300 bg-cyan-100 text-cyan-700" : item.kind === "practice" ? "border-amber-300 bg-amber-100 text-amber-800" : "border-blue-300 bg-blue-100 text-blue-700";
  return <span className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 shadow-sm ${stateClass}`} aria-hidden="true"><HomeIcon name={state === "completed" ? "check" : todayJourneyIcon(item)} className="h-6 w-6" /></span>;
}

function TodayStatus({ state }: { state: TodayJourneyState }) {
  const labelText = state === "completed" ? "Step complete" : state === "skipped" ? "Moved to tomorrow" : state === "locked" ? "Locked" : "Current";
  const className = state === "completed" ? "bg-emerald-100 text-emerald-800" : state === "skipped" ? "bg-amber-100 text-amber-900" : state === "locked" ? "border border-slate-300 bg-white text-slate-600" : "bg-blue-600 text-white";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}>{labelText}</span>;
}

function todayJourneyTone(kind: Item["kind"], state: TodayJourneyState) {
  if (state === "completed") return "border-emerald-200 bg-emerald-50/80";
  if (state === "skipped") return "border-dashed border-amber-300 bg-amber-50/70";
  if (state === "locked") return "border-slate-200 bg-slate-50";
  if (kind === "review") return "border-violet-300 bg-violet-50 shadow-[0_12px_32px_rgba(124,58,237,0.09)] ring-1 ring-violet-100";
  if (kind === "listen") return "border-cyan-300 bg-cyan-50 shadow-[0_12px_32px_rgba(8,145,178,0.09)] ring-1 ring-cyan-100";
  if (kind === "practice") return "border-amber-300 bg-amber-50 shadow-[0_12px_32px_rgba(217,119,6,0.09)] ring-1 ring-amber-100";
  return "border-blue-300 bg-blue-50 shadow-[0_12px_32px_rgba(37,99,235,0.09)] ring-1 ring-blue-100";
}

function label(item: Item) {
  return item.title ?? (item.kind === "learn" ? "Learn new vocabulary" : item.kind === "listen" ? (item.dimension === "audio" ? "Word listening" : "Listening in context") : item.kind === "practice" ? "Vocabulary practice" : `Review ${item.dimension?.replace("_", " ") ?? "item"}`);
}
function primaryTodayAction(item: Item, dailySessionId: string, step: number, total: number, reviews: Item[], cards: Card[]) {
  const context = `dailySessionId=${encodeURIComponent(dailySessionId)}&dailyItemId=${encodeURIComponent(item.id)}&from=today&todayStep=${step}&todayTotal=${total}`;
  const href = item.kind === "review"
    ? `/review?source=today&dailySessionId=${encodeURIComponent(dailySessionId)}&dailyItemId=${encodeURIComponent(item.id)}&cap=${reviews.length}&cards=${encodeURIComponent(cards.map((card) => card.id).join(","))}`
    : `${item.href ?? (item.kind === "learn" ? "/levels" : item.kind === "listen" ? "/listen" : "/practice")}${(item.href ?? "").includes("?") ? "&" : "?"}${context}`;
  return <Link className="inline-flex min-h-[50px] items-center rounded-xl bg-blue-500 px-6 py-3 font-bold text-white shadow-sm hover:bg-blue-400" href={href}>Continue Today Session</Link>;
}
function todayReason(item: Item, openMistakes: number, weakest: string) {
  if (item.kind === "learn" && item.selectionReason) return item.selectionReason;
  if (item.kind === "learn") return "New · selected near your current HSK progress and not shown as New in the last 14 days.";
  if (item.kind === "listen") return item.dimension === "context_audio" ? "Context listening follows word audio so meaning is tested in a real sentence." : "Word audio follows Learn so sound is attached to the same item.";
  if (item.kind === "practice") return "Practice closes the loop with a scored, server-saved result.";
  if (item.kind === "review") return openMistakes ? `${openMistakes} open mistake${openMistakes === 1 ? "" : "s"} and due cards take priority.` : `${weakest} is currently your lowest mastery area.`;
  return "This step keeps the Today Session continuous.";
}
function Shell(props: { title: string; active: LearningLoopLabel; sub: string; children: ReactNode; compact?: boolean }) {
  return <main className={`learn ${props.compact ? "pt-6 sm:pt-16" : ""}`}><header className={props.compact ? "mb-5 sm:mb-8" : undefined}>{!props.compact && <span className="eyebrow">HSKKit learning loop</span>}<h1 className={props.compact ? "text-2xl sm:text-4xl" : undefined}>{props.title}</h1><p className={props.compact ? "hidden sm:block" : undefined}>{props.sub}</p><LearningLoopNav active={props.active}/></header>{props.children}</main>;
}
function LearningStatePage(props: { mode: "today" | "review" | "mistakes"; title: string; text: string; eyebrow?: string; note?: string; loading?: boolean; error?: boolean; children?: ReactNode }) {
  const pageTitle = props.mode === "today" ? "Today" : props.mode === "mistakes" ? "Mistakes" : "Review";
  return <main className="learn min-h-[70vh]" aria-busy={props.loading || undefined}>
    <header><span className="eyebrow">HSKKit learning loop</span><h1>{pageTitle}</h1><p>Your learning workspace will stay in place while progress is restored.</p><LearningLoopNav active={pageTitle}/></header>
    <section className={`mx-auto max-w-[880px] overflow-hidden rounded-[28px] border bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)] ${props.error ? "border-rose-200" : "border-slate-200"}`} role={props.error ? "alert" : "status"} aria-live="polite">
      <div className={`border-b px-6 py-6 sm:px-8 ${props.error ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-950 text-white"}`}>
        <p className={`text-sm font-semibold ${props.error ? "text-rose-700" : "text-blue-300"}`}>{props.eyebrow ?? (props.error ? "Connection problem" : "Learning data")}</p>
        <h2 className={`mt-2 text-2xl font-bold tracking-tight sm:text-3xl ${props.error ? "text-rose-950" : "text-white"}`}>{props.title}</h2>
        <p className={`mt-2 max-w-xl ${props.error ? "text-rose-800" : "text-slate-300"}`}>{props.text}</p>
      </div>
      <div className="min-h-[260px] p-6 sm:p-8">
        {props.loading ? <div className="motion-safe:animate-pulse" aria-hidden="true"><div className="h-3 w-28 rounded bg-blue-200"/><div className="mt-5 h-8 w-3/4 rounded-lg bg-slate-200"/><div className="mt-4 h-4 w-full rounded bg-slate-100"/><div className="mt-2 h-4 w-5/6 rounded bg-slate-100"/><div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="h-16 rounded-xl bg-slate-100"/><div className="h-16 rounded-xl bg-slate-100"/><div className="h-16 rounded-xl bg-slate-100"/></div><div className="mt-6 h-12 rounded-xl bg-blue-100"/></div> : <div><p className="max-w-xl text-slate-600">{props.note ?? "Your existing progress is unchanged. Retry the request when your connection is ready."}</p><div className="mt-6">{props.children}</div></div>}
      </div>
    </section>
  </main>;
}
function State(props: { title: string; text: string; children?: ReactNode }) { return <div className="state"><h2>{props.title}</h2><p>{props.text}</p>{props.children}</div>; }
function Mastery({ values, scope }: { values: Record<Dimension, number>; scope: Data["scope"] }) {
  return <section className="summary"><h2>Mastery</h2><p className="text-sm font-semibold">Mastered after successful review</p><p>Reading {values.reading} · Audio {values.audio} · Context audio {values.context_audio}</p><p>{scope === "account" ? "Saved to your private account learning record and available across synced devices." : "Saved for this guest browser; sign in to merge it explicitly into your account."}</p></section>;
}
