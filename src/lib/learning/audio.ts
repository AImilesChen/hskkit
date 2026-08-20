import { listPublishedWords, type StudyWord } from "../dictionary/catalog";
import type { Dimension } from "./domain";

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
