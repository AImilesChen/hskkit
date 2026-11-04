type Expression = { hanzi: string; pinyin: string; meaning: string };
type Editorial = {
  examples: Expression[];
  collocations: Expression[];
  usage: { title: string; explanation: string };
  related: Array<{ id: string; relationship: string }>;
  grammar: Array<{ slug: string; sentence: string; reason: string }>;
};

// Supplementary teaching notes keyed to published asset IDs, so friendly slugs
// and canonical dictionary URLs receive the same material. Corpus text is intact.
export const WORD_DETAIL_EDITORIAL: Record<string, Editorial> = {
  "hsk2025.word.l1.0001.v1": {
    examples: [
      { hanzi: "我爱看书。", pinyin: "Wǒ ài kàn shū.", meaning: "I love reading." },
      { hanzi: "你爱喝茶吗？", pinyin: "Nǐ ài hē chá ma?", meaning: "Do you like drinking tea?" },
    ],
    collocations: [
      { hanzi: "爱家人", pinyin: "ài jiārén", meaning: "love one's family" },
      { hanzi: "爱看书", pinyin: "ài kàn shū", meaning: "love reading" },
      { hanzi: "爱运动", pinyin: "ài yùndòng", meaning: "enjoy exercising" },
    ],
    usage: { title: "Love a person; enjoy an activity", explanation: "爱 can express love for a person, as in 爱家人. Before an activity such as 看书, it can express a strong liking or a habit. 喜欢 is a useful alternative for a general preference; the two words are not interchangeable in every context." },
    related: [
      { id: "hsk2025.word.l1.0225.v1", relationship: "Compare meanings · a general liking or preference" },
      { id: "hsk2025.word.l3.0886.v1", relationship: "Similar meaning · to like; to be fond of" },
      { id: "hsk2025.word.l4.1724.v1", relationship: "Opposite preference · to dislike" },
    ],
    grammar: [{ slug: "ma-yes-no-questions", sentence: "你爱喝茶吗？", reason: "The final 吗 turns 你爱喝茶 into a yes–no question." }],
  },
  "hsk2025.word.l1.0173.v1": {
    examples: [
      { hanzi: "我有三个苹果。", pinyin: "Wǒ yǒu sān gè píngguǒ.", meaning: "I have three apples." },
      { hanzi: "我买了三本书。", pinyin: "Wǒ mǎi le sān běn shū.", meaning: "I bought three books." },
    ],
    collocations: [
      { hanzi: "三个人", pinyin: "sān gè rén", meaning: "three people" },
      { hanzi: "三本书", pinyin: "sān běn shū", meaning: "three books" },
      { hanzi: "三点", pinyin: "sān diǎn", meaning: "three o'clock" },
    ],
    usage: { title: "Number + measure word + noun", explanation: "Use the appropriate measure word when counting nouns: 三个人 (three people), 三本书 (three books). For clock time, 三点 means three o'clock." },
    related: [
      { id: "hsk2025.word.l1.0049.v1", relationship: "Number sequence · two" },
      { id: "hsk2025.word.l1.0198.v1", relationship: "Number sequence · four" },
      { id: "hsk2025.word.l1.0254.v1", relationship: "Number sequence · one" },
    ],
    grammar: [
      { slug: "you-meiyou-possession", sentence: "我有三个苹果。", reason: "有 introduces what the speaker has; 三个苹果 is the object." },
      { slug: "le-completed-action", sentence: "我买了三本书。", reason: "了 after 买 marks the completed action; 三本书 tells us how many books." },
    ],
  },
  "hsk2025.word.l1.0249.v1": {
    examples: [
      { hanzi: "我正在学习中文。", pinyin: "Wǒ zhèngzài xuéxí Zhōngwén.", meaning: "I am studying Chinese right now." },
      { hanzi: "你每天学习中文吗？", pinyin: "Nǐ měitiān xuéxí Zhōngwén ma?", meaning: "Do you study Chinese every day?" },
    ],
    collocations: [
      { hanzi: "学习中文", pinyin: "xuéxí Zhōngwén", meaning: "study Chinese" },
      { hanzi: "学习方法", pinyin: "xuéxí fāngfǎ", meaning: "study method" },
      { hanzi: "认真学习", pinyin: "rènzhēn xuéxí", meaning: "study diligently" },
    ],
    usage: { title: "Study something, then practise and review", explanation: "学习 can take a subject such as 中文 directly as its object. 学 is a shorter alternative in many everyday sentences. 练习 focuses on practising a skill, while 复习 means going over material already learned." },
    related: [
      { id: "hsk2025.word.l1.0247.v1", relationship: "Compare usage · a shorter word for learn or study" },
      { id: "hsk2025.word.l3.0752.v1", relationship: "Next step · practise a skill" },
      { id: "hsk2025.word.l3.0634.v1", relationship: "Next step · review what you have learned" },
    ],
    grammar: [
      { slug: "zhengzai-action", sentence: "我正在学习中文。", reason: "正在 before 学习 describes an action happening now." },
      { slug: "ma-yes-no-questions", sentence: "你每天学习中文吗？", reason: "吗 at the end asks whether this daily habit is true." },
    ],
  },
};
