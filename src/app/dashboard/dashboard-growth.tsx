"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type IconProps = { className?: string };
export function TrendIcon({ className = "h-5 w-5" }: IconProps) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 17l6-6 4 4 8-9" /><path d="M15 6h6v6" /></svg>; }
export function BookIcon({ className = "h-5 w-5" }: IconProps) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 5a3 3 0 013-3h5v18H7a3 3 0 00-3 2V5zM20 5a3 3 0 00-3-3h-5v18h5a3 3 0 013 2V5z" /></svg>; }
export function HeadphonesIcon({ className = "h-5 w-5" }: IconProps) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 14v-2a8 8 0 0116 0v2" /><rect x="3" y="14" width="4" height="7" rx="2" /><rect x="17" y="14" width="4" height="7" rx="2" /></svg>; }
export function TargetIcon({ className = "h-5 w-5" }: IconProps) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></svg>; }

export type GrowthDayData = {
  date: string;
  day?: number;
  label?: string;
  completedTasks: number;
  newWords: number;
  reviewCount: number;
  reviewAccuracy: number | null;
  activeSeconds: number;
  minutes: number;
  points: number;
  active: boolean;
  isToday?: boolean;
  isFuture?: boolean;
};

type ComparisonValue = { current: number | null; previous: number | null; changePercent: number | null };
type CurveMetric = "minutes" | "tasks" | "newWords" | "accuracy";
export type DashboardGrowthData = {
  timezone: string;
  calendar: { monthLabel: string; firstWeekday: number; days: GrowthDayData[] };
  curve30: GrowthDayData[];
  comparisons: Record<7 | 30, Record<CurveMetric, ComparisonValue>>;
  skillOverview: Array<{ key: "listening" | "speaking" | "reading" | "writing"; label: string; attempts: number; correct: number; accuracy: number | null }>;
  weekSummary: { learningDays: number; minutes: number; points: number; newWords: number; completedTasks: number };
  levelProgress: Array<{ level: number; label: string; total: number; learned: number; percent: number }>;
  totalActions30: number;
  totalTrackedWords: number;
  hasActivity: boolean;
  hasCalendarActivity: boolean;
  hasLevelProgress: boolean;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const metricLabels: Record<CurveMetric, string> = { minutes: "Learning time", tasks: "Completed tasks", newWords: "New vocabulary", accuracy: "Review accuracy" };
const rangeOptions = [{ days: 7 as const, label: "7 days" }, { days: 30 as const, label: "30 days" }];
const valueFor = (day: GrowthDayData, metric: CurveMetric) => metric === "minutes" ? day.minutes : metric === "tasks" ? day.completedTasks : metric === "newWords" ? day.newWords : day.reviewAccuracy ?? 0;
const valueLabel = (day: GrowthDayData, metric: CurveMetric) => metric === "minutes" ? `${day.minutes} min` : metric === "accuracy" ? (day.reviewAccuracy === null ? "No review data" : `${day.reviewAccuracy}%`) : String(valueFor(day, metric));
const calendarTone = (day: GrowthDayData) => day.minutes >= 60 ? "border-blue-800 bg-blue-700 text-white" : day.minutes >= 30 ? "border-blue-600 bg-blue-500 text-white" : day.minutes >= 10 ? "border-blue-400 bg-blue-300 text-blue-950" : day.minutes > 0 ? "border-blue-200 bg-blue-100 text-blue-950" : day.active ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-100 bg-slate-50 text-slate-500";

function comparisonLabel(comparison: ComparisonValue, range: 7 | 30, metric: CurveMetric) {
  if (comparison.previous === null || comparison.changePercent === null) return `Compared with previous ${range} days: no earlier ${metricLabels[metric].toLowerCase()} data`;
  const sign = comparison.changePercent > 0 ? "+" : "";
  return `Compared with previous ${range} days: ${sign}${comparison.changePercent}%`;
}

export default function DashboardGrowth({ growth, primaryHref }: { growth: DashboardGrowthData; primaryHref: string }) {
  const [range, setRange] = useState<7 | 30>(7);
  const [metric, setMetric] = useState<CurveMetric>("minutes");
  const [selectedDate, setSelectedDate] = useState(growth.calendar.days.find((day) => day.isToday)?.date ?? growth.calendar.days.findLast((day) => !day.isFuture)?.date ?? "");
  const [selectedCurveDate, setSelectedCurveDate] = useState(growth.curve30.at(-1)?.date ?? "");
  const selectedDay = growth.calendar.days.find((day) => day.date === selectedDate);
  const curve = growth.curve30.slice(-range);
  const selectedCurveDay = curve.find((day) => day.date === selectedCurveDate) ?? curve.at(-1);
  const maxValue = Math.max(1, ...curve.map((day) => valueFor(day, metric)));
  const chartPoints = useMemo(() => curve.map((day, index) => ({
    day,
    x: curve.length === 1 ? 300 : index / (curve.length - 1) * 580 + 10,
    y: 160 - valueFor(day, metric) / maxValue * 135,
  })), [curve, maxValue, metric]);
  const points = chartPoints.map(({ x, y }) => `${x},${y}`).join(" ");
  const comparison = growth.comparisons[range][metric];

  return <section data-dashboard-layer="3-growth" className="mt-10 space-y-6" aria-labelledby="growth-heading">
    <header>
      <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-blue-700"><TrendIcon />Growth data</p>
      <h2 id="growth-heading" className="mt-2 text-3xl font-black tracking-tight text-slate-950">Your real learning growth</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Effective learning minutes and saved actions, grouped in {growth.timezone}.</p>
    </header>

    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="study-calendar-heading">
        <div className="flex items-baseline justify-between gap-3"><h3 id="study-calendar-heading" className="text-xl font-black text-slate-950">Daily learning calendar</h3><span className="text-sm font-bold text-slate-500">{growth.calendar.monthLabel}</span></div>
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-[11px] font-bold text-slate-600" aria-label="Calendar learning-time legend">
          {[{ label: "Under 10 min", tone: "bg-blue-100" }, { label: "10–29 min", tone: "bg-blue-300" }, { label: "30–59 min", tone: "bg-blue-500" }, { label: "60 min", tone: "bg-blue-700" }].map((item) => <span key={item.label} className="inline-flex items-center gap-1.5"><span className={`h-3 w-3 rounded ${item.tone}`} />{item.label}</span>)}
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5 text-center" aria-label={`${growth.calendar.monthLabel} learning activity`}>
          {weekdays.map((day) => <span key={day} className="pb-1 text-[11px] font-bold uppercase text-slate-400">{day.slice(0, 1)}</span>)}
          {Array.from({ length: growth.calendar.firstWeekday }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
          {growth.calendar.days.map((day) => <button key={day.date} type="button" disabled={day.isFuture} onClick={() => setSelectedDate(day.date)} title={day.isFuture ? "Future date" : `${day.date}: ${day.minutes} min, ${day.points} points`} className={`flex h-10 items-center justify-center rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${day.isFuture ? "cursor-not-allowed border-transparent bg-slate-50 text-slate-300" : calendarTone(day)} ${selectedDate === day.date ? "ring-2 ring-indigo-700 ring-offset-2" : ""}`} aria-pressed={selectedDate === day.date}>{day.day}</button>)}
        </div>
        {selectedDay && !selectedDay.isFuture && <div className="mt-5 rounded-2xl bg-slate-50 p-4" aria-live="polite">
          <p className="font-black text-slate-900">{selectedDay.isToday ? "Today" : selectedDay.date}</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Effective time</dt><dd className="font-bold">{selectedDay.minutes} min</dd></div><div><dt className="text-slate-500">Learning points</dt><dd className="font-bold">{selectedDay.points}</dd></div><div><dt className="text-slate-500">Completed tasks</dt><dd className="font-bold">{selectedDay.completedTasks}</dd></div><div><dt className="text-slate-500">New vocabulary</dt><dd className="font-bold">{selectedDay.newWords}</dd></div><div><dt className="text-slate-500">Review accuracy</dt><dd className="font-bold">{selectedDay.reviewAccuracy === null ? "No review data" : `${selectedDay.reviewAccuracy}%`}</dd></div></dl>
          {selectedDay.isToday && <Link href={primaryHref} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-4 font-black text-white">Start today’s learning</Link>}
        </div>}
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="learning-curve-heading">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 id="learning-curve-heading" className="text-xl font-black text-slate-950">Learning curve</h3><p className="mt-1 text-sm text-slate-600">Effective learning minutes by default</p></div><div className="inline-flex rounded-xl bg-slate-100 p-1" aria-label="Learning curve range">{rangeOptions.map((option) => <button key={option.days} type="button" aria-pressed={range === option.days} onClick={() => setRange(option.days)} className={`min-h-10 rounded-lg px-3 text-sm font-bold ${range === option.days ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>{option.label}</button>)}</div></div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Learning curve metric">{(Object.keys(metricLabels) as CurveMetric[]).map((option) => <button key={option} type="button" aria-pressed={metric === option} onClick={() => setMetric(option)} className={`min-h-10 rounded-xl border px-2 text-sm font-bold ${metric === option ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-600"}`}>{metricLabels[option]}</button>)}</div>
        {curve.some((day) => valueFor(day, metric) > 0) ? <div className="mt-5">
          <p className="mb-2 text-xs font-semibold text-slate-500">Click or focus a point for daily details.</p>
          <svg className="h-48 w-full overflow-visible" viewBox="0 0 600 180" role="img" aria-label={`${range}-day ${metricLabels[metric]} curve`} preserveAspectRatio="none"><line x1="10" y1="160" x2="590" y2="160" stroke="#cbd5e1" strokeWidth="1" /><polyline points={points} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />{chartPoints.map(({ day, x, y }) => <circle key={day.date} cx={x} cy={y} r={selectedCurveDay?.date === day.date ? "7" : "5"} fill="#fff" stroke={selectedCurveDay?.date === day.date ? "#4338ca" : "#2563eb"} strokeWidth="3" tabIndex={0} role="button" aria-label={`${day.date}: ${valueLabel(day, metric)}`} aria-pressed={selectedCurveDay?.date === day.date} onMouseEnter={() => setSelectedCurveDate(day.date)} onFocus={() => setSelectedCurveDate(day.date)} onClick={() => setSelectedCurveDate(day.date)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedCurveDate(day.date); }}><title>{day.date}: {valueLabel(day, metric)}</title></circle>)}</svg>
          <div className="mt-1 flex justify-between text-xs font-semibold text-slate-500"><span>{curve[0]?.label}</span><span>{curve.at(-1)?.label}</span></div>
          {selectedCurveDay && <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm" aria-live="polite"><div><dt className="text-slate-500">Selected day</dt><dd className="font-black text-slate-900">{selectedCurveDay.date}</dd></div><div><dt className="text-slate-500">{metricLabels[metric]}</dt><dd className="font-black text-slate-900">{valueLabel(selectedCurveDay, metric)}</dd></div><div><dt className="text-slate-500">Learning points</dt><dd className="font-bold">{selectedCurveDay.points}</dd></div><div><dt className="text-slate-500">Completed tasks</dt><dd className="font-bold">{selectedCurveDay.completedTasks}</dd></div></dl>}
        </div> : <div className="mt-6 flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><div><p className="font-bold text-slate-900">No {metricLabels[metric].toLowerCase()} yet</p><p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">Start a real learning session and this curve will update from saved activity.</p><Link href={primaryHref} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-4 font-black text-white">Start today’s learning</Link></div></div>}
        <p className="mt-4 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-950">{comparisonLabel(comparison, range, metric)}</p>
        <p className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-950">This week: {growth.weekSummary.learningDays} learning days · {growth.weekSummary.minutes} minutes · {growth.weekSummary.points} points</p>
      </article>
    </div>

    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="skill-evidence-heading">
      <h3 id="skill-evidence-heading" className="flex items-center gap-2 text-xl font-black text-slate-950"><TargetIcon />Skill evidence</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">Listening, Speaking, Reading and Writing accuracy from saved attempts in the last 30 days. Missing skills stay unscored.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{growth.skillOverview.map((skill) => <div key={skill.key} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-2"><strong className="text-slate-950">{skill.label}</strong><span className="text-sm font-black text-blue-700">{skill.accuracy === null ? "—" : `${skill.accuracy}%`}</span></div>{skill.accuracy === null ? <p className="mt-3 text-sm text-slate-500">No saved attempts yet</p> : <><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${skill.label} accuracy`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={skill.accuracy}><span className="block h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" style={{ width: `${skill.accuracy}%` }} /></div><p className="mt-2 text-xs text-slate-500">{skill.correct} correct from {skill.attempts} saved attempt{skill.attempts === 1 ? "" : "s"}</p></>}</div>)}</div>
    </article>

    <article data-dashboard-layer="4-level-progress" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="hsk-progress-heading">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 id="hsk-progress-heading" className="flex items-center gap-2 text-xl font-black text-slate-950"><BookIcon />HSK 1–9 vocabulary progress</h3><p className="mt-1 text-sm leading-6 text-slate-600">Vocabulary learned and stored in saved learning records. HSK 7–9 uses the unified advanced band.</p></div><strong className="text-sm text-slate-700">{growth.totalTrackedWords} learned word{growth.totalTrackedWords === 1 ? "" : "s"}</strong></div>
      {!growth.hasLevelProgress && <div className="mt-5 rounded-2xl bg-slate-50 p-4"><p className="font-bold text-slate-900">No learned vocabulary saved yet</p><p className="mt-1 text-sm leading-6 text-slate-600">Words appear only after a real learning record is saved.</p></div>}
      <div className="mt-5 grid gap-x-8 gap-y-4 md:grid-cols-2">{growth.levelProgress.map((row) => <div key={row.level}><div className="flex items-center justify-between gap-3 text-sm"><span className="font-bold text-slate-900">{row.label}</span><span className="tabular-nums text-slate-600">{row.learned.toLocaleString()} / {row.total.toLocaleString()}</span></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${row.label} vocabulary progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={row.percent}><span className="block h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" style={{ width: `${row.percent}%` }} /></div></div>)}</div>
    </article>
  </section>;
}
