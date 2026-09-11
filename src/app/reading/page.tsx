import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import ReadingLibraryExperience from "@/app/components/reading-library-experience";
import { READING_ARTICLE_NOTICE, READING_ARTICLE_SUMMARIES } from "@/lib/learning/reading-articles";
import { READING_LESSONS } from "@/lib/learning/step7-content";
import pageStyles from "./reading-page.module.css";

export const metadata: Metadata = {
  title: "HSK 1–9 Graded Reading | HSKKit",
  description: "Browse complete HSK 1–9 graded articles with narration, translation, vocabulary and explained questions, or start a short Quick Practice session.",
  alternates: { canonical: "/reading" },
};

export default function ReadingIndex() {
  return <>
    <SiteHeader/>
    <main className={pageStyles.page}>
      <ReadingLibraryExperience articles={READING_ARTICLE_SUMMARIES} coverageNotice={READING_ARTICLE_NOTICE}/>
      <section className={pageStyles.learningTools} aria-labelledby="reading-learning-tools"><div><span>Your learning</span><h2 id="reading-learning-tools">Review and plan after you practise</h2></div><nav aria-label="Learning navigation" className={pageStyles.learningNav}><Link href="/review">Review</Link><Link href="/mistakes">Mistakes</Link><Link href="/today">Today</Link><Link href="/planner">Planner</Link></nav></section>
      <p className={pageStyles.boundary}><strong>Coverage boundary:</strong> HSKKit-authored practice based on the HSK 3.0 standard; this is not an official exam question bank.</p>
      <details className={pageStyles.collection}><summary>Published single-passage collection</summary><section className={pageStyles.collectionGrid}>{READING_LESSONS.map((lesson) => <article className={pageStyles.collectionCard} key={lesson.slug}><span>HSK {lesson.levelBand} · {lesson.difficulty}</span><h2>{lesson.title}</h2><p>{lesson.questionType.replace("-", " ")}</p><Link href={`/reading/${lesson.slug}`}>Open passage</Link></article>)}</section></details>
    </main>
    <SiteFooter/>
  </>;
}
