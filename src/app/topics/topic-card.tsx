import Link from "next/link";
import type { LearningTopic } from "@/lib/topics/catalog";

export function TopicCard({ topic, progress, progressState = "hidden" }: { topic: LearningTopic; progress?: { learned: number; total: number; percent: number }; progressState?: "ready" | "error" | "hidden" }) {
  return <article className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_18px_45px_-32px_rgba(37,99,235,0.55)] focus-within:border-blue-400 sm:p-6">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-bold text-blue-700">{topic.titleZh}</p>
        <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">{topic.title}</h3>
      </div>
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-950 text-lg font-bold text-white" lang="zh-Hans" aria-hidden="true">{topic.marker}</span>
    </div>
    <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{topic.description}</p>
    <div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold capitalize text-blue-800">{topic.difficulty}</span>{progressState === "ready" && progress ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{progress.learned}/{progress.total} learned · {progress.percent}%</span> : progressState === "error" ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">Progress unavailable</span> : null}</div>
    <dl className="mt-5 grid grid-cols-3 gap-2 border-y border-slate-100 py-3 text-center">
      <div><dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Mapped</dt><dd className="mt-1 text-sm font-bold text-slate-800">{topic.wordAssetIds.length} words</dd></div>
      <div><dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">HSK</dt><dd className="mt-1 text-sm font-bold leading-5 text-slate-800">{topic.levelBands.join(", ")}</dd></div>
      <div><dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Time</dt><dd className="mt-1 text-sm font-bold text-slate-800">{topic.estimatedMinutes} min</dd></div>
    </dl>
    <Link href={`/topics/${topic.slug}`} className="mt-5 inline-flex min-h-11 items-center justify-between rounded-xl bg-blue-600 px-4 font-bold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
      View topic <span aria-hidden="true">→</span>
    </Link>
  </article>;
}
