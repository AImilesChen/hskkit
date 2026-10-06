"use client";

import Link from "next/link";
import { useState } from "react";
import type { GrowthSnapshot } from "@/lib/learning/growth";

export type DashboardGrowthData = GrowthSnapshot;
type RewardedDay = { localDay: string; points: number };
type ChartMode = "actions" | "accuracy";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const plural = (count: number, name: string) => count + " " + name + (count === 1 ? "" : "s");

export default function DashboardGrowth({
  growth,
  rewardedDays,
}: {
  growth: DashboardGrowthData;
  rewardedDays?: RewardedDay[];
}) {
  const [range, setRange] = useState<7 | 30>(7);
  const [mode, setMode] = useState<ChartMode>("actions");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const today = growth.calendar.days.find((day) => day.isToday)?.date;
  const selectedDay = growth.calendar.days.find((day) => day.date === selectedDate)
    ?? growth.calendar.days.find((day) => day.isToday);
  const pointsByDay = new Map((rewardedDays ?? []).map((entry): [string, number] => [entry.localDay, entry.points]));
  const selectedPoints = selectedDay ? pointsByDay.get(selectedDay.date) : undefined;
  const curve = growth.curve30.slice(-range);
  const totalActions = curve.reduce((sum, day) => sum + day.count, 0);
  const totalAnswers = curve.reduce((sum, day) => sum + day.answers.total, 0);
  const correctAnswers = curve.reduce((sum, day) => sum + day.answers.correct, 0);
  const maxActions = Math.max(1, ...curve.map((day) => day.count));
  const hasChartData = mode === "actions" ? totalActions > 0 : totalAnswers > 0;
  const chartPoints = curve.map((day, index) => ({
    day,
    x: curve.length === 1 ? 300 : 10 + index / (curve.length - 1) * 580,
    y: mode === "actions"
      ? 160 - day.count / maxActions * 135
      : day.answers.total > 0 ? 160 - day.answers.correct / day.answers.total * 135 : null,
  }));
  const forecastTotal = growth.reviewForecast.reduce((sum, day) => sum + day.count, 0);

  return <section data-dashboard-layer="3-growth" className="mt-10 space-y-6" aria-labelledby="growth-heading">
    <header>
      <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Growth data</p>
      <h2 id="growth-heading" className="mt-2 text-3xl font-black tracking-tight text-slate-950">Your learning record</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Saved activity and submitted answers use your account timezone: {growth.timezone}. Check-ins use the timezone in your learning rewards.</p>
    </header>

    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="study-calendar-heading">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id="study-calendar-heading" className="text-xl font-black text-slate-950">Study calendar</h3>
          <span className="text-sm font-bold text-slate-500">{growth.calendar.monthLabel}</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">Choose a day to see saved tasks, answers and check-in points.</p>
        <div className="mt-5 grid grid-cols-7 gap-1.5 text-center" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }} aria-label={growth.calendar.monthLabel + " study activity"}>
          {weekdays.map((day) => <span key={day} className="pb-1 text-[11px] font-bold uppercase text-slate-400">{day.slice(0, 1)}</span>)}
          {Array.from({ length: growth.calendar.firstWeekday }, (_, index) => <span key={"blank-" + index} aria-hidden="true" />)}
          {growth.calendar.days.map((day) => {
            const earned = pointsByDay.has(day.date);
            const selected = selectedDay?.date === day.date;
            const dayClasses = [
              "relative flex h-9 items-center justify-center rounded-xl border text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-default",
              earned ? "border-amber-300 bg-amber-50 text-amber-950" : day.active ? "border-emerald-300 bg-emerald-100 text-emerald-900" : day.isToday ? "border-blue-300 bg-blue-50 text-blue-900" : "border-slate-100 bg-slate-50 text-slate-500",
              selected ? "ring-2 ring-blue-600 ring-offset-1" : "",
            ].join(" ");
            return <button
              type="button"
              key={day.date}
              disabled={Boolean(today && day.date > today)}
              onClick={() => setSelectedDate(day.date)}
              title={day.date + ": " + plural(day.count, "saved learning action") + (earned ? ", check-in earned" : "")}
              style={{ height: "2.25rem" }}
              className={dayClasses}
              aria-label={day.date + ", " + plural(day.count, "saved learning action") + (earned ? ", check-in earned" : "")}
              aria-pressed={selected}
            >{day.day}{earned && <span aria-hidden="true" className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-600" />}</button>;
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-600" aria-label="Calendar legend">
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />Check-in earned</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />Saved activity</span>
        </div>
        {selectedDay && <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4" aria-live="polite">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="font-black text-slate-950">{selectedDay.date}{selectedDay.isToday ? " · Today" : ""}</h4>
            <span className="text-sm font-bold text-blue-800">{plural(selectedDay.count, "saved action")}</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
            <div className="rounded-xl bg-white p-2"><strong className="block text-lg text-slate-950">{selectedDay.activity.practice}</strong>Practice</div>
            <div className="rounded-xl bg-white p-2"><strong className="block text-lg text-slate-950">{selectedDay.activity.review}</strong>Review</div>
            <div className="rounded-xl bg-white p-2"><strong className="block text-lg text-slate-950">{selectedDay.activity.todaySteps}</strong>Today steps</div>
          </div>
          {!growth.hasCalendarActivity && <p className="mt-3 text-sm text-slate-700">No completed learning activity yet. Your first saved task will appear here.</p>}
          {Object.values(selectedDay.completedSteps).some(Boolean) && <p className="mt-3 text-sm leading-6 text-slate-700">
            Completed in Today: {[
              selectedDay.completedSteps.review && plural(selectedDay.completedSteps.review, "review"),
              selectedDay.completedSteps.learn && plural(selectedDay.completedSteps.learn, "new word"),
              selectedDay.completedSteps.listen && plural(selectedDay.completedSteps.listen, "listening task"),
              selectedDay.completedSteps.practice && plural(selectedDay.completedSteps.practice, "practice task"),
            ].filter(Boolean).join(" · ")}.
          </p>}
          {selectedDay.learnedTitles.length > 0 && <p className="mt-2 text-sm leading-6 text-slate-700">Words studied: {selectedDay.learnedTitles.join(" · ")}</p>}
          <p className="mt-2 text-sm leading-6 text-slate-700">Submitted answers: {selectedDay.answers.total ? selectedDay.answers.correct + " correct out of " + selectedDay.answers.total : "none recorded"}</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">Learning points: {rewardedDays === undefined ? "history unavailable" : selectedPoints === undefined ? "no qualifying check-in recorded" : "+" + selectedPoints + " earned"}</p>
          {selectedDay.isToday && <Link href="/today" className="mt-3 inline-flex min-h-11 items-center font-bold text-blue-700 underline-offset-4 hover:underline">Continue today’s plan →</Link>}
        </div>}
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="learning-curve-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h3 id="learning-curve-heading" className="text-xl font-black text-slate-950">Learning curve</h3><p className="mt-1 text-sm text-slate-600">{mode === "actions" ? "Saved learning actions per day" : "Correct answers divided by submitted answers"}</p></div>
          <div className="inline-flex rounded-xl bg-slate-100 p-1" aria-label="Learning curve range">
            {([7, 30] as const).map((days) => <button key={days} type="button" aria-pressed={range === days} onClick={() => setRange(days)} className={["min-h-10 rounded-lg px-3 text-sm font-bold", range === days ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"].join(" ")}>{days} days</button>)}
          </div>
        </div>
        <div className="mt-4 inline-flex rounded-xl border border-slate-200 p-1" aria-label="Learning curve metric">
          <button type="button" aria-pressed={mode === "actions"} onClick={() => setMode("actions")} className={["min-h-10 rounded-lg px-3 text-sm font-bold", mode === "actions" ? "bg-blue-600 text-white" : "text-slate-600"].join(" ")}>Activity</button>
          <button type="button" aria-pressed={mode === "accuracy"} onClick={() => setMode("accuracy")} className={["min-h-10 rounded-lg px-3 text-sm font-bold", mode === "accuracy" ? "bg-blue-600 text-white" : "text-slate-600"].join(" ")}>Answer accuracy</button>
        </div>
        {hasChartData ? <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-slate-700">{mode === "actions"
            ? plural(totalActions, "saved action") + " in " + range + " days · busiest day: " + maxActions
            : Math.round(correctAnswers / totalAnswers * 100) + "% correct across " + plural(totalAnswers, "submitted answer") + " in " + range + " days"}</p>
          <svg className="h-48 w-full overflow-visible" viewBox="0 0 600 180" role="img" aria-label={range + "-day " + (mode === "actions" ? "saved activity" : "answer accuracy") + " trend"} preserveAspectRatio="none">
            {[25, 92.5, 160].map((y) => <line key={y} x1="10" y1={y} x2="590" y2={y} stroke="#e2e8f0" strokeWidth="1" />)}
            {mode === "actions"
              ? <polyline points={chartPoints.map((point) => point.x + "," + point.y).join(" ")} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              : chartPoints.slice(1).map((point, index) => {
                const previous = chartPoints[index];
                return point.y !== null && previous.y !== null
                  ? <line key={point.day.date} x1={previous.x} y1={previous.y} x2={point.x} y2={point.y} stroke="#0f766e" strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  : null;
              })}
            {chartPoints.map((point) => point.y === null ? null : <circle key={point.day.date} cx={point.x} cy={point.y} r="5" fill="#fff" stroke={mode === "actions" ? "#2563eb" : "#0f766e"} strokeWidth="3"><title>{point.day.date + ": " + (mode === "actions" ? plural(point.day.count, "action") : point.day.answers.correct + "/" + point.day.answers.total + " correct")}</title></circle>)}
          </svg>
          <div className="mt-1 flex justify-between text-xs font-semibold text-slate-500"><span>{curve[0]?.label}</span><span>{curve.at(-1)?.label}</span></div>
          {mode === "accuracy" && <p className="mt-3 text-xs leading-5 text-slate-600">Days without submitted answers have no data point. Self-rated reviews are excluded; this is answer accuracy, not a measured forgetting curve.</p>}
        </div> : <div className="mt-6 flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><div><p className="font-bold text-slate-900">{mode === "actions" ? "No completed learning activity yet" : "No submitted answers in this range"}</p><p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">{mode === "actions" ? "The curve starts after a real learning action is saved." : "Answer accuracy appears after you submit a practice answer."}</p></div></div>}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="font-black text-slate-950">Scheduled review load</h4>
            <span className="text-sm font-semibold text-slate-600">{forecastTotal} cards across 7 days</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-600">Today includes overdue cards and cards due later today. Available reviews above counts only cards due right now. Completing a review can change future totals.</p>
          <div className="mt-3 grid grid-cols-7 gap-1.5" aria-label="Scheduled reviews for the next seven days">
            {growth.reviewForecast.map((day, index) => <div key={day.date} className="rounded-xl bg-slate-50 p-1.5 text-center">
              <span className="block text-[11px] font-semibold text-slate-500">{index === 0 ? "Today" : day.label}</span>
              <strong className="mt-1 block text-base text-slate-950">{day.count}</strong>
            </div>)}
          </div>
          <Link href="/review" className="mt-3 inline-flex min-h-11 items-center font-bold text-blue-700 underline-offset-4 hover:underline">View review queue →</Link>
        </div>
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
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={row.label + " vocabulary progress"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={row.percent}><span className="block h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" style={{ width: row.percent + "%" }} /></div>
        </div>)}
      </div>
    </article>
  </section>;
}
