import { publicAudioAsset, publishedContentAudioAssetByLogicalId, publishedPracticeAudioAsset, type PublishedAudioAsset, type PublicAudioAsset } from "../audio/assets.ts";
import { isPublishedStep7Content } from "./step7-release.ts";
import { LISTENING_LIBRARY_QUESTIONS, listeningQuestionBySlug } from "./listening-library.ts";
import { READING_LIBRARY_QUESTIONS } from "./reading-library.ts";

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
  levelBand: string;
  contentVersion: string;
  title: string;
  explanation: string;
  pattern: string;
  examples: Array<{ zh: string; en: string; chinese: string; pinyin: string; english: string }>;
  readingSlug: string;
  relatedReadingSlug: string;
  exercise: Step7Exercise;
}
export type ReadingQuestionType = "detail" | "location" | "participant" | "destination" | "note-taking" | "time" | "policy-detail" | "sequence" | "purpose" | "inference" | "argument" | "critical-evaluation" | "reason" | "condition" | "contrast" | "recommendation" | "comparison" | "claim" | "method";
export type ReadingDifficulty = "easy" | "medium" | "hard" | "advanced";
export interface ReadingLesson {
  slug: string;
  level: number;
  levelBand: string;
  contentVersion: string;
  title: string;
  text: string;
  passage: string;
  translation: string;
  pinyin: string;
  vocabulary: Array<{ word: string; hanzi: string; pinyin: string; meaning: string }>;
  questionType: ReadingQuestionType;
  difficulty: ReadingDifficulty;
  grammarSlug: string;
  relatedGrammarSlug: string;
  exercise: Step7Exercise;
}
export type ListeningTrainingType = "tone" | "syllable" | "basic-dictation" | "sentence" | "paragraph" | "context" | "longer-discourse" | "formal-briefing" | "formal-argument";
export interface AdvancedListeningLesson {
  slug: string;
  level: number;
  levelBand: string;
  contentVersion: string;
  title: string;
  kind: "tone" | "discrimination" | "dictation";
  trainingType: ListeningTrainingType;
  register: "everyday" | "formal";
  voiceText: string;
  audioSrc: string;
  audioAsset?: PublicAudioAsset;
  instruction: string;
  guidance: string;
  exercise: Step7Exercise;
}

const v = "2026.08.22-batch13";
const exercise = (id: string, contentId: string, kind: Step7ContentKind, prompt: string, options: Record<string, string> | undefined, correctAnswer: string, explanation: string): Step7Exercise => ({ id, contentId, contentVersion: v, kind, prompt, options, correctAnswer, explanation });

type GrammarSource = Omit<GrammarLesson, "contentVersion" | "relatedReadingSlug" | "examples"> & { examples: Array<{ zh: string; en: string }> };
type ReadingSource = Omit<ReadingLesson, "contentVersion" | "passage" | "pinyin" | "relatedGrammarSlug" | "vocabulary"> & { vocabulary: Array<{ word: string; pinyin: string; meaning: string }> };

