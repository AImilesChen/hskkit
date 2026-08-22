import catalog from "../content/catalog.json" with { type: "json" };
import { publishedAudioForContent, publishedContentAssets, publicAudioSrc } from "../content/published-content.ts";
import type { ContentRepository } from "../content/repository.ts";

export type ReleaseStatus = "published" | "withdrawn";

export interface StudyWord {
  id: string;
  slug: string;
  level: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  partOfSpeech: string;
  example: { hanzi: string; pinyin: string; meaning: string };
  releaseStatus: ReleaseStatus;
  qaStatus: "approved";
  contentVersion: number;
  sourceVersion: string;
  audio: { status: "formal"; locale: "zh-CN"; src: string } | { status: "unavailable"; locale: "zh-CN" };
}

export interface StudyCharacter {
  hanzi: string;
  pinyin: string[];
  meanings: string[];
  radical: string;
  strokes: number;
  level: number;
  relatedWordSlugs: string[];
  releaseStatus: ReleaseStatus;
  qaStatus: "approved";
  contentVersion: number;
  sourceVersion: string;
}

type LookupResult<T> =
  | { status: "published"; item: T }
  | { status: "withdrawn" }
  | { status: "missing" };

const repository = catalog as ContentRepository;
const activeReleaseId = repository.activeReleaseByStandard.hsk3;
if (!activeReleaseId) throw new Error("Dictionary requires the active formal HSK 3.0 release");

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

export const STUDY_WORDS: StudyWord[] = curated.flatMap((entry) => {
  const asset = publishedContentAssets.find((candidate) => candidate.kind === "word" && candidate.payload.hanzi === entry.hanzi);
  if (!asset) return [];
  const audio = publishedAudioForContent(asset.id)[0];
  return [{
    id: asset.id,
    slug: entry.slug,
    level: asset.level,
    hanzi: String(asset.payload.hanzi),
    pinyin: String(asset.payload.pinyin ?? ""),
    meaning: String(asset.payload.meaning ?? ""),
    partOfSpeech: String(asset.payload.partOfSpeech ?? ""),
    example: { hanzi: entry.example[0], pinyin: entry.example[1], meaning: entry.example[2] },
    releaseStatus: "published" as const,
    qaStatus: "approved" as const,
    contentVersion: asset.version,
    sourceVersion: activeReleaseId,
    audio: audio ? { status: "formal" as const, locale: "zh-CN" as const, src: publicAudioSrc(audio) } : { status: "unavailable" as const, locale: "zh-CN" as const },
  }];
});

const characterEditorial = [
  { hanzi: "学", pinyin: ["xué"], meanings: ["to study; to learn"], radical: "子 (child)", strokes: 8, relatedWordSlugs: ["xue-xi"] },
  { hanzi: "习", pinyin: ["xí"], meanings: ["to practise; habit"], radical: "乙", strokes: 3, relatedWordSlugs: ["xue-xi", "xi-guan"] },
  { hanzi: "买", pinyin: ["mǎi"], meanings: ["to buy; to purchase"], radical: "乙", strokes: 6, relatedWordSlugs: ["mai"] },
] as const;

export const STUDY_CHARACTERS: StudyCharacter[] = characterEditorial.flatMap((entry) => {
  const related = entry.relatedWordSlugs.map((slug) => STUDY_WORDS.find((word) => word.slug === slug)).filter((word): word is StudyWord => Boolean(word));
  if (!related.length) return [];
  return [{ ...entry, pinyin: [...entry.pinyin], meanings: [...entry.meanings], relatedWordSlugs: related.map((word) => word.slug), level: Math.min(...related.map((word) => word.level)), releaseStatus: "published" as const, qaStatus: "approved" as const, contentVersion: Math.max(...related.map((word) => word.contentVersion)), sourceVersion: activeReleaseId }];
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
  return words.filter((word) => [word.hanzi, word.pinyin, word.meaning, word.example.hanzi, word.example.meaning].some((value) => normalize(value).includes(needle)));
}

export function searchPublishedCharacters(query: string, options: { level?: number } = {}): StudyCharacter[] {
  const needle = normalize(query.trim());
  const characters = STUDY_CHARACTERS.filter((character) => !options.level || character.level === options.level);
  if (!needle) return characters;
  return characters.filter((character) => [character.hanzi, ...character.pinyin, ...character.meanings].some((value) => normalize(value).includes(needle)));
}

export function getWordBySlug(slug: string): LookupResult<StudyWord> {
  const word = STUDY_WORDS.find((item) => item.slug === slug);
  return word ? { status: "published", item: word } : { status: "missing" };
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

export function sitemapContentRoutes(): string[] {
  const routes = ["/levels", "/dictionary"];
  for (const word of STUDY_WORDS) routes.push(`/word/${word.slug}`);
  for (const character of STUDY_CHARACTERS) routes.push(`/character/${encodeURIComponent(character.hanzi)}`);
  return [...new Set(routes)];
}
