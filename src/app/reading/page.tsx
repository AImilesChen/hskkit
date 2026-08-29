import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import { ReadingResume } from "@/app/components/reading-session-state";
import { READING_LIBRARY_COUNTS } from "@/lib/learning/reading-library";
import { READING_LESSONS } from "@/lib/learning/step7-content";

export const metadata: Metadata = { title: "HSK 1–9 Reading Practice | HSKKit", description: "Start a verified 10- or 20-question HSK 1–9 reading session with same-level progression and saved results.", alternates: { canonical: "/reading" } };
export default function ReadingIndex() {
  return <><SiteHeader/><main className="learn step7-page"><header><span className="eyebrow">HSK 1–9 · Reading practice</span><h1>HSKKit levelled reading practice library</h1><p>Choose a level and complete a 10- or 20-question session. Every next question stays inside your selected HSK reading level.</p><nav aria-label="Learning navigation"><Link href="/review">Review</Link><Link href="/mistakes">Mistakes</Link><Link href="/today">Today</Link><Link href="/planner">Planner</Link></nav></header>
    <ReadingResume/>
    <section className="mb-10" aria-labelledby="reading-library-heading"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 id="reading-library-heading" className="mb-1">Choose your reading level</h2><p className="text-slate-500">{READING_LIBRARY_COUNTS.passages} approved passages · {READING_LIBRARY_COUNTS.questions} scored questions</p></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{READING_LIBRARY_COUNTS.byLevel.map((row) => <article className="card flex flex-col" key={row.level}><span className="eyebrow">{row.level >= 7 ? `Advanced 7–9 · HSKKit difficulty ${row.level}` : `HSK ${row.level}`}</span><h2>HSK {row.level} reading</h2><p className="grow">{row.passages} verified passages · {row.questions} scored questions{row.level >= 7 ? " · independent advanced difficulty layer" : ""}</p><div className="mt-4 flex flex-wrap gap-2"><Link className="btn" href={`/reading/start?level=${row.level}&size=10`}>10 questions</Link><Link className="btn secondary" href={`/reading/start?level=${row.level}&size=20`}>20 questions</Link></div></article>)}</div><p className="step7-alert warning mt-5"><strong>Coverage boundary:</strong> HSKKit-authored practice based on the HSK 3.0 standard; this is not an official exam question bank.</p></section>
    <details><summary className="cursor-pointer font-semibold text-slate-800">Published single-passage collection</summary><section className="step7-grid mt-5">{READING_LESSONS.map((lesson) => <article className="card" key={lesson.slug}><span className="eyebrow">HSK {lesson.levelBand} · {lesson.difficulty}</span><h2>{lesson.title}</h2><p>{lesson.questionType.replace("-", " ")}</p><Link className="btn secondary" href={`/reading/${lesson.slug}`}>Open passage</Link></article>)}</section></details>
  </main><SiteFooter/></>;
}
