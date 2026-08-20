"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { AudioExercise, AudioMode } from "@/lib/learning/audio";

type Props = { exercises: Record<AudioMode, AudioExercise>; initialMode: AudioMode };

export default function AudioExerciseClient({ exercises, initialMode }: Props) {
  const [mode, setMode] = useState<AudioMode>(initialMode);
  const [played, setPlayed] = useState<Record<AudioMode, boolean>>({ audio: false, context_audio: false });
  const [playing, setPlaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Record<AudioMode, { answer: string; correct: boolean } | undefined>>({ audio: undefined, context_audio: undefined });
  const [error, setError] = useState("");
  const keys = useRef<Partial<Record<AudioMode, string>>>({});
  const exercise = exercises[mode];

  function selectMode(next: AudioMode) { setMode(next); setError(""); }
  function play() {
    setError("");
    setPlayed((current) => ({ ...current, [mode]: false }));
    if (!("speechSynthesis" in window)) {
      setError("Audio is unavailable in this browser. No mastery was saved.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(exercise.voiceText);
    utterance.lang = "zh-CN";
    utterance.rate = 0.85;
    setPlaying(true);
    utterance.onend = () => { setPlaying(false); setPlayed((current) => ({ ...current, [mode]: true })); };
    utterance.onerror = () => {
      setPlaying(false);
      setPlayed((current) => ({ ...current, [mode]: false }));
      setError("Audio failed. Nothing was written to mastery; try playback again.");
    };
    window.speechSynthesis.speak(utterance);
  }
  async function answer(letter: string) {
    if (!played[mode] || saving || saved[mode]) return;
    setSaving(true);
    setError("");
    const key = keys.current[mode] ?? crypto.randomUUID();
    keys.current[mode] = key;
    const body = JSON.stringify({
      action: "audio_attempt",
      payload: { idempotencyKey: key, assetId: exercise.assetId, mode, answer: letter },
      tzOffset: new Date().getTimezoneOffset(),
    });
    let response: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        response = await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body });
        if (response.ok || response.status < 500 && response.status !== 409) break;
      } catch { /* retry the same idempotency key */ }
    }
    setSaving(false);
    if (!response?.ok) {
      setError("We couldn't save this answer. Your mastery was not advanced; retry with the same option.");
      return;
    }
    delete keys.current[mode];
    setSaved((current) => ({ ...current, [mode]: { answer: letter, correct: letter === exercise.correctAnswer } }));
  }

  const result = saved[mode];
  return <main className="learn"><header><span className="eyebrow">Audio SRS · HSK {exercise.word.level}</span><h1>{exercise.word.hanzi}</h1><p>{exercise.word.pinyin} · Complete word audio and context audio separately.</p><nav><Link href="/today">Today</Link><Link href="/review">Review</Link><Link href="/mistakes">Mistakes</Link><Link href="/listen">Listen</Link></nav></header>
    <article className="card">
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Listening mode">
        <button className={`btn ${mode === "audio" ? "" : "secondary"}`} onClick={() => selectMode("audio")}>Word audio</button>
        <button className={`btn ${mode === "context_audio" ? "" : "secondary"}`} onClick={() => selectMode("context_audio")}>Context audio</button>
      </div>
      <span className="eyebrow">{mode.replace("_", " ")}</span>
      <h2>{exercise.prompt}</h2>
      <p>Playback must finish before answers unlock. A playback failure never changes mastery.</p>
      <button className="btn mb-5" onClick={play} disabled={playing}>{playing ? "Playing…" : played[mode] ? "Play again" : "Play audio"}</button>
      {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p>}
      <div className="mt-5 grid gap-3">
        {Object.entries(exercise.options).map(([letter, text]) => <button key={letter} className="btn secondary text-left" disabled={!played[mode] || saving || Boolean(result)} onClick={() => answer(letter)}>{letter}. {text}</button>)}
      </div>
      {saving && <p className="mt-4 text-sm font-semibold text-blue-700" role="status">Saving mastery…</p>}
      {result && <div className={`mt-5 rounded-xl p-4 ${result.correct ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`} role="status"><strong>{result.correct ? "Correct — mastery saved." : "Not yet — added to Mistakes and Review."}</strong><p className="mt-2">Correct answer: {exercise.options[exercise.correctAnswer]}</p><div className="mt-4 flex flex-wrap gap-2">{mode === "audio" && !saved.context_audio && <button className="btn" onClick={() => selectMode("context_audio")}>Continue to context audio</button>}<Link className="btn secondary" href={result.correct ? "/today" : "/mistakes"}>{result.correct ? "Return to Today" : "Open Mistakes"}</Link></div></div>}
    </article>
  </main>;
}
