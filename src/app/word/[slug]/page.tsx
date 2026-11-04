import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DictionaryPronunciation } from "../../components/dictionary-pronunciation";
import { DictionaryPinyin } from "../../components/dictionary-pinyin";
import { DictionaryWordActions } from "../../components/dictionary-word-actions";
import TodayWordCompletion from "../../components/today-word-completion";
import { WordScriptToggle } from "../../components/word-script-toggle";
import { StudyPage } from "../../components/study-shell";
import { listPublishedWords, relatedWordsForWord } from "@/lib/dictionary/catalog";
import { getIndexedCharacter } from "@/lib/dictionary/character-index";
import { getDictionaryLearningContext } from "@/lib/dictionary/p2-server";
import { getPublishedWordBySlug, splitDictionaryMeanings } from "@/lib/dictionary/runtime-word";
import { todayContentByAssetId, todayMeaningCheck } from "@/lib/learning/today-content";
import "../word-detail.css";

type Props = { params: Promise<{ slug: string }> };

const PART_OF_SPEECH_LABELS: Record<string, string> = {
  V: "Verb",
  N: "Noun",
  Adj: "Adjective",
  Adv: "Adverb",
  Pron: "Pronoun",
  Prep: "Preposition",
  Conj: "Conjunction",
  Num: "Number",
  Cl: "Measure word",
  Part: "Particle",
  Aux: "Particle",
  M: "Measure word",
  Phrase: "Phrase",
};

function partOfSpeechLabel(value: string) {
  return value.split("/").map((part) => PART_OF_SPEECH_LABELS[part.trim()] ?? part.trim()).join(" / ");
}

function WordExample({ example, target }: { example: { hanzi: string; pinyin: string; meaning: string }; target: string }) {
  const parts = target ? example.hanzi.split(target) : [example.hanzi];
  return <div className="dictionary-example"><p className="dictionary-example-hanzi" lang="zh-Hans">{parts.map((part, index) => <span key={index}>{index > 0 && <strong className="dictionary-example-target">{target}</strong>}{part}</span>)}</p><p className="dictionary-example-pinyin"><DictionaryPinyin text={example.pinyin} /></p><p className="dictionary-example-meaning">{example.meaning}</p></div>;
}

export const revalidate = 86_400;

