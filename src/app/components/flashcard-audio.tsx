"use client";

import { useEffect, useRef, useState } from "react";
import FlashcardIcon from "./flashcard-icon";

export default function FlashcardAudio({ text, src }: { text: string; src?: string }) {
  const player = useRef<HTMLAudioElement | null>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "playing" | "error">("idle");

  useEffect(() => {
    setPhase("idle");
    return () => { player.current?.pause(); player.current = null; };
  }, [src]);

  async function play() {
    if (!src || phase === "loading") return;
    if (phase === "playing" && player.current) {
      player.current.pause();
      player.current.currentTime = 0;
      setPhase("idle");
      return;
    }
    player.current?.pause();
    const audio = new Audio(src);
    player.current = audio;
    audio.onplaying = () => setPhase("playing");
    audio.onended = () => setPhase("idle");
    audio.onerror = () => setPhase("error");
    setPhase("loading");
    try { await audio.play(); } catch { setPhase("error"); }
  }

  const label = !src ? `Pronunciation unavailable for ${text}` : phase === "playing" ? `Stop pronunciation for ${text}` : phase === "loading" ? `Loading pronunciation for ${text}` : phase === "error" ? `Retry pronunciation for ${text}` : `Play pronunciation for ${text}`;
  return <span className="aqua-audio-control">
    <button type="button" onClick={play} disabled={!src || phase === "loading"} className="aqua-icon-button aqua-audio" aria-label={label} title={label} aria-busy={phase === "loading"}>
      <FlashcardIcon name={!src ? "speaker-slash" : phase === "loading" ? "circle-notch" : phase === "error" ? "arrows-clockwise" : "speaker-high"} className={phase === "loading" ? "aqua-spin" : ""} />
    </button>
    <span role="status" className={phase === "error" ? "aqua-audio-error" : "sr-only"}>{phase === "error" ? "Audio failed. Try again." : phase === "playing" ? "Playing synthesized pronunciation" : ""}</span>
  </span>;
}
