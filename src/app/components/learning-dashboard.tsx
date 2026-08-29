"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { buildReviewQueue, reviewGradeOptions, type ReviewGrade } from "../../lib/learning/review-session";

type Dimension = "reading" | "audio" | "context_audio";
type Item = { id: string; kind: "review" | "learn" | "listen" | "practice" | "summary"; contentId: string; contentVersion?: string; status: "pending" | "completed" | "skipped"; dimension?: Dimension; title?: string; href?: string; estimatedMinutes?: number };
type Notice = { code: string; message: string; actionHref: string; actionLabel: string };
type Card = { id: string; contentId: string; dimension: Dimension; dueAt: string; revision: number; prompt: string; correctAnswer: string; userAnswer: string; priorAnswerLabel: string; choices: Array<{ key: string; text: string }>; isMistake: boolean; reviewReason: string; explanation: string; level: number; skill: string; intervalDays: number; ease: number; reviewCount: number; audioText?: string; assetId?: string; playbackReady: boolean };
type Mistake = { id: string; contentId: string; status: string; createdAt: string; dimension: Dimension; prompt: string };
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
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [audioError, setAudioError] = useState("");
  const [reviewMinutes, setReviewMinutes] = useState<5 | 10 | 20>(10);
  const [reviewIds, setReviewIds] = useState<string[] | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answerChecked, setAnswerChecked] = useState(false);
  const [lastRatedCardId, setLastRatedCardId] = useState<string | null>(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [syncState, setSyncState] = useState<"synced" | "local_pending" | "syncing" | "conflict" | "failed">("synced");
  const operationKeys = useRef<Record<string, string>>({});
  const dataRef = useRef<Data | null>(null);

  async function load() {
    setError("");
    try {
      const response = await fetch(`/api/v1/learning?tzOffset=${tz()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("SYNC_FAILED");
      const loaded = await response.json();
      dataRef.current = loaded;
      setData(loaded);
      if (pendingQueue(loaded.queueBinding).length) void retryPending(loaded);
      else setSyncState("synced");
    } catch {
      setError("We couldn't sync your learning data. Check your connection and try again.");
    }
  }
  // The initial restore intentionally runs once; retries use the latest data through dataRef.
  useEffect(() => {
    void load();
    const online = () => { void retryPending(dataRef.current); };
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function post(action: string, payload: Record<string, unknown>, operation: string) {
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
      dataRef.current = result;
      setData(result);
      setSyncState("synced");
      return true;
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
        setAnswerChecked(false);
        setReviewedCount((count) => count + 1);
        setLastRatedCardId(card.id);
      }
    } finally {
      setReviewSaving(false);
    }
  }
  async function undoLastRating() {
    if (!lastRatedCardId || !data?.canUndoReview || reviewSaving) return;
    setReviewSaving(true);
    try {
      if (await post("undo_review", { cardId: lastRatedCardId }, `undo-review:${lastRatedCardId}`)) {
        setReviewedCount((count) => Math.max(0, count - 1));
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
  async function setBudget(minutes: number) { await post("configure_today", { budgetMinutes: minutes }, `budget:${data!.session.id}:${minutes}`); }
  async function play(card: Card) {
    setAudioError("");
    if (!card.audioText || !("speechSynthesis" in window)) { setAudioError("Audio is unavailable in this browser. No mastery was changed."); return; }
    let ticket: { playbackTicket?: string; notBefore?: string };
    try {
      const started = await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "audio_review_playback_start", payload: { idempotencyKey: crypto.randomUUID(), cardId: card.id, cardRevision: card.revision }, tzOffset: tz(), queueBinding: data?.queueBinding }) });
      if (!started.ok) throw new Error("START_FAILED");
      ticket = await started.json();
      if (!ticket.playbackTicket) throw new Error("NO_TICKET");
    } catch {
      setAudioError("Playback verification could not start. No mastery was changed.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(card.audioText);
    utterance.lang = "zh-CN";
    utterance.onend = async () => {
      try {
        const remaining = Math.max(0, (ticket.notBefore ? new Date(ticket.notBefore).getTime() : Date.now()) - Date.now());
        if (remaining) await new Promise((resolve) => window.setTimeout(resolve, remaining));
        const completed = await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "audio_review_playback_complete", payload: { idempotencyKey: crypto.randomUUID(), cardId: card.id, cardRevision: card.revision, playbackTicket: ticket.playbackTicket }, tzOffset: tz(), queueBinding: data?.queueBinding }) });
        if (!completed.ok) throw new Error("COMPLETE_FAILED");
        await post("audio_review_ready", { cardId: card.id, cardRevision: card.revision, playbackTicket: ticket.playbackTicket }, `audio-ready:${card.id}:${card.revision}`);
      } catch { setAudioError("Playback could not be verified. Replay it before grading; no mastery was changed."); }
    };
    utterance.onerror = () => setAudioError("Audio failed. No mastery was changed.");
    window.speechSynthesis.speak(utterance);
  }

  if (error) return <State title={error.startsWith("Free daily") ? "Daily limit reached" : "Sync paused"} text={error}>{error.startsWith("Free daily") ? <Link href="/pricing" className="btn">Compare Pro</Link> : <button onClick={load} className="btn">Try again</button>}</State>;
  if (!data) return <State title="Loading your learning plan…" text="Restoring your latest progress." />;
  const open = data.mistakes.filter((mistake) => mistake.status === "open");

  if (mode === "today") {
    const firstPending = data.session.items.findIndex((item) => item.status === "pending");
    return <Shell title="Today" sub="Review → Learn → Listen/Practice → Summary">
      <section className="card mb-4"><div className="flex flex-wrap items-end justify-between gap-3"><label>Today&apos;s time budget<select value={data.session.budgetMinutes ?? 30} onChange={(event) => void setBudget(Number(event.target.value))}>{[10, 15, 20, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label><p><strong>{data.session.totalEstimatedMinutes ?? 0} min planned</strong> · version today-v4</p></div>{data.capabilities.tier === "free" && <p className="account-note">Free daily usage: {data.usage.dailyNewItems}/{data.capabilities.dailyNewItems} new items · {data.usage.dailyReviewGrades}/{data.capabilities.dailyReviewGrades} successful SRS ratings. <Link href="/pricing">Compare Pro</Link></p>}</section>
      {syncState !== "synced" && <div className={`step7-alert ${syncState === "failed" || syncState === "conflict" ? "error" : "warning"}`} role="status"><strong>Offline sync: {syncState.replaceAll("_", " ")}</strong><p>{syncState === "conflict" ? "Another device changed this learning record. The server copy was loaded; retry your pending action." : syncState === "failed" ? "Sync failed. Your pending action remains on this device." : "Your action is stored locally and will sync with the same operation key."}</p><button className="btn secondary" onClick={() => void retryPending()}>Retry sync</button></div>}
      {data.session.notice && <article className="mb-4 rounded-2xl bg-amber-50 p-5 text-amber-950" role="status"><span className="eyebrow">{data.session.notice.code.replaceAll("_", " ")}</span><h2>{data.session.notice.message}</h2><Link className="btn mt-3" href={data.session.notice.actionHref}>{data.session.notice.actionLabel}</Link></article>}
      <div className="grid gap-4">
        {data.session.items.map((item, index) => {
          const locked = item.status === "pending" && firstPending >= 0 && index > firstPending;
          if (item.kind === "summary") return <article className="summary" key={item.id} aria-live="polite">
            <span className="eyebrow">Summary</span>
            <h2>{item.status === "completed" ? "Daily session complete" : "Finish the steps above"}</h2>
            <p>{data.session.items.filter((entry) => entry.kind !== "summary" && entry.status === "completed").length}/{data.session.items.filter((entry) => entry.kind !== "summary").length} learning steps complete · {open.length} open mistakes</p>
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

  if (mode === "mistakes") return <Shell title="Mistakes" sub="Wrong reading and listening attempts stay here until Review resolves them.">
    {open.length ? <div className="grid gap-4">{open.map((mistake) => <article className="card" key={mistake.id}>
      <span className="eyebrow">{mistake.dimension.replace("_", " ")}</span>
      <h2>{mistake.prompt}</h2>
      <p>Added {new Date(mistake.createdAt).toLocaleDateString()}</p>
      <Link className="btn" href="/review">Review now</Link>
    </article>)}</div> : <State title="No open mistakes" text="Practice and listening mistakes will appear here automatically."><Link className="btn" href="/listen">Start listening</Link></State>}
    <Mastery values={data.mastery} scope={data.scope} />
  </Shell>;

  const due = data.capabilities.focusedReview ? data.focusedReview : data.cards.filter((card) => card.dueAt <= new Date().toISOString());
  const plannedCards = reviewIds ? reviewIds.map((id) => due.find((card) => card.id === id)).filter((card): card is Card => Boolean(card)) : [];
  const activeCard = plannedCards[0];
  const sessionTotal = reviewIds?.length ?? 0;
  const sessionComplete = Boolean(reviewIds && (reviewedCount >= sessionTotal || !activeCard));
  const selectedText = activeCard?.choices.find((choice) => choice.key === selectedAnswer)?.text ?? "";
  const currentAnswerCorrect = Boolean(selectedText && selectedText === activeCard?.correctAnswer);

  return <Shell title="Review" sub="A short memory session that shows one due item at a time.">
    <div className="mx-auto max-w-[880px]">
      {!reviewIds && due.length > 0 && <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 bg-slate-950 px-[24px] py-[24px] text-white sm:px-[32px] sm:py-[32px]">
          <p className="text-sm font-semibold text-blue-300">Review setup</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Choose a focused session</h2>
          <p className="mt-3 max-w-2xl text-slate-300">{due.length} item{due.length === 1 ? " is" : "s are"} due. Mistakes come first, followed by scheduled memory checks across reading and listening.</p>
        </div>
        <div className="p-[24px] sm:p-[32px]">
          <fieldset>
            <legend className="font-semibold text-slate-950">How long do you want to review?</legend>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {([5, 10, 20] as const).map((minutes) => <button type="button" key={minutes} onClick={() => setReviewMinutes(minutes)} aria-pressed={reviewMinutes === minutes} className={`min-h-[72px] rounded-2xl border px-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${reviewMinutes === minutes ? "border-blue-600 bg-blue-50 text-blue-950" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`}><strong className="block text-lg">{minutes} min</strong><span className="text-sm">Up to {Math.min(minutes, due.length)} item{Math.min(minutes, due.length) === 1 ? "" : "s"}</span></button>)}
            </div>
          </fieldset>
          <button className="mt-6 min-h-[48px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" onClick={() => { setReviewIds(buildReviewQueue(due, reviewMinutes).map((card) => card.id)); setReviewedCount(0); }}>Start review</button>
          {data.capabilities.tier === "free" && <p className="mt-4 text-sm text-slate-500">{data.usage.dailyReviewGrades} of {data.capabilities.dailyReviewGrades} daily reviews used. <Link className="font-semibold text-blue-700 underline-offset-4 hover:underline" href="/pricing">Compare Pro</Link></p>}
        </div>
      </div>}

      {reviewIds && !sessionComplete && activeCard && <div aria-live="polite">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-sm font-semibold text-slate-500">Review progress</p><p className="mt-1 text-lg font-bold text-slate-950">{reviewedCount + 1} of {sessionTotal}</p></div>
          <p className="text-sm text-slate-500">{Math.max(0, sessionTotal - reviewedCount)} remaining</p>
        </div>
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600 transition-[width]" style={{ width: `${Math.min(100, reviewedCount / sessionTotal * 100)}%` }} /></div>
        <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-[24px] py-[16px] sm:px-[32px]">
            <p className="text-sm font-bold text-slate-700">HSK {activeCard.level} · {activeCard.skill}</p>
            <p className="text-sm text-slate-500">{activeCard.dimension.replace("_", " ")}</p>
          </div>
          <div className="p-[24px] sm:p-[32px]">
            <div className="mb-6 border-l-4 border-blue-600 pl-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Why this is here</p><p className="mt-1 text-sm text-slate-600">{activeCard.reviewReason}</p></div>
            <h2 className="text-2xl font-bold leading-snug tracking-tight text-slate-950 sm:text-3xl">{activeCard.prompt}</h2>
            {activeCard.audioText && <button className="mt-5 min-h-[48px] rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" onClick={() => play(activeCard)}>Play audio</button>}
            {!activeCard.playbackReady && activeCard.dimension !== "reading" && <p className="mt-3 text-sm font-semibold text-amber-700">Finish audio playback before answering.</p>}

            {activeCard.isMistake && activeCard.choices.length > 0 && !answerChecked ? <div className="mt-7">
              <p className="font-bold text-slate-950">Choose an answer</p>
              <div className="mt-3 grid gap-3">{activeCard.choices.map((choice) => <label key={choice.key} className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${selectedAnswer === choice.key ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-400"}`}><input type="radio" name={`review-${activeCard.id}`} value={choice.key} checked={selectedAnswer === choice.key} onChange={() => setSelectedAnswer(choice.key)} /><span><strong className="mr-2">{choice.key}.</strong>{choice.text}</span></label>)}</div>
              <button disabled={!selectedAnswer || !activeCard.playbackReady} onClick={() => setAnswerChecked(true)} className="mt-5 min-h-[48px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">Check answer</button>
            </div> : !revealed[activeCard.id] && !answerChecked ? <button className="mt-7 min-h-[48px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" disabled={!activeCard.playbackReady} onClick={() => setRevealed((current) => ({ ...current, [activeCard.id]: true }))}>Reveal answer</button> : null}

            {(revealed[activeCard.id] || answerChecked) && <div className="mt-7" aria-live="polite">
              {answerChecked && <div className={`rounded-2xl border p-4 ${currentAnswerCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-rose-200 bg-rose-50 text-rose-950"}`}><p className="font-bold">{currentAnswerCorrect ? "Correct this time" : "Not yet — review the difference"}</p><p className="mt-1"><strong>Your current answer:</strong> {selectedText}</p></div>}
              <div className="mt-4 rounded-2xl bg-slate-50 p-[20px] text-slate-800">
                <p><strong>Correct answer:</strong> {activeCard.correctAnswer}</p>
                <p className="mt-2 text-sm"><strong>{activeCard.priorAnswerLabel}:</strong> {activeCard.userAnswer || "No answer"}</p>
                <p className="mt-3 text-sm text-slate-600">{activeCard.explanation}</p>
</div>
              {activeCard.isMistake && answerChecked ? <button disabled={reviewSaving} onClick={() => void grade(activeCard, currentAnswerCorrect ? "good" : "again")} className="mt-5 min-h-[48px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">{reviewSaving ? "Saving…" : "Continue"}</button> : <div className="mt-5"><p className="font-bold text-slate-950">How well did you remember it now?</p><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{reviewGradeOptions(activeCard.ease, activeCard.intervalDays).map((option) => <button disabled={reviewSaving} key={option.grade} onClick={() => void grade(activeCard, option.grade)} className="min-h-[76px] rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-blue-500 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"><strong className="block text-slate-950">{option.label}</strong><span className="mt-1 block text-xs text-slate-500">{option.hint}</span></button>)}</div></div>}
            </div>}
          </div>
        </article>
        {lastRatedCardId && data.canUndoReview && <button className="mt-4 min-h-[48px] px-2 text-sm font-semibold text-slate-600 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" onClick={() => void undoLastRating()}>Undo last rating</button>}
      </div>}

      {sessionComplete && <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-6 text-emerald-950 sm:p-9" aria-live="polite">
        <p className="text-sm font-bold text-emerald-800">Session complete</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">You reviewed {reviewedCount} item{reviewedCount === 1 ? "" : "s"}.</h2>
        <p className="mt-3 max-w-xl text-emerald-900">Your next review dates are scheduled from the answers and memory ratings you just gave.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row"><Link href="/today" className="min-h-[48px] rounded-xl bg-emerald-900 px-5 py-3 text-center font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">Back to Today</Link><Link href="/practice" className="min-h-[48px] rounded-xl border border-emerald-800 px-5 py-3 text-center font-bold text-emerald-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">Continue practice</Link></div>
        {lastRatedCardId && data.canUndoReview && <button className="mt-4 min-h-[48px] text-sm font-semibold underline underline-offset-4" onClick={() => void undoLastRating()}>Undo last rating</button>}
      </div>}

      {!reviewIds && due.length === 0 && <State title="You're caught up" text="There are no reviews due right now."><Link className="btn" href="/today">Back to Today</Link></State>}
      {audioError && <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">{audioError}</p>}
    </div>
  </Shell>;
}

