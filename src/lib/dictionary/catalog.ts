import runtimeIndex from "../content/runtime-content-index.json" with { type: "json" };
import { publicAudioAsset, publishedContentAudioAsset, type PublicAudioAsset } from "../audio/assets.ts";
import { P1_CHARACTER_RECORDS } from "./p1-character-data.ts";

const dictionaryAssets = runtimeIndex.dictionaryAssets;
const runtimeWordAssets = Object.values(runtimeIndex.runtimeWords).flat();
const formalAudioByAssetId = new Map(
  dictionaryAssets.flatMap((asset) =>
    asset.audioSrc ? [[asset.id, asset.audioSrc] as const] : [],
  ),
);

export type ReleaseStatus = "published" | "withdrawn";

export interface StudyWord {
  id: string;
  slug: string;
  level: number;
  hanzi: string;
  traditional?: string;
  pinyin: string;
  meaning: string;
  partOfSpeech: string;
  example?: { hanzi: string; pinyin: string; meaning: string };
  examples: Array<{ hanzi: string; pinyin: string; meaning: string }>;
  collocations: Array<{ hanzi: string; pinyin: string; meaning: string }>;
  releaseStatus: ReleaseStatus;
  qaStatus: "approved";
  contentVersion: number;
  sourceVersion: string;
  audio: { status: "formal"; locale: "zh-CN"; src: string } | { status: "unavailable"; locale: "zh-CN" };
  audioAsset?: PublicAudioAsset;
}

export interface StudyCharacter {
  hanzi: string;
  pinyin: string[];
  meanings: string[];
  radical: string;
  radicalExplanation: string;
  structure: "left-right" | "top-bottom" | "enclosure" | "single-component" | "three-part";
  strokes: number;
  level: number;
  relatedWordSlugs: string[];
  releaseStatus: ReleaseStatus;
  qaStatus: "approved";
  contentVersion: number;
  sourceVersion: string;
}

export type LookupResult<T> =
  | { status: "published"; item: T }
  | { status: "withdrawn" }
  | { status: "missing" };

const activeReleaseId = runtimeIndex.releaseId;

const curated = [
  { hanzi: "学习", slug: "xue-xi", example: ["我每天学习中文。", "Wǒ měitiān xuéxí Zhōngwén.", "I study Chinese every day."] },
  { hanzi: "旅行", slug: "lu-xing", example: ["我们暑假去中国旅行。", "Wǒmen shǔjià qù Zhōngguó lǚxíng.", "We are traveling to China during summer vacation."] },
  { hanzi: "习惯", slug: "xi-guan", example: ["我习惯早起。", "Wǒ xíguàn zǎoqǐ.", "I am used to getting up early."] },
  { hanzi: "环境", slug: "huan-jing", example: ["这里的学习环境很安静。", "Zhèlǐ de xuéxí huánjìng hěn ānjìng.", "The study environment here is quiet."] },
  { hanzi: "经验", slug: "jing-yan", example: ["她有丰富的教学经验。", "Tā yǒu fēngfù de jiàoxué jīngyàn.", "She has extensive teaching experience."] },
  { hanzi: "交流", slug: "jiao-liu", example: ["我们用中文交流。", "Wǒmen yòng Zhōngwén jiāoliú.", "We communicate in Chinese."] },
  { hanzi: "责任", slug: "ze-ren", example: ["保护环境是大家的责任。", "Bǎohù huánjìng shì dàjiā de zérèn.", "Protecting the environment is everyone's responsibility."] },
  { hanzi: "改善", slug: "gai-shan", example: ["这个计划改善了服务质量。", "Zhège jìhuà gǎishàn le fúwù zhìliàng.", "This plan improved service quality."] },
  { hanzi: "趋势", slug: "qu-shi", example: ["我们需要了解市场趋势。", "Wǒmen xūyào liǎojiě shìchǎng qūshì.", "We need to understand market trends."] },
  { hanzi: "贡献", slug: "gong-xian", example: ["她为这个项目作出了重要贡献。", "Tā wèi zhège xiàngmù zuòchū le zhòngyào gòngxiàn.", "She made an important contribution to this project."] },
  { hanzi: "资源", slug: "zi-yuan", example: ["我们应该节约自然资源。", "Wǒmen yīnggāi jiéyuē zìrán zīyuán.", "We should conserve natural resources."] },
  { hanzi: "倡导", slug: "chang-dao", example: ["学校倡导终身学习。", "Xuéxiào chàngdǎo zhōngshēn xuéxí.", "The school advocates lifelong learning."] },
  { hanzi: "买", slug: "mai", example: ["我去商店买书。", "Wǒ qù shāngdiàn mǎi shū.", "I am going to the shop to buy a book."] },
] as const;

