"use client";

export type LearningRewardData = {
  today: string;
  timezone: string;
  todayQualified: boolean;
  todayAwarded: boolean;
  todayAward: number;
  activeSeconds: number;
  remainingSeconds: number;
  qualifyingTasks: number;
  needsTask: boolean;
  monthLearningDays: number;
  nextMonthLearningDay: number;
  nextAward: number;
  monthPoints: number;
  lifetimePoints: number;
  currentStreak: number;
  longestStreak: number;
  unlockedBadges: Array<{ days: number; key: string; label: string }>;
  nextBadge: { days: number; remainingDays: number; key: string; label: string } | null;
  exchangeRate: { learningPoints: number; aiCredits: number; available: false };
};

const minutes = (seconds: number) => Math.min(15, Math.floor(seconds / 60));

export default function DashboardRewards({ rewards }: { rewards: LearningRewardData }) {
  const todayMessage = rewards.todayAwarded
    ? `Earned ${rewards.todayAward} learning points today.`
    : rewards.activeSeconds < 900
      ? `${Math.ceil(rewards.remainingSeconds / 60)} active minute${Math.ceil(rewards.remainingSeconds / 60) === 1 ? "" : "s"} left, plus one completed task.`
      : rewards.needsTask
        ? "Complete one real learning task to earn today’s points."
        : `Today qualifies for ${rewards.todayAward} learning points.`;

  return <section data-dashboard-layer="2b-rewards" className="mt-10" aria-labelledby="learning-rewards-heading">
    <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-5 shadow-sm sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-indigo-700">Learning rewards</p>
          <h2 id="learning-rewards-heading" className="mt-2 text-2xl font-black tracking-tight text-slate-950">Keep the month moving</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">A day counts after 15 active foreground minutes and one completed learning task. Missing a day does not reset this month’s reward tier.</p>
        </div>
        <div className="rounded-2xl bg-indigo-700 px-4 py-3 text-white"><span className="block text-xs font-bold uppercase tracking-wide text-indigo-200">Learning points</span><strong className="mt-1 block text-3xl font-black tabular-nums">{rewards.lifetimePoints}</strong></div>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-white bg-white/90 p-4"><p className="text-sm font-bold text-slate-500">Today: {minutes(rewards.activeSeconds)} / 15 min</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Today active learning minutes" aria-valuemin={0} aria-valuemax={15} aria-valuenow={minutes(rewards.activeSeconds)}><span className="block h-full rounded-full bg-indigo-600" style={{ width: `${Math.min(100, rewards.activeSeconds / 9)}%` }} /></div><p className="mt-3 text-sm leading-5 text-slate-700">{todayMessage}</p></article>
        <article className="rounded-2xl border border-white bg-white/90 p-4"><p className="text-sm font-bold text-slate-500">Qualified-day streak</p><strong className="mt-2 block text-3xl font-black text-slate-950">{rewards.currentStreak} day{rewards.currentStreak === 1 ? "" : "s"}</strong><p className="mt-1 text-sm text-slate-600">Best: {rewards.longestStreak} day{rewards.longestStreak === 1 ? "" : "s"} · 15 active minutes and a task</p></article>
        <article className="rounded-2xl border border-white bg-white/90 p-4"><p className="text-sm font-bold text-slate-500">This month</p><strong className="mt-2 block text-3xl font-black text-slate-950">{rewards.monthLearningDays} day{rewards.monthLearningDays === 1 ? "" : "s"}</strong><p className="mt-1 text-sm text-slate-600">{rewards.monthPoints} points earned · next day +{rewards.nextAward}</p></article>
        <article className="rounded-2xl border border-white bg-white/90 p-4"><p className="text-sm font-bold text-slate-500">Next badge</p><strong className="mt-2 block text-2xl font-black text-slate-950">{rewards.nextBadge ? rewards.nextBadge.label : "90-day set complete"}</strong><p className="mt-1 text-sm text-slate-600">{rewards.nextBadge ? `${rewards.nextBadge.remainingDays} effective day${rewards.nextBadge.remainingDays === 1 ? "" : "s"} to go` : "All launch milestones unlocked"}</p></article>
      </div>

      <details className="mt-6 border-t border-indigo-100 pt-5">
        <summary className="cursor-pointer text-lg font-black text-slate-950">Badge wall · view milestones</summary>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[3, 7, 14, 30, 60, 90].map((days) => {
            const unlocked = rewards.unlockedBadges.some((badge) => badge.days === days);
            return <div key={days} className={`rounded-xl border px-2 py-3 text-center ${unlocked ? "border-amber-300 bg-amber-50 text-amber-950" : "border-slate-200 bg-white/70 text-slate-400"}`} aria-label={`${days}-day badge ${unlocked ? "unlocked" : "locked"}`}><span className="block text-lg font-black">{days}</span><span className="text-xs font-bold">days</span></div>;
          })}
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">10 learning points = 1 AI credit. Conversion is not open yet; learning points stay separate from subscription AI credits.</p>
      </details>
    </div>
  </section>;
}
