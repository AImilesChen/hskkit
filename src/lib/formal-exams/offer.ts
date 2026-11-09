// Presentation-only catalogue. Never import answer banks into client components.
export const MOCK_FORMS = ["a", "b", "c"] as const;
export const MOCK_LEVELS = [
  { level: 1, questions: 40, timedMinutes: 35 },
  { level: 2, questions: 60, timedMinutes: 55 },
  { level: 3, questions: 70, timedMinutes: 78 },
  { level: 4, questions: 70, timedMinutes: 80 },
  { level: 5, questions: 72, timedMinutes: 105 },
  { level: 6, questions: 82, timedMinutes: 120 },
] as const;
export const MOCK_LEVEL_RANGE = `HSK ${MOCK_LEVELS[0].level}–${MOCK_LEVELS.at(-1)!.level}`;
export const FREE_MOCK_COUNT = MOCK_LEVELS.length;
export const TOTAL_MOCK_COUNT = MOCK_LEVELS.length * MOCK_FORMS.length;
export const EXTRA_MOCK_COUNT = TOTAL_MOCK_COUNT - FREE_MOCK_COUNT;
export const MOCK_HUB_HREF = "/hsk-test-prep#full-length-exams";
export function mockPaperHref(level: number, form?: string) {
  if (!MOCK_LEVELS.some(row => row.level === level)) throw new Error("INVALID_MOCK_LEVEL");
  if (form !== undefined && !MOCK_FORMS.some(value => value === form)) throw new Error("INVALID_MOCK_FORM");
  return `/hsk-test-prep/hsk-${level}/mock${form ? `/${form}` : ""}`;
}
export type MockAccess = { tier: "free" | "pro"; source?: string; endsAt?: string | null };
export function mockAccessState(input: { authenticated: boolean; available: boolean; access?: MockAccess; subscriptionEndsAt?: string | null }, now = Date.now()) {
  if (!input.available) return "unavailable";
  if (!input.authenticated) return "anonymous";
  if (!input.access || !["free", "pro"].includes(input.access.tier)) return "unavailable";
  const end = input.access?.endsAt;
  if (end && !Number.isFinite(Date.parse(end))) return "unavailable";
  if (input.access?.tier === "pro" && (!end || Date.parse(end) > now)) return input.access.source === "trial" ? "trial" : "pro";
  const expiredAt = end || input.subscriptionEndsAt;
  return expiredAt && Date.parse(expiredAt) <= now ? "expired" : "free";
}
