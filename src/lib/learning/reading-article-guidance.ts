import type { ReadingArticle } from './reading-articles';

export type ReadingEvidence = { paragraph: number; quote: string };
type Pattern = { pattern: string; explanation: string; source: string };
type Guidance = {
  goal: string;
  focus: string[];
  patterns: Pattern[];
  evidence: [string, string, string];
  words?: ReadingArticle['vocabulary'];
  wordSources?: Record<string, string>;
  image?: { src: string; alt: string };
};

// Editorial guidance quotes the existing article; it does not change its level or text.
export const READING_GUIDANCE: Record<string, Guidance> = {
  'a-market-morning': {
    goal: 'Follow a family shopping trip: find out when they go, what they buy and who does what.',
    focus: ['Time words', 'Family', 'Quantities'],
    image: { src: '/illustrations/food-drink.webp', alt: 'Illustrated market with fresh fruit and vegetables' },
    patterns: [
      { pattern: '想 + verb', explanation: 'Put 想 before a verb to say what someone wants to do. Here, the family wants to buy fruit and vegetables.', source: '我们想买水果' },
      { pattern: '一起 + verb', explanation: '一起 means together. Place it before the action to show that people do it with one another.', source: '我们一起回家' },
    ],
    evidence: ['今天是星期六。早上，妈妈和我去菜市场。', '爸爸做饭', '我买了两个大苹果'],
    words: [
      { word: '苹果', pinyin: 'píngguǒ', meaning: 'apple' },
      { word: '中午', pinyin: 'zhōngwǔ', meaning: 'noon; midday' },
      { word: '做饭', pinyin: 'zuò fàn', meaning: 'cook; prepare a meal' },
    ],
  },
  'the-library-card': {
    goal: 'Follow the steps for borrowing a book, and find the return date and the reason for another visit.',
    focus: ['Sequence', 'Dates', 'Reasons'],
    image: { src: '/home-guides/hsk-3-0-levels-explained.webp', alt: 'Learner studying with books and Chinese learning materials' },
    patterns: [
      { pattern: '先……再……', explanation: 'Use 先 for the first action and 再 for the next. The staff member explains the order for getting a library card.', source: '可以先填写一张表' },
      { pattern: '因为 + reason', explanation: '因为 introduces a reason. Find the two things Li Ming likes about the library.', source: '他想下周再来' },
    ],
    evidence: ['可是他没有借书证', '两周后要还书', '因为这里很安静'],
    words: [
      { word: '图书馆', pinyin: 'túshūguǎn', meaning: 'library' },
      { word: '工作人员', pinyin: 'gōngzuò rényuán', meaning: 'staff member' },
      { word: '安静', pinyin: 'ānjìng', meaning: 'quiet' },
    ],
  },
  'a-neighbours-garden': {
    goal: 'Follow how an empty space changes, and notice what the garden means to the neighbours.',
    focus: ['Before & after', 'Shared tasks', 'Main idea'],
    patterns: [
      { pattern: '把 + object + action', explanation: '把 puts the affected object before the action. Here, the neighbours want to turn the empty space into a garden.', source: '把空地变成小花园' },
      { pattern: '不只是……而是……', explanation: 'The ending shifts attention from the flowers to the deeper value of doing something together.', source: '花园最好的地方不只是花' },
    ], evidence: ['以前那里只有旧椅子', '大家约好轮流照看花园', '花园最好的地方不只是花'],
  },
  'the-school-book-exchange': {
    goal: 'Identify the purpose of the exchange, the change that attracted readers and the improvements planned next.',
    focus: ['Purpose', 'Cause & effect', 'Next steps'],
    patterns: [
      { pattern: '为了 + purpose', explanation: '为了 introduces the goal of an action. Separate the activity itself from the reason for organising it.', source: '为了让更多人接触不同的书' },
      { pattern: '不只是……更是……', explanation: 'This pattern adds a more important purpose after the first one. Saving money is only part of the value.', source: '换书的目的不只是节省买书的钱' },
    ], evidence: ['为了让更多人接触不同的书', '贴上一张介绍卡', '公布更清楚的收书标准'],
  },
  'the-community-kitchen': {
    goal: 'Explain why the rules changed and distinguish early improvement from evidence of lasting success.',
    focus: ['Changing rules', 'Evidence', 'Long-term value'],
    patterns: [
      { pattern: '原本以为……然而……', explanation: 'The writer contrasts an initial expectation with what the first month actually showed.', source: '管理人员原本以为' },
      { pattern: '不只……还要……', explanation: 'The conclusion adds a second, broader test of value: continued participation, not just one evening’s attendance.', source: '社区活动的价值不只看当晚来了多少人' },
    ], evidence: ['新来的居民很难加入谈话', '不能证明新规则一定有效', '不同的人能否长期参与'],
  },
  'wetland-restoration': {
    goal: 'Connect the restoration goals, responses to local concerns and the conditions used to judge the project.',
    focus: ['Stakeholders', 'Comparisons', 'Conditions'],
    patterns: [
      { pattern: '不仅……也……', explanation: 'The plan links a benefit for birds with another possible benefit for nearby residents. Notice the uncertainty in 可能.', source: '这不仅有利于鸟类' },
      { pattern: '若……就……', explanation: '若 introduces a condition. The committee names specific problems that must trigger another review.', source: '若附近道路持续拥堵' },
    ], evidence: ['如果两地都出现相同变化', '设计外围装卸点', '若附近道路持续拥堵'],
  },
  'evidence-for-green-delivery': {
    goal: 'Evaluate whether a local pilot can be generalised, considering location, measurement and different groups of residents.',
    focus: ['Generalisability', 'Hidden costs', 'Group differences'],
    patterns: [
      { pattern: '若……便……', explanation: 'The conditional sentence questions the claimed improvement if congestion has simply moved elsewhere.', source: '若拥堵只是从一条街转移到了另一条街' },
      { pattern: '为避免……', explanation: 'This phrase gives the reason for another trial: avoiding an explanation that mistakes favourable conditions for policy effects.', source: '为避免把有利条件误认为政策本身的成效' },
    ], evidence: ['配送路线短于全市平均水平', '不能被平均满意度掩盖', '选取几个接驳设施较少的街区'],
  },
  'museum-machine-translation': {
    goal: 'Distinguish speed from accuracy, and explain why different museum texts need different levels of review.',
    focus: ['Meaning', 'Uncertainty', 'Responsibility'],
    patterns: [
      { pattern: '若只……就/会……', explanation: 'The sentence warns that a narrow measure of output can miss cultural and factual distortions.', source: '若只统计拼写错误和完成数量' },
      { pattern: '并非……而是……', explanation: 'The writer rejects one interpretation and replaces it with a more precise one: the new process redistributes responsibility.', source: '这一安排并非拒绝技术' },
    ], evidence: ['展品与当地历史之间的联系消失了', '涉及文化解释、未定论的史实和敏感称谓', '机器擅长提供可修改的起点'],
  },
  'urban-cooling-causality': {
    goal: 'Separate observed differences from causal claims, and explain the assumptions and limits of the comparison.',
    focus: ['Causality', 'Confounding', 'Uncertainty'],
    patterns: [
      { pattern: '即使……也……', explanation: 'Even after one issue is addressed, another problem can remain. Here, weather data alone cannot remove pre-existing differences.', source: '即使补齐气象资料' },
      { pattern: '不仅是……还包括……', explanation: 'The conclusion expands the question from whether an effect exists to where, for whom and under what conditions it is stable.', source: '决策者需要知道的不仅是' },
    ], evidence: ['这个数字简洁有力', '对暂未实施的建筑持续使用同一设备', '分别呈现不同建筑类型的估计区间'],
    wordSources: { '因果': '由项目造成的效果' },
  },
};

