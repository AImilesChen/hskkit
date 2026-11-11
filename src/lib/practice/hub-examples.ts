import { PRACTICE_SKILLS, practiceQuestionSet, type PracticeSkill } from "./questions.ts";

export type PracticeHubExample = {
  id: string;
  prompt: string;
  excerpt: string;
  answer: string;
  explanation: string;
  audioSrc?: string;
};
export type PracticeHubExamples = Record<number, Record<PracticeSkill, PracticeHubExample>>;

// Called by the static server page. Only these previews cross the client boundary.
// The question bank, history and answer-selection code stay on the server.
export function practiceHubExamples(): PracticeHubExamples {
  return Object.fromEntries(Array.from({ length: 7 }, (_, index) => {
    const level = index + 1;
    return [level, Object.fromEntries(PRACTICE_SKILLS.map((skill) => {
      const question = practiceQuestionSet(level, skill)[0];
      if (!question) throw new Error(`Missing published practice preview: ${level}/${skill}`);
      return [skill, {
        id: question.id,
        prompt: question.prompt,
        excerpt: question.context ?? question.audioText ?? question.options[question.correctAnswer],
        answer: question.options[question.correctAnswer],
        explanation: question.explanation,
        ...(question.audioSrc ? { audioSrc: question.audioSrc } : {}),
      }];
    }))];
  })) as PracticeHubExamples;
}
