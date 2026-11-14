import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StudyPage } from "../../components/study-shell";
import { getHsk3LevelStatus } from "@/lib/content/level-status";
import { VocabularyCatalog } from "./vocabulary-catalog";
import { VocabularyLevelNavigation } from "./vocabulary-level-navigation";
import { Hsk1VocabularyIntro, Hsk1VocabularyGuide } from "./hsk1-vocabulary-guide";
import { Hsk2VocabularyIntro, Hsk2VocabularyGuide } from "./hsk2-vocabulary-guide";
import { getHsk1VocabularyInitialPage } from "@/lib/content/hsk1-vocabulary-landing";
import { getHsk2VocabularyInitialPage } from "@/lib/content/hsk2-vocabulary-landing";
import { Hsk3VocabularyIntro, Hsk3VocabularyGuide } from "./hsk3-vocabulary-guide";
import { getHsk3VocabularyInitialPage } from "@/lib/content/hsk3-vocabulary-landing";
import { Hsk4VocabularyIntro, Hsk4VocabularyGuide } from "./hsk4-vocabulary-guide";
import { getHsk4VocabularyInitialPage } from "@/lib/content/hsk4-vocabulary-landing";
import { Hsk5VocabularyIntro, Hsk5VocabularyGuide } from "./hsk5-vocabulary-guide";
import { getHsk5VocabularyInitialPage } from "@/lib/content/hsk5-vocabulary-landing";
import styles from "./hsk1-vocabulary.module.css";

interface Props {
  params: Promise<{ level: string }>;
}

const levelOptions = [
  { level: 1, label: "HSK 1" },
  { level: 2, label: "HSK 2" },
  { level: 3, label: "HSK 3" },
  { level: 4, label: "HSK 4" },
  { level: 5, label: "HSK 5" },
  { level: 6, label: "HSK 6" },
  { level: 7, label: "HSK 7–9" },
] as const;

function parseLevel(value: string) {
  const level = Number(value);
  return Number.isInteger(level) && level >= 1 && level <= 9 ? level : null;
}

export const revalidate = 86_400;

