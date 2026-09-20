import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AudioButton } from "../../components/audio-button";
import { StudyPage } from "../../components/study-shell";
import { getIndexedCharacter } from "@/lib/dictionary/character-index";
import { getPublishedCharacterByHanzi } from "@/lib/dictionary/runtime-character";

type Props = { params: Promise<{ hanzi: string }> };
function clean(value: string) { try { return decodeURIComponent(value); } catch { return value; } }
export const dynamic = "force-static";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hanzi = clean((await params).hanzi);
  const item = getIndexedCharacter(hanzi);
  if (!item) return { title: "Character unavailable — HSKKit", robots: { index: false, follow: false } };
  return {
    title: `${item.hanzi} Meaning, Pinyin, Radical and Strokes — HSKKit`,
    description: `${item.hanzi}: ${item.pinyin.join(", ")}; ${item.meanings.join("; ")}. Browse its radical, ${item.strokes}-stroke details and HSK words.`,
    alternates: { canonical: `/character/${encodeURIComponent(item.hanzi)}` },
  };
}

function CharacterLinks({ items }: { items: Array<{ hanzi: string; pinyin: string[]; meanings: string[]; firstLevel: number }> }) {
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{items.map((item) => <Link key={item.hanzi} href={`/character/${encodeURIComponent(item.hanzi)}`} className="group min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 transition hover:border-blue-400 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
    <span className="flex items-baseline gap-2"><strong className="text-2xl text-slate-950">{item.hanzi}</strong><span className="truncate text-sm font-semibold text-blue-700">{item.pinyin[0]}</span></span>
    <span className="mt-1 block truncate text-xs text-slate-600">HSK {item.firstLevel} · {item.meanings[0]}</span>
  </Link>)}</div>;
}

