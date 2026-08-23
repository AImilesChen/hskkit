"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Question = { id: string; prompt: string; context?: string; audioSrc?: string; options: Record<string, string>; level: number; skill: string; contentVersion: string };
type Feedback = { questionId: string; selectedAnswer: string; correct: boolean; correctAnswer: string; correctAnswerText: string; explanation: string; weaknessTag: string };
type Session = { id: string; status: "in_progress" | "completed" | "expired"; level: number; skill: string; questionVersion: string; expiresAt: string; questions: Question[]; feedback: Feedback[]; result?: { correctCount: number; totalCount: number; weaknessTags: string[] } };

function practiceMessage(code: string) {
  if (code === "PRACTICE_SESSION_EXPIRED") return "This Practice Session timed out. Start a new session; no late answer was saved.";
  if (code === "PRACTICE_QUESTION_WITHDRAWN") return "This question was withdrawn after a content review. Start a new session to continue with the current set.";
  if (code === "INVALID_PRACTICE_ANSWER") return "That answer is not valid for this question. No attempt was saved.";
  return code;
}

async function json(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) }, cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(practiceMessage(data.error ?? "PRACTICE_REQUEST_FAILED"));
  return data;
}

export default function PracticeClient({ level, skill, dailySessionId, dailyItemId }: { level: number; skill: string; dailySessionId?: string; dailyItemId?: string }) {
  const [session, setSession] = useState<Session | null>();
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const keys = useRef<Record<string, string>>({});

  useEffect(() => {
    const query = new URLSearchParams({ level: String(level), skill });
    if (dailySessionId) query.set("dailySessionId", dailySessionId);
    if (dailyItemId) query.set("dailyItemId", dailyItemId);
    void json(`/api/v1/practice?${query.toString()}`)
      .then((data) => {
        setSession(data.session);
        if (data.session?.status === "in_progress") setIndex(Math.min(data.session.feedback.length, data.session.questions.length - 1));
      })
      .catch((cause) => { setError(cause instanceof Error ? cause.message : "PRACTICE_LOAD_FAILED"); setSession(null); });
  }, [level, skill, dailySessionId, dailyItemId]);

  const post = async (action: string, payload: Record<string, unknown>, operation: string) => {
    const key = keys.current[operation] ?? crypto.randomUUID();
    keys.current[operation] = key;
    const data = await json("/api/v1/practice", { method: "POST", body: JSON.stringify({ action, payload: { ...payload, idempotencyKey: key } }) });
    delete keys.current[operation];
    return data;
  };

  const start = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      const data = await post("start", { level, skill, dailySessionId, dailyItemId }, `start:${crypto.randomUUID()}`);
      setSession(data.session); setIndex(0);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "PRACTICE_NOT_READY"); }
    finally { setBusy(false); }
  };

  const answer = async (answer: string) => {
    if (!session) return;
    const question = session.questions[index];
    setBusy(true); setError("");
    try {
      const data = await post("answer", { sessionId: session.id, questionId: question.id, answer }, `answer:${session.id}:${question.id}`);
      setSession(data.session);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "PRACTICE_SAVE_FAILED"); }
    finally { setBusy(false); }
  };

  const report = async () => {
    if (!session) return;
    const question = session.questions[index];
    setBusy(true); setError(""); setNotice("");
    try {
      await post("report", { sessionId: session.id, questionId: question.id, reason: "answer_or_explanation" }, `report:${session.id}:${question.id}`);
      setNotice("Report saved for review. Your attempt history remains intact.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "REPORT_FAILED"); }
    finally { setBusy(false); }
  };

  if (session === undefined) return <State title="Restoring practice…" text="Checking for a resumable server-side session." />;

  if (!session) return <main className="mx-auto min-h-[calc(100vh-64px)] max-w-4xl px-6 py-16 sm:py-24">
    <span className="text-xs font-extrabold uppercase tracking-[.2em] text-blue-700">HSK 3.0 bounded practice</span>
    <h1 className="mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight text-slate-950 sm:text-6xl">Level {level} {skill.replaceAll("-", " ")} practice</h1>
    <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Get immediate feedback. Wrong answers create a recoverable Mistake and SRS review card; refresh restores the same session.</p>
    {(level >= 1 && level <= 7) ? <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><strong>Published scope:</strong> eight version-locked {skill} questions with source, QA, answer, explanation and lifecycle records. Level 7 represents the unified HSK 7–9 advanced ability band.</p> : <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">Use the unified HSK 7–9 advanced ability band. No separate HSK 8 or 9 official set is published.</p>}
    {error && <Alert text={error === "PRACTICE_NOT_READY" ? "This practice set is not published. Choose Levels 1–6 or the unified HSK 7–9 advanced ability band." : error} />}
    <div className="mt-8 flex flex-wrap gap-3"><button className="btn" disabled={busy} onClick={start}>Start practice</button><Link className="btn secondary" href="/practice">Choose another level or skill</Link></div>
  </main>;

  if (session.status === "expired") return <main className="mx-auto min-h-[calc(100vh-64px)] max-w-3xl px-6 py-16 sm:py-24">
    <span className="text-xs font-extrabold uppercase tracking-[.2em] text-amber-700">Practice Session expired</span>
    <h1 className="mt-4 font-serif text-5xl font-bold text-slate-950">Start a fresh session</h1>
    <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">The 24-hour answer window ended. Your earlier saved attempts remain in Mistakes and Review; no late answer was recorded.</p>
    {error && <Alert text={error} />}
    <div className="mt-8 flex flex-wrap gap-3"><button className="btn" disabled={busy} onClick={start}>Start new session</button><Link className="btn secondary" href="/practice">Choose another level or skill</Link></div>
  </main>;

  if (session.status === "completed") return <main className="mx-auto min-h-[calc(100vh-64px)] max-w-3xl px-6 py-16 sm:py-24">
    <span className="text-xs font-extrabold uppercase tracking-[.2em] text-blue-700">Practice summary</span>
    <h1 className="mt-4 font-serif text-5xl font-bold text-slate-950">Session complete</h1>
    <p className="mt-5 text-xl text-slate-700">{session.result?.correctCount} of {session.result?.totalCount} correct · HSK 3.0 Level {session.level} {session.skill}</p>
    {session.result?.weaknessTags.length ? <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-bold text-amber-950">Review created</h2><p className="mt-2 text-amber-900">Weakness: {session.result.weaknessTags.join(", ")}. Wrong attempts remain in Mistakes and are scheduled in Review.</p></div> : <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">No wrong answers in this session.</div>}
    {error && <Alert text={error} />}
    <div className="mt-8 flex flex-wrap gap-3"><Link className="btn" href="/mistakes">Open Mistakes</Link><Link className="btn secondary" href="/review">Open Review/SRS</Link><Link className="btn secondary" href={`/planner?source=practice&level=${session.level}&skill=${session.skill}`}>Create or update learning plan</Link><button className="btn secondary" disabled={busy} onClick={start}>Practice again</button><Link className="btn secondary" href="/today">Continue Today</Link></div>
  </main>;

  const question = session.questions[index];
  const feedback = session.feedback.find((entry) => entry.questionId === question.id);
  return <main className="mx-auto min-h-[calc(100vh-64px)] max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
    <div className="flex items-end justify-between gap-4"><div><span className="text-xs font-extrabold uppercase tracking-[.18em] text-blue-700">Level {session.level} · {session.skill}</span><h1 className="mt-2 font-serif text-3xl font-bold text-slate-950">Question {index + 1} of {session.questions.length}</h1></div><span className="text-sm font-bold text-slate-500">{Math.round(((index + 1) / session.questions.length) * 100)}%</span></div>
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${((index + 1) / session.questions.length) * 100}%` }} /></div>
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[.15em] text-slate-500">HSK 3.0 · Published bounded set</p>
      {question.context && <p className="mt-5 rounded-xl bg-slate-50 p-4 text-xl leading-8 text-slate-900">{question.context}</p>}
      {question.audioSrc && <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="mb-3 text-sm font-bold text-blue-950">Listen before answering</p><audio className="w-full" controls preload="metadata" src={question.audioSrc}>Your browser cannot play this approved audio item.</audio><p className="mt-2 text-xs text-blue-800">A playback error does not submit an answer or change Mistakes/SRS state.</p></div>}
      <h2 className="mt-5 font-serif text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">{question.prompt}</h2>
      <div className="mt-6 grid gap-3">{Object.entries(question.options).map(([key, value]) => {
        const selected = feedback?.selectedAnswer === key;
        const correct = feedback?.correctAnswer === key;
        const tone = feedback ? correct ? "border-emerald-500 bg-emerald-50" : selected ? "border-red-400 bg-red-50" : "border-slate-200 bg-white" : "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50";
        return <button key={key} disabled={busy || Boolean(feedback)} onClick={() => void answer(key)} className={`min-h-[64px] rounded-2xl border-2 px-4 py-3 text-left font-semibold text-slate-900 ${tone}`}><span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 uppercase">{key}</span>{value}</button>;
      })}</div>
      {feedback && <div className={`mt-6 rounded-2xl p-5 ${feedback.correct ? "bg-emerald-50 text-emerald-950" : "bg-amber-50 text-amber-950"}`} role="status"><h3 className="font-bold">{feedback.correct ? "Correct" : `Correct answer: ${feedback.correctAnswerText}`}</h3><p className="mt-2 leading-6">{feedback.explanation}</p><button className="mt-3 text-sm font-bold underline" disabled={busy} onClick={() => void report()}>Report this question</button></div>}
      {notice && <p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-900" role="status">{notice}</p>}
      {error && <Alert text={error} />}
      <div className="mt-7 flex items-center justify-between gap-3"><button className="btn secondary" disabled={index === 0 || busy} onClick={() => { setIndex((value) => value - 1); setNotice(""); }}>Back</button>{feedback && index < session.questions.length - 1 && <button className="btn" onClick={() => { setIndex((value) => value + 1); setNotice(""); }}>Next</button>}</div>
    </section>
    <p className="mt-5 text-sm leading-6 text-slate-500">Answers save to the server after each response. Refreshing restores this session; repeated requests do not duplicate attempts, Mistakes, or SRS cards.</p>
  </main>;
}

function State({ title, text }: { title: string; text: string }) { return <div className="state" role="status"><h2>{title}</h2><p>{text}</p></div>; }
function Alert({ text }: { text: string }) { return <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800" role="alert">{text}</p>; }
