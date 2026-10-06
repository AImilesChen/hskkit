import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Step7ExerciseClient from "@/app/components/step7-exercise";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import { GRAMMAR_CURRICULUM, grammarLessonBySlug } from "@/lib/learning/step7-content";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return GRAMMAR_CURRICULUM.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = grammarLessonBySlug((await params).slug);
  return lesson ? { title: `${lesson.title} | HSKKit Grammar`, description: lesson.explanation, alternates: { canonical: `/grammar/${lesson.slug}` } } : { title: "Grammar lesson unavailable | HSKKit", robots: { index: false, follow: false } };
}
export default async function GrammarPage({ params }: Props) {
  const lesson = grammarLessonBySlug((await params).slug);
  if (!lesson) notFound();
  const currentIndex = GRAMMAR_CURRICULUM.findIndex((item) => item.slug === lesson.slug);
  const next = GRAMMAR_CURRICULUM[currentIndex + 1];
  return <><SiteHeader/><main className="learn step7-page grammar-page"><header><span className="eyebrow">Grammar · HSK {lesson.levelBand}</span><h1>{lesson.title}</h1><p>{lesson.explanation}</p><nav aria-label="Learning navigation"><Link href="/grammar">All grammar</Link><Link href="/mistakes?skill=grammar">Grammar mistakes</Link><Link href="/review">Review</Link></nav></header>
    <p className="step7-alert warning"><strong>Selected pattern:</strong> this lesson is part of a growing learning collection, not a complete official level syllabus.</p>
    <section className="grammar-lesson-body"><article className="card step7-lesson"><span className="eyebrow">Understand the pattern</span><h2>{lesson.pattern}</h2><div className="grammar-usage"><div><h3>When to use it</h3><p>{lesson.usage}</p></div><div><h3>Common confusion</h3><p>{lesson.pitfall}</p></div></div><h3>In context</h3><div className="step7-examples">{lesson.examples.map((example) => <div key={example.zh}><strong lang="zh-CN">{example.zh}</strong>{example.pinyin && <span>{example.pinyin}</span>}<p>{example.en}</p></div>)}</div>{lesson.readingSlug && <Link className="step7-related" href={`/reading/${lesson.readingSlug}`}>Read this pattern in a passage →</Link>}</article>
      <section className="grammar-practice" aria-label="Grammar practice"><div className="grammar-practice-intro"><span className="eyebrow">Apply and check</span><h2>Practice the pattern</h2><p>Answer both questions. Each answer saves separately; if you miss one, use Grammar mistakes to retry it.</p></div>{lesson.exercises.map((item, index) => <div key={item.id} className="grammar-question"><span className="eyebrow">Question {index + 1} of {lesson.exercises.length}</span><Step7ExerciseClient exercise={item} nextHref={index + 1 === lesson.exercises.length ? next ? `/grammar/${next.slug}` : "/grammar" : undefined} nextLabel={next ? "Continue to next pattern" : "Back to grammar lessons"}/></div>)}</section>
    </section>
    <div className="grammar-lesson-footer"><Link className="btn secondary" href="/grammar">Browse all grammar</Link><Link className="btn secondary" href="/mistakes?skill=grammar">Correct grammar mistakes</Link>{next && <Link className="btn" href={`/grammar/${next.slug}`}>Next pattern</Link>}</div>
  </main><SiteFooter/></>;
}
