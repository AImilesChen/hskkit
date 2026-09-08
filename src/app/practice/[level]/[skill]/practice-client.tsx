"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Question = { id: string; prompt: string; context?: string; audioSrc?: string; options: Record<string, string>; level: number; skill: string; contentVersion: string };
type Feedback = { questionId: string; selectedAnswer: string; correct: boolean; correctAnswer: string; correctAnswerText: string; explanation: string; weaknessTag: string };
type Session = { id: string; status: "in_progress" | "completed" | "expired"; level: number; skill: string; questionVersion: string; expiresAt: string; questions: Question[]; feedback: Feedback[]; result?: { correctCount: number; totalCount: number; weaknessTags: string[] } };

const SKILL_OVERVIEWS = {
  vocabulary: {
    label: "Vocabulary",
    intro: "Match English meanings with the correct Chinese words and get an explanation after every answer.",
    practice: ["Recognise current-level Chinese words", "Match meanings without hidden hints", "Review the correct word after every answer"],
  },
  grammar: {
    label: "Grammar",
    intro: "Identify natural Chinese word order and get a clear explanation after every answer.",
    practice: ["Compare current-level sentence patterns", "Choose natural Chinese word order", "Review why the correct structure works"],
  },
  reading: {
    label: "Reading",
    intro: "Read short level-appropriate passages and identify the statement supported by the text.",
    practice: ["Read a short current-level passage", "Find the detail that supports your answer", "Review the source evidence after answering"],
  },
  listening: {
    label: "Listening",
    intro: "Listen to approved practice audio and choose the statement that matches what you hear.",
    practice: ["Play current-level approved audio", "Listen for key details and meaning", "Review the matching answer and explanation"],
  },
} as const;

function practiceMessage(code: string) {
  if (code === "PRACTICE_SESSION_EXPIRED") return "This Practice Session timed out. Start a new session; no late answer was saved.";
  if (code === "PRACTICE_QUESTION_WITHDRAWN") return "This question was withdrawn after a content review. Start a new session to continue with the current set.";
  if (code === "INVALID_PRACTICE_ANSWER") return "That answer is not valid for this question. No attempt was saved.";
  return code;
}

class PracticeRequestError extends Error {
  constructor(readonly code: string) {
    super(practiceMessage(code));
  }
}