const ALL_GRAMMAR_LESSONS: GrammarSource[] = [
  { slug: "basic-shi-negation", level: 1, levelBand: "1", title: "Affirming and negating identity with 是", explanation: "Use 是 to connect a person or thing with an identity. Put 不 directly before 是 to negate that identity.", pattern: "Subject + 是 / 不是 + noun", examples: [{ zh: "我是学生。", en: "I am a student." }, { zh: "她不是老师。", en: "She is not a teacher." }], readingSlug: "family-weekend-plan", exercise: exercise("grammar-basic-shi-negation-v1", "grammar:basic-shi-negation", "grammar", "Choose the natural sentence for “He is not a doctor.”", { A: "他不医生。", B: "他不是医生。", C: "他是不医生。" }, "B", "Negate identity with 不是 before the noun phrase.") },
  { slug: "comparison-with-bi", level: 2, levelBand: "2", title: "Comparing with 比", explanation: "Place 比 between the two things being compared; the adjective or result follows the second item.", pattern: "A + 比 + B + adjective / quantity", examples: [{ zh: "火车比汽车快。", en: "The train is faster than the bus." }, { zh: "今天比昨天冷两度。", en: "Today is two degrees colder than yesterday." }], readingSlug: "weekend-travel-plan", exercise: exercise("grammar-comparison-with-bi-v1", "grammar:comparison-with-bi", "grammar", "Which sentence correctly says the train is faster than the bus?", { A: "火车比汽车快。", B: "火车快比汽车。", C: "比汽车火车快。" }, "A", "The 比 phrase comes after the item being described and before the comparison standard.") },
  { slug: "ba-sentence-basics", level: 3, levelBand: "3", title: "The 把 sentence: object before the action", explanation: "Use 把 when a known object is affected, moved or changed, and state the result after the verb.", pattern: "Subject + 把 + known object + verb + result", examples: [{ zh: "我把生词写在本子上。", en: "I write the new words in my notebook." }, { zh: "请把门关上。", en: "Please close the door." }], readingSlug: "morning-study-routine", exercise: exercise("grammar-ba-sentence-basics-v1", "grammar:ba-sentence-basics", "grammar", "Choose the complete 把 sentence.", { A: "她把句子写在本子上。", B: "她把写句子。", C: "她句子把本子。" }, "A", "A complete 把 sentence names the affected object and the result of the action.") },
  { slug: "condition-with-zhiyao", level: 4, levelBand: "4", title: "Stating a sufficient condition with 只要…就…", explanation: "Use 只要 to give a sufficient condition and 就 to introduce the result that follows from it.", pattern: "只要 + condition，subject + 就 + result", examples: [{ zh: "只要带学生证，就可以进图书馆。", en: "As long as you bring your student ID, you can enter the library." }, { zh: "只要提前预约，我们就能使用会议室。", en: "As long as we reserve ahead, we can use the meeting room." }], readingSlug: "library-evening-hours", exercise: exercise("grammar-condition-with-zhiyao-v1", "grammar:condition-with-zhiyao", "grammar", "Complete: ___ 提前预约，我们 ___ 能进去。", { A: "虽然 / 但是", B: "只要 / 就", C: "因为 / 所以" }, "B", "只要…就… marks a sufficient condition and its expected result.") },
  { slug: "contrast-with-jinguan", level: 5, levelBand: "5", title: "Conceding with 尽管…但是…", explanation: "Use 尽管 to acknowledge a fact and 但是 to introduce a contrasting outcome.", pattern: "尽管 + acknowledged fact，但是 + contrasting result", examples: [{ zh: "尽管时间有限，但是团队完成了测试。", en: "Although time was limited, the team completed the test." }, { zh: "尽管可以远程办公，但是每周仍要开一次现场会议。", en: "Although remote work is allowed, there is still one in-person meeting each week." }], readingSlug: "flexible-work-schedule", exercise: exercise("grammar-contrast-with-jinguan-v1", "grammar:contrast-with-jinguan", "grammar", "Which pair introduces concession followed by contrast?", { A: "只要…就…", B: "不仅…而且…", C: "尽管…但是…" }, "C", "尽管 introduces what is conceded; 但是 marks the unexpected contrast.") },
  { slug: "formal-causation-yu-youyu", level: 6, levelBand: "6", title: "Formal causation with 由于…因而…", explanation: "In formal writing, 由于 introduces a cause and 因而 presents its consequence. Avoid stacking unrelated conclusions after it.", pattern: "由于 + evidence/cause，因而 + supported consequence", examples: [{ zh: "由于样本数量不足，因而结论仍需验证。", en: "Because the sample is insufficient, the conclusion still needs verification." }, { zh: "由于道路正在维修，因而公交线路临时调整。", en: "Because the road is under repair, the bus route has been temporarily adjusted." }], readingSlug: "community-renewal-debate", exercise: exercise("grammar-formal-causation-yu-youyu-v1", "grammar:formal-causation-yu-youyu", "grammar", "Choose the conclusion directly supported by the cause: 由于样本数量不足，___。", { A: "因而结论仍需验证", B: "因而所有人都同意", C: "因而天气很好" }, "A", "The consequence must be logically supported by the stated cause.") },
  { slug: "advanced-concession-guran", level: 7, levelBand: "7-9", title: "Evaluating concession with 固然…然而…", explanation: "固然 grants a limited point; 然而 pivots to the decisive limitation. The construction is common in analytical and formal argument.", pattern: "X 固然 + valid point，然而 + decisive qualification", examples: [{ zh: "试点固然取得了进展，然而样本范围仍然有限。", en: "The pilot has admittedly progressed, yet its sample remains limited." }, { zh: "效率固然重要，然而不能以牺牲程序公正为代价。", en: "Efficiency is important, yet it must not come at the expense of procedural fairness." }], readingSlug: "evidence-and-policy-evaluation", exercise: exercise("grammar-advanced-concession-guran-v1", "grammar:advanced-concession-guran", "grammar", "What is the main rhetorical role of 然而 after 固然?", { A: "It repeats the concession", B: "It introduces the decisive qualification", C: "It lists an unrelated example" }, "B", "固然 acknowledges a point, while 然而 redirects attention to the limitation that controls the conclusion.") },
];

