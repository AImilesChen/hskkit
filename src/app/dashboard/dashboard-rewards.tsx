"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type LearningRewardData = {
  today: string;
  timezone: string;
  todayAward: number;
  todayAwarded: boolean;
  activeSeconds: number;
  remainingSeconds: number;
  nextTierPoints: number | null;
  nextTierSeconds: number | null;
  monthLearningDays: number;
  monthPoints: number;
  weekMinutes: number;
  weekPoints: number;
  lifetimePoints: number;
  redeemedPoints: number;
  availablePoints: number;
  redeemableCredits: number;
  currentStreak: number;
  longestStreak: number;
  unlockedBadges: Array<{ days: number; key: string; label: string }>;
  nextBadge: { days: number; remainingDays: number; key: string; label: string } | null;
  exchangeRate: { learningPoints: 10; aiCredits: 1; available: boolean };
  activityDays: Array<{ localDay: string; activeSeconds: number; points: number }>;
  redemptionHistory: Array<{ id: string; pointsSpent: number; creditsGranted: number; createdAt: string }>;
};

type IconProps = { className?: string };
export function RewardIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 3l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.8L6.8 19l1-5.8-4.2-4.1 5.8-.8L12 3z" /></svg>;
}
export function LockIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></svg>;
}

const minutes = (seconds: number) => Math.min(60, Math.floor(seconds / 60));
const badgeLadder = [
  { days: 3, name: "First rhythm" },
  { days: 7, name: "One-week streak" },
  { days: 14, name: "Two-week streak" },
  { days: 30, name: "Monthly habit" },
  { days: 60, name: "60-day momentum" },
  { days: 90, name: "90-day consistency" },
] as const;

