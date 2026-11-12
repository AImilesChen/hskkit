"use client";

import Link from "next/link";
import { bindTodayReviewRound, completedTodayReviewCards, type TodayReviewRound } from "../../lib/learning/review-session";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import AiAssist from "./ai-assist";
import UploadedMistakeAnalyzer from "./uploaded-mistake-analyzer";
import { AudioPlaybackControl } from "./audio-playback-control";
import HomeIcon, { type HomeIconName } from "./home-icon";
import { TodayWorkspace } from "./today-workspace";
import { ReviewSourceBar, ReviewTodayShortcut, ReviewOverview, IndependentReviewMemory } from "./review-workbench";
import ReviewOnboarding from "./review-onboarding";
import { availableTodayReview, reviewWorkbenchPrompt, reviewSessionPreview } from "../../lib/learning/review-workbench";
import { TodayTaskPreview, TodaySessionSummary } from "./today-learning-content";
import { todayStageCopy, todayWorkspaceStages, todayWorkspaceWordLabel, todayTaskPreview, todaySessionRecap, todayRecapHidden, type WorkspacePracticeInfo } from "../../lib/learning/today-workspace";
import LearningLoopNav, { type LearningLoopLabel } from "./learning-loop-nav";
import { LearningLoadError, loadLearningData, type LearningLoadErrorCode } from "../../lib/learning/client-load";
import { PlaybackRequestError, PlaybackVerificationCoordinator, playbackErrorCode, playbackVerificationMessage, type PlaybackVerificationState } from "../../lib/learning/verified-playback";
import { activeReviewCardId, activeTodayReviewCardId, buildIntentReviewQueue, filterReviewCards, recommendReviewCount, reviewAnswerIsCorrect, reviewCardIdsForScope, reviewComposition, reviewEntryIntent, reviewGradeOptions, type ReviewEntryIntent, type ReviewGrade, type ReviewLevelControl, type ReviewLevelScope } from "../../lib/learning/review-session";
import { completionProofNeedsSync, parseTodayCompletionProof, recommendTodayMinutes, recommendTodayNewWordCount, resolveTodayCelebration, todayCompletionProofKey, todaySummaryStats, todayJourneyProgress, TODAY_BUDGET_OPTIONS, TODAY_FOCUS_OPTIONS, TODAY_NEW_WORD_OPTIONS, type TodayBudgetMinutes, type TodayCelebration, type TodayCompletedKind, type TodayFocus, type TodayNewWordCount } from "../../lib/learning/today-plan";