const ALL_READING_LESSONS: ReadingSource[] = [
  { slug: "family-weekend-plan", level: 1, levelBand: "1", title: "A family weekend plan", text: "星期六，妈妈去商店，爸爸在家做饭。我和姐姐下午去公园。", translation: "On Saturday, Mom goes to the store, Dad cooks at home, and my sister and I go to the park in the afternoon.", vocabulary: [{ word: "商店", pinyin: "shāngdiàn", meaning: "store" }, { word: "做饭", pinyin: "zuòfàn", meaning: "cook" }, { word: "公园", pinyin: "gōngyuán", meaning: "park" }], questionType: "detail", difficulty: "easy", grammarSlug: "basic-shi-negation", exercise: exercise("reading-family-weekend-plan-v1", "reading:family-weekend-plan", "reading", "Who cooks at home?", { A: "妈妈", B: "爸爸", C: "姐姐" }, "B", "The passage says 爸爸在家做饭.") },
  { slug: "weekend-travel-plan", level: 2, levelBand: "2", title: "Choosing a weekend trip", text: "王明周末想去杭州。火车比汽车快，也更准时。他决定星期六早上坐火车去，星期天下午回来。", translation: "Wang Ming plans to visit Hangzhou. Because the train is faster and more punctual than the bus, he will take it Saturday morning and return Sunday afternoon.", vocabulary: [{ word: "周末", pinyin: "zhōumò", meaning: "weekend" }, { word: "准时", pinyin: "zhǔnshí", meaning: "punctual" }, { word: "决定", pinyin: "juédìng", meaning: "decide" }], questionType: "detail", difficulty: "easy", grammarSlug: "comparison-with-bi", exercise: exercise("reading-weekend-travel-plan-v1", "reading:weekend-travel-plan", "reading", "Why does Wang Ming choose the train?", { A: "It is cheaper.", B: "It is faster and more punctual.", C: "It leaves on Sunday." }, "B", "The passage explicitly compares the train with the bus on speed and punctuality.") },
  { slug: "morning-study-routine", level: 3, levelBand: "3", title: "A focused morning routine", text: "每天早上，林月先复习十个生词，再听十五分钟中文。她把不懂的句子写在本子上，晚上再看一遍。", translation: "Every morning, Lin Yue first reviews ten new words and then listens to Chinese for fifteen minutes. She writes unfamiliar sentences in her notebook and reviews them at night.", vocabulary: [{ word: "复习", pinyin: "fùxí", meaning: "review" }, { word: "生词", pinyin: "shēngcí", meaning: "new word" }, { word: "一遍", pinyin: "yí biàn", meaning: "once through" }], questionType: "sequence", difficulty: "medium", grammarSlug: "ba-sentence-basics", exercise: exercise("reading-morning-study-routine-v1", "reading:morning-study-routine", "reading", "What does Lin Yue do after reviewing new words?", { A: "She listens to Chinese.", B: "She goes back to sleep.", C: "She takes a test." }, "A", "先…再… shows that listening follows vocabulary review.") },
  { slug: "library-evening-hours", level: 4, levelBand: "4", title: "Why the library extended its hours", text: "考试月期间，图书馆把闭馆时间从晚上九点延长到十一点。只要出示学生证，学生就可以进入夜间学习区。学校希望减少宿舍里的噪音，也让需要小组讨论的学生有合适的空间。", translation: "During exam month, the library extends closing from 9 p.m. to 11 p.m. Students may enter the night study zone with student ID. The school wants to reduce dorm noise and provide appropriate space for group discussions.", vocabulary: [{ word: "闭馆", pinyin: "bìguǎn", meaning: "close (a library)" }, { word: "出示", pinyin: "chūshì", meaning: "present/show" }, { word: "延长", pinyin: "yáncháng", meaning: "extend" }], questionType: "purpose", difficulty: "medium", grammarSlug: "condition-with-zhiyao", exercise: exercise("reading-library-evening-hours-v1", "reading:library-evening-hours", "reading", "Which purpose is stated for extending the hours?", { A: "To sell student IDs", B: "To reduce dorm noise and provide study space", C: "To cancel group discussions" }, "B", "The final sentence gives both purposes directly.") },
  { slug: "flexible-work-schedule", level: 5, levelBand: "5", title: "A trial flexible-work schedule", text: "公司试行弹性工作制后，员工可以在早上七点到十点之间到岗。尽管个人时间更灵活，但是每个团队仍须保证核心时段有人值班。三个月后的调查显示，迟到减少了，跨部门会议却需要更早安排。", translation: "After introducing flexible work, employees may arrive between 7 and 10 a.m. Although personal schedules are more flexible, teams must cover core hours. After three months, lateness fell but cross-department meetings needed earlier planning.", vocabulary: [{ word: "试行", pinyin: "shìxíng", meaning: "pilot/try out" }, { word: "到岗", pinyin: "dàogǎng", meaning: "arrive at one's post" }, { word: "值班", pinyin: "zhíbān", meaning: "be on duty" }], questionType: "inference", difficulty: "medium", grammarSlug: "contrast-with-jinguan", exercise: exercise("reading-flexible-work-schedule-v1", "reading:flexible-work-schedule", "reading", "What can reasonably be inferred about cross-department meetings?", { A: "They disappeared.", B: "They require more advance coordination.", C: "They can only happen at night." }, "B", "Because arrival times vary, shared meetings need earlier coordination; the passage does not say they disappeared.") },
  { slug: "community-renewal-debate", level: 6, levelBand: "6", title: "Debating a community renewal plan", text: "旧区改造方案提出增加公共绿地，并拆除部分路边停车位。支持者认为步行环境改善后，附近商店会获得更多客流；反对者则担心停车不便会使顾客转往别处。由于目前只有短期试点数据，委员会决定先延长观察期，再讨论是否全面实施。", translation: "A renewal proposal adds public green space while removing some roadside parking. Supporters expect improved walkability to increase store traffic; opponents fear parking inconvenience will drive customers elsewhere. With only short-term pilot data, the committee extends observation before deciding on full implementation.", vocabulary: [{ word: "改造", pinyin: "gǎizào", meaning: "renovate/renew" }, { word: "客流", pinyin: "kèliú", meaning: "customer traffic" }, { word: "观察期", pinyin: "guāncháqī", meaning: "observation period" }], questionType: "argument", difficulty: "hard", grammarSlug: "formal-causation-yu-youyu", exercise: exercise("reading-community-renewal-debate-v1", "reading:community-renewal-debate", "reading", "Why does the committee postpone a final decision?", { A: "No one supports green space.", B: "Only short-term pilot evidence is available.", C: "All shops have already closed." }, "B", "The stated reason is insufficient long-term evidence, not unanimous opposition.") },
  { slug: "evidence-and-policy-evaluation", level: 7, levelBand: "7-9", title: "Evaluating evidence before policy expansion", text: "一项试点报告称，新流程使平均办理时间缩短了百分之十五。这个结果固然值得重视，然而试点仅覆盖业务量较小的三个地区，而且没有说明复杂案件是否被排除。若直接把平均值视为普遍效果，可能掩盖不同地区之间的成本差异。因此，在扩大政策之前，评估者还应比较案件构成、执行成本与长期稳定性。", translation: "A pilot reports a 15% reduction in average processing time. The result matters, but the pilot covers only three low-volume regions and does not say whether complex cases were excluded. Treating the average as universal could hide regional cost differences, so evaluators should compare case mix, implementation cost and long-term stability before expansion.", vocabulary: [{ word: "办理", pinyin: "bànlǐ", meaning: "process/handle" }, { word: "案件构成", pinyin: "ànjiàn gòuchéng", meaning: "case mix" }, { word: "普遍效果", pinyin: "pǔbiàn xiàoguǒ", meaning: "generalizable effect" }], questionType: "critical-evaluation", difficulty: "advanced", grammarSlug: "advanced-concession-guran", exercise: exercise("reading-evidence-and-policy-evaluation-v1", "reading:evidence-and-policy-evaluation", "reading", "Which missing evidence most directly limits generalizing the pilot result?", { A: "The report's font choice", B: "Case mix, regional coverage and long-term stability", C: "The number of headings" }, "B", "Those factors determine whether the average result transfers beyond the limited pilot.") },
];

