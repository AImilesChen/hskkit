import type { Metadata } from "next";
import { DictionaryGuide } from "./dictionary-guide";
import { DictionarySearch, type CatalogResponse } from "../components/dictionary-search";
import { StudyPage } from "../components/study-shell";
import { characterIndexFacets, characterIndexMetadata } from "@/lib/dictionary/character-index";
import { formalWordAudioUrlByContentId, getHsk3LevelPreview, getHsk3LevelStatus, getHsk3LevelStatuses } from "@/lib/content/level-status";

const publishedWordCount = getHsk3LevelStatuses().filter((level) => level.level <= 7).reduce((total, level) => total + level.wordCount, 0);
const publishedCharacterCount = characterIndexMetadata.characterCount;

export const metadata: Metadata = {
  title: "Chinese-English Dictionary with Pinyin & HSK Levels — HSKKit",
  description: `Search ${publishedWordCount.toLocaleString("en-US")} HSK words by Hanzi, pinyin or English. Explore meanings, pronunciation, HSK levels and ${publishedCharacterCount.toLocaleString("en-US")} characters by radical and strokes.`,
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
    <main className="mx-auto w-full max-w-[1268px] flex-1 px-4 py-5 sm:px-[32px] md:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <header className="mb-4 border-b border-slate-200 pb-4">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Pinyin · HSK levels · Character lookup</p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Chinese-English Dictionary</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Search by Hanzi, pinyin or English. Explore meanings, pronunciation and HSK levels.</p>
        <p className="mt-2 text-sm text-slate-500"><strong className="font-semibold text-slate-800">{publishedWordCount.toLocaleString("en-US")}</strong> words <span className="mx-2" aria-hidden="true">·</span> <strong className="font-semibold text-slate-800">{publishedCharacterCount.toLocaleString("en-US")}</strong> HSK characters</p>
      </header>
      <DictionarySearch characterFacets={characterIndexFacets} initialWords={initialWords} />
      <DictionaryGuide wordCount={publishedWordCount} characterCount={publishedCharacterCount} />
    </main>
  </StudyPage>;
}
