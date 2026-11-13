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
import { wordPrebuildParams } from "@/lib/dictionary/word-prebuild";
import { wordDetailContent, type DetailWord } from "@/lib/dictionary/word-detail-content";
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
  return wordPrebuildParams();
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
  const content = wordDetailContent(word);
  const characters = content.characters;
  const definitions = splitDictionaryMeanings(word.meaning);
  const studySectionCount = Number(content.examples.length > 0)
    + Number(content.containing.length > 0)
    + Number(content.collocations.length > 0)
    + Number(content.grammar.length > 0)
    + Number(toneComparisons.length > 0);
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
    <main className="dictionary-word-page mx-auto w-full flex-1 px-4 py-5 sm:px-6 md:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <nav className="dictionary-breadcrumb" aria-label="Breadcrumb">
        <Link href="/dictionary">Dictionary</Link><span aria-hidden="true">/</span>
        <Link href={`/vocabulary/${word.level}`}>HSK {levelLabel}</Link><span aria-hidden="true">/</span>
        <span lang="zh-Hans">{word.hanzi}</span>
      </nav>

      <article className="dictionary-entry">
        <div className="dictionary-overview">
          <header className="dictionary-entry-head">
            <div className="dictionary-word-meta"><Link href={`/vocabulary/${word.level}`}>HSK {levelLabel}</Link><span>{partOfSpeechLabel(word.partOfSpeech)}</span></div>
            <WordScriptToggle simplified={word.hanzi} traditional={traditional} className="dictionary-word-script" />
            <DictionaryPronunciation hanzi={word.hanzi} pinyin={word.pinyin} asset={word.audioAsset} />
            <div className="dictionary-definitions"><p className="dictionary-section-label">Definitions</p><ol>{definitions.map((definition, index) => <li key={`${definition}-${index}`}><span aria-hidden="true">{index + 1}</span><span>{definition}</span></li>)}</ol></div>
          </header>
          {characters.length > 0 && <aside id="characters" className="dictionary-character-facts" aria-labelledby="characters-title">
            <p className="dictionary-section-label">At a glance</p>
            <h2 id="characters-title">{characters.length === 1 ? "Character details" : "Character breakdown"}</h2>
            <ul>{characters.map(character => <li key={character.hanzi}>
              <Link href={`/character/${encodeURIComponent(character.hanzi)}`} aria-label={`${character.hanzi}: character details`}><span lang="zh-Hans" className="dictionary-learning-hanzi">{character.hanzi}</span><span><span>Radical <b lang="zh-Hans" className="dictionary-learning-hanzi">{character.radical || "—"}</b></span><span>{character.strokes > 0 ? `${character.strokes} strokes` : "Stroke count unavailable"}</span></span><span aria-hidden="true">→</span></Link>
            </li>)}</ul>
            <p>Open a character for its structure and connected words.</p>
          </aside>}
        </div>
        <div className="dictionary-entry-actions"><DictionaryWordActions assetId={word.id} level={word.level} /></div>
      </article>

      {studySectionCount >= 3 && <nav aria-label="On this page" className="dictionary-section-nav">
        {content.examples.length > 0 && <a href="#examples">Examples <span>{content.examples.length}</span></a>}
        {content.containing.length > 0 && <a href="#containing">Words with {word.hanzi}</a>}
        {content.collocations.length > 0 && <a href="#collocations">Collocations</a>}
        {content.grammar.length > 0 && <a href="#grammar">Grammar</a>}
        {toneComparisons.length > 0 && <a href="#tone-comparison">Tone contrast</a>}
      </nav>}

      <div className={`dictionary-context-row ${content.related.length && content.examples.length ? "dictionary-context-row-split" : ""}`}>
        {content.examples.length > 0 && <section id="examples" className="dictionary-study-section" aria-labelledby="examples-title">
          <div className="dictionary-section-heading"><p className="dictionary-section-label">In context</p><h2 id="examples-title">Example sentences</h2></div>
          <ol className="dictionary-example-list">{content.examples.slice(0, 3).map((example, index) => <li key={example.hanzi}><span className="dictionary-example-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><WordExample example={example} target={word.hanzi} /></li>)}</ol>
          {content.examples.length > 3 && <details className="dictionary-extra-content"><summary>Show {content.examples.length - 3} more examples</summary><ol className="dictionary-example-list" start={4}>{content.examples.slice(3).map((example, index) => <li key={example.hanzi}><span className="dictionary-example-number" aria-hidden="true">{String(index + 4).padStart(2, "0")}</span><WordExample example={example} target={word.hanzi} /></li>)}</ol></details>}
        </section>}
        {content.related.length > 0 && <section className="dictionary-study-section" aria-labelledby="related-title">
          <div className="dictionary-section-heading"><p className="dictionary-section-label">Keep going</p><h2 id="related-title">Related words</h2></div>
          <WordRows words={content.related} showRelationship />
        </section>}
      </div>

      {content.containing.length > 0 && <section id="containing" className="dictionary-study-section" aria-labelledby="containing-title">
        <div className="dictionary-section-heading"><p className="dictionary-section-label">Build your vocabulary</p><h2 id="containing-title">{characters.length === 1 ? <>Words with <span lang="zh-Hans" className="dictionary-learning-hanzi">{word.hanzi}</span></> : "Words with these characters"}</h2><p>Start with the lower HSK levels, then explore further.</p></div>
        <div className={content.containing.length > 1 ? "dictionary-character-groups" : ""}>{content.containing.map(group => <div className="dictionary-containing-group" key={group.character}>
          {characters.length > 1 && <h3>With <span lang="zh-Hans" className="dictionary-learning-hanzi">{group.character}</span></h3>}
          <ContainingWordRows words={group.words} level={word.level} hasCombinations={content.collocations.length > 0} />
          <Link className="dictionary-section-footer" href={group.href}>Browse all words with {group.character}<span aria-hidden="true">→</span></Link>
        </div>)}</div>
        {characters.length > 4 && <p className="dictionary-section-footnote">Showing the first four characters. Open the character details above to explore the rest.</p>}
      </section>}

      {(content.usage || content.collocations.length > 0) && <section id="collocations" className="dictionary-study-section" aria-labelledby="collocations-title">
        <div className="dictionary-section-heading"><p className="dictionary-section-label">Put it to use</p><h2 id="collocations-title">Common combinations &amp; usage</h2></div>
        <div className={`dictionary-usage-grid ${content.usage && content.collocations.length ? "dictionary-usage-grid-split" : ""}`}>
          {content.collocations.length > 0 && <ul className="dictionary-collocation-list">{content.collocations.map(item => <li key={item.hanzi}><p lang="zh-Hans" className="dictionary-learning-hanzi">{item.hanzi}</p><p><DictionaryPinyin text={item.pinyin} /></p><p>{item.meaning}</p></li>)}</ul>}
          {content.usage && <div className="dictionary-usage-note"><h3>{content.usage.title}</h3><p>{content.usage.explanation}</p></div>}
        </div>
      </section>}

      {content.grammar.length > 0 && <section id="grammar" className="dictionary-study-section" aria-labelledby="grammar-title">
        <div className="dictionary-section-heading"><p className="dictionary-section-label">From word to sentence</p><h2 id="grammar-title">Related grammar</h2><p>Patterns used in the examples on this page.</p></div>
        <ul className="dictionary-grammar-list">{content.grammar.map(item => <li key={item.slug}>
          <Link href={`/grammar/${item.slug}`}><span className="dictionary-linked-title">{item.title}<LevelLabel level={item.level} /></span><span className="dictionary-grammar-pattern">{item.pattern}</span><span className="dictionary-link-label">Open lesson →</span></Link>
          <p lang="zh-Hans" className="dictionary-learning-hanzi">{item.sentence}</p><p>{item.reason}</p>
        </li>)}</ul>
      </section>}

      {toneComparisons.length > 0 && <section id="tone-comparison" className="dictionary-study-section" aria-labelledby="tone-comparison-title">
        <div className="dictionary-section-heading"><p className="dictionary-section-label">Pronunciation contrast</p><h2 id="tone-comparison-title">Same sound, compare the tones</h2><p>These words share the same tone-free pinyin spelling. Compare their tone marks and meanings.</p></div>
        <WordRows words={toneComparisons.slice(0, 2).map(item => ({ ...item, id: item.assetId }))} />
        {toneComparisons.length > 2 && <details className="dictionary-extra-content"><summary>Show {toneComparisons.length - 2} more pronunciation comparisons</summary><WordRows words={toneComparisons.slice(2).map(item => ({ ...item, id: item.assetId }))} /></details>}
      </section>}

      {content.readings.length > 0 && <section className="dictionary-study-section" aria-labelledby="readings-title">
        <div className="dictionary-section-heading"><p className="dictionary-section-label">Read in context</p><h2 id="readings-title">Find this word in a passage</h2></div>
        <ul className="dictionary-reading-list">{content.readings.map(item => <li key={item.slug}><Link href={`/reading/${item.slug}`}><span className="dictionary-linked-title">{item.title}<LevelLabel level={item.level} /></span><span>This passage contains {word.hanzi}. Open reading →</span></Link></li>)}</ul>
      </section>}

      {meaningCheck && <Suspense fallback={null}><div className="dictionary-completion"><TodayWordCompletion assetId={word.id} meaningCheck={meaningCheck} /></div></Suspense>}
      <section className="dictionary-continue" aria-labelledby="keep-going-title">
        <div><p className="dictionary-section-label">Continue learning</p><h2 id="keep-going-title">Keep going</h2>
          {nextWord ? <Link className="dictionary-next-word" href={`/word/${encodeURIComponent(nextWord.assetId)}`}><span><span>Next in HSK {levelLabel}</span><strong lang="zh-Hans" className="dictionary-learning-hanzi">{nextWord.hanzi}</strong><DictionaryPinyin text={nextWord.pinyin} /><span>{nextWord.meaning}</span></span><span aria-hidden="true">→</span></Link> : <p>Browse another word to keep learning.</p>}
        </div>
        <nav aria-label="Continue learning"><Link href={`/vocabulary/${word.level}`}>HSK {levelLabel} word list →</Link><Link href="/dictionary">Find another word →</Link><Link href="/today">Open Today →</Link></nav>
      </section>
    </main>
  </StudyPage>;
}

function LevelLabel({ level }: { level: number }) {
  return <span className="dictionary-level-label">HSK {level >= 7 ? "7–9" : level}</span>;
}

function WordRows({ words, showRelationship = false }: { words: Array<DetailWord & { relationship?: string }>; showRelationship?: boolean }) {
  return <ul className="dictionary-word-rows">{words.map(item => <li key={item.id}><Link href={`/word/${encodeURIComponent(item.id)}`}>
    <span lang="zh-Hans" className="dictionary-row-hanzi dictionary-learning-hanzi">{item.hanzi}</span>
    <span className="dictionary-row-definition"><DictionaryPinyin text={item.pinyin} /><span>{item.meaning}</span>{showRelationship && item.relationship && <small>{item.relationship}</small>}</span>
    <LevelLabel level={item.level} />
  </Link></li>)}</ul>;
}

function ContainingWordRows({ words, level, hasCombinations }: { words: DetailWord[]; level: number; hasCombinations: boolean }) {
  const starter = words.filter(item => item.level <= Math.max(3, level));
  const further = words.filter(item => item.level > Math.max(3, level));
  return <>
    {starter.length > 0 ? <WordRows words={starter} /> : <p className="dictionary-level-note">These entries start at HSK {words[0].level >= 7 ? "7–9" : words[0].level}.{hasCombinations && <> <a href="#collocations">Try everyday combinations first →</a></>}</p>}
    {further.length > 0 && <details className="dictionary-extra-content"><summary>Explore {further.length} higher-level {further.length === 1 ? "word" : "words"}</summary><WordRows words={further} /></details>}
  </>;
}