function label(item: Item) {
  return item.title ?? (item.kind === "learn" ? "Learn new vocabulary" : item.kind === "listen" ? (item.dimension === "audio" ? "Word listening" : "Listening in context") : item.kind === "practice" ? "Vocabulary practice" : `Review ${item.dimension?.replace("_", " ") ?? "item"}`);
}
function actionFor(item: Item, complete: (item: Item) => Promise<void>, dailySessionId: string) {
  if (item.kind === "review") return <Link className="btn" href="/review">Start review</Link>;
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
function Shell(props: { title: string; sub: string; children: ReactNode }) {
  return <main className="learn"><header><span className="eyebrow">HSKKit learning loop</span><h1>{props.title}</h1><p>{props.sub}</p><nav><Link href="/today">Today</Link><Link href="/review">Review</Link><Link href="/mistakes">Mistakes</Link><Link href="/listen">Listen</Link></nav></header>{props.children}</main>;
}
function State(props: { title: string; text: string; children?: ReactNode }) { return <div className="state"><h2>{props.title}</h2><p>{props.text}</p>{props.children}</div>; }
function Mastery({ values, scope }: { values: Record<Dimension, number>; scope: Data["scope"] }) {
  return <section className="summary"><h2>Mastery</h2><p>Reading {values.reading} · Audio {values.audio} · Context audio {values.context_audio}</p><p>{scope === "account" ? "Saved to your private account learning record and available across synced devices." : "Saved for this guest browser; sign in to merge it explicitly into your account."}</p></section>;
}
