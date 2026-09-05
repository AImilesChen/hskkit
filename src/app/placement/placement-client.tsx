"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  standardVersion: string;
  contentVersion: string;
  level: number;
  skill: "vocabulary" | "grammar" | "vocabulary_grammar" | "reading" | "listening";
  prompt: string;
  context?: string;
  audioSrc?: string;
  options: Record<string, string>;
  publicationStatus: "diagnostic-only";
};
type Session = {
  id: string;
  questionVersion: string;
  questionIds: string[];
  answers: Array<{ questionId: string; answer: string }>;
  status: "in_progress" | "submitted" | "abandoned";
  expiresAt: string;
  adaptiveComplete?: boolean;
  adaptiveMinQuestions?: number;
  adaptiveMaxQuestions?: number;
  questions: Question[];
};

const key = (prefix: string) => `${prefix}:${crypto.randomUUID()}`;

type PlacementResponse = { session?: Session; result?: { id: string }; error?: string };

async function placementRequest(url: string, payload: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json() as PlacementResponse;
  if (!response.ok) throw new Error(data.error ?? "PLACEMENT_REQUEST_FAILED");
  return data;
}

async function loadPlacementSession() {
  const response = await fetch("/api/v1/placement/sessions", { cache: "no-store" });
  const data = await response.json() as { session: Session | null; expired?: boolean; error?: string };
  if (!response.ok) throw new Error(data.error ?? "PLACEMENT_LOAD_FAILED");
  return data;
}

