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
  unlockedBadges: Array<{ days: number; key: string; label: string; earnedOn: string }>;
  nextBadge: { days: number; remainingDays: number; key: string; label: string } | null;
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

  const earnedDays = new Set(rewards.unlockedBadges.map((badge) => badge.days));
  const target = rewards.nextBadge?.days ?? 90;
  const streakProgress = Math.min(target, rewards.currentStreak);

  return <section data-dashboard-layer="2b-rewards" className="mt-10" aria-labelledby="learning-rewards-heading">
    <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-5 shadow-sm sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-indigo-700">Learning rewards</p>
          <h2 id="learning-rewards-heading" className="mt-2 text-2xl font-black tracking-tight text-slate-950">Build your badge streak</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">A qualifying day needs 15 active foreground minutes and one completed task. Earn badges for consecutive qualifying days; missed days do not erase badges already earned.</p>
        </div>
        <div className="rounded-2xl bg-indigo-700 px-4 py-3 text-white"><span className="block text-xs font-bold uppercase tracking-wide text-indigo-200">Badges earned</span><strong className="mt-1 block text-3xl font-black tabular-nums">{rewards.unlockedBadges.length}<span className="text-base font-semibold text-indigo-200"> / 6</span></strong></div>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-white bg-white/90 p-4"><p className="text-sm font-bold text-slate-500">Today: {minutes(rewards.activeSeconds)} / 15 min</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Today active learning minutes" aria-valuemin={0} aria-valuemax={15} aria-valuenow={minutes(rewards.activeSeconds)}><span className="block h-full rounded-full bg-indigo-600" style={{ width: `${Math.min(100, rewards.activeSeconds / 9)}%` }} /></div><p className="mt-3 text-sm leading-5 text-slate-700">{todayMessage}</p></article>
        <article className="rounded-2xl border border-white bg-white/90 p-4"><p className="text-sm font-bold text-slate-500">Qualified-day streak</p><strong className="mt-2 block text-3xl font-black text-slate-950">{rewards.currentStreak} day{rewards.currentStreak === 1 ? "" : "s"}</strong><p className="mt-1 text-sm text-slate-600">Best: {rewards.longestStreak} day{rewards.longestStreak === 1 ? "" : "s"} · 15 active minutes and a task</p></article>
        <article className="rounded-2xl border border-white bg-white/90 p-4"><p className="text-sm font-bold text-slate-500">This month</p><strong className="mt-2 block text-3xl font-black text-slate-950">{rewards.monthLearningDays} day{rewards.monthLearningDays === 1 ? "" : "s"}</strong><p className="mt-1 text-sm text-slate-600">{rewards.monthPoints} learning points · next day +{rewards.nextAward}</p></article>
        <article className="rounded-2xl border border-white bg-white/90 p-4"><p className="text-sm font-bold text-slate-500">Next badge</p><strong className="mt-2 block text-2xl font-black text-slate-950">{rewards.nextBadge ? rewards.nextBadge.label : "90-day set complete"}</strong><p className="mt-1 text-sm text-slate-600">{rewards.nextBadge ? `${rewards.nextBadge.remainingDays} consecutive qualifying day${rewards.nextBadge.remainingDays === 1 ? "" : "s"} to go` : "All six streak badges earned"}</p></article>
      </div>

      <section className="mt-6 border-t border-indigo-100 pt-5" aria-labelledby="badge-wall-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="badge-wall-title" className="text-xl font-black text-slate-950">Badge wall</h3>
            <p className="mt-1 text-sm text-slate-600">Keep your streak going to unlock the next milestone. Your earned badges stay visible after a break.</p>
          </div>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-900">{rewards.unlockedBadges.length} of 6 earned</span>
        </div>
        <div className="mt-4 rounded-2xl border border-indigo-200 bg-white/90 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <strong className="text-slate-950">{rewards.nextBadge ? `Next: ${rewards.nextBadge.label}` : "All badge milestones complete"}</strong>
            <span className="font-bold tabular-nums text-indigo-700">{streakProgress} / {target} consecutive days</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-indigo-100" role="progressbar" aria-label="Progress to next streak badge" aria-valuemin={0} aria-valuemax={target} aria-valuenow={streakProgress}>
            <span className="block h-full rounded-full bg-indigo-600" style={{ width: `${Math.round(streakProgress / target * 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-600">{rewards.nextBadge ? `${rewards.nextBadge.remainingDays} more qualifying day${rewards.nextBadge.remainingDays === 1 ? "" : "s"} in a row to unlock it.` : "You have earned every current streak badge."}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[3, 7, 14, 30, 60, 90].map((days) => {
            const badge = rewards.unlockedBadges.find((item) => item.days === days);
            const unlocked = earnedDays.has(days);
            return <div key={days} className={`min-h-32 rounded-2xl border p-3 text-center ${unlocked ? "border-amber-300 bg-gradient-to-b from-amber-50 to-white text-amber-950 shadow-sm" : "border-slate-200 bg-white/70 text-slate-500"}`} aria-label={`${days}-day streak badge, ${unlocked ? `earned on ${badge?.earnedOn ?? "a qualifying day"}` : "not yet earned"}`}>
              <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${unlocked ? "bg-amber-200 text-amber-900" : "bg-slate-100 text-slate-400"}`} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8"><path d="m8 3 4 7 4-7h4l-5 9m-6 0L4 3h4m4 8a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" /><path d="m12 13 1 2 2 .3-1.5 1.5.3 2.2L12 18l-1.8 1 .3-2.2L9 15.3l2-.3 1-2Z" /></svg>
              </div>
              <strong className="mt-2 block text-lg font-black tabular-nums">{days} days</strong>
              <span className="mt-1 block text-xs font-semibold">{badge ? `Earned ${badge.earnedOn}` : "Keep going"}</span>
            </div>;
          })}
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-600">Learning points record your study activity ({rewards.lifetimePoints} earned in total). They are not exchanged for AI credits. Badges are awarded for qualifying-day streaks.</p>
      </section>
    </div>
  </section>;
}
