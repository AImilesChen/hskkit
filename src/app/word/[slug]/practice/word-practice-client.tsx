"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AudioPlaybackControl } from "../../../components/audio-playback-control";
import { useVerifiedAudioPlayback } from "../../../components/use-verified-audio-playback";
import type { DictionaryPracticeExercise, DictionaryPracticeWord } from "../../../../lib/dictionary/p2-learning";
import { PlaybackRequestError } from "../../../../lib/learning/verified-playback";

type LearningView = {
  queueBinding: string;
  revision: number;
  feedback?: { correct: boolean; correctAnswerText: string };
  message?: string;
  code?: string;
  playbackTicket?: string;
  notBefore?: string;
};

export function WordPracticeClient({ word, exercises }: { word: DictionaryPracticeWord; exercises: DictionaryPracticeExercise[] }) {
  const [view, setView] = useState<LearningView | null>(null);
  const [activeId, setActiveId] = useState(exercises[0]?.id ?? "");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<LearningView["feedback"]>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const active = exercises.find((exercise) => exercise.id === activeId) ?? exercises[0];
  const playback = useVerifiedAudioPlayback({
    context: "dictionary-practice",
    start: async () => {
      if (!active?.audioAsset) throw new PlaybackRequestError("AUDIO_ASSET_UNAVAILABLE");
      const started = await post("dictionary_playback_start", { assetId: word.assetId, idempotencyKey: `dictionary-play-start-${crypto.randomUUID()}` });
      if (!started.playbackTicket) throw new PlaybackRequestError("AUDIO_PLAYBACK_REQUIRED");
      return { playbackTicket: started.playbackTicket, notBefore: started.notBefore };
    },
    complete: async (playbackTicket) => { await post("dictionary_playback_complete", { assetId: word.assetId, playbackTicket, idempotencyKey: `dictionary-play-complete-${crypto.randomUUID()}` }); },
    onVerified: () => setMessage("Listening verified. Choose your answer."),
    onMessage: setMessage,
  });

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
    playback.reset();
  }

  async function post(action: string, payload: Record<string, unknown>) {
    if (!view) throw new Error("Learning state is still loading.");
    const response = await fetch("/api/v1/learning", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, queueBinding: view.queueBinding, clientRevision: view.revision, payload }),
    });
    const body = await response.json() as LearningView;
    if (!response.ok) throw new PlaybackRequestError(body.code ?? "UNKNOWN_ERROR", body.message || "That action could not be saved.");
    return body;
  }

  async function submit() {
    if (!active || !answer || busy) return;
    if (active.mode === "listening" && !playback.verified) { setMessage("Play the complete synthesized pronunciation before answering."); return; }
    setBusy(true);
    setMessage("");
    try {
      const body = await post("dictionary_practice_attempt", {
        assetId: word.assetId,
        mode: active.mode,
        answer,
        playbackTicket: active.mode === "listening" ? playback.ticket : undefined,
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

  return <section className="mx-auto max-w-3xl">
    <div className="mb-3">
      <h2 className="text-sm font-bold text-slate-950">Practice modes</h2>
      <div className={`mt-2 grid gap-1 rounded-2xl bg-slate-100 p-1 ${exercises.length === 3 ? "grid-cols-3" : "grid-cols-2"}`} role="tablist" aria-label="Word practice modes">
        {exercises.map((exercise) => <button key={exercise.id} type="button" role="tab" aria-selected={exercise.id === active.id} aria-label={exercise.mode === "meaning" ? "Choose the meaning" : exercise.mode === "pinyin" ? "Choose the pinyin" : "Listen and choose"} onClick={() => chooseExercise(exercise.id)} className={`min-h-11 rounded-xl px-2 text-center text-xs font-bold transition-colors sm:text-sm ${exercise.id === active.id ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white/70 hover:text-slate-950"}`}>{exercise.mode === "meaning" ? "Meaning" : exercise.mode === "pinyin" ? "Pinyin" : "Listening"}</button>)}
      </div>
      {!exercises.some((exercise) => exercise.mode === "listening") ? <p className="mt-2 text-xs leading-5 text-slate-500">Listening is unavailable because this word has no published synthesized pronunciation.</p> : null}
    </div>

    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">{active.instruction}</p>
      <h2 className="mt-3 text-2xl font-black text-slate-950">{active.prompt}</h2>
      {active.mode === "listening" ? <AudioPlaybackControl asset={active.audioAsset} beforePlay={playback.beforePlay} onComplete={() => void playback.onComplete()} onFailure={playback.onFailure} verificationState={playback.verifying ? "verifying" : playback.verified ? "verified" : "idle"} showProgress className="mt-5" /> : null}
      <fieldset disabled={active.mode === "listening" && !playback.verified} className="mt-6 grid gap-3">
        <legend className="sr-only">Answer choices</legend>
        {active.options.map((option) => <label key={option.key} className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${active.mode === "listening" && !playback.verified ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400" : answer === option.key ? "cursor-pointer border-blue-600 bg-blue-50 text-blue-950" : "cursor-pointer border-slate-200 text-slate-800 hover:border-blue-300"}`}>
          <input type="radio" name={active.id} value={option.key} checked={answer === option.key} onChange={() => { setAnswer(option.key); setFeedback(undefined); }} className="size-4 accent-blue-600" />
          <span className="font-black text-slate-500">{option.key}</span><span>{option.text}</span>
        </label>)}
      </fieldset>
      <button type="button" onClick={() => void submit()} disabled={!view || !answer || busy || (active.mode === "listening" && !playback.verified)} className="mt-5 min-h-11 w-full rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 sm:w-auto">{busy ? "Saving…" : "Check answer"}</button>
      <div className="mt-4 min-h-12" aria-live="polite">
        {feedback ? <div className={`rounded-xl px-4 py-3 text-sm ${feedback.correct ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-950"}`}>
          <p className="font-bold">{feedback.correct ? "Correct." : `Not quite. Correct answer: ${feedback.correctAnswerText}.`}</p>
          <p className="mt-1 font-semibold">{word.hanzi} · {word.pinyin} · {word.meaning}</p>
          <p className="mt-1">This attempt is now connected to Review.</p>
        </div> : message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4 text-sm font-bold">
        <Link href={`/word/${encodeURIComponent(word.assetId)}`} className="text-blue-700 hover:underline">Back to word</Link>
        <Link href="/review" className="text-blue-700 hover:underline">Open Review</Link>
        <Link href="/today" className="text-blue-700 hover:underline">Open Today</Link>
      </div>
    </div>
  </section>;
}
