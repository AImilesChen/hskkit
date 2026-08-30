import type { LearningState } from "../learning/domain.ts";

export type DictionaryPracticeMode = "meaning" | "pinyin" | "listening";

export interface DictionaryPracticeWord {
  assetId: string;
  contentId: string;
  contentVersion: string;
  level: number;
  levelBand: string;
  hanzi: string;
  traditional: string;
  pinyin: string;
  meaning: string;
  formalAudioUrl?: string;
}

export interface DictionaryPracticeExercise {
  id: string;
  mode: DictionaryPracticeMode;
  prompt: string;
  instruction: string;
  options: Array<{ key: "A" | "B" | "C" | "D"; text: string }>;
  correctAnswer: "A" | "B" | "C" | "D";
  correctAnswerText: string;
  formalAudioUrl?: string;
}

const optionKeys = ["A", "B", "C", "D"] as const;
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[\s'’\-]+/g, "");

function distinctValues(current: DictionaryPracticeWord, candidates: DictionaryPracticeWord[], field: "hanzi" | "pinyin" | "meaning") {
  const values = [current[field], ...candidates.map((candidate) => candidate[field])];
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = normalize(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 4);
}

function exercise(
  word: DictionaryPracticeWord,
  candidates: DictionaryPracticeWord[],
  mode: DictionaryPracticeMode,
): DictionaryPracticeExercise | undefined {
  const field = mode === "pinyin" ? "pinyin" : mode === "listening" ? "hanzi" : "meaning";
  const values = distinctValues(word, candidates, field);
  if (values.length < 4) return undefined;
  const correctText = word[field];
  const options = values.map((text, index) => ({ key: optionKeys[index], text }));
  const correct = options.find((option) => option.text === correctText);
  if (!correct) return undefined;
  return {
    id: `dictionary:${word.assetId}:${mode}`,
    mode,
    prompt: mode === "listening" ? "Listen, then choose the word you hear." : word.hanzi,
    instruction: mode === "meaning" ? "Choose the meaning" : mode === "pinyin" ? "Choose the pinyin" : "Listen and choose",
    options,
    correctAnswer: correct.key,
    correctAnswerText: correct.text,
    ...(mode === "listening" && word.formalAudioUrl ? { formalAudioUrl: word.formalAudioUrl } : {}),
  };
}

export function buildDictionaryPractice(word: DictionaryPracticeWord, candidates: DictionaryPracticeWord[]) {
  const exercises = [exercise(word, candidates, "meaning"), exercise(word, candidates, "pinyin")];
  if (word.formalAudioUrl) exercises.push(exercise(word, candidates, "listening"));
  return exercises.filter((item): item is DictionaryPracticeExercise => Boolean(item));
}

export function resolveDictionaryPractice(
  word: DictionaryPracticeWord,
  candidates: DictionaryPracticeWord[],
  mode: string,
  answer: string,
) {
  const item = buildDictionaryPractice(word, candidates).find((candidate) => candidate.mode === mode);
  if (!item || !item.options.some((option) => option.key === answer)) throw new Error("INVALID_DICTIONARY_PRACTICE");
  return item;
}

export function dictionaryWordProgress(state: LearningState, assetId: string, now: string) {
  const contentId = `word:${assetId}`;
  const card = state.cards.find((candidate) => candidate.contentId === contentId);
  const completedToday = state.dailySessions.some((session) => session.items.some((item) => item.id === `dictionary:${assetId}` && item.status === "completed"));
  const pendingToday = state.dailySessions.some((session) => session.items.some((item) => item.id === `dictionary:${assetId}` && item.status === "pending"));
  const attempted = state.attempts.some((attempt) => attempt.contentId === contentId);
  return {
    saved: (state.savedWordIds ?? []).includes(assetId),
    today: completedToday ? "completed" as const : pendingToday ? "pending" as const : "none" as const,
    learned: completedToday || attempted || Boolean(card),
    review: !card ? "none" as const : card.dueAt <= now ? "due" as const : "scheduled" as const,
    dueAt: card?.dueAt,
  };
}