export default function PlacementClient() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState<string>();

  async function load() {
    setLoading(true);
    setError(undefined);
    try {
      const data = await loadPlacementSession();
      setSession(data.session);
      setExpired(Boolean(data.expired));
    } catch (reason) {
      setSession(null);
      setError(reason instanceof Error ? reason.message : "PLACEMENT_LOAD_FAILED");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    loadPlacementSession()
      .then((data) => {
        if (!active) return;
        setSession(data.session);
        setExpired(Boolean(data.expired));
      })
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const answered = useMemo(() => new Map(
    session?.answers.map((answer) => [answer.questionId, answer.answer]) ?? [],
  ), [session]);
  const firstOpen = session?.questions.findIndex((question) => !answered.has(question.id)) ?? 0;
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const index = session ? Math.min(manualIndex ?? Math.max(firstOpen, 0), session.questions.length - 1) : 0;
  const question = session?.questions[index];

  async function start() {
    setSaving(true);
    setError(undefined);
    try {
      const data = await placementRequest("/api/v1/placement/sessions", { idempotencyKey: key("placement-start") });
      setSession(data.session ?? null);
      setExpired(false);
      setManualIndex(0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "PLACEMENT_START_FAILED");
    } finally {
      setSaving(false);
    }
  }

  async function choose(answer: string) {
    if (!session || !question) return;
    setSaving(true);
    setError(undefined);
    try {
      const data = await placementRequest(`/api/v1/attempts/${encodeURIComponent(session.id)}/submit`, {
        questionId: question.id,
        answer,
        idempotencyKey: `placement-answer:${session.id.slice(-24)}:${question.id.slice(-48)}:${answer}`,
      });
      setSession(data.session ?? session);
      setManualIndex(index);
    } catch (reason) {
      const code = reason instanceof Error ? reason.message : "PLACEMENT_ANSWER_FAILED";
      if (code === "PLACEMENT_SESSION_EXPIRED") {
        setSession(null);
        setExpired(true);
      }
      setError(code);
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    if (!session || !question || !answered.has(question.id)) return;
    if (index < session.questions.length - 1) {
      setManualIndex(index + 1);
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      const data = await placementRequest(`/api/v1/attempts/${encodeURIComponent(session.id)}/submit`, {
        finalize: true,
        idempotencyKey: `placement-submit:${session.id}`,
      });
      if (!data.result?.id) throw new Error("PLACEMENT_RESULT_NOT_FOUND");
      router.push(`/placement/result/${encodeURIComponent(data.result.id)}`);
    } catch (reason) {
      const code = reason instanceof Error ? reason.message : "PLACEMENT_SUBMIT_FAILED";
      if (code === "PLACEMENT_SESSION_EXPIRED") {
        setSession(null);
        setExpired(true);
      }
      setError(code);
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-16"><p role="status">Loading your placement session…</p></main>;
  }

  if (!session) {
    const noQuestions = error === "PLACEMENT_NO_QUESTIONS";
    const loadFailed = Boolean(error) && !expired && !noQuestions;
    return (
      <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-14 sm:py-20">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">HSKKit placement</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          {expired ? "Your saved placement session expired" : noQuestions ? "Placement is temporarily unavailable" : loadFailed ? "We couldn't load your placement" : "Find a practical starting level"}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          {expired ? "Placement sessions stay available for seven days. Start a new placement to continue." : noQuestions ? "No diagnostic questions are available right now. No empty or demo result will be generated." : loadFailed ? "Your saved answers have not been changed. Retry loading before starting a new session." : "Answer 18–24 adaptive questions across vocabulary, grammar, reading and listening. Difficulty adjusts to your answers, and progress is saved as you go."}
        </p>
        {!loadFailed && !noQuestions ? <div className="mt-7 grid gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-950 sm:grid-cols-3">
          <p><strong className="block text-slate-950">18–24 questions</strong>Difficulty adapts to your answers</p>
          <p><strong className="block text-slate-950">4 skill areas</strong>Vocabulary, grammar, reading and listening</p>
          <p><strong className="block text-slate-950">Saved as you go</strong>Refresh without losing completed answers</p>
        </div> : null}
        {!loadFailed && !noQuestions ? <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
          <summary className="cursor-pointer font-bold text-slate-800">How this placement works</summary>
          <p className="mt-3">The diagnostic uses an approved, versioned question set including three listening items. If listening evidence is unavailable, the result lowers confidence and states what was not measured instead of guessing.</p>
        </details> : null}
        {error && !expired ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800" role="alert">Could not load or start the diagnostic: {error}</p> : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {loadFailed || noQuestions
            ? <button className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700 disabled:opacity-60" disabled={loading} onClick={load} type="button">Try loading again</button>
            : <button className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700 disabled:opacity-60" disabled={saving} onClick={start} type="button">{saving ? "Starting…" : expired ? "Start a new placement" : "Start placement"}</button>}
          <Link className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-6 font-bold text-slate-800" href="/levels">Choose a level instead</Link>
        </div>
      </main>
    );
  }

  if (!question) return null;
  const selected = answered.get(question.id);
  const adaptiveTotal = session.adaptiveMaxQuestions ?? session.questions.length;
  const progress = session.adaptiveComplete && index === session.questions.length - 1
    ? 100
    : Math.round(((index + 1) / adaptiveTotal) * 100);
  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-10 sm:py-14">
      <div className="flex items-center justify-between gap-4 text-sm font-semibold text-slate-600">
        <span>{session.adaptiveMaxQuestions ? `Question ${index + 1} of up to ${session.adaptiveMaxQuestions}` : `Question ${index + 1} of ${session.questions.length}`}</span>
        <span>{progress}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200" aria-label={`${progress}% complete`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
      </div>
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9" aria-labelledby="placement-question">
        <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider text-blue-700"><span>HSK 3.0 diagnostic</span><span aria-hidden="true">·</span><span>{question.skill === "reading" ? "Reading" : question.skill === "listening" ? "Listening" : question.skill === "grammar" ? "Grammar" : question.skill === "vocabulary" ? "Vocabulary" : "Vocabulary & grammar"}</span></div>
        <h1 className="mt-4 text-2xl font-black leading-tight text-slate-950 sm:text-3xl" id="placement-question">{question.prompt}</h1>
        {question.context ? <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-lg leading-8 text-slate-900" lang="zh-Hans">{question.context}</p> : null}
        {question.audioSrc ? <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4"><audio className="w-full" controls preload="metadata" src={question.audioSrc}>Your browser cannot play this approved audio item.</audio><p className="mt-2 text-xs text-blue-800">Playback failures never submit an answer or change your learning state.</p></div> : null}
        <fieldset className="mt-6 grid gap-3" disabled={saving}>
          <legend className="sr-only">Choose one answer</legend>
          {Object.entries(question.options).map(([option, label]) => (
            <button
              aria-pressed={selected === option}
              className={`min-h-14 rounded-2xl border px-5 py-3 text-left font-semibold transition ${selected === option ? "border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-200" : "border-slate-300 bg-white text-slate-800 hover:border-blue-400"}`}
              key={option}
              onClick={() => choose(option)}
              type="button"
            >
              <span className="mr-3 inline-flex size-7 items-center justify-center rounded-full bg-slate-100 text-sm uppercase">{option}</span>{label}
            </button>
          ))}
        </fieldset>
        {error ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800" role="alert">Your answer was not saved: {error}. Try again.</p> : null}
        <div className="mt-8 flex items-center justify-between gap-3">
          <button className="min-h-11 rounded-xl px-4 font-bold text-slate-600 disabled:opacity-40" disabled={index === 0 || saving} onClick={() => setManualIndex(Math.max(0, index - 1))} type="button">Back</button>
          <button className="min-h-12 rounded-xl bg-blue-600 px-6 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!selected || saving} onClick={next} type="button">{saving ? "Saving…" : index === session.questions.length - 1 ? "See my result" : "Next"}</button>
        </div>
      </section>
      <p className="mt-5 text-center text-sm text-slate-500">Answers are saved to this guest session. <Link className="font-bold text-blue-700 underline-offset-2 hover:underline" href="/login">Sign in later</Link> to preview and confirm eligible progress before it is merged.</p>
    </main>
  );
}
