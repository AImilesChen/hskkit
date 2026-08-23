import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Step7ExerciseClient from "@/app/components/step7-exercise";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import { READING_LESSONS, readingLessonBySlug } from "@/lib/learning/step7-content";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return READING_LESSONS.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = readingLessonBySlug((await params).slug);
  return lesson ? { title: `${lesson.title} | HSKKit Reading`, description: lesson.translation, alternates: { canonical: `/reading/${lesson.slug}` } } : { title: "Reading unavailable | HSKKit", robots: { index: false, follow: false } };
}
export default async function ReadingPage({ params }: Props) {
  const lesson = readingLessonBySlug((await params).slug);
  if (!lesson) notFound();
  return <><SiteHeader/><main className="learn step7-page"><header><span className="eyebrow">Reading · HSK {lesson.levelBand}</span><h1>{lesson.title}</h1><p>{lesson.questionType.replace("-", " ")} · {lesson.difficulty}. Read for meaning, review the linked grammar, then complete the task.</p><nav aria-label="Learning navigation"><Link href="/reading">All reading</Link><Link href={`/grammar/${lesson.grammarSlug}`}>Grammar</Link><Link href="/listen">Listening</Link><Link href="/planner">Planner</Link></nav></header>
    <p className="step7-alert warning"><strong>Published collection:</strong> this is one approved passage for the HSK {lesson.levelBand} path, not a claim of exhaustive official syllabus coverage.</p>
    <article className="card step7-reading"><p className="step7-chinese" lang="zh-CN">{lesson.text}</p><details><summary>Show translation</summary><p>{lesson.translation}</p></details><h2>Key vocabulary</h2><div className="step7-vocab">{lesson.vocabulary.map((word) => <div key={word.word}><strong lang="zh-CN">{word.word}</strong><span>{word.pinyin}</span><small>{word.meaning}</small></div>)}</div><Link className="step7-related" href={`/grammar/${lesson.grammarSlug}`}>Review the linked grammar →</Link></article>
    <Step7ExerciseClient exercise={lesson.exercise} nextHref={`/listen/advanced/${lesson.level >= 7 ? "hsk7-longer-discourse" : `hsk${lesson.level}-${["tone-pairs","syllable-discrimination","sentence-dictation","sentence-detail","paragraph-inference","context-intent"][lesson.level - 1]}`}`} nextLabel="Continue to listening"/>
  </main><SiteFooter/></>;
}
