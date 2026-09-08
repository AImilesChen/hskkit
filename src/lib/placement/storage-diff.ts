import type { PlacementAnswer } from "../learning/domain";

export function diffPlacementAnswers(before: PlacementAnswer[], after: PlacementAnswer[]) {
  const afterQuestionIds = new Set(after.map((answer) => answer.questionId));
  const removedQuestionIds = before
    .filter((answer) => !afterQuestionIds.has(answer.questionId))
    .map((answer) => answer.questionId);
  const priorByQuestion = new Map(before.map((answer) => [answer.questionId, JSON.stringify(answer)]));
  const changedAnswers = after.filter((answer) => priorByQuestion.get(answer.questionId) !== JSON.stringify(answer));
  return { removedQuestionIds, changedAnswers };
}
