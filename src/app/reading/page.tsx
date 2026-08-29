import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import ReadingLibraryExperience from "@/app/components/reading-library-experience";
import { READING_LIBRARY_COUNTS, readingQuestionsForLevel } from "@/lib/learning/reading-library";
import { READING_LESSONS } from "@/lib/learning/step7-content";
import pageStyles from "./reading-page.module.css";

export const metadata: Metadata = {
  title: "HSK 1–9 Reading Practice | HSKKit",
  description: "Start a verified 10- or 20-question HSK 1–9 reading session with same-level progression and saved results.",
  alternates: { canonical: "/reading" },
};

const LEVEL_DESCRIPTORS = [
  "Short everyday sentences with direct facts and familiar words.",
  "Connected daily routines with simple sequencing and practical details.",
  "Everyday stories that train key-detail comprehension.",
  "Longer narratives with cause, comparison, and connected ideas.",
  "Denser topics that introduce inference, viewpoint, and context.",
  "Extended passages that test argument, nuance, and evidence.",
  "An independent advanced HSKKit layer for abstract context.",
  "An independent advanced HSKKit layer for complex reasoning.",
  "The highest HSKKit layer for dense inference and precise interpretation.",
];

const levels = READING_LIBRARY_COUNTS.byLevel.map((row) => {
  const questions = readingQuestionsForLevel(row.level);
  return {
    ...row,
    descriptor: LEVEL_DESCRIPTORS[row.level - 1],
    questionTypes: [...new Set(questions.map((question) => question.questionType))],
    examples: questions.filter((_, index) => [0, 10, 20].includes(index)).map((question) => ({
      slug: question.slug,
      title: question.title,
      passage: question.passage,
      prompt: question.exercise.prompt,
      explanation: question.exercise.explanation,
      questionType: question.questionType,
      options: Object.values(question.exercise.options ?? {}),
    })),
  };
});

export default function ReadingIndex() {
  return <>
    <SiteHeader/>
    <main className={pageStyles.page}>
      <ReadingLibraryExperience levels={levels}/>

      <section className={pageStyles.learningTools} aria-labelledby="reading-learning-tools">
        <div><span>Your learning</span><h2 id="reading-learning-tools">Review and plan after you practise</h2></div>
        <nav aria-label="Learning navigation" className={pageStyles.learningNav}>
          <Link href="/review">Review</Link>
          <Link href="/mistakes">Mistakes</Link>
          <Link href="/today">Today</Link>
          <Link href="/planner">Planner</Link>
        </nav>
      </section>

      <p className={pageStyles.boundary}><strong>Coverage boundary:</strong> HSKKit-authored practice based on the HSK 3.0 standard; this is not an official exam question bank.</p>

      <details className={pageStyles.collection}>
        <summary>Published single-passage collection</summary>
        <section className={pageStyles.collectionGrid}>{READING_LESSONS.map((lesson) => <article className={pageStyles.collectionCard} key={lesson.slug}><span>HSK {lesson.levelBand} · {lesson.difficulty}</span><h2>{lesson.title}</h2><p>{lesson.questionType.replace("-", " ")}</p><Link href={`/reading/${lesson.slug}`}>Open passage</Link></article>)}</section>
      </details>
    </main>
    <SiteFooter/>
  </>;
}
