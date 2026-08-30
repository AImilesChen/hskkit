import type { Attempt } from "./domain.ts";
import { trustedQuestion } from "./questions.ts";
import { trustedAudioExercise, trustedTodayAudioExercise } from "./audio.ts";
import { todayContentByContentId } from "./today-content.ts";
import { trustedPracticeQuestionVersion } from "../practice/questions.ts";
import { reviewSnapshotForAttempt, type ReviewSnapshot } from "./review-content.ts";

const band = (level: number, levelBand?: string) => levelBand === "7-9" || level >= 7 ? "7–9" : String(level);

/** Restores only questions that still exist in a trusted, versioned source. Unknown legacy attempts remain honest self-recall items. */
export function resolvedReviewSnapshotForAttempt(attempt: Attempt): ReviewSnapshot | undefined {
  const storedOrStep7 = reviewSnapshotForAttempt(attempt);
  if (storedOrStep7) return storedOrStep7;

  if (attempt.contentId.startsWith("practice:")) {
    const question = trustedPracticeQuestionVersion(attempt.contentId.slice("practice:".length), attempt.contentVersion);
    if (question) return {
      level: question.level,
      levelBand: band(question.level, question.levelBand),
      skillLabel: question.skill[0].toUpperCase() + question.skill.slice(1),
      topic: question.weaknessTag,
      context: question.context,
      prompt: question.prompt,
      answerMode: "choice",
      options: { ...question.options },
      correctAnswer: question.correctAnswer,
      correctAnswerText: question.options[question.correctAnswer],
      explanation: question.explanation,
      audioSrc: question.audioSrc,
    };
  }

  if (attempt.contentId.startsWith("question:")) {
    const question = trustedQuestion(attempt.contentId.slice("question:".length));
    if (question?.contentVersion === attempt.contentVersion) return {
      level: question.level,
      levelBand: band(question.level),
      skillLabel: "Reading",
      context: question.passage_cn,
      prompt: question.question_en || question.question_cn,
      answerMode: "choice",
      options: { ...question.options },
      correctAnswer: question.correct_answer,
      correctAnswerText: question.options[question.correct_answer],
      explanation: question.explanation ?? "Compare the supported detail with the other choices.",
    };
  }

  const catalogItem = todayContentByContentId(attempt.contentId);
  const assetId = attempt.contentId.startsWith("word:") ? attempt.contentId.slice("word:".length) : catalogItem?.assetId;
  if (assetId) {
    const mode = attempt.dimension === "context_audio" ? "context_audio" : "audio";
    const exercise = trustedTodayAudioExercise(assetId, mode) ?? trustedAudioExercise(assetId, mode);
    if (exercise?.contentVersion === attempt.contentVersion) return {
      level: exercise.word.level,
      levelBand: band(exercise.word.level),
      skillLabel: exercise.dimension === "audio" ? "Listening · word" : "Listening · sentence",
      topic: exercise.word.partOfSpeech,
      prompt: exercise.prompt,
      answerMode: "choice",
      options: { ...exercise.options },
      correctAnswer: exercise.correctAnswer,
      correctAnswerText: exercise.options[exercise.correctAnswer],
      explanation: `${exercise.word.hanzi} (${exercise.word.pinyin}) means “${exercise.word.meaning}.”`,
      audioSrc: exercise.word.audio.status === "formal" ? exercise.word.audio.src : undefined,
      audioText: exercise.voiceText,
    };
  }
  return undefined;
}
