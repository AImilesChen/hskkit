"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { dashboardPrimaryAction } from "@/lib/learning/dashboard";

type DashboardItem = {
  kind: "review" | "learn" | "listen" | "practice" | "summary";
  status: "pending" | "completed" | "skipped";
};

type DashboardData = {
  session: { items: DashboardItem[] };
  cards: Array<{ dueAt: string }>;
  capabilities: { tier: "free" | "pro"; dailyNewItems: number | null };
  usage: { dailyNewItems: number };
  streak: { current: number; longest: number; lastLearningDay: string | null };
  currentLevel: number;
  dueCount: number;
  scope: "guest" | "account";
};

const timezoneOffset = () => new Date().getTimezoneOffset();
const levelLabel = (level: number) => level >= 7 ? "HSK 7–9" : `HSK ${level}`;

export default function DashboardCore() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const response = await fetch(`/api/v1/learning?tzOffset=${timezoneOffset()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("DASHBOARD_UNAVAILABLE");
      const payload = await response.json() as DashboardData;
      if (payload.scope !== "account") throw new Error("ACCOUNT_REQUIRED");
      setData(payload);
    } catch {
      setError("We couldn’t load your current learning data. Try again.");
    }
  }

  useEffect(() => { void load(); }, []);

  if (!data) {
    return <main className="mx-auto min-h-[70vh] max-w-6xl px-5 py-12 sm:py-16">
      {error
        ? <div className="rounded-2xl border border-red-200 bg-red-50 p-6" role="alert"><h1 className="text-2xl font-black text-slate-950">Dashboard unavailable</h1><p className="mt-2 text-slate-700">{error}</p><button className="mt-5 min-h-12 rounded-xl bg-blue-600 px-6 font-bold text-white" onClick={() => void load()}>Retry</button></div>
        : <div className="rounded-2xl border border-slate-200 bg-white p-6" role="status"><h1 className="text-2xl font-black text-slate-950">Loading today’s learning…</h1><p className="mt-2 text-slate-600">Checking your real review queue and progress.</p></div>}
    </main>;
  }

  const dueReviews = data.dueCount;
  const currentLevel = Math.min(9, Math.max(1, Math.trunc(data.currentLevel) || 1));
  const taskItems = data.session.items.filter((item) => item.kind !== "summary" && item.status !== "skipped");
  const completedTasks = taskItems.filter((item) => item.status === "completed").length;
  const pendingTasks = taskItems.filter((item) => item.status === "pending").length;
  const reviewTasks = taskItems.filter((item) => item.kind === "review" && item.status === "pending").length;
  const learningTasks = taskItems.filter((item) => item.kind === "learn" && item.status === "pending").length;
  const practiceTasks = taskItems.filter((item) => ["listen", "practice"].includes(item.kind) && item.status === "pending").length;
  const primary = dashboardPrimaryAction({ dueReviews, currentLevel, items: data.session.items });
  const dailyNewLimit = data.capabilities.dailyNewItems;
  const newWordPercent = dailyNewLimit === null ? 0 : Math.min(100, Math.round(data.usage.dailyNewItems / Math.max(1, dailyNewLimit) * 100));
  const taskPercent = taskItems.length ? Math.round(completedTasks / taskItems.length * 100) : 0;

  return <main className="mx-auto min-h-[70vh] max-w-6xl px-5 py-10 sm:py-14">
    <header className="max-w-3xl">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Learning dashboard</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Today’s learning</h1>
      <p className="mt-3 text-base leading-7 text-slate-600">One clear next step, based on your saved level and real learning progress.</p>
    </header>

    <section className="mt-8 overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl shadow-slate-200" aria-labelledby="today-focus-title">
      <div className="grid gap-7 p-6 sm:p-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-300">Today’s focus</p>
          <h2 id="today-focus-title" className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">{primary.label}</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-300">{pendingTasks > 0 ? `${pendingTasks} task item${pendingTasks === 1 ? "" : "s"} remain in today’s queue.` : dueReviews > 0 ? `${dueReviews} memory item${dueReviews === 1 ? " is" : "s are"} ready to review.` : `Your next new-word session is ready at ${levelLabel(currentLevel)}.`}</p>
          <Link className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-500 px-6 font-black text-white transition hover:bg-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-300/40" href={primary.href}>{primary.label}<span className="ml-2" aria-hidden="true">→</span></Link>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between text-sm"><span className="font-bold text-slate-300">Today’s task progress</span><strong>{completedTasks}/{taskItems.length}</strong></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Today’s task progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={taskPercent}><span className="block h-full rounded-full bg-blue-400" style={{ width: `${taskPercent}%` }} /></div>
          <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div><dt className="text-xs text-slate-400">Review</dt><dd className="mt-1 text-xl font-black">{reviewTasks}</dd></div>
            <div><dt className="text-xs text-slate-400">New words</dt><dd className="mt-1 text-xl font-black">{learningTasks}</dd></div>
            <div><dt className="text-xs text-slate-400">Practice</dt><dd className="mt-1 text-xl font-black">{practiceTasks}</dd></div>
          </dl>
        </div>
      </div>
    </section>

    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Current learning signals">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">Due reviews</p><strong className="mt-2 block text-3xl font-black text-slate-950">{dueReviews}</strong><p className="mt-1 text-sm text-slate-600">Ready in your review queue</p></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">Current level</p><strong className="mt-2 block text-3xl font-black text-slate-950">{levelLabel(currentLevel)}</strong><p className="mt-1 text-sm text-slate-600">Saved learning starting point</p></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">New words today</p><strong className="mt-2 block text-3xl font-black text-slate-950">{dailyNewLimit === null ? data.usage.dailyNewItems : `${data.usage.dailyNewItems}/${dailyNewLimit}`}</strong><p className="mt-1 text-sm text-slate-600">{dailyNewLimit === null ? "No daily Pro limit" : `${Math.max(0, dailyNewLimit - data.usage.dailyNewItems)} Free items remaining`}</p>{dailyNewLimit !== null && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="New words used today" aria-valuemin={0} aria-valuemax={100} aria-valuenow={newWordPercent}><span className="block h-full rounded-full bg-emerald-500" style={{ width: `${newWordPercent}%` }} /></div>}</article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">Learning streak</p><strong className="mt-2 block text-3xl font-black text-slate-950">{data.streak.current} day{data.streak.current === 1 ? "" : "s"}</strong><p className="mt-1 text-sm text-slate-600">Best: {data.streak.longest} day{data.streak.longest === 1 ? "" : "s"}</p></article>
    </section>
  </main>;
}
