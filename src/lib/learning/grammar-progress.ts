import type { LearningState } from "./domain.ts";
import { GRAMMAR_CURRICULUM } from "./step7-content.ts";

export type GrammarProgress = Record<string, { practiced: number; total: number; correct: number; openMistakes: number; due: number }>;

export function grammarProgressSnapshot(state: Pick<LearningState, "attempts" | "mistakes" | "cards">, now = new Date().toISOString()): GrammarProgress {
  return Object.fromEntries(GRAMMAR_CURRICULUM.map((lesson) => {
    const keys = new Set(lesson.exercises.map((item) => `${item.contentId}\u0000${item.contentVersion}`));
    const attempts = state.attempts.filter((item) => keys.has(`${item.contentId}\u0000${item.contentVersion}`));
    const mistakes = state.mistakes.filter((item) => item.status === "open" && keys.has(`${item.contentId}\u0000${item.contentVersion}`));
    const due = state.cards.filter((item) => keys.has(`${item.contentId}\u0000${item.contentVersion}`) && item.dueAt <= now);
    return [lesson.slug, {
      practiced: new Set(attempts.map((item) => item.contentId)).size,
      total: lesson.exercises.length,
      correct: new Set(attempts.filter((item) => item.correct).map((item) => item.contentId)).size,
      openMistakes: mistakes.length,
      due: due.length,
    }];
  }));
}
