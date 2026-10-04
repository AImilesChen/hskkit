import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import ReadingLibraryExperience from "@/app/components/reading-library-experience";
import ReadingArticleBrowser, { type ReadingBrowseItem } from "@/app/components/reading-article-browser";
import { READING_LIBRARY_COUNTS, READING_LIBRARY_QUESTIONS, readingQuestionsForLevel } from "@/lib/learning/reading-library";
import { READING_ARTICLES, chineseCharacterCount } from "@/lib/learning/reading-articles";
import { READING_LESSONS } from "@/lib/learning/step7-content";
import pageStyles from "./reading-page.module.css";

export const metadata: Metadata = {
  title: "HSK 1–9 Reading Articles & Practice | HSKKit",
  description: "Browse complete HSK 1–9 reading articles, explore short passages, and start saved comprehension practice.",
  alternates: { canonical: "/reading" },
};

const LEVEL_DESCRIPTORS = [
  "Short everyday sentences with direct facts and familiar words.",
  "Connected daily routines with simple sequencing and practical details.",
  "Everyday stories that train key-detail comprehension.",
  "Short situations with cause, comparison, and connected ideas.",
  "Short texts that introduce inference, viewpoint, and context.",
  "Brief arguments that test nuance and evidence.",
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

const articleItems: ReadingBrowseItem[] = READING_ARTICLES.map((article) => ({
  slug: article.slug, level: article.level, title: article.title, topic: article.topic,
  characters: chineseCharacterCount(article.paragraphs), excerpt: article.paragraphs[0],
  href: `/reading/article/${article.slug}`,
}));
const SHORT_TOPICS: Record<number, string> = { 1: "Daily life", 2: "Travel", 3: "Study", 4: "Community services", 5: "Workplace", 6: "Public plans", 7: "Policy", 8: "Comparisons", 9: "Research methods" };
const shortItems: ReadingBrowseItem[] = [...READING_LESSONS.map((lesson) => ({
  slug: lesson.slug, level: lesson.level, title: lesson.title, topic: SHORT_TOPICS[lesson.level],
  characters: chineseCharacterCount([lesson.text]), excerpt: lesson.text,
  href: `/reading/${lesson.slug}`,
})), ...READING_LIBRARY_QUESTIONS.filter((question) => question.questionIndex === 0).map((question) => ({
  slug: question.slug, level: question.level, title: question.title, topic: SHORT_TOPICS[question.level],
  characters: chineseCharacterCount([question.passage]), excerpt: question.passage,
  href: `/reading/passage/${question.slug}`,
}))];

export default function ReadingIndex() {
  return <>
    <SiteHeader/>
    <main className={pageStyles.page}>
      <ReadingArticleBrowser articles={articleItems} shortPassages={shortItems}/>
      <div id="practice" className={pageStyles.practice}><ReadingLibraryExperience levels={levels}/></div>

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

    </main>
    <SiteFooter/>
  </>;
}
