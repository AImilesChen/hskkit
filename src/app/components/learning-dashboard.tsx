"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Dimension = "reading" | "audio" | "context_audio";
type Item = { id: string; kind: "review" | "learn" | "listen" | "practice" | "summary"; contentId: string; contentVersion?: string; status: "pending" | "completed" | "skipped"; dimension?: Dimension; title?: string; href?: string; estimatedMinutes?: number };
type Notice = { code: string; message: string; actionHref: string; actionLabel: string };
type Card = { id: string; contentId: string; dimension: Dimension; dueAt: string; revision: number; prompt: string; correctAnswer: string; userAnswer: string; audioText?: string; assetId?: string; playbackReady: boolean };
type Mistake = { id: string; contentId: string; status: string; createdAt: string; dimension: Dimension; prompt: string };
type Data = {
  session: { id: string; startLevel?: number; contentReleaseId?: string; notice?: Notice; budgetMinutes?: number; totalEstimatedMinutes?: number; items: Item[] };
  cards: Card[];
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
  useEffect(() => {
    void load();
    const online = () => { void retryPending(dataRef.current); };
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
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
  async function grade(card: Card, gradeName: string) {
    if (await post("grade", { cardId: card.id, grade: gradeName, clientRevision: card.revision }, `grade:${card.id}:${gradeName}`)) {
      setRevealed((current) => ({ ...current, [card.id]: false }));
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

  if (error) return <State title="Sync paused" text={error}><button onClick={load} className="btn">Try again</button></State>;
  if (!data) return <State title="Loading your learning plan…" text="Restoring your latest progress." />;
  const open = data.mistakes.filter((mistake) => mistake.status === "open");

  if (mode === "today") {
    const firstPending = data.session.items.findIndex((item) => item.status === "pending");
    return <Shell title="Today" sub="Review → Learn → Listen/Practice → Summary">
      <section className="card mb-4"><div className="flex flex-wrap items-end justify-between gap-3"><label>Today's time budget<select value={data.session.budgetMinutes ?? 30} onChange={(event) => void setBudget(Number(event.target.value))}>{[10, 15, 20, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label><p><strong>{data.session.totalEstimatedMinutes ?? 0} min planned</strong> · version today-v4</p></div></section>
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

  const due = data.cards.filter((card) => card.dueAt <= new Date().toISOString());
  return <Shell title="Review" sub="Recall first, reveal the answer, then rate honestly.">
    {audioError && <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">{audioError}</p>}
    {due.length ? <div className="grid gap-4">{due.map((card) => <article className="card" key={card.id}>
      <span className="eyebrow">{card.dimension.replace("_", " ")} · Due now</span>
      <h2>{card.prompt}</h2>
      {card.audioText && <button className="btn secondary mb-3" onClick={() => play(card)}>Play audio</button>}
      {!card.playbackReady && card.dimension !== "reading" && <p className="mb-3 text-sm font-semibold text-amber-700">Finish audio playback to unlock this review.</p>}
      {!revealed[card.id] ? <button className="btn" disabled={!card.playbackReady} onClick={() => setRevealed((current) => ({ ...current, [card.id]: true }))}>Reveal answer</button> : <>
        <div className="mb-4 rounded-xl bg-[#F8FAFC] p-4"><p><strong>Your answer:</strong> {card.userAnswer || "No answer"}</p><p><strong>Correct answer:</strong> {card.correctAnswer}</p></div>
        <div className="flex flex-wrap gap-2">{["again", "hard", "good", "easy"].map((gradeName) => <button className="btn secondary" key={gradeName} onClick={() => grade(card, gradeName)}>{gradeName}</button>)}</div>
      </>}
    </article>)}</div> : <State title="You're caught up" text="There are no reviews due right now."><Link className="btn" href="/today">Back to Today</Link></State>}
    <Mastery values={data.mastery} scope={data.scope} />
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
function Shell(props: any) {
  return <main className="learn"><header><span className="eyebrow">HSKKit learning loop</span><h1>{props.title}</h1><p>{props.sub}</p><nav><Link href="/today">Today</Link><Link href="/review">Review</Link><Link href="/mistakes">Mistakes</Link><Link href="/listen">Listen</Link></nav></header>{props.children}</main>;
}
function State(props: any) { return <div className="state"><h2>{props.title}</h2><p>{props.text}</p>{props.children}</div>; }
function Mastery({ values, scope }: { values: Record<Dimension, number>; scope: Data["scope"] }) {
  return <section className="summary"><h2>Mastery</h2><p>Reading {values.reading} · Audio {values.audio} · Context audio {values.context_audio}</p><p>{scope === "account" ? "Saved to your private account learning record and available across synced devices." : "Saved for this guest browser; sign in to merge it explicitly into your account."}</p></section>;
}
