"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AiAssist from "@/app/components/ai-assist";
import { normalizeStep7Answer, type Step7Exercise } from "@/lib/learning/step7-content";

const ANSWER_SAVE_TIMEOUT_MS = 5_000;
type PracticeSessionState = { level: number; size: 10 | 20; seed: string; position: number };
type PendingAttempt = { answer: string; idempotencyKey: string };
type Props = {
  exercise: Step7Exercise;
  voiceText?: string;
  audioSrc?: string;
  nextHref?: string;
  nextLabel?: string;
  listeningSession?: PracticeSessionState;
  readingSession?: PracticeSessionState;
};

export default function Step7ExerciseClient({ exercise, voiceText, audioSrc, nextHref, nextLabel, listeningSession, readingSession }: Props) {
  const [answer, setAnswer] = useState("");
  const [played, setPlayed] = useState(!voiceText);
  const [playing, setPlaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const key = useRef<string | undefined>(undefined);
  const playbackTicket = useRef<string | undefined>(undefined);
  const audio = useRef<HTMLAudioElement | undefined>(undefined);
  const attemptStorageKey = `hskkit:attempt:${exercise.id}`;
  const session = readingSession ?? listeningSession;
  const sessionKind = readingSession ? "reading" : "listening";
  const answered = answer.trim().length > 0;
  const correct = answered && normalizeStep7Answer(answer) === normalizeStep7Answer(exercise.correctAnswer);

  useEffect(() => {
    try {
      const pending = JSON.parse(localStorage.getItem(attemptStorageKey) ?? "null") as PendingAttempt | null;
      if (pending?.answer && pending.idempotencyKey) {
        key.current = pending.idempotencyKey;
        setAnswer(pending.answer);
        setError("Your answer was preserved after an interrupted save. Retry saving to continue.");
      }
    } catch { /* invalid optional recovery state is ignored */ }
  }, [attemptStorageKey]);

  useEffect(() => {
    if (!session) return;
    try {
      localStorage.setItem(`hskkit:${sessionKind}:resume`, JSON.stringify({ href: window.location.pathname + window.location.search, label: `Continue HSK ${session.level} · ${session.position + 1} of ${session.size}` }));
    } catch { /* storage is optional */ }
  }, [session, sessionKind]);

  async function play() {
    setError("");
    setPlayed(false);
    playbackTicket.current = undefined;
    if (!voiceText || !audioSrc) { setError("Formal audio is unavailable. No learning result was saved."); return; }
    let ticketResponse: Response;
    try {
      ticketResponse = await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "step7_playback_start", payload: { idempotencyKey: crypto.randomUUID(), exerciseId: exercise.id } }) });
    } catch { setError("Audio verification could not start. Nothing was written to mastery."); return; }
    if (!ticketResponse.ok) { setError("Audio verification could not start. Nothing was written to mastery."); return; }
    const ticket = await ticketResponse.json() as { playbackTicket?: string; notBefore?: string };
    if (!ticket.playbackTicket) { setError("Audio verification could not start. Nothing was written to mastery."); return; }
    playbackTicket.current = ticket.playbackTicket;
    setPlaying(true);
    const finish = async () => {
      setPlaying(false);
      const ticketId = playbackTicket.current;
      if (!ticketId) return;
      try {
        const waitMs = Math.max(0, Date.parse(ticket.notBefore ?? "") - Date.now());
        if (waitMs > 0) await new Promise((resolve) => window.setTimeout(resolve, waitMs));
        const verified = await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "step7_playback_complete", payload: { idempotencyKey: crypto.randomUUID(), exerciseId: exercise.id, playbackTicket: ticketId } }) });
        if (!verified.ok) throw new Error("PLAYBACK_NOT_VERIFIED");
        setPlayed(true);
      } catch {
        playbackTicket.current = undefined;
        setPlayed(false);
        setError("Playback could not be verified. Nothing was written to mastery; play it again before answering.");
      }
    };
    const fail = () => { playbackTicket.current = undefined; setPlaying(false); setPlayed(false); setError("Audio failed. Nothing was written to mastery; play it again before answering."); };
    audio.current?.pause();
    const player = new Audio(audioSrc);
    audio.current = player;
    player.onended = () => { void finish(); };
    player.onerror = fail;
    try { await player.play(); } catch { fail(); }
  }

  function rememberPending(value: string, idempotencyKey: string) {
    try { localStorage.setItem(attemptStorageKey, JSON.stringify({ answer: value, idempotencyKey } satisfies PendingAttempt)); } catch { /* recovery storage is optional */ }
  }

  async function persistAnswer(value = answer) {
    if (!value || !played || saving || saved) return;
    const idempotencyKey = key.current ?? crypto.randomUUID();
    key.current = idempotencyKey;
    rememberPending(value, idempotencyKey);
    setSaving(true);
    setError("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), ANSWER_SAVE_TIMEOUT_MS);
    let response: Response | undefined;
    try {
      response = await fetch("/api/v1/learning", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "step7_attempt", payload: { idempotencyKey, exerciseId: exercise.id, answer: value, playbackTicket: voiceText ? playbackTicket.current : undefined }, tzOffset: new Date().getTimezoneOffset() }),
        signal: controller.signal,
      });
    } catch (caught) {
      const timedOut = caught instanceof DOMException && caught.name === "AbortError";
      setError(timedOut ? "Save timed out. Your answer is safe; retry saving with the same attempt." : navigator.onLine ? "The service is temporarily unavailable. Your answer is safe; retry saving." : "You appear offline. Your answer is safe; reconnect and retry saving.");
      setSaving(false);
      window.clearTimeout(timeout);
      return;
    }
    window.clearTimeout(timeout);
    setSaving(false);
    if (!response.ok) {
      if (response.status === 409) setError("A progress conflict prevented saving. Your answer is safe; retry saving with the same attempt.");
      else if (response.status >= 500) setError("The service is temporarily unavailable. Your answer is safe; retry saving.");
      else setError("Progress could not be saved. Your answer is safe; retry saving.");
      return;
    }
    setSaved(true);
    key.current = undefined;
    try { localStorage.removeItem(attemptStorageKey); } catch { /* optional recovery state */ }
    if (session) {
      try {
        const storageKey = `hskkit:${sessionKind}:result:${session.level}:${session.size}:${session.seed}`;
        const stored = JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Record<string, boolean>;
        stored[String(session.position)] = normalizeStep7Answer(value) === normalizeStep7Answer(exercise.correctAnswer);
        localStorage.setItem(storageKey, JSON.stringify(stored));
      } catch { /* the server learning record remains authoritative */ }
    }
  }

  return <section className="step7-exercise" aria-labelledby="exercise-heading">
    <span className="eyebrow">Linked practice</span>
    <h2 id="exercise-heading">{exercise.prompt}</h2>
    {voiceText && <><p>Finish playback before answering. Playback failure never changes mastery or usage.</p><button className="audio-play-button inline-flex size-12 items-center justify-center rounded-full border border-blue-300 bg-blue-50 text-blue-700 transition hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60" type="button" aria-label={played ? "Replay audio" : "Play audio"} aria-pressed={playing} disabled={playing} onClick={play}><svg className="audio-play-icon size-5" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">{playing ? <><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></> : <path d="M8 5.5v13l10-6.5z"/>}</svg><span className="sr-only">{playing ? "Playing audio" : played ? "Replay audio" : "Play audio"}</span></button></>}
    {exercise.options ? <div className="step7-options">
      {Object.entries(exercise.options).map(([letter, text]) => <button key={letter} className="btn secondary" aria-pressed={answer === letter} disabled={!played || answered} onClick={() => { const value = letter; setAnswer(value); void persistAnswer(value); }}>{letter}. {text}</button>)}
    </div> : <div className="step7-dictation"><label htmlFor="dictation-answer">Your dictation</label><input id="dictation-answer" lang="zh-CN" value={answer} disabled={!played || saving || saved} onChange={(event) => setAnswer(event.target.value)} placeholder="Type the Chinese sentence"/><button className="btn" disabled={!played || !answer.trim() || saving || saved} onClick={() => void persistAnswer()}>{saving ? "Saving…" : "Check dictation"}</button></div>}
    {answered && <div className={`step7-alert ${correct ? "success" : "warning"}`} role="status"><strong>{correct ? "Correct." : "Not yet."}</strong><p>{exercise.explanation}</p><p><strong>Correct answer:</strong> {exercise.options?.[exercise.correctAnswer] ?? exercise.correctAnswer}</p></div>}
    {saving && <p role="status">Saving progress…</p>}
    {saved && <p className="step7-alert success" role="status"><strong>Progress saved.</strong></p>}
    {error && <div className="step7-alert error" role="alert"><p>{error}</p>{answered && !saved && <button className="btn" type="button" disabled={saving} onClick={() => void persistAnswer()}>{saving ? "Saving progress…" : "Retry saving"}</button>}</div>}
    {saved && <><div className="step7-actions">{nextHref && <Link className="btn" href={nextHref}>{nextLabel ?? "Continue"}</Link>}<Link className="btn secondary" href="/mistakes">Open Mistakes</Link></div><AiAssist feature="explanation" exerciseId={exercise.id}/></>}
  </section>;
}
