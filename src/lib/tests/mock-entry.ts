export function parseMockLevel(value: unknown): number | undefined {
  return typeof value === "string" && /^[1-6]$/.test(value) ? Number(value) : undefined;
}

type Attempt = { band: string; questions: readonly { level: number }[] };
export function mockAttemptLevel(attempt: Attempt): number | undefined {
  const level = attempt.questions[0]?.level;
  return Number.isInteger(level) && level >= 1 && level <= 7 && attempt.questions.every(question => question.level === level) ? level : undefined;
}

export function mockAttemptMatches(attempt: Attempt, band: string, level: number): boolean {
  return attempt.band === band && mockAttemptLevel(attempt) === (band === "advanced" ? 7 : level);
}

export const mockAttemptStorageKey = (band: string, level: number) => band === "basic" ? `hskkit_mock_basic_level_${level}` : "hskkit_mock_advanced";
export const mockPreparationHref = (level: number) => level === 7 ? "/mock/advanced" : `/mock/basic?level=${level}`;
