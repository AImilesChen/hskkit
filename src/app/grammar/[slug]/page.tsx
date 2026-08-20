import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Step7ExerciseClient from "@/app/components/step7-exercise";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import { GRAMMAR_LESSONS, grammarBySlug } from "@/lib/learning/step7-content";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return GRAMMAR_LESSONS.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = grammarBySlug((await params).slug);
  return lesson ? { title: `${lesson.title} | HSKKit Grammar`, description: lesson.explanation } : { title: "Grammar lesson unavailable | HSKKit" };
}
export default async function GrammarPage({ params }: Props) {
  const lesson = grammarBySlug((await params).slug);
  if (!lesson) notFound();
  return <><SiteHeader/><main className="learn step7-page"><header><span className="eyebrow">Grammar · HSK {lesson.level}</span><h1>{lesson.title}</h1><p>{lesson.explanation}</p><nav aria-label="Learning navigation"><Link href="/today">Today</Link><Link href="/reading/morning-study-routine">Reading</Link><Link href="/listen">Listening</Link><Link href="/planner">Planner</Link></nav></header>
    <section className="step7-grid"><article className="card step7-lesson"><span className="eyebrow">Pattern</span><h2>{lesson.pattern}</h2><div className="step7-examples">{lesson.examples.map((example) => <div key={example.chinese}><strong lang="zh-CN">{example.chinese}</strong><span>{example.pinyin}</span><p>{example.english}</p></div>)}</div><Link className="step7-related" href={`/reading/${lesson.relatedReadingSlug}`}>Read the linked passage →</Link></article><Step7ExerciseClient exercise={lesson.exercise} nextHref={`/reading/${lesson.relatedReadingSlug}`} nextLabel="Continue to linked reading"/></section>
  </main><SiteFooter/></>;
}
