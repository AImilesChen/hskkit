"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadPlacementSession, placementPublicError, placementRetakeLocked } from "./client-recovery";

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

type PlacementStatus = "active" | "cooldown" | "ready" | "expired";
type PlacementResponse = {
  session?: Session;
  result?: { id: string };
  error?: string;
  status?: PlacementStatus;
  latestResultId?: string | null;
  retakeAvailableAt?: string | null;
  canRetake?: boolean;
  serverNow?: string;
};

class PlacementRequestError extends Error {
  readonly details: PlacementResponse;

  constructor(details: PlacementResponse) {
    super(details.error ?? "PLACEMENT_REQUEST_FAILED");
    this.details = details;
  }
}

async function placementRequest(url: string, payload: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json() as PlacementResponse;
  if (!response.ok) throw new PlacementRequestError(data);
  return data;
}

function retakeCountdown(availableAt: string, nowMs: number) {
  const remainingMinutes = Math.max(0, Math.ceil((Date.parse(availableAt) - nowMs) / 60_000));
  if (remainingMinutes === 0) return "now";
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;
  if (hours === 0) return `in ${minutes} min`;
  return `in ${hours} hr${hours === 1 ? "" : "s"}${minutes ? ` ${minutes} min` : ""}`;
}

export default function PlacementClient() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [expired, setExpired] = useState(false);
  const [placementStatus, setPlacementStatus] = useState<PlacementStatus>("ready");
  const [latestResultId, setLatestResultId] = useState<string>();
  const [retakeAvailableAt, setRetakeAvailableAt] = useState<string>();
  const [canRetake, setCanRetake] = useState(true);
  const [serverClockOffsetMs, setServerClockOffsetMs] = useState(0);
  const [loadError, setLoadError] = useState<string>();
  const [startError, setStartError] = useState<string>();
  const [answerError, setAnswerError] = useState<string>();
  const [nowMs, setNowMs] = useState(() => Date.now());

  const applyOverview = useCallback((data: {
    session: Session | null;
    expired?: boolean;
    status?: PlacementStatus;
    latestResultId?: string | null;
    retakeAvailableAt?: string | null;
    canRetake?: boolean;
    serverNow?: string;
  }) => {
    setSession(data.session);
    setExpired(Boolean(data.expired));
    setPlacementStatus(data.status ?? (data.expired ? "expired" : data.session ? "active" : "ready"));
    setLatestResultId(data.latestResultId ?? undefined);
    setRetakeAvailableAt(data.retakeAvailableAt ?? undefined);
    setCanRetake(data.canRetake ?? data.status !== "cooldown");
    const serverNowMs = data.serverNow ? Date.parse(data.serverNow) : Number.NaN;
    if (Number.isFinite(serverNowMs)) {
      setServerClockOffsetMs(serverNowMs - Date.now());
      setNowMs(serverNowMs);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setReconnecting(false);
    setLoadError(undefined);
    setStartError(undefined);
    try {
      const data = await loadPlacementSession<Session>({ onRetry: () => setReconnecting(true) });
      applyOverview(data);
    } catch (reason) {
      setSession(null);
      setLoadError(reason instanceof Error ? reason.message : "PLACEMENT_LOAD_FAILED");
    } finally {
      setReconnecting(false);
      setLoading(false);
    }
  }, [applyOverview]);

  useEffect(() => {
    let active = true;
    loadPlacementSession<Session>({ onRetry: () => active && setReconnecting(true) })
      .then((data) => {
        if (!active) return;
        applyOverview(data);
      })
      .catch((reason: Error) => active && setLoadError(reason.message))
      .finally(() => {
        if (!active) return;
        setReconnecting(false);
        setLoading(false);
      });
    return () => { active = false; };
  }, [applyOverview]);

  useEffect(() => {
    if (placementStatus !== "cooldown" || !retakeAvailableAt) return;
    const tick = () => setNowMs(Date.now() + serverClockOffsetMs);
    const timer = window.setInterval(tick, 60_000);
    const remainingMs = Date.parse(retakeAvailableAt) - (Date.now() + serverClockOffsetMs);
    const boundaryTimer = Number.isFinite(remainingMs)
      ? window.setTimeout(() => { void load(); }, Math.max(1_000, remainingMs + 1_000))
      : undefined;
    return () => {
      window.clearInterval(timer);
      if (boundaryTimer !== undefined) window.clearTimeout(boundaryTimer);
    };
  }, [load, placementStatus, retakeAvailableAt, serverClockOffsetMs]);

  const answered = useMemo(() => new Map(
    session?.answers.map((answer) => [answer.questionId, answer.answer]) ?? [],
  ), [session]);
  const firstOpen = session?.questions.findIndex((question) => !answered.has(question.id)) ?? 0;
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const index = session ? Math.min(manualIndex ?? Math.max(firstOpen, 0), session.questions.length - 1) : 0;
  const question = session?.questions[index];

  async function start() {
    setSaving(true);
    setStartError(undefined);
    setAnswerError(undefined);
    try {
      const data = await placementRequest("/api/v1/placement/sessions", { idempotencyKey: key("placement-start") });
      setSession(data.session ?? null);
      setExpired(false);
      setPlacementStatus("active");
      setManualIndex(0);
    } catch (reason) {
      if (reason instanceof PlacementRequestError && reason.details.status === "cooldown") {
        applyOverview({ session: null, ...reason.details });
      } else {
        setStartError(reason instanceof Error ? reason.message : "PLACEMENT_START_FAILED");
      }
    } finally {
      setSaving(false);
    }
  }

  async function choose(answer: string) {
    if (!session || !question) return;
    setSaving(true);
    setAnswerError(undefined);
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
        setPlacementStatus("expired");
      }
      setAnswerError(code);
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
    setAnswerError(undefined);
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
        setPlacementStatus("expired");
      }
      setAnswerError(code);
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-16"><p role="status">{reconnecting ? "Restoring your placement session…" : "Loading your placement session…"}</p></main>;
  }

  if (!session) {
    const noQuestions = loadError === "no_questions";
    const temporarilyUnavailable = loadError === "temporarily_unavailable";
    const loadFailed = Boolean(loadError) && !noQuestions;
    const retakeAtMs = retakeAvailableAt ? Date.parse(retakeAvailableAt) : Number.NaN;
    const cooldownActive = placementStatus === "cooldown";
    const retakeLocked = placementRetakeLocked(placementStatus, canRetake);
    const latestReady = placementStatus === "ready" && Boolean(latestResultId) && !loadError;
    const retakeAtLabel = Number.isFinite(retakeAtMs)
      ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(retakeAtMs))
      : undefined;
    return (
      <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-14 sm:py-20">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">HSKKit placement</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          {cooldownActive || latestReady ? "Your latest placement is ready" : expired ? "Your saved placement session expired" : noQuestions ? "Placement is temporarily unavailable" : temporarilyUnavailable ? "Placement is temporarily busy" : loadFailed ? "We couldn't load your placement" : "Find a practical starting level"}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          {cooldownActive ? `View your latest result now. You can retake the placement ${retakeAvailableAt ? retakeCountdown(retakeAvailableAt, nowMs) : "after the 24-hour cooldown"}.` : latestReady ? "Review your latest result or start a new placement when you are ready." : expired ? "Placement sessions stay available for seven days. Start a new placement to continue." : noQuestions ? "No diagnostic questions are available right now. No empty or demo result will be generated." : temporarilyUnavailable ? "Your saved answers are safe. Please try again." : loadFailed ? "Your saved answers have not been changed. Retry loading before starting a new session." : "Start with 12 questions across vocabulary, grammar, reading and listening. The test then adapts to your answers and finishes in 18–24 questions, with progress saved as you go."}
        </p>
        {cooldownActive && retakeAtLabel ? <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-950" id="placement-retake-availability" role="status">Retake available {retakeAtLabel} ({retakeCountdown(retakeAvailableAt!, nowMs)}).</p> : null}
        {!loadFailed && !noQuestions && !latestResultId ? <div className="mt-7 grid gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-950 sm:grid-cols-3">
          <p><strong className="block text-slate-950">First 12 questions</strong>Balanced across skills and difficulty</p>
          <p><strong className="block text-slate-950">4 skill areas</strong>Vocabulary, grammar, reading and listening</p>
          <p><strong className="block text-slate-950">Saved as you go</strong>Your answers are saved as you go</p>
        </div> : null}
        {!loadFailed && !noQuestions && !latestResultId ? <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
          <summary className="cursor-pointer font-bold text-slate-800">How this placement works</summary>
          <p className="mt-3">The diagnostic uses an approved, versioned question set including three listening items. If listening evidence is unavailable, the result lowers confidence and states what was not measured instead of guessing.</p>
        </details> : null}
        {loadError && !expired && !noQuestions ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800" role="alert">{placementPublicError(loadError)}</p> : null}
        {startError ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800" role="alert">{placementPublicError(startError)}</p> : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {loadFailed || noQuestions
            ? <button className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700 disabled:opacity-60" disabled={loading} onClick={load} type="button">Try loading again</button>
            : latestResultId
              ? <>
                  <Link className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700" href={`/placement/result/${encodeURIComponent(latestResultId)}`}>View my result</Link>
                  <button aria-describedby={cooldownActive && retakeAtLabel ? "placement-retake-availability" : undefined} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 font-bold text-slate-800 hover:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" disabled={saving || retakeLocked} onClick={start} type="button">{saving ? "Starting…" : cooldownActive ? `Retake available ${retakeAvailableAt ? retakeCountdown(retakeAvailableAt, nowMs) : "later"}` : "Retake placement"}</button>
                </>
              : <button className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700 disabled:opacity-60" disabled={saving || retakeLocked} onClick={start} type="button">{saving ? "Starting…" : expired ? "Start a new placement" : "Start placement"}</button>}
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
        {selected && !answerError ? <p className="mt-5 text-sm font-bold text-emerald-700" role="status">Progress saved</p> : null}
        {answerError ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800" role="alert">{placementPublicError(answerError)}</p> : null}
        <div className="mt-8 flex items-center justify-between gap-3">
          <button className="min-h-11 rounded-xl px-4 font-bold text-slate-600 disabled:opacity-40" disabled={index === 0 || saving} onClick={() => setManualIndex(Math.max(0, index - 1))} type="button">Back</button>
          <button className="min-h-12 rounded-xl bg-blue-600 px-6 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!selected || saving} onClick={next} type="button">{saving ? "Saving…" : session.adaptiveMaxQuestions ? session.adaptiveComplete ? "See my result" : "Next" : index === session.questions.length - 1 ? "See my result" : "Next"}</button>
        </div>
      </section>
      <p className="mt-5 text-center text-sm text-slate-500">Answers are saved to this guest session. <Link className="font-bold text-blue-700 underline-offset-2 hover:underline" href="/login">Sign in later</Link> to preview and confirm eligible progress before it is merged.</p>
    </main>
  );
}
