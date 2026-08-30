import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DictionarySearch } from "../components/dictionary-search";
import { StudyPage } from "../components/study-shell";
import { P1_CHARACTER_RECORDS, characterBrowseFacets, parsePinyinSyllable } from "@/lib/dictionary/p1-character-data";

export const metadata: Metadata = {
  title: "Chinese Dictionary by Hanzi, Pinyin or English — HSKKit",
  description: "Find Chinese words by Hanzi, pinyin, English meaning or HSK level, then listen and keep learning.",
  alternates: { canonical: "/dictionary" },
};

export default function DictionaryPage() {
  const characterRecords = P1_CHARACTER_RECORDS.map((character) => {
    const sound = parsePinyinSyllable(character.pinyin[0]);
    return { hanzi: character.hanzi, pinyin: character.pinyin, meanings: character.meanings, radical: character.radical, strokes: character.strokes, structure: character.structure, initial: sound.initial, final: sound.final, tone: sound.tone };
  });
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "HSKKit Chinese Dictionary",
    url: "https://hskkit.com/dictionary",
    description: "A beginner-friendly Chinese dictionary with search and HSK level browsing.",
  };
  return <StudyPage>
    <main className="mx-auto w-full max-w-[1160px] flex-1 px-4 py-8 sm:px-6 md:py-12 lg:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <header className="mx-auto mb-8 max-w-3xl text-center md:mb-10">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">Chinese dictionary</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">Find a Chinese word you can use</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Type what you know—汉字, pinyin, or English—or start with an HSK level. Browse by character shape or sound when you only recognize part of a character.</p>
      </header>
      <Suspense fallback={<div className="rounded-3xl border border-blue-100 bg-blue-50 p-8 text-center font-semibold text-blue-950">Opening the dictionary…</div>}>
        <DictionarySearch characterRecords={characterRecords} characterFacets={characterBrowseFacets} />
      </Suspense>
      <section className="mt-12 border-t border-slate-200 pt-8" aria-labelledby="dictionary-next-step">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div><h2 id="dictionary-next-step" className="text-2xl font-bold text-slate-950">Not sure where to begin?</h2><p className="mt-2 text-slate-600">Choose HSK 1 above and open any linked word to hear it, save it, add it to Today, or practise at that level.</p></div>
          <Link href="/vocabulary/1" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-600 px-5 font-bold text-blue-700 hover:bg-blue-50">Open the full HSK 1 list →</Link>
        </div>
      </section>
    </main>
  </StudyPage>;
}