export const GRAMMAR_LESSONS: GrammarLesson[] = ALL_GRAMMAR_LESSONS
  .filter((lesson) => isPublishedStep7Content(`hsk3.grammar.${lesson.slug}`))
  .map((lesson) => ({
    ...lesson,
    contentVersion: lesson.exercise.contentVersion,
    relatedReadingSlug: lesson.readingSlug,
    examples: lesson.examples.map((example) => ({ ...example, chinese: example.zh, pinyin: "", english: example.en })),
  }));
export const READING_LESSONS: ReadingLesson[] = ALL_READING_LESSONS
  .filter((lesson) => isPublishedStep7Content(`hsk3.reading.${lesson.slug}`))
  .map((lesson) => ({
    ...lesson,
    contentVersion: lesson.exercise.contentVersion,
    passage: lesson.text,
    pinyin: "",
    relatedGrammarSlug: lesson.grammarSlug,
    vocabulary: lesson.vocabulary.map((item) => ({ ...item, hanzi: item.word })),
  }));

const contentAudio = (logicalId: string, text: string) => {
  const asset = publishedContentAudioAssetByLogicalId(logicalId, text);
  if (!asset) throw new Error(`LISTENING_AUDIO_NOT_PUBLISHED:${logicalId}`);
  return asset;
};
const practiceAudio = (id: string) => {
  const asset = publishedPracticeAudioAsset(id);
  if (!asset) throw new Error(`LISTENING_AUDIO_NOT_APPROVED:${id}`);
  return asset;
};
const listen = (slug: string, level: number, title: string, kind: AdvancedListeningLesson["kind"], trainingType: ListeningTrainingType, register: AdvancedListeningLesson["register"], voiceText: string, audioAsset: PublishedAudioAsset, instruction: string, prompt: string, options: Record<string, string> | undefined, answer: string, explanation: string): AdvancedListeningLesson => {
  const trustedExercise = exercise(`listening-${slug}-v1`, `listening:${slug}`, kind, prompt, options, answer, explanation);
  return { slug, level, levelBand: level >= 7 ? "7-9" : String(level), contentVersion: trustedExercise.contentVersion, title, kind, trainingType, register, voiceText, audioSrc: audioAsset.src, audioAsset: publicAudioAsset(audioAsset), instruction, guidance: instruction, exercise: trustedExercise };
};

