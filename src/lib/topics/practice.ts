import { publicAudioAsset, type PublishedAudioAsset, type PublicAudioAsset } from "../audio/assets.ts";
import { createHash } from "node:crypto";
import { recordAttempt, type LearningState, type Dimension } from "../learning/domain.ts";
import type { ReviewSnapshot } from "../learning/review-content.ts";
import type { LearningTopic } from "./catalog.ts";

export type TopicPracticeMode = "meaning" | "pinyin" | "listening" | "scene";
export type TopicPracticeChoice = { key: string; text: string };

export type TopicPracticeWord = {
  assetId: string;
  contentId: string;
  contentVersion: string;
  level: number;
  levelBand: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  audioAsset?: PublishedAudioAsset;
};

export type TrustedTopicPracticeQuestion = {
  id: string;
  topicSlug: string;
  topicTitle: string;
  mode: TopicPracticeMode;
  instruction: string;
  prompt: string;
  context?: string;
  audioAsset?: PublishedAudioAsset;
  options: TopicPracticeChoice[];
  correctAnswer: string;
  explanation: string;
  contentId: string;
  contentVersion: string;
  dimension: Dimension;
  level: number;
  levelBand: string;
  reviewSnapshot: ReviewSnapshot;
};

export type PublicTopicPracticeQuestion = Omit<TrustedTopicPracticeQuestion,
  "correctAnswer" | "explanation" | "contentId" | "contentVersion" | "dimension" | "reviewSnapshot" | "audioAsset"
> & { audioAsset?: PublicAudioAsset };

const choiceKeys = ["a", "b", "c", "d"];
const stableId = (value: string) => createHash("sha256").update(value).digest("base64url").slice(0, 20);
const unique = (values: string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))];

function choicesFor(correct: string, alternatives: string[], seed: string) {
  const values = unique([correct, ...alternatives]);
  if (values.length < 4) return null;
  const selected = values.slice(0, 4);
  const correctIndex = createHash("sha256").update(seed).digest()[0] % 4;
  const ordered = selected.slice(1);
  ordered.splice(correctIndex, 0, selected[0]);
  return {
    options: ordered.map((text, index) => ({ key: choiceKeys[index], text })),
    correctAnswer: choiceKeys[correctIndex],
  };
}

function question(input: Omit<TrustedTopicPracticeQuestion, "id" | "reviewSnapshot">): TrustedTopicPracticeQuestion {
  const optionIdentity = input.options.map((option) => `${option.key}:${option.text}`).join("|");
  const id = `topic-practice-${stableId(`${input.topicSlug}:${input.mode}:${input.contentId}:${input.contentVersion}:${input.prompt}:${optionIdentity}:${input.correctAnswer}`)}`;
  const optionMap = Object.fromEntries(input.options.map((option) => [option.key, option.text]));
  const correctAnswerText = optionMap[input.correctAnswer];
  const reviewSnapshot: ReviewSnapshot = {
    level: input.level,
    levelBand: input.levelBand,
    skillLabel: input.mode === "scene" ? "Scene understanding" : input.mode[0].toUpperCase() + input.mode.slice(1),
    topic: input.topicTitle,
    context: input.context,
    instruction: input.instruction,
    prompt: input.prompt,
    answerMode: "choice",
    options: optionMap,
    correctAnswer: input.correctAnswer,
    correctAnswerText,
    explanation: input.explanation,
    audioSrc: input.audioAsset?.src,
    audioText: input.audioAsset?.text,
  };
  return { ...input, id, reviewSnapshot };
}