async function json(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) }, cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new PracticeRequestError(data.error ?? "PRACTICE_REQUEST_FAILED");
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
    } catch (cause) {
      if (cause instanceof PracticeRequestError && cause.code === "PRACTICE_SESSION_EXPIRED") {
        setSession({ ...session, status: "expired" });
      } else {
        setError(cause instanceof Error ? cause.message : "PRACTICE_SAVE_FAILED");
      }
    }
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

  if (!session) {
    const overview = SKILL_OVERVIEWS[skill as keyof typeof SKILL_OVERVIEWS];
    const levelDisplay = level === 7 ? "7–9" : String(level);
    return <main className="mx-auto min-h-[calc(100vh-64px)] max-w-3xl px-4 py-4 sm:px-6 sm:py-14">
      <nav aria-label="Practice breadcrumb" className="text-sm font-semibold text-slate-500">
        <Link className="hover:text-blue-700" href="/practice">Practice</Link><span aria-hidden="true" className="mx-2">/</span><span>HSK {levelDisplay}</span><span aria-hidden="true" className="mx-2">/</span><span>{overview.label}</span>
      </nav>

      <section className="mt-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:mt-5 sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-blue-700">HSK {levelDisplay} · {overview.label}</p>
        <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-slate-950 sm:text-5xl">Practice 8 HSK {levelDisplay} {overview.label.toLowerCase()} questions</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:mt-4 sm:text-lg sm:leading-8">{overview.intro}</p>

        <ul aria-label="Practice facts" className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:grid-cols-4 sm:gap-3">
          {["8 questions", "Immediate feedback", "Progress autosaved", "Mistakes added to Review"].map((fact) => <li className="flex min-h-[56px] items-center rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold leading-5 text-slate-700 sm:min-h-[64px]" key={fact}><span aria-hidden="true" className="mr-2 text-blue-600">✓</span>{fact}</li>)}
        </ul>

        {error && <Alert text={error === "PRACTICE_NOT_READY" ? "This practice set is not published. Choose Levels 1–6 or the unified HSK 7–9 advanced ability band." : error} />}
        <div className="mt-5 flex flex-col items-stretch gap-3 sm:mt-7 sm:flex-row sm:items-center">
          <button className="min-h-[48px] w-full rounded-xl bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none sm:w-auto" disabled={busy} onClick={start} type="button">{busy ? "Starting…" : "Start 8-question practice"}</button>
          <Link className="inline-flex min-h-[48px] items-center justify-center px-3 text-sm font-bold text-blue-700 hover:text-blue-900 focus-visible:rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700" href="/practice">Change level or skill</Link>
        </div>
      </section>

      <section aria-labelledby="what-you-will-practice" className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-black text-slate-950" id="what-you-will-practice">What you’ll practice</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">{overview.practice.map((item) => <li className="flex gap-3 text-sm leading-6 text-slate-600" key={item}><span aria-hidden="true" className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">✓</span>{item}</li>)}</ul>
      </section>

      <section aria-labelledby="how-it-works" className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-black text-slate-950" id="how-it-works">How it works</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          <li className="text-sm leading-6 text-slate-600"><strong className="block text-slate-900">1. Answer</strong>Choose one answer for each question.</li>
          <li className="text-sm leading-6 text-slate-600"><strong className="block text-slate-900">2. Check</strong>See the correct answer and explanation immediately.</li>
          <li className="text-sm leading-6 text-slate-600"><strong className="block text-slate-900">3. Review</strong>Wrong answers stay available in Mistakes and Review.</li>
        </ol>
      </section>

      <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
        <summary className="cursor-pointer font-bold text-slate-800 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">About this question set</summary>
        <p className="mt-3 leading-6">This published set contains eight version-locked {skill} questions with source, QA, answer, explanation and lifecycle records. {level === 7 ? "HSK 7–9 uses one unified advanced ability band; no separate HSK 8 or 9 official set is published." : "The set is tied to the selected HSK level."}</p>
      </details>
    </main>;
  }

  if (session.status === "expired") return <main className="mx-auto min-h-[calc(100vh-64px)] max-w-3xl px-4 py-4 sm:px-6 sm:py-14">
    <section className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm sm:p-8">
      <span className="text-xs font-extrabold uppercase tracking-[.18em] text-amber-700">Practice session expired</span>
      <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-slate-950 sm:text-5xl">Start a fresh session</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:mt-4 sm:text-lg sm:leading-8">The 24-hour answer window ended. Your earlier saved attempts remain in Mistakes and Review; no late answer was recorded.</p>
      {error && <Alert text={error} />}
      <div className="mt-5 flex flex-col items-stretch gap-3 sm:mt-7 sm:flex-row sm:items-center">
        <button className="min-h-[48px] w-full rounded-xl bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none sm:w-auto" disabled={busy} onClick={start} type="button">Start new session</button>
        <Link className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-blue-200 bg-white px-6 py-3 text-base font-bold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 motion-reduce:transition-none sm:w-auto" href="/practice">Change level or skill</Link>
      </div>
    </section>
  </main>;

  if (session.status === "completed") {
    const correctCount = session.result?.correctCount ?? session.feedback.filter((entry) => entry.correct).length;
    const totalCount = session.result?.totalCount ?? session.questions.length;
    const wrongCount = Math.max(totalCount - correctCount, 0);
    const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const hasMistakes = wrongCount > 0;
    const levelDisplay = session.level === 7 ? "7–9" : String(session.level);
    const skillLabel = SKILL_OVERVIEWS[session.skill as keyof typeof SKILL_OVERVIEWS]?.label ?? session.skill;

    return <main className="mx-auto min-h-[calc(100vh-64px)] max-w-3xl px-4 py-8 sm:px-6 sm:py-14">
      <span className="text-xs font-extrabold uppercase tracking-[.18em] text-blue-700">Practice summary</span>
      <section className="mt-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <h1 className="font-serif text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">Session complete</h1>
        <p className="mt-4 text-2xl font-black text-slate-900 sm:text-3xl">{correctCount} / {totalCount} correct <span className="text-slate-400">· {percentage}%</span></p>
        <p className="mt-2 text-base text-slate-600">HSK 3.0 Level {levelDisplay} · {skillLabel}</p>

        {hasMistakes ? <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
          <h2 className="text-lg font-black">{wrongCount} {wrongCount === 1 ? "item" : "items"} ready to review</h2>
          <p className="mt-2 leading-7">{wrongCount} {wrongCount === 1 ? "missed item was" : "missed items were"} saved to Mistakes and added to Review.</p>
          <p className="mt-2 text-sm font-bold">Focus area: HSK 3.0 Level {levelDisplay} {skillLabel}</p>
        </div> : <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
          <h2 className="text-lg font-black">No wrong answers in this session</h2>
          <p className="mt-2 leading-7">Perfect score — keep the momentum going.</p>
        </div>}

        {error && <Alert text={error} />}

        <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          {hasMistakes ? <>
            <Link className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 motion-reduce:transition-none sm:w-auto" href="/review">Review {wrongCount} {wrongCount === 1 ? "mistake" : "mistakes"} now</Link>
            <button className="min-h-[48px] w-full rounded-xl border border-blue-200 bg-white px-6 py-3 text-base font-bold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none sm:w-auto" disabled={busy} onClick={start} type="button">Practice again</button>
          </> : <>
            <Link className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 motion-reduce:transition-none sm:w-auto" href="/today">Continue today</Link>
            <Link className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-blue-200 bg-white px-6 py-3 text-base font-bold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 motion-reduce:transition-none sm:w-auto" href="/practice">Practice another skill</Link>
          </>}
        </div>

        <nav aria-label="More practice actions" className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-bold text-blue-700">
          {hasMistakes ? <>
            <Link className="hover:text-blue-900 hover:underline" href="/mistakes">View mistakes</Link>
            <Link className="hover:text-blue-900 hover:underline" href={`/planner?source=practice&level=${session.level}&skill=${session.skill}`}>Update learning plan</Link>
            <Link className="hover:text-blue-900 hover:underline" href="/today">Continue today</Link>
          </> : <>
            <button className="hover:text-blue-900 hover:underline" disabled={busy} onClick={start} type="button">Practice again</button>
            <Link className="hover:text-blue-900 hover:underline" href={`/planner?source=practice&level=${session.level}&skill=${session.skill}`}>Update learning plan</Link>
          </>}
        </nav>
      </section>
    </main>;
  }

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
