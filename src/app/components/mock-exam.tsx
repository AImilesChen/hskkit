"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MockAnswer, MockBand, MockQuestion, MockResult } from "@/lib/mock/domain";

const MOBILE_QA_WIDTH = 390;
type PublicQuestion = Omit<MockQuestion, "correctAnswer" | "explanation" | "approval" | "authorization" | "lifecycle" | "audioText">;
type ReviewFilter = "all" | "incorrect" | "unanswered" | "correct";
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
  const [status, setStatus] = useState("Checking availability...");
  const [availability, setAvailability] = useState<{ basicLevels?: Record<number, { ready: boolean; reason: string | null }>; advanced?: { ready: boolean; reason: string | null } }>();
  const [targetLevel, setTargetLevel] = useState(3);
  const [busy, setBusy] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const autoSubmitting = useRef(false);
  const advanced = band === "advanced";
  const selectedAvailability = advanced ? availability?.advanced : availability?.basicLevels?.[targetLevel];
  const ready = selectedAvailability?.ready;

  const call = useCallback(async (body: Record<string, unknown>) => {
    const response = await fetch("/api/v1/mock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json() as { session?: PublicSession; result?: MockResult; error?: string };
    if (!response.ok || !data.session) throw new Error(data.error ?? "Skills check request failed");
    setSession(data.session);
    localStorage.setItem(key(band), data.session.id);
    return data.session;
  }, [band]);

  useEffect(() => {
    fetch("/api/v1/mock").then(async (response) => {
      const data = await response.json() as { availability?: typeof availability };
      if (!response.ok || !data.availability) throw new Error("Availability unavailable");
      setAvailability(data.availability);
      setStatus("Ready to start");
    }).catch(() => setStatus("Temporarily unavailable. Refresh the page or try again later."));
    const sessionId = localStorage.getItem(key(band));
    if (!sessionId) return;
    fetch(`/api/v1/mock?sessionId=${encodeURIComponent(sessionId)}`).then(async (response) => {
      const data = await response.json() as { session?: PublicSession };
      if (!response.ok || !data.session || data.session.band !== band) {
        localStorage.removeItem(key(band));
        setStatus("Previous attempt is unavailable. Refresh to recheck the release gate.");
        return;
      }
      setSession(data.session);
      if (band === "basic" && data.session.questions.length && data.session.questions.every((question) => question.level === data.session!.questions[0].level)) setTargetLevel(data.session.questions[0].level);
      setStatus(data.session.status === "submitted" ? "Result restored" : "Progress restored");
    }).catch(() => setStatus("Could not restore. Retry when online."));
  }, [band]);

  const submit = useCallback(async (automatic = false) => {
    if (!session || session.status !== "in_progress" || busy) return;
    if (!automatic && !window.confirm("Submit this skills check now? Unanswered items will be marked incorrect.")) return;
    setBusy(true);
    setStatus(automatic ? "Time is up - submitting saved answers..." : "Submitting...");
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
    if (ready !== true) { setStatus("This diagnostic is unavailable right now. Refresh or try again later."); return; }
    setBusy(true); setStatus("Starting secure timer...");
    try {
      const pendingKey = `hskkit_mock_pending_start_${band}_${advanced ? "7-9" : targetLevel}`;
      const idempotencyKey = localStorage.getItem(pendingKey) ?? requestKey(`start-${band}`);
      localStorage.setItem(pendingKey, idempotencyKey);
      await call({ action: "start", payload: { band, targetLevel: advanced ? undefined : targetLevel, idempotencyKey } });
      localStorage.removeItem(pendingKey);
      setIndex(0); setStatus("Diagnostic started"); autoSubmitting.current = false;
    } catch (error) { setStatus(error instanceof Error ? error.message : "This diagnostic remains safely closed."); }
    finally { setBusy(false); }
  }
  async function save(answer: string) {
    if (!session || !current || busy || !answer) return;
    setBusy(true); setStatus("Autosaving...");
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

  function chooseAnotherLevel() {
    if (advanced || !session || busy) return;
    if (session.status === "submitted") {
      localStorage.removeItem(key(band));
      setSession(undefined);
      setIndex(0);
      setStatus("Choose an HSK level to begin a new skills check.");
      return;
    }
    if (autoSubmitting.current) return;
    const level = session.questions[0]?.level ?? targetLevel;
    if (!window.confirm(`Discard this HSK ${level} skills check and choose another level? Your saved answers for this unfinished attempt will be lost. No score or mistakes will be recorded.`)) return;
    autoSubmitting.current = true;
    setBusy(true);
    setStatus("Discarding unfinished attempt...");
    void (async () => {
      try {
        const response = await fetch("/api/v1/mock", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "discard", payload: { sessionId: session.id, idempotencyKey: requestKey(`discard-${session.id}`) } }),
        });
        const data = await response.json() as { discarded?: boolean; error?: string };
        if (!response.ok || !data.discarded) throw new Error(data.error ?? "Could not discard this attempt. Please retry.");
        localStorage.removeItem(key(band));
        setSession(undefined);
        setIndex(0);
        setStatus("Choose an HSK level to begin a new skills check.");
      } catch (error) {
        autoSubmitting.current = false;
        const message = error instanceof Error ? error.message : "Could not switch levels. Your current attempt is still saved.";
        if (message === "REVISION_CONFLICT" || message === "MOCK_ALREADY_SUBMITTED") {
          try {
            const latest = await fetch(`/api/v1/mock?sessionId=${encodeURIComponent(session.id)}`);
            const data = await latest.json() as { session?: PublicSession };
            if (latest.ok && data.session) setSession(data.session);
          } catch { /* Keep the current view so the learner can retry safely. */ }
        }
        setStatus(message === "MOCK_ALREADY_SUBMITTED" ? "This attempt was already submitted. Its result has been restored." : message);
      } finally { setBusy(false); }
    })();
  }

  if (!session) return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
    <p className="text-sm font-bold uppercase tracking-[.16em] text-blue-700">{advanced ? "Unified HSK 7-9 | Short diagnostic" : "HSK 1-6 | Level-specific diagnostic"}</p>
    <h1 className="mt-3 font-serif text-4xl font-bold text-slate-950 sm:text-6xl">{advanced ? "Advanced Skills Check" : "Basic Skills Check"}</h1>
    <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{advanced ? "Try a fresh selection from the unified HSK 7-9 practice pool and see which skills need more work." : "Choose one HSK level, try a fresh selection of practice questions, and see which skills need more work."}</p>
    {!advanced ? <label className="mt-6 block max-w-xs font-bold text-slate-900" htmlFor="mock-target-level">Target HSK level
      <select id="mock-target-level" className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950" value={targetLevel} onChange={(event) => setTargetLevel(Number(event.target.value))}>
        {[1, 2, 3, 4, 5, 6].map((level) => <option key={level} value={level}>HSK {level}</option>)}
      </select>
    </label> : null}
    <div className="mt-6 grid gap-3 rounded-2xl bg-blue-50 p-5 text-sm text-blue-950 lg:grid-cols-3">
      <p><strong className="block text-slate-950">15 questions</strong>5 grammar | 5 reading | 5 listening</p>
      <p><strong className="block text-slate-950">{advanced ? "35 minutes" : "30 minutes"}</strong>Timed attempt</p>
      <p><strong className="block text-slate-950">Autosaved</strong>Answers saved automatically</p>
    </div>
    <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600">This short learning check is not an official or full-length HSK exam. It samples three skills; writing, translation and speaking are not tested. Recent diagnostic questions are avoided when the pool allows.</p>
    <button className="btn btn-primary mt-7 min-h-11 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500" disabled={busy || ready !== true} onClick={start}>Start {advanced ? "Advanced" : `HSK ${targetLevel}`} Skills Check</button>
    <p aria-live="polite" className="mt-3 text-sm font-semibold text-slate-600">{ready === false ? `Unavailable right now: ${selectedAvailability?.reason ?? "please try again later"}` : status}</p>
    <details className="mt-5 rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-600">
      <summary className="cursor-pointer font-bold text-slate-800">How this skills check works</summary>
      <p className="mt-3">Each attempt draws from the approved practice pool, with different passages and recordings within the attempt. Answers are saved and previous results remain available. Your score describes only this short set, not an official proficiency level.</p>
    </details>
  </section>;

  if (session.status === "submitted" && session.result) {
    const result = session.result;
    const unansweredCount = result.items.filter((item) => !item.answer).length;
    const incorrectCount = result.items.filter((item) => Boolean(item.answer) && !item.correct).length;
    const correctCount = result.items.filter((item) => item.correct).length;
    const reviewItems = result.items.filter((item) => reviewFilter === "all" || (reviewFilter === "correct" && item.correct) || (reviewFilter === "unanswered" && !item.answer) || (reviewFilter === "incorrect" && Boolean(item.answer) && !item.correct));
    const primaryReview = advanced ? { label: `Review ${result.totalCount} tasks`, filter: "all" as ReviewFilter } : incorrectCount > 0 ? { label: `Review mistakes (${incorrectCount})`, filter: "incorrect" as ReviewFilter } : unansweredCount > 0 ? { label: `Review unanswered (${unansweredCount})`, filter: "unanswered" as ReviewFilter } : { label: "Review all answers", filter: "all" as ReviewFilter };
    const filters: Array<{ key: ReviewFilter; label: string; count: number }> = [
      { key: "all", label: "All", count: result.totalCount },
      { key: "incorrect", label: "Incorrect", count: incorrectCount },
      { key: "unanswered", label: "Unanswered", count: unansweredCount },
      { key: "correct", label: "Correct", count: correctCount },
    ];
    return <section className="space-y-6">
      <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-9">
        <p className="text-sm font-bold uppercase tracking-[.16em] text-emerald-700">Saved result</p>
        <h1 className="mt-3 font-serif text-3xl font-bold text-slate-950 sm:text-4xl">{result.correctCount}/{result.totalCount} correct</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-700">{result.percentage}% on this {advanced ? "HSK 7-9" : "level-specific"} skills check. This score describes only the questions in this attempt.</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{result.disclaimer}</p>
        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-2xl bg-emerald-50 p-3 sm:p-4"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Correct</p><p className="mt-1 text-2xl font-black text-slate-950">{correctCount}</p></div>
          <div className="rounded-2xl bg-amber-50 p-3 sm:p-4"><p className="text-xs font-bold uppercase tracking-wide text-amber-700">Incorrect</p><p className="mt-1 text-2xl font-black text-slate-950">{incorrectCount}</p></div>
          <div className="rounded-2xl bg-slate-100 p-3 sm:p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-600">Unanswered</p><p className="mt-1 text-2xl font-black text-slate-950">{unansweredCount}</p></div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3" aria-label="Results by skill">
          {(["grammar", "reading", "listening"] as const).map((skill) => <div key={skill} className="rounded-xl border border-slate-200 p-3"><span className="font-bold capitalize text-slate-900">{skill}</span><span className="ml-2 text-slate-700">{result.dimensionEvidence[skill]?.correct ?? 0}/{result.dimensionEvidence[skill]?.total ?? 0}</span></div>)}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a className="btn btn-primary min-h-11 text-center" href="#mock-question-review" onClick={() => setReviewFilter(primaryReview.filter)}>{primaryReview.label}</a>
          <button className="btn btn-secondary min-h-11" onClick={start} disabled={busy || ready !== true}>Try another question set</button>
          {!advanced ? <button className="btn btn-secondary min-h-11" onClick={chooseAnotherLevel}>Choose another HSK level</button> : null}
        </div>
        <details className="mt-5 rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-600">
          <summary className="cursor-pointer font-bold text-slate-800">More learning tools</summary>
          <p className="mt-3">{result.disclaimer}</p>
          <div className="mt-4 flex flex-wrap gap-3"><Link className="btn btn-secondary" href="/mistakes">Saved mistakes list</Link><Link className="btn btn-secondary" href="/review">Open SRS review</Link><Link className="btn btn-secondary" href="/planner">Open Planner</Link></div>
        </details>
      </div>
      <section className="scroll-mt-24" id="mock-question-review" aria-labelledby="mock-review-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-bold uppercase tracking-[.14em] text-blue-700">Question review</p><h2 className="mt-1 text-2xl font-black text-slate-950" id="mock-review-heading">Review your answers</h2></div>
          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter question review">{filters.map((filter) => <button aria-pressed={reviewFilter === filter.key} className={`min-h-11 shrink-0 rounded-xl border px-4 text-sm font-bold ${reviewFilter === filter.key ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-700"}`} key={filter.key} onClick={() => setReviewFilter(filter.key)}>{filter.label} {filter.count}</button>)}</div>
        </div>
        <div className="mt-5 space-y-3">{reviewItems.map((item) => {
          const itemState = item.correct ? "Correct" : item.answer ? "Incorrect" : "Unanswered";
          const snapshot = result.questionSnapshots.find((question) => question.id === item.questionId);
          const answerLabel = item.answer ? snapshot?.options?.[item.answer] ?? item.answer : "Not answered";
          const correctLabel = snapshot?.options?.[item.correctAnswer] ?? item.correctAnswer;
          return <details key={item.questionId} className={`rounded-2xl border p-4 ${item.correct ? "border-emerald-200 bg-emerald-50" : item.answer ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
            <summary className="cursor-pointer font-bold text-slate-950">{itemState} | {item.dimension} | {item.prompt}</summary>
            <div className="mt-4 border-t border-current/10 pt-4"><p className="text-sm">Your answer: {answerLabel}</p><p className="mt-1 text-sm">Correct answer: {correctLabel}</p><p className="mt-3 text-sm leading-6 text-slate-700">{item.explanation}</p></div>
          </details>;
        })}</div>
        {reviewItems.length === 0 ? <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-slate-600">No questions match this filter.</p> : null}
      </section>
    </section>;
  }

  if (!current) return null;
  const answered = session.answers.length;
  return <section className="space-y-5" data-mobile-qa-width={MOBILE_QA_WIDTH}>
    <header className="mock-exam-status sticky top-[72px] z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
      <div className="mock-exam-status-grid">
        <div>
          <p className="text-lg font-black text-slate-950">Question {index + 1} of {session.questions.length}</p>
          <p className="mt-1 text-sm font-bold capitalize text-blue-700">{current.dimension} | HSK {current.levelBand}</p>
        </div>
        <div className="mock-exam-save-status">
          <p className="text-sm font-bold text-slate-800">{answered} answers saved</p>
          <p aria-live="polite" className="mt-1 text-sm text-slate-600">{status}</p>
        </div>
        <div className="mock-exam-timer">
          <span className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">Time remaining</span>
          <time aria-label={`Time remaining: ${formatTime(seconds)}`} className="mt-1 block rounded-xl bg-slate-950 px-4 py-2 font-mono text-xl font-bold text-white" dateTime={session.deadlineAt}>{formatTime(seconds)}</time>
        </div>
      </div>
    </header>
    {!advanced ? <div className="flex justify-end"><button className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-blue-700 hover:border-blue-500 disabled:opacity-50" disabled={busy} onClick={chooseAnotherLevel}>Choose another HSK level</button></div> : null}
    <nav aria-label="Skills check questions" className="flex gap-2 overflow-x-auto pb-2">{session.questions.map((question, questionIndex) => <button key={question.id} className={`min-h-11 min-w-11 rounded-xl border font-bold ${questionIndex === index ? "border-blue-600 bg-blue-600 text-white" : session.answers.some((answer) => answer.questionId === question.id) ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`} onClick={() => setIndex(questionIndex)}>{questionIndex + 1}</button>)}</nav>
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <p className="text-sm font-bold uppercase tracking-[.12em] text-slate-500">{current.dimension} | HSK {current.levelBand}</p>
      {current.instruction && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-950">{current.instruction}</p>}
      {current.audioSrc && <audio aria-label={`Question ${index + 1} audio`} className="mt-4 w-full" controls preload="metadata" src={current.audioSrc}>Audio playback is not supported.</audio>}
      {current.context && <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-lg leading-8 text-slate-900" lang="zh-Hans">{current.context}</p>}
      <h2 className="mt-5 text-xl font-bold leading-8 text-slate-950">{current.prompt}</h2>
      {current.options ? <div className="mt-5 grid gap-3">{Object.entries(current.options).map(([value, label]) => <button key={value} disabled={busy} onClick={() => void save(value)} className={`min-h-12 rounded-xl border px-4 py-3 text-left font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${saved === value ? "border-blue-600 bg-blue-50 text-blue-950" : "border-slate-200 bg-white hover:border-blue-300"}`}><span className="mr-2 font-bold">{value}.</span>{label}</button>)}</div> : <div className="mt-5"><label className="font-semibold text-slate-900" htmlFor="mock-answer">Type your answer</label><textarea id="mock-answer" maxLength={180} value={draft} onChange={(event) => setDraft(event.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"/><p className="mt-2 text-sm text-slate-600">Punctuation and spaces are ignored.</p></div>}
      <div className="mock-exam-actions mt-7 border-t border-slate-200 pt-5">
        <button className="btn btn-secondary mock-exam-action mock-exam-previous" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>Previous</button>
        <p className="mock-exam-action-status" aria-live="polite">{status}</p>
        {!current.options ? <button aria-busy={busy} className="btn btn-secondary mock-exam-action mock-exam-save" data-loading={busy ? "true" : undefined} disabled={busy || !draft.trim()} onClick={() => void save(draft.trim())}>{busy ? "Saving..." : "Save answer"}</button> : <span className="mock-exam-save-placeholder" aria-hidden="true" />}
        {index < session.questions.length - 1 ? <button className="btn btn-primary mock-exam-action mock-exam-next" onClick={() => setIndex((value) => Math.min(session.questions.length - 1, value + 1))}>Next<span aria-hidden="true">-&gt;</span></button> : <button aria-busy={busy} className="btn btn-primary mock-exam-action mock-exam-next" data-loading={busy ? "true" : undefined} disabled={busy} onClick={() => void submit(false)}>{busy ? "Submitting..." : "Submit skills check"}</button>}
      </div>
    </article>
  </section>;
}