const wordEditorial: Record<string, {
  examples?: Array<{ hanzi: string; pinyin: string; meaning: string }>;
  collocations?: Array<{ hanzi: string; pinyin: string; meaning: string }>;
}> = {
  "xue-xi": {
    examples: [
      { hanzi: "我每天学习中文。", pinyin: "Wǒ měitiān xuéxí Zhōngwén.", meaning: "I study Chinese every day." },
      { hanzi: "她在图书馆学习。", pinyin: "Tā zài túshūguǎn xuéxí.", meaning: "She studies in the library." },
      { hanzi: "我们一起学习新词。", pinyin: "Wǒmen yìqǐ xuéxí xīncí.", meaning: "We learn new words together." },
    ],
    collocations: [
      { hanzi: "学习中文", pinyin: "xuéxí Zhōngwén", meaning: "study Chinese" },
      { hanzi: "学习方法", pinyin: "xuéxí fāngfǎ", meaning: "study method" },
      { hanzi: "认真学习", pinyin: "rènzhēn xuéxí", meaning: "study diligently" },
    ],
  },
};

function studyWordFromAsset(
  asset: (typeof runtimeWordAssets)[number],
  slug: string,
  example?: StudyWord["example"],
): StudyWord {
  const editorial = wordEditorial[slug];
  const examples = editorial?.examples ?? (example ? [example] : []);
  return {
    id: asset.id,
    slug,
    level: asset.level,
    hanzi: asset.hanzi,
    pinyin: asset.pinyin,
    meaning: asset.meaning,
    partOfSpeech: asset.partOfSpeech,
    example,
    examples,
    collocations: editorial?.collocations ?? [],
    releaseStatus: "published",
    qaStatus: "approved",
    contentVersion: asset.version,
    sourceVersion: activeReleaseId,
    audio: formalAudioByAssetId.has(asset.id)
      ? { status: "formal", locale: "zh-CN", src: formalAudioByAssetId.get(asset.id)! }
      : { status: "unavailable", locale: "zh-CN" },
    audioAsset: publicAudioAsset(publishedContentAudioAsset(asset.id, asset.hanzi)),
  };
}

export const STUDY_WORDS: StudyWord[] = curated.flatMap((entry) => {
  const asset = dictionaryAssets.find((candidate) => candidate.hanzi === entry.hanzi);
  if (!asset) return [];
  return [
    studyWordFromAsset(asset, entry.slug, {
      hanzi: entry.example[0],
      pinyin: entry.example[1],
      meaning: entry.example[2],
    }),
  ];
});

const characterEditorial = P1_CHARACTER_RECORDS;

export const STUDY_CHARACTERS: StudyCharacter[] = characterEditorial.flatMap((entry) => {
  const related = entry.relatedWordSlugs.map((slug) => STUDY_WORDS.find((word) => word.slug === slug)).filter((word): word is StudyWord => Boolean(word));
  if (!related.length) return [];
  return [{ ...entry, pinyin: [...entry.pinyin], meanings: [...entry.meanings], relatedWordSlugs: related.map((word) => word.slug), level: Math.min(...related.map((word) => word.level)), releaseStatus: "published" as const, qaStatus: "approved" as const, contentVersion: 1, sourceVersion: entry.editorialVersion }];
});

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[\s'-]+/g, "");
}

