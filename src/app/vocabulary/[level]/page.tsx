import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StudyPage } from "../../components/study-shell";
import { getHsk3LevelStatus } from "@/lib/content/level-status";
import { VocabularyCatalog } from "./vocabulary-catalog";
import { VocabularyLevelNavigation } from "./vocabulary-level-navigation";

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
  return (
    <StudyPage>
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-[24px] sm:px-8 md:py-[32px]">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
          <Link href="/" className="inline-flex min-h-11 items-center hover:text-blue-700">Learn</Link>
          <span aria-hidden="true">/</span>
          <Link href="/vocabulary/1" className="inline-flex min-h-11 items-center hover:text-blue-700">Vocabulary</Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-slate-700">{levelLabel}</span>
        </nav>

        <header className="mt-[12px] border-b border-slate-200 pb-[24px]">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-700">{level <= 6 ? "HSK 3.0 · 2025 exam syllabus" : "HSK 3.0 · GF0025-2021"}</p>
            <h1 className="mt-[8px] text-4xl font-bold tracking-[-.035em] text-slate-950">{levelLabel} Vocabulary</h1>
            <p className="mt-[10px] text-base leading-7 text-slate-600">Browse all {status.wordCount.toLocaleString("en-US")} published words with Chinese, pinyin, English meanings, and parts of speech.</p>
          </div>

          <div className="mt-[12px] flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-semibold text-slate-800">{status.wordCount.toLocaleString("en-US")} words</span>
            <span className="text-slate-400" aria-hidden="true">•</span>
            <Link href="/content-license" className="inline-flex min-h-11 items-center font-semibold text-blue-700 hover:underline">Verified HSK 3.0 source</Link>
          </div>

          <section className="mt-5 min-w-0 max-w-full overflow-hidden rounded-2xl bg-slate-950 text-white shadow-sm" aria-labelledby="quick-review-heading">
            <div className="grid min-w-0 gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-cyan-300">Quick Flashcards</p>
                <h2 id="quick-review-heading" className="mt-2 break-words text-2xl font-black tracking-tight !text-white">Turn this level into a short review.</h2>
                <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-slate-300">Choose 10, 20, or 50 cards from the complete published {levelLabel} catalog. No sign-in required.</p>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-200" aria-label="Quick review facts">
                  <li>{levelLabel}</li><li>{status.wordCount.toLocaleString("en-US")} published words</li><li>Guest-ready</li>
                </ul>
              </div>
              <Link href={`/vocabulary/${level}?mode=flashcards#vocabulary-activities`} className="inline-flex min-h-12 w-full max-w-full items-center justify-center rounded-xl bg-amber-300 px-5 py-3 text-center text-sm font-black text-slate-950 shadow-sm transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-100 sm:w-auto">Start quick review</Link>
            </div>
          </section>

          <Suspense fallback={<div className="mt-[12px] h-14" aria-hidden="true" />}>
            <VocabularyLevelNavigation level={level} options={levelOptions} />
          </Suspense>

          {requestedLevel >= 8 && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">HSK 3.0 publishes Levels 7–9 as one unified HSK 7–9 advanced ability band, not a separate Level {requestedLevel} official word list. This page therefore uses the shared HSK 7–9 catalog.</p>}
        </header>

        <div id="vocabulary-activities" className="mt-[20px] scroll-mt-24">
          <Suspense fallback={<div className="min-h-40 rounded-2xl border border-slate-200 bg-white" aria-hidden="true" />}>
            <VocabularyCatalog level={level} levelLabel={levelLabel} publishedCount={status.wordCount} />
          </Suspense>
        </div>

        <div className="mt-[40px] flex flex-wrap gap-3 border-t border-slate-200 pt-[24px]">
          <Link href={`/dictionary?level=${requestedLevel}`} className="inline-flex min-h-11 items-center rounded-lg border border-blue-600 bg-white px-5 py-3 font-semibold text-blue-700 hover:bg-blue-50">Browse this level in Dictionary</Link>
          <Link href="/levels" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:border-blue-600 hover:text-blue-700">View all HSK levels</Link>
          <Link href="/placement" className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">Find my starting level</Link>
        </div>
      </main>
    </StudyPage>
  );
}
