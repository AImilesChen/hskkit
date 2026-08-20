import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Step7ExerciseClient from "@/app/components/step7-exercise";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import { READING_LESSONS, readingBySlug } from "@/lib/learning/step7-content";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return READING_LESSONS.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = readingBySlug((await params).slug);
  return lesson ? { title: `${lesson.title} | HSKKit Reading`, description: lesson.translation } : { title: "Reading unavailable | HSKKit" };
}
export default async function ReadingPage({ params }: Props) {
  const lesson = readingBySlug((await params).slug);
  if (!lesson) notFound();
  return <><SiteHeader/><main className="learn step7-page"><header><span className="eyebrow">Reading · HSK {lesson.level}</span><h1>{lesson.title}</h1><p>Read for meaning, check the linked grammar, then complete the comprehension task.</p><nav aria-label="Learning navigation"><Link href="/today">Today</Link><Link href={`/grammar/${lesson.relatedGrammarSlug}`}>Grammar</Link><Link href="/listen">Listening</Link><Link href="/planner">Planner</Link></nav></header>
    <article className="card step7-reading"><p className="step7-chinese" lang="zh-CN">{lesson.passage}</p><p>{lesson.pinyin}</p><details><summary>Show translation</summary><p>{lesson.translation}</p></details><h2>Key vocabulary</h2><div className="step7-vocab">{lesson.vocabulary.map((word) => <div key={word.hanzi}><strong lang="zh-CN">{word.hanzi}</strong><span>{word.pinyin}</span><small>{word.meaning}</small></div>)}</div><Link className="step7-related" href={`/grammar/${lesson.relatedGrammarSlug}`}>Review the linked grammar →</Link></article>
    <Step7ExerciseClient exercise={lesson.exercise} nextHref="/listen/advanced/hsk2-syllable-discrimination" nextLabel="Continue to listening"/>
  </main><SiteFooter/></>;
}
