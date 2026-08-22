"use client";

import { useEffect, useRef, useState } from "react";

export function AudioButton({ text, src, label }: { text: string; src?: string; label?: string }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const resolvedLabel = label ?? (src ? "Play formal pronunciation" : "Play browser voice preview");

  useEffect(() => {
    setSupported(src ? typeof Audio !== "undefined" : typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
    return () => {
      audio.current?.pause();
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [src]);

  async function play() {
    if (!supported) return;
    setPlaying(true);
    if (src) {
      const player = new Audio(src);
      audio.current = player;
      player.onended = () => setPlaying(false);
      player.onerror = () => { setPlaying(false); setSupported(false); };
      try { await player.play(); } catch { setPlaying(false); setSupported(false); }
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.82;
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utterance);
  }

  const unavailable = supported === false;
  return <button type="button" onClick={play} disabled={supported !== true || playing} aria-label={unavailable ? "Audio unavailable in this browser" : resolvedLabel} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"><span aria-hidden="true">{playing ? "◼" : unavailable ? "🔇" : "▶"}</span>{playing ? "Playing…" : unavailable ? "Audio unavailable" : resolvedLabel}</button>;
}
