"use client";

import { useEffect, useState } from "react";

export function AudioButton({ text, label = "Play pronunciation" }: { text: string; label?: string }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
    return () => { if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); };
  }, []);

  function play() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.82;
    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utterance);
  }

  const unavailable = supported === false;
  return (
    <button
      type="button"
      onClick={play}
      disabled={supported !== true || playing}
      aria-label={unavailable ? "Audio unavailable in this browser" : label}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
    >
      <span aria-hidden="true">{playing ? "◼" : unavailable ? "🔇" : "▶"}</span>
      {playing ? "Playing…" : unavailable ? "Audio unavailable" : label}
    </button>
  );
}
