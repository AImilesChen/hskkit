import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StudyPage } from "../../components/study-shell";
import { formalAudioAssetCount, getHsk3LevelPreview, getHsk3LevelStatus } from "@/lib/content/level-status";

interface Props { params: Promise<{ level: string }> }
function parseLevel(value: string) { const level = Number(value); return Number.isInteger(level) && level >= 1 && level <= 9 ? level : null; }
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const requestedLevel = parseLevel((await params).level);
  if (!requestedLevel) return { title: "Level not found — HSKKit", robots: { index: false, follow: false } };
  const level = requestedLevel >= 8 ? 7 : requestedLevel;
  const status = getHsk3LevelStatus(level);
  if (status.availability !== "ready") return { title: "Level unavailable — HSKKit", robots: { index: false, follow: false } };
  const label = level === 7 ? "unified HSK 7–9 advanced ability band" : `Level ${level}`;
  return { title: `HSK 3.0 ${label} vocabulary — HSKKit`, description: `${status.contentCount} source-locked, QA-approved and published HSK 3.0 vocabulary entries.`, alternates: { canonical: `/vocabulary/${level}` }, robots: requestedLevel >= 8 ? { index: false, follow: true } : undefined };
}

export default async function VocabularyPage({ params }: Props) {
  const requestedLevel = parseLevel((await params).level);
  if (!requestedLevel) notFound();
  const level = requestedLevel >= 8 ? 7 : requestedLevel;
  const status = getHsk3LevelStatus(level);
  if (status.availability !== "ready") notFound();
  const words = getHsk3LevelPreview(level);
  const label = level === 7 ? "unified HSK 7–9 advanced ability band" : `Level ${level}`;
  return (
    <StudyPage>
      <main className="mx-auto w-full max-w-[1000px] flex-1 px-5 py-12 md:px-16 md:py-16">
        <nav className="mb-6 text-sm text-slate-500"><Link href="/levels" className="inline-flex min-h-11 items-center hover:text-blue-600">Levels 1–9</Link> <span aria-hidden="true">/</span> {label}</nav>
        <header><p className="text-sm font-bold uppercase tracking-[0.15em] text-blue-600">HSK 3.0 · GF0025-2021</p><h1 className="mt-3 text-4xl font-bold md:text-5xl">{label} vocabulary</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">This catalog contains only source-locked, license-recorded, QA-approved and published HSK 3.0 entries. HSK 2.0 and demo words are excluded.</p>{requestedLevel >= 8 && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">HSK 3.0 publishes Levels 7–9 as one unified HSK 7–9 advanced ability band. This route maps to that shared Level 7 catalog; it is not a separate Level {requestedLevel} official word list.</p>}</header>
        <section className="mt-8 grid gap-4 rounded-2xl border border-green-200 bg-green-50 p-6 sm:grid-cols-3"><div><p className="text-sm text-green-800">Published entries</p><p className="text-2xl font-bold text-green-950">{status.contentCount}</p></div><div><p className="text-sm text-green-800">Release</p><p className="text-lg font-bold text-green-950">{status.releaseId}</p></div><div><p className="text-sm text-green-800">Formal audio assets</p><p className="text-2xl font-bold text-green-950">{formalAudioAssetCount}</p></div></section>
        <section className="mt-10"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-bold">Published vocabulary preview</h2><p className="mt-2 text-slate-600">Showing the first {words.length} entries. The catalog API exposes all {status.contentCount} published entries.</p></div><Link href="/content-license" className="inline-flex min-h-11 items-center font-semibold text-blue-700 hover:underline">Sources and licenses</Link></div><ul className="mt-6 grid gap-3 sm:grid-cols-2" aria-label={`${label} vocabulary preview`}>{words.map((word) => <li key={word.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><span className="text-2xl font-bold">{word.hanzi}</span><span className="ml-3 text-slate-600">{word.pinyin}</span></div><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{word.levelBand}</span></div><p className="mt-2 text-sm leading-6 text-slate-700">{word.meaning}</p><p className="mt-2 text-xs uppercase tracking-wide text-slate-400">{word.partOfSpeech}</p></li>)}</ul></section>
        <div className="mt-10 flex flex-wrap gap-3"><Link href="/levels" className="inline-flex min-h-11 items-center rounded-lg border border-blue-600 px-5 py-3 font-semibold text-blue-700 hover:bg-blue-50">Back to Levels</Link><Link href="/placement" className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">Find my starting level</Link></div>
      </main>
    </StudyPage>
  );
}
