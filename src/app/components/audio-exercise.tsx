"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioMode, PublicAudioExercise } from "@/lib/learning/audio";
import { waitForPlaybackWindow } from "@/lib/learning/verified-playback";
import { todayCompletionProofKey } from "@/lib/learning/today-plan";
import { AudioPlaybackControl, type AudioPlaybackState } from "./audio-playback-control";

type Props = { exercises: Partial<Record<AudioMode, PublicAudioExercise>>; initialMode: AudioMode; dailySessionId?: string; dailyItemId?: string };

export default function AudioExerciseClient({ exercises, initialMode, dailySessionId, dailyItemId }: Props) {
  const [mode, setMode] = useState<AudioMode>(initialMode);
  const [heard, setHeard] = useState<Record<AudioMode, boolean>>({ audio: false, context_audio: false });
  const [verified, setVerified] = useState<Record<AudioMode, boolean>>({ audio: false, context_audio: false });
  const [verifying, setVerifying] = useState<Record<AudioMode, boolean>>({ audio: false, context_audio: false });
  const [selected, setSelected] = useState<Record<AudioMode, string | undefined>>({ audio: undefined, context_audio: undefined });
  const [playing, setPlaying] = useState(false);
  const [formalState, setFormalState] = useState<AudioPlaybackState>("loading");
  const [preparing, setPreparing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Record<AudioMode, { answer: string; correct: boolean; correctAnswerText: string } | undefined>>({ audio: undefined, context_audio: undefined });
  const [error, setError] = useState("");
  const [staleDailyItem, setStaleDailyItem] = useState(false);
  const keys = useRef<Partial<Record<AudioMode, string>>>({});
  const attemptedAnswers = useRef<Partial<Record<AudioMode, string>>>({});
  const savingRef = useRef(false);
  const savedRef = useRef<Partial<Record<AudioMode, boolean>>>({});
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const tickets = useRef<Partial<Record<AudioMode, string>>>({});
  const ticketNotBefore = useRef<Partial<Record<AudioMode, string>>>({});
  const exercise = exercises[mode]!;
  const availableModes = (["audio", "context_audio"] as AudioMode[]).filter((candidate) => Boolean(exercises[candidate]));
  const formalAudioSrc = mode === "audio" && exercise.word.audio.status === "formal" ? exercise.word.audio.src : undefined;

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  function selectMode(next: AudioMode) {
    if (!exercises[next] || next === mode || preparing || playing || (formalAudioSrc && (formalState === "playing" || formalState === "paused")) || verifying[mode] || saving) return;
    utteranceRef.current = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (!verified[mode]) {
      tickets.current[mode] = undefined;
      setHeard((current) => ({ ...current, [mode]: false }));
      setSelected((current) => ({ ...current, [mode]: undefined }));
    }
    setPlaying(false);
    setMode(next);
    setError("");
  }

  async function startPlayback(targetMode: AudioMode): Promise<boolean> {
    setError("");
    setStaleDailyItem(false);
    setHeard((current) => ({ ...current, [targetMode]: false }));
    setVerified((current) => ({ ...current, [targetMode]: false }));
    setSelected((current) => ({ ...current, [targetMode]: undefined }));
    tickets.current[targetMode] = undefined;
    setPreparing(true);
    let started: Response;
    try {
      started = await fetch("/api/v1/learning", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "audio_playback_start", payload: { idempotencyKey: crypto.randomUUID(), assetId: exercises[targetMode]!.assetId, mode: targetMode, dailySessionId, dailyItemId }, tzOffset: new Date().getTimezoneOffset() }),
      });
    } catch {
      setError("Playback verification could not start. Nothing was written to mastery.");
      setPreparing(false);
      return false;
    }
    if (!started.ok) {
      const failure = await started.json().catch(() => null) as { error?: string } | null;
      if (failure?.error === "DAILY_ITEM_MISMATCH") {
        setStaleDailyItem(true);
        setError("This link belongs to an earlier Today step. Open Today to resume your current task.");
      } else {
        setError("Playback verification could not start. Retry the recording; nothing was saved.");
      }
      setPreparing(false);
      return false;
    }
    let ticket: { playbackTicket?: string; notBefore?: string };
    try { ticket = await started.json() as typeof ticket; }
    catch {
      setError("Playback verification could not start. Nothing was written to mastery.");
      setPreparing(false);
      return false;
    }
    if (!ticket.playbackTicket) {
      setError("Playback verification could not start. Nothing was written to mastery.");
      setPreparing(false);
      return false;
    }
    tickets.current[targetMode] = ticket.playbackTicket;
    ticketNotBefore.current[targetMode] = ticket.notBefore;
    setPreparing(false);
    return true;
  }

  async function verifyPlayback(targetMode: AudioMode) {
    const playbackTicket = tickets.current[targetMode];
    if (!playbackTicket) return;
    setHeard((current) => ({ ...current, [targetMode]: true }));
    setVerifying((current) => ({ ...current, [targetMode]: true }));
    try {
      await waitForPlaybackWindow(ticketNotBefore.current[targetMode]);
      if (tickets.current[targetMode] !== playbackTicket) return;
      const completed = await fetch("/api/v1/learning", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "audio_playback_complete", payload: { idempotencyKey: crypto.randomUUID(), assetId: exercises[targetMode]!.assetId, mode: targetMode, playbackTicket, dailySessionId, dailyItemId }, tzOffset: new Date().getTimezoneOffset() }),
      });
      if (!completed.ok) throw new Error("PLAYBACK_NOT_VERIFIED");
      if (tickets.current[targetMode] === playbackTicket) setVerified((current) => ({ ...current, [targetMode]: true }));
    } catch {
      if (tickets.current[targetMode] !== playbackTicket) return;
      tickets.current[targetMode] = undefined;
      setHeard((current) => ({ ...current, [targetMode]: false }));
      setSelected((current) => ({ ...current, [targetMode]: undefined }));
      setError("Playback could not be verified. Nothing was written to mastery; play it again before answering.");
    } finally {
      if (tickets.current[targetMode] === playbackTicket || !tickets.current[targetMode]) setVerifying((current) => ({ ...current, [targetMode]: false }));
    }
  }

  function failPlayback(targetMode: AudioMode) {
    tickets.current[targetMode] = undefined;
    setHeard((current) => ({ ...current, [targetMode]: false }));
    setVerified((current) => ({ ...current, [targetMode]: false }));
    setSelected((current) => ({ ...current, [targetMode]: undefined }));
    setVerifying((current) => ({ ...current, [targetMode]: false }));
    setError("Audio failed. Nothing was written to mastery; try playback again.");
  }

  async function play() {
    if (!("speechSynthesis" in window)) {
      setError("Audio is unavailable in this browser. No mastery was saved.");
      return;
    }
    if (!await startPlayback(mode)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(exercise.voiceText);
    utteranceRef.current = utterance;
    utterance.lang = "zh-CN";
    utterance.rate = 0.85;
    setPlaying(true);
    utterance.onend = () => {
      if (utteranceRef.current !== utterance) return;
      utteranceRef.current = null;
      setPlaying(false);
      void verifyPlayback(mode);
    };
    utterance.onerror = () => {
      if (utteranceRef.current !== utterance) return;
      utteranceRef.current = null;
      setPlaying(false);
      failPlayback(mode);
    };
    window.speechSynthesis.speak(utterance);
  }
  const saveAnswer = useCallback(async (targetMode: AudioMode, letter: string) => {
    if (!verified[targetMode] || savingRef.current || savedRef.current[targetMode] || !tickets.current[targetMode]) return;
    savingRef.current = true;
    setSaving(true);
    setError("");
    const key = keys.current[targetMode] ?? crypto.randomUUID();
    keys.current[targetMode] = key;
    attemptedAnswers.current[targetMode] = letter;
    const body = JSON.stringify({
      action: "audio_attempt",
      payload: { idempotencyKey: key, assetId: exercises[targetMode]!.assetId, mode: targetMode, answer: letter, playbackTicket: tickets.current[targetMode], dailySessionId, dailyItemId },
      tzOffset: new Date().getTimezoneOffset(),
    });
    let response: Response | undefined;
    try {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          response = await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body });
          if (response.ok || response.status < 500 && response.status !== 409) break;
        } catch { /* retry the same idempotency key */ }
      }
      if (!response?.ok) {
        setSelected((current) => ({ ...current, [targetMode]: undefined }));
        if (response?.status === 422) {
          tickets.current[targetMode] = undefined;
          setHeard((current) => ({ ...current, [targetMode]: false }));
          setVerified((current) => ({ ...current, [targetMode]: false }));
          setError("Playback verification expired. Replay the full recording before answering.");
        } else {
          setError("We couldn't save this answer. Select the same option to retry; your mastery was not advanced.");
        }
        return;
      }
      const payload = await response.json() as {
        feedback?: { correct?: boolean; correctAnswerText?: string };
        revision?: number;
        session?: { id: string; items: Array<{ id: string; kind?: string; status: string }> };
      };
      if (typeof payload.feedback?.correct !== "boolean" || !payload.feedback.correctAnswerText) {
        savedRef.current[targetMode] = true;
        setError("The answer was saved, but feedback could not be loaded. Return to Today to continue.");
        return;
      }
      savedRef.current[targetMode] = true;
      delete keys.current[targetMode];
      delete attemptedAnswers.current[targetMode];
      if (dailySessionId && dailyItemId) sessionStorage.setItem(todayCompletionProofKey(dailySessionId, dailyItemId), JSON.stringify({
        dailySessionId,
        dailyItemId,
        revision: payload.revision ?? 0,
        summaryComplete: payload.session?.items.some((item) => item.kind === "summary" && item.status === "completed") ?? false,
      }));
      setSaved((current) => ({ ...current, [targetMode]: { answer: letter, correct: payload.feedback!.correct!, correctAnswerText: payload.feedback!.correctAnswerText! } }));
    } catch {
      setSelected((current) => ({ ...current, [targetMode]: undefined }));
      setError("We couldn't confirm this answer. Select the same option to retry.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [dailyItemId, dailySessionId, exercises, verified]);

  useEffect(() => {
    const letter = selected[mode];
    if (letter && verified[mode] && !saved[mode]) void saveAnswer(mode, letter);
  }, [mode, saved, saveAnswer, selected, verified]);

  function answer(letter: string) {
    if (!heard[mode] || saving || saved[mode]) return;
    if (attemptedAnswers.current[mode] && attemptedAnswers.current[mode] !== letter) {
      setError("This answer may already have been saved. Retry the same option or return to Today.");
      return;
    }
    setError("");
    setSelected((current) => ({ ...current, [mode]: letter }));
  }

  const result = saved[mode];
  const playbackStatus = !heard[mode]
    ? preparing ? "Preparing playback…" : playing || formalAudioSrc && formalState === "playing" ? "Playing. Listen through to the end." : formalAudioSrc && formalState === "paused" ? "Paused. Resume to finish the recording." : "Play the recording to begin."
    : verifying[mode] ? selected[mode] ? "Answer selected. Verifying playback before saving…" : "Playback finished. Choose an answer while verification completes."
      : verified[mode] ? "Playback verified. Choose an answer." : "Finish playback before answering.";
  return <main className="learn"><header><span className="eyebrow">Audio SRS · HSK {exercise.word.level}</span><h1>{result ? exercise.word.hanzi : "Listening question"}</h1><p>{result ? `${exercise.word.pinyin} · Listening answer revealed.` : "Listen first, then choose what you hear."}</p><nav><Link href="/today">Today</Link><Link href="/review">Review</Link><Link href="/mistakes">Mistakes</Link><Link href="/listen">Listen</Link></nav></header>
    {dailyItemId && <section className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4" aria-label="Today Session context"><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Today Session</p><p className="mt-1 text-sm text-slate-700">This listening result is tied to your current saved step. Refreshing or going back will restore the same task.</p></section>}
    <article className="card">
      {!dailyItemId && availableModes.length > 1 && <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Listening mode">
        {exercises.audio && <button className={`btn ${mode === "audio" ? "" : "secondary"}`} disabled={preparing || playing || Boolean(formalAudioSrc && (formalState === "playing" || formalState === "paused")) || verifying[mode] || saving} onClick={() => selectMode("audio")}>Word audio</button>}
        {exercises.context_audio && <button className={`btn ${mode === "context_audio" ? "" : "secondary"}`} disabled={preparing || playing || Boolean(formalAudioSrc && (formalState === "playing" || formalState === "paused")) || verifying[mode] || saving} onClick={() => selectMode("context_audio")}>Context audio</button>}
      </div>}
      <span className="eyebrow">{mode.replace("_", " ")}</span>
      <h2>{exercise.prompt}</h2>
      <p>Choose as soon as playback ends. Your answer is saved only after playback is verified.</p>
      {formalAudioSrc ? <AudioPlaybackControl key={`${exercise.assetId}:${mode}`} asset={{ id: exercise.assetId, src: formalAudioSrc, sourceLabel: "Synthesized listening audio" }} beforePlay={() => startPlayback(mode)} onComplete={() => void verifyPlayback(mode)} onFailure={() => failPlayback(mode)} onStateChange={setFormalState} verificationState={verifying[mode] ? "verifying" : verified[mode] ? "verified" : "idle"} showProgress className="mt-4" />
        : <button className="btn mb-5" onClick={() => void play()} disabled={preparing || playing || verifying[mode]}>{preparing ? "Preparing…" : playing ? "Playing…" : verifying[mode] ? "Verifying…" : heard[mode] ? "Play again" : "Play audio"}</button>}
      <p className="mt-3 text-sm text-slate-600" role="status" aria-live="polite">{playbackStatus}</p>
      {error && <div className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert"><p>{error}</p>{staleDailyItem && <Link className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800" href="/today?resume=1">Resume current Today step</Link>}</div>}
      <div className="mt-5 grid gap-3">
        {Object.entries(exercise.options).map(([letter, text]) => <button key={letter} type="button" className={`btn secondary text-left ${selected[mode] === letter ? "border-blue-700 bg-blue-50 ring-2 ring-blue-200" : ""}`} aria-pressed={selected[mode] === letter} disabled={!heard[mode] || saving || Boolean(result)} onClick={() => answer(letter)}>{letter}. {text}</button>)}
      </div>
      {saving && <p className="mt-4 text-sm font-semibold text-blue-700" role="status">Saving your answer…</p>}
      {result && <div className={`mt-5 rounded-xl p-4 ${result.correct ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`} role="status"><strong>{result.correct ? "Correct — mastery saved." : "Not yet — added to Mistakes and Review."}</strong><p className="mt-2">Correct answer: {result.correctAnswerText}</p><div className="mt-4 flex flex-wrap gap-2">{mode === "audio" && exercises.context_audio && !saved.context_audio && !dailyItemId && <button className="btn" onClick={() => selectMode("context_audio")}>Continue to context audio</button>}{dailyItemId ? <Link className="btn" href={`/today?resume=1&completed=listen&completedSession=${encodeURIComponent(dailySessionId ?? "")}&completedItem=${encodeURIComponent(dailyItemId ?? "")}`}>Continue Today Session</Link> : <Link className="btn secondary" href={result.correct ? "/today" : "/mistakes"}>{result.correct ? "Return to Today" : "Open Mistakes"}</Link>}</div></div>}
    </article>
  </main>;
}