export default async function CharacterPage({ params }: Props) {
  const hanzi = clean((await params).hanzi);
  const result = await getPublishedCharacterByHanzi(hanzi);
  if (result.status !== "published") notFound();
  const item = result.item;
  const levels = item.levels.filter((level) => level <= 6);
  const advanced = item.levels.some((level) => level >= 7);
  const schema = { "@context": "https://schema.org", "@type": "DefinedTerm", name: item.hanzi, description: item.meanings.join("; "), url: `https://hskkit.com/character/${encodeURIComponent(item.hanzi)}` };

  return <StudyPage><main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-5 sm:px-6 md:py-8 lg:px-10">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb"><Link href="/dictionary?mode=characters" className="inline-flex min-h-11 items-center font-semibold hover:text-blue-700">Dictionary</Link><span aria-hidden="true">/</span><span>{item.hanzi}</span></nav>

    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_-38px_rgba(15,23,42,.5)]">
      <div className="grid md:grid-cols-[300px_minmax(0,1fr)]">
        <div className="flex min-h-[200px] flex-col items-center justify-center bg-slate-950 px-6 py-6 text-white md:min-h-[360px] md:py-8">
          <h1 className="text-7xl font-bold leading-none text-white md:text-8xl">{item.hanzi}</h1>
          {item.traditional ? <p className="mt-3 text-sm text-slate-300">Traditional <strong className="ml-2 text-xl text-white">{item.traditional}</strong></p> : null}
          {item.simplified ? <p className="mt-4 text-sm text-slate-300">Simplified <strong className="ml-2 text-xl text-white">{item.simplified}</strong></p> : null}
          <div className="mt-3"><AudioButton text={item.hanzi} label="Play browser voice preview" /></div>
        </div>
        <div className="p-4 sm:p-8">
          <div className="flex flex-wrap gap-2">{levels.map((level) => <Link key={level} href={`/dictionary?mode=characters&level=${level}`} className="inline-flex min-h-11 items-center rounded-full bg-blue-50 px-3 text-xs font-bold text-blue-700">HSK {level}</Link>)}{advanced ? <Link href="/dictionary?mode=characters&level=7" className="inline-flex min-h-11 items-center rounded-full bg-blue-50 px-3 text-xs font-bold text-blue-700">HSK 7–9</Link> : null}</div>
          <p className="mt-3 text-2xl font-bold text-blue-700">{item.pinyin.join(" · ")}</p>
          <h2 className="mt-3 text-xs font-bold uppercase tracking-[.14em] text-slate-500">Meaning</h2>
          <ul className="mt-2 space-y-2 text-lg leading-7 text-slate-900">{item.meanings.map((meaning) => <li key={meaning}>{meaning}</li>)}</ul>
          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
            <div className="bg-slate-50 p-4"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Radical</dt><dd className="mt-1 text-xl font-bold text-slate-950">{item.radical}</dd></div>
            <div className="bg-slate-50 p-4"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Strokes</dt><dd className="mt-1 text-xl font-bold text-slate-950">{item.strokes}</dd></div>
            <div className="bg-slate-50 p-4"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Structure</dt><dd className="mt-1 text-base font-bold capitalize text-slate-950">{item.structure === "unknown" ? "Unavailable in source" : item.structure.replaceAll("-", " ")}</dd></div>
            <div className="bg-slate-50 p-4"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Decomposition</dt><dd className="mt-1 break-all text-base font-bold text-slate-950">{item.decompositionStatus === "unknown" ? "Unavailable in source" : item.decomposition}</dd>{item.decompositionStatus === "partial" ? <p className="mt-1 text-xs leading-5 text-amber-800">Source decomposition contains an unavailable component.</p> : null}</div>
            <div className="bg-slate-50 p-4"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">HSK words</dt><dd className="mt-1 text-xl font-bold text-slate-950">{item.wordCount}</dd></div>
            <div className="bg-slate-50 p-4"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">First level</dt><dd className="mt-1 text-xl font-bold text-slate-950">HSK {item.firstLevel >= 7 ? "7–9" : item.firstLevel}</dd></div>
          </dl>
        </div>
      </div>
    </article>

    <section className="mt-7" aria-labelledby="containing-words"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-blue-700">Vocabulary connection</p><h2 id="containing-words" className="mt-1 text-2xl font-bold text-slate-950">Published words containing {item.hanzi}</h2></div><Link href={`/dictionary?q=${encodeURIComponent(item.hanzi)}&mode=words`} className="inline-flex min-h-11 items-center font-bold text-blue-700 hover:underline">See all results →</Link></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{item.wordsContainingCharacter.map((word) => <Link key={word.id} href={`/word/${encodeURIComponent(word.id)}`} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-400 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"><span className="flex items-baseline justify-between gap-3"><strong className="text-xl text-slate-950">{word.hanzi}</strong><span className="shrink-0 text-xs font-bold text-slate-500">HSK {word.levelBand === "7-9" ? "7–9" : word.level}</span></span><span className="mt-1 block font-semibold text-blue-700">{word.pinyin}</span><span className="mt-2 block line-clamp-2 text-sm leading-5 text-slate-600">{word.meaning}</span></Link>)}</div>
    </section>

    <div className="mt-8 grid gap-6 border-t border-slate-200 pt-6 lg:grid-cols-2">
      <section aria-labelledby="same-radical"><div className="mb-3 flex items-center justify-between gap-3"><h2 id="same-radical" className="text-xl font-bold text-slate-950">Same radical: {item.radical}</h2><Link href={`/dictionary?mode=characters&radical=${encodeURIComponent(item.radical)}`} className="text-sm font-bold text-blue-700">Browse radical →</Link></div><CharacterLinks items={item.sameRadical} /></section>
      <section aria-labelledby="same-pinyin"><div className="mb-3 flex items-center justify-between gap-3"><h2 id="same-pinyin" className="text-xl font-bold text-slate-950">Same pinyin: {item.pinyin[0]}</h2><Link href={`/dictionary?mode=pinyin&q=${encodeURIComponent(item.pinyin[0])}`} className="text-sm font-bold text-blue-700">Browse pinyin →</Link></div><CharacterLinks items={item.samePinyin} /></section>
    </div>
  </main></StudyPage>;
}
