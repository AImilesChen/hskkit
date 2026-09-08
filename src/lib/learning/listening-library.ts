import bankJson from "./listening-library.json" with { type: "json" };
import { publicAudioAsset, publishedListeningAudioAsset } from "../audio/assets.ts";
import type { AdvancedListeningLesson, ListeningTrainingType, Step7ContentKind, Step7Exercise } from "./step7-content.ts";

export type ListeningLibrarySize = 10 | 20;
export interface ListeningLibraryQuestion extends AdvancedListeningLesson {
  id: string;
  sourceRef: string;
  sourceLicense: string;
  authorizationStatus: "authorized";
  qaStatus: "approved";
  lifecycleStatus: "published";
  weaknessTag: string;
  explanation: string;
}
export interface ListeningLibrarySession {
  id: string;
  level: number;
  size: ListeningLibrarySize;
  seed: string;
  questions: ListeningLibraryQuestion[];
}

type RawQuestion = {
  kind: string;
  prompt: string;
  options: Record<string, string>;
  correctAnswer: string;
  explanation: string;
  weaknessTag: string;
};
type RawGroup = {
  id: string;
  level: number;
  levelBand: string;
  title: string;
  trainingType: ListeningTrainingType;
  register: "everyday" | "formal";
  voiceText: string;
  audioSrc: string;
  sourceRef: string;
  sourceLicense: string;
  authorizationStatus: "authorized";
  qaStatus: "approved";
  lifecycleStatus: "published";
  questions: RawQuestion[];
};
const bank = bankJson as { version: string; label: string; coverageNotice: string; groups: RawGroup[] };

const QUESTIONS: ListeningLibraryQuestion[] = bank.groups.flatMap((group) => group.questions.map((raw, questionIndex) => {
  const number = questionIndex + 1;
  const slug = `${group.id}-q${number}`;
  const id = `${bank.version.replace(/^hskkit-/, "")}-${group.id}-q${number}`;
  const asset = publishedListeningAudioAsset(group.id);
  if (!asset) throw new Error(`LISTENING_AUDIO_ASSET_UNAVAILABLE:${group.id}`);
  const exerciseKind: Step7ContentKind = raw.kind === "tone" ? "tone" : "discrimination";
  const exercise: Step7Exercise = {
    id,
    contentId: `listening:${slug}`,
    contentVersion: `${bank.version}:${group.id}:q${number}`,
    kind: exerciseKind,
    prompt: raw.prompt,
    options: raw.options,
    correctAnswer: raw.correctAnswer,
    explanation: raw.explanation,
  };
  return {
    id,
    slug,
    level: group.level,
    levelBand: group.levelBand,
    contentVersion: exercise.contentVersion,
    title: group.level === 1 ? `HSK 1 single-syllable tone recognition · Set ${group.id.slice(-3)}` : `${group.title} · Question ${number}`,
    kind: exerciseKind,
    trainingType: group.trainingType,
    register: group.register,
    voiceText: group.voiceText,
    audioSrc: asset.src,
    audioAsset: publicAudioAsset(asset),
    instruction: group.level <= 2 ? "Play the synthesized listening audio, then identify the sound or short message you hear." : "Play the synthesized listening audio, then answer from the recording's details and context.",
    guidance: "Playback must complete before an answer can be saved. Audio failure never changes mastery or usage.",
    exercise,
    sourceRef: group.sourceRef,
    sourceLicense: group.sourceLicense,
    authorizationStatus: group.authorizationStatus,
    qaStatus: group.qaStatus,
    lifecycleStatus: group.lifecycleStatus,
    weaknessTag: raw.weaknessTag,
    explanation: raw.explanation,
  };
}));

export const LISTENING_LIBRARY_LABEL = bank.label;
export const LISTENING_LIBRARY_COVERAGE_NOTICE = bank.coverageNotice;
export const LISTENING_LIBRARY_QUESTIONS = QUESTIONS;
export const LISTENING_LIBRARY_COUNTS = {
  audioGroups: bank.groups.length,
  questions: QUESTIONS.length,
  byLevel: Array.from({ length: 9 }, (_, index) => {
    const level = index + 1;
    return {
      level,
      audioGroups: bank.groups.filter((group) => group.level === level).length,
      questions: QUESTIONS.filter((question) => question.level === level).length,
    };
  }),
};

export function listeningQuestionsForLevel(level: number) {
  return QUESTIONS.filter((question) => question.level === level);
}
export function listeningQuestionBySlug(slug: string) {
  return QUESTIONS.find((question) => question.slug === slug);
}
function seedNumber(seed: string) {
  let value = 2166136261;
  for (const character of seed) value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return value >>> 0;
}
export function listeningSession(level: number, size: ListeningLibrarySize, seed: string): ListeningLibrarySession {
  const source = listeningQuestionsForLevel(level);
  if (!source.length) throw new Error("LISTENING_LEVEL_NOT_FOUND");
  const start = seedNumber(`${level}:${seed}`) % source.length;
  const stride = source.length % 2 === 0 ? 7 : 8;
  const questions: ListeningLibraryQuestion[] = [];
  const used = new Set<string>();
  for (let cursor = 0; questions.length < size && cursor < source.length * 3; cursor += 1) {
    const question = source[(start + cursor * stride) % source.length];
    if (!used.has(question.id)) { used.add(question.id); questions.push(question); }
  }
  if (questions.length !== size) throw new Error("LISTENING_SESSION_UNDERSIZED");
  return { id: `${bank.version}:hsk${level}:${size}:${seed}`, level, size, seed, questions };
}
export function listeningSessionNext(session: ListeningLibrarySession, index: number) {
  return session.questions[index + 1];
}
