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
  signals?: { placementLevel?: number; weakPoints: WeakPoint[]; dueCards: number };
  adjustmentReasons?: Array<{ code: "PLACEMENT_BASELINE" | "PRACTICE_WEAKNESS" | "SRS_LOAD" | "USER_AVAILABILITY"; message: string }>;
}
export type PlannerResult =
  | { ok: true; plan: StudyPlan }
  | { ok: false; code: "PLAN_INFEASIBLE"; minimumWeeklyMinutes: number; suggestedTargetDate?: string; warnings: string[] };

type BuildInput = PlannerInputs & { state: LearningState; now: string; ownerId?: string; version?: number; id?: string; placementLevel?: number };

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
    if (attempt?.mode === "practice" && attempt.skill === "grammar") point = "grammar";
    else if (attempt?.mode === "practice" && attempt.skill === "listening") point = "listening";
    else if (mistake.contentId.startsWith("grammar:")) point = "grammar";
    else if (mistake.contentId.includes("tone")) point = "tone";
    else if (mistake.contentId.includes("dictation")) point = "dictation";
    else if (mistake.contentId.startsWith("listening:") || attempt?.dimension !== "reading") point = "listening";
    counts.set(point, (counts.get(point) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([point]) => point);
}

export function plannerSignalsFromLearning(state: LearningState, now: string) {
  const latestPlacement = [...(state.placementResults ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return {
    placementLevel: latestPlacement?.recommendedLevel,
    weakPoints: weakPointsFromLearning(state),
    dueCards: state.cards.filter((card) => Date.parse(card.dueAt) <= Date.parse(now)).length,
  };
}

export interface PlannerCapacityInput {
  goalLevel: number;
  targetDate: string;
  weeklyMinutes: number;
  preferredDays: number[];
  placementLevel?: number;
  dueCards: number;
  weakPointCount: number;
  now: string;
}

export interface PlannerCapacityEstimate {
  status: "invalid" | "infeasible" | "tight" | "feasible";
  weeks: number;
  minutesPerStudyDay: number;
  minimumWeeklyMinutes: number;
  suggestedTargetDate?: string;
  allocation: { srs: number; weakPoints: number; goal: number; open: number };
}

export function estimatePlannerCapacity(input: PlannerCapacityInput): PlannerCapacityEstimate {
  const days = uniqueDays(input.preferredDays);
  const target = Date.parse(`${input.targetDate}T23:59:59.999Z`);
  const current = Date.parse(input.now);
  const valid = Number.isInteger(input.goalLevel) && input.goalLevel >= 1 && input.goalLevel <= 9
    && isStrictDateOnly(input.targetDate) && Number.isFinite(target) && target > current
    && Number.isInteger(input.weeklyMinutes) && input.weeklyMinutes >= 15 && input.weeklyMinutes <= 2100
    && days.length > 0 && days.length === input.preferredDays.length;
  if (!valid) return { status: "invalid", weeks: 0, minutesPerStudyDay: 0, minimumWeeklyMinutes: 15, allocation: { srs: 0, weakPoints: 0, goal: 0, open: Math.max(0, input.weeklyMinutes || 0) } };
  const weeks = Math.max(1, Math.floor((target - current) / (7 * 86_400_000)));
  const baseline = Number.isInteger(input.placementLevel) ? Math.max(1, Math.min(9, input.placementLevel!)) : undefined;
  const remainingLevels = baseline === undefined ? input.goalLevel : Math.max(0, input.goalLevel - baseline);
  const curriculumMinutes = baseline === undefined ? input.goalLevel * 120 : Math.max(60, remainingLevels * 120);
  const srs = Math.max(0, input.dueCards) * 2;
  const weakPoints = Math.min(60, Math.max(0, input.weakPointCount) * 15);
  const goal = Math.ceil(curriculumMinutes / weeks);
  const minimumWeeklyMinutes = srs + weakPoints + goal;
  const goalCapacity = input.weeklyMinutes - srs - weakPoints;
  const suggestedWeeks = goalCapacity > 0 ? Math.ceil(curriculumMinutes / goalCapacity) : undefined;
  const suggestedTargetDate = suggestedWeeks ? new Date(current + suggestedWeeks * 7 * 86_400_000).toISOString().slice(0, 10) : undefined;
  const usedSrs = Math.min(input.weeklyMinutes, srs);
  const usedWeak = Math.min(Math.max(0, input.weeklyMinutes - usedSrs), weakPoints);
  const usedGoal = Math.min(Math.max(0, input.weeklyMinutes - usedSrs - usedWeak), goal);
  const open = Math.max(0, input.weeklyMinutes - usedSrs - usedWeak - usedGoal);
  const status = minimumWeeklyMinutes > input.weeklyMinutes
    ? "infeasible"
    : minimumWeeklyMinutes * 1.1 >= input.weeklyMinutes || srs * 2 >= input.weeklyMinutes
      ? "tight"
      : "feasible";
  return {
    status,
    weeks,
    minutesPerStudyDay: Math.floor(input.weeklyMinutes / days.length),
    minimumWeeklyMinutes,
    suggestedTargetDate,
    allocation: { srs: usedSrs, weakPoints: usedWeak, goal: usedGoal, open },
  };
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
  const placementBaseline = Number.isInteger(input.placementLevel)
    ? Math.max(1, Math.min(9, input.placementLevel!))
    : undefined;
  const remainingLevels = placementBaseline === undefined ? goalLevel : Math.max(0, goalLevel - placementBaseline);
  const curriculumMinutes = placementBaseline === undefined ? goalLevel * 120 : Math.max(60, remainingLevels * 120);
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
  const adjustmentReasons: NonNullable<StudyPlan["adjustmentReasons"]> = [
    { code: "USER_AVAILABILITY", message: `Scheduled within ${input.weeklyMinutes} available minutes across ${days.length} days.` },
  ];
  if (placementBaseline) adjustmentReasons.push({ code: "PLACEMENT_BASELINE", message: placementBaseline >= goalLevel
    ? `Placement recommended HSK ${placementBaseline}; the plan reserves maintenance work at the HSK ${goalLevel} goal.`
    : `Placement recommended HSK ${placementBaseline}; the plan allocates work across ${remainingLevels} remaining level${remainingLevels === 1 ? "" : "s"} toward HSK ${goalLevel}.` });
  if (input.weakPoints.length) adjustmentReasons.push({ code: "PRACTICE_WEAKNESS", message: `Reserved time for unresolved ${input.weakPoints.join(", ")} weaknesses.` });
  if (dueCards) adjustmentReasons.push({ code: "SRS_LOAD", message: `Reserved ${srsMinutes} minutes for ${dueCards} due SRS cards.` });
  return {
    ok: true,
    plan: {
      id: input.id ?? crypto.randomUUID(), ownerId: input.ownerId ?? "preview", version: input.version ?? 1, createdAt: input.now,
      inputs: { goalLevel, targetDate: input.targetDate, weeklyMinutes: input.weeklyMinutes, preferredDays: days, weakPoints: [...input.weakPoints] },
      srsLoad: { dueCards, weeklyMinutes: srsMinutes }, warnings, sessions, status: "active",
      signals: { placementLevel: placementBaseline, weakPoints: [...input.weakPoints], dueCards },
      adjustmentReasons,
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
