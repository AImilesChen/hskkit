import { listPublishedWords, type StudyWord } from "../dictionary/catalog.ts";
import { selectTodayContent, todayContentByAssetId } from "./today-content.ts";
import type { Dimension } from "./domain.ts";

export type AudioMode = "audio" | "context_audio";
export interface AudioExercise {
  assetId: string;
  contentId: string;
  contentVersion: string;
  dimension: Extract<Dimension, "audio" | "context_audio">;
  voiceText: string;
  prompt: string;
  options: Record<string, string>;
  correctAnswer: string;
  word: StudyWord;
}
export type PublicAudioExercise = Omit<AudioExercise, "correctAnswer">;

export function publicAudioExercise(exercise: AudioExercise): PublicAudioExercise {
  const { correctAnswer: _correctAnswer, ...safe } = exercise;
  return safe;
}

export function audioPlaybackSubject(exercise: Pick<AudioExercise, "assetId" | "dimension" | "contentVersion">, dailySessionId?: string, dailyItemId?: string) {
  if ((dailySessionId && !dailyItemId) || (!dailySessionId && dailyItemId)) throw new Error("INVALID_DAILY_AUDIO_BINDING");
  const base = `audio:${exercise.assetId}:${exercise.dimension}:${exercise.contentVersion}`;
  return dailySessionId && dailyItemId ? `${base}:daily:${dailySessionId}:${dailyItemId}` : base;
}

const letters = ["A", "B", "C", "D"] as const;

export function listAudioAssets(): StudyWord[] {
  return listPublishedWords();
}

export function trustedAudioExercise(assetId: string, mode: AudioMode): AudioExercise | undefined {
  const words = listAudioAssets();
  const wordIndex = words.findIndex((word) => word.id === assetId);
  if (wordIndex < 0) return undefined;
  const word = words[wordIndex];
  const correctIndex = wordIndex % letters.length;
  const distractors = words.filter((candidate) => candidate.id !== word.id).slice(0, 3);
  if (distractors.length < 3) return undefined;
  const choices = [...distractors];
  choices.splice(correctIndex, 0, word);
  const text = (candidate: StudyWord) => mode === "audio" ? candidate.meaning : candidate.example.meaning;
  const options = Object.fromEntries(letters.map((letter, index) => [letter, text(choices[index])])) as Record<string, string>;
  return {
    assetId,
    contentId: `word:${assetId}`,
    contentVersion: `catalog-v${word.contentVersion}`,
    dimension: mode,
    voiceText: mode === "audio" ? word.hanzi : word.example.hanzi,
    prompt: mode === "audio" ? "Listen to the word and choose its meaning." : "Listen to the sentence and choose its meaning.",
    options,
    correctAnswer: letters[correctIndex],
    word,
  };
}

export function trustedTodayAudioExercise(assetId: string, mode: AudioMode): AudioExercise | undefined {
  const plans = Array.from({ length: 7 }, (_, index) => selectTodayContent(index + 1));
  const item = plans.flatMap((plan) => plan.status === "ready" ? [plan.item] : []).find((candidate) => candidate.assetId === assetId) ?? todayContentByAssetId(assetId);
  if (!item) return undefined;
  const distractors = plans
    .flatMap((plan) => plan.status === "ready" && plan.item.assetId !== assetId ? [plan.item] : [])
    .slice(0, 3);
  if (distractors.length < 3) return undefined;
  const candidates = [...distractors];
  const correctIndex = (item.level - 1) % letters.length;
  candidates.splice(correctIndex, 0, item);
  const optionText = (candidate: typeof item) => mode === "audio" ? candidate.meaning : candidate.example.meaning;
  const options = Object.fromEntries(letters.map((letter, index) => [letter, optionText(candidates[index])])) as Record<string, string>;
  const word: StudyWord = {
    id: item.assetId,
    slug: item.studySlug,
    level: item.level,
    hanzi: item.hanzi,
    pinyin: item.pinyin,
    meaning: item.meaning,
    partOfSpeech: item.partOfSpeech,
    example: item.example,
    releaseStatus: "published",
    qaStatus: "approved",
    contentVersion: 1,
    sourceVersion: item.contentVersion,
    audio: { status: "browser-speech", locale: "zh-CN" },
  };
  return {
    assetId,
    contentId: item.contentId,
    contentVersion: item.contentVersion,
    dimension: mode,
    voiceText: mode === "audio" ? item.hanzi : item.example.hanzi,
    prompt: mode === "audio" ? "Listen to the word and choose its meaning." : "Listen to the sentence and choose its meaning.",
    options,
    correctAnswer: letters[correctIndex],
    word,
  };
}
