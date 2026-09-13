import type { Attempt } from "./domain.ts";
import { ADVANCED_LISTENING_LESSONS, GRAMMAR_LESSONS, READING_LESSONS, type Step7Exercise } from "./step7-content.ts";

export type ReviewAnswerMode = "choice" | "text" | "self_recall";
export type ReviewPresentationMode = "question_review" | "vocabulary_recall" | "unsupported_legacy";

export interface LegacyListeningVocabulary {
  level: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  example?: { hanzi: string; pinyin: string; meaning: string };
}

export type LegacyListeningReviewPresentation =
  | {
    reviewMode: "vocabulary_recall";
    reviewable: true;
    prompt: string;
    instruction: string;
    correctAnswer: string;
    level: number;
    skill: string;
  }
  | { reviewMode: "unsupported_legacy"; reviewable: false };

export function legacyListeningReviewPresentation(input: {
  dimension: "reading" | "audio" | "context_audio";
  audioSrc?: string;
  vocabulary?: LegacyListeningVocabulary;
}): LegacyListeningReviewPresentation {
  if (input.dimension === "reading" || !input.audioSrc || !input.vocabulary) {
    return { reviewMode: "unsupported_legacy", reviewable: false };
  }
  return {
    reviewMode: "vocabulary_recall",
    reviewable: true,
    prompt: "Listen and recall the word and its meaning.",
    instruction: "Play the recording, recall the word and meaning, then reveal them to check your memory.",
    correctAnswer: `${input.vocabulary.hanzi} — ${input.vocabulary.meaning}`,
    level: input.vocabulary.level,
    skill: "Listening · vocabulary recall",
  };
}

export interface ReviewSnapshot {
  level: number;
  levelBand: string;
  skillLabel: string;
  topic?: string;
  context?: string;
  instruction?: string;
  prompt: string;
  answerMode: ReviewAnswerMode;
  options?: Record<string, string>;
  correctAnswer: string;
  correctAnswerText: string;
  explanation: string;
  audioSrc?: string;
  audioText?: string;
  sourceGroupId?: string;
  templateId?: string;
  canonicalContentKey?: string;
}

const band = (level: number, levelBand?: string) => levelBand === "7-9" || level >= 7 ? "7–9" : String(level);
const optionsMode = (options?: Record<string, string>): ReviewAnswerMode => options && Object.keys(options).length ? "choice" : "text";


export function reviewSnapshotFromStep7Exercise(exercise: Step7Exercise): ReviewSnapshot | undefined {
  const grammar = GRAMMAR_LESSONS.find((lesson) => lesson.exercise.contentId === exercise.contentId);
  if (grammar) return {
    level: grammar.level, levelBand: band(grammar.level, grammar.levelBand), skillLabel: "Grammar", topic: grammar.title,
    context: `${grammar.pattern}\n${grammar.examples.map((example) => example.zh).join(" / ")}`,
    prompt: exercise.prompt, answerMode: optionsMode(exercise.options), options: exercise.options ? { ...exercise.options } : undefined,
    correctAnswer: exercise.correctAnswer, correctAnswerText: exercise.options?.[exercise.correctAnswer] ?? exercise.correctAnswer, explanation: exercise.explanation,
  };
  const reading = READING_LESSONS.find((lesson) => lesson.exercise.contentId === exercise.contentId);
  if (reading) return {
    level: reading.level, levelBand: band(reading.level, reading.levelBand), skillLabel: "Reading", topic: reading.title,
    context: reading.passage, prompt: exercise.prompt, answerMode: optionsMode(exercise.options), options: exercise.options ? { ...exercise.options } : undefined,
    correctAnswer: exercise.correctAnswer, correctAnswerText: exercise.options?.[exercise.correctAnswer] ?? exercise.correctAnswer, explanation: exercise.explanation,
  };
  const listening = ADVANCED_LISTENING_LESSONS.find((lesson) => lesson.exercise.contentId === exercise.contentId);
  if (listening) return {
    level: listening.level, levelBand: band(listening.level, listening.levelBand), skillLabel: "Listening", topic: listening.title,
    instruction: listening.instruction, prompt: exercise.prompt, answerMode: optionsMode(exercise.options), options: exercise.options ? { ...exercise.options } : undefined,
    correctAnswer: exercise.correctAnswer, correctAnswerText: exercise.options?.[exercise.correctAnswer] ?? exercise.correctAnswer, explanation: exercise.explanation,
    audioSrc: listening.audioSrc, audioText: listening.voiceText,
  };
  return undefined;
}

export function reviewSnapshotForAttempt(attempt: Attempt): ReviewSnapshot | undefined {
  if (attempt.reviewSnapshot) return { ...attempt.reviewSnapshot, options: attempt.reviewSnapshot.options ? { ...attempt.reviewSnapshot.options } : undefined };
  const step7 = [...GRAMMAR_LESSONS, ...READING_LESSONS, ...ADVANCED_LISTENING_LESSONS]
    .map((lesson) => lesson.exercise).find((exercise) => exercise.contentId === attempt.contentId);
  if (step7 && step7.contentVersion === attempt.contentVersion) return reviewSnapshotFromStep7Exercise(step7);
  return undefined;
}

const normalized = (value: string) => value.normalize("NFKC").toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
export function checkReviewAnswer(snapshot: ReviewSnapshot, answer: string) {
  if (!answer.trim() || snapshot.answerMode === "self_recall") return false;
  if (snapshot.answerMode === "choice") return normalized(answer) === normalized(snapshot.correctAnswer);
  return normalized(answer) === normalized(snapshot.correctAnswer) || normalized(answer) === normalized(snapshot.correctAnswerText);
}
