import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import { READING_LESSONS } from "@/lib/learning/step7-content";

export const metadata: Metadata = { title: "HSK 3.0 Reading | HSKKit", description: "Seven approved reading lessons with level, question type and difficulty labels.", alternates: { canonical: "/reading" } };
export default function ReadingIndex() {
  return <><SiteHeader/><main className="learn step7-page"><header><span className="eyebrow">Formal reading · 7 passages</span><h1>Reading across HSK 1–9</h1><p>Move from direct detail to critical evaluation. Every passage is levelled, typed, difficulty-labelled and linked to saved practice.</p><nav aria-label="Learning navigation"><Link href="/grammar">Grammar</Link><Link href="/listen">Listening</Link><Link href="/mistakes">Mistakes</Link><Link href="/today">Today</Link></nav></header><p className="step7-alert warning"><strong>Coverage boundary:</strong> these are approved full passages in the active release, not an exhaustive official reading syllabus.</p><section className="step7-grid">{READING_LESSONS.map((lesson) => <article className="card" key={lesson.slug}><span className="eyebrow">HSK {lesson.levelBand} · {lesson.difficulty}</span><h2>{lesson.title}</h2><p>{lesson.questionType.replace("-", " ")}</p><Link className="btn" href={`/reading/${lesson.slug}`}>Open passage</Link></article>)}</section></main><SiteFooter/></>;
}
