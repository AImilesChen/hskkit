export const PLACEMENT_VERSION = "hskkit-placement-v1";

export type PlacementSkill = "vocabulary_grammar" | "reading";

export interface PlacementQuestion {
  id: string;
  standardVersion: "HSK 3.0";
  contentVersion: typeof PLACEMENT_VERSION;
  level: number;
  skill: PlacementSkill;
  prompt: string;
  context?: string;
  options: Record<"a" | "b" | "c" | "d", string>;
  correctAnswer: "a" | "b" | "c" | "d";
  publicationStatus: "diagnostic-only";
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: "placement-v1-l1-vocab",
    standardVersion: "HSK 3.0",
    contentVersion: PLACEMENT_VERSION,
    level: 1,
    skill: "vocabulary_grammar",
    prompt: "Which Chinese expression means “hello”?",
    options: { a: "你好", b: "谢谢", c: "再见", d: "对不起" },
    correctAnswer: "a",
    publicationStatus: "diagnostic-only",
  },
  {
    id: "placement-v1-l2-grammar",
    standardVersion: "HSK 3.0",
    contentVersion: PLACEMENT_VERSION,
    level: 2,
    skill: "vocabulary_grammar",
    prompt: "Choose the most natural word for the blank.",
    context: "我每天早上八点___上课。",
    options: { a: "在", b: "从", c: "开始", d: "给" },
    correctAnswer: "c",
    publicationStatus: "diagnostic-only",
  },
  {
    id: "placement-v1-l3-grammar",
    standardVersion: "HSK 3.0",
    contentVersion: PLACEMENT_VERSION,
    level: 3,
    skill: "vocabulary_grammar",
    prompt: "Choose the connector that completes the sentence.",
    context: "___今天下雨，他还是按时到了。",
    options: { a: "如果", b: "虽然", c: "因为", d: "只要" },
    correctAnswer: "b",
    publicationStatus: "diagnostic-only",
  },
  {
    id: "placement-v1-l4-reading",
    standardVersion: "HSK 3.0",
    contentVersion: PLACEMENT_VERSION,
    level: 4,
    skill: "reading",
    prompt: "What is the main reason Xiao Li changed his plan?",
    context: "小李本来打算周六去爬山，可是天气预报说会有大雨，所以他决定改到下周。",
    options: { a: "He felt tired.", b: "His friend was busy.", c: "Heavy rain was forecast.", d: "The mountain was closed." },
    correctAnswer: "c",
    publicationStatus: "diagnostic-only",
  },
  {
    id: "placement-v1-l5-reading",
    standardVersion: "HSK 3.0",
    contentVersion: PLACEMENT_VERSION,
    level: 5,
    skill: "reading",
    prompt: "Which statement best matches the passage?",
    context: "这家书店面积不大，却经常举办读书会。附近居民不仅来买书，也把这里当作交流想法的地方。",
    options: { a: "The store mainly sells textbooks.", b: "The store also serves as a community space.", c: "Residents think the store is too small.", d: "Reading groups have stopped meeting there." },
    correctAnswer: "b",
    publicationStatus: "diagnostic-only",
  },
  {
    id: "placement-v1-l6-grammar",
    standardVersion: "HSK 3.0",
    contentVersion: PLACEMENT_VERSION,
    level: 6,
    skill: "vocabulary_grammar",
    prompt: "Choose the most precise word for the blank.",
    context: "面对突发变化，团队需要及时___原来的方案。",
    options: { a: "调整", b: "调动", c: "调节", d: "调解" },
    correctAnswer: "a",
    publicationStatus: "diagnostic-only",
  },
  {
    id: "placement-v1-l7-reading",
    standardVersion: "HSK 3.0",
    contentVersion: PLACEMENT_VERSION,
    level: 7,
    skill: "reading",
    prompt: "What concern does the author emphasize?",
    context: "技术提高了信息传播效率，但如果只追求速度而忽视来源核验，错误信息也会以同样的速度扩散。",
    options: { a: "Technology is always too expensive.", b: "Fast communication can amplify unchecked errors.", c: "People should stop using online sources.", d: "Information now travels too slowly." },
    correctAnswer: "b",
    publicationStatus: "diagnostic-only",
  },
  {
    id: "placement-v1-l8-vocab",
    standardVersion: "HSK 3.0",
    contentVersion: PLACEMENT_VERSION,
    level: 8,
    skill: "vocabulary_grammar",
    prompt: "Which word best completes the formal sentence?",
    context: "该结论仍需更多数据加以___，不宜过早推广。",
    options: { a: "验证", b: "体验", c: "领会", d: "观赏" },
    correctAnswer: "a",
    publicationStatus: "diagnostic-only",
  },
  {
    id: "placement-v1-l9-reading",
    standardVersion: "HSK 3.0",
    contentVersion: PLACEMENT_VERSION,
    level: 9,
    skill: "reading",
    prompt: "Which inference is best supported?",
    context: "公共政策的成效往往难以用单一指标衡量。短期数据可能改善，却未必意味着长期结构性问题已经缓解。因此，评估既要关注即时结果，也要追踪影响如何分布。",
    options: { a: "Short-term improvement proves every problem is solved.", b: "A single indicator is enough for policy evaluation.", c: "Evaluation should include long-term and distributional effects.", d: "Immediate outcomes should never be measured." },
    correctAnswer: "c",
    publicationStatus: "diagnostic-only",
  },
];

const PLACEMENT_CATALOGS: Record<string, PlacementQuestion[]> = {
  [PLACEMENT_VERSION]: PLACEMENT_QUESTIONS,
};

export function placementCatalog(version = PLACEMENT_VERSION) {
  return PLACEMENT_CATALOGS[version] ?? [];
}

export function trustedPlacementQuestion(id: string, version = PLACEMENT_VERSION) {
  return placementCatalog(version).find((question) => question.id === id);
}

export function publicPlacementQuestion(question: PlacementQuestion) {
  const { correctAnswer: _correctAnswer, ...safe } = question;
  return safe;
}
