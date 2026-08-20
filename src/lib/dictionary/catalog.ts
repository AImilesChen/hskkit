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
  audio: { status: "browser-speech"; locale: "zh-CN" };
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

const published = (word: Omit<StudyWord, "releaseStatus" | "qaStatus" | "contentVersion" | "sourceVersion" | "audio">): StudyWord => ({
  ...word,
  releaseStatus: "published",
  qaStatus: "approved",
  contentVersion: 1,
  sourceVersion: "HSKKit HSK 3.0 study release 2026.08",
  audio: { status: "browser-speech", locale: "zh-CN" },
});

export const STUDY_WORDS: StudyWord[] = [
  published({ id: "word-ni-hao", slug: "ni-hao", level: 1, hanzi: "你好", pinyin: "nǐ hǎo", meaning: "hello; hi", partOfSpeech: "greeting", example: { hanzi: "你好，很高兴认识你。", pinyin: "Nǐ hǎo, hěn gāoxìng rènshi nǐ.", meaning: "Hello, nice to meet you." } }),
  published({ id: "word-xue-xi", slug: "xue-xi", level: 1, hanzi: "学习", pinyin: "xuéxí", meaning: "to study; to learn", partOfSpeech: "verb", example: { hanzi: "我每天学习中文。", pinyin: "Wǒ měitiān xuéxí Zhōngwén.", meaning: "I study Chinese every day." } }),
  published({ id: "word-lu-xing", slug: "lu-xing", level: 2, hanzi: "旅行", pinyin: "lǚxíng", meaning: "to travel; journey", partOfSpeech: "verb / noun", example: { hanzi: "我们暑假去中国旅行。", pinyin: "Wǒmen shǔjià qù Zhōngguó lǚxíng.", meaning: "We are traveling to China during summer vacation." } }),
  published({ id: "word-xi-guan", slug: "xi-guan", level: 2, hanzi: "习惯", pinyin: "xíguàn", meaning: "habit; to be accustomed to", partOfSpeech: "noun / verb", example: { hanzi: "我习惯早起。", pinyin: "Wǒ xíguàn zǎoqǐ.", meaning: "I am used to getting up early." } }),
  published({ id: "word-huan-jing", slug: "huan-jing", level: 3, hanzi: "环境", pinyin: "huánjìng", meaning: "environment; surroundings", partOfSpeech: "noun", example: { hanzi: "这里的学习环境很安静。", pinyin: "Zhèlǐ de xuéxí huánjìng hěn ānjìng.", meaning: "The study environment here is quiet." } }),
  published({ id: "word-jing-yan", slug: "jing-yan", level: 3, hanzi: "经验", pinyin: "jīngyàn", meaning: "experience; practical knowledge", partOfSpeech: "noun", example: { hanzi: "她有丰富的教学经验。", pinyin: "Tā yǒu fēngfù de jiàoxué jīngyàn.", meaning: "She has extensive teaching experience." } }),
  published({ id: "word-jiao-liu", slug: "jiao-liu", level: 4, hanzi: "交流", pinyin: "jiāoliú", meaning: "to communicate; to exchange", partOfSpeech: "verb / noun", example: { hanzi: "我们用中文交流。", pinyin: "Wǒmen yòng Zhōngwén jiāoliú.", meaning: "We communicate in Chinese." } }),
  published({ id: "word-ze-ren", slug: "ze-ren", level: 4, hanzi: "责任", pinyin: "zérèn", meaning: "responsibility; duty", partOfSpeech: "noun", example: { hanzi: "保护环境是大家的责任。", pinyin: "Bǎohù huánjìng shì dàjiā de zérèn.", meaning: "Protecting the environment is everyone's responsibility." } }),
  published({ id: "word-gai-shan", slug: "gai-shan", level: 5, hanzi: "改善", pinyin: "gǎishàn", meaning: "to improve; to make better", partOfSpeech: "verb", example: { hanzi: "这个计划改善了服务质量。", pinyin: "Zhège jìhuà gǎishàn le fúwù zhìliàng.", meaning: "This plan improved the quality of service." } }),
  published({ id: "word-qu-shi", slug: "qu-shi", level: 5, hanzi: "趋势", pinyin: "qūshì", meaning: "trend; tendency", partOfSpeech: "noun", example: { hanzi: "我们需要了解市场趋势。", pinyin: "Wǒmen xūyào liǎojiě shìchǎng qūshì.", meaning: "We need to understand market trends." } }),
  published({ id: "word-gong-xian", slug: "gong-xian", level: 6, hanzi: "贡献", pinyin: "gòngxiàn", meaning: "contribution; to contribute", partOfSpeech: "noun / verb", example: { hanzi: "她为这个项目作出了重要贡献。", pinyin: "Tā wèi zhège xiàngmù zuòchū le zhòngyào gòngxiàn.", meaning: "She made an important contribution to the project." } }),
  published({ id: "word-zi-yuan", slug: "zi-yuan", level: 6, hanzi: "资源", pinyin: "zīyuán", meaning: "resource", partOfSpeech: "noun", example: { hanzi: "我们应该节约自然资源。", pinyin: "Wǒmen yīnggāi jiéyuē zìrán zīyuán.", meaning: "We should conserve natural resources." } }),
  published({ id: "word-chang-dao", slug: "chang-dao", level: 7, hanzi: "倡导", pinyin: "chàngdǎo", meaning: "to advocate; to promote", partOfSpeech: "verb", example: { hanzi: "学校倡导终身学习。", pinyin: "Xuéxiào chàngdǎo zhōngshēn xuéxí.", meaning: "The school advocates lifelong learning." } }),
  published({ id: "word-dong-cha", slug: "dong-cha", level: 7, hanzi: "洞察", pinyin: "dòngchá", meaning: "to perceive; insight", partOfSpeech: "verb / noun", example: { hanzi: "她善于洞察用户的真实需求。", pinyin: "Tā shànyú dòngchá yònghù de zhēnshí xūqiú.", meaning: "She is good at perceiving users' real needs." } }),
  published({ id: "word-chan-shi", slug: "chan-shi", level: 8, hanzi: "阐释", pinyin: "chǎnshì", meaning: "to expound; to interpret", partOfSpeech: "verb", example: { hanzi: "作者详细阐释了这个观点。", pinyin: "Zuòzhě xiángxì chǎnshì le zhège guāndiǎn.", meaning: "The author explained this viewpoint in detail." } }),
  published({ id: "word-zhen-zhuo", slug: "zhen-zhuo", level: 8, hanzi: "斟酌", pinyin: "zhēnzhuó", meaning: "to deliberate; to weigh carefully", partOfSpeech: "verb", example: { hanzi: "这个决定还需要仔细斟酌。", pinyin: "Zhège juédìng hái xūyào zǐxì zhēnzhuó.", meaning: "This decision still needs careful consideration." } }),
  published({ id: "word-jian-rong-bing-xu", slug: "jian-rong-bing-xu", level: 9, hanzi: "兼容并蓄", pinyin: "jiānróng-bìngxù", meaning: "to embrace and integrate diverse ideas", partOfSpeech: "idiom", example: { hanzi: "这座城市的文化兼容并蓄。", pinyin: "Zhè zuò chéngshì de wénhuà jiānróng-bìngxù.", meaning: "The city's culture embraces and integrates diverse traditions." } }),
  published({ id: "word-yun-chou-wei-wo", slug: "yun-chou-wei-wo", level: 9, hanzi: "运筹帷幄", pinyin: "yùnchóu-wéiwò", meaning: "to devise strategies and direct operations", partOfSpeech: "idiom", example: { hanzi: "他善于统筹全局、运筹帷幄。", pinyin: "Tā shànyú tǒngchóu quánjú, yùnchóu-wéiwò.", meaning: "He is skilled at coordinating the whole situation and devising strategy." } }),
  { ...published({ id: "word-withdrawn", slug: "withdrawn-sample", level: 1, hanzi: "撤", pinyin: "chè", meaning: "withdrawn quality-control sample", partOfSpeech: "test fixture", example: { hanzi: "该条目已撤回。", pinyin: "Gāi tiáomù yǐ chèhuí.", meaning: "This entry has been withdrawn." } }), releaseStatus: "withdrawn" },
];

