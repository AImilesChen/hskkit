import type { Metadata } from "next";
import { DictionarySearch } from "../components/dictionary-search";
import { StudyPage } from "../components/study-shell";

export const metadata: Metadata = {
  title: "Chinese Dictionary by Hanzi, Pinyin or English — HSKKit",
  description: "Search published HSKKit study words by Hanzi, pinyin, English meaning, HSK level, and part of speech.",
  alternates: { canonical: "/dictionary" },
};

export default function DictionaryPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "HSKKit Dictionary",
    url: "https://hskkit.com/dictionary",
    description: "Searchable collection of published Chinese study words.",
  };
  return <StudyPage>
    <main className="mx-auto w-full max-w-[900px] flex-1 px-5 py-12 md:px-16 md:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <header className="mb-9 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-blue-600">Published study catalog</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Search Chinese words</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">Search by Hanzi, tone-marked or plain pinyin, and English. Filter by HSK Level 1–9 and part of speech.</p>
      </header>
      <DictionarySearch />
      <section className="mt-12 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">What can I search?</h2><p className="mt-3 text-slate-600">Hanzi, pinyin, English meanings, HSK level, and part of speech from the current quality-approved release.</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Why is there no result?</h2><p className="mt-3 text-slate-600">No published item matched. Try plain pinyin without tone marks, another English keyword, or remove a filter.</p></div>
      </section>
    </main>
  </StudyPage>;
}
