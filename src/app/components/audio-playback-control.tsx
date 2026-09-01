"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicAudioAsset } from "@/lib/audio/assets";

export type AudioPlaybackState = "loading" | "ready" | "playing" | "error" | "unavailable";

export function AudioPlaybackControl({
  asset,
  beforePlay,
  onComplete,
  onFailure,
  className = "",
}: {
  asset?: PublicAudioAsset;
  beforePlay?: () => Promise<boolean | void>;
  onComplete?: () => void;
  onFailure?: () => void;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const preparingPlaybackRef = useRef(false);
  const [state, setState] = useState<AudioPlaybackState>(asset ? "loading" : "unavailable");

  useEffect(() => {
    const audio = audioRef.current;
    setState(asset ? "loading" : "unavailable");
    if (!audio || !asset) return;
    audio.load();
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) setState("ready");
  }, [asset?.id, asset?.src]);

  async function playOrRetry() {
    const audio = audioRef.current;
    if (!audio || !asset) return;
    if (state === "error") {
      setState("loading");
      audio.load();
      return;
    }
    try {
      preparingPlaybackRef.current = true;
      setState("loading");
      const allowed = await beforePlay?.();
      if (allowed === false) {
        preparingPlaybackRef.current = false;
        setState("error");
        return;
      }
      await audio.play();
      preparingPlaybackRef.current = false;
      setState("playing");
    } catch {
      preparingPlaybackRef.current = false;
      setState("error");
      onFailure?.();
    }
  }

  const statusText = state === "loading"
    ? "Loading audio…"
    : state === "playing"
      ? "Playing…"
      : state === "error"
        ? "Audio could not be loaded."
        : state === "unavailable"
          ? "Audio unavailable"
          : "Ready to play";
  const actionText = state === "error"
    ? "Retry audio"
    : state === "playing"
      ? "Playing…"
      : state === "loading"
        ? "Loading audio…"
        : state === "unavailable"
          ? "Audio unavailable"
          : "Play audio";

  return <div className={`rounded-xl border border-blue-100 bg-blue-50 p-3 ${className}`.trim()} data-audio-state={state}>
    {asset ? <audio
      ref={audioRef}
      src={asset.src}
      preload="metadata"
      onLoadedMetadata={() => { if (!preparingPlaybackRef.current) setState("ready"); }}
      onCanPlay={() => { if (!preparingPlaybackRef.current) setState((current) => current === "playing" ? current : "ready"); }}
      onEnded={() => { setState("ready"); onComplete?.(); }}
      onError={() => { setState("error"); onFailure?.(); }}
    /> : null}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-blue-800">{asset?.sourceLabel ?? "Pronunciation audio"}</p>
        <p className="mt-1 text-xs text-slate-600" aria-live="polite">{statusText}</p>
      </div>
      <button
        type="button"
        onClick={() => void playOrRetry()}
        disabled={state === "loading" || state === "playing" || state === "unavailable"}
        className="inline-flex min-h-11 min-w-32 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
      >
        {actionText}
      </button>
    </div>
  </div>;
}