type Dimension = "reading" | "audio" | "context_audio";
type LearnMeaningCheck = { prompt: string; options: Array<{ key: "A" | "B" | "C" | "D"; text: string }>; correctAnswer: "A" | "B" | "C" | "D" };
type LearnContent = { assetId: string; hanzi: string; pinyin: string; meaning: string; partOfSpeech: string; example?: { hanzi: string; pinyin: string; meaning: string }; audioSrc?: string; meaningCheck?: LearnMeaningCheck };
type Item = { id: string; kind: "review" | "learn" | "listen" | "practice" | "summary"; contentId: string; contentVersion?: string; status: "pending" | "completed" | "skipped"; dimension?: Dimension; title?: string; href?: string; estimatedMinutes?: number; deferred?: boolean; isContinuing?: boolean; reviewCardId?: string; learnContent?: LearnContent; learnCheck?: { mode: "meaning"; attempts: number; firstTryCorrect: boolean; verifiedAt: string } };
type Notice = { code: string; message: string; actionHref: string; actionLabel: string };
type Card = { id: string; contentId: string; dimension: Dimension; dueAt: string; revision: number; prompt: string; context?: string; instruction?: string; answerMode: "choice" | "text" | "self_recall"; correctAnswer: string; correctAnswerKey: string; userAnswer: string; priorAnswerLabel: string; choices: Array<{ key: string; text: string }>; isMistake: boolean; legacyReview: boolean; reviewReason: string; explanation: string; level?: number; levelBand: string; skill: string; topic?: string; intervalDays: number; ease: number; reviewCount: number; audioText?: string; audioSrc?: string; assetId?: string; pinyin?: string; meaning?: string; example?: { hanzi: string; pinyin: string; meaning: string }; formalAudioSrc?: string; playbackRequired: boolean; playbackReady: boolean };
type Mistake = { id: string; contentId: string; cardId?: string; status: string; createdAt: string; resolvedAt?: string; dimension: Dimension; prompt: string; level?: number; skill: string };
type RewardSnapshot = { monthLearningDays: number; monthPoints: number; currentStreak: number; remainingSeconds: number; nextAward: number; nextMonthLearningDay: number; todayQualified: boolean; todayAwarded: boolean; todayAward: number };
type Data = {
  session: { id: string; startLevel?: number; contentReleaseId?: string; notice?: Notice; budgetMinutes?: number; newWordCount?: TodayNewWordCount; plannedNewWordCount?: number; listeningEnabled?: boolean; focus?: TodayFocus; totalEstimatedMinutes?: number; reviewBatchId?: string; reviewCardIds?: string[]; reviewItemIds?: string[]; items: Item[] };
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

export default function LearningDashboard({ mode, practiceInfo = [] }: { mode: "today" | "review" | "mistakes"; practiceInfo?: WorkspacePracticeInfo[] }) {
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
  const [reviewIds, setReviewIds] = useState<string[] | null>(null);
  const [todayReviewRound, setTodayReviewRound] = useState<TodayReviewRound | null>(null);
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
  const [learnCheckOpen, setLearnCheckOpen] = useState<Record<string, boolean>>({});
  const [learnCheckAnswers, setLearnCheckAnswers] = useState<Record<string, string>>({});
  const [learnCheckAttempts, setLearnCheckAttempts] = useState<Record<string, number>>({});
  const [learnCheckWrong, setLearnCheckWrong] = useState<Record<string, boolean>>({});
  const [reviewNowFeedback, setReviewNowFeedback] = useState<Record<string, string>>({});
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
  const [reviewPlaybackEndedKey, setReviewPlaybackEndedKey] = useState<string | null>(null);

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
      else setSyncState("synced");
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
    const reviewCards = entryIntent.kind === "mistake" || entryIntent.kind === "word"
      ? data.cards
      : entryIntent.kind === "today"
        ? (data.session.reviewCardIds ?? []).map((id) => data.cards.find((card) => card.id === id)).filter((card): card is Card => Boolean(card))
      : data.capabilities.focusedReview
        ? data.focusedReview
        : data.cards.filter((card) => card.dueAt <= new Date().toISOString());
    if (entryIntent.kind === "today") {
      if (data.session.id !== entryTodaySessionId) { setReviewIds([]); return; }
      const storageKey = `today-review-round:${data.queueBinding}:${entryTodaySessionId}:${entryTodayItemId}`;
      let saved: unknown;
      try { saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null"); } catch { /* Storage is optional. */ }
      const round = bindTodayReviewRound(data.session, entryIntent.cardIds, entryTodayItemId, saved);
      setTodayReviewRound(round);
      setReviewIds(round.cardIds);
      try { sessionStorage.setItem(storageKey, JSON.stringify(round)); } catch { /* Server progress remains authoritative. */ }
    } else setReviewIds(buildIntentReviewQueue(reviewCards, entryIntent, reviewMinutes).map((card) => card.id));
    setReviewedCount(0);
  }, [data, entryIntent, entryResolved, mode, reviewIds, reviewMinutes, entryTodaySessionId, entryTodayItemId]);

  const currentReviewCardId = mode === "review" && data && reviewIds
    ? entryIntent.kind === "today"
      ? activeTodayReviewCardId(reviewIds, completedTodayReviewCards(data.session, todayReviewRound))
      : activeReviewCardId(reviewIds, reviewedCount)
    : null;
  const currentReviewCardRevision = data?.cards.find((card) => card.id === currentReviewCardId)?.revision;

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
    setReviewPlaybackEndedKey(null);
  }, [currentReviewCardId, currentReviewCardRevision, reviewIds]);

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
    if (response && response.status >= 400 && response.status < 500) {
      const rejected = await response.json();
      delete operationKeys.current[operation];
      setError(rejected.error === "TODAY_LEARN_CHECK_REQUIRED" ? "This word was not marked complete because its memory check was missing or incorrect. Reload Today and try again." : rejected.error === "TODAY_LEARN_WORD_MISMATCH" ? "This word could not be matched to your saved task. Reload Today and try again." : "Your progress could not be confirmed. Reload the server copy, then retry.");
      return false;
    }
    if (["complete_item", "skip_item", "restore_item", "configure_today"].includes(action) && data) {
      appendPending({ action, payload, idempotencyKey: key, clientRevision: data.revision, queueBinding: data.queueBinding });
      setSyncState("local_pending");
      if (payload.itemId) setData({ ...data, session: { ...data.session, items: data.session.items.map((item) => item.id === payload.itemId ? { ...item, status: action === "restore_item" ? "pending" : action === "skip_item" ? "skipped" : "completed" } : item) } });
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
  async function restore(item: Item) { await post("restore_item", { sessionId: data!.session.id, itemId: item.id }, `restore:${data!.session.id}:${item.id}`); }
  async function completeLearn(item: Item, answer: string, attempts: number) {
    if (!data || !item.learnContent || learnSavingId) return;
    setLearnSavingId(item.id);
    try {
      const result = await post("complete_item", { sessionId: data.session.id, itemId: item.id, assetId: item.learnContent.assetId, answer, attempts }, `complete-learn:${data.session.id}:${item.id}`) as Data | true | false;
      if (!result) return;
      setLearnCheckOpen((current) => ({ ...current, [item.id]: false }));
      setLearnCheckAnswers((current) => ({ ...current, [item.id]: "" }));
      setLearnCheckWrong((current) => ({ ...current, [item.id]: false }));
      const nextSession = typeof result === "object" ? result.session : { ...data.session, items: data.session.items.map((entry) => entry.id === item.id ? { ...entry, status: "completed" as const } : entry) };
      const nextItem = nextSession.items.find((entry) => !entry.deferred && entry.status === "pending" && entry.kind !== "summary");
      if (nextItem) window.requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-today-item-id="${CSS.escape(nextItem.id)}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
    } finally {
      setLearnSavingId("");
    }
  }
  async function submitLearnCheck(item: Item) {
    const check = item.learnContent?.meaningCheck;
    const answer = learnCheckAnswers[item.id];
    if (!check || !answer || learnSavingId) return;
    const attempts = (learnCheckAttempts[item.id] ?? 0) + 1;
    setLearnCheckAttempts((current) => ({ ...current, [item.id]: attempts }));
    if (answer !== check.correctAnswer) {
      setLearnCheckWrong((current) => ({ ...current, [item.id]: true }));
      return;
    }
    await completeLearn(item, answer, attempts);
  }
  function restudyLearnItem(item: Item) {
    setLearnCheckOpen((current) => ({ ...current, [item.id]: false }));
    setLearnCheckAnswers((current) => ({ ...current, [item.id]: "" }));
    setLearnCheckWrong((current) => ({ ...current, [item.id]: false }));
  }
  async function markNeedsReview(item: Item) {
    if (!item.learnContent || !data) return;
    setReviewNowFeedback((current) => ({ ...current, [item.id]: "Saving…" }));
    const result = await post("add_to_review", { assetId: item.learnContent.assetId }, `review-now:${item.learnContent.assetId}`) as Data | false;
    if (!result) {
      setReviewNowFeedback((current) => ({ ...current, [item.id]: "Could not open this review. Please try again." }));
      return;
    }
    const reviewCard = result.cards.find((card) => card.assetId === item.learnContent?.assetId && card.dimension === "reading")
      ?? result.cards.find((card) => card.contentId === item.contentId && card.dimension === "reading");
    if (!reviewCard) {
      setReviewNowFeedback((current) => ({ ...current, [item.id]: "The review was saved, but its question could not be opened." }));
      return;
    }
    setReviewNowFeedback((current) => ({ ...current, [item.id]: "Opening this word’s review…" }));
    window.location.assign(`/review?source=word&contentId=${encodeURIComponent(reviewCard.contentId)}&cardId=${encodeURIComponent(reviewCard.id)}`);
  }
  async function configureToday() {
    setPlanFeedback("");
    const payload = { budgetMinutes: planDraftMinutes, startLevel: planDraftLevel, newWordCount: planDraftNewWords, listeningEnabled: planDraftListening, focus: planDraftFocus };
    const result = await post("configure_today", payload, `today-plan:${data!.session.id}:${planDraftMinutes}:${planDraftLevel}:${planDraftNewWords}:${planDraftListening}:${planDraftFocus}`);
    setPlanFeedback(result === "queued_conflict" ? "Plan change is pending. Use Retry sync to apply it to the latest server copy." : result === true ? "Plan change saved on this device. It will apply after sync." : result ? `Plan updated: HSK ${planDraftLevel}, ${planDraftMinutes} minutes, ${planDraftNewWords} new word${planDraftNewWords === 1 ? "" : "s"}.` : "Plan was not updated. Reload the server copy and try again.");
    if (result) setPlanOpen(false);
  }
  async function playbackResponse<T>(response: Response) {
    const body = await response.json() as T & { error?: string; message?: string };
    if (!response.ok) throw new PlaybackRequestError(body.error ?? "UNKNOWN_ERROR", body.message);
    return body;
  }
  async function startFormalPlayback(card: Card) {
    setAudioError("");
    setReviewPlaybackEndedKey(null);
    const cardKey = `${card.id}:${card.revision}`;
    const coordinator = new PlaybackVerificationCoordinator({
      onStateChange: setReviewPlaybackState,
      start: async () => playbackResponse<{ playbackTicket: string; notBefore?: string }>(await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "audio_review_playback_start", payload: { idempotencyKey: crypto.randomUUID(), cardId: card.id, cardRevision: card.revision }, tzOffset: tz(), queueBinding: data?.queueBinding }) })),
      complete: async (playbackTicket) => {
        await playbackResponse(await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "audio_review_playback_complete", payload: { idempotencyKey: crypto.randomUUID(), cardId: card.id, cardRevision: card.revision, playbackTicket }, tzOffset: tz(), queueBinding: data?.queueBinding }) }));
        const ready = await post("audio_review_ready", { cardId: card.id, cardRevision: card.revision, playbackTicket }, `audio-ready:${card.id}:${card.revision}`);
        if (!ready) throw new PlaybackRequestError("AUDIO_PLAYBACK_REQUIRED");
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
    setReviewPlaybackEndedKey(active.cardKey);
    try {
      if (await active.coordinator.finish()) setAudioError("");
    } catch (error) {
      const code = playbackErrorCode(error);
      console.warn("[playback-verification]", { context: "review", phase: "complete", code });
      setAudioError(playbackVerificationMessage(code, "complete"));
    }
  }

  if (loadFailure) {
    const offline = loadFailure === "offline";
    const temporarilyUnavailable = loadFailure === "temporarily_unavailable";
    const title = offline ? "You're offline" : temporarilyUnavailable ? "Learning data is temporarily busy" : "We couldn't load this page";
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
  if (!data) return <LearningStatePage mode={mode} title={mode === "review" ? "Preparing your review" : mode === "mistakes" ? "Loading your mistakes" : "Preparing today's plan"} text="Loading due items and restoring progress." loading />;
  const open = data.mistakes.filter((mistake) => mistake.status === "open");
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
    const reviewNow = new Date().toISOString();
    const reviewDueNow = data.cards.filter((card) => card.dueAt <= reviewNow).length;
    const reviewLater = data.cards.length - reviewDueNow;
    const plannedTodayTasks = currentTodayItems.map(({ item }) => item).filter((item) => item.kind !== "summary");
    const completedNewWordsToday = data.session.items.filter((item) => item.kind === "learn" && item.status === "completed" && !item.isContinuing).length;
    const completedContinuingWordsToday = data.session.items.filter((item) => item.kind === "learn" && item.status === "completed" && item.isContinuing).length;
    const reviewGroupItems = plannedTodayTasks.filter((item) => item.kind === "review");
    const completedReviewCount = reviewGroupItems.filter((item) => item.status === "completed").length;
    const incorrectReviewCount = reviewGroupItems.filter((item) => item.status === "completed" && open.some((mistake) => mistake.contentId === item.contentId)).length;
    const scheduledMistakeCount = reviewGroupItems.filter((item) => open.some((mistake) => mistake.contentId === item.contentId)).length;
    const selectedReviewItems = currentTodayItems.map(({ item }) => item).filter((item) => item.kind === "review" && item.status === "pending");
    const selectedReviewCards = selectedReviewItems
      .map((item) => dueForToday.find((card) => card.id === item.reviewCardId || (!item.reviewCardId && card.contentId === item.contentId && card.dimension === item.dimension)))
      .filter((card): card is Card => Boolean(card));
    const activeToday = currentTodayItems.find(({ item }) => item.kind !== "summary" && item.status === "pending")?.item;
    const completionSummary = todaySummaryStats(data.session.items);
    const completedTasks = completionSummary.completedTasks;
    const skippedTasks = completionSummary.skippedTasks;
    const remainingMinutes = plannedTodayTasks.filter((item) => item.status === "pending").reduce((sum, item) => sum + (item.estimatedMinutes ?? 0), 0);
    const journeyProgress = todayJourneyProgress(plannedTodayTasks);
    const currentStep = journeyProgress.currentPhase;
    const weakest = Object.entries(data.mastery).sort((a, b) => a[1] - b[1])[0]?.[0]?.replace("context_audio", "context listening").replace("audio", "listening") ?? "vocabulary";
    const recommendedMinutes = recommendTodayMinutes({ monthPoints: reward?.monthPoints ?? 0, openMistakes: open.length, currentStreak: data.streak.current, mastery: data.mastery, cardCount: data.cards.length });
    const stages = todayWorkspaceStages(currentTodayItems, activeToday?.id);
    const plannedStageCount = stages.filter(stage => stage.kind !== "summary").length;
    const completedStageCount = stages.filter(stage => stage.kind !== "summary" && stage.state === "completed").length;
    const completedPercent = plannedTodayTasks.length ? Math.round(completedTasks / plannedTodayTasks.length * 100) : 0;
    const continueAction = activeToday ? activeToday.kind === "learn" && activeToday.learnContent
      ? <a className="tw-primary" href="#today-active-task">{learnCheckOpen[activeToday.id] ? "Continue memory check" : "Study this word"}<HomeIcon name="arrow" /></a>
      : primaryTodayAction(activeToday, data.session.id, currentStep, journeyProgress.totalPhases, selectedReviewItems, selectedReviewCards, activeToday.kind === "review" ? completedReviewCount ? "Continue today’s review" : "Start today’s review" : activeToday.kind === "listen" ? "Continue listening" : "Continue practice") : null;
    const renderTodayItem = ({ item, index }: { item: Item; index: number }) => {
          const locked = item.status === "pending" && activeToday?.id !== item.id;
          const journeyState = item.status === "completed" ? "completed" : item.status === "skipped" ? "skipped" : locked ? "locked" : "current";
          const learningReviewCard = item.kind === "learn" ? data.cards.find((card) => card.contentId === item.contentId && card.dimension === "reading") : undefined;
          const completedLearningStatus = `${item.learnCheck ? "Memory check passed · learning saved" : "Previously saved learning step"}${learningReviewCard ? learningReviewCard.dueAt <= reviewNow ? " · separate review due now" : ` · next review ${new Date(learningReviewCard.dueAt).toLocaleDateString()}` : ""}.`;
          if (item.kind === "review" && index !== firstReviewIndex) return null;
          if (locked && item.kind !== "summary") return <TodayTaskPreview key={item.id} item={item} preview={todayTaskPreview(plannedTodayTasks,item,practiceInfo)}/>;
          if (item.kind === "summary") return <TodaySessionSummary key={item.id} complete={item.status === "completed"} data={{completed:completedTasks,total:plannedTodayTasks.length,moved:skippedTasks,stagesDone:completedStageCount,stagesTotal:plannedStageCount,words:completedNewWordsToday+completedContinuingWordsToday,reviews:completionSummary.reviewsCompleted,listening:completionSummary.listeningCompleted,practice:completionSummary.practiceCompleted,practiceAnswers:data.practiceQuestionsCompleted}}>
            {item.status === "completed" && <>
              <div className="tw-summary-next"><h3>What to revisit next</h3><p>{open.length ? `${open.length} unresolved mistakes are available in your mistake list.` : "Revisit the words below, or explore more vocabulary at your current level."}</p><div className="tw-current-actions"><Link className="tw-primary" href={`/vocabulary/${data.session.startLevel ?? 1}`}>Explore HSK {data.session.startLevel ?? 1} words</Link>{open.length > 0 && <Link className="tw-secondary" href="/mistakes">Review {open.length} open mistakes</Link>}<Link className="tw-secondary" href="/dashboard">Done for today</Link></div></div>
              <div className="tw-summary-reward"><h3>Learning Points</h3><p>{reward ? `${reward.monthPoints} Learning Points across ${reward.monthLearningDays} qualified days this month.` : data.scope === "guest" ? "Sign in to track Learning Points." : "Score is temporarily unavailable."}</p>{reward && <p>{reward.todayAwarded ? `+${reward.todayAward} earned today.` : reward.todayQualified ? `${reward.todayAward} points are ready to be recorded.` : `${Math.ceil(reward.remainingSeconds / 60)} active minutes remain for today’s qualification.`} Learning Points track qualified learning days. Conversion is not open yet; subscription AI credits stay separate.</p>}</div>
              <p className="tw-summary-streak">Current streak: {data.streak.current} {data.streak.current === 1 ? "day" : "days"} · longest {data.streak.longest}. {data.streakBasis}</p>
            </>}
          </TodaySessionSummary>;
          if (journeyState === "current" && (item.kind === "listen" || item.kind === "practice")) return <TodayTaskPreview key={item.id} item={item} preview={todayTaskPreview(plannedTodayTasks,item,practiceInfo)} ready action={continueAction}/>;
          if (item.kind === "review") return <article data-today-item-id={item.id} id={journeyState === "current" ? "today-active-task" : undefined} className={`tw-task-content relative z-[1] grid grid-cols-[48px_minmax(0,1fr)] gap-4 rounded-2xl border ${journeyState === "completed" ? "p-3 sm:p-4" : "p-4 sm:p-5"} ${todayJourneyTone("review", journeyState)}`} key={item.id}>
            <TodayJourneyIcon item={item} state={journeyState} />
            <div className="min-w-0"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-extrabold uppercase tracking-[.14em] text-violet-700">Today review</span><TodayStatus state={journeyState} /></div>
              <h2 className="mt-1 text-xl font-bold text-slate-950">{completedReviewCount === reviewGroupItems.length ? `Today review complete · ${completedReviewCount}/${reviewGroupItems.length}` : `${completedReviewCount}/${reviewGroupItems.length} reviewed`}</h2>
              <p className="mt-1 text-slate-600">{journeyState === "skipped" ? "Moved to tomorrow · not counted as completed." : journeyState === "locked" ? "Complete the previous step to unlock." : selectedReviewItems.length > 0 ? `About ${selectedReviewItems.reduce((sum, entry) => sum + (entry.estimatedMinutes ?? 0), 0)} min · ${dueForToday.length} total due.` : "Step complete · memory checks saved."}</p>
              {completedReviewCount === reviewGroupItems.length && <p className="mt-2 text-sm font-semibold text-violet-800">{incorrectReviewCount ? `${incorrectReviewCount} wrong ${incorrectReviewCount === 1 ? "answer remains" : "answers remain"} in later review.` : "No wrong answer remains from this review phase."}</p>}
              {journeyState === "current" && <p className="tw-task-reason">{scheduledMistakeCount ? `${scheduledMistakeCount} saved mistakes are included in this review.` : "These cards are due for review."}</p>}
              {journeyState === "current" && <div className="tw-current-actions" id="today-primary-action">{continueAction}</div>}
              {completedReviewCount === reviewGroupItems.length && <details className="mt-3 rounded-xl border border-violet-200 bg-white/70 px-4 py-3"><summary className="cursor-pointer font-semibold text-violet-900">View completed review record</summary><ul className="mt-2 space-y-1 text-sm text-slate-600">{reviewGroupItems.map((review, reviewIndex) => <li key={review.id}>✓ Review {reviewIndex + 1} · saved</li>)}</ul></details>}
              {reviewGroupItems.some(review => review.status === "skipped") && <div className="mt-3 flex flex-wrap gap-2">{reviewGroupItems.filter(review => review.status === "skipped").map((review, reviewIndex) => <button key={review.id} type="button" className="tw-secondary" onClick={() => void restore(review)}>Restore moved review {reviewIndex + 1}</button>)}</div>}
              
            </div>
          </article>;
          return <article data-today-item-id={item.id} id={journeyState === "current" ? "today-active-task" : undefined} className={`tw-task-content relative z-[1] grid grid-cols-[48px_minmax(0,1fr)] gap-4 rounded-2xl border ${journeyState === "completed" ? "p-3 sm:p-4" : "p-4 sm:p-5"} ${todayJourneyTone(item.kind, journeyState)}`} key={item.id}>
            <TodayJourneyIcon item={item} state={journeyState} />
            <div className="min-w-0"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-extrabold uppercase tracking-[.14em]">{item.dimension?.replace("_", " ") ?? item.kind}</span><TodayStatus state={journeyState} /></div><h2 className="mt-1 text-xl font-bold text-slate-950">{journeyState === "current" && item.kind === "learn" && item.learnContent ? learnCheckOpen[item.id] ? "Check your memory" : "Study this word" : label(item)}</h2>
              <p className="mt-1 text-slate-600">{journeyState === "completed" ? item.kind === "learn" ? completedLearningStatus : "Step complete · progress saved." : journeyState === "skipped" ? "Moved to tomorrow · available to restore." : journeyState === "locked" ? "Complete the previous step to unlock." : `Ready now · ${item.estimatedMinutes ?? 0} min`}</p>
              {journeyState === "current" && <p className="tw-task-reason">{todayReason(item, open.length, weakest)}</p>}
              {journeyState === "current" && item.kind === "learn" && item.learnContent && <section className="tw-learning-body" aria-label={`Learn ${item.learnContent.hanzi}`}>
                {!learnCheckOpen[item.id] ? <>
                  <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-4xl font-bold text-slate-950" lang="zh-Hans">{item.learnContent.hanzi}</p><p className="mt-1 text-lg font-semibold text-blue-700">{item.learnContent.pinyin}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">{item.learnContent.partOfSpeech}</span></div>
                  <p className="mt-4 text-lg text-slate-800"><strong>Meaning:</strong> {item.learnContent.meaning}</p>
                  {item.learnContent.audioSrc && <div className="mt-4"><p className="mb-2 text-sm font-semibold text-slate-700">Formal pronunciation</p><audio controls preload="metadata" src={item.learnContent.audioSrc} className="w-full max-w-full" /></div>}
                  {item.learnContent.example && <div className="mt-4 border-t border-slate-200 pt-4"><p className="text-lg font-semibold text-slate-950" lang="zh-Hans">{item.learnContent.example.hanzi}</p><p className="mt-1 text-blue-700">{item.learnContent.example.pinyin}</p><p className="mt-1 text-sm text-slate-600"><strong>Example translation:</strong> {item.learnContent.example.meaning}</p></div>}
                  <button type="button" disabled={!item.learnContent.meaningCheck} onClick={() => setLearnCheckOpen((current) => ({ ...current, [item.id]: true }))} className="mt-5 min-h-[50px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">{item.learnContent.meaningCheck ? "Start memory check" : "Memory check unavailable"}</button>
                </> : <div>
                  <p className="text-xs font-extrabold uppercase tracking-[.14em] text-blue-700">Memory check</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-950" lang="zh-Hans">{item.learnContent.hanzi}</h3>
                  <p className="mt-2 text-sm text-slate-600">Choose from memory. The meaning stays hidden until you answer.</p>
                  <fieldset className="mt-4 grid gap-2"><legend className="sr-only">{item.learnContent.meaningCheck?.prompt}</legend>{item.learnContent.meaningCheck?.options.map((option) => <label key={option.key} className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${learnCheckAnswers[item.id] === option.key ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"}`}><input type="radio" name={`learn-check-${item.id}`} value={option.key} checked={learnCheckAnswers[item.id] === option.key} onChange={() => { setLearnCheckAnswers((current) => ({ ...current, [item.id]: option.key })); setLearnCheckWrong((current) => ({ ...current, [item.id]: false })); }} /><span><strong className="mr-2">{option.key}.</strong>{option.text}</span></label>)}</fieldset>
                  {learnCheckWrong[item.id] ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950" role="alert"><p className="font-bold">Not quite. “{item.learnContent.hanzi}” means “{item.learnContent.meaning}”.</p><p className="mt-1 text-sm">Review the word, then try the memory check again. This step has not been marked complete.</p><button type="button" onClick={() => restudyLearnItem(item)} className="mt-3 min-h-[44px] rounded-lg bg-white px-4 font-bold text-blue-700 ring-1 ring-blue-200">Study this word again</button></div> : <button type="button" disabled={!learnCheckAnswers[item.id] || learnSavingId === item.id} onClick={() => void submitLearnCheck(item)} className="mt-5 min-h-[50px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">{learnSavingId === item.id ? "Saving…" : "Check answer and continue"}</button>}
                </div>}
              </section>}
              {journeyState === "completed" && item.kind === "learn" && item.learnContent && <details className="mt-3 rounded-xl border border-emerald-200 bg-white/80 px-4 py-3"><summary className="cursor-pointer font-semibold text-emerald-900">Review this word and its learning record</summary><div className="mt-3 border-t border-emerald-100 pt-3"><div className="flex flex-wrap items-baseline gap-3"><strong className="text-2xl text-slate-950" lang="zh-Hans">{item.learnContent.hanzi}</strong><span className="font-semibold text-blue-700">{item.learnContent.pinyin}</span><span className="text-slate-600">{item.learnContent.meaning}</span></div><p className="mt-2 text-sm text-slate-600">{item.learnCheck ? item.learnCheck.firstTryCorrect ? "Memory check passed on the first try. A spaced review is scheduled." : `Memory check passed after ${item.learnCheck.attempts} attempts. A spaced review is scheduled.` : "This step was saved before memory checks were introduced. Its scheduled review will verify recall."}</p>{item.learnContent.example && <p className="mt-2 text-sm text-slate-700"><span lang="zh-Hans">{item.learnContent.example.hanzi}</span> · {item.learnContent.example.meaning}</p>}<button type="button" onClick={() => void markNeedsReview(item)} className="mt-3 min-h-[44px] rounded-lg bg-white px-4 font-bold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50">I don’t remember · start this review</button><p className="mt-2 text-xs text-slate-500">Opens a one-word review now, then returns you to Today.</p>{reviewNowFeedback[item.id] && <p className="mt-2 text-sm font-semibold text-emerald-800" role="status">{reviewNowFeedback[item.id]}</p>}</div></details>}
              {journeyState === "current" && (item.kind !== "learn" || !item.learnContent) && <div className="tw-current-actions mt-4" id="today-primary-action">{primaryTodayAction(item, data.session.id, currentStep, journeyProgress.totalPhases, selectedReviewItems, selectedReviewCards)}</div>}
              {item.status === "skipped" && <button className="mt-4 min-h-[48px] rounded-xl border border-blue-300 bg-white px-5 py-3 font-bold text-blue-700" onClick={() => void restore(item)}>Restore step</button>}
            </div>
          </article>;

    };
    return <Shell title="Today" active="Today" sub="Your next step, ready when you are." compact todayLayout>
      <div className="today-page today-workspace">
        {planFeedback && <p className="tw-feedback" role="status">{planFeedback}</p>}
        {syncState !== "synced" && <div className={`step7-alert ${syncState === "failed" || syncState === "conflict" ? "error" : "warning"}`} role="status"><strong>Offline sync: {syncState.replaceAll("_", " ")}</strong><p>{syncState === "conflict" ? "Another device changed this learning record. Your action remains pending; retry it against the latest server copy." : syncState === "failed" ? "Sync failed. Your pending action remains on this device." : "Your action is stored locally and will sync with the same operation key."}</p><button className="btn secondary" onClick={() => void retryPending()}>Retry sync</button></div>}
        {data.session.notice && <article className="tw-availability" role="status"><h2>{data.session.notice.message}</h2><Link className="btn" href={data.session.notice.actionHref}>{data.session.notice.actionLabel}</Link></article>}
        <section className="tw-overview" aria-label="Today’s plan and progress">
          <div className="tw-overview-top"><div><p className="tw-eyebrow">TODAY’S PLAN</p><h2>HSK {data.session.startLevel ?? 1}<span>About {data.session.totalEstimatedMinutes ?? 0} min</span></h2></div><button className="tw-secondary" type="button" onClick={() => setPlanOpen(true)}><HomeIcon name="calendar" />Adjust plan</button></div>
          <p className="tw-plan-context">{todayWorkspaceWordLabel(plannedTodayTasks)} · {({ balanced: "Balanced", review_first: "Review first", fix_mistakes: "Fix mistakes", listening_focus: "Listening focus" } as const)[data.session.focus ?? "balanced"]}</p>
          <div className="tw-overview-progress"><div><p><strong>{completedTasks}/{plannedTodayTasks.length}</strong> tasks completed{skippedTasks > 0 && <span> · {skippedTasks} moved to tomorrow</span>}</p><p className="tw-save-state"><HomeIcon name={syncState === "synced" ? "check" : "review"} />{syncState === "synced" ? data.scope === "account" ? "Account progress saved" : "Saved in this browser" : "Waiting to sync"}</p></div><div className="tw-progress-track" role="progressbar" aria-label="Today progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completedPercent}><span style={{width:`${completedPercent}%`}} /></div></div>
        </section>
        <TodayWorkspace support={{words:todaySessionRecap(plannedTodayTasks),hidden:todayRecapHidden(activeToday,Boolean(activeToday && learnCheckOpen[activeToday.id])),openMistakes:open.length,listeningPlanned:plannedTodayTasks.filter(item=>item.kind === "listen").length,level:data.session.startLevel ?? 1,onAdjust:()=>setPlanOpen(true),saveText:syncState !== "synced" ? "Your latest changes are waiting to sync. Use Retry sync above before leaving." : data.scope === "account" ? "Your account progress is saved. Sign in to the same account when you return." : "Your guest progress is linked to this browser. Return in the same browser to continue."}} key={data.session.id} activeId={activeToday?.id} completedStages={completedStageCount} totalStages={plannedStageCount} currentAction={continueAction}
          stages={stages.map(stage => ({key:stage.key,kind:stage.kind,state:stage.state,total:stage.total,completed:stage.completed,moved:stage.moved,minutes:stage.remainingMinutes,
            title:stage.kind === "learn" ? stage.entries.every(entry => entry.item.isContinuing) ? "Continue vocabulary" : stage.entries.every(entry => !entry.item.isContinuing) ? "Learn new words" : "Vocabulary" : stage.kind === "listen" && stage.entries.every(entry => entry.item.isContinuing) ? "Continue listening" : todayStageCopy[stage.kind].title,
            tasks:stage.entries.filter(entry => entry.item.kind !== "review" || entry.index === firstReviewIndex).map(entry => ({id:entry.item.id,kind:entry.item.kind,status:entry.item.status,title:entry.item.kind === "review" ? `Review ${stage.total} ${stage.total === 1 ? "card" : "cards"}` : entry.item.kind === "summary" ? "Today’s summary" : label(entry.item),content:renderTodayItem(entry)}))
          }))}
          stepOptions={<div className="tw-current-meta"><span><HomeIcon name="timer" />{remainingMinutes ? `About ${remainingMinutes} min left` : "No remaining timed steps"}</span>{activeToday && <details key={activeToday.id} className="tw-step-options"><summary>Move this step</summary><div><p>Move this step to tomorrow. Your completed work stays saved.</p><button type="button" onClick={() => void skip(activeToday)}>Move to tomorrow</button></div></details>}</div>}
          notes={<div className="tw-route-notes">
            {reviewGroupItems.length === 0 && (reviewDueNow > 0 || reviewLater > 0) && <p><HomeIcon name="review" /><span>{reviewDueNow ? `${reviewDueNow} cards due · none scheduled in this plan.` : `No review due now · ${reviewLater} scheduled for later.`} <Link href="/review">View reviews</Link></span></p>}
            {open.length > 0 && <p><HomeIcon name="pencil" /><span>{open.length} open mistakes · {scheduledMistakeCount} included in this plan. <Link href="/mistakes">View mistakes</Link></span></p>}
            {deferredTodayItems.length > 0 && <p className="tw-deferred">{deferredTodayItems.length} saved tasks are waiting for room. Adjust your plan to include them.</p>}
            <details className="tw-plan-notes"><summary>How this plan works</summary><p>Your saved plan sets the task order. Unfinished words can continue from an earlier session. Complete the current step to unlock the next; moved steps remain available to restore.</p></details>
            <Link className="tw-text-link" href="/dashboard">Learning dashboard<HomeIcon name="arrow" /></Link>
          </div>}
        />
      {planOpen && <div className="today-plan-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPlanOpen(false); }}>
        <div ref={planDialogRef} tabIndex={-1} className="today-plan-dialog" role="dialog" aria-modal="true" aria-labelledby="today-plan-title">
          <header className="today-plan-header"><div><span className="eyebrow">Today settings</span><h2 id="today-plan-title">Adjust today’s plan</h2><p>Change today’s workload and priority. Your completed steps stay saved.</p></div><button type="button" className="today-plan-close" aria-label="Close plan settings" onClick={() => setPlanOpen(false)}>×</button></header>
          <form className="today-plan-form" onSubmit={(event) => { event.preventDefault(); void configureToday(); }}>
            <p className="today-plan-recommendation"><strong>Recommended time:</strong> {recommendedMinutes} minutes, based on your score, streak, open mistakes and recent mastery.</p>
            <div className="today-plan-grid"><label>HSK level<select aria-label="Learning level" value={planDraftLevel} onChange={(event) => setPlanDraftLevel(Number(event.target.value))}>{Array.from({ length: 9 }, (_, index) => index + 1).map((level) => <option key={level} value={level}>{level >= 7 ? `HSK ${level} · Advanced 7–9 band` : `HSK ${level}`}</option>)}</select></label>
              <label>Learning time<select aria-label="Today&apos;s time budget" value={planDraftMinutes} onChange={(event) => { const minutes = Number(event.target.value) as TodayBudgetMinutes; setPlanDraftMinutes(minutes); setPlanDraftNewWords(recommendTodayNewWordCount(minutes)); }}>{TODAY_BUDGET_OPTIONS.map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes{minutes === recommendedMinutes ? " · Recommended" : ""}</option>)}</select></label></div>
            <fieldset><legend>New words</legend><p className="mt-1 text-sm text-slate-600">Unfinished words continue first; they do not count toward this new-word target.</p><div className="today-plan-segments">{TODAY_NEW_WORD_OPTIONS.map((count) => <label key={count} className={planDraftNewWords === count ? "selected" : ""}><input type="radio" name="new-words" value={count} checked={planDraftNewWords === count} onChange={() => setPlanDraftNewWords(count)} /><strong>{count}</strong><span>{count === 1 ? "word" : "words"}</span></label>)}</div></fieldset>
            <label className="today-plan-switch"><span><strong>Include listening</strong><small>Add available word and context audio to today’s route.</small></span><input type="checkbox" checked={planDraftListening} onChange={(event) => setPlanDraftListening(event.target.checked)} /></label>
            <fieldset><legend>Priority</legend><div className="today-plan-focus">{TODAY_FOCUS_OPTIONS.map((focus) => { const copy = { balanced: ["Balanced", "Mix due memory and new work."], review_first: ["Review first", "Clear all due reviews before new work."], fix_mistakes: ["Fix mistakes", "Put unresolved mistakes first."], listening_focus: ["Listening focus", "Lead with available listening tasks."] }[focus]; return <label key={focus} className={planDraftFocus === focus ? "selected" : ""}><input type="radio" name="today-focus" value={focus} checked={planDraftFocus === focus} onChange={() => setPlanDraftFocus(focus)} /><strong>{copy[0]}</strong><span>{copy[1]}</span></label>; })}</div></fieldset>
            <footer className="today-plan-actions"><button type="button" className="btn secondary" onClick={() => setPlanOpen(false)}>Cancel</button><button type="submit" className="btn">Save changes</button></footer>
          </form>
        </div>
      </div>}
      {celebration && <div className="today-celebration" role="dialog" aria-modal="true" aria-labelledby="today-celebration-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setCelebration(null); }}>
        {celebration.animate && <div className="today-confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div>}
        <div ref={celebrationPanelRef} tabIndex={-1} className="today-celebration-panel"><span className="today-celebration-icon"><HomeIcon name={celebration.icon} /></span><span className="eyebrow">{celebration.eyebrow}</span><h2 id="today-celebration-title">{celebration.title}</h2><p>{celebration.message}</p>
          {celebration.kind !== "step" && <div className="today-reward"><strong>Learning Points</strong><span>{reward ? reward.todayAwarded ? `+${reward.todayAward} earned today` : `${Math.ceil(reward.remainingSeconds / 60)} active min to today’s reward` : data.scope === "guest" ? "Sign in to earn daily points" : "Progress saved"}</span></div>}
          {celebration.kind === "step" && activeToday ? <div className="mt-5 w-full" onClick={() => setCelebration(null)}>{continueAction}</div> : <button className="btn mt-5" type="button" onClick={() => setCelebration(null)}>Done for today</button>}
        </div>
      </div>}
      </div>
    </Shell>;
  }

  if (mode === "mistakes") return <Shell title="Mistakes" active="Mistakes" sub="Correct wrong answers continuously; they leave this list only after a successful retry.">
    <MistakesWorkspace mistakes={data.mistakes} mastery={data.mastery} scope={data.scope} />
  </Shell>;

  const due = data.capabilities.focusedReview ? data.focusedReview : data.cards.filter((card) => card.dueAt <= new Date().toISOString());
  const futureReviewCards = data.cards.filter((card) => card.dueAt > new Date().toISOString());
  const serverScopedReviewIds = reviewCardIdsForScope(data.reviewLevelControl, selectedReviewScope);
  const dueById = new Map<string, Card>();
  for (const card of due) dueById.set(card.id, card);
  const scopedDue = serverScopedReviewIds.map((id) => dueById.get(id)).filter((card): card is Card => Boolean(card));
  const selectableDue = filterReviewCards(scopedDue, { difficultOnly });
  const selectedReviewCount = selectableDue.length;
  const roundPreview = reviewSessionPreview(selectableDue, reviewMinutes);
  const composition = reviewComposition(roundPreview.cards);
  const recommendedCount = Math.min(recommendReviewCount(selectableDue), roundPreview.total);
  const reviewedSessionCards = (reviewIds ?? []).map((id) => data.cards.find((card) => card.id === id)).filter((card): card is Card => Boolean(card));
  const nextReviewAt = reviewedSessionCards.map((card) => card.dueAt).filter((dueAt) => new Date(dueAt).getTime() > Date.now()).sort()[0];
  const todayCompletedReviewIds = completedTodayReviewCards(data.session, todayReviewRound);
  const sessionTotal = reviewIds?.length ?? 0;
  const todayReviewedCount = entryIntent.kind === "today" ? (reviewIds ?? []).filter((id) => todayCompletedReviewIds.has(id)).length : reviewedCount;
  const displayReviewedCount = entryIntent.kind === "today" ? todayReviewedCount : reviewedCount;
  const activeReviewId = entryIntent.kind === "today"
    ? activeTodayReviewCardId(reviewIds, todayCompletedReviewIds)
    : activeReviewCardId(reviewIds, reviewedCount);
  const activeCard = activeReviewId ? data.cards.find((card) => card.id === activeReviewId) : undefined;
  const activeFocusReason = data.focusedReview.find((card) => card.id === activeCard?.id)?.focusReason;
  const directEntryPreparing = !entryResolved || (entryIntent.kind !== "setup" && reviewIds === null);
  const directEntryEmpty = entryIntent.kind !== "setup" && reviewIds !== null && reviewIds.length === 0;
  const sessionComplete = Boolean(reviewIds?.length && displayReviewedCount >= sessionTotal);
  const missingReviewCard = Boolean(reviewIds?.length && activeReviewId && (!activeCard || entryIntent.kind === "today" && !todayReviewRound?.itemIds[reviewIds.indexOf(activeReviewId)]));
  const selectedText = activeCard?.choices.find((choice) => choice.key === selectedAnswer)?.text ?? reviewDraft;
  const currentAnswerCorrect = retryFeedback?.correct ?? false;
  const isMistakeRetry = Boolean(activeCard?.isMistake && !activeCard.legacyReview && activeCard.answerMode !== "self_recall");
  const canAnswerReview = Boolean(activeCard && !activeCard.legacyReview && activeCard.answerMode !== "self_recall");
  const reviewAudioEnded = Boolean(activeCard && reviewPlaybackEndedKey === `${activeCard.id}:${activeCard.revision}` && reviewPlaybackState !== "error");
  const canSelectReviewAnswer = Boolean(activeCard && (!activeCard.playbackRequired || activeCard.playbackReady || reviewAudioEnded));
  const ratingAdvanceLabel = displayReviewedCount + 1 >= sessionTotal ? "Save & finish" : "Save & next question";
  const chooseReviewScope = (scope: ReviewLevelScope) => {
    setSelectedReviewScope(scope);
    const url = new URL(window.location.href);
    if (scope === "current") url.searchParams.delete("level");
    else url.searchParams.set("level", String(scope));
    window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
  };
  const reviewScopeOptions: Array<{ scope: ReviewLevelScope; label: string; count: number }> = [
    { scope: "all", label: "All levels", count: data.reviewLevelControl.allCount },
    ...data.reviewLevelControl.levels.map(({ level, count }) => ({ scope: level, label: `HSK ${level}`, count })),
  ];
  const selectedReviewLevel = selectedReviewScope === "current" ? data.reviewLevelControl.currentLevel : typeof selectedReviewScope === "number" ? selectedReviewScope : null;

  const emptyReviewHistory = entryResolved && entryIntent.kind === "setup" && reviewIds === null && data.cards.length === 0;
  const todayShortcut = availableTodayReview(data.session, data.cards);
  const currentPrompt = activeCard ? reviewWorkbenchPrompt(activeCard) : null;
  const reportCards = entryIntent.kind === "today" ? reviewedSessionCards.filter(card => todayCompletedReviewIds.has(card.id)) : reviewedSessionCards.slice(0,displayReviewedCount);
  const objectiveReviewed = reportCards.filter(card => !card.legacyReview && card.answerMode !== "self_recall").length;
  const recallReviewed = reportCards.length - objectiveReviewed;
  const resetIndependentSession = () => {
    setReviewIds(null); setReviewedCount(0); setLastRatedCardId(null); setRevealed({});
    const url=new URL(window.location.href); url.searchParams.delete("round"); window.history.replaceState({},"",`${url.pathname}${url.search}${url.hash}`);
    document.getElementById("review-workbench-top")?.scrollIntoView({block:"start"});
  };

  return <Shell title="Review" active="Review" sub="Keep familiar words fresh." compact reviewLayout>
    <div className="rv-workspace" id="review-workbench-top">
      {!emptyReviewHistory&&<ReviewSourceBar intent={entryIntent} total={sessionTotal} complete={sessionComplete} onAdjust={resetIndependentSession}/>}
      {entryResolved && entryIntent.kind === "setup" && <IndependentReviewMemory key={data.queueBinding} binding={data.queueBinding} cards={retryResult?.cards ?? data.cards} ids={reviewIds} completed={reviewedCount+(retryResult&&retryFeedback?.correct?1:0)} level={selectedReviewScope} size={reviewMinutes} difficult={difficultOnly} onRestore={snapshot=>{setReviewIds(snapshot.ids);setReviewedCount(snapshot.completed);setSelectedReviewScope(snapshot.level);setReviewMinutes(snapshot.size);setDifficultOnly(snapshot.difficult);}}/>}
      {directEntryPreparing && <State title="Preparing your review" text="Loading the review items from where you started." />}
      {!reviewIds && entryResolved && entryIntent.kind === "setup" && <>
        {todayShortcut && <ReviewTodayShortcut remaining={todayShortcut.pendingIds.length} completed={todayShortcut.completed} total={todayShortcut.total}>{primaryTodayAction(todayShortcut.item,data.session.id,1,1,data.session.items.filter(item=>item.kind === "review"&&item.status === "pending"),todayShortcut.pendingIds.map(id=>data.cards.find(card=>card.id===id)!).filter(Boolean),todayShortcut.completed ? "Continue today’s review" : "Start today’s review")}</ReviewTodayShortcut>}
        {data.reviewLevelControl.allCount>0&&<section className="rv-setup" aria-labelledby="review-setup-title">
          <header><span className="rv-section-icon"><HomeIcon name="review"/></span><div><p className="rv-eyebrow">INDEPENDENT REVIEW</p><h2 id="review-setup-title">Build your own session</h2><p>Choose a level and a short round from your due cards.</p></div>{data.capabilities.focusedReview&&<span className="rv-pro">Focused Review · Pro</span>}</header>
          <div className="rv-setup-body">
            <fieldset><legend><span>1</span> Choose review level</legend><div className="rv-levels">
              {reviewScopeOptions.map(option=>{const selected=selectedReviewScope === option.scope || selectedReviewScope === "current" && option.scope === data.reviewLevelControl.currentLevel;return <button type="button" key={String(option.scope)} onClick={()=>chooseReviewScope(option.scope)} aria-pressed={selected}><strong>{option.label}{option.scope === data.reviewLevelControl.currentLevel&&<small>Current</small>}</strong><span>{option.count} due</span></button>;})}
            </div></fieldset>
            <fieldset className="rv-size-field"><legend><span>2</span> Choose a session size</legend><div className="rv-sizes">{([5,10,20] as const).map(minutes=><button type="button" key={minutes} onClick={()=>setReviewMinutes(minutes)} aria-pressed={reviewMinutes===minutes}><strong>{minutes} min target</strong><span>Up to {Math.min(minutes,selectedReviewCount)} {Math.min(minutes,selectedReviewCount)===1?'card':'cards'}</span></button>)}</div><p className="rv-size-note">Time is a guide. Finish at your own pace.</p></fieldset>
            <label className="rv-difficult"><input type="checkbox" checked={difficultOnly} onChange={event=>setDifficultOnly(event.target.checked)}/><span><strong>Difficult items only</strong><span>Open mistakes and cards you found hard to remember.</span></span></label>
            <section className="rv-preview" aria-label="Review composition"><div><h3>Your round · {roundPreview.total} {roundPreview.total===1?'card':'cards'}</h3><p>Counts below describe the cards this round will actually open.</p></div><div className="rv-composition"><span><HomeIcon name="reading"/><strong>{composition.reading}</strong> Reading</span><span><HomeIcon name="headphones"/><strong>{composition.listening}</strong> Listening</span>{composition.mistakes>0&&<span><HomeIcon name="pencil"/><strong>{composition.mistakes}</strong> Mistakes included</span>}</div></section>
            <button type="button" disabled={selectedReviewCount===0} className="rv-primary rv-start" onClick={()=>{setReviewIds(selectableDue.slice(0,reviewMinutes).map(card=>card.id));setReviewedCount(0);setRevealed({});}}>{roundPreview.total ? `Start ${roundPreview.total}-card review` : 'No cards due'}<HomeIcon name="arrow"/></button>
            {selectedReviewCount===0&&<div className="rv-empty-scope" role="status"><p>{difficultOnly?'No difficult items are due in this scope. Turn off the filter to see the other cards.':selectedReviewLevel?`HSK ${selectedReviewLevel} has no due reviews.`:'No reviews are due across all levels.'}</p>{!difficultOnly&&selectedReviewScope!=="all"&&<button type="button" onClick={()=>chooseReviewScope("all")}>View all levels</button>}</div>}
            {recommendedCount>0&&<p className="rv-recommendation">Suggested starting point: {recommendedCount} {recommendedCount===1?'card':'cards'} from your selected due queue.</p>}
            {data.capabilities.tier === "free"&&<p className="rv-free-note">{data.capabilities.dailyReviewGrades===null?'Standard review of learned cards is unlimited.':`${Math.max(0,data.capabilities.dailyReviewGrades-data.usage.dailyReviewGrades)} SRS ratings available today.`} <Link href="/pricing">View plan details</Link></p>}
          </div>
        </section>}
        {!emptyReviewHistory&&<ReviewOverview current={data.reviewLevelControl.currentCardIds.length} due={data.reviewLevelControl.allCount} future={futureReviewCards.length}/>}
      </>}

      {reviewIds && !sessionComplete && activeCard && <div className="rv-round" aria-live="polite">
        <div className="rv-round-progress">
          <div><p>Review progress</p><strong>Card {displayReviewedCount + 1} of {sessionTotal}</strong></div>
          <p className="text-sm text-slate-500">{Math.max(0, sessionTotal - displayReviewedCount - 1)} after this</p>
        </div>
        <div className="rv-progress-track" role="progressbar" aria-label="Review progress" aria-valuemin={0} aria-valuemax={sessionTotal} aria-valuenow={displayReviewedCount}><span style={{width:`${Math.min(100,displayReviewedCount/sessionTotal*100)}%`}}/></div>
        <article className="rv-question-card">
          <header className="rv-question-header"><span><HomeIcon name={currentPrompt?.icon ?? "review"}/>{activeCard.level ? `HSK ${activeCard.level}` : "Saved item"} · {activeCard.skill}</span><span>{currentPrompt?.label}</span>{data.capabilities.focusedReview&&activeFocusReason&&<span className="rv-pro">{activeFocusReason === "open_mistake" ? "Open mistake prioritized" : "Due memory prioritized"}</span>}</header>
          <div className="rv-question-body">
            {activeCard.instruction && <p className="mb-4 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-950">{activeCard.instruction}</p>}
            {activeCard.context && <p className="mb-5 rounded-2xl bg-slate-50 p-5 text-lg leading-8 text-slate-900" lang="zh-Hans">{activeCard.context}</p>}
            <h2 className="rv-question-title">{activeCard.prompt}</h2><p className="rv-question-tip">{currentPrompt?.tip}</p>
            {activeCard.audioSrc && <div className="mt-5"><p className="mb-2 text-sm font-semibold text-slate-700">Original recording</p><AudioPlaybackControl key={`${activeCard.id}:${activeCard.revision}:${activeCard.audioSrc}`} asset={{ id: `${activeCard.id}:${activeCard.revision}`, src: activeCard.audioSrc, sourceLabel: "Synthesized listening audio" }} beforePlay={() => startFormalPlayback(activeCard)} onComplete={() => void completeFormalPlayback(activeCard)} onStateChange={(state) => { if (state === "paused") reviewPlayback.current?.coordinator.pause(); else if (state === "playing") reviewPlayback.current?.coordinator.resume(); }} onFailure={() => { reviewPlayback.current?.coordinator.fail(); setAudioError("Audio playback failed. Retry the recording before answering."); }} verificationState={reviewPlaybackState === "preparing" || reviewPlaybackState === "verifying" ? "verifying" : activeCard.playbackReady ? "verified" : "idle"} showProgress /></div>}
            {!activeCard.audioSrc && activeCard.dimension !== "reading" && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">The original recording is not available for this older item. It cannot be treated as a full listening retry.</p>}
            {!activeCard.playbackReady && activeCard.playbackRequired && <p className="mt-3 text-sm font-semibold text-amber-700">{reviewAudioEnded ? "Audio finished. Choose an answer now; checking will unlock after playback verification." : "Finish audio playback before answering."}</p>}

            {canAnswerReview && !answerChecked ? <div className="mt-7">
              {activeCard.answerMode === "choice" ? <fieldset disabled={!canSelectReviewAnswer}><legend className="font-bold text-slate-950">Choose an answer</legend><div className="mt-3 grid gap-3">{activeCard.choices.map((choice) => <label key={choice.key} className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${selectedAnswer === choice.key ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-400"}`}><input type="radio" name={`review-${activeCard.id}`} value={choice.key} checked={selectedAnswer === choice.key} onChange={() => setSelectedAnswer(choice.key)} /><span><strong className="mr-2">{choice.key}.</strong>{choice.text}</span></label>)}</div></fieldset> : <><label className="font-bold text-slate-950" htmlFor={`review-answer-${activeCard.id}`}>Type your answer</label><textarea id={`review-answer-${activeCard.id}`} maxLength={180} value={reviewDraft} disabled={!canSelectReviewAnswer} onChange={(event) => setReviewDraft(event.target.value)} className="mt-3 min-h-[112px] w-full rounded-xl border border-slate-300 p-4 text-base focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100" /></>}
              <button disabled={!(activeCard.answerMode === "choice" ? selectedAnswer : reviewDraft.trim()) || !activeCard.playbackReady || reviewSaving} onClick={() => void submitRetry(activeCard)} className="mt-5 min-h-[48px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">{reviewSaving ? "Checking…" : "Check answer"}</button>
            </div> : !revealed[activeCard.id] && !answerChecked ? <div className="mt-7">{activeCard.legacyReview && <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">The original question is unavailable for this older saved item. Use it as a memory prompt.</p>}<p className="mb-3 text-sm text-slate-600">Recall the answer before revealing it, then rate your memory.</p><button className="min-h-[48px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" disabled={!activeCard.playbackReady} onClick={() => setRevealed((current) => ({ ...current, [activeCard.id]: true }))}>Reveal answer</button></div> : null}

            {(revealed[activeCard.id] || answerChecked) && <div className="mt-7" aria-live="polite">
              {answerChecked && <div className={`rounded-2xl border p-4 ${currentAnswerCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-rose-200 bg-rose-50 text-rose-950"}`}><p className="font-bold">{currentAnswerCorrect ? (isMistakeRetry ? "Correct this time — this mistake is resolved" : "Correct") : entryIntent.kind === "today" && isMistakeRetry ? "Saved for later review — today’s step still counts" : "Not yet — review the difference"}</p><p className="mt-1"><strong>Your answer this time:</strong> {selectedText}</p>{entryIntent.kind === "today" && isMistakeRetry && !currentAnswerCorrect && <p className="mt-2 text-sm">This mistake stays open and will return later without blocking the next Today step.</p>}</div>}
              <div className="mt-4 rounded-2xl bg-slate-50 p-[20px] text-slate-800">
                <p><strong>{isMistakeRetry ? "Correct answer" : "Answer"}:</strong> {activeCard.correctAnswer}</p>
                {isMistakeRetry && <details className="mt-3 border-t border-slate-200 pt-3 text-sm"><summary className="cursor-pointer font-semibold text-slate-700">Earlier attempt</summary><p className="mt-2"><strong>{activeCard.priorAnswerLabel}:</strong> {activeCard.userAnswer || "No answer"}</p></details>}
                <p className="mt-3 text-sm text-slate-600"><strong className="mb-1 block text-slate-800">Why the answer fits</strong>{activeCard.explanation}</p>
              </div>
              {(activeCard.pinyin || activeCard.meaning || activeCard.example) && <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-[20px]" aria-label="Vocabulary answer details">
                {activeCard.pinyin && <p><strong>Pinyin:</strong> {activeCard.pinyin}</p>}
                {activeCard.meaning && <p className="mt-2"><strong>Meaning:</strong> {activeCard.meaning}</p>}
                {activeCard.example && <div className="mt-4 border-t border-slate-200 pt-4">
                  <p><strong>Example:</strong> <span lang="zh-Hans">{activeCard.example.hanzi}</span></p>
                  <p className="mt-1 text-sm text-blue-700">{activeCard.example.pinyin}</p>
                  <p className="mt-1 text-sm text-slate-600"><strong>Example translation:</strong> {activeCard.example.meaning}</p>
                </div>}
                {activeCard.formalAudioSrc && activeCard.formalAudioSrc !== activeCard.audioSrc && <div className="mt-4"><p className="mb-2 text-sm font-semibold text-slate-700">Formal recording</p><audio controls preload="none" src={activeCard.formalAudioSrc} className="max-w-full" /></div>}
              </section>}
              {isMistakeRetry && answerChecked && <><p className="mt-4 text-sm text-slate-600">AI explanation available after you retry. It uses this saved question and feedback and costs one AI credit.</p><AiAssist feature="explanation" reviewCardId={activeCard.id} /></>}
              {isMistakeRetry && answerChecked ? <button disabled={reviewSaving} onClick={() => continueAfterRetry(activeCard)} className="mt-5 min-h-[48px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">Continue</button> : <div className="mt-5"><p className="font-bold text-slate-950">{answerChecked ? "How well did you remember it after answering?" : "How well did you remember it before revealing?"}</p><p className="mt-1 text-sm text-slate-600">Choose a rating to save this answer and {displayReviewedCount + 1 >= sessionTotal ? "finish the review" : "open the next question"}.</p><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{reviewGradeOptions(activeCard.ease, activeCard.intervalDays).map((option) => <button disabled={reviewSaving} key={option.grade} onClick={() => void grade(activeCard, option.grade)} className="min-h-[92px] rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-blue-500 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"><strong className="block text-slate-950">{option.label}</strong><span className="mt-1 block text-xs text-slate-500">{option.hint}</span><span className="mt-2 block text-xs font-bold text-blue-700">{ratingAdvanceLabel} →</span></button>)}</div></div>}
            </div>}
          </div>
          <footer className="rv-question-footer"><HomeIcon name="review"/><span>{activeCard.reviewReason}</span></footer>
        </article>
        {lastRatedCardId && data.canUndoReview && <button className="mt-4 min-h-[48px] px-2 text-sm font-semibold text-slate-600 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" onClick={() => void undoLastRating()}>Undo last rating</button>}
      </div>}

      {missingReviewCard && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950" role="alert"><h2 className="text-xl font-bold">This review item is no longer available</h2><p className="mt-2">Your progress has not been marked complete. Return to Today to refresh the current plan, or open Review to choose an available item.</p><div className="mt-4 flex flex-wrap gap-3"><Link className="min-h-11 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white" href="/today">Refresh Today plan</Link><Link className="min-h-11 rounded-xl border border-amber-700 px-4 py-3 font-bold" href="/review">Choose another review</Link></div></div>}
      {sessionComplete && <section className="rv-report" aria-live="polite">
        <header><span className="rv-section-icon"><HomeIcon name="check"/></span><div><p className="rv-eyebrow">ROUND SAVED</p><h2>You reviewed {displayReviewedCount} {displayReviewedCount===1?'card':'cards'}.</h2><p>{entryIntent.kind === "today"?"Your planned review is saved. Continue with the next Today task.":"Your submitted reviews and memory ratings are saved."}</p></div></header>
        <div className="rv-report-stats"><div><HomeIcon name="check"/><strong>{objectiveReviewed}</strong><span>Answerable cards reviewed</span></div><div><HomeIcon name="review"/><strong>{recallReviewed}</strong><span>Self-recall cards rated</span></div><div><HomeIcon name="pencil"/><strong>{open.length}</strong><span>Open mistakes in your list</span></div></div>
        <p className="rv-report-explanation">Finished cards can include answers you missed. Answer feedback and memory ratings describe different parts of your review.</p>
        <div className="rv-next-review"><HomeIcon name="calendar"/><div><h3>Next review from this round</h3><p>{nextReviewAt?new Date(nextReviewAt).toLocaleString():"No upcoming item in this round"}</p></div></div>
        <div className="rv-report-actions">{entryIntent.kind === "today"&&entryTodaySessionId&&entryTodayItemId?<Link className="rv-primary" href={`/today?resume=1&completed=review&completedSession=${encodeURIComponent(entryTodaySessionId)}&completedItem=${encodeURIComponent(entryTodayItemId)}`}>Continue Today — {data.session.items.find(item=>!item.deferred&&item.status === "pending")?.title ?? "next step"}<HomeIcon name="arrow"/></Link>:entryIntent.kind === "setup"?<button type="button" className="rv-primary" onClick={resetIndependentSession}>Start another review<HomeIcon name="arrow"/></button>:<Link className="rv-primary" href={entryIntent.kind === "mistake"?"/mistakes":"/today"}>{entryIntent.kind === "mistake"?"Continue correcting":"Back to Today"}<HomeIcon name="arrow"/></Link>}{entryIntent.kind === "setup"&&<Link className="rv-secondary" href="/today">Back to Today</Link>}{open.length>0&&entryIntent.kind !== "mistake"&&<Link className="rv-secondary" href="/mistakes">View mistakes</Link>}</div>
        {lastRatedCardId&&data.canUndoReview&&<button className="rv-undo" type="button" onClick={()=>void undoLastRating()}>Undo last rating</button>}
      </section>}

      {directEntryEmpty && <State title={entryIntent.kind === "mistake" ? "This mistake is no longer open" : entryIntent.kind === "word" ? "This word review is unavailable" : "You're caught up"} text={entryIntent.kind === "mistake" ? "It may already have been resolved or is no longer available for review." : entryIntent.kind === "word" ? "The saved review card could not be found. Return to Today and try the word again." : "There are no reviews due in today's queue."}><Link className="btn" href={entryIntent.kind === "mistake" ? "/mistakes" : "/today"}>{entryIntent.kind === "mistake" ? "Back to Mistakes" : "Back to Today"}</Link></State>}
      {entryResolved && entryIntent.kind === "setup" && reviewIds === null && due.length === 0 && data.cards.length > 0 && <section className="rv-upcoming">
        <header><span className="rv-eyebrow">SCHEDULE CLEAR</span><h2>Upcoming reviews</h2><p>Nothing is due now. Your next reviews are listed below.</p></header>
        <div className="p-6 sm:p-8"><div className="grid gap-3">{[...futureReviewCards].sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 3).map((card) => <article className="rounded-2xl border border-slate-200 p-4" key={card.id}><p className="font-bold text-slate-950">{card.prompt}</p><p className="mt-1 text-sm text-slate-600">{card.skill} · Scheduled {new Date(card.dueAt).toLocaleString()}</p></article>)}</div><Link href={`/vocabulary/${data.reviewLevelControl.currentLevel}?mode=flashcards#vocabulary-activities`} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 font-bold text-white">Practise with flashcards</Link></div>
      </section>}
      {emptyReviewHistory&&<ReviewOnboarding level={data.reviewLevelControl.currentLevel} account={data.scope === "account"}/>}
      {audioError && <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">{audioError}</p>}
    </div>
  </Shell>;
}

type TodayJourneyState = "current" | "completed" | "locked" | "skipped";

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
function primaryTodayAction(item: Item, dailySessionId: string, step: number, total: number, reviews: Item[], cards: Card[], actionLabel?: string) {
  const context = `dailySessionId=${encodeURIComponent(dailySessionId)}&dailyItemId=${encodeURIComponent(item.id)}&from=today&todayStep=${step}&todayTotal=${total}`;
  const href = item.kind === "review"
    ? `/review?source=today&dailySessionId=${encodeURIComponent(dailySessionId)}&dailyItemId=${encodeURIComponent(item.id)}&cap=${reviews.length}&cards=${encodeURIComponent(cards.map((card) => card.id).join(","))}`
    : `${item.href ?? (item.kind === "learn" ? "/levels" : item.kind === "listen" ? "/listen" : "/practice")}${(item.href ?? "").includes("?") ? "&" : "?"}${context}`;
  return <Link className="inline-flex min-h-[50px] items-center rounded-xl bg-blue-500 px-6 py-3 font-bold text-white shadow-sm hover:bg-blue-400" href={href}>{actionLabel ?? "Continue Today Session"}</Link>;
}
function todayReason(item: Item, openMistakes: number, weakest: string) {
  if (item.kind === "learn") return item.isContinuing ? "Continue this unfinished word. Your completed work stays saved." : "Learn the meaning, then check it from memory.";
  if (item.kind === "listen" && item.isContinuing) return item.dimension === "context_audio" ? "Only this word's context listening remains; completed steps stay saved." : "Finish this word's unfinished listening check; completed Learn steps stay saved.";
  if (item.kind === "listen") return item.dimension === "context_audio" ? "Context listening follows word audio so meaning is tested in a real sentence." : "Word audio follows Learn so sound is attached to the same item.";
  if (item.kind === "practice") return "Practice closes the loop with a scored, server-saved result.";
  if (item.kind === "review") return openMistakes ? `${openMistakes} open mistake${openMistakes === 1 ? "" : "s"} and due cards take priority.` : `${weakest} is currently your lowest mastery area.`;
  return "This step keeps the Today Session continuous.";
}
function Shell(props: { title: string; active: LearningLoopLabel; sub: string; children: ReactNode; compact?: boolean; todayLayout?: boolean; reviewLayout?: boolean }) {
  return <main className={`learn ${props.todayLayout ? "today-shell" : props.reviewLayout ? "review-shell" : ""} ${props.compact ? "pt-6 sm:pt-16" : ""}`}><header className={props.compact ? "mb-5 sm:mb-8" : undefined}>{!props.compact && <span className="eyebrow">HSKKit learning loop</span>}<h1 className={props.compact ? "text-2xl sm:text-4xl" : undefined}>{props.title}</h1><p className={props.compact ? "hidden sm:block" : undefined}>{props.sub}</p><LearningLoopNav active={props.active}/></header>{props.children}</main>;
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
const MISTAKES_PAGE_SIZE = 5;
const mistakeTypeLabels: Record<Dimension, string> = { reading: "Reading", audio: "Word listening", context_audio: "Context listening" };
const mistakeLabel = (mistake: Mistake) => mistake.skill === "Grammar" ? "Grammar" : mistakeTypeLabels[mistake.dimension];
function mistakeDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}
function MistakesWorkspace({ mistakes, mastery, scope }: { mistakes: Mistake[]; mastery: Data["mastery"]; scope: Data["scope"] }) {
  const [level, setLevel] = useState(0);
  const [type, setType] = useState<Dimension | "all" | "grammar">("all");
  const [age, setAge] = useState(0);
  const [sort, setSort] = useState<"newest" | "oldest" | "level">("newest");
  const [page, setPage] = useState(1);
  const [historyShown, setHistoryShown] = useState(5);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("skill") === "grammar") setType("grammar");
  }, []);
  const open = mistakes.filter((mistake) => mistake.status === "open");
  const corrected = mistakes.filter((mistake) => mistake.status !== "open").sort((a, b) => new Date(b.resolvedAt ?? b.createdAt).getTime() - new Date(a.resolvedAt ?? a.createdAt).getTime());
  const levels = [...new Set(open.map((mistake) => mistake.level).filter((value): value is number => typeof value === "number"))].sort((a, b) => a - b);
  const cutoff = age ? Date.now() - age * 86400000 : 0;
  const filtered = open.filter((mistake) => (!level || mistake.level === level) && (type === "all" || (type === "grammar" ? mistake.skill === "Grammar" : mistake.dimension === type && (type !== "reading" || mistake.skill !== "Grammar"))) && (!cutoff || new Date(mistake.createdAt).getTime() >= cutoff));
  const ordered = [...filtered].sort((a, b) => sort === "level"
    ? (a.level ?? 99) - (b.level ?? 99) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    : (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) * (sort === "oldest" ? -1 : 1));
  const pageCount = Math.max(1, Math.ceil(ordered.length / MISTAKES_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * MISTAKES_PAGE_SIZE;
  const visible = ordered.slice(firstIndex, firstIndex + MISTAKES_PAGE_SIZE);
  const firstPageButton = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  const pageButtons = Array.from({ length: Math.min(5, pageCount) }, (_, index) => firstPageButton + index);
  const filtersActive = level !== 0 || type !== "all" || age !== 0 || sort !== "newest";
  const resetFilters = () => { setLevel(0); setType("all"); setAge(0); setSort("newest"); setPage(1); };
  const retryHref = (mistake: Mistake) => `/review?source=mistakes&contentId=${encodeURIComponent(mistake.contentId)}${mistake.cardId ? `&cardId=${encodeURIComponent(mistake.cardId)}` : ""}`;

  return <>
    <UploadedMistakeAnalyzer />
    {open.length > 0 ? <>
      <section aria-label="Filter open mistakes" className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[125px_minmax(0,1fr)_118px_132px_auto] lg:items-end lg:gap-3 lg:px-5 lg:py-4">
        <label className="block text-sm font-semibold text-slate-700">HSK level<select value={level} onChange={(event) => { setLevel(Number(event.target.value)); setPage(1); }} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"><option value={0}>All levels</option>{levels.map((value) => <option key={value} value={value}>HSK {value}</option>)}</select></label>
        <fieldset className="min-w-0 sm:col-span-2 lg:col-span-1"><legend className="text-sm font-semibold text-slate-700">Question type</legend><div className="mt-1 flex flex-wrap gap-1.5">{([ ["all", "All types"], ["grammar", "Grammar"], ["reading", "Reading"], ["audio", "Listening"], ["context_audio", "Context audio"] ] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={type === value} onClick={() => { setType(value); setPage(1); }} className={`min-h-11 rounded-full border px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${type === value ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-blue-50 text-blue-700 hover:border-blue-400"}`}>{label}</button>)}</div></fieldset>
        <label className="block text-sm font-semibold text-slate-700">When added<select value={age} onChange={(event) => { setAge(Number(event.target.value)); setPage(1); }} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"><option value={0}>Any time</option><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option></select></label>
        <label className="block text-sm font-semibold text-slate-700">Sort by<select value={sort} onChange={(event) => { setSort(event.target.value as typeof sort); setPage(1); }} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="level">HSK level</option></select></label>
        <button type="button" onClick={resetFilters} disabled={!filtersActive} className="min-h-11 rounded-lg bg-blue-50 px-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-default disabled:text-slate-400 disabled:hover:bg-blue-50">Reset filters</button>
      </section>
      <p role="status" className="my-4 text-sm font-medium text-slate-600">{ordered.length ? `Showing ${firstIndex + 1}–${firstIndex + visible.length} of ${ordered.length} matching mistakes` : "No mistakes match these filters"}{ordered.length !== open.length ? ` · ${open.length} open in total` : ""}</p>
      {visible.length ? <section aria-label="Open mistakes" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[2rem_minmax(0,1fr)_9rem_5rem_7rem_6rem] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 lg:grid"><span>#</span><span>Question</span><span>Type</span><span>HSK</span><span>Added</span><span className="text-right">Action</span></div>
        <ol className="divide-y divide-slate-200">{visible.map((mistake, index) => <li key={mistake.id} className="grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[2rem_minmax(0,1fr)_9rem_5rem_7rem_6rem] lg:items-center lg:gap-4">
          <span className="hidden text-sm text-slate-500 lg:block">{firstIndex + index + 1}</span>
          <div className="min-w-0"><p className="line-clamp-2 font-semibold leading-snug text-slate-950">{mistake.prompt}</p><p className="mt-1 text-xs text-slate-500 lg:hidden">{mistakeLabel(mistake)} · {mistake.level ? `HSK ${mistake.level}` : "Level unknown"} · Added {mistakeDate(mistake.createdAt)}</p></div>
          <span className={`hidden w-fit rounded-full px-2 py-1 text-xs font-semibold lg:block ${mistake.dimension === "reading" ? "bg-blue-50 text-blue-700" : mistake.dimension === "audio" ? "bg-emerald-50 text-emerald-700" : "bg-violet-50 text-violet-700"}`}>{mistakeLabel(mistake)}</span><span className="hidden text-sm text-slate-600 lg:block">{mistake.level ? `HSK ${mistake.level}` : "—"}</span><span className="hidden text-sm text-slate-600 lg:block">{mistakeDate(mistake.createdAt)}</span>
          <Link href={retryHref(mistake)} className="inline-flex min-h-11 w-fit items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:justify-self-end">Retry <HomeIcon name="arrow" className="size-4" /></Link>
        </li>)}</ol>
        {pageCount > 1 && <nav aria-label="Mistakes pages" className="flex flex-wrap items-center justify-center gap-1 border-t border-slate-200 px-3 py-3 sm:justify-end"><button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40">Previous</button>{pageButtons.map((number) => <button key={number} type="button" onClick={() => setPage(number)} aria-label={`Page ${number}`} aria-current={number === currentPage ? "page" : undefined} className={`min-h-11 min-w-11 rounded-lg text-sm font-semibold ${number === currentPage ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}>{number}</button>)}<button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40">Next</button></nav>}
      </section> : <State title="No matching mistakes" text="Try another HSK level, question type, or date range."><button type="button" className="btn" onClick={resetFilters}>Show all mistakes</button></State>}
    </> : <State title={corrected.length ? "All mistakes corrected" : "No mistakes yet"} text={corrected.length ? "Every recorded mistake has been corrected. Keep practicing to build confidence." : "Mistakes from practice and listening will appear here so you can retry them."}><Link className="btn inline-flex items-center" href="/practice">Start practicing</Link></State>}
    {corrected.length > 0 && <details className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm"><summary className="min-h-16 cursor-pointer rounded-2xl px-4 py-4 text-base font-bold text-slate-900 marker:text-blue-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 sm:px-5">Corrected history <span className="ml-1 rounded-full bg-emerald-50 px-2.5 py-1 text-sm text-emerald-700">{corrected.length}</span><span className="ml-2 block text-sm font-normal text-slate-500 sm:inline">Past successful retries</span></summary><div className="border-t border-slate-200"><ol className="divide-y divide-slate-200">{corrected.slice(0, historyShown).map((mistake) => <li key={mistake.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 sm:px-5"><div className="min-w-0"><p className="line-clamp-2 font-semibold text-slate-900">{mistake.prompt}</p><p className="mt-1 text-xs text-slate-500">{mistakeLabel(mistake)} · {mistake.level ? `HSK ${mistake.level}` : "Level unknown"}</p></div><span className="whitespace-nowrap text-xs text-slate-500">Corrected {mistakeDate(mistake.resolvedAt ?? mistake.createdAt)}</span></li>)}</ol>{historyShown < corrected.length && <button type="button" onClick={() => setHistoryShown((count) => count + 5)} className="min-h-11 w-full border-t border-slate-200 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">Show 5 more</button>}</div></details>}
    <Mastery values={mastery} scope={scope} />
  </>;
}
function Mastery({ values, scope }: { values: Record<Dimension, number>; scope: Data["scope"] }) {
  return <section className="summary"><h2>Mastery</h2><p className="text-sm font-semibold">Mastered after successful review</p><p>Reading {values.reading} · Audio {values.audio} · Context audio {values.context_audio}</p><p>{scope === "account" ? "Saved to your private account learning record and available across synced devices." : "Saved for this guest browser; sign in to merge it explicitly into your account."}</p></section>;
}