export const STUDY_CHARACTERS: StudyCharacter[] = [
  { hanzi: "你", pinyin: ["nǐ"], meanings: ["you"], radical: "亻 (person)", strokes: 7, level: 1, relatedWordSlugs: ["ni-hao"], releaseStatus: "published", qaStatus: "approved", contentVersion: 1, sourceVersion: "HSKKit character release 2026.08" },
  { hanzi: "好", pinyin: ["hǎo", "hào"], meanings: ["good; well", "to be fond of"], radical: "女 (woman)", strokes: 6, level: 1, relatedWordSlugs: ["ni-hao"], releaseStatus: "published", qaStatus: "approved", contentVersion: 1, sourceVersion: "HSKKit character release 2026.08" },
  { hanzi: "学", pinyin: ["xué"], meanings: ["to study; to learn"], radical: "子 (child)", strokes: 8, level: 1, relatedWordSlugs: ["xue-xi"], releaseStatus: "published", qaStatus: "approved", contentVersion: 1, sourceVersion: "HSKKit character release 2026.08" },
  { hanzi: "习", pinyin: ["xí"], meanings: ["to practise; habit"], radical: "乙", strokes: 3, level: 1, relatedWordSlugs: ["xue-xi", "xi-guan"], releaseStatus: "published", qaStatus: "approved", contentVersion: 1, sourceVersion: "HSKKit character release 2026.08" },
  { hanzi: "撤", pinyin: ["chè"], meanings: ["withdrawn sample"], radical: "扌 (hand)", strokes: 15, level: 1, relatedWordSlugs: ["withdrawn-sample"], releaseStatus: "withdrawn", qaStatus: "approved", contentVersion: 1, sourceVersion: "HSKKit character release 2026.08" },
];

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[\s'-]+/g, "");
}

