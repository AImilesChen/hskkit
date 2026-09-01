"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LearningTopic, TopicDifficulty } from "@/lib/topics/catalog";
import { computeTopicProgress, latestTopicVisit, nextTopicAssetId } from "@/lib/topics/progress";
import { TopicCard } from "./topic-card";

type WordProgress = { learned?: boolean };
type LearningView = {
  scope: "account" | "guest";
  topicProgress: Record<string, WordProgress>;
  topicVisits: Array<{ topicSlug: string; lastAssetId: string; visitedAt: string }>;
};
type LoadState = "loading" | "ready" | "error";

export function TopicsBrowser({ topics }: { topics: LearningTopic[] }) {
  const [level, setLevel] = useState("all");
  const [difficulty, setDifficulty] = useState<TopicDifficulty | "all">("all");
  const [duration, setDuration] = useState<"quick" | "standard" | "deep" | "all">("all");
  const [view, setView] = useState<LearningView | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/v1/learning?tzOffset=${new Date().getTimezoneOffset()}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as LearningView;
        if (!response.ok) throw new Error("Learning progress unavailable");
        setView(body);
        setLoadState("ready");
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setLoadState("error");
      });
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => topics.filter((topic) => {
    if (level !== "all" && !topic.levelBands.includes(level)) return false;
    if (difficulty !== "all" && topic.difficulty !== difficulty) return false;
    if (duration === "quick" && topic.estimatedMinutes > 12) return false;
    if (duration === "standard" && (topic.estimatedMinutes < 13 || topic.estimatedMinutes > 15)) return false;
    if (duration === "deep" && topic.estimatedMinutes < 16) return false;
    return true;
  }), [topics, level, difficulty, duration]);

  const accountReady = loadState === "ready" && view?.scope === "account";
  const lastVisit = accountReady ? latestTopicVisit(view.topicVisits) : undefined;
  const lastTopic = lastVisit ? topics.find((topic) => topic.slug === lastVisit.topicSlug) : undefined;
  const resumeAssetId = lastTopic ? nextTopicAssetId(lastTopic, view?.topicProgress, lastVisit?.lastAssetId) : undefined;

  return <section className="mt-12" aria-labelledby="all-topics-title">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Find the right lesson</p><h2 id="all-topics-title" className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Filter all topics</h2></div><p className="text-sm font-semibold text-slate-600">{filtered.length} of {topics.length} topics</p></div>

    <div className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3 sm:p-5" aria-label="Topic filters">
      <label className="grid gap-2 text-sm font-bold text-slate-800">HSK level<select className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 font-medium" value={level} onChange={(event) => setLevel(event.target.value)}><option value="all">All levels</option>{["1","2","3","4","5","6","7–9"].map((item) => <option key={item} value={item}>HSK {item}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">Difficulty<select className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 font-medium" value={difficulty} onChange={(event) => setDifficulty(event.target.value as TopicDifficulty | "all")}><option value="all">All difficulties</option><option value="starter">Starter</option><option value="developing">Developing</option><option value="stretch">Stretch</option></select></label>
      <label className="grid gap-2 text-sm font-bold text-slate-800">Study time<select className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 font-medium" value={duration} onChange={(event) => setDuration(event.target.value as typeof duration)}><option value="all">Any length</option><option value="quick">Up to 12 min</option><option value="standard">13–15 min</option><option value="deep">16+ min</option></select></label>
    </div>

    {lastTopic && resumeAssetId ? <aside className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">Continue last topic</p><h3 className="mt-1 text-xl font-black text-slate-950">{lastTopic.title} · {lastTopic.titleZh}</h3><p className="mt-1 text-sm text-slate-700">Resume the next unfinished word from your saved account state.</p></div><Link className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-5 font-bold text-white hover:bg-emerald-800" href={`/word/${encodeURIComponent(resumeAssetId)}/practice`}>Continue learning →</Link></aside> : loadState === "ready" && view?.scope === "guest" ? <aside className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5"><strong className="text-slate-950">Signed-in progress</strong><p className="mt-1 text-sm text-slate-700">Sign in to save real topic progress and continue your last topic across devices.</p><Link className="mt-3 inline-flex min-h-11 items-center font-bold text-blue-700" href="/login?next=%2Ftopics">Sign in to track topics →</Link></aside> : loadState === "error" ? <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-950" role="alert">Progress unavailable. Topic content remains available, but no completion totals are being guessed.</p> : null}

    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((topic) => <TopicCard key={topic.id} topic={topic} progress={accountReady ? computeTopicProgress(topic, view?.topicProgress) : undefined} progressState={loadState === "error" ? "error" : accountReady ? "ready" : "hidden"} />)}</div>
    {!filtered.length ? <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-7 text-center"><h3 className="font-black text-slate-950">No topics match these filters</h3><button className="mt-3 min-h-11 rounded-xl border border-slate-300 px-5 font-bold text-blue-700" type="button" onClick={() => { setLevel("all"); setDifficulty("all"); setDuration("all"); }}>Clear filters</button></div> : null}
  </section>;
}
