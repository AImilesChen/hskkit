import type { LearningState } from "../learning/domain";
import { getHsk3LevelStatuses } from "../content/level-status.ts";

export type WeakPoint = "grammar" | "reading" | "listening" | "tone" | "dictation";
export interface PlannerInputs {
  goalLevel: number;
  targetDate: string;
  weeklyMinutes: number;
  preferredDays: number[];
  weakPoints: WeakPoint[];
}
export interface PlanTask {
  id: string;
  title: string;
  minutes: number;
  source: "srs" | "weak-point" | "goal";
  href: string;
}
export interface PlanSession { day: number; minutes: number; tasks: PlanTask[]; }
export interface StudyPlan {
  id: string;
  ownerId: string;
  version: number;
  parentVersion?: number;
  createdAt: string;
  inputs: PlannerInputs;
  srsLoad: { dueCards: number; weeklyMinutes: number };
  warnings: string[];
  sessions: PlanSession[];
  status: "active" | "superseded";
}
export type PlannerResult =
  | { ok: true; plan: StudyPlan }
  | { ok: false; code: "PLAN_INFEASIBLE"; minimumWeeklyMinutes: number; suggestedTargetDate?: string; warnings: string[] };

type BuildInput = PlannerInputs & { state: LearningState; now: string; ownerId?: string; version?: number; id?: string };

const uniqueDays = (days: number[]) => [...new Set(days)].filter((day) => Number.isInteger(day) && day >= 0 && day <= 6).sort();
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
export function isStrictDateOnly(value: string) {
  const match = DATE_ONLY.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
export function plannerInputsFromJson(value: unknown): Pick<PlannerInputs, "goalLevel" | "targetDate" | "weeklyMinutes" | "preferredDays"> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  if (!Number.isInteger(raw.goalLevel) || !Number.isInteger(raw.weeklyMinutes) || typeof raw.targetDate !== "string" || !isStrictDateOnly(raw.targetDate)) return undefined;
  if (!Array.isArray(raw.preferredDays) || !raw.preferredDays.every((day) => Number.isInteger(day))) return undefined;
  return { goalLevel: raw.goalLevel as number, targetDate: raw.targetDate, weeklyMinutes: raw.weeklyMinutes as number, preferredDays: raw.preferredDays as number[] };
}
const weakHref: Record<WeakPoint, string> = {
  grammar: "/grammar/ba-sentence-basics",
  reading: "/reading/morning-study-routine",
  listening: "/listen/advanced/hsk2-syllable-discrimination",
  tone: "/listen/advanced/hsk1-tone-pairs",
  dictation: "/listen/advanced/hsk3-sentence-dictation",
};

