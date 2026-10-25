"use client";

import { useEffect, useRef, useState } from "react";

type AudioPhase = "idle" | "loading" | "playing" | "error";
type AudioButtonProps = {
  text: string;
  src?: string;
  label?: string;
  variant?: "text" | "icon";
  unavailable?: boolean;
};

function AudioIcon({ phase, unavailable }: { phase: AudioPhase; unavailable: boolean }) {
  if (phase === "loading") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 animate-spin fill-none stroke-current" strokeWidth="2"><circle cx="12" cy="12" r="9" className="opacity-25" /><path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" /></svg>;
  }
  if (phase === "playing") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 animate-pulse fill-none stroke-current" strokeWidth="2" strokeLinecap="round"><path d="M5 10v4M9 7v10M13 4v16M17 7v10M21 10v4" /></svg>;
  }
  if (phase === "error") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 5v6h-6" /></svg>;
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6.5 9H3v6h3.5l4.5 4V5Z" /><path d={unavailable ? "m16 9 5 6m0-6-5 6" : "M15 9.5a4 4 0 0 1 0 5M18 7a7 7 0 0 1 0 10"} /></svg>;
}

export function AudioButton({ text, src, label, variant = "text", unavailable = false }: AudioButtonProps) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<AudioPhase>("idle");
  const resolvedLabel = label ?? (src ? `Play pronunciation for ${text}` : "Play browser voice preview");

  useEffect(() => {
    setPhase("idle");
    setSupported(unavailable ? false : src ? typeof Audio !== "undefined" : typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
    return () => {
      audio.current?.pause();
      audio.current = null;
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [src, unavailable]);

  async function play() {
    if (!supported || unavailable || phase === "loading") return;
    if (phase === "playing") {
      if (src && audio.current) {
        audio.current.pause();
        audio.current.currentTime = 0;
      } else {
        window.speechSynthesis.cancel();
      }
      setPhase("idle");
      return;
    }
    setPhase("loading");
    if (src) {
      audio.current?.pause();
      const player = new Audio(src);
      audio.current = player;
      player.onplaying = () => setPhase("playing");
      player.onended = () => setPhase("idle");
      player.onerror = () => setPhase("error");
      try {
        await player.play();
      } catch {
        setPhase("error");
      }
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.82;
    utterance.onstart = () => setPhase("playing");
    utterance.onend = () => setPhase("idle");
    utterance.onerror = () => setPhase("error");
    setPhase("playing");
    window.speechSynthesis.speak(utterance);
  }

  const unsupported = !unavailable && supported === false;
  const stateLabel = unavailable
    ? `Audio not available yet for ${text}`
    : unsupported
      ? `Audio unavailable in this browser for ${text}`
      : phase === "loading"
        ? `Loading pronunciation for ${text}`
        : phase === "playing"
          ? `Pause pronunciation for ${text} (playing)`
          : phase === "error"
            ? `Audio failed for ${text}. Try again`
            : resolvedLabel;
  const disabled = unavailable || supported !== true;

  if (variant === "icon") {
    return <button
      type="button"
      onClick={play}
      disabled={disabled}
      aria-busy={phase === "loading"}
      aria-disabled={phase === "loading" || undefined}
      aria-label={stateLabel}
      title={stateLabel}
      className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border transition focus:outline-none focus:ring-4 ${
        unavailable || unsupported
          ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
          : phase === "error"
            ? "border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-100"
            : "border-blue-600 bg-white text-blue-600 hover:bg-blue-50 focus:ring-blue-100 disabled:cursor-wait disabled:opacity-70"
      }`}
    >
      <AudioIcon phase={phase} unavailable={unavailable || unsupported} />
    </button>;
  }

  return <button type="button" onClick={play} disabled={disabled} aria-busy={phase === "loading"} aria-disabled={phase === "loading" || undefined} aria-label={stateLabel} title={stateLabel} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400">{phase === "loading" ? "Loading…" : phase === "playing" ? "Pause" : phase === "error" ? "Try audio again" : unavailable || unsupported ? "Audio unavailable" : resolvedLabel}</button>;
}