export function generateStaticParams() {
  return listPublishedWords().map((word) => ({ slug: word.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getPublishedWordBySlug((await params).slug);
  if (result.status !== "published") return { title: "Word unavailable — HSKKit", robots: { index: false, follow: false } };
  const word = result.item;
  const audioDescription = word.audioAsset
    ? "Hear the published synthesized pronunciation, review its meaning, and continue with focused practice."
    : "Review its meaning, use a browser voice preview, and continue with focused practice.";
  return {
    title: `${word.hanzi} (${word.pinyin}) Meaning and HSK Level — HSKKit`,
    description: word.example
      ? `${word.hanzi} means ${word.meaning}. Read an example and continue with HSK ${word.level} practice. ${audioDescription}`
      : `${word.hanzi} means ${word.meaning}. Save the word and continue with HSK ${word.level} practice. ${audioDescription}`,
    alternates: { canonical: `/word/${word.slug}` },
  };
}

export default async function WordPage({ params }: Props) {
  const result = await getPublishedWordBySlug((await params).slug);
  if (result.status !== "published") notFound();
  const word = result.item;
  const learningContext = await getDictionaryLearningContext(word.id);
  const traditional = learningContext?.current.traditional ?? word.traditional ?? word.hanzi;
  const toneComparisons = learningContext?.toneComparisons.filter((item) => item.pinyin !== learningContext.current.pinyin) ?? [];
  const nextWord = learningContext?.nextWord ?? null;
  const levelLabel = word.level >= 7 ? "7–9" : String(word.level);
  const characters = [...word.hanzi].filter((character, index, values) => values.indexOf(character) === index && getIndexedCharacter(character));
  const definitions = splitDictionaryMeanings(word.meaning);
  const related = relatedWordsForWord(word);
  const additionalExamples = word.examples.slice(1);
  const studySectionCount = Number(additionalExamples.length > 0)
    + Number(word.collocations.length > 0)
    + Number(toneComparisons.length > 0)
    + Number(characters.length > 0);
  const todayContent = todayContentByAssetId(word.id);
  const meaningCheck = todayContent ? todayMeaningCheck(todayContent) : undefined;
  const schema = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: word.hanzi,
    inDefinedTermSet: `https://hskkit.com/vocabulary/${word.level}`,
    description: word.meaning,
    url: `https://hskkit.com/word/${word.slug}`,
  };

  return <StudyPage>
    <main className="dictionary-word-page mx-auto w-full max-w-[1280px] flex-1 px-4 py-5 sm:px-6 md:py-8 lg:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
        <Link href="/dictionary" className="font-semibold hover:text-blue-700">Dictionary</Link><span aria-hidden="true">/</span>
        <Link href={`/vocabulary/${word.level}`} className="font-semibold hover:text-blue-700">HSK {levelLabel}</Link><span aria-hidden="true">/</span>
        <span className="text-slate-700">{word.hanzi}</span>
      </nav>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <article className="dictionary-entry min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white xl:col-start-1 xl:row-start-1">
            <header className="dictionary-entry-head">
              <div className="dictionary-word-meta"><Link href={`/vocabulary/${word.level}`}>HSK {levelLabel}</Link><span>{partOfSpeechLabel(word.partOfSpeech)}</span></div>
              <WordScriptToggle simplified={word.hanzi} traditional={traditional} className="dictionary-word-script" />
              <DictionaryPronunciation hanzi={word.hanzi} pinyin={word.pinyin} asset={word.audioAsset} />
              <div className="dictionary-definitions"><p className="dictionary-section-label">Definitions</p><ol>{definitions.map((definition, index) => <li key={`${definition}-${index}`}><span aria-hidden="true">{index + 1}</span><span>{definition}</span></li>)}</ol></div>
            </header>
            {word.examples[0] ? <section className="dictionary-primary-example" aria-labelledby="word-example-title"><h2 id="word-example-title" className="dictionary-section-label">Example in context</h2><WordExample example={word.examples[0]} target={word.hanzi} /></section> : null}
          </article>

          <aside className="xl:sticky xl:top-24 xl:col-start-2 xl:row-start-1 xl:row-span-2 xl:self-start">
            <DictionaryWordActions assetId={word.id} level={word.level} layout="panel" />
          </aside>

        <div className="min-w-0 xl:col-start-1 xl:row-start-2">
          {meaningCheck ? <Suspense fallback={null}><div className="mt-5"><TodayWordCompletion assetId={word.id} meaningCheck={meaningCheck} /></div></Suspense> : null}

      {studySectionCount >= 3 && <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <span className="inline-flex min-h-10 items-center px-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Study sections</span>
        {additionalExamples.length > 0 ? <a href="#examples" className="inline-flex min-h-10 items-center rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700">Examples</a> : null}
        {word.collocations.length > 0 ? <a href="#collocations" className="inline-flex min-h-10 items-center rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700">Collocations</a> : null}
        {toneComparisons.length > 0 ? <a href="#tone-comparison" className="inline-flex min-h-10 items-center rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700">Tone contrast</a> : null}
        {characters.length > 0 ? <a href="#characters" className="inline-flex min-h-10 items-center rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700">Characters</a> : null}
      </nav>}

      <div className="mt-5 grid gap-5 xl:grid-cols-12">
          {additionalExamples.length > 0 && <section id="examples" className={`scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 ${word.collocations.length > 0 ? "xl:col-span-7" : "xl:col-span-12"}`} aria-labelledby="examples-title">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">In context</p>
            <h2 id="examples-title" className="mt-2 text-2xl font-bold text-slate-950">More real examples</h2>
            <div className="mt-4 divide-y divide-slate-100">{additionalExamples.map((example) => <div key={example.hanzi} className="py-4 first:pt-0 last:pb-0"><WordExample example={example} target={word.hanzi} /></div>)}</div>
          </section>}

          {word.collocations.length > 0 && <section id="collocations" className={`scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 ${additionalExamples.length > 0 ? "xl:col-span-5" : "xl:col-span-12"}`} aria-labelledby="collocations-title">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">Natural combinations</p>
            <h2 id="collocations-title" className="mt-2 text-2xl font-bold text-slate-950">Common collocations</h2>
            <div className={`mt-4 grid gap-3 ${additionalExamples.length > 0 ? "" : "sm:grid-cols-2 xl:grid-cols-3"}`}>{word.collocations.map((item) => <div key={item.hanzi} className="rounded-xl bg-slate-50 p-4"><p lang="zh-Hans" className="dictionary-learning-hanzi text-lg text-slate-950">{item.hanzi}</p><p className="mt-1 text-sm font-semibold text-blue-700"><DictionaryPinyin text={item.pinyin} /></p><p className="mt-2 text-sm text-slate-600">{item.meaning}</p></div>)}</div>
          </section>}

          {toneComparisons.length > 0 ? <section id="tone-comparison" className={`scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 ${characters.length > 1 ? "xl:col-span-7" : "xl:col-span-12"}`} aria-labelledby="tone-comparison-title">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">Pronunciation contrast</p>
            <h2 id="tone-comparison-title" className="mt-2 text-2xl font-bold text-slate-950">Same sound, compare the tones</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">These entries share the same tone-free pinyin spelling in the published catalog. Read the tone marks before comparing the meanings.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">{toneComparisons.slice(0, 2).map((item) => <Link key={item.assetId} href={`/word/${encodeURIComponent(item.assetId)}`} className="dictionary-tone-card rounded-xl border border-slate-200 px-4 py-3 transition hover:border-blue-400 hover:bg-blue-50"><div className="flex flex-wrap items-baseline gap-3"><strong className="text-xl text-slate-950">{item.hanzi}</strong><span className="font-semibold text-blue-700"><DictionaryPinyin text={item.pinyin} /></span><small>HSK {item.levelBand === "7-9" ? "7–9" : item.levelBand}</small></div><p className="mt-1 text-sm text-slate-600">{item.meaning}</p></Link>)}</div>
            {toneComparisons.length > 2 && <details className="dictionary-more-tones"><summary>Show {toneComparisons.length - 2} more pronunciation comparisons</summary><div className="grid gap-3 sm:grid-cols-2">{toneComparisons.slice(2).map((item) => <Link key={item.assetId} href={`/word/${encodeURIComponent(item.assetId)}`} className="dictionary-tone-card rounded-xl border border-slate-200 px-4 py-3 hover:border-blue-400"><div className="flex flex-wrap items-baseline gap-3"><strong className="text-xl text-slate-950">{item.hanzi}</strong><span className="text-blue-700"><DictionaryPinyin text={item.pinyin} /></span><small>HSK {item.levelBand === "7-9" ? "7–9" : item.levelBand}</small></div><p className="mt-1 text-sm text-slate-600">{item.meaning}</p></Link>)}</div></details>}
          </section> : null}
          {characters.length > 0 && <section id="characters" className={`scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 ${toneComparisons.length > 0 && characters.length > 1 ? "xl:col-span-5" : "xl:col-span-12"}`} aria-labelledby="characters-title">
            <h2 id="characters-title" className="text-xl font-bold text-slate-950">Character breakdown</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Open each character to inspect its radical, strokes and connected vocabulary.</p>
            <div className="mt-4 flex flex-wrap gap-3">{characters.map((character) => <Link key={character} href={`/character/${encodeURIComponent(character)}`} className="flex min-h-16 min-w-60 flex-1 items-center justify-between rounded-xl border border-slate-200 px-4 hover:border-blue-400 hover:bg-blue-50"><span className="text-3xl font-bold text-slate-950">{character}</span><span className="font-semibold text-blue-700">Character details →</span></Link>)}</div>
          </section>}

          {related.length > 0 && <section className="xl:col-span-12" aria-labelledby="related-title">
            <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Connected vocabulary</p><h2 id="related-title" className="mt-1 text-2xl font-bold text-slate-950">Words that connect to {word.hanzi}</h2></div>
            <div className="grid gap-3 sm:grid-cols-2">{related.map((item) => <Link key={item.word.slug} href={`/word/${item.word.slug}`} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-400 hover:shadow-md"><div className="flex items-baseline gap-3"><strong className="text-2xl text-slate-950">{item.word.hanzi}</strong><span className="text-sm font-semibold text-blue-700"><DictionaryPinyin text={item.word.pinyin} /></span></div><p className="mt-2 text-sm text-slate-700">{item.word.meaning}</p><p className="mt-3 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">{item.relationship}</p></Link>)}</div>
          </section>}
      </div>

      <section className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center" aria-labelledby="keep-going-title">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">Continue learning</p>
          <h2 id="keep-going-title" className="mt-1 text-xl font-bold text-slate-950">Keep going</h2>
          {nextWord ? <Link href={`/word/${encodeURIComponent(nextWord.assetId)}`} className="mt-3 flex max-w-2xl items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4 hover:border-blue-400"><span><span className="block text-xs font-bold uppercase tracking-[0.1em] text-blue-700">Next in HSK {levelLabel}</span><span className="mt-1 flex items-baseline gap-2"><strong className="text-2xl text-slate-950">{nextWord.hanzi}</strong><span className="text-sm font-semibold text-blue-700"><DictionaryPinyin text={nextWord.pinyin} /></span></span><span className="mt-1 block text-sm text-slate-600">{nextWord.meaning}</span></span><span className="text-xl font-bold text-blue-700" aria-hidden="true">→</span></Link> : <p className="mt-2 text-sm text-slate-600">You have reached the end of this level sequence.</p>}
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
          <Link href={`/vocabulary/${word.level}`} className="inline-flex min-h-11 items-center justify-between gap-4 rounded-lg bg-white px-4 font-semibold text-slate-800 ring-1 ring-slate-200 hover:ring-blue-400">HSK {levelLabel} word list <span aria-hidden="true">→</span></Link>
          <Link href="/dictionary" className="inline-flex min-h-11 items-center justify-between gap-4 rounded-lg bg-white px-4 font-semibold text-slate-800 ring-1 ring-slate-200 hover:ring-blue-400">Find another word <span aria-hidden="true">→</span></Link>
          <Link href="/today" className="inline-flex min-h-11 items-center justify-between gap-4 rounded-lg bg-white px-4 font-semibold text-slate-800 ring-1 ring-slate-200 hover:ring-blue-400">Open Today <span aria-hidden="true">→</span></Link>
        </div>
      </section>
        </div>
      </div>
    </main>
  </StudyPage>;
}
