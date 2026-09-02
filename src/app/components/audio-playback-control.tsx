"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicAudioAsset } from "@/lib/audio/assets";

export type AudioPlaybackState = "loading" | "ready" | "playing" | "paused" | "error" | "unavailable";

function AudioIcon({ state }: { state: AudioPlaybackState }) {
  if (state === "playing") {
    return <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>;
  }
  if (state === "error") {
    return <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" /></svg>;
  }
  if (state === "loading") {
    return <svg viewBox="0 0 24 24" className="size-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.2-8.6" /></svg>;
  }
  if (state === "unavailable") {
    return <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5ZM22 9l-6 6M16 9l6 6" /></svg>;
  }
  return <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5ZM15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" /></svg>;
}

export function AudioPlaybackControl({
  asset,
  beforePlay,
  onComplete,
  onFailure,
  className = "",
  variant = "default",
  label,
}: {
  asset?: PublicAudioAsset;
  beforePlay?: () => Promise<boolean | void>;
  onComplete?: () => void;
  onFailure?: () => void;
  className?: string;
  variant?: "default" | "icon";
  label?: string;
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
    if (variant === "default" && state === "error") {
      setState("loading");
      audio.load();
      return;
    }
    if (variant === "icon" && state === "playing") {
      audio.pause();
      setState("paused");
      return;
    }

    const resuming = variant === "icon" && state === "paused";
    try {
      preparingPlaybackRef.current = true;
      setState("loading");
      if (state === "error") audio.load();
      if (!resuming) {
        const allowed = await beforePlay?.();
        if (allowed === false) {
          preparingPlaybackRef.current = false;
          setState("error");
          return;
        }
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
      : state === "paused"
        ? "Paused"
        : state === "error"
          ? "Audio could not be loaded."
          : state === "unavailable"
            ? "Audio unavailable"
            : variant === "default" ? "Ready to play" : "Ready";
  const actionText = state === "error"
    ? "Retry audio"
    : state === "playing"
      ? "Playing…"
      : state === "paused"
        ? "Resume audio"
        : state === "loading"
          ? "Loading audio…"
          : state === "unavailable"
            ? "Audio unavailable"
            : "Play audio";
  const target = label ? ` for ${label}` : "";
  const accessibleActionLabel = `${state === "playing"
    ? "Pause pronunciation"
    : state === "paused"
      ? "Resume pronunciation"
      : state === "error"
        ? "Retry pronunciation"
        : state === "unavailable"
          ? "Pronunciation unavailable"
          : state === "loading"
            ? "Loading pronunciation"
            : "Play pronunciation"}${target}${asset ? `. ${asset.sourceLabel}.` : ""}`;
  const disabled = state === "loading" || state === "unavailable" || (variant === "default" && state === "playing");

  const audioElement = asset ? <audio
    ref={audioRef}
    src={asset.src}
    preload="metadata"
    onLoadedMetadata={() => { if (!preparingPlaybackRef.current) setState("ready"); }}
    onCanPlay={() => { if (!preparingPlaybackRef.current) setState((current) => current === "playing" || current === "paused" ? current : "ready"); }}
    onEnded={() => { setState("ready"); onComplete?.(); }}
    onError={() => { setState("error"); onFailure?.(); }}
  /> : null;

  if (variant === "icon") {
    return <div className={`inline-flex shrink-0 ${className}`.trim()} data-audio-state={state}>
      {audioElement}
      <button
        type="button"
        onClick={() => void playOrRetry()}
        disabled={disabled}
        aria-label={accessibleActionLabel}
        title={accessibleActionLabel}
        className={`inline-grid size-11 place-items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${state === "error" ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : state === "playing" ? "border-blue-700 bg-blue-700 text-white" : "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-400 hover:bg-blue-100"} disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400`}
      >
        <AudioIcon state={state} />
      </button>
      <span className="sr-only" aria-live="polite">{asset?.sourceLabel ?? "Pronunciation audio"}. {statusText}</span>
    </div>;
  }

  return <div className={`rounded-xl border border-blue-100 bg-blue-50 p-3 ${className}`.trim()} data-audio-state={state}>
    {audioElement}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-blue-800">{asset?.sourceLabel ?? "Pronunciation audio"}</p>
        <p className="mt-1 text-xs text-slate-600" aria-live="polite">{statusText}</p>
      </div>
      <button
        type="button"
        onClick={() => void playOrRetry()}
        disabled={disabled}
        className="inline-flex min-h-11 min-w-32 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
      >
        {actionText}
      </button>
    </div>
  </div>;
}
