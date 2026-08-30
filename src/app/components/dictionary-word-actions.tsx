"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AudioButton } from "./audio-button";

type WordProgress = {
  saved: boolean;
  today: "none" | "pending" | "completed";
  learned: boolean;
  review: "none" | "due" | "scheduled";
  dueAt?: string;
};

type LearningView = {
  session: { id: string; items: Array<{ id: string }> };
  savedWordIds: string[];
  dictionaryProgress: Record<string, WordProgress>;
  queueBinding: string;
  revision: number;
  code?: string;
  message?: string;
};

type BusyAction = "save" | "today" | "review";

export function DictionaryWordActions({ assetId, hanzi, level, audioSrc }: { assetId: string; hanzi: string; level: number; audioSrc?: string }) {
  const [view, setView] = useState<LearningView | null>(null);
  const [busy, setBusy] = useState<BusyAction | null>(null);
  const [message, setMessage] = useState("");
  const progress = view?.dictionaryProgress?.[assetId];
  const saved = progress?.saved ?? view?.savedWordIds.includes(assetId) ?? false;
  const added = progress?.today === "pending" || progress?.today === "completed" || view?.session.items.some((item) => item.id === `dictionary:${assetId}`) || false;
  const reviewAdded = progress?.review === "due" || progress?.review === "scheduled";

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/v1/learning", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as LearningView;
        if (!response.ok) throw new Error(body.message || "Learning actions are unavailable.");
        setView(body);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("Learning status is temporarily unavailable. Listening and practice still work.");
      });
    return () => controller.abort();
  }, []);

  async function run(action: "save_word" | "add_to_today" | "add_to_review") {
    if (!view || busy) return;
    const mode: BusyAction = action === "save_word" ? "save" : action === "add_to_today" ? "today" : "review";
    setBusy(mode);
    setMessage("");
    try {
      const response = await fetch("/api/v1/learning", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          queueBinding: view.queueBinding,
          clientRevision: view.revision,
          payload: {
            assetId,
            sessionId: view.session.id,
            save: action === "save_word" ? !saved : undefined,
            idempotencyKey: `dictionary-${action}-${crypto.randomUUID()}`,
          },
        }),
      });
      const body = await response.json() as LearningView;
      if (!response.ok) throw new Error(body.message || "That action could not be saved.");
      setView(body);
      setMessage(action === "save_word"
        ? (!saved ? "Saved to your word list." : "Removed from saved words.")
        : action === "add_to_today" ? "Added to Today." : "Added to Review and ready now.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That action could not be saved.");
    } finally {
      setBusy(null);
    }
  }

  const statusLabel = progress?.review === "due" ? "Due for review"
    : progress?.review === "scheduled" ? "Review scheduled"
      : progress?.learned ? "Learned" : "New word";

  return <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="word-actions-title">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 id="word-actions-title" className="text-lg font-bold text-slate-950">Learn this word</h2>
        <p className="mt-1 text-sm text-slate-600">Save it, place it in Today or Review, then practise the exact word.</p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${progress?.review === "due" ? "bg-amber-100 text-amber-900" : progress?.learned ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{statusLabel}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{audioSrc ? "Formal audio" : "Device voice preview"}</span>
      </div>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      <AudioButton text={hanzi} src={audioSrc} label="Listen" />
      <button type="button" disabled={!view || Boolean(busy)} onClick={() => void run("save_word")} className={`min-h-11 rounded-lg border px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${saved ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-300 bg-white text-slate-800 hover:border-blue-500"}`}>{busy === "save" ? "Saving…" : saved ? "Saved" : "Save"}</button>
      <button type="button" disabled={!view || added || Boolean(busy)} onClick={() => void run("add_to_today")} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 transition hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50">{busy === "today" ? "Adding…" : added ? "In Today" : "Add to Today"}</button>
      <button type="button" disabled={!view || reviewAdded || Boolean(busy)} onClick={() => void run("add_to_review")} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 transition hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50">{busy === "review" ? "Adding…" : reviewAdded ? "In Review" : "Add to Review"}</button>
      <Link href={`/word/${encodeURIComponent(assetId)}/practice`} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-bold text-white hover:bg-blue-700">Practice</Link>
      <Link href="/saved" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 hover:border-blue-500">Saved words</Link>
    </div>
    <p className="mt-3 min-h-5 text-sm text-slate-600" aria-live="polite">{message}{added && !message ? <><Link href="/today" className="font-bold text-blue-700 hover:underline">Open Today</Link> to continue this word.</> : reviewAdded && !message ? <><Link href="/review" className="font-bold text-blue-700 hover:underline">Open Review</Link> when it is due.</> : null}</p>
    <p className="mt-1 text-xs text-slate-500">HSK {level >= 7 ? "7–9" : level} learning path · your state continues after sign-in.</p>
  </section>;
}