export function listPublishedWords(options: { level?: number } = {}): StudyWord[] {
  return STUDY_WORDS.filter((word) => !options.level || word.level === options.level);
}

export function searchPublishedWords(query: string, options: { level?: number } = {}): StudyWord[] {
  const words = listPublishedWords(options);
  const needle = normalize(query.trim());
  if (!needle) return words;
  return words.filter((word) => {
    const exampleValues = word.example
      ? [word.example.hanzi, word.example.meaning]
      : [];
    return [word.hanzi, word.pinyin, word.meaning, ...exampleValues].some(
      (value) => normalize(value).includes(needle),
    );
  });
}

export function searchPublishedCharacters(query: string, options: { level?: number } = {}): StudyCharacter[] {
  const needle = normalize(query.trim());
  const characters = STUDY_CHARACTERS.filter((character) => !options.level || character.level === options.level);
  if (!needle) return characters;
  return characters.filter((character) => [character.hanzi, ...character.pinyin, ...character.meanings].some((value) => normalize(value).includes(needle)));
}

export function getWordBySlug(slug: string): LookupResult<StudyWord> {
  const curatedWord = STUDY_WORDS.find((item) => item.slug === slug);
  if (curatedWord) return { status: "published", item: curatedWord };
  const asset = dictionaryAssets.find((candidate) => candidate.id === slug)
    ?? runtimeWordAssets.find((candidate) => candidate.id === slug);
  return asset
    ? { status: "published", item: studyWordFromAsset(asset, asset.id) }
    : { status: "missing" };
}

export function getCharacterByHanzi(hanzi: string): LookupResult<StudyCharacter> {
  const character = STUDY_CHARACTERS.find((item) => item.hanzi === hanzi);
  return character ? { status: "published", item: character } : { status: "missing" };
}

export function relatedWordsForCharacter(character: StudyCharacter): StudyWord[] {
  return character.relatedWordSlugs.flatMap((slug) => {
    const result = getWordBySlug(slug);
    return result.status === "published" ? [result.item] : [];
  });
}

const wordRelationships: Record<string, ReadonlyArray<{ slug: string; relationship: string }>> = {
  "xue-xi": [
    { slug: "xi-guan", relationship: "Shared character 习 · a learning habit" },
    { slug: "huan-jing", relationship: "Common context · a learning environment" },
    { slug: "jiao-liu", relationship: "Next use · communicate in Chinese" },
  ],
  "xi-guan": [{ slug: "xue-xi", relationship: "Shared character 习 · build a study habit" }],
  "huan-jing": [
    { slug: "xue-xi", relationship: "Common phrase · 学习环境" },
    { slug: "ze-ren", relationship: "Topic link · environmental responsibility" },
  ],
  "jiao-liu": [{ slug: "xue-xi", relationship: "Learning link · use what you study" }],
  "ze-ren": [{ slug: "huan-jing", relationship: "Topic link · responsibility for the environment" }],
  "gai-shan": [{ slug: "huan-jing", relationship: "Common phrase · 改善环境" }],
  "zi-yuan": [{ slug: "huan-jing", relationship: "Topic link · natural resources and environment" }],
  "chang-dao": [{ slug: "xue-xi", relationship: "Common phrase · 倡导终身学习" }],
};

export function relatedWordsForWord(word: StudyWord): Array<{ word: StudyWord; relationship: string }> {
  return (wordRelationships[word.slug] ?? []).flatMap((relation) => {
    const result = getWordBySlug(relation.slug);
    return result.status === "published" ? [{ word: result.item, relationship: relation.relationship }] : [];
  });
}

export function sitemapContentRoutes(): string[] {
  const routes = ["/levels", "/dictionary", "/dictionary/radicals", "/dictionary/strokes"];
  for (const word of STUDY_WORDS) routes.push(`/word/${word.slug}`);
  for (const character of STUDY_CHARACTERS) routes.push(`/character/${encodeURIComponent(character.hanzi)}`);
  return [...new Set(routes)];
}
