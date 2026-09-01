import Link from "next/link";
import { categoryForTopic, type LearningTopic } from "@/lib/topics/catalog";
import { topicVisualFor } from "@/lib/topics/visuals";
import { TopicScene } from "./topic-visuals";

type Progress = { learned: number; total: number; percent: number };
type ProgressState = "ready" | "error" | "hidden";

function topicCta(progress: Progress | undefined, progressState: ProgressState) {
  if (progressState === "ready" && progress) {
    if (progress.learned === progress.total) return "Review topic";
    if (progress.learned > 0) return "Continue topic";
  }
  return "Explore topic";
}

export function TopicCard({ topic, progress, progressState = "hidden" }: { topic: LearningTopic; progress?: Progress; progressState?: ProgressState }) {
  const category = categoryForTopic(topic);
  const categorySlug = category?.slug ?? "daily-life";
  const visual = topicVisualFor(categorySlug);
  const cta = topicCta(progress, progressState);
  const ctaClass = cta === "Continue topic"
    ? "bg-blue-600 text-white hover:bg-blue-700"
    : cta === "Review topic"
      ? "border border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200"
      : "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100";

  return <article className={`group flex min-w-0 flex-col rounded-2xl border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)] focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 sm:p-5 ${visual.border}`}>
    <TopicScene topicSlug={topic.slug} categorySlug={categorySlug} title={topic.title} />
    <div className="mt-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className={`text-sm font-bold ${visual.mutedText}`}>{topic.titleZh}</p>
        <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">{topic.title}</h3>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-black capitalize ${visual.surface} ${visual.mutedText}`}>{topic.difficulty}</span>
    </div>
    <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{topic.description}</p>
    <div className="mt-3 flex flex-wrap gap-2">{progressState === "ready" && progress ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{progress.learned}/{progress.total} learned · {progress.percent}%</span> : progressState === "error" ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">Progress unavailable</span> : null}</div>
    <dl className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-3 text-center">
      <div><dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Words</dt><dd className="mt-1 text-sm font-bold text-slate-800">{topic.wordAssetIds.length}</dd></div>
      <div><dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">HSK</dt><dd className="mt-1 text-sm font-bold leading-5 text-slate-800">{topic.levelBands.join(", ")}</dd></div>
      <div><dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Time</dt><dd className="mt-1 text-sm font-bold text-slate-800">{topic.estimatedMinutes} min</dd></div>
    </dl>
    <Link href={`/topics/${topic.slug}`} className={`mt-4 inline-flex min-h-11 items-center justify-between rounded-xl px-4 font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${ctaClass}`}>
      {cta} <span aria-hidden="true">→</span>
    </Link>
  </article>;
}
