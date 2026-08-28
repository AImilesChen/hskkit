"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AiAssist from "@/app/components/ai-assist";
import { normalizeStep7Answer, type Step7Exercise } from "@/lib/learning/step7-content";

type ListeningSessionState = { level: number; size: 10 | 20; seed: string; position: number };
type Props = { exercise: Step7Exercise; voiceText?: string; audioSrc?: string; nextHref?: string; nextLabel?: string; listeningSession?: ListeningSessionState };

export default function Step7ExerciseClient({ exercise, voiceText, audioSrc, nextHref, nextLabel, listeningSession }: Props) {
  const [answer, setAnswer] = useState("");
  const [played, setPlayed] = useState(!voiceText);
  const [playing, setPlaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const key = useRef<string | undefined>(undefined);
  const playbackTicket = useRef<string | undefined>(undefined);
  const audio = useRef<HTMLAudioElement | undefined>(undefined);
  const correct = saved && normalizeStep7Answer(answer) === normalizeStep7Answer(exercise.correctAnswer);

  useEffect(() => {
    if (!listeningSession) return;
    try {
      localStorage.setItem("hskkit:listening:resume", JSON.stringify({ href: window.location.pathname + window.location.search, label: `Continue HSK ${listeningSession.level} · ${listeningSession.position + 1} of ${listeningSession.size}` }));
    } catch { /* storage is optional */ }
  }, [listeningSession]);

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

  async function submit(value = answer) {
    if (!value || !played || saving || saved) return;
    setSaving(true); setError("");
    const idempotencyKey = key.current ?? crypto.randomUUID();
    key.current = idempotencyKey;
    const body = JSON.stringify({ action: "step7_attempt", payload: { idempotencyKey, exerciseId: exercise.id, answer: value, playbackTicket: voiceText ? playbackTicket.current : undefined }, tzOffset: new Date().getTimezoneOffset() });
    let response: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        response = await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body });
        if (response.ok || response.status < 500 && response.status !== 409) break;
      } catch { /* retry with the same key */ }
    }
    setSaving(false);
    if (!response?.ok) { setError("We couldn't save this exercise. Your progress was not advanced; retry the same answer."); return; }
    setAnswer(value); setSaved(true); key.current = undefined;
    if (listeningSession) {
      try {
        const storageKey = `hskkit:listening:result:${listeningSession.level}:${listeningSession.size}:${listeningSession.seed}`;
        const stored = JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Record<string, boolean>;
        stored[String(listeningSession.position)] = normalizeStep7Answer(value) === normalizeStep7Answer(exercise.correctAnswer);
        localStorage.setItem(storageKey, JSON.stringify(stored));
      } catch { /* the server learning record remains authoritative */ }
    }
  }

  return <section className="step7-exercise" aria-labelledby="exercise-heading">
    <span className="eyebrow">Linked practice</span>
    <h2 id="exercise-heading">{exercise.prompt}</h2>
    {voiceText && <><p>Finish playback before answering. Playback failure never changes mastery or usage.</p><button className="audio-play-button inline-flex size-12 items-center justify-center rounded-full border border-blue-300 bg-blue-50 text-blue-700 transition hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60" type="button" aria-label={played ? "Replay audio" : "Play audio"} aria-pressed={playing} disabled={playing} onClick={play}><svg className="audio-play-icon size-5" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">{playing ? <><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></> : <path d="M8 5.5v13l10-6.5z"/>}</svg><span className="sr-only">{playing ? "Playing audio" : played ? "Replay audio" : "Play audio"}</span></button></>}
    {error && <p className="step7-alert error" role="alert">{error}</p>}
    {exercise.options ? <div className="step7-options">
      {Object.entries(exercise.options).map(([letter, text]) => <button key={letter} className="btn secondary" disabled={!played || saving || saved} onClick={() => { setAnswer(letter); void submit(letter); }}>{letter}. {text}</button>)}
    </div> : <div className="step7-dictation"><label htmlFor="dictation-answer">Your dictation</label><input id="dictation-answer" lang="zh-CN" value={answer} disabled={!played || saving || saved} onChange={(event) => setAnswer(event.target.value)} placeholder="Type the Chinese sentence"/><button className="btn" disabled={!played || !answer.trim() || saving || saved} onClick={() => void submit()}>{saving ? "Saving…" : "Check dictation"}</button></div>}
    {saving && <p role="status">Saving this linked exercise…</p>}
    {saved && <><div className={`step7-alert ${correct ? "success" : "warning"}`} role="status"><strong>{correct ? "Correct — progress saved." : "Not yet — added to Mistakes and SRS."}</strong><p>{exercise.explanation}</p><p><strong>Correct answer:</strong> {exercise.options?.[exercise.correctAnswer] ?? exercise.correctAnswer}</p><div className="step7-actions">{nextHref && <Link className="btn" href={nextHref}>{nextLabel ?? "Continue"}</Link>}<Link className="btn secondary" href={correct ? "/planner" : "/mistakes"}>{correct ? "Open Planner" : "Open Mistakes"}</Link></div></div><AiAssist feature="explanation" exerciseId={exercise.id}/></>}
  </section>;
}