export function generateStaticParams() {
  return levelOptions.map((option) => ({ level: String(option.level) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const requestedLevel = parseLevel((await params).level);
  if (!requestedLevel) return { title: "Level not found — HSKKit", robots: { index: false, follow: false } };
  const level = requestedLevel >= 8 ? 7 : requestedLevel;
  const status = getHsk3LevelStatus(level);
  if (status.availability !== "ready") return { title: "Level unavailable — HSKKit", robots: { index: false, follow: false } };
  const label = level === 7 ? "HSK 7–9" : `HSK ${level}`;
  if (level === 1) return {
    title: `HSK 1 Vocabulary List: ${status.wordCount} Words with Pinyin — HSKKit`,
    description: `Learn ${status.wordCount} HSK 1 words with pinyin, English meanings and available audio. Browse the 2025 syllabus list, explore topic examples and practise with free flashcards.`,
    alternates: { canonical: "/vocabulary/1" },
    openGraph: { title: `HSK 1 Vocabulary: ${status.wordCount} Words with Pinyin`, description: "Explore beginner Chinese vocabulary, topic examples and a practical study guide.", url: "/vocabulary/1", type: "website" },
    twitter: { card: "summary_large_image", title: `HSK 1 Vocabulary: ${status.wordCount} Words with Pinyin`, description: "Browse the word list, read the study guide and practise with quick flashcards." },
  };
  if (level === 2) return {
    title: `HSK 2 Vocabulary List: ${status.wordCount} Words with Pinyin — HSKKit`,
    description: `Explore ${status.wordCount} HSK 2 entries with pinyin, English meanings and available audio. Build on HSK 1 with topic words, comparison examples and free flashcards.`,
    alternates: { canonical: "/vocabulary/2" },
    openGraph: { title: `HSK 2 Vocabulary: ${status.wordCount} Words with Pinyin`, description: "Connect HSK 2 words with transport, ordering, interests and everyday comparisons.", url: "/vocabulary/2", type: "website" },
    twitter: { card: "summary_large_image", title: `HSK 2 Vocabulary: ${status.wordCount} Words with Pinyin`, description: "Explore level-specific topic words, worked examples and quick flashcards." },
  };
  if (level === 3) return {
    title: `HSK 3 Vocabulary List: ${status.wordCount} Words with Pinyin — HSKKit`,
    description: `Explore ${status.wordCount} HSK 3 entries with pinyin, English meanings and available audio. Learn topic words for travel, study and work, with sentence practice and free flashcards.`,
    alternates: { canonical: "/vocabulary/3" },
    openGraph: { title: `HSK 3 Vocabulary: ${status.wordCount} Words with Pinyin`, description: "Build connected Chinese sentences with HSK 3 topic words, a study guide and a worked weekend-plan example.", url: "/vocabulary/3", type: "website" },
    twitter: { card: "summary_large_image", title: `HSK 3 Vocabulary: ${status.wordCount} Words with Pinyin`, description: "Browse the level-specific word list, study everyday situations and practise with quick flashcards." },
  };
  if (level === 4) return {
    title: `HSK 4 Vocabulary List: ${status.wordCount.toLocaleString("en-US")} Words with Pinyin — HSKKit`,
    description: `Explore ${status.wordCount.toLocaleString("en-US")} HSK 4 entries with pinyin, meanings and available audio. Study topic words, explain ideas in sentences and practise with free flashcards.`,
    alternates: { canonical: "/vocabulary/4" },
    openGraph: { title: `HSK 4 Vocabulary: ${status.wordCount.toLocaleString("en-US")} Words with Pinyin`, description: "Explore words for plans, opinions and experiences, with a practical study guide and sentence example.", url: "/vocabulary/4", type: "website" },
    twitter: { card: "summary_large_image", title: `HSK 4 Vocabulary: ${status.wordCount.toLocaleString("en-US")} Words with Pinyin`, description: "Browse the level-specific word list, study useful word groups and practise with quick flashcards." },
  };
  if (level === 5) return {
    title: `HSK 5 Vocabulary List: ${status.wordCount.toLocaleString("en-US")} Words with Pinyin — HSKKit`,
    description: `Explore ${status.wordCount.toLocaleString("en-US")} HSK 5 entries with pinyin and English meanings. Study topic words, a sentence example and a practical guide, then review with free flashcards.`,
    alternates: { canonical: "/vocabulary/5" },
    openGraph: { title: `HSK 5 Vocabulary: ${status.wordCount.toLocaleString("en-US")} Words with Pinyin`, description: "Study vocabulary for analysis, viewpoints and wider topics, with a practical guide and worked sentence.", url: "/vocabulary/5", type: "website" },
    twitter: { card: "summary_large_image", title: `HSK 5 Vocabulary: ${status.wordCount.toLocaleString("en-US")} Words with Pinyin`, description: "Browse the level-specific list, explore related words and practise recall with quick flashcards." },
  };
  return {
    title: `HSK 3.0 ${label} vocabulary — HSKKit`,
    description: `Browse all ${status.wordCount} published ${label} vocabulary entries with Chinese, pinyin, English meanings, and parts of speech.`,
    alternates: { canonical: `/vocabulary/${level}` },
    robots: requestedLevel >= 8 ? { index: false, follow: true } : undefined,
  };
}

export default async function VocabularyPage({ params }: Props) {
  const requestedLevel = parseLevel((await params).level);
  if (!requestedLevel) notFound();
  const level = requestedLevel >= 8 ? 7 : requestedLevel;
  const status = getHsk3LevelStatus(level);
  if (status.availability !== "ready") notFound();

  const levelLabel = level === 7 ? "HSK 7–9" : `HSK ${level}`;
  const hasGuide = level === 1 || level === 2 || level === 3 || level === 4 || level === 5;
  const initialData = level === 1 ? getHsk1VocabularyInitialPage() : level === 2 ? getHsk2VocabularyInitialPage() : level === 3 ? getHsk3VocabularyInitialPage() : level === 4 ? getHsk4VocabularyInitialPage() : level === 5 ? getHsk5VocabularyInitialPage() : undefined;
  const schema = initialData ? {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": `https://hskkit.com/vocabulary/${level}#page`, name: `${levelLabel} Vocabulary`, url: `https://hskkit.com/vocabulary/${level}`, description: `${status.wordCount} published ${levelLabel} words with pinyin, English meanings and a study guide.`, inLanguage: "en", mainEntity: { "@id": `https://hskkit.com/vocabulary/${level}#word-list` } },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Learn", item: "https://hskkit.com/" }, { "@type": "ListItem", position: 2, name: "HSK levels", item: "https://hskkit.com/levels" }, { "@type": "ListItem", position: 3, name: `${levelLabel} Vocabulary`, item: `https://hskkit.com/vocabulary/${level}` }] },
      { "@type": "ItemList", "@id": `https://hskkit.com/vocabulary/${level}#word-list`, name: `${levelLabel} vocabulary: first 50 words`, numberOfItems: initialData.contentAssets.length, itemListElement: initialData.contentAssets.map((word, index) => ({ "@type": "ListItem", position: index + 1, name: word.payload.hanzi, url: `https://hskkit.com/word/${word.id}` })) },
    ],
  } : null;
  return (
    <StudyPage>
      <main className={`vocabulary-page mx-auto w-full max-w-[1200px] flex-1 px-5 py-[24px] sm:px-8 md:py-[32px] ${hasGuide ? styles.page : ""}`}>
        {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />}
        <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
          <Link href="/" className="inline-flex min-h-11 items-center hover:text-blue-700">Learn</Link>
          <span aria-hidden="true">/</span>
          <Link href={hasGuide ? "/levels" : "/vocabulary/1"} className="inline-flex min-h-11 items-center hover:text-blue-700">{hasGuide ? "HSK levels" : "Vocabulary"}</Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-slate-700">{levelLabel}</span>
        </nav>

        <header className="mt-[12px] border-b border-slate-200 pb-[24px]">
          {level === 1 ? <Hsk1VocabularyIntro wordCount={status.wordCount} /> : level === 2 ? <Hsk2VocabularyIntro wordCount={status.wordCount} /> : level === 3 ? <Hsk3VocabularyIntro wordCount={status.wordCount} /> : level === 4 ? <Hsk4VocabularyIntro wordCount={status.wordCount} /> : level === 5 ? <Hsk5VocabularyIntro wordCount={status.wordCount} /> : <>
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-700">HSK 3.0 · 2025 exam syllabus</p>
            <h1 className="mt-[8px] text-4xl font-bold tracking-[-.035em] text-slate-950">{levelLabel} Vocabulary</h1>
            <p className="mt-[10px] text-base leading-7 text-slate-600">Browse all {status.wordCount.toLocaleString("en-US")} published words with Chinese, pinyin, English meanings, and parts of speech.</p>
          </div>

          <div className="mt-[12px] flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-semibold text-slate-800">{status.wordCount.toLocaleString("en-US")} words</span>
            <span className="text-slate-400" aria-hidden="true">•</span>
            <Link href="/content-license" className="inline-flex min-h-11 items-center font-semibold text-blue-700 hover:underline">Verified HSK 3.0 source</Link>
          </div>

          <section className="mt-5 min-w-0 max-w-full overflow-hidden rounded-2xl border border-violet-100 bg-violet-50/60 text-slate-900" aria-labelledby="quick-review-heading">
            <div className="grid min-w-0 gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-violet-700">Quick Flashcards</p>
                <h2 id="quick-review-heading" className="mt-2 break-words text-2xl font-black tracking-tight !text-slate-950">A few words. A little progress.</h2>
                <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-slate-600">Practise 10, 20, or 50 {levelLabel} words. No sign-in required.</p>
                <ul className="sr-only text-xs font-semibold text-slate-600" aria-label="Quick review facts">
                  <li>{levelLabel}</li><li>{status.wordCount.toLocaleString("en-US")} published words</li><li>Guest-ready</li>
                </ul>
              </div>
              <Link href={`/vocabulary/${level}?mode=flashcards#vocabulary-activities`} className="inline-flex min-h-12 w-full max-w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 sm:w-auto">Start quick review</Link>
            </div>
          </section>
          </>}

          <Suspense fallback={<div className="mt-[12px] h-14" aria-hidden="true" />}>
            <VocabularyLevelNavigation level={level} options={levelOptions} />
          </Suspense>
          {hasGuide && <nav aria-label={`On this ${levelLabel} page`} className={styles.jumpNav}>
            <a href="#vocabulary-activities">Word list</a><a href={`#hsk${level}-topics`}>Topic words</a><a href={`#hsk${level}-study-guide`}>Study guide</a><a href={`#hsk${level}-sources`}>Syllabus & sources</a><a href={`#hsk${level}-faq`}>Common questions</a>
          </nav>}

          {requestedLevel >= 8 && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">HSK 3.0 publishes Levels 7–9 as one unified HSK 7–9 advanced ability band, not a separate Level {requestedLevel} official word list. This page therefore uses the shared HSK 7–9 catalog.</p>}
        </header>

        <div id="vocabulary-activities" className="mt-[20px] scroll-mt-24">
          <Suspense fallback={<div className="min-h-40 rounded-2xl border border-slate-200 bg-white" aria-hidden="true" />}>
            <VocabularyCatalog level={level} levelLabel={levelLabel} publishedCount={status.wordCount} initialData={initialData} />
          </Suspense>
        </div>

        {level === 1 ? <Hsk1VocabularyGuide wordCount={status.wordCount} /> : level === 2 ? <Hsk2VocabularyGuide wordCount={status.wordCount} foundationCount={getHsk3LevelStatus(1).wordCount} /> : level === 3 ? <Hsk3VocabularyGuide wordCount={status.wordCount} foundationCount={getHsk3LevelStatus(1).wordCount + getHsk3LevelStatus(2).wordCount} /> : level === 4 ? <Hsk4VocabularyGuide wordCount={status.wordCount} foundationCount={[1, 2, 3].reduce((sum, previous) => sum + getHsk3LevelStatus(previous).wordCount, 0)} /> : level === 5 ? <Hsk5VocabularyGuide wordCount={status.wordCount} foundationCount={[1, 2, 3, 4].reduce((sum, previous) => sum + getHsk3LevelStatus(previous).wordCount, 0)} /> : <div className="mt-[40px] flex flex-wrap gap-3 border-t border-slate-200 pt-[24px]">
          <Link href={`/dictionary?level=${requestedLevel}`} className="inline-flex min-h-11 items-center rounded-lg border border-blue-600 bg-white px-5 py-3 font-semibold text-blue-700 hover:bg-blue-50">Browse this level in Dictionary</Link>
          <Link href="/levels" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:border-blue-600 hover:text-blue-700">View all HSK levels</Link>
          <Link href="/placement" className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">Find my starting level</Link>
        </div>}
      </main>
    </StudyPage>
  );
}
