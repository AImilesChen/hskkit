export type Step7ContentKind = "grammar" | "reading" | "tone" | "discrimination" | "dictation";

export interface Step7Exercise {
  id: string;
  contentId: string;
  contentVersion: string;
  kind: Step7ContentKind;
  prompt: string;
  options?: Record<string, string>;
  correctAnswer: string;
  explanation: string;
}

export interface GrammarLesson {
  slug: string;
  level: number;
  title: string;
  pattern: string;
  explanation: string;
  examples: Array<{ chinese: string; pinyin: string; english: string }>;
  relatedReadingSlug: string;
  contentVersion: string;
  exercise: Step7Exercise;
}

export interface ReadingLesson {
  slug: string;
  level: number;
  title: string;
  passage: string;
  pinyin: string;
  translation: string;
  vocabulary: Array<{ hanzi: string; pinyin: string; meaning: string }>;
  relatedGrammarSlug: string;
  contentVersion: string;
  exercise: Step7Exercise;
}

export interface AdvancedListeningLesson {
  slug: string;
  level: number;
  title: string;
  kind: "tone" | "discrimination" | "dictation";
  voiceText: string;
  guidance: string;
  contentVersion: string;
  exercise: Step7Exercise;
}

const grammar = (value: Omit<GrammarLesson, "contentVersion" | "exercise"> & { answer: string; options: Record<string, string>; prompt: string; explanationAnswer: string }): GrammarLesson => {
  const contentVersion = "step7-content-v1";
  const { answer, options, prompt, explanationAnswer, ...lesson } = value;
  return { ...lesson, contentVersion, exercise: { id: `exercise:grammar:${lesson.slug}`, contentId: `grammar:${lesson.slug}`, contentVersion, kind: "grammar", prompt, options, correctAnswer: answer, explanation: explanationAnswer } };
};

const reading = (value: Omit<ReadingLesson, "contentVersion" | "exercise"> & { answer: string; options: Record<string, string>; prompt: string; explanationAnswer: string }): ReadingLesson => {
  const contentVersion = "step7-content-v1";
  const { answer, options, prompt, explanationAnswer, ...lesson } = value;
  return { ...lesson, contentVersion, exercise: { id: `exercise:reading:${lesson.slug}`, contentId: `reading:${lesson.slug}`, contentVersion, kind: "reading", prompt, options, correctAnswer: answer, explanation: explanationAnswer } };
};

const listening = (value: Omit<AdvancedListeningLesson, "contentVersion" | "exercise"> & { answer: string; options?: Record<string, string>; prompt: string; explanationAnswer: string }): AdvancedListeningLesson => {
  const contentVersion = "step7-listening-v1";
  const { answer, options, prompt, explanationAnswer, ...lesson } = value;
  return { ...lesson, contentVersion, exercise: { id: `exercise:listening:${lesson.slug}`, contentId: `listening:${lesson.slug}`, contentVersion, kind: lesson.kind, prompt, options, correctAnswer: answer, explanation: explanationAnswer } };
};

export const GRAMMAR_LESSONS: GrammarLesson[] = [
  grammar({
    slug: "ba-sentence-basics", level: 3, title: "The 把 sentence: object before the action", pattern: "Subject + 把 + object + verb + result",
    explanation: "Use 把 when a known object is changed, moved or otherwise affected. The verb normally needs a result, direction or other complement.",
    examples: [
      { chinese: "我把书放在桌子上了。", pinyin: "Wǒ bǎ shū fàng zài zhuōzi shàng le.", english: "I put the book on the table." },
      { chinese: "请把门关上。", pinyin: "Qǐng bǎ mén guān shàng.", english: "Please close the door." },
    ],
    relatedReadingSlug: "morning-study-routine",
    prompt: "Which sentence correctly uses 把?", options: { A: "我把作业写完了。", B: "我把喜欢中文。", C: "我把是学生。" }, answer: "A",
    explanationAnswer: "写完 shows the result that affected 作业, so the 把 construction is complete.",
  }),
  grammar({
    slug: "comparison-with-bi", level: 2, title: "Comparing with 比", pattern: "A + 比 + B + adjective",
    explanation: "Place 比 between the two things being compared. Do not add 很 before the adjective in a basic 比 sentence.",
    examples: [
      { chinese: "今天比昨天冷。", pinyin: "Jīntiān bǐ zuótiān lěng.", english: "Today is colder than yesterday." },
      { chinese: "听力比阅读难一点儿。", pinyin: "Tīnglì bǐ yuèdú nán yìdiǎnr.", english: "Listening is a little harder than reading." },
    ],
    relatedReadingSlug: "weekend-travel-plan",
    prompt: "Choose the natural comparison.", options: { A: "火车比汽车快。", B: "火车比汽车很快。", C: "火车很比汽车快。" }, answer: "A",
    explanationAnswer: "The basic pattern is A + 比 + B + adjective, without 很.",
  }),
];

