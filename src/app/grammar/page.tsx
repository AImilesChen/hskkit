import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import { GRAMMAR_LESSONS } from "@/lib/learning/step7-content";

export const metadata: Metadata = { title: "HSK 3.0 Grammar | HSKKit", description: "Seven approved grammar lessons across HSK Levels 1–6 and the unified HSK 7–9 advanced ability band.", alternates: { canonical: "/grammar" } };
export default function GrammarIndex() {
  return <><SiteHeader/><main className="learn step7-page"><header><span className="eyebrow">Formal grammar · 7 lessons</span><h1>Grammar across HSK 1–9</h1><p>Study one released structure for each Levels 1–6 path and the unified HSK 7–9 advanced ability band. Each lesson ends in a saved exercise.</p><nav aria-label="Learning navigation"><Link href="/reading">Reading</Link><Link href="/listen">Listening</Link><Link href="/mistakes">Mistakes</Link><Link href="/today">Today</Link></nav></header><p className="step7-alert warning"><strong>Coverage boundary:</strong> these are approved full lessons in the active release, not an exhaustive official grammar syllabus.</p><section className="step7-grid">{GRAMMAR_LESSONS.map((lesson) => <article className="card" key={lesson.slug}><span className="eyebrow">HSK {lesson.levelBand}</span><h2>{lesson.title}</h2><p>{lesson.explanation}</p><Link className="btn" href={`/grammar/${lesson.slug}`}>Open lesson</Link></article>)}</section></main><SiteFooter/></>;
}
