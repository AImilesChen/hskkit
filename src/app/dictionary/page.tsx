import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DictionarySearch, type CatalogResponse } from "../components/dictionary-search";
import { StudyPage } from "../components/study-shell";
import { characterIndexFacets } from "@/lib/dictionary/character-index";
import { formalWordAudioUrlByContentId, getHsk3LevelPreview, getHsk3LevelStatus } from "@/lib/content/level-status";

export const metadata: Metadata = {
  title: "Chinese Dictionary by Hanzi, Pinyin or English — HSKKit",
  description: "Search published HSK words and browse 2,971 real HSK characters by radical, strokes, pinyin and level.",
  alternates: { canonical: "/dictionary" },
};

export default function DictionaryPage() {
  const firstPage = getHsk3LevelPreview(1, 12);
  const level = getHsk3LevelStatus(1);
  const initialWords: CatalogResponse = {
    contentAssets: firstPage.map((word) => ({
      id: word.id,
      level: 1,
      levelBand: word.levelBand,
      formalAudioAvailable: formalWordAudioUrlByContentId.has(word.id),
      formalAudioUrl: formalWordAudioUrlByContentId.get(word.id),
      payload: {
        hanzi: word.hanzi,
        traditional: word.hanzi,
        pinyin: word.pinyin,
        meaning: word.meaning,
        partOfSpeech: word.partOfSpeech,
      },
    })),
    pagination: {
      page: 1,
      pageSize: 12,
      total: level.wordCount,
      totalPages: Math.ceil(level.wordCount / 12),
      hasPrevious: false,
      hasNext: level.wordCount > 12,
    },
  };
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: "HSKKit Chinese Dictionary", url: "https://hskkit.com/dictionary", description: "A Chinese learning dictionary with word, character, radical, stroke and pinyin browsing." };
  return <StudyPage>
    <main className="mx-auto w-full max-w-[1160px] flex-1 px-4 py-5 sm:px-6 md:py-8 lg:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <header className="mb-4 grid gap-3 border-b border-slate-200 pb-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Chinese dictionary</p><h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Find a Chinese word you can use</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Search words directly, or browse 2,971 HSK characters by radical, stroke count and pinyin. Every result opens a real learning entry.</p></div>
        <div className="flex gap-5 text-sm"><div><strong className="block text-xl text-slate-950">11,092</strong><span className="text-slate-500">published words</span></div><div><strong className="block text-xl text-slate-950">2,971</strong><span className="text-slate-500">HSK characters</span></div></div>
      </header>
      <Suspense fallback={<div className="min-h-[640px] rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center font-semibold text-blue-950">Opening the dictionary…</div>}><DictionarySearch characterFacets={characterIndexFacets} initialWords={initialWords} /></Suspense>
      <section className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Complete character directories"><Link href="/dictionary/radicals" className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-500 hover:bg-blue-50"><strong className="text-lg text-slate-950">Browse all 214 radicals</strong><span className="mt-1 block text-sm leading-6 text-slate-600">Open the full Kangxi directory, grouped by radical stroke count with HSK character totals.</span></Link><Link href="/dictionary/strokes" className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-500 hover:bg-blue-50"><strong className="text-lg text-slate-950">Browse all stroke counts</strong><span className="mt-1 block text-sm leading-6 text-slate-600">Move from 1 to 23 strokes and open every matching character in the index.</span></Link></section>
      <section className="mt-10 border-t border-slate-200 pt-7" aria-labelledby="dictionary-next-step"><div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center"><div><h2 id="dictionary-next-step" className="text-xl font-bold text-slate-950">Browse the complete vocabulary by level</h2><p className="mt-1 text-sm leading-6 text-slate-600">The full HSK 1–9 word lists use the same published catalog and open the same word details.</p></div><Link href="/vocabulary/1" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-600 px-5 font-bold text-blue-700 hover:bg-blue-50">Open HSK 1 vocabulary →</Link></div></section>
    </main>
  </StudyPage>;
}
