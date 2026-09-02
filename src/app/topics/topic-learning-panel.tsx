"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LearningTopic } from "@/lib/topics/catalog";
import { computeTopicProgress, nextTopicAssetId } from "@/lib/topics/progress";

type WordProgress = { learned?: boolean; today?: string; review?: string };
type LearningView = {
  scope: "account" | "guest";
  session: { id: string };
  topicProgress: Record<string, WordProgress>;
  topicVisits: Array<{ topicSlug: string; lastAssetId: string; visitedAt: string }>;
  queueBinding: string;
  revision: number;
  error?: string;
};

export function TopicLearningPanel({ topic }: { topic: LearningTopic }) {
  const [view, setView] = useState<LearningView | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/v1/learning?tzOffset=${new Date().getTimezoneOffset()}`, { cache: "no-store", signal: controller.signal });
        const body = await response.json() as LearningView;
        if (!response.ok) throw new Error(body.error || "Progress unavailable");
        if (body.scope !== "account") {
          setView(body);
          setState("ready");
          return;
        }
        const previous = body.topicVisits.find((visit) => visit.topicSlug === topic.slug);
        const lastAssetId = nextTopicAssetId(topic, body.topicProgress, previous?.lastAssetId);
        if (!lastAssetId) {
          setView(body);
          setState("ready");
          return;
        }
        const touchResponse = await fetch("/api/v1/learning", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "touch_topic", queueBinding: body.queueBinding, payload: { topicSlug: topic.slug, lastAssetId, idempotencyKey: `topic-touch-${crypto.randomUUID()}` } }),
          signal: controller.signal,
        });
        const updated = await touchResponse.json() as LearningView;
        if (!touchResponse.ok) throw new Error(updated.error || "Progress unavailable");
        setView(updated);
        setState("ready");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setState("error");
      }
    })();
    return () => controller.abort();
  }, [topic]);

  async function run(action: "topic_batch_today" | "topic_batch_review", lessonId?: string) {
    if (!view || view.scope !== "account" || busy) return;
    const target = action === "topic_batch_today" ? "today" : "review";
    setBusy(lessonId ? `${target}:${lessonId}` : target);
    setMessage("");
    try {
      const response = await fetch("/api/v1/learning", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          queueBinding: view.queueBinding,
          clientRevision: view.revision,
          payload: { topicSlug: topic.slug, lessonId, sessionId: view.session.id, idempotencyKey: `topic-batch-${crypto.randomUUID()}` },
        }),
      });
      const body = await response.json() as LearningView;
      if (!response.ok) {
        if (body.error === "REVISION_CONFLICT") {
          try {
            const latestResponse = await fetch(`/api/v1/learning?tzOffset=${new Date().getTimezoneOffset()}`, { cache: "no-store" });
            const latest = await latestResponse.json() as LearningView;
            if (!latestResponse.ok || latest.scope !== "account") throw new Error(latest.error || "Latest progress unavailable");
            setView(latest);
          } catch {
            setState("error");
            throw new Error("Progress changed on another device, but the latest state could not be verified. Reload before making more changes.");
          }
          throw new Error("Progress changed on another device. The latest state is loaded; review it and retry.");
        }
        throw new Error(body.error || "The topic could not be added.");
      }
      setView(body);
      setMessage(lessonId
        ? `This lesson is now ${action === "topic_batch_today" ? "in Today" : "ready in Review"}.`
        : action === "topic_batch_today" ? "All available topic words are now in Today." : "All available topic words are now ready in Review.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The topic could not be added.");
    } finally {
      setBusy(null);
    }
  }

  if (state === "loading") return <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-live="polite"><strong>Loading signed-in progress…</strong></section>;
  if (state === "error") return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><strong>Progress unavailable</strong><p className="mt-2 text-sm leading-6">The words remain available, but HSKKit will not show guessed completion or enable bulk changes until your account state can be verified.</p></section>;
  if (!view || view.scope !== "account") return <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5"><strong className="text-slate-950">Save real topic progress</strong><p className="mt-2 text-sm leading-6 text-slate-700">Sign in to continue this topic across devices and add the full word set to Today or Review.</p><Link href={`/login?next=${encodeURIComponent(`/topics/${topic.slug}`)}`} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 font-bold text-white">Sign in to continue</Link></section>;

  const progress = computeTopicProgress(topic, view.topicProgress);
  const visit = view.topicVisits.find((item) => item.topicSlug === topic.slug);
  const nextAsset = nextTopicAssetId(topic, view.topicProgress, visit?.lastAssetId);
  return <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5" aria-labelledby="topic-progress-title">
    <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">Signed-in progress</p>
    <div className="mt-2 flex items-end justify-between gap-3"><div><h2 id="topic-progress-title" className="text-xl font-black text-slate-950">{progress.learned} of {progress.total} words learned</h2><p className="mt-1 text-sm text-slate-700">Based only on saved learning records for this account.</p></div><strong className="text-2xl text-emerald-800">{progress.percent}%</strong></div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100" role="progressbar" aria-label="Topic word progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}><span className="block h-full rounded-full bg-emerald-600" style={{ width: `${progress.percent}%` }} /></div>
    {nextAsset ? <Link href={`/word/${encodeURIComponent(nextAsset)}/practice`} className="mt-4 inline-flex min-h-11 w-full items-center justify-between rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">{progress.learned > 0 ? "Continue next word" : "Start first word"} <span aria-hidden="true">→</span></Link> : <Link href={`/topics/${topic.slug}/practice`} className="mt-4 inline-flex min-h-11 w-full items-center justify-between rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">Review practice <span aria-hidden="true">→</span></Link>}
    {topic.lessons ? <div className="mt-4 space-y-3" aria-label="Lesson actions">{topic.lessons.map((lesson, index) => <div key={lesson.id} className="rounded-xl border border-emerald-200 bg-white p-3"><p className="text-xs font-black uppercase tracking-[0.1em] text-emerald-800">Lesson {index + 1}</p><p className="mt-1 text-sm font-bold text-slate-900">{lesson.title}</p><div className="mt-2 grid gap-2"><button className="min-h-11 rounded-lg border border-emerald-300 px-3 text-sm font-bold text-emerald-900 disabled:opacity-50" disabled={Boolean(busy)} type="button" onClick={() => void run("topic_batch_today", lesson.id)}>{busy === `today:${lesson.id}` ? "Adding…" : "Add lesson to Today"}</button><button className="min-h-11 rounded-lg border border-emerald-300 px-3 text-sm font-bold text-emerald-900 disabled:opacity-50" disabled={Boolean(busy)} type="button" onClick={() => void run("topic_batch_review", lesson.id)}>{busy === `review:${lesson.id}` ? "Adding…" : "Add lesson to Review"}</button></div></div>)}</div> : null}
    {!topic.lessons ? <div className="mt-3 grid gap-2 sm:grid-cols-2"><button className="min-h-11 rounded-xl border border-emerald-300 bg-white px-3 text-sm font-bold text-emerald-900 disabled:opacity-50" disabled={Boolean(busy)} type="button" onClick={() => void run("topic_batch_today")}>{busy === "today" ? "Adding…" : "Add all to Today"}</button><button className="min-h-11 rounded-xl border border-emerald-300 bg-white px-3 text-sm font-bold text-emerald-900 disabled:opacity-50" disabled={Boolean(busy)} type="button" onClick={() => void run("topic_batch_review")}>{busy === "review" ? "Adding…" : "Add all to Review"}</button></div> : null}
    <p className="mt-3 min-h-5 text-sm font-semibold text-slate-700" aria-live="polite">{message}</p>
  </section>;
}
