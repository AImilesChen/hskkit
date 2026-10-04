import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Step7ExerciseClient from "@/app/components/step7-exercise";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import { READING_LIBRARY_QUESTIONS } from "@/lib/learning/reading-library";
import { publishableReadingTranslation } from "@/lib/learning/reading-translation";

type Props = { params: Promise<{ slug: string }> };
const passageQuestions = READING_LIBRARY_QUESTIONS.filter((question) => question.questionIndex === 0);
export function generateStaticParams() { return passageQuestions.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const question = passageQuestions.find((item) => item.slug === slug);
  return question ? { title: `${question.title} · HSK ${question.level} Short Reading | HSKKit`, description: `Read a short HSK ${question.level} passage and answer three comprehension questions.`, robots: { index: false, follow: true }, alternates: { canonical: `/reading/passage/${question.slug}` } } : { title: "Passage unavailable | HSKKit", robots: { index: false, follow: false } };
}
export default async function ShortReadingPage({ params }: Props) {
  const { slug } = await params;
  const first = passageQuestions.find((item) => item.slug === slug);
  if (!first) notFound();
  const questions = READING_LIBRARY_QUESTIONS.filter((question) => question.passageId === first.passageId);
  const translation = publishableReadingTranslation(first.translation);
  return <><SiteHeader/><main className="learn step7-page"><header><span className="eyebrow">HSK {first.level} · Short practice passage</span><h1>{first.title}</h1><p>Read this brief passage, then answer three scored questions. For longer texts, open the article collection.</p><nav aria-label="Reading navigation"><Link href="/reading#articles">All reading</Link><Link href={`/reading/start?level=${first.level}&size=10`}>HSK {first.level} practice session</Link></nav></header>
    <article className="card step7-reading"><p className="step7-chinese" lang="zh-CN">{first.passage}</p>{translation ? <details><summary>Show English translation</summary><p>{translation}</p></details> : <p className="step7-translation-note">English translation is being reviewed. Use the vocabulary and answer explanations to check your reading.</p>}<h2>Key vocabulary</h2><div className="step7-vocab">{first.vocabulary.map((word) => <div key={word.word}><strong lang="zh-CN">{word.word}</strong><span>{word.pinyin}</span><small>{word.meaning}</small></div>)}</div></article>
    {questions.map((question, index) => <div id={`question-${index + 1}`} key={question.id}><Step7ExerciseClient exercise={question.exercise} nextHref={questions[index + 1] ? `#question-${index + 2}` : "/reading#articles"} nextLabel={questions[index + 1] ? "Next question" : "Browse more reading"}/></div>)}
  </main><SiteFooter/></>;
}