export function paragraphAnchor(index: number) { return `reading-paragraph-${index + 1}`; }

export function findReadingEvidence(article: ReadingArticle, phrase: string): ReadingEvidence {
  const paragraph = article.paragraphs.findIndex(text => text.includes(phrase));
  if (paragraph < 0) throw new Error(`Missing reading source: ${article.slug}: ${phrase}`);
  const quote = article.paragraphs[paragraph].split(/(?<=[。！？])/u).find(text => text.includes(phrase)) ?? phrase;
  if (!quote) throw new Error(`Missing reading sentence: ${article.slug}`);
  return { paragraph, quote };
}

export function readingGuidance(article: ReadingArticle) {
  const guide = READING_GUIDANCE[article.slug];
  if (!guide) throw new Error(`Missing reading guidance: ${article.slug}`);
  const words = [...article.vocabulary, ...(guide.words ?? [])];
  return {
    ...guide,
    words: words.map(word => ({ ...word, example: findReadingEvidence(article, guide.wordSources?.[word.word] ?? word.word) })),
    patterns: guide.patterns.map(pattern => ({ ...pattern, example: findReadingEvidence(article, pattern.source) })),
    questions: article.questions.map((question, index) => ({ ...question, evidence: findReadingEvidence(article, guide.evidence[index]) })),
  };
}

export type ReadingWord = ReadingArticle['vocabulary'][number];
export function readingWordSegments(text: string, words: ReadingWord[]): Array<{ text: string; word?: ReadingWord }> {
  const segments: Array<{ text: string; word?: ReadingWord }> = [];
  let cursor = 0;
  const sorted = [...words].filter(word => word.word.length > 0).sort((a,b) => b.word.length - a.word.length);
  while (cursor < text.length) {
    let next = -1;
    let match: ReadingWord | undefined;
    for (const word of sorted) {
      const position = text.indexOf(word.word, cursor);
      if (position >= 0 && (next < 0 || position < next)) { next = position; match = word; }
    }
    if (next < 0 || !match) { segments.push({ text: text.slice(cursor) }); break; }
    if (next > cursor) segments.push({ text: text.slice(cursor,next) });
    segments.push({ text: match.word, word: match });
    cursor = next + match.word.length;
  }
  return segments;
}
