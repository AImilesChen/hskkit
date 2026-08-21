export const PRACTICE_VERSION = "hskkit-practice-l1-vocabulary-v1";
export type PracticeSkill = "vocabulary";
export type PracticeAnswerChoice = "a" | "b" | "c" | "d";

export interface PracticeQuestion {
  id: string;
  standardVersion: "HSK 3.0";
  contentVersion: typeof PRACTICE_VERSION;
  level: 1;
  skill: PracticeSkill;
  prompt: string;
  context?: string;
  options: Record<PracticeAnswerChoice, string>;
  correctAnswer: PracticeAnswerChoice;
  explanation: string;
  weaknessTag: string;
  qaStatus: "approved-for-bounded-practice";
  publicationStatus: "practice-only";
}

export const PRACTICE_QUESTIONS: PracticeQuestion[] = [
  {
    id: "practice-v1-l1-vocab-hello",
    standardVersion: "HSK 3.0",
    contentVersion: PRACTICE_VERSION,
    level: 1,
    skill: "vocabulary",
    prompt: "Which Chinese expression means “hello”?",
    options: { a: "你好", b: "谢谢", c: "再见", d: "对不起" },
    correctAnswer: "a",
    explanation: "你好 is the standard greeting for “hello.”",
    weaknessTag: "basic-greetings",
    qaStatus: "approved-for-bounded-practice",
    publicationStatus: "practice-only",
  },
  {
    id: "practice-v1-l1-vocab-thanks",
    standardVersion: "HSK 3.0",
    contentVersion: PRACTICE_VERSION,
    level: 1,
    skill: "vocabulary",
    prompt: "Which expression means “thank you”?",
    options: { a: "谢谢", b: "你好", c: "再见", d: "没关系" },
    correctAnswer: "a",
    explanation: "谢谢 is used to express thanks.",
    weaknessTag: "basic-greetings",
    qaStatus: "approved-for-bounded-practice",
    publicationStatus: "practice-only",
  },
  {
    id: "practice-v1-l1-vocab-goodbye",
    standardVersion: "HSK 3.0",
    contentVersion: PRACTICE_VERSION,
    level: 1,
    skill: "vocabulary",
    prompt: "Which expression means “goodbye”?",
    options: { a: "再见", b: "请", c: "是", d: "有" },
    correctAnswer: "a",
    explanation: "再见 literally means “see you again” and is used for “goodbye.”",
    weaknessTag: "basic-greetings",
    qaStatus: "approved-for-bounded-practice",
    publicationStatus: "practice-only",
  },
];

export function practiceQuestionSet(level: number, skill: string) {
  return PRACTICE_QUESTIONS.filter((question) => question.level === level && question.skill === skill);
}

export function trustedPracticeQuestion(id: string) {
  return PRACTICE_QUESTIONS.find((question) => question.id === id);
}

export function publicPracticeQuestion(question: PracticeQuestion) {
  return {
    id: question.id,
    standardVersion: question.standardVersion,
    contentVersion: question.contentVersion,
    level: question.level,
    skill: question.skill,
    prompt: question.prompt,
    context: question.context,
    options: question.options,
  };
}
