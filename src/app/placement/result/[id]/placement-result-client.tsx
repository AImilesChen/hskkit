"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Result = {
  id: string;
  sessionId: string;
  questionVersion: string;
  recommendedLevel: number;
  correctCount: number;
  totalCount: number;
  confidence: "low" | "medium" | "high";
  missingDimensions: string[];
  weakSkills: string[];
  skillPerformance?: Record<string, { correct: number; total: number; accuracy: number }>;
  evidenceSummary: string;
  disclaimer: string;
  createdAt: string;
  retakeAvailableAt?: string;
};

export default function PlacementResultClient({ resultId }: { resultId: string }) {
  const router = useRouter();
  const [result, setResult] = useState<Result>();
  const [selectedLevel, setSelectedLevel] = useState<number>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/v1/placement?resultId=${encodeURIComponent(resultId)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { result?: Result; error?: string };
        if (!response.ok || !data.result) throw new Error(data.error ?? "PLACEMENT_RESULT_NOT_FOUND");
        if (active) {
          setResult(data.result);
          setSelectedLevel(Math.min(data.result.recommendedLevel, 7));
        }
      })
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [resultId]);

  async function restart() {
    if (!result) return;
    setRestarting(true);
    setError(undefined);
    try {
      const response = await fetch("/api/v1/placement", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "restart",
          payload: {
            previousSessionId: result.sessionId,
            idempotencyKey: `placement-restart:${result.id}:${crypto.randomUUID()}`,
          },
        }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "PLACEMENT_RESTART_FAILED");
      router.push("/placement");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "PLACEMENT_RESTART_FAILED");
      setRestarting(false);
    }
  }

  if (loading) return <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-16"><p role="status">Loading your placement result…</p></main>;
  if (!result) {
    return (
      <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-16">
        <h1 className="text-3xl font-black text-slate-950">This result is not available</h1>
        <p className="mt-4 text-slate-600">It may belong to another guest session or may no longer exist.</p>
        {error ? <p className="mt-4 text-sm text-red-700" role="alert">{error}</p> : null}
        <Link className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-blue-600 px-6 font-bold text-white" href="/placement">Start placement</Link>
      </main>
    );
  }

  const weakLabels = result.weakSkills.map((skill) => skill === "reading" ? "Reading" : skill === "listening" ? "Listening" : "Vocabulary & grammar");
  const primaryWeakSkill = weakLabels[0] ?? "Vocabulary & grammar";
  const practiceSkill = result.weakSkills.includes("listening") ? "listening" : result.weakSkills.includes("reading") ? "reading" : "vocabulary";
  const learningLevel = selectedLevel ?? result.recommendedLevel;
  const levelLabel = (level: number) => level >= 7 ? "HSK 7–9" : `HSK ${level}`;
  const learningHref = `/vocabulary/${learningLevel}?mode=flashcards#vocabulary-activities`;
  const catalogLevel = learningLevel;
  const practiceHref = `/practice/${Math.min(learningLevel, 7)}/${practiceSkill}`;
  const skillLabels: Record<string, string> = { vocabulary: "Vocabulary", grammar: "Grammar", reading: "Reading", listening: "Listening" };
  const retakeAvailable = !result.retakeAvailableAt || Date.now() >= Date.parse(result.retakeAvailableAt);
  return (
    <main className="mx-auto min-h-[70vh] max-w-4xl px-5 py-5 sm:py-14">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Your placement result</p>
      <section className="mt-2 rounded-3xl border border-blue-200 bg-blue-50 p-4 sm:mt-4 sm:p-9" aria-labelledby="result-heading">
        <div className="grid gap-4 lg:grid-cols-[1fr_.8fr] lg:items-start lg:gap-7">
          <div>
            <p className="text-sm font-bold text-blue-800">Test suggestion</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:mt-2 sm:text-5xl" id="result-heading">{levelLabel(result.recommendedLevel)}</h1>
            <span className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900 sm:mt-4">{result.confidence.toUpperCase()} confidence</span>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 sm:mt-4 sm:text-base sm:leading-7">{result.evidenceSummary}</p>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm sm:gap-3 lg:grid-cols-1">
            <div className="rounded-2xl bg-white p-3 sm:p-4"><dt className="font-bold text-slate-500">Your strengths</dt><dd className="mt-1 font-black text-slate-950 sm:text-lg">{result.correctCount} / {result.totalCount} correct</dd></div>
            <div className="rounded-2xl bg-white p-3 sm:p-4"><dt className="font-bold text-slate-500">Focus areas</dt><dd className="mt-1 font-bold text-slate-950">{weakLabels.length ? weakLabels.join(", ") : "Keep building across all measured skills"}</dd></div>
            {result.missingDimensions.length ? <div className="col-span-2 rounded-2xl bg-white p-3 sm:p-4 lg:col-span-1"><dt className="font-bold text-slate-500">Not measured</dt><dd className="mt-1 font-bold capitalize text-slate-950">{result.missingDimensions.join(", ")}</dd></div> : null}
          </dl>
        </div>
        <section className="mt-5 border-t border-blue-200 pt-5" aria-labelledby="skill-performance-title">
          <h2 id="skill-performance-title" className="text-lg font-black text-slate-950">Your skill performance</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(skillLabels).map(([skill, label]) => {
              const performance = result.skillPerformance?.[skill];
              return <article className="rounded-2xl bg-white p-3" key={skill}>
                <p className="text-sm font-bold text-slate-600">{label}</p>
                <strong className="mt-1 block text-xl font-black text-slate-950">{performance ? `${performance.accuracy}%` : "—"}</strong>
                <p className="mt-1 text-xs text-slate-500">{performance ? `${performance.correct}/${performance.total} correct` : "Not measured"}</p>
              </article>;
            })}
          </div>
        </section>
        <div className="mt-5 rounded-2xl border border-blue-200 bg-white p-4">
          <label className="font-black text-slate-950" htmlFor="placement-level">Adjust your starting level</label>
          <p className="mt-1 text-sm leading-6 text-slate-600">The test suggestion stays visible; choose a different starting point if it better matches your goal.</p>
          <select className="mt-3 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-bold text-slate-950 sm:max-w-xs" id="placement-level" value={learningLevel} onChange={(event) => setSelectedLevel(Number(event.target.value))}>
            {[1, 2, 3, 4, 5, 6, 7].map((level) => <option key={level} value={level}>{levelLabel(level)}</option>)}
          </select>
        </div>
        <div className="mt-4 border-t border-blue-200 pt-4 sm:mt-7 sm:pt-6">
          <h2 className="text-lg font-black text-slate-950 sm:text-xl">Continue from this result</h2>
          <p className="mt-1 text-sm leading-6 text-slate-700 sm:mt-2 sm:text-base sm:leading-7">Begin at {levelLabel(learningLevel)}, or work directly on your clearest focus area.</p>
          <div className="mt-3 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:gap-3">
            <Link className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700" href={learningHref}>Start learning {levelLabel(learningLevel)}</Link>
            <Link className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-300 bg-white px-6 font-bold text-blue-800 hover:border-blue-500" href={practiceHref}>Practice {primaryWeakSkill}</Link>
          </div>
        </div>
      </section>
      <details className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer font-bold text-slate-900">More options</summary>
        <p className="mt-3 text-sm leading-6 text-slate-600">{result.disclaimer}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 font-bold text-slate-700 hover:border-blue-400 hover:text-blue-700" href={`/planner?source=placement&level=${learningLevel}&result=${encodeURIComponent(result.id)}`}>Create or update learning plan</Link>
          <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 font-bold text-slate-700 hover:border-blue-400 hover:text-blue-700" href={`/vocabulary/${catalogLevel}`}>Open Level {catalogLevel} learning path</Link>
          <button className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={restarting || !retakeAvailable} onClick={restart} type="button">{restarting ? "Restarting…" : retakeAvailable ? "Retake placement" : `Retake available ${new Date(result.retakeAvailableAt!).toLocaleString()}`}</button>
          <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 font-bold text-slate-700 hover:border-blue-400 hover:text-blue-700" href="/levels">Compare levels</Link>
        </div>
      </details>
      {error ? <p className="mt-4 text-sm text-red-700" role="alert">{error}</p> : null}
    </main>
  );
}
