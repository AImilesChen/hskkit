"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DictionaryPracticeWord } from "../../lib/dictionary/p2-learning";

type Progress = { learned: boolean; review: "none" | "due" | "scheduled"; today: "none" | "pending" | "completed"; saved: boolean };
type LearningView = {
  savedWords: DictionaryPracticeWord[];
  savedWordIds: string[];
  dictionaryProgress: Record<string, Progress>;
  session: { id: string };
  queueBinding: string;
  revision: number;
  message?: string;
};

export function SavedWordsClient() {
  const [view, setView] = useState<LearningView | null>(null);
  const [words, setWords] = useState<DictionaryPracticeWord[]>([]);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/v1/learning", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const body = await response.json() as LearningView;
      if (!response.ok) throw new Error(body.message || "Saved words are unavailable.");
      setView(body); setWords(body.savedWords);
    }).catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) setMessage(error instanceof Error ? error.message : "Saved words are unavailable.");
    });
    return () => controller.abort();
  }, []);

  async function run(word: DictionaryPracticeWord, action: "add_to_today" | "save_word") {
    if (!view || busyId) return;
    setBusyId(`${word.assetId}:${action}`); setMessage("");
    try {
      const response = await fetch("/api/v1/learning", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          queueBinding: view.queueBinding,
          clientRevision: view.revision,
          payload: { assetId: word.assetId, sessionId: view.session.id, save: action === "save_word" ? false : undefined, idempotencyKey: `saved-${action}-${crypto.randomUUID()}` },
        }),
      });
      const body = await response.json() as LearningView;
      if (!response.ok) throw new Error(body.message || "That action could not be saved.");
      setView(body);
      if (action === "save_word") setWords((current) => current.filter((item) => item.assetId !== word.assetId));
      setMessage(action === "add_to_today" ? `${word.hanzi} was added to Today.` : `${word.hanzi} was removed from Saved words.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "That action could not be saved."); }
    finally { setBusyId(""); }
  }

  if (!view && !message) return <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-sm font-semibold text-blue-950" aria-live="polite">Loading saved words…</div>;

  return <section aria-labelledby="saved-list-title">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 id="saved-list-title" className="text-2xl font-bold text-slate-950">{words.length} saved {words.length === 1 ? "word" : "words"}</h2><p className="mt-1 text-sm text-slate-600">Choose the next real action for each word.</p></div><Link href="/dictionary" className="inline-flex min-h-11 items-center rounded-lg border border-blue-600 px-4 text-sm font-bold text-blue-700">Find words</Link></div>
    {words.length > 0 ? <div className="grid gap-3 md:grid-cols-2">{words.map((word) => {
      const progress = view?.dictionaryProgress[word.assetId];
      const inToday = progress?.today === "pending" || progress?.today === "completed";
      return <article key={word.assetId} className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4"><div><Link href={`/word/${encodeURIComponent(word.assetId)}`} className="text-3xl font-black text-slate-950 hover:text-blue-700">{word.hanzi}</Link><p className="mt-1 font-semibold text-blue-700">{word.pinyin}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${progress?.review === "due" ? "bg-amber-100 text-amber-900" : progress?.learned ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{progress?.review === "due" ? "Due" : progress?.learned ? "Learned" : `HSK ${word.levelBand === "7-9" ? "7–9" : word.levelBand}`}</span></div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-700">{word.meaning}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button type="button" disabled={inToday || Boolean(busyId)} onClick={() => void run(word, "add_to_today")} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-800 disabled:opacity-50">{inToday ? "In Today" : "Add to Today"}</button>
          <Link href={`/word/${encodeURIComponent(word.assetId)}/practice`} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-bold text-white">Practice</Link>
          <button type="button" disabled={Boolean(busyId)} onClick={() => void run(word, "save_word")} className="min-h-11 rounded-lg px-3 text-sm font-bold text-slate-600 hover:bg-slate-100">Remove</button>
        </div>
      </article>;
    })}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><h2 className="text-xl font-bold text-slate-950">No saved words yet</h2><p className="mt-2 text-sm text-slate-600">Save a trustworthy entry from the dictionary to build this list.</p><Link href="/dictionary" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white">Open Dictionary</Link></div>}
    <p className="mt-4 min-h-5 text-sm text-slate-600" aria-live="polite">{message}</p>
  </section>;
}
