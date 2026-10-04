import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Step7ExerciseClient from "@/app/components/step7-exercise";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import { READING_LIBRARY_QUESTIONS, readingQuestionBySlug, readingSession, type ReadingLibrarySize } from "@/lib/learning/reading-library";
import { publishableReadingTranslation } from "@/lib/learning/reading-translation";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ size?: string; seed?: string; position?: string }> };
export function generateStaticParams() { return READING_LIBRARY_QUESTIONS.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = readingQuestionBySlug((await params).slug);
  return lesson ? { title: `${lesson.title} | HSKKit Reading Practice`, robots: { index: false, follow: false } } : { title: "Reading unavailable | HSKKit" };
}
export default async function ReadingSessionPage({ params, searchParams }: Props) {
  const slug = (await params).slug;
  const lesson = readingQuestionBySlug(slug);
  if (!lesson) notFound();
  const query = await searchParams;
  const size: ReadingLibrarySize = query.size === "20" ? 20 : 10;
  const seed = /^[a-zA-Z0-9_-]{1,40}$/.test(query.seed ?? "") ? query.seed! : "default";
  const requestedPosition = Number.parseInt(query.position ?? "0", 10);
  const position = Number.isInteger(requestedPosition) && requestedPosition >= 0 && requestedPosition < size ? requestedPosition : 0;
  const session = readingSession(lesson.level, size, seed);
  const found = session.questions[position]?.slug === slug ? position : session.questions.findIndex((question) => question.slug === slug);
  if (found < 0) notFound();
  const next = session.questions[found + 1];
  const nextHref = next ? `/reading/session/${next.slug}?size=${size}&seed=${seed}&position=${found + 1}` : `/reading/results?level=${lesson.level}&size=${size}&seed=${seed}`;
  const nextLabel = next ? `Continue HSK ${lesson.level} · ${found + 2} of ${size}` : "View session result";
  return <><SiteHeader/><main className="learn step7-page"><header><span className="eyebrow">Reading · HSK {lesson.level} · {found + 1} of {size}</span><h1>{lesson.title}</h1><p>{lesson.questionType.replaceAll("-", " ")} · {lesson.difficulty}. Read for meaning, answer, then continue inside this HSK {lesson.level} session.</p><nav aria-label="Learning navigation"><Link href="/reading">All reading</Link><Link href="/review">Review</Link><Link href="/mistakes">Mistakes</Link></nav></header>
    <article className="card step7-reading"><p className="step7-chinese" lang="zh-CN">{lesson.passage}</p>{publishableReadingTranslation(lesson.translation) ? <details><summary>Show English translation</summary><p>{lesson.translation}</p></details> : <p className="step7-translation-note">English translation is being reviewed. Use the vocabulary and answer explanation to check your reading.</p>}<h2>Key vocabulary</h2><div className="step7-vocab">{lesson.vocabulary.map((word) => <div key={word.word}><strong lang="zh-CN">{word.word}</strong><span>{word.pinyin}</span><small>{word.meaning}</small></div>)}</div></article>
    <Step7ExerciseClient exercise={lesson.exercise} nextHref={nextHref} nextLabel={nextLabel} readingSession={{ level: lesson.level, size, seed, position: found }}/>
  </main><SiteFooter/></>;
}