export function listPublishedWords(options: { level?: number } = {}): StudyWord[] {
  return STUDY_WORDS.filter((word) => word.releaseStatus === "published" && (!options.level || word.level === options.level));
}

export function searchPublishedWords(query: string, options: { level?: number } = {}): StudyWord[] {
  const words = listPublishedWords(options);
  const needle = normalize(query.trim());
  if (!needle) return words;
  return words.filter((word) => [word.hanzi, word.pinyin, word.meaning, word.example.hanzi, word.example.meaning]
    .some((value) => normalize(value).includes(needle)));
}

export function searchPublishedCharacters(query: string, options: { level?: number } = {}): StudyCharacter[] {
  const needle = normalize(query.trim());
  const characters = STUDY_CHARACTERS.filter((character) => character.releaseStatus === "published" && (!options.level || character.level === options.level));
  if (!needle) return characters;
  return characters.filter((character) => [character.hanzi, ...character.pinyin, ...character.meanings]
    .some((value) => normalize(value).includes(needle)));
}

export function getWordBySlug(slug: string): LookupResult<StudyWord> {
  const word = STUDY_WORDS.find((item) => item.slug === slug);
  if (!word) return { status: "missing" };
  if (word.releaseStatus === "withdrawn") return { status: "withdrawn" };
  return { status: "published", item: word };
}

export function getCharacterByHanzi(hanzi: string): LookupResult<StudyCharacter> {
  const character = STUDY_CHARACTERS.find((item) => item.hanzi === hanzi);
  if (!character) return { status: "missing" };
  if (character.releaseStatus === "withdrawn") return { status: "withdrawn" };
  return { status: "published", item: character };
}

export function relatedWordsForCharacter(character: StudyCharacter): StudyWord[] {
  return character.relatedWordSlugs.flatMap((slug) => {
    const result = getWordBySlug(slug);
    return result.status === "published" ? [result.item] : [];
  });
}

export function sitemapContentRoutes(): string[] {
  const routes = ["/levels", "/dictionary"];
  for (let level = 1; level <= 9; level += 1) {
    if (listPublishedWords({ level }).length > 0) routes.push(`/vocabulary/${level}`);
  }
  for (const word of listPublishedWords()) routes.push(`/word/${word.slug}`);
  for (const character of STUDY_CHARACTERS) {
    if (character.releaseStatus === "published" && character.qaStatus === "approved" && character.pinyin.length && character.meanings.length && character.radical && character.strokes > 0) {
      routes.push(`/character/${encodeURIComponent(character.hanzi)}`);
    }
  }
  return [...new Set(routes)];
}
