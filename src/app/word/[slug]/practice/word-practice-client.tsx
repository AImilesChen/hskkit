"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AudioPlaybackControl } from "../../../components/audio-playback-control";
import type { DictionaryPracticeExercise, DictionaryPracticeWord } from "../../../../lib/dictionary/p2-learning";

type LearningView = {
  queueBinding: string;
  revision: number;
  feedback?: { correct: boolean; correctAnswerText: string };
  message?: string;
};

export function WordPracticeClient({ word, exercises }: { word: DictionaryPracticeWord; exercises: DictionaryPracticeExercise[] }) {
  const [view, setView] = useState<LearningView | null>(null);
  const [activeId, setActiveId] = useState(exercises[0]?.id ?? "");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<LearningView["feedback"]>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [playbackTicket, setPlaybackTicket] = useState("");
  const [playbackReady, setPlaybackReady] = useState(false);
  const active = exercises.find((exercise) => exercise.id === activeId) ?? exercises[0];

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/v1/learning", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const body = await response.json() as LearningView;
      if (!response.ok) throw new Error(body.message || "Learning state is unavailable.");
      setView(body);
    }).catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) setMessage(error instanceof Error ? error.message : "Learning state is unavailable.");
    });
    return () => controller.abort();
  }, []);

  function chooseExercise(id: string) {
    setActiveId(id);
    setAnswer("");
    setFeedback(undefined);
    setMessage("");
    setPlaybackTicket("");
    setPlaybackReady(false);
  }

  async function post(action: string, payload: Record<string, unknown>) {
    if (!view) throw new Error("Learning state is still loading.");
    const response = await fetch("/api/v1/learning", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, queueBinding: view.queueBinding, clientRevision: view.revision, payload }),
    });
    const body = await response.json() as LearningView & { playbackTicket?: string };
    if (!response.ok) throw new Error(body.message || "That action could not be saved.");
    return body;
  }

  async function authorizePlayback() {
    if (!active?.audioAsset || busy) return false;
    setBusy(true);
    setMessage("");
    setPlaybackReady(false);
    try {
      const started = await post("dictionary_playback_start", { assetId: word.assetId, idempotencyKey: `dictionary-play-start-${crypto.randomUUID()}` });
      if (!started.playbackTicket) throw new Error("Playback could not start.");
      setPlaybackTicket(started.playbackTicket);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Playback could not start.");
      setBusy(false);
      return false;
    }
  }

  async function finishPlayback() {
    if (!playbackTicket) { setBusy(false); return; }
    try {
      await post("dictionary_playback_complete", { assetId: word.assetId, playbackTicket, idempotencyKey: `dictionary-play-complete-${crypto.randomUUID()}` });
      setPlaybackReady(true);
      setMessage("Listening verified. Choose your answer.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Listen to the complete audio before answering.");
      setPlaybackReady(false);
    } finally {
      setBusy(false);
    }
  }

  function failPlayback() {
    setPlaybackTicket("");
    setPlaybackReady(false);
    setBusy(false);
    setMessage("Audio playback failed. Retry the audio before answering.");
  }

  async function submit() {
    if (!active || !answer || busy) return;
    if (active.mode === "listening" && !playbackReady) { setMessage("Play the complete synthesized pronunciation before answering."); return; }
    setBusy(true);
    setMessage("");
    try {
      const body = await post("dictionary_practice_attempt", {
        assetId: word.assetId,
        mode: active.mode,
        answer,
        playbackTicket: active.mode === "listening" ? playbackTicket : undefined,
        idempotencyKey: `dictionary-practice-${active.mode}-${crypto.randomUUID()}`,
      });
      setView(body);
      setFeedback(body.feedback);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your answer could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  if (!active) return <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">This word does not yet have enough same-level published alternatives for a reliable exercise.</p>;

  return <section className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
    <div className="self-start rounded-2xl border border-slate-200 bg-white p-3">
      <h2 className="px-2 pb-2 text-sm font-bold text-slate-950">Practice modes</h2>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1" role="tablist" aria-label="Word practice modes">
        {exercises.map((exercise) => <button key={exercise.id} type="button" role="tab" aria-selected={exercise.id === active.id} onClick={() => chooseExercise(exercise.id)} className={`min-h-11 rounded-xl px-3 text-left text-sm font-bold ${exercise.id === active.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{exercise.mode === "meaning" ? "Choose the meaning" : exercise.mode === "pinyin" ? "Choose the pinyin" : "Listen and choose"}</button>)}
      </div>
      {!exercises.some((exercise) => exercise.mode === "listening") ? <p className="mt-3 px-2 text-xs leading-5 text-slate-500">Listening is hidden because this word has no published synthesized pronunciation.</p> : null}
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">{active.instruction}</p>
      <h2 className="mt-3 text-2xl font-black text-slate-950">{active.prompt}</h2>
      {active.mode === "listening" ? <AudioPlaybackControl asset={active.audioAsset} beforePlay={authorizePlayback} onComplete={() => void finishPlayback()} onFailure={failPlayback} className="mt-5" /> : null}
      <fieldset className="mt-6 grid gap-3">
        <legend className="sr-only">Answer choices</legend>
        {active.options.map((option) => <label key={option.key} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${answer === option.key ? "border-blue-600 bg-blue-50 text-blue-950" : "border-slate-200 text-slate-800 hover:border-blue-300"}`}>
          <input type="radio" name={active.id} value={option.key} checked={answer === option.key} onChange={() => { setAnswer(option.key); setFeedback(undefined); }} className="size-4 accent-blue-600" />
          <span className="font-black text-slate-500">{option.key}</span><span>{option.text}</span>
        </label>)}
      </fieldset>
      <button type="button" onClick={() => void submit()} disabled={!view || !answer || busy || (active.mode === "listening" && !playbackReady)} className="mt-5 min-h-11 w-full rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">{busy ? "Saving…" : "Check and save"}</button>
      <div className="mt-4 min-h-12" aria-live="polite">
        {feedback ? <p className={`rounded-xl px-4 py-3 text-sm font-semibold ${feedback.correct ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-950"}`}>{feedback.correct ? "Correct." : `Not quite. Correct answer: ${feedback.correctAnswerText}.`} This attempt is now connected to Review.</p> : message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4 text-sm font-bold">
        <Link href={`/word/${encodeURIComponent(word.assetId)}`} className="text-blue-700 hover:underline">Back to word</Link>
        <Link href="/review" className="text-blue-700 hover:underline">Open Review</Link>
        <Link href="/today" className="text-blue-700 hover:underline">Open Today</Link>
      </div>
    </div>
  </section>;
}
