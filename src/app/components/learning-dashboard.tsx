"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Dimension = "reading" | "audio" | "context_audio";
type Item = { id: string; kind: "review" | "learn" | "listen" | "practice" | "summary"; contentId: string; status: string; dimension?: Dimension };
type Card = { id: string; contentId: string; dimension: Dimension; dueAt: string; revision: number; prompt: string; correctAnswer: string; userAnswer: string; audioText?: string; assetId?: string; playbackReady: boolean };
type Mistake = { id: string; contentId: string; status: string; createdAt: string; dimension: Dimension; prompt: string };
type Data = {
  session: { id: string; items: Item[] };
  cards: Card[];
  mistakes: Mistake[];
  mastery: Record<Dimension, number>;
};
const tz = () => new Date().getTimezoneOffset();

export default function LearningDashboard({ mode }: { mode: "today" | "review" | "mistakes" }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [audioError, setAudioError] = useState("");
  const operationKeys = useRef<Record<string, string>>({});

  async function load() {
    setError("");
    try {
      const response = await fetch(`/api/v1/learning?tzOffset=${tz()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("SYNC_FAILED");
      setData(await response.json());
    } catch {
      setError("We couldn't sync your learning data. Check your connection and try again.");
    }
  }
  useEffect(() => { void load(); }, []);

  async function post(action: string, payload: Record<string, unknown>, operation: string) {
    const key = operationKeys.current[operation] ?? crypto.randomUUID();
    operationKeys.current[operation] = key;
    const body = JSON.stringify({ action, payload: { ...payload, idempotencyKey: key }, tzOffset: tz() });
    let response: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        response = await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body });
        if (response.ok || response.status < 500 && response.status !== 409) break;
      } catch { /* retry with the same idempotency key */ }
    }
    if (response?.ok) {
      delete operationKeys.current[operation];
      setData(await response.json());
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
  function play(card: Card) {
    setAudioError("");
    if (!card.audioText || !("speechSynthesis" in window)) { setAudioError("Audio is unavailable in this browser. No mastery was changed."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(card.audioText);
    utterance.lang = "zh-CN";
    utterance.onend = () => { void post("audio_review_ready", { cardId: card.id, cardRevision: card.revision }, `audio-ready:${card.id}:${card.revision}`); };
    utterance.onerror = () => setAudioError("Audio failed. No mastery was changed.");
    window.speechSynthesis.speak(utterance);
  }

  if (error) return <State title="Sync paused" text={error}><button onClick={load} className="btn">Try again</button></State>;
  if (!data) return <State title="Loading your learning plan…" text="Restoring your latest progress." />;
  const open = data.mistakes.filter((mistake) => mistake.status === "open");

  if (mode === "today") {
    const firstPending = data.session.items.findIndex((item) => item.status === "pending");
    return <Shell title="Today" sub="Review → Learn → Listen/Practice → Summary">
      <div className="grid gap-4">
        {data.session.items.map((item, index) => {
          const locked = item.status === "pending" && firstPending >= 0 && index > firstPending;
          if (item.kind === "summary") return <article className="summary" key={item.id} aria-live="polite">
            <span className="eyebrow">Summary</span>
            <h2>{item.status === "completed" ? "Daily session complete" : "Finish the steps above"}</h2>
            <p>{data.session.items.filter((entry) => entry.kind !== "summary" && entry.status === "completed").length}/{data.session.items.filter((entry) => entry.kind !== "summary").length} learning steps complete · {open.length} open mistakes</p>
          </article>;
          return <article className={`card ${locked ? "opacity-60" : ""}`} key={item.id}>
            <span className="eyebrow">{item.dimension?.replace("_", " ") ?? item.kind}</span>
            <h2>{label(item)}</h2>
            <p>{item.status === "completed" ? "Completed" : locked ? "Complete the previous step first." : "Ready to continue"}</p>
            {!locked && item.status === "pending" && actionFor(item, complete)}
          </article>;
        })}
      </div>
      <Mastery values={data.mastery} />
    </Shell>;
  }

  if (mode === "mistakes") return <Shell title="Mistakes" sub="Wrong reading and listening attempts stay here until Review resolves them.">
    {open.length ? <div className="grid gap-4">{open.map((mistake) => <article className="card" key={mistake.id}>
      <span className="eyebrow">{mistake.dimension.replace("_", " ")}</span>
      <h2>{mistake.prompt}</h2>
      <p>Added {new Date(mistake.createdAt).toLocaleDateString()}</p>
      <Link className="btn" href="/review">Review now</Link>
    </article>)}</div> : <State title="No open mistakes" text="Practice and listening mistakes will appear here automatically."><Link className="btn" href="/listen">Start listening</Link></State>}
    <Mastery values={data.mastery} />
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
    <Mastery values={data.mastery} />
  </Shell>;
}

function label(item: Item) {
  if (item.kind === "learn") return "Learn 你好";
  if (item.kind === "listen") return item.dimension === "audio" ? "Listen to 你好" : "Listen in context";
  if (item.kind === "practice") return "Reading practice";
  return `Review ${item.dimension?.replace("_", " ") ?? "item"}`;
}
function actionFor(item: Item, complete: (item: Item) => Promise<void>) {
  if (item.kind === "review") return <Link className="btn" href="/review">Start review</Link>;
  if (item.kind === "learn") return <div className="flex flex-wrap gap-2"><Link className="btn" href="/word/ni-hao">Learn 你好</Link><button className="btn secondary" onClick={() => complete(item)}>Mark learned</button></div>;
  if (item.kind === "listen") return <Link className="btn" href={`/listen/word-ni-hao?mode=${item.dimension}`}>Start listening</Link>;
  if (item.kind === "practice") return <Link className="btn" href="/hsk-1-practice-test">Start practice</Link>;
  return null;
}
function Shell(props: any) {
  return <main className="learn"><header><span className="eyebrow">HSKKit learning loop</span><h1>{props.title}</h1><p>{props.sub}</p><nav><Link href="/today">Today</Link><Link href="/review">Review</Link><Link href="/mistakes">Mistakes</Link><Link href="/listen">Listen</Link></nav></header>{props.children}</main>;
}
function State(props: any) { return <div className="state"><h2>{props.title}</h2><p>{props.text}</p>{props.children}</div>; }
function Mastery({ values }: { values: Record<Dimension, number> }) {
  return <section className="summary"><h2>Mastery</h2><p>Reading {values.reading} · Audio {values.audio} · Context audio {values.context_audio}</p><p>Saved securely for this guest browser.</p></section>;
}