export function buildTopicPracticeQuestions(topic: LearningTopic, words: TopicPracticeWord[]) {
  if (topic.status !== "published" || words.length !== topic.wordAssetIds.length) return [];
  const byId = new Map(words.map((word) => [word.assetId, word]));
  const ordered = topic.wordAssetIds.flatMap((assetId) => byId.get(assetId) ? [byId.get(assetId)!] : []);
  const audioWords = ordered.filter((word) => Boolean(word.audioAsset));
  if (ordered.length < 4 || topic.dialogue.length < 4) return [];
  const result: TrustedTopicPracticeQuestion[] = [];

  for (const word of ordered.slice(0, 2)) {
    const distractors = ordered.filter((candidate) => candidate.assetId !== word.assetId);
    const meaningChoices = choicesFor(word.meaning, distractors.map((candidate) => candidate.meaning), `${topic.slug}:${word.assetId}:meaning`);
    const pinyinChoices = choicesFor(word.pinyin, distractors.map((candidate) => candidate.pinyin), `${topic.slug}:${word.assetId}:pinyin`);
    if (!meaningChoices || !pinyinChoices) return [];
    result.push(question({
      topicSlug: topic.slug, topicTitle: topic.title, mode: "meaning", instruction: "Choose the word meaning",
      prompt: `What does ${word.hanzi} mean?`, ...meaningChoices,
      explanation: `${word.hanzi} (${word.pinyin}) means “${word.meaning}.”`, contentId: word.contentId,
      contentVersion: word.contentVersion, dimension: "reading", level: word.level, levelBand: word.levelBand,
    }));
    result.push(question({
      topicSlug: topic.slug, topicTitle: topic.title, mode: "pinyin", instruction: "Choose the correct pinyin",
      prompt: `Which pinyin matches ${word.hanzi}?`, ...pinyinChoices,
      explanation: `${word.hanzi} is pronounced ${word.pinyin}.`, contentId: word.contentId,
      contentVersion: word.contentVersion, dimension: "reading", level: word.level, levelBand: word.levelBand,
    }));
  }

  for (const word of audioWords.slice(0, 2)) {
    const distractors = ordered.filter((candidate) => candidate.assetId !== word.assetId);
    const arranged = choicesFor(word.meaning, distractors.map((candidate) => candidate.meaning), `${topic.slug}:${word.assetId}:listening`);
    if (!arranged || !word.audioAsset) return [];
    result.push(question({
      topicSlug: topic.slug, topicTitle: topic.title, mode: "listening", instruction: "Listen, then choose the meaning",
      prompt: "Which meaning matches the synthesized pronunciation?", audioAsset: word.audioAsset, ...arranged,
      explanation: `The recording says ${word.hanzi} (${word.pinyin}), meaning “${word.meaning}.”`, contentId: word.contentId,
      contentVersion: word.contentVersion, dimension: "audio", level: word.level, levelBand: word.levelBand,
    }));
  }

  for (const [index, turn] of topic.dialogue.slice(0, 2).entries()) {
    const arranged = choicesFor(turn.meaning, topic.dialogue.filter((_, candidateIndex) => candidateIndex !== index).map((candidate) => candidate.meaning), `${topic.slug}:scene:${index}`);
    if (!arranged) return [];
    const context = topic.dialogue.map((item) => `${item.speaker}: ${item.hanzi}`).join("\n");
    result.push(question({
      topicSlug: topic.slug, topicTitle: topic.title, mode: "scene", instruction: "Understand the scene",
      prompt: `In this dialogue, what does “${turn.hanzi}” mean?`, context, ...arranged,
      explanation: `${turn.hanzi} means “${turn.meaning}” in this exchange.`,
      contentId: `topic:${topic.slug}:scene:${index + 1}`,
      contentVersion: `${topic.sourceReleaseId}:${topic.contentVersion}`, dimension: "reading",
      level: Number(topic.levelBands[0]) || 1, levelBand: topic.levelBands.join("/"),
    }));
  }

  return result;
}

export function publicTopicPracticeQuestion(question: TrustedTopicPracticeQuestion): PublicTopicPracticeQuestion {
  const { correctAnswer: _correctAnswer, explanation: _explanation, contentId: _contentId, contentVersion: _contentVersion, dimension: _dimension, reviewSnapshot: _reviewSnapshot, audioAsset, ...safe } = question;
  void _correctAnswer; void _explanation; void _contentId; void _contentVersion; void _dimension; void _reviewSnapshot;
  return { ...safe, audioAsset: publicAudioAsset(audioAsset) };
}

export function answerTopicPracticeQuestion(state: LearningState, question: TrustedTopicPracticeQuestion, input: {
  answer: string;
  idempotencyKey: string;
  observedAt: string;
}) {
  const selected = question.options.find((option) => option.key === input.answer);
  if (!selected) throw new Error("INVALID_TOPIC_PRACTICE_ANSWER");
  const correct = question.options.find((option) => option.key === question.correctAnswer)!;
  const attempted = recordAttempt(state, {
    idempotencyKey: input.idempotencyKey,
    contentId: question.contentId,
    contentVersion: question.contentVersion,
    dimension: question.dimension,
    answer: input.answer,
    correctAnswer: question.correctAnswer,
    prompt: [question.context, question.prompt].filter(Boolean).join(" — "),
    userAnswerText: selected.text,
    correctAnswerText: correct.text,
    observedAt: input.observedAt,
    mode: "practice",
    skill: `topic-${question.mode}`,
    standardVersion: "HSK 3.0",
    sessionId: `topic:${question.topicSlug}:${question.contentVersion}`,
    questionVersion: question.contentVersion,
    reviewSnapshot: question.reviewSnapshot,
  });
  return {
    state: attempted.state,
    attempt: attempted.attempt,
    feedback: {
      correct: attempted.attempt.correct,
      correctAnswerText: correct.text,
      explanation: question.explanation,
    },
  };
}
