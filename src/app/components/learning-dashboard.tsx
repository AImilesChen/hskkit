"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import AiAssist from "./ai-assist";
import LearningLoopNav, { type LearningLoopLabel } from "./learning-loop-nav";
import { LearningLoadError, loadLearningData, type LearningLoadErrorCode } from "../../lib/learning/client-load";
import { buildIntentReviewQueue, buildReviewQueue, filterReviewCards, recommendReviewCount, reviewComposition, reviewEntryIntent, reviewGradeOptions, reviewTip, type ReviewEntryIntent, type ReviewGrade } from "../../lib/learning/review-session";

type Dimension = "reading" | "audio" | "context_audio";
type Item = { id: string; kind: "review" | "learn" | "listen" | "practice" | "summary"; contentId: string; contentVersion?: string; status: "pending" | "completed" | "skipped"; dimension?: Dimension; title?: string; href?: string; estimatedMinutes?: number; deferred?: boolean; reviewCardId?: string };
type Notice = { code: string; message: string; actionHref: string; actionLabel: string };
type Card = { id: string; contentId: string; dimension: Dimension; dueAt: string; revision: number; prompt: string; context?: string; instruction?: string; answerMode: "choice" | "text" | "self_recall"; correctAnswer: string; correctAnswerKey: string; userAnswer: string; priorAnswerLabel: string; choices: Array<{ key: string; text: string }>; isMistake: boolean; legacyReview: boolean; reviewReason: string; explanation: string; level?: number; levelBand: string; skill: string; topic?: string; intervalDays: number; ease: number; reviewCount: number; audioText?: string; audioSrc?: string; assetId?: string; pinyin?: string; meaning?: string; example?: { hanzi: string; pinyin: string; meaning: string }; formalAudioSrc?: string; playbackRequired: boolean; playbackReady: boolean };
type Mistake = { id: string; contentId: string; cardId?: string; status: string; createdAt: string; resolvedAt?: string; dimension: Dimension; prompt: string; level?: number; skill: string };
type Data = {
  session: { id: string; startLevel?: number; contentReleaseId?: string; notice?: Notice; budgetMinutes?: number; totalEstimatedMinutes?: number; items: Item[] };
  cards: Card[];
  focusedReview: (Card & { focusReason: "open_mistake" | "due" })[];
  canUndoReview: { cardId: string } | null;
  capabilities: { tier: "free" | "pro"; dailyNewItems: number | null; dailyReviewGrades: number | null; focusedReview: boolean };
  usage: { dailyNewItems: number; dailyReviewGrades: number };
  mistakes: Mistake[];
  mastery: Record<Dimension, number>;
  streak: { current: number; longest: number; lastLearningDay: string | null };
  streakBasis: string;
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
  const [reviewMinutes, setReviewMinutes] = useState<5 | 10 | 20>(10);
  const [difficultOnly, setDifficultOnly] = useState(false);
  const [mistakeLevel, setMistakeLevel] = useState(0);
  const [mistakeType, setMistakeType] = useState<"all" | Dimension>("all");
  const [mistakeAge, setMistakeAge] = useState(0);
  const [reviewIds, setReviewIds] = useState<string[] | null>(null);
  const [entryIntent, setEntryIntent] = useState<ReviewEntryIntent>({ kind: "setup" });
  const [entryResolved, setEntryResolved] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [reviewDraft, setReviewDraft] = useState("");
  const [answerChecked, setAnswerChecked] = useState(false);
  const [retryFeedback, setRetryFeedback] = useState<{ correct: boolean; correctAnswerText: string } | null>(null);
  const [retryResult, setRetryResult] = useState<Data | null>(null);
  const [lastRatedCardId, setLastRatedCardId] = useState<string | null>(null);
  const [ratedLegacyMistakeIds, setRatedLegacyMistakeIds] = useState<string[]>([]);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [syncState, setSyncState] = useState<"synced" | "local_pending" | "syncing" | "conflict" | "failed">("synced");
  const operationKeys = useRef<Record<string, string>>({});
  const dataRef = useRef<Data | null>(null);
  const playbackTickets = useRef<Record<string, { playbackTicket: string; notBefore?: string }>>({});

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
    setEntryIntent(reviewEntryIntent(window.location.search));
    setEntryResolved(true);
    void load();
    const online = () => { void retryPending(dataRef.current); };
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode !== "review" || !data || !entryResolved || entryIntent.kind === "setup" || reviewIds !== null) return;
    const reviewCards = entryIntent.kind === "mistake"
      ? data.cards
      : entryIntent.kind === "today"
        ? data.cards.filter((card) => card.dueAt <= new Date().toISOString())
      : data.capabilities.focusedReview
        ? data.focusedReview
        : data.cards.filter((card) => card.dueAt <= new Date().toISOString());
    setReviewIds(buildIntentReviewQueue(reviewCards, entryIntent, reviewMinutes).map((card) => card.id));
    setReviewedCount(0);
    setRatedLegacyMistakeIds([]);
  }, [data, entryIntent, entryResolved, mode, reviewIds, reviewMinutes]);

  useEffect(() => {
    setSelectedAnswer("");
    setReviewDraft("");
    setAnswerChecked(false);
    setRetryFeedback(null);
    setRetryResult(null);
    setAudioError("");
    playbackTickets.current = {};
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
      if (await post("grade", { cardId: card.id, grade: gradeName, clientRevision: card.revision }, `grade:${card.id}:${gradeName}`)) {
        setRevealed((current) => ({ ...current, [card.id]: false }));
        setSelectedAnswer("");
        setReviewDraft("");
        setAnswerChecked(false);
        setRetryFeedback(null);
        setRetryResult(null);
        setReviewedCount((count) => count + 1);
        if (entryIntent.kind === "mistake" && card.legacyReview) setRatedLegacyMistakeIds((ids) => [...ids, card.id]);
        setLastRatedCardId(card.id);
      }
    } finally {
      setReviewSaving(false);
    }
  }
  async function submitRetry(card: Card) {
    const answer = card.answerMode === "choice" ? selectedAnswer : reviewDraft.trim();
    if (!answer || reviewSaving) return;
    setReviewSaving(true);
    try {
      const result = await post("retry_review", { cardId: card.id, answer, cardRevision: card.revision }, `retry-review:${card.id}:${card.revision}`, false) as (Data & { feedback?: { correct: boolean; correctAnswerText: string } }) | false;
      if (result && result.feedback) {
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
    if (retryFeedback?.correct) setReviewedCount((count) => count + 1);
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
        setReviewedCount((count) => Math.max(0, count - 1));
        setRatedLegacyMistakeIds((ids) => ids.filter((id) => id !== lastRatedCardId));
        setLastRatedCardId(null);
      }
    } finally {
      setReviewSaving(false);
    }
  }
  async function complete(item: Item) {
    await post("complete_item", { sessionId: data!.session.id, itemId: item.id }, `complete:${data!.session.id}:${item.id}`);
  }
  async function skip(item: Item) { await post("skip_item", { sessionId: data!.session.id, itemId: item.id }, `skip:${data!.session.id}:${item.id}`); }
  async function restore(item: Item) { await post("restore_item", { sessionId: data!.session.id, itemId: item.id }, `restore:${data!.session.id}:${item.id}`); }
  async function configureToday(minutes: number, startLevel = data!.session.startLevel ?? 1) { await post("configure_today", { budgetMinutes: minutes, startLevel }, `today-plan:${data!.session.id}:${minutes}:${startLevel}`); }
  async function startFormalPlayback(card: Card) {
    setAudioError("");
    try {
      const started = await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "audio_review_playback_start", payload: { idempotencyKey: crypto.randomUUID(), cardId: card.id, cardRevision: card.revision }, tzOffset: tz(), queueBinding: data?.queueBinding }) });
      if (!started.ok) throw new Error("START_FAILED");
      const ticket = await started.json() as { playbackTicket?: string; notBefore?: string };
      if (!ticket.playbackTicket) throw new Error("NO_TICKET");
      playbackTickets.current[card.id] = { playbackTicket: ticket.playbackTicket, notBefore: ticket.notBefore };
    } catch { setAudioError("Playback verification could not start. No mastery was changed."); }
  }
  async function completeFormalPlayback(card: Card) {
    const ticket = playbackTickets.current[card.id];
    if (!ticket) { setAudioError("Playback could not be verified. Replay it before answering."); return; }
    try {
      const remaining = Math.max(0, (ticket.notBefore ? new Date(ticket.notBefore).getTime() : Date.now()) - Date.now());
      if (remaining) await new Promise((resolve) => window.setTimeout(resolve, remaining));
      const completed = await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "audio_review_playback_complete", payload: { idempotencyKey: crypto.randomUUID(), cardId: card.id, cardRevision: card.revision, playbackTicket: ticket.playbackTicket }, tzOffset: tz(), queueBinding: data?.queueBinding }) });
      if (!completed.ok) throw new Error("COMPLETE_FAILED");
      await post("audio_review_ready", { cardId: card.id, cardRevision: card.revision, playbackTicket: ticket.playbackTicket }, `audio-ready:${card.id}:${card.revision}`);
      delete playbackTickets.current[card.id];
    } catch { setAudioError("Playback could not be verified. Replay it before answering; no mastery was changed."); }
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
  if (!data) return <LearningStatePage mode={mode} title={mode === "review" ? "Preparing your review" : mode === "mistakes" ? "Loading your mistakes" : "Preparing today's plan"} text="Loading due items and restoring progress." loading />;
  const open = data.mistakes.filter((mistake) => mistake.status === "open");
  const corrected = data.mistakes
    .filter((mistake) => mistake.status === "resolved")
    .sort((a, b) => (b.resolvedAt ?? b.createdAt).localeCompare(a.resolvedAt ?? a.createdAt));
  const filteredOpen = open.filter((mistake) =>
    (!mistakeLevel || mistake.level === mistakeLevel)
    && (mistakeType === "all" || mistake.dimension === mistakeType)
    && (!mistakeAge || Date.now() - new Date(mistake.createdAt).getTime() <= mistakeAge * 86_400_000));
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
    const selectedReviewItems = currentTodayItems.map(({ item }) => item).filter((item) => item.kind === "review" && item.status === "pending");
    const selectedReviewCards = selectedReviewItems
      .map((item) => dueForToday.find((card) => card.id === item.reviewCardId || (!item.reviewCardId && card.contentId === item.contentId && card.dimension === item.dimension)))
      .filter((card): card is Card => Boolean(card));
    const orderedTodayItems = currentTodayItems.sort((a, b) => Number(b.index === firstReviewIndex) - Number(a.index === firstReviewIndex));
    const firstPending = orderedTodayItems.findIndex(({ item }) => item.status === "pending");
    return <Shell title="Today" active="Today" sub="Review → Learn → Listen/Practice → Summary">
      <section className="mb-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 p-5 text-white sm:p-7"><p className="text-sm font-semibold text-blue-300">Today&apos;s plan</p><h2 className="mt-1 text-2xl font-bold text-white">Choose a level and a realistic session</h2></div>
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
          <label className="font-semibold text-slate-950">Learning level<select aria-label="Learning level" className="mt-2 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-4" value={data.session.startLevel ?? 1} onChange={(event) => void configureToday(data.session.budgetMinutes ?? 30, Number(event.target.value))}>{Array.from({ length: 9 }, (_, index) => index + 1).map((level) => <option key={level} value={level}>{level >= 7 ? `HSK ${level} · Advanced 7–9 band` : `HSK ${level}`}</option>)}</select></label>
          <label className="font-semibold text-slate-950">Today&apos;s time budget<select aria-label="Today&apos;s time budget" className="mt-2 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-4" value={data.session.budgetMinutes ?? 30} onChange={(event) => void configureToday(Number(event.target.value))}>{[10, 15, 20, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label>
          <div className="rounded-2xl bg-blue-50 p-4 sm:col-span-2"><p><strong>{plannedTodayTasks.length} selected tasks · {data.session.totalEstimatedMinutes ?? 0} min planned</strong></p><p className="mt-1 text-sm text-slate-600">The queue is capped by your time budget. Missing audio or practice formats are skipped without blocking available work.</p></div>
          {deferredTodayItems.length > 0 && <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 sm:col-span-2" role="status"><strong>{deferredTodayItems.length} saved word{deferredTodayItems.length === 1 ? " is" : "s are"} waiting for room.</strong> Increase today&apos;s time budget to add {deferredTodayItems.length === 1 ? "it" : "them"} to the active queue.</p>}
          {data.capabilities.tier === "free" && <div className="account-note sm:col-span-2"><strong>Free remaining today:</strong> {Math.max(0, (data.capabilities.dailyNewItems ?? 0) - data.usage.dailyNewItems)} new items · {Math.max(0, (data.capabilities.dailyReviewGrades ?? 0) - data.usage.dailyReviewGrades)} successful SRS ratings. <Link className="inline-flex min-h-[44px] items-center" href="/pricing">Pro removes the Free daily learning and review limits.</Link></div>}
        </div>
      </section>
      {syncState !== "synced" && <div className={`step7-alert ${syncState === "failed" || syncState === "conflict" ? "error" : "warning"}`} role="status"><strong>Offline sync: {syncState.replaceAll("_", " ")}</strong><p>{syncState === "conflict" ? "Another device changed this learning record. The server copy was loaded; retry your pending action." : syncState === "failed" ? "Sync failed. Your pending action remains on this device." : "Your action is stored locally and will sync with the same operation key."}</p><button className="btn secondary" onClick={() => void retryPending()}>Retry sync</button></div>}
      {data.session.notice && <article className="mb-4 rounded-2xl bg-amber-50 p-5 text-amber-950" role="status"><span className="eyebrow">{data.session.notice.code.replaceAll("_", " ")}</span><h2>{data.session.notice.message}</h2><Link className="btn mt-3" href={data.session.notice.actionHref}>{data.session.notice.actionLabel}</Link></article>}
      <div className="grid gap-4">
        {orderedTodayItems.map(({ item, index }, displayIndex) => {
          const locked = item.status === "pending" && firstPending >= 0 && displayIndex > firstPending;
          if (item.kind === "review" && index !== firstReviewIndex) return null;
          if (item.kind === "review") return <article className={`card ${locked ? "opacity-60" : ""}`} key={item.id}>
            <span className="eyebrow">Scheduled review</span>
            <h2>{selectedReviewItems.length > 0 ? `${selectedReviewItems.length} item${selectedReviewItems.length === 1 ? "" : "s"} selected` : "Review complete"}</h2>
            <p>{selectedReviewItems.length > 0 ? `About ${selectedReviewItems.reduce((sum, entry) => sum + (entry.estimatedMinutes ?? 0), 0)} min estimated review in this plan · ${dueForToday.length} total due.` : "No memory checks fit this plan."}</p>
            {selectedReviewItems.length > 0 && <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p><strong className="text-slate-900">HSK mix:</strong> {[...new Set(selectedReviewCards.map((card) => card.level).filter((level): level is number => typeof level === "number"))].map((level) => `HSK ${level}`).join(", ") || "Saved items"}</p>
              <p><strong className="text-slate-900">Skill mix:</strong> {[...new Set(selectedReviewCards.map((card) => card.skill))].join(", ") || "Mixed review"}</p>
            </div>}
            {!locked && selectedReviewItems.length > 0 && <div className="mt-4"><Link className="btn" href={`/review?source=today&cap=${selectedReviewItems.length}&cards=${encodeURIComponent(selectedReviewCards.map((card) => card.id).join(","))}`}>Start selected plan</Link></div>}
          </article>;
          if (item.kind === "summary") return <article className="summary" key={item.id} aria-live="polite">
            <span className="eyebrow">Summary</span>
            <h2>{item.status === "completed" ? "Daily session complete" : "Finish the steps above"}</h2>
            <p>{plannedTodayTasks.filter((entry) => entry.status === "completed").length}/{plannedTodayTasks.length} learning steps complete · {open.length} open mistakes</p>
            <p><strong>Current streak: {data.streak.current} day{data.streak.current === 1 ? "" : "s"}</strong> · Longest {data.streak.longest} · {data.streakBasis}</p>
          </article>;
          return <article className={`card ${locked ? "opacity-60" : ""}`} key={item.id}>
            <span className="eyebrow">{item.dimension?.replace("_", " ") ?? item.kind}</span>
            <h2>{label(item)}</h2>
            <p>{item.status === "completed" ? "Completed" : item.status === "skipped" ? "Skipped · available to restore" : locked ? "Complete the previous step first." : "Ready to continue"} · {item.estimatedMinutes ?? 0} min</p>
            {!locked && item.status === "pending" && <div className="flex flex-wrap gap-2">{actionFor(item, complete, data.session.id)}<button className="btn secondary" onClick={() => void skip(item)}>Skip for today</button></div>}
            {item.status === "skipped" && <button className="btn secondary" onClick={() => void restore(item)}>Restore step</button>}
          </article>;
        })}
      </div>
      <Mastery values={data.mastery} scope={data.scope} />
    </Shell>;
  }

  if (mode === "mistakes") return <Shell title="Mistakes" active="Mistakes" sub="Correct wrong answers continuously; they leave this list only after a successful retry.">
    {open.length ? <>
      <section className="card mb-4" aria-label="Mistake filters"><h2>Filter corrections</h2><div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label>HSK level<select aria-label="Filter by HSK level" className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3" value={mistakeLevel} onChange={(event) => setMistakeLevel(Number(event.target.value))}><option value={0}>All levels</option>{Array.from({ length: 9 }, (_, index) => index + 1).map((level) => <option key={level} value={level}>HSK {level}</option>)}</select></label>
        <label>Question type<select aria-label="Filter by question type" className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3" value={mistakeType} onChange={(event) => setMistakeType(event.target.value as "all" | Dimension)}><option value="all">All types</option><option value="reading">Reading</option><option value="audio">Word listening</option><option value="context_audio">Context listening</option></select></label>
        <label>When added<select aria-label="Filter by error time" className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3" value={mistakeAge} onChange={(event) => setMistakeAge(Number(event.target.value))}><option value={0}>Any time</option><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option></select></label>
      </div><p className="mt-3 text-sm text-slate-600">Showing {filteredOpen.length} of {open.length} open mistakes.</p></section>
      {filteredOpen.length ? <div className="grid gap-4">{filteredOpen.map((mistake) => <article className="card" key={mistake.id}>
        <span className="eyebrow">Wrong answer · {mistake.dimension.replace("_", " ")}</span>
        <h2>{mistake.prompt}</h2>
        <p>{mistake.level ? `HSK ${mistake.level} · ` : ""}{mistake.skill} · Added {new Date(mistake.createdAt).toLocaleDateString()}</p>
        <p className="text-sm text-slate-600">Retry, check the answer, then continue to the next correction or return here.</p>
        <Link className="btn" href={`/review?source=mistakes&contentId=${encodeURIComponent(mistake.contentId)}${mistake.cardId ? `&cardId=${encodeURIComponent(mistake.cardId)}` : ""}`}>Correct this mistake</Link>
      </article>)}</div> : <State title="No mistakes match these filters" text="Change a level, question type, or error-time filter to see other corrections." />}
    </> : corrected.length ? <State title="All mistakes corrected" text="There are no open corrections. Your corrected history remains below as a record of completed work." /> : <State title="No mistake history yet" text="A wrong answer in Practice or Listening will appear here immediately with the original question and a real retry."><div className="flex flex-wrap gap-2"><Link className="btn" href="/practice">Start practice</Link><Link className="btn secondary" href="/listen">Start listening</Link></div></State>}
    {corrected.length > 0 && <section className="mt-5" aria-label="Corrected mistakes">
      <div className="mb-3"><span className="eyebrow">Correction history</span><h2>Corrected mistakes</h2><p className="text-slate-600">These records stay visible after a successful retry.</p></div>
      <div className="grid gap-3">{corrected.map((mistake) => <article className="card" key={mistake.id}>
        <span className="eyebrow">Corrected · {mistake.dimension.replace("_", " ")}</span>
        <h3 className="text-xl font-bold text-slate-950">{mistake.prompt}</h3>
        <p>{mistake.level ? `HSK ${mistake.level} · ` : ""}{mistake.skill}</p>
        <p className="text-sm text-emerald-700"><strong>Corrected on</strong> {new Date(mistake.resolvedAt ?? mistake.createdAt).toLocaleString()}</p>
      </article>)}</div>
    </section>}
    <Mastery values={data.mastery} scope={data.scope} />
  </Shell>;

  const due = data.capabilities.focusedReview ? data.focusedReview : data.cards.filter((card) => card.dueAt <= new Date().toISOString());
  const selectableDue = filterReviewCards(due, { difficultOnly });
  const composition = reviewComposition(selectableDue);
  const recommendedCount = recommendReviewCount(due);
  const reviewedSessionCards = (reviewIds ?? []).map((id) => data.cards.find((card) => card.id === id)).filter((card): card is Card => Boolean(card));
  const nextReviewAt = reviewedSessionCards.map((card) => card.dueAt).filter((dueAt) => new Date(dueAt).getTime() > Date.now()).sort()[0];
  const reviewPool = entryIntent.kind === "mistake" ? data.cards.filter((card) => card.isMistake && !ratedLegacyMistakeIds.includes(card.id)) : entryIntent.kind === "setup" ? data.cards : due;
  const plannedCards = reviewIds ? reviewIds.map((id) => reviewPool.find((card) => card.id === id)).filter((card): card is Card => Boolean(card)) : [];
  const activeCard = plannedCards[0];
  const activeFocusReason = data.focusedReview.find((card) => card.id === activeCard?.id)?.focusReason;
  const sessionTotal = reviewIds?.length ?? 0;
  const directEntryPreparing = !entryResolved || (entryIntent.kind !== "setup" && reviewIds === null);
  const directEntryEmpty = entryIntent.kind !== "setup" && reviewIds !== null && reviewIds.length === 0;
  const sessionComplete = Boolean(reviewIds?.length && (reviewedCount >= sessionTotal || !activeCard));
  const selectedText = activeCard?.choices.find((choice) => choice.key === selectedAnswer)?.text ?? reviewDraft;
  const currentAnswerCorrect = retryFeedback?.correct ?? false;
  const isMistakeRetry = Boolean(activeCard?.isMistake && !activeCard.legacyReview && activeCard.answerMode !== "self_recall");

  return <Shell title={entryIntent.kind === "mistake" ? "Mistake correction" : "Review"} active="Review" sub={entryIntent.kind === "mistake" ? "Correct the original wrong answer, understand it, and continue or return to Mistakes." : "Review due memories with a short, explained rating flow."} compact={Boolean(reviewIds?.length)}>
    <div className="mx-auto max-w-[880px]">
      {directEntryPreparing && <State title="Preparing your review" text="Loading the review items from where you started." />}
      {!reviewIds && entryResolved && entryIntent.kind === "setup" && due.length > 0 && <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 bg-slate-950 px-[24px] py-[24px] text-white sm:px-[32px] sm:py-[32px]">
          <p className="text-sm font-semibold text-blue-300">{data.capabilities.focusedReview ? "Focused Review · Pro" : "Review setup"}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Choose a focused session</h2>
          <p className="mt-3 max-w-2xl text-slate-300">{due.length} item{due.length === 1 ? " is" : "s are"} due. Mistakes come first, followed by scheduled memory checks across reading and listening.</p>
          <p className="mt-4 text-sm font-semibold text-blue-200">Recommended review: {recommendedCount} items from your due load and difficult-item history.</p>
        </div>
        <div className="p-[24px] sm:p-[32px]">
          <fieldset>
            <legend className="font-semibold text-slate-950">How long do you want to review?</legend>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {([5, 10, 20] as const).map((minutes) => <button type="button" key={minutes} onClick={() => setReviewMinutes(minutes)} aria-pressed={reviewMinutes === minutes} className={`min-h-[72px] rounded-2xl border px-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${reviewMinutes === minutes ? "border-blue-600 bg-blue-50 text-blue-950" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`}><strong className="block text-lg">{minutes} min</strong><span className="text-sm">Up to {Math.min(minutes, due.length)} item{Math.min(minutes, due.length) === 1 ? "" : "s"}</span></button>)}
            </div>
          </fieldset>
          <label className="mt-5 flex min-h-[48px] items-center gap-3 rounded-xl border border-slate-200 p-3"><input type="checkbox" checked={difficultOnly} onChange={(event) => setDifficultOnly(event.target.checked)} /><span><strong>Difficult items only</strong><small className="block text-slate-500">Open mistakes and cards below normal ease</small></span></label>
          <div aria-label="Review composition" className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3"><p><strong>Mistakes</strong><br />{composition.mistakes}</p><p><strong>Reading</strong><br />{composition.reading}</p><p><strong>Listening</strong><br />{composition.listening}</p></div>
          <details className="mt-4 rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-semibold">How to rate your memory</summary><p className="mt-2 text-sm text-slate-600">Choose Forgot if you could not recall it, Difficult if recall was slow or uncertain, Remembered if correct with normal effort, and Easy only when recall was immediate. Your choice schedules the next review.</p></details>
          {selectableDue.length > 0 ? <button className="mt-6 min-h-[48px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" onClick={() => { setReviewIds(buildReviewQueue(selectableDue, reviewMinutes).map((card) => card.id)); setReviewedCount(0); setRatedLegacyMistakeIds([]); }}>Start review · {Math.min(reviewMinutes, selectableDue.length)} items</button> : <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="status">No difficult items are due. Turn off “Difficult items only” to review the full due queue.</p>}
          {data.capabilities.tier === "free" && <p className="mt-4 text-sm text-slate-500"><strong>Free remaining today:</strong> {Math.max(0, (data.capabilities.dailyReviewGrades ?? 0) - data.usage.dailyReviewGrades)} successful SRS ratings. <Link className="font-semibold text-blue-700 underline-offset-4 hover:underline" href="/pricing">Pro removes the Free daily learning and review limits and prioritizes unresolved mistakes.</Link></p>}
        </div>
      </div>}

      {reviewIds && !sessionComplete && activeCard && <div aria-live="polite">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-sm font-semibold text-slate-500">Review progress</p><p className="mt-1 text-lg font-bold text-slate-950">{reviewedCount + 1} of {sessionTotal}</p></div>
          <p className="text-sm text-slate-500">{Math.max(0, sessionTotal - reviewedCount - 1)} after this</p>
        </div>
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600 transition-[width]" style={{ width: `${Math.min(100, reviewedCount / sessionTotal * 100)}%` }} /></div>
        <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-[24px] py-[16px] sm:px-[32px]">
            <p className="text-sm font-bold text-slate-700">{isMistakeRetry ? "Mistake retry" : "Memory review"} · {activeCard.level ? `HSK ${activeCard.levelBand}` : "Older saved item"} · {activeCard.skill}</p>
            <div className="flex flex-wrap items-center gap-2">{data.capabilities.focusedReview && activeFocusReason && <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">Focused Review · Pro · {activeFocusReason === "open_mistake" ? "Open mistake prioritized" : "Due memory prioritized"}</span>}{activeCard.topic && <p className="text-sm text-slate-500">{activeCard.topic}</p>}</div>
          </div>
          <div className="p-[24px] sm:p-[32px]">
            <div className="mb-6 border-l-4 border-blue-600 pl-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Why this is here</p><p className="mt-1 text-sm text-slate-600">{activeCard.reviewReason}</p><p className="mt-2 text-sm font-semibold text-blue-800">Review tip: {reviewTip(activeCard)}</p><p className="mt-1 text-xs text-slate-500">Current schedule: {new Date(activeCard.dueAt).toLocaleString()}</p></div>
            {activeCard.instruction && <p className="mb-4 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-950">{activeCard.instruction}</p>}
            {activeCard.context && <p className="mb-5 rounded-2xl bg-slate-50 p-5 text-lg leading-8 text-slate-900" lang="zh-Hans">{activeCard.context}</p>}
            <h2 className="text-2xl font-bold leading-snug tracking-tight text-slate-950 sm:text-3xl">{activeCard.prompt}</h2>
            {activeCard.audioSrc && <div className="mt-5"><p className="mb-2 text-sm font-semibold text-slate-700">Original recording</p><audio controls preload="metadata" src={activeCard.audioSrc} className="w-full max-w-full" onPlay={() => void startFormalPlayback(activeCard)} onEnded={() => void completeFormalPlayback(activeCard)} /></div>}
            {!activeCard.audioSrc && activeCard.dimension !== "reading" && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">The original recording is not available for this older item. It cannot be treated as a full listening retry.</p>}
            {!activeCard.playbackReady && activeCard.playbackRequired && <p className="mt-3 text-sm font-semibold text-amber-700">Finish audio playback before answering.</p>}

            {isMistakeRetry && !answerChecked ? <div className="mt-7">
              {activeCard.answerMode === "choice" ? <fieldset><legend className="font-bold text-slate-950">Choose an answer</legend><div className="mt-3 grid gap-3">{activeCard.choices.map((choice) => <label key={choice.key} className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${selectedAnswer === choice.key ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-400"}`}><input type="radio" name={`review-${activeCard.id}`} value={choice.key} checked={selectedAnswer === choice.key} onChange={() => setSelectedAnswer(choice.key)} /><span><strong className="mr-2">{choice.key}.</strong>{choice.text}</span></label>)}</div></fieldset> : <><label className="font-bold text-slate-950" htmlFor={`review-answer-${activeCard.id}`}>Type your answer</label><textarea id={`review-answer-${activeCard.id}`} maxLength={180} value={reviewDraft} onChange={(event) => setReviewDraft(event.target.value)} className="mt-3 min-h-[112px] w-full rounded-xl border border-slate-300 p-4 text-base focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100" /></>}
              <button disabled={!(activeCard.answerMode === "choice" ? selectedAnswer : reviewDraft.trim()) || !activeCard.playbackReady || reviewSaving} onClick={() => void submitRetry(activeCard)} className="mt-5 min-h-[48px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">{reviewSaving ? "Checking…" : "Check answer"}</button>
            </div> : !revealed[activeCard.id] && !answerChecked ? <div className="mt-7">{activeCard.legacyReview && <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">This older saved item has no complete original question. It is available only as a memory prompt and will not be presented as a real mistake retry.</p>}<p className="mb-3 text-sm text-slate-600">Think of the answer before revealing it. There is no answer field in this memory review.</p><button className="min-h-[48px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" disabled={!activeCard.playbackReady} onClick={() => setRevealed((current) => ({ ...current, [activeCard.id]: true }))}>Reveal answer</button></div> : null}

            {(revealed[activeCard.id] || answerChecked) && <div className="mt-7" aria-live="polite">
              {answerChecked && <div className={`rounded-2xl border p-4 ${currentAnswerCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-rose-200 bg-rose-50 text-rose-950"}`}><p className="font-bold">{currentAnswerCorrect ? "Correct this time" : "Not yet — review the difference"}</p><p className="mt-1"><strong>Your answer this time:</strong> {selectedText}</p></div>}
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
              {isMistakeRetry && answerChecked ? <button disabled={reviewSaving} onClick={() => continueAfterRetry(activeCard)} className="mt-5 min-h-[48px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">Continue</button> : <div className="mt-5"><p className="font-bold text-slate-950">How well did you remember it before revealing?</p><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{reviewGradeOptions(activeCard.ease, activeCard.intervalDays).map((option) => <button disabled={reviewSaving} key={option.grade} onClick={() => void grade(activeCard, option.grade)} className="min-h-[76px] rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-blue-500 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"><strong className="block text-slate-950">{option.label}</strong><span className="mt-1 block text-xs text-slate-500">{option.hint}</span></button>)}</div></div>}
            </div>}
          </div>
        </article>
        {lastRatedCardId && data.canUndoReview && <button className="mt-4 min-h-[48px] px-2 text-sm font-semibold text-slate-600 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" onClick={() => void undoLastRating()}>Undo last rating</button>}
      </div>}

      {sessionComplete && <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-6 text-emerald-950 sm:p-9" aria-live="polite">
        <p className="text-sm font-bold text-emerald-800">Review report · Session complete</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">You reviewed {reviewedCount} item{reviewedCount === 1 ? "" : "s"}.</h2>
        <p className="mt-3 max-w-xl text-emerald-900">This report uses the {reviewedCount} answers and memory ratings saved in this session.</p>
        <div className="mt-5 grid gap-3 rounded-2xl bg-white/70 p-4 sm:grid-cols-3"><p><strong>Reviewed</strong><br />{reviewedCount}</p><p><strong>Open mistakes now</strong><br />{open.length}</p><p><strong>Next review</strong><br />{nextReviewAt ? new Date(nextReviewAt).toLocaleString() : "Nothing scheduled"}</p></div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">{entryIntent.kind === "mistake" && open.length > 0 && <Link href="/mistakes" className="min-h-[48px] rounded-xl bg-blue-600 px-5 py-3 text-center font-bold text-white">Continue correcting</Link>}<Link href="/today" className="min-h-[48px] rounded-xl bg-emerald-900 px-5 py-3 text-center font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">Back to Today</Link><Link href="/mistakes" className="min-h-[48px] rounded-xl border border-emerald-800 px-5 py-3 text-center font-bold text-emerald-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">Back to Mistakes</Link><Link href="/practice" className="min-h-[48px] rounded-xl border border-emerald-800 px-5 py-3 text-center font-bold text-emerald-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">Continue practice</Link></div>
        {lastRatedCardId && data.canUndoReview && <button className="mt-4 min-h-[48px] text-sm font-semibold underline underline-offset-4" onClick={() => void undoLastRating()}>Undo last rating</button>}
      </div>}

      {directEntryEmpty && <State title={entryIntent.kind === "mistake" ? "This mistake is no longer open" : "You're caught up"} text={entryIntent.kind === "mistake" ? "It may already have been resolved or is no longer available for review." : "There are no reviews due in today's queue."}><Link className="btn" href={entryIntent.kind === "mistake" ? "/mistakes" : "/today"}>{entryIntent.kind === "mistake" ? "Back to Mistakes" : "Back to Today"}</Link></State>}
      {entryResolved && entryIntent.kind === "setup" && reviewIds === null && due.length === 0 && data.cards.length > 0 && <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 bg-slate-950 px-6 py-6 text-white sm:px-8"><p className="text-sm font-semibold text-blue-300">Schedule clear</p><h2 className="mt-2 text-3xl font-bold text-white">Upcoming reviews</h2><p className="mt-2 text-slate-300">Nothing is due now. You can inspect the schedule or complete one real review early here.</p></div>
        <div className="p-6 sm:p-8"><div className="grid gap-3">{[...data.cards].sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 3).map((card) => <article className="rounded-2xl border border-slate-200 p-4" key={card.id}><p className="font-bold text-slate-950">{card.prompt}</p><p className="mt-1 text-sm text-slate-600">{card.skill} · Scheduled {new Date(card.dueAt).toLocaleString()}</p></article>)}</div><button className="mt-5 min-h-[48px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" onClick={() => { setReviewIds([[...data.cards].sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0].id]); setReviewedCount(0); setRatedLegacyMistakeIds([]); }}>Review one early</button></div>
      </section>}
      {entryResolved && entryIntent.kind === "setup" && reviewIds === null && due.length === 0 && data.cards.length === 0 && <State title="No review history yet" text="A completed Practice or Listening answer creates your first scheduled memory card. Wrong answers become due immediately."><div className="flex flex-wrap gap-2"><Link className="btn" href="/practice">Start practice</Link><Link className="btn secondary" href="/listen">Start listening</Link></div></State>}
      {audioError && <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">{audioError}</p>}
    </div>
  </Shell>;
}

function label(item: Item) {
  return item.title ?? (item.kind === "learn" ? "Learn new vocabulary" : item.kind === "listen" ? (item.dimension === "audio" ? "Word listening" : "Listening in context") : item.kind === "practice" ? "Vocabulary practice" : `Review ${item.dimension?.replace("_", " ") ?? "item"}`);
}
function actionFor(item: Item, complete: (item: Item) => Promise<void>, dailySessionId: string) {
  if (item.kind === "review") return <Link className="btn" href="/review?source=today">Start today&apos;s review</Link>;
  if (item.kind === "learn") return <div className="flex flex-wrap gap-2"><Link className="btn" href={item.href ?? "/levels"}>Open word list</Link><button className="btn secondary" onClick={() => complete(item)}>Mark learned</button></div>;
  if (item.kind === "listen") {
    const href = item.href ?? "/listen";
    const separator = href.includes("?") ? "&" : "?";
    return <Link className="btn" href={`${href}${separator}dailySessionId=${encodeURIComponent(dailySessionId)}&dailyItemId=${encodeURIComponent(item.id)}`}>Start listening</Link>;
  }
  if (item.kind === "practice") {
    const href = item.href ?? "/practice";
    const separator = href.includes("?") ? "&" : "?";
    return <Link className="btn" href={`${href}${separator}dailySessionId=${encodeURIComponent(dailySessionId)}&dailyItemId=${encodeURIComponent(item.id)}`}>Start practice</Link>;
  }
  return null;
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