export const READING_LESSONS: ReadingLesson[] = [
  reading({
    slug: "morning-study-routine", level: 3, title: "A focused morning routine",
    passage: "每天早上，林月先复习十个生词，再听十五分钟中文。她把不懂的句子写在本子上，晚上再看一遍。",
    pinyin: "Měitiān zǎoshang, Lín Yuè xiān fùxí shí ge shēngcí, zài tīng shíwǔ fēnzhōng Zhōngwén. Tā bǎ bù dǒng de jùzi xiě zài běnzi shàng, wǎnshang zài kàn yí biàn.",
    translation: "Every morning, Lin Yue first reviews ten new words and then listens to Chinese for fifteen minutes. She writes sentences she does not understand in a notebook and reads them again at night.",
    vocabulary: [{ hanzi: "复习", pinyin: "fùxí", meaning: "review" }, { hanzi: "句子", pinyin: "jùzi", meaning: "sentence" }, { hanzi: "一遍", pinyin: "yí biàn", meaning: "once; one time through" }],
    relatedGrammarSlug: "ba-sentence-basics",
    prompt: "What does Lin Yue write in her notebook?", options: { A: "Ten new words", B: "Sentences she does not understand", C: "Her evening schedule" }, answer: "B",
    explanationAnswer: "The passage says 她把不懂的句子写在本子上.",
  }),
  reading({
    slug: "weekend-travel-plan", level: 2, title: "Choosing a weekend trip",
    passage: "王明周末想去杭州。火车比汽车快，也更准时。他决定星期六早上坐火车去，星期天下午回来。",
    pinyin: "Wáng Míng zhōumò xiǎng qù Hángzhōu. Huǒchē bǐ qìchē kuài, yě gèng zhǔnshí. Tā juédìng xīngqīliù zǎoshang zuò huǒchē qù, xīngqītiān xiàwǔ huílai.",
    translation: "Wang Ming wants to go to Hangzhou this weekend. The train is faster and more punctual than the bus. He decides to go by train on Saturday morning and return Sunday afternoon.",
    vocabulary: [{ hanzi: "周末", pinyin: "zhōumò", meaning: "weekend" }, { hanzi: "准时", pinyin: "zhǔnshí", meaning: "punctual" }, { hanzi: "决定", pinyin: "juédìng", meaning: "decide" }],
    relatedGrammarSlug: "comparison-with-bi",
    prompt: "Why does Wang Ming choose the train?", options: { A: "It is cheaper", B: "It leaves Sunday", C: "It is faster and more punctual" }, answer: "C",
    explanationAnswer: "The passage explicitly says 火车比汽车快，也更准时.",
  }),
];

export const ADVANCED_LISTENING_LESSONS: AdvancedListeningLesson[] = [
  listening({ slug: "hsk1-tone-pairs", level: 1, title: "Third tone or fourth tone?", kind: "tone", voiceText: "买", guidance: "Listen for the low, dipping third tone. Playback must finish before answering.", prompt: "Which pinyin matches what you hear?", options: { A: "mǎi", B: "mài", C: "māi" }, answer: "A", explanationAnswer: "买 is pronounced mǎi with the third tone." }),
  listening({ slug: "hsk2-syllable-discrimination", level: 2, title: "Distinguish close syllables", kind: "discrimination", voiceText: "老师让我们练习发音。", guidance: "Focus on the middle phrase and distinguish lǎoshī from lǎoshǔ.", prompt: "Which phrase did you hear?", options: { A: "老师让我们练习发音。", B: "老鼠让我们练习发音。", C: "老师让我们联系发音。" }, answer: "A", explanationAnswer: "The sentence uses 老师 (teacher) and 练习 (practise)." }),
  listening({ slug: "hsk3-sentence-dictation", level: 3, title: "Sentence dictation", kind: "dictation", voiceText: "请把今天的作业写完。", guidance: "Listen to the complete sentence, then type the Chinese characters. Punctuation and spaces are ignored.", prompt: "Type the sentence you hear.", answer: "请把今天的作业写完", explanationAnswer: "The complete sentence is 请把今天的作业写完。" }),
];

export function grammarBySlug(slug: string) { return GRAMMAR_LESSONS.find((item) => item.slug === slug); }
export function readingBySlug(slug: string) { return READING_LESSONS.find((item) => item.slug === slug); }
export function advancedListeningBySlug(slug: string) { return ADVANCED_LISTENING_LESSONS.find((item) => item.slug === slug); }
export function trustedStep7Exercise(id: string) {
  return [...GRAMMAR_LESSONS, ...READING_LESSONS, ...ADVANCED_LISTENING_LESSONS].map((item) => item.exercise).find((item) => item.id === id);
}
export function normalizeStep7Answer(value: string) { return value.normalize("NFKC").replace(/[\s，。！？、,.!?]/g, "").toLowerCase(); }
export function isStep7AnswerAllowed(exercise: Step7Exercise, value: string) {
  const normalized = normalizeStep7Answer(value);
  if (!normalized) return false;
  if (!exercise.options) return normalized.length <= 160;
  return Object.keys(exercise.options).some((option) => normalizeStep7Answer(option) === normalized);
}