export default function DashboardRewards({ rewards, primaryHref, onRewardsChange }: {
  rewards: LearningRewardData;
  primaryHref: string;
  onRewardsChange: (next: LearningRewardData) => void;
}) {
  const [credits, setCredits] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => setCredits((value) => Math.max(1, Math.min(value, Math.max(1, rewards.redeemableCredits)))), [rewards.redeemableCredits]);

  const remainingMinutes = Math.ceil(rewards.remainingSeconds / 60);
  const todayMessage = rewards.nextTierPoints === null
    ? "Daily maximum reached: 10 learning points."
    : `${remainingMinutes} more active minute${remainingMinutes === 1 ? "" : "s"} to reach ${rewards.nextTierPoints} point${rewards.nextTierPoints === 1 ? "" : "s"} today.`;

  async function redeem() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/account/learning-rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeem", credits, idempotencyKey: crypto.randomUUID() }),
      });
      const payload = await response.json() as LearningRewardData & { error?: string };
      if (!response.ok) throw new Error(payload.error || "REDEMPTION_FAILED");
      onRewardsChange(payload);
      window.dispatchEvent(new CustomEvent("hskkit:learning-reward", { detail: payload }));
      setMessage(`Exchange complete. ${credits} AI credit${credits === 1 ? "" : "s"} added.`);
      setConfirming(false);
    } catch (error) {
      setMessage(error instanceof Error && error.message === "INSUFFICIENT_LEARNING_POINTS" ? "Your available learning points changed. Refresh and try again." : "Exchange could not be completed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return <section data-dashboard-layer="2b-rewards" className="mt-10" aria-labelledby="learning-rewards-heading">
    <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-5 shadow-sm sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-indigo-700"><RewardIcon />Learning rewards</p>
          <h2 id="learning-rewards-heading" className="mt-2 text-2xl font-black tracking-tight text-slate-950">Today’s online learning</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Active time on learning pages earns cumulative daily points automatically. Background and idle time do not count.</p>
        </div>
        <div className="rounded-2xl bg-indigo-700 px-4 py-3 text-white"><span className="block text-xs font-bold uppercase tracking-wide text-indigo-200">Available learning points</span><strong className="mt-1 block text-3xl font-black tabular-nums">{rewards.availablePoints}</strong></div>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <article className="rounded-2xl border border-white bg-white/90 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2"><p className="font-black text-slate-950">Today: {minutes(rewards.activeSeconds)} / 60 minutes</p><strong className="text-indigo-700">{rewards.todayAward} / 10 points</strong></div>
          <div className="relative mt-5 h-3 rounded-full bg-slate-100" role="progressbar" aria-label="Today active learning minutes" aria-valuemin={0} aria-valuemax={60} aria-valuenow={minutes(rewards.activeSeconds)}>
            <span className="block h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" style={{ width: `${Math.min(100, rewards.activeSeconds / 36)}%` }} />
            {[10, 30, 60].map((minute) => <span key={minute} className="absolute top-1/2 h-4 w-1 -translate-y-1/2 bg-white" style={{ left: `${minute / 60 * 100}%` }} aria-hidden="true" />)}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-bold text-slate-600"><span>10 min · 1 point</span><span className="text-center">30 min · 5 points</span><span className="text-right">60 min · 10 points</span></div>
          <p className="mt-4 text-sm leading-6 text-slate-700">{todayMessage}</p>
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <h3 className="font-black text-slate-950">How points work</h3>
            <ul className="mt-2 space-y-1.5 leading-5">
              <li>10 active minutes earns 1 point; 30 minutes earns 5 points total; 60 minutes earns 10 points total.</li>
              <li>Daily tiers are cumulative, not added together. Up to 10 points per day.</li>
              <li>Only active time on learning pages counts; background, locked or idle time pauses automatically.</li>
              <li>Your total and next target update as soon as each threshold is saved.</li>
            </ul>
          </div>
          <Link href={primaryHref} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 font-black text-white hover:bg-blue-700">Continue learning</Link>
        </article>

        <article className="rounded-2xl border border-white bg-white/90 p-5">
          <h3 className="font-black text-slate-950">Redeem AI credits</h3>
          <p className="mt-2 text-sm text-slate-600">10 learning points = 1 AI credit.</p>
          <strong className="mt-4 block text-3xl font-black text-slate-950">{rewards.redeemableCredits}</strong>
          <span className="text-sm text-slate-500">AI credit{rewards.redeemableCredits === 1 ? "" : "s"} available to exchange</span>
          {rewards.redeemableCredits > 1 && <label className="mt-4 block text-sm font-bold text-slate-700">Credits to exchange<select value={credits} onChange={(event) => setCredits(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3">{Array.from({ length: rewards.redeemableCredits }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} credit{index ? "s" : ""} · {(index + 1) * 10} points</option>)}</select></label>}
          <button type="button" disabled={!rewards.exchangeRate.available || busy} onClick={() => setConfirming(true)} className="mt-4 min-h-11 w-full rounded-xl bg-indigo-700 px-4 font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300">{rewards.exchangeRate.available ? "Exchange points" : `Need ${10 - rewards.availablePoints} more points`}</button>
        </article>
      </div>

      {message && <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-800" role="status">{message}</p>}

      <div className="mt-6 grid gap-5 border-t border-indigo-100 pt-5 lg:grid-cols-2">
        <article>
          <h3 className="text-lg font-black text-slate-950">This month</h3>
          <p className="mt-2 text-sm text-slate-600">{rewards.monthLearningDays} learning day{rewards.monthLearningDays === 1 ? "" : "s"} · {rewards.monthPoints} points</p>
          <p className="mt-1 text-sm text-slate-600">Current streak: {rewards.currentStreak} days · Best: {rewards.longestStreak} days</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {badgeLadder.map(({ days, name }) => {
              const unlocked = rewards.unlockedBadges.some((badge) => badge.days === days);
              return <div key={days} className={`rounded-xl border px-2 py-3 text-center ${unlocked ? "border-amber-300 bg-amber-50 text-amber-950" : "border-slate-200 bg-white/70 text-slate-400"}`} title={unlocked ? `${name} unlocked` : `Locked: reach ${days} consecutive learning days`}><span className="flex justify-center">{unlocked ? <RewardIcon /> : <LockIcon />}</span><strong className="mt-1 block text-sm">{name}</strong><span className="mt-1 block text-[11px] font-bold">{days} consecutive learning days</span></div>;
            })}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">Badges unlock from your real consecutive learning-day record.</p>
        </article>
        <article>
          <h3 className="text-lg font-black text-slate-950">Redemption history</h3>
          {rewards.redemptionHistory.length ? <ul className="mt-3 space-y-2">{rewards.redemptionHistory.slice(0, 4).map((entry) => <li key={entry.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm"><span>{new Date(entry.createdAt).toLocaleDateString()}</span><strong>{entry.pointsSpent} points → {entry.creditsGranted} AI credit{entry.creditsGranted === 1 ? "" : "s"}</strong></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No exchanges yet.</p>}
        </article>
      </div>
    </div>

    {confirming && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="exchange-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h3 id="exchange-title" className="text-xl font-black text-slate-950">Confirm exchange</h3><p className="mt-3 text-slate-600">Exchange {credits * 10} learning points for {credits} AI credit{credits === 1 ? "" : "s"}? This cannot be reversed.</p><div className="mt-6 flex gap-3"><button type="button" disabled={busy} onClick={() => setConfirming(false)} className="min-h-11 flex-1 rounded-xl border border-slate-300 font-bold text-slate-700">Cancel</button><button type="button" disabled={busy} onClick={() => void redeem()} className="min-h-11 flex-1 rounded-xl bg-indigo-700 font-black text-white disabled:bg-slate-400">{busy ? "Exchanging…" : "Confirm exchange"}</button></div></div>
    </div>}
  </section>;
}
