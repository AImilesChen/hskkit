"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AudioButton } from "./audio-button";

type LearningView = {
  session: { id: string; items: Array<{ id: string }> };
  savedWordIds: string[];
  queueBinding: string;
  revision: number;
  code?: string;
  message?: string;
};

export function DictionaryWordActions({ assetId, hanzi, level, audioSrc }: { assetId: string; hanzi: string; level: number; audioSrc?: string }) {
  const [view, setView] = useState<LearningView | null>(null);
  const [busy, setBusy] = useState<"save" | "today" | null>(null);
  const [message, setMessage] = useState("");
  const saved = view?.savedWordIds.includes(assetId) ?? false;
  const added = view?.session.items.some((item) => item.id === `dictionary:${assetId}`) ?? false;

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/v1/learning", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as LearningView;
        if (!response.ok) throw new Error(body.message || "Learning actions are unavailable.");
        setView(body);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("Save and Today are temporarily unavailable. Listening and practice still work.");
      });
    return () => controller.abort();
  }, []);

  async function run(action: "save_word" | "add_to_today") {
    if (!view || busy) return;
    const mode = action === "save_word" ? "save" : "today";
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
      setMessage(action === "save_word" ? (!saved ? "Saved for later." : "Removed from saved words.") : "Added to Today. Open Today when you are ready.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That action could not be saved.");
    } finally {
      setBusy(null);
    }
  }

  return <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="word-actions-title">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h2 id="word-actions-title" className="text-lg font-bold text-slate-950">Learn this word</h2><p className="mt-1 text-sm text-slate-600">Hear it, keep it, or use it in your next activity.</p></div>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{audioSrc ? "Formal audio" : "Device voice preview"}</span>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <AudioButton text={hanzi} src={audioSrc} label="Listen" />
      <button type="button" disabled={!view || Boolean(busy)} onClick={() => void run("save_word")} className={`min-h-11 rounded-lg border px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${saved ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-300 bg-white text-slate-800 hover:border-blue-500"}`}>{busy === "save" ? "Saving…" : saved ? "Saved" : "Save"}</button>
      <button type="button" disabled={!view || added || Boolean(busy)} onClick={() => void run("add_to_today")} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 transition hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50">{busy === "today" ? "Adding…" : added ? "Added to Today" : "Add to Today"}</button>
      <Link href={level <= 6 ? `/practice/${level}/vocabulary` : "/practice"} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-bold text-white hover:bg-blue-700">Practice</Link>
    </div>
    <p className="mt-3 min-h-5 text-sm text-slate-600" aria-live="polite">{message}{added && !message ? <><Link href="/today" className="font-bold text-blue-700 hover:underline">Open Today</Link> to see this word in your queue.</> : null}</p>
  </section>;
}
