"use client";

import { useState } from "react";

export type DashboardGrowthData = {
  timezone: string;
  calendar: {
    monthLabel: string;
    firstWeekday: number;
    days: Array<{ date: string; day: number; count: number; active: boolean; isToday: boolean }>;
  };
  curve30: Array<{ date: string; label: string; count: number }>;
  levelProgress: Array<{ level: number; label: string; total: number; learned: number; percent: number }>;
  totalActions30: number;
  totalTrackedWords: number;
  hasActivity: boolean;
  hasCalendarActivity: boolean;
  hasLevelProgress: boolean;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DashboardGrowth({ growth }: { growth: DashboardGrowthData }) {
  const [range, setRange] = useState<7 | 30>(7);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const curve = growth.curve30.slice(-range);
  const maxCount = Math.max(1, ...curve.map((day) => day.count));
  const rangeTotal = curve.reduce((sum, day) => sum + day.count, 0);
  const today = growth.calendar.days.find((day) => day.isToday)?.date;
  const selectedDay = growth.calendar.days.find((day) => day.date === selectedDate) ?? growth.calendar.days.find((day) => day.isToday);
  const points = curve.map((day, index) => {
    const x = curve.length === 1 ? 300 : index / (curve.length - 1) * 580 + 10;
    const y = 160 - day.count / maxCount * 135;
    return `${x},${y}`;
  }).join(" ");

  return <section data-dashboard-layer="3-growth" className="mt-10 space-y-6" aria-labelledby="growth-heading">
    <header>
      <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Growth data</p>
      <h2 id="growth-heading" className="mt-2 text-3xl font-black tracking-tight text-slate-950">Your real learning growth</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Completed learning actions are grouped by your account timezone: {growth.timezone}.</p>
    </header>

    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="study-calendar-heading">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id="study-calendar-heading" className="text-xl font-black text-slate-950">Study calendar</h3>
          <span className="text-sm font-bold text-slate-500">{growth.calendar.monthLabel}</span>
        </div>
        <div className="mt-5 grid grid-cols-7 gap-1.5 text-center" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }} aria-label={`${growth.calendar.monthLabel} study activity`}>
          {weekdays.map((day) => <span key={day} className="pb-1 text-[11px] font-bold uppercase text-slate-400">{day.slice(0, 1)}</span>)}
          {Array.from({ length: growth.calendar.firstWeekday }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
          {growth.calendar.days.map((day) => <button type="button" key={day.date} disabled={Boolean(today && day.date > today)} onClick={() => setSelectedDate(day.date)} title={`${day.date}: ${day.count} completed learning action${day.count === 1 ? "" : "s"}`} className={`flex h-9 items-center justify-center rounded-xl border text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-default ${day.active ? "border-emerald-300 bg-emerald-100 text-emerald-900" : day.isToday ? "border-blue-300 bg-blue-50 text-blue-900" : "border-slate-100 bg-slate-50 text-slate-500"}`} aria-label={`${day.date}, ${day.count} completed learning action${day.count === 1 ? "" : "s"}`} aria-pressed={selectedDay?.date === day.date}>{day.day}</button>)}
        </div>
        {selectedDay && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-950" role="status"><strong>{selectedDay.date}</strong> · {selectedDay.count} completed learning action{selectedDay.count === 1 ? "" : "s"}{selectedDay.isToday ? " so far today" : ""}</p>}
        {!growth.hasCalendarActivity && <div className="mt-5 rounded-2xl bg-slate-50 p-4"><p className="font-bold text-slate-900">No completed learning activity yet</p><p className="mt-1 text-sm leading-6 text-slate-600">Finish a lesson, practice item, or review and your first check-in will appear here.</p></div>}
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="learning-curve-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 id="learning-curve-heading" className="text-xl font-black text-slate-950">Learning curve</h3><p className="mt-1 text-sm text-slate-600">Completed actions per day</p></div>
          <div className="inline-flex rounded-xl bg-slate-100 p-1" aria-label="Learning curve range">
            {([7, 30] as const).map((days) => <button key={days} type="button" aria-pressed={range === days} onClick={() => setRange(days)} className={`min-h-10 rounded-lg px-3 text-sm font-bold ${range === days ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>{days} days</button>)}
          </div>
        </div>
        {growth.hasActivity ? <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-slate-700">{rangeTotal} completed actions in {range} days · busiest day: {maxCount}</p>
          <svg className="h-48 w-full overflow-visible" viewBox="0 0 600 180" role="img" aria-label={`${range}-day learning curve`} preserveAspectRatio="none">
            <line x1="10" y1="160" x2="590" y2="160" stroke="#cbd5e1" strokeWidth="1" />
            <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            {curve.map((day, index) => {
              const [x, y] = points.split(" ")[index].split(",");
              return <circle key={day.date} cx={x} cy={y} r="5" fill="#fff" stroke="#2563eb" strokeWidth="3"><title>{day.date}: {day.count} actions</title></circle>;
            })}
          </svg>
          <div className="mt-1 flex justify-between text-xs font-semibold text-slate-500"><span>{curve[0]?.label}</span><span>{curve.at(-1)?.label}</span></div>
        </div> : <div className="mt-6 flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><div><p className="font-bold text-slate-900">No completed learning activity yet</p><p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">The curve starts only after a real learning action is saved.</p></div></div>}
      </article>
    </div>

    <article data-dashboard-layer="4-level-progress" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="hsk-progress-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h3 id="hsk-progress-heading" className="text-xl font-black text-slate-950">HSK 1–9 progress</h3><p className="mt-1 text-sm leading-6 text-slate-600">Unique words with a saved learning record. HSK 7–9 uses the published unified advanced band.</p></div>
        <strong className="text-sm text-slate-700">{growth.totalTrackedWords} tracked word{growth.totalTrackedWords === 1 ? "" : "s"}</strong>
      </div>
      {!growth.hasLevelProgress && <div className="mt-5 rounded-2xl bg-slate-50 p-4"><p className="font-bold text-slate-900">No tracked vocabulary yet</p><p className="mt-1 text-sm leading-6 text-slate-600">Words appear here only after they are added to your saved learning record.</p></div>}
      <div className="mt-5 grid gap-x-8 gap-y-4 md:grid-cols-2">
        {growth.levelProgress.map((row) => <div key={row.level}>
          <div className="flex items-center justify-between gap-3 text-sm"><span className="font-bold text-slate-900">{row.label}</span><span className="tabular-nums text-slate-600">{row.learned.toLocaleString()} / {row.total.toLocaleString()}</span></div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${row.label} vocabulary progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={row.percent}><span className="block h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" style={{ width: `${row.percent}%` }} /></div>
        </div>)}
      </div>
    </article>
  </section>;
}
