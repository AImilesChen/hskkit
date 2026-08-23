"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MockAnswer, MockBand, MockQuestion, MockResult } from "@/lib/mock/domain";

const MOBILE_QA_WIDTH = 390;
type PublicQuestion = Omit<MockQuestion, "correctAnswer" | "explanation" | "approval" | "authorization" | "lifecycle">;
type PublicSession = {
  id: string;
  band: MockBand;
  questionSetVersion: string;
  scoringVersion: string;
  questions: PublicQuestion[];
  answers: MockAnswer[];
  revision: number;
  status: "in_progress" | "submitted";
  startedAt: string;
  deadlineAt: string;
  submittedAt?: string;
  result?: MockResult;
};
const key = (band: MockBand) => `hskkit_mock_${band}`;
const requestKey = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export function MockExam({ band }: { band: MockBand }) {
  const [session, setSession] = useState<PublicSession>();
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState("Checking availability…");
  const [ready, setReady] = useState<boolean>();
  const [busy, setBusy] = useState(false);
  const autoSubmitting = useRef(false);
  const advanced = band === "advanced";

  const call = useCallback(async (body: Record<string, unknown>) => {
    const response = await fetch("/api/v1/mock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json() as { session?: PublicSession; result?: MockResult; error?: string };
    if (!response.ok || !data.session) throw new Error(data.error ?? "Mock request failed");
    setSession(data.session);
    localStorage.setItem(key(band), data.session.id);
    return data.session;
  }, [band]);

  useEffect(() => {
    const sessionId = localStorage.getItem(key(band));
    if (!sessionId) {
      fetch("/api/v1/mock").then(async (response) => {
        const data = await response.json() as { availability?: Record<MockBand, { ready: boolean; reason: string | null }> };
        const available = Boolean(response.ok && data.availability?.[band]?.ready);
        setReady(available);
        setStatus(available ? "Ready to start" : `Safely closed: ${data.availability?.[band]?.reason ?? "release gate unavailable"}`);
      }).catch(() => { setReady(false); setStatus("Availability check failed. This Mock stays safely closed."); });
      return;
    }
    fetch(`/api/v1/mock?sessionId=${encodeURIComponent(sessionId)}`).then(async (response) => {
      const data = await response.json() as { session?: PublicSession };
      if (!response.ok || !data.session || data.session.band !== band) {
        localStorage.removeItem(key(band));
        setReady(false);
        setStatus("Previous attempt is unavailable. Refresh to recheck the release gate.");
        return;
      }
      setSession(data.session);
      setStatus(data.session.status === "submitted" ? "Result restored" : "Progress restored");
    }).catch(() => setStatus("Could not restore. Retry when online."));
  }, [band]);

  const submit = useCallback(async (automatic = false) => {
    if (!session || session.status !== "in_progress" || busy) return;
    if (!automatic && !window.confirm("Submit this Mock now? Unanswered items will be marked incorrect.")) return;
    setBusy(true);
    setStatus(automatic ? "Time is up — submitting saved answers…" : "Submitting…");
    try {
      const pendingKey = `hskkit_mock_pending_submit_${session.id}`;
      const idempotencyKey = localStorage.getItem(pendingKey) ?? requestKey(`submit-${session.id}`);
      localStorage.setItem(pendingKey, idempotencyKey);
      await call({ action: "submit", payload: { sessionId: session.id, idempotencyKey } });
      localStorage.removeItem(pendingKey);
      setStatus("Submitted and saved");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Submit failed. Retry safely."); }
    finally { setBusy(false); }
  }, [busy, call, session]);

  useEffect(() => {
    if (!session || session.status !== "in_progress") return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((Date.parse(session.deadlineAt) - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0 && !autoSubmitting.current) { autoSubmitting.current = true; void submit(true); }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [session, submit]);

  const current = session?.questions[index];
  const saved = useMemo(() => session && current ? session.answers.find((answer) => answer.questionId === current.id)?.answer : undefined, [current, session]);
  useEffect(() => { setDraft(saved ?? ""); }, [saved, current?.id]);

  async function start() {
    if (ready === false) { setStatus("This Mock remains safely closed by its release gate."); return; }
    setBusy(true); setStatus("Starting secure timer…");
    try {
      localStorage.removeItem(key(band));
      const pendingKey = `hskkit_mock_pending_start_${band}`;
      const idempotencyKey = localStorage.getItem(pendingKey) ?? requestKey(`start-${band}`);
      localStorage.setItem(pendingKey, idempotencyKey);
      const created = await call({ action: "start", payload: { band, idempotencyKey } });
      localStorage.removeItem(pendingKey);
      setIndex(0); setStatus(`Started — ${created.questions.length} approved tasks`); autoSubmitting.current = false;
    } catch (error) { setStatus(error instanceof Error ? error.message : "This Mock remains safely closed."); }
    finally { setBusy(false); }
  }
  async function save(answer: string) {
    if (!session || !current || busy || !answer) return;
    setBusy(true); setStatus("Autosaving…");
    try {
      const pendingKey = `hskkit_mock_pending_answer_${session.id}_${current.id}`;
      let pending: { answer: string; idempotencyKey: string } | undefined;
      try { pending = JSON.parse(localStorage.getItem(pendingKey) ?? "null") as typeof pending; } catch { pending = undefined; }
      const idempotencyKey = pending?.answer === answer ? pending.idempotencyKey : requestKey(`answer-${current.id}`);
      localStorage.setItem(pendingKey, JSON.stringify({ answer, idempotencyKey }));
      await call({ action: "answer", payload: { sessionId: session.id, questionId: current.id, answer, idempotencyKey } });
      localStorage.removeItem(pendingKey);
      setStatus("Autosaved");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Autosave failed. Retry before leaving."); }
    finally { setBusy(false); }
  }

  if (!session) return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
    <p className="text-sm font-bold uppercase tracking-[.16em] text-blue-700">{advanced ? "Unified HSK 7–9 ability model" : "HSK 1–6 approved practice assessment"}</p>
    <h1 className="mt-3 font-serif text-4xl font-bold text-slate-950 sm:text-6xl">{advanced ? "Advanced Mock" : "Basic Mock"}</h1>
    <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{advanced ? "Five approved reading, listening and pragmatic tasks. The result is one broad ability interval, never a fabricated single-level official score." : "Eighteen approved Grammar, Reading and Listening tasks with a 30-minute server timer, autosave, restoration and learning-loop result."}</p>
    <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">Question set and scoring rules are versioned. If count, approval, authorization or scoring gates fail, the exam stays safely closed.</div>
    <button className="btn mt-7 min-h-11" disabled={busy || ready !== true} onClick={start}>Start {advanced ? "20-minute Advanced" : "30-minute Basic"} Mock</button>
    <p aria-live="polite" className="mt-4 text-sm font-semibold text-slate-600">{status}</p>
  </section>;

  if (session.status === "submitted" && session.result) {
    const result = session.result;
    return <section className="space-y-6">
      <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[.16em] text-emerald-700">Saved result</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-slate-950">{advanced ? `${result.abilityInterval} advanced ability` : `${result.correctCount}/${result.totalCount} correct`}</h1>
        <p className="mt-3 text-lg text-slate-700">{result.percentage}% across this approved question set.</p>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">{result.disclaimer}</p>
        <div className="mt-6 flex flex-wrap gap-3">{advanced ? <Link className="btn" href="/planner">Open Planner</Link> : <><Link className="btn" href="/mistakes">Open Mistakes</Link><Link className="btn-secondary" href="/review">Open SRS review</Link><Link className="btn-secondary" href="/planner">Open Planner</Link></>}</div>
      </div>
      <div className="space-y-4">{result.items.map((item, itemIndex) => <article key={item.questionId} className={`rounded-2xl border p-5 ${item.correct ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}><p className="font-bold">{itemIndex + 1}. {item.correct ? "Correct" : "Review this task"}</p><p className="mt-2 leading-7">{item.prompt}</p><p className="mt-2 text-sm">Your answer: {item.answer ?? "Not answered"}</p><p className="text-sm">Correct answer: {item.correctAnswer}</p><p className="mt-2 text-sm leading-6 text-slate-700">{item.explanation}</p></article>)}</div>
      <button className="btn-secondary min-h-11" onClick={start} disabled={busy}>Start a new Mock</button>
      <p className="break-words text-xs text-slate-500">Trace: {session.questionSetVersion} · {session.scoringVersion} · attempt {session.id}</p>
    </section>;
  }

  if (!current) return null;
  const answered = session.answers.length;
  return <section className="space-y-5" data-mobile-qa-width={MOBILE_QA_WIDTH}>
    <header className="sticky top-0 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-blue-700">{advanced ? "Advanced 7–9" : "Basic 1–6"} · {answered}/{session.questions.length} saved</p><p aria-live="polite" className="mt-1 text-sm text-slate-600">{status}</p></div><time className="rounded-xl bg-slate-950 px-4 py-2 font-mono text-xl font-bold text-white" dateTime={session.deadlineAt}>{formatTime(seconds)}</time></div>
    </header>
    <nav aria-label="Mock questions" className="flex gap-2 overflow-x-auto pb-2">{session.questions.map((question, questionIndex) => <button key={question.id} className={`min-h-11 min-w-11 rounded-xl border font-bold ${questionIndex === index ? "border-blue-600 bg-blue-600 text-white" : session.answers.some((answer) => answer.questionId === question.id) ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`} onClick={() => setIndex(questionIndex)}>{questionIndex + 1}</button>)}</nav>
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <p className="text-sm font-bold uppercase tracking-[.12em] text-slate-500">Question {index + 1} · {current.dimension} · {current.levelBand}</p>
      {current.instruction && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-950">{current.instruction}</p>}
      {current.audioSrc && <audio className="mt-4 w-full" controls preload="metadata" src={current.audioSrc}>Audio playback is not supported.</audio>}
      <h2 className="mt-5 text-xl font-bold leading-8 text-slate-950">{current.prompt}</h2>
      {current.options ? <div className="mt-5 grid gap-3">{Object.entries(current.options).map(([value, label]) => <button key={value} disabled={busy} onClick={() => void save(value)} className={`min-h-12 rounded-xl border px-4 py-3 text-left font-semibold ${saved === value ? "border-blue-600 bg-blue-50 text-blue-950" : "border-slate-200 bg-white hover:border-blue-300"}`}><span className="mr-2 font-bold">{value}.</span>{label}</button>)}</div> : <div className="mt-5"><label className="font-semibold" htmlFor="mock-answer">Type your answer</label><textarea id="mock-answer" maxLength={180} value={draft} onChange={(event) => setDraft(event.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 p-3"/><button className="btn mt-3 min-h-11" disabled={busy || !draft.trim()} onClick={() => void save(draft.trim())}>Save answer</button></div>}
      <div className="mt-7 flex flex-wrap justify-between gap-3"><button className="btn-secondary min-h-11" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>Previous</button>{index < session.questions.length - 1 ? <button className="btn min-h-11" onClick={() => setIndex((value) => Math.min(session.questions.length - 1, value + 1))}>Next</button> : <button className="btn min-h-11" disabled={busy} onClick={() => void submit(false)}>Submit Mock</button>}</div>
    </article>
    <p className="break-words text-xs text-slate-500">Question set {session.questionSetVersion} · scoring {session.scoringVersion} · autosave revision {session.revision}</p>
  </section>;
}
