"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  standardVersion: string;
  contentVersion: string;
  level: number;
  skill: "vocabulary_grammar" | "reading";
  prompt: string;
  context?: string;
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
        idempotencyKey: `placement-answer:${session.id.slice(-24)}:${question.id}:${answer}`,
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
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">HSKKit diagnostic · version 1</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          {expired ? "Your saved placement session expired" : noQuestions ? "Placement is temporarily unavailable" : loadFailed ? "We couldn't load your placement" : "Find a practical starting level"}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          {expired ? "Placement sessions stay available for seven days. Start a new version-locked session to continue." : noQuestions ? "No approved versioned diagnostic questions are available right now. No empty or demo result will be generated." : loadFailed ? "Your saved answers have not been changed. Retry loading before starting a new session." : "Answer nine vocabulary, grammar, and reading questions. Your progress is saved after every answer, so you can refresh and continue."}
        </p>
        {!loadFailed && !noQuestions ? <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          <strong>Current evidence limit:</strong> listening is not measured because an approved audio diagnostic set is not yet published. Every result is therefore shown with low confidence and is only a learning suggestion.
        </div> : null}
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
  const progress = Math.round(((index + 1) / session.questions.length) * 100);
  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-10 sm:py-14">
      <div className="flex items-center justify-between gap-4 text-sm font-semibold text-slate-600">
        <span>Question {index + 1} of {session.questions.length}</span>
        <span>{progress}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200" aria-label={`${progress}% complete`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
      </div>
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9" aria-labelledby="placement-question">
        <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider text-blue-700"><span>HSK 3.0 diagnostic</span><span aria-hidden="true">·</span><span>{question.skill === "reading" ? "Reading" : "Vocabulary & grammar"}</span></div>
        <h1 className="mt-4 text-2xl font-black leading-tight text-slate-950 sm:text-3xl" id="placement-question">{question.prompt}</h1>
        {question.context ? <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-lg leading-8 text-slate-900" lang="zh-Hans">{question.context}</p> : null}
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
      <p className="mt-5 text-center text-sm text-slate-500">Answers are saved to this guest session. Sign in later to merge eligible progress.</p>
    </main>
  );
}