export function weakPointsFromLearning(state: LearningState): WeakPoint[] {
  const counts = new Map<WeakPoint, number>();
  for (const mistake of state.mistakes.filter((item) => item.status === "open")) {
    const attempt = state.attempts.find((item) => item.id === mistake.sourceAttemptId);
    let point: WeakPoint = "reading";
    if (mistake.contentId.startsWith("grammar:")) point = "grammar";
    else if (mistake.contentId.includes("tone")) point = "tone";
    else if (mistake.contentId.includes("dictation")) point = "dictation";
    else if (mistake.contentId.startsWith("listening:") || attempt?.dimension !== "reading") point = "listening";
    counts.set(point, (counts.get(point) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([point]) => point);
}

export function buildPlannerDraft(input: BuildInput): PlannerResult {
  const days = uniqueDays(input.preferredDays);
  const goalLevel = input.goalLevel;
  const target = Date.parse(`${input.targetDate}T23:59:59.999Z`);
  const current = Date.parse(input.now);
  if (!Number.isInteger(goalLevel) || goalLevel < 1 || goalLevel > 9 || !isStrictDateOnly(input.targetDate) || !Number.isFinite(target) || target <= current || !Number.isInteger(input.weeklyMinutes) || input.weeklyMinutes < 15 || input.weeklyMinutes > 2100 || days.length === 0 || days.length !== input.preferredDays.length) {
    return { ok: false, code: "PLAN_INFEASIBLE", minimumWeeklyMinutes: 15, warnings: ["INVALID_OR_EMPTY_AVAILABILITY"] };
  }
  const dueCards = input.state.cards.filter((card) => Date.parse(card.dueAt) <= current).length;
  const srsMinutes = dueCards * 2;
  const weeks = Math.max(1, Math.floor((target - current) / (7 * 86_400_000)));
  const curriculumMinutes = goalLevel * 120;
  const goalPerWeek = Math.ceil(curriculumMinutes / weeks);
  const weakMinutes = Math.min(60, input.weakPoints.length * 15);
  const minimumWeeklyMinutes = srsMinutes + weakMinutes + goalPerWeek;
  const warnings: string[] = [];
  const publishedLevels = getHsk3LevelStatuses().filter((status) => status.availability === "ready").map((status) => status.level);
  const availableGoalLevel = publishedLevels.filter((level) => level <= goalLevel).at(-1);
  if (availableGoalLevel !== goalLevel) warnings.push("TARGET_LEVEL_CONTENT_GAP");
  if (srsMinutes > input.weeklyMinutes) warnings.push("SRS_LOAD_EXCEEDS_CAPACITY");
  else if (srsMinutes * 2 >= input.weeklyMinutes) warnings.push("SRS_LOAD_HIGH");
  if (minimumWeeklyMinutes > input.weeklyMinutes) {
    if (!warnings.length) warnings.push("TARGET_EXCEEDS_CAPACITY");
    const goalCapacity = input.weeklyMinutes - srsMinutes - weakMinutes;
    const suggestedWeeks = goalCapacity > 0 ? Math.ceil(curriculumMinutes / goalCapacity) : undefined;
    const suggestedTargetDate = suggestedWeeks
      ? new Date(current + suggestedWeeks * 7 * 86_400_000).toISOString().slice(0, 10)
      : undefined;
    return { ok: false, code: "PLAN_INFEASIBLE", minimumWeeklyMinutes, suggestedTargetDate, warnings };
  }

  const perDay = Math.floor(input.weeklyMinutes / days.length);
  const extraMinutes = input.weeklyMinutes % days.length;
  let srsRemaining = srsMinutes;
  let weakRemaining = weakMinutes;
  let goalRemaining = goalPerWeek;
  let taskNumber = 0;
  let sessionsCreated = 0;
  const sessions: PlanSession[] = days.map((day) => {
    let available = perDay + (sessionsCreated < extraMinutes ? 1 : 0);
    const tasks: PlanTask[] = [];
    const add = (title: string, wanted: number, source: PlanTask["source"], href: string) => {
      const minutes = Math.min(wanted, available);
      if (minutes < 1) return 0;
      taskNumber += 1;
      tasks.push({ id: `task-${taskNumber}`, title, minutes, source, href });
      available -= minutes;
      return minutes;
    };
    if (srsRemaining > 0) srsRemaining -= add("Review due SRS cards", Math.ceil(srsRemaining / Math.max(1, days.length - sessionsCreated)), "srs", "/review");
    if (weakRemaining > 0) {
      const point = input.weakPoints[taskNumber % Math.max(1, input.weakPoints.length)] ?? "reading";
      weakRemaining -= add(`Strengthen ${point}`, Math.ceil(weakRemaining / Math.max(1, days.length - sessionsCreated)), "weak-point", weakHref[point]);
    }
    if (goalRemaining > 0) {
      const level = availableGoalLevel ?? 1;
      const title = level === goalLevel
        ? `Study published HSK ${goalLevel} vocabulary`
        : `Build published HSK ${level} foundations toward HSK ${goalLevel}`;
      goalRemaining -= add(title, Math.ceil(goalRemaining / Math.max(1, days.length - sessionsCreated)), "goal", `/vocabulary/${level}`);
    }
    sessionsCreated += 1;
    return { day, minutes: tasks.reduce((sum, task) => sum + task.minutes, 0), tasks };
  });
  return {
    ok: true,
    plan: {
      id: input.id ?? crypto.randomUUID(), ownerId: input.ownerId ?? "preview", version: input.version ?? 1, createdAt: input.now,
      inputs: { goalLevel, targetDate: input.targetDate, weeklyMinutes: input.weeklyMinutes, preferredDays: days, weakPoints: [...input.weakPoints] },
      srsLoad: { dueCards, weeklyMinutes: srsMinutes }, warnings, sessions, status: "active",
    },
  };
}

export function revisePlan(plan: StudyPlan, changes: Partial<Pick<PlannerInputs, "goalLevel" | "targetDate" | "weeklyMinutes" | "preferredDays" | "weakPoints">>, at: string): StudyPlan {
  return {
    ...plan,
    id: crypto.randomUUID(),
    version: plan.version + 1,
    parentVersion: plan.version,
    createdAt: at,
    inputs: { ...plan.inputs, ...changes, preferredDays: changes.preferredDays ? uniqueDays(changes.preferredDays) : [...plan.inputs.preferredDays], weakPoints: changes.weakPoints ? [...changes.weakPoints] : [...plan.inputs.weakPoints] },
    sessions: plan.sessions.map((session) => ({ ...session, tasks: session.tasks.map((task) => ({ ...task })) })),
    status: "active",
  };
}
