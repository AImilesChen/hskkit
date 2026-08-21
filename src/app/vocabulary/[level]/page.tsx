import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StudyPage } from "../../components/study-shell";
import { getHsk3LevelStatus } from "@/lib/content/level-status";

interface Props { params: Promise<{ level: string }> }
function parseLevel(value: string) { const level = Number(value); return Number.isInteger(level) && level >= 1 && level <= 9 ? level : null; }
export function generateStaticParams() { return Array.from({ length: 9 }, (_, index) => ({ level: String(index + 1) })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const level = parseLevel((await params).level); if (!level) return { title: "Level not found — HSKKit", robots: { index: false, follow: false } }; return { title: `HSK 3.0 Level ${level} content status — HSKKit`, description: `See the current QA-approved publication status for HSK 3.0 Level ${level}.`, alternates: { canonical: `/vocabulary/${level}` } }; }

export default async function VocabularyPage({ params }: Props) {
  const level = parseLevel((await params).level);
  if (!level) notFound();
  const status = getHsk3LevelStatus(level);
  return (
    <StudyPage>
      <main className="mx-auto w-full max-w-[900px] flex-1 px-5 py-12 md:px-16 md:py-16">
        <nav className="mb-6 text-sm text-slate-500"><Link href="/levels" className="hover:text-blue-600">Levels 1–9</Link> <span aria-hidden="true">/</span> Level {level}</nav>
        <header><p className="text-sm font-bold uppercase tracking-[0.15em] text-blue-600">HSK 3.0 · {status.isAdvancedPath ? "Unified advanced path" : "Foundation path"}</p><h1 className="mt-3 text-4xl font-bold md:text-5xl">Level {level} study content</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">This route reads only from the versioned, QA-gated HSK 3.0 release. Traditional HSK 2.0 lists and demo dictionary words are not silently mixed into this level.</p></header>
        {status.availability === "gap" ? (
          <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-7" aria-live="polite"><span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">Content gap</span><h2 className="mt-4 text-2xl font-bold">QA-approved Level {level} material is not yet available</h2><p className="mt-3 leading-7 text-amber-950">We have not published an authorized and QA-approved content package for this level. The page stays available to report that status clearly rather than showing two demo words as if they were a complete HSK 3.0 list.</p><dl className="mt-6 grid gap-4 sm:grid-cols-3"><div><dt className="text-sm text-amber-800">Release</dt><dd className="font-bold">v{status.releaseVersion}</dd></div><div><dt className="text-sm text-amber-800">Approved content</dt><dd className="font-bold">{status.contentCount}</dd></div><div><dt className="text-sm text-amber-800">Approved audio</dt><dd className="font-bold">{status.audioCount}</dd></div></dl></section>
        ) : null}
        <div className="mt-10 flex flex-wrap gap-3"><Link href="/levels" className="inline-flex min-h-11 items-center rounded-lg border border-blue-600 px-5 py-3 font-semibold text-blue-700 hover:bg-blue-50">Back to Levels</Link><Link href="/placement" className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">Find my starting level</Link></div>
      </main>
    </StudyPage>
  );
}