export const ADVANCED_LISTENING_LESSONS: AdvancedListeningLesson[] = [
  listen("hsk1-tone-pairs", 1, "HSK 1 single-syllable tone recognition", "tone", "tone", "everyday", "买。", contentAudio("hsk3.audio.word-mai", "买。"), "Listen to the single syllable and identify its tone.", "Which tone did you hear?", { A: "First tone", B: "Second tone", C: "Third tone", D: "Fourth tone" }, "C", "买 is pronounced mǎi with the third tone."),
  listen("hsk2-syllable-discrimination", 2, "HSK 2 syllable discrimination", "discrimination", "syllable", "everyday", "老师让我们练习发音。", contentAudio("hsk3.audio.sentence-pronunciation", "老师让我们练习发音。"), "Focus on the middle phrase and distinguish lǎoshī from lǎoshǔ.", "Which phrase did you hear?", { A: "老师让我们练习发音。", B: "老鼠让我们练习发音。", C: "老师让我们联系发音。" }, "A", "The sentence uses 老师 (teacher) and 练习 (practise)."),
  listen("hsk3-sentence-dictation", 3, "HSK 3 basic dictation", "dictation", "basic-dictation", "everyday", "每天早上，林月先复习十个生词，再听十五分钟中文。她把不懂的句子写在本子上，晚上再看一遍。", contentAudio("hsk3.audio.context-morning-study", "每天早上，林月先复习十个生词，再听十五分钟中文。她把不懂的句子写在本子上，晚上再看一遍。"), "Listen to the full context, then type the first sentence. Punctuation and spaces are ignored.", "Type the first sentence you hear.", undefined, "每天早上林月先复习十个生词再听十五分钟中文", "The first sentence is 每天早上，林月先复习十个生词，再听十五分钟中文。"),
  listen("hsk4-sentence-detail", 4, "HSK 4 sentence detail", "discrimination", "sentence", "formal", "各位乘客请注意，开往上海的列车晚点二十分钟，新的检票时间是九点十分。", practiceAudio("hsk3.practice.audio.level-4-1.v1"), "Listen for a changed time in a public announcement.", "What is the new ticket-check time?", { A: "8:50", B: "9:10", C: "9:20" }, "B", "The announcement states 新的检票时间是九点十分."),
  listen("hsk5-paragraph-inference", 5, "HSK 5 paragraph inference", "discrimination", "paragraph", "formal", "调查结果显示，多数用户喜欢新的搜索方式，但希望保留旧版筛选条件作为备用。", practiceAudio("hsk3.practice.audio.level-5-1.v1"), "Listen to the short report and infer the requested product decision.", "What do users most likely want?", { A: "Remove every old filter", B: "Keep old filters as a backup", C: "Stop using search" }, "B", "Users like the new search but explicitly ask to retain the old filters as a backup."),
  listen("hsk6-context-intent", 6, "HSK 6 context and intent", "discrimination", "context", "formal", "专家提醒，相关性并不等于因果关系，在获得更多实验数据之前，不应把初步发现写成确定结论。", practiceAudio("hsk3.practice.audio.level-6-1.v1"), "Identify why the expert gives this warning.", "What is the expert's main purpose?", { A: "To reject all experiments", B: "To prevent an unsupported causal claim", C: "To announce a final conclusion" }, "B", "The expert warns that correlation alone does not establish causation."),
  listen("hsk7-longer-discourse", 7, "HSK 7 longer discourse", "discrimination", "longer-discourse", "formal", "委员会认可试点取得的阶段性进展，但认为样本范围仍然有限，建议扩大观察周期后再决定是否全面推广。", practiceAudio("hsk3.practice.audio.advanced-7-9-1.v1"), "Track the concession and the committee's final recommendation.", "What does the committee recommend before full expansion?", { A: "End the pilot immediately", B: "Extend the observation period", C: "Ignore the limited sample" }, "B", "The committee acknowledges progress but asks for a longer observation period."),
  listen("hsk8-formal-briefing", 8, "HSK 8 formal briefing", "discrimination", "formal-briefing", "formal", "表面上看，两个方案的平均收益相近，然而第二个方案的波动更大，对资源不足的参与者而言风险也更高。", practiceAudio("hsk3.practice.audio.advanced-7-9-2.v1"), "Compare the average outcome with the distribution of risk.", "Why might the second option be less suitable for resource-limited participants?", { A: "Its average is always zero", B: "Its outcomes fluctuate more and carry greater risk", C: "It has no participants" }, "B", "Similar averages do not erase the second option's higher volatility and risk."),
  listen("hsk9-formal-argument", 9, "HSK 9 formal argument", "discrimination", "formal-argument", "formal", "谈判暂时没有达成最终协议，不过双方同意继续交换资料，并在两周后举行下一轮会议。", practiceAudio("hsk3.practice.audio.level-6-2.v1"), "Distinguish the current status from the next agreed procedural step.", "Which conclusion is justified?", { A: "Negotiations have permanently ended", B: "A final agreement was signed", C: "No final agreement exists, but talks will continue" }, "C", "The parties have not reached a final agreement, yet they agreed on further exchange and another meeting."),
];

