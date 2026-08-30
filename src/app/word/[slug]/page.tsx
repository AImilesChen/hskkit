import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DictionaryWordActions } from "../../components/dictionary-word-actions";
import { StudyPage } from "../../components/study-shell";
import { getCharacterByHanzi, listPublishedWords, relatedWordsForWord } from "@/lib/dictionary/catalog";
import { getPublishedWordBySlug } from "@/lib/dictionary/runtime-word";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listPublishedWords().map((word) => ({ slug: word.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getPublishedWordBySlug((await params).slug);
  if (result.status !== "published") return { title: "Word unavailable — HSKKit", robots: { index: false, follow: false } };
  const word = result.item;
  return {
    title: `${word.hanzi} (${word.pinyin}) Meaning and HSK Level — HSKKit`,
    description: word.example
      ? `${word.hanzi} means ${word.meaning}. Hear the pronunciation, read an example, and continue with HSK ${word.level} practice.`
      : `${word.hanzi} means ${word.meaning}. Hear the pronunciation, save the word, and continue with HSK ${word.level} practice.`,
    alternates: { canonical: `/word/${word.slug}` },
  };
}

export default async function WordPage({ params }: Props) {
  const result = await getPublishedWordBySlug((await params).slug);
  if (result.status !== "published") notFound();
  const word = result.item;
  const characters = [...word.hanzi].flatMap((character) => getCharacterByHanzi(character).status === "published" ? [character] : []);
  const related = relatedWordsForWord(word);
  const schema = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: word.hanzi,
    inDefinedTermSet: `https://hskkit.com/vocabulary/${word.level}`,
    description: word.meaning,
    url: `https://hskkit.com/word/${word.slug}`,
  };

  return <StudyPage>
    <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-8 sm:px-6 md:py-12 lg:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
        <Link href="/dictionary" className="font-semibold hover:text-blue-700">Dictionary</Link><span aria-hidden="true">/</span>
        <Link href={`/vocabulary/${word.level}`} className="font-semibold hover:text-blue-700">HSK {word.level}</Link><span aria-hidden="true">/</span>
        <span className="text-slate-700">{word.hanzi}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]">
            <div className="grid gap-8 p-6 sm:p-9 md:grid-cols-[minmax(220px,0.8fr)_1.2fr] md:items-center">
              <div className="rounded-2xl bg-slate-950 px-6 py-9 text-center text-white">
                <p className="text-xl font-semibold tracking-wide text-blue-200">{word.pinyin}</p>
                <h1 className="my-5 break-words text-7xl font-extrabold tracking-tight sm:text-8xl">{word.hanzi}</h1>
                <span className="inline-flex rounded-full bg-blue-600 px-3 py-1 text-xs font-bold">HSK {word.level}</span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Meaning</p>
                <p className="mt-3 text-2xl font-semibold leading-snug text-slate-950 sm:text-3xl">{word.meaning}</p>
                <p className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">{word.partOfSpeech}</p>
                {word.example ? <p className="mt-6 text-sm leading-6 text-slate-600">Use the example below to see how this word works in a complete sentence.</p> : <p className="mt-6 text-sm leading-6 text-slate-600">Listen to the word, save it, or add it to Today to keep learning.</p>}
              </div>
            </div>
          </article>

          <DictionaryWordActions assetId={word.id} hanzi={word.hanzi} level={word.level} audioSrc={word.audio.status === "formal" ? word.audio.src : undefined} />

          {word.example ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">In a sentence</p>
              <p className="mt-4 text-xl font-semibold leading-8 text-slate-950 sm:text-2xl">{word.example.hanzi}</p>
              <p className="mt-2 text-blue-700">{word.example.pinyin}</p>
              <p className="mt-2 leading-7 text-slate-600">{word.example.meaning}</p>
            </section>
          ) : null}

          {characters.length > 0 && <section className="rounded-2xl border border-slate-200 bg-white p-6" aria-labelledby="characters-title">
            <h2 id="characters-title" className="text-xl font-bold text-slate-950">Explore the characters</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">{characters.map((character) => <Link key={character} href={`/character/${encodeURIComponent(character)}`} className="flex min-h-16 items-center justify-between rounded-xl border border-slate-200 px-4 hover:border-blue-400 hover:bg-blue-50"><span className="text-3xl font-bold text-slate-950">{character}</span><span className="font-semibold text-blue-700">Character details →</span></Link>)}</div>
          </section>}

          {related.length > 0 && <section aria-labelledby="related-title">
            <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Connected vocabulary</p><h2 id="related-title" className="mt-1 text-2xl font-bold text-slate-950">Words that connect to {word.hanzi}</h2></div>
            <div className="grid gap-3 sm:grid-cols-2">{related.map((item) => <Link key={item.word.slug} href={`/word/${item.word.slug}`} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-400 hover:shadow-md"><div className="flex items-baseline gap-3"><strong className="text-2xl text-slate-950">{item.word.hanzi}</strong><span className="text-sm font-semibold text-blue-700">{item.word.pinyin}</span></div><p className="mt-2 text-sm text-slate-700">{item.word.meaning}</p><p className="mt-3 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">{item.relationship}</p></Link>)}</div>
          </section>}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-bold text-slate-950">Keep going</h2>
            <div className="mt-4 grid gap-2">
              <Link href={`/vocabulary/${word.level}`} className="inline-flex min-h-11 items-center justify-between rounded-lg bg-white px-4 font-semibold text-slate-800 ring-1 ring-slate-200 hover:ring-blue-400">HSK {word.level} word list <span aria-hidden="true">→</span></Link>
              <Link href="/dictionary" className="inline-flex min-h-11 items-center justify-between rounded-lg bg-white px-4 font-semibold text-slate-800 ring-1 ring-slate-200 hover:ring-blue-400">Find another word <span aria-hidden="true">→</span></Link>
              <Link href="/today" className="inline-flex min-h-11 items-center justify-between rounded-lg bg-white px-4 font-semibold text-slate-800 ring-1 ring-slate-200 hover:ring-blue-400">Open Today <span aria-hidden="true">→</span></Link>
            </div>
          </section>
          <p className="px-2 text-xs leading-5 text-slate-500">Formal recordings are labelled “Formal audio.” When one is not available, Listen uses your device’s Chinese voice and labels it as a preview.</p>
        </aside>
      </div>
    </main>
  </StudyPage>;
}
