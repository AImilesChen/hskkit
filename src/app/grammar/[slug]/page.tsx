import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Step7ExerciseClient from "@/app/components/step7-exercise";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import { GRAMMAR_LESSONS, grammarLessonBySlug } from "@/lib/learning/step7-content";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return GRAMMAR_LESSONS.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = grammarLessonBySlug((await params).slug);
  return lesson ? { title: `${lesson.title} | HSKKit Grammar`, description: lesson.explanation, alternates: { canonical: `/grammar/${lesson.slug}` } } : { title: "Grammar lesson unavailable | HSKKit", robots: { index: false, follow: false } };
}
export default async function GrammarPage({ params }: Props) {
  const lesson = grammarLessonBySlug((await params).slug);
  if (!lesson) notFound();
  return <><SiteHeader/><main className="learn step7-page"><header><span className="eyebrow">Grammar · HSK {lesson.levelBand}</span><h1>{lesson.title}</h1><p>{lesson.explanation}</p><nav aria-label="Learning navigation"><Link href="/grammar">All grammar</Link><Link href="/reading">Reading</Link><Link href="/listen">Listening</Link><Link href="/planner">Planner</Link></nav></header>
    <p className="step7-alert warning"><strong>Published collection:</strong> this is one approved lesson for the HSK {lesson.levelBand} path, not a claim of exhaustive official syllabus coverage.</p>
    <section className="step7-grid"><article className="card step7-lesson"><span className="eyebrow">Pattern</span><h2>{lesson.pattern}</h2><div className="step7-examples">{lesson.examples.map((example) => <div key={example.zh}><strong lang="zh-CN">{example.zh}</strong><p>{example.en}</p></div>)}</div><Link className="step7-related" href={`/reading/${lesson.readingSlug}`}>Read the linked passage →</Link></article><Step7ExerciseClient exercise={lesson.exercise} nextHref={`/reading/${lesson.readingSlug}`} nextLabel="Continue to linked reading"/></section>
  </main><SiteFooter/></>;
}