function releasedGrammar(lesson: GrammarLesson) { return isPublishedStep7Content(`hsk3.grammar.${lesson.slug}`) ? lesson : undefined; }
function releasedReading(lesson: ReadingLesson) { return isPublishedStep7Content(`hsk3.reading.${lesson.slug}`) ? lesson : undefined; }
export const grammarLessonBySlug = (slug: string) => { const lesson = GRAMMAR_LESSONS.find((item) => item.slug === slug); return lesson ? releasedGrammar(lesson) : undefined; };
export const readingLessonBySlug = (slug: string) => { const lesson = READING_LESSONS.find((item) => item.slug === slug); return lesson ? releasedReading(lesson) : undefined; };
export const advancedListeningBySlug = (slug: string) => listeningQuestionBySlug(slug) ?? ADVANCED_LISTENING_LESSONS.find((item) => item.slug === slug);
export const publishedGrammarLessons = GRAMMAR_LESSONS.filter(releasedGrammar);
export const publishedReadingLessons = READING_LESSONS.filter(releasedReading);
export const grammarBySlug = grammarLessonBySlug;
export const readingBySlug = readingLessonBySlug;
export const normalizeStep7Answer = (value: string) => value.normalize("NFKC").replace(/[\s，。！？、,.!?]/g, "").toLowerCase();
export const isStep7AnswerAllowed = (exercise: Step7Exercise, answer: string) => exercise.options ? Object.hasOwn(exercise.options, answer) : normalizeStep7Answer(answer).length > 0 && answer.length <= 120;
const trustedExercises = new Map<string, Step7Exercise>([
  ...GRAMMAR_LESSONS.filter(releasedGrammar).map((lesson) => [lesson.exercise.id, lesson.exercise] as const),
  ...READING_LESSONS.filter(releasedReading).map((lesson) => [lesson.exercise.id, lesson.exercise] as const),
  ...READING_LIBRARY_QUESTIONS.map((lesson) => [lesson.exercise.id, lesson.exercise] as const),
  ...ADVANCED_LISTENING_LESSONS.map((lesson) => [lesson.exercise.id, lesson.exercise] as const),
  ...LISTENING_LIBRARY_QUESTIONS.map((lesson) => [lesson.exercise.id, lesson.exercise] as const),
]);
export const trustedStep7Exercise = (id: string) => trustedExercises.get(id);
