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
  evidenceSummary: string;
  disclaimer: string;
  createdAt: string;
};

export default function PlacementResultClient({ resultId }: { resultId: string }) {
  const router = useRouter();
  const [result, setResult] = useState<Result>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/v1/placement?resultId=${encodeURIComponent(resultId)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { result?: Result; error?: string };
        if (!response.ok || !data.result) throw new Error(data.error ?? "PLACEMENT_RESULT_NOT_FOUND");
        if (active) setResult(data.result);
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

  const weakLabels = result.weakSkills.map((skill) => skill === "reading" ? "reading" : "vocabulary & grammar");
  const todayHref = `/today?level=${result.recommendedLevel}&source=placement&result=${encodeURIComponent(result.id)}`;
  const catalogLevel = result.recommendedLevel;
  return (
    <main className="mx-auto min-h-[70vh] max-w-4xl px-5 py-12 sm:py-16">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Your learning suggestion</p>
      <div className="mt-4 grid items-start gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-7 sm:p-10" aria-labelledby="result-heading">
          <p className="text-sm font-bold text-blue-800">Recommended starting point</p>
          <h1 className="mt-2 text-5xl font-black tracking-tight text-slate-950 sm:text-6xl" id="result-heading">Level {result.recommendedLevel}</h1>
          <span className="mt-5 inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">{result.confidence.toUpperCase()} confidence</span>
          <p className="mt-5 leading-7 text-slate-700">{result.evidenceSummary}</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{result.disclaimer}</p>
        </section>
        <aside className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm" aria-label="Evidence summary">
          <h2 className="text-xl font-black text-slate-950">Evidence used</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div><dt className="font-semibold text-slate-500">Correct</dt><dd className="mt-1 text-lg font-bold text-slate-950">{result.correctCount} / {result.totalCount}</dd></div>
            <div><dt className="font-semibold text-slate-500">Not measured</dt><dd className="mt-1 font-bold capitalize text-slate-950">{result.missingDimensions.join(", ")}</dd></div>
            <div><dt className="font-semibold text-slate-500">Needs more practice</dt><dd className="mt-1 font-bold text-slate-950">{weakLabels.length ? weakLabels.join(", ") : "No text-based weakness detected"}</dd></div>
          </dl>
        </aside>
      </div>
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-2xl font-black text-slate-950">Your next step</h2>
        <p className="mt-2 leading-7 text-slate-600">Use Level {result.recommendedLevel} as a starting point. Today will keep the source and can adjust the queue as more evidence becomes available.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 font-bold text-white" href={todayHref}>Start my Level {result.recommendedLevel} queue</Link>
          <Link className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-300 px-6 font-bold text-blue-800" href={`/vocabulary/${catalogLevel}`}>Open Level {catalogLevel} learning path</Link>
          <button className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-6 font-bold text-slate-800 disabled:opacity-50" disabled={restarting} onClick={restart} type="button">{restarting ? "Restarting…" : "Retake placement"}</button>
          <Link className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-5 font-bold text-slate-700 hover:border-blue-400 hover:text-blue-700" href="/levels">Compare levels</Link>
        </div>
        {error ? <p className="mt-4 text-sm text-red-700" role="alert">{error}</p> : null}
      </div>
    </main>
  );
}
