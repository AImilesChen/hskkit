"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicAudioAsset } from "@/lib/audio/assets";

export type AudioPlaybackState = "loading" | "ready" | "playing" | "paused" | "error" | "unavailable";
export type PlayableAudioAsset = Pick<PublicAudioAsset, "id" | "src" | "sourceLabel" | "durationSeconds">;

type VerificationState = "idle" | "verifying" | "verified";

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

function formatSeconds(value: number) {
  const seconds = Math.max(0, Math.floor(value));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function AudioPlaybackControl({
  asset,
  beforePlay,
  onComplete,
  onFailure,
  onStateChange,
  className = "",
  variant = "default",
  label,
  showProgress = false,
  verificationState = "idle",
}: {
  asset?: PlayableAudioAsset;
  beforePlay?: () => Promise<boolean | void>;
  onComplete?: () => void;
  onFailure?: () => void;
  onStateChange?: (state: AudioPlaybackState) => void;
  className?: string;
  variant?: "default" | "icon";
  label?: string;
  showProgress?: boolean;
  verificationState?: "idle" | "verifying" | "verified";
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const preparingPlaybackRef = useRef(false);
  const [state, setState] = useState<AudioPlaybackState>(asset ? "loading" : "unavailable");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(asset?.durationSeconds ?? 0);

  useEffect(() => {
    const audio = audioRef.current;
    setState(asset ? "loading" : "unavailable");
    setCurrentTime(0);
    setDuration(asset?.durationSeconds ?? 0);
    if (!audio || !asset) return;
    audio.load();
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : asset.durationSeconds ?? 0);
      setState("ready");
    }
  }, [asset?.durationSeconds, asset?.id, asset?.src]);

  useEffect(() => {
    onStateChange?.(state);
  }, [onStateChange, state]);

  async function playOrRetry() {
    const audio = audioRef.current;
    if (!audio || !asset || verificationState === "verifying" || preparingPlaybackRef.current || state === "loading") return;
    if (state === "playing") {
      audio.pause();
      setState("paused");
      return;
    }

    const resuming = state === "paused";
    try {
      preparingPlaybackRef.current = true;
      setState("loading");
      if (state === "error") audio.load();
      if (!resuming) {
        setCurrentTime(0);
        audio.currentTime = 0;
        const allowed = await beforePlay?.();
        if (allowed === false) {
          preparingPlaybackRef.current = false;
          // A rejected verification request does not mean the audio failed to load.
          setState(state === "error" ? "error" : "ready");
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

  const progressText = state === "playing" && duration > 0
    ? `Playing ${formatSeconds(currentTime)} / ${formatSeconds(duration)}`
    : state === "paused" && duration > 0
      ? `Paused ${formatSeconds(currentTime)} / ${formatSeconds(duration)}`
      : undefined;
  const statusText = verificationState === "verifying"
    ? "Playback finished — confirming playback…"
    : verificationState === "verified" && state !== "playing" && state !== "loading"
      ? "Playback complete"
      : progressText ?? (state === "loading"
        ? "Loading audio…"
        : state === "playing"
          ? "Playing…"
          : state === "paused"
            ? "Paused"
            : state === "error"
              ? "Audio could not be loaded."
              : state === "unavailable"
                ? "Audio unavailable"
                : variant === "default" ? "Ready to play" : "Ready");
  const actionText = verificationState === "verifying"
    ? "Verifying playback…"
    : state === "error"
      ? "Retry audio"
      : state === "playing"
        ? "Pause audio"
        : state === "paused"
          ? "Resume audio"
          : state === "loading"
            ? "Loading audio…"
            : state === "unavailable"
              ? "Audio unavailable"
              : verificationState === "verified" ? "Play again" : "Play audio";
  const target = label ? ` for ${label}` : "";
  const accessibleActionLabel = `${state === "playing"
    ? variant === "icon" ? "Pause pronunciation" : "Pause audio"
    : state === "paused"
      ? "Resume pronunciation"
      : state === "error"
        ? variant === "icon" ? "Retry pronunciation" : "Retry audio"
        : state === "unavailable"
          ? variant === "icon" ? "Pronunciation unavailable" : "Audio unavailable"
          : state === "loading"
            ? variant === "icon" ? "Loading pronunciation" : "Loading audio"
            : verificationState === "verified"
              ? variant === "icon" ? "Play pronunciation again" : "Play audio again"
              : variant === "icon" ? "Play pronunciation" : "Play audio"}${target}${asset ? `. ${asset.sourceLabel}.` : ""}`;
  const unavailable = state === "unavailable";
  const busy = state === "loading" || verificationState === "verifying";
  const disabled = unavailable || state === "loading" || verificationState === "verifying";
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const audioElement = asset ? <audio
    ref={audioRef}
    src={asset.src}
    preload="metadata"
    onLoadedMetadata={(event) => {
      const measured = event.currentTarget.duration;
      setDuration(Number.isFinite(measured) ? measured : asset.durationSeconds ?? 0);
      if (!preparingPlaybackRef.current) setState("ready");
    }}
    onCanPlay={() => { if (!preparingPlaybackRef.current) setState((current) => current === "playing" || current === "paused" ? current : "ready"); }}
    onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
    onEnded={(event) => { setCurrentTime(event.currentTarget.duration); setState("ready"); onComplete?.(); }}
    onError={() => { setState("error"); onFailure?.(); }}
  /> : null;

  if (variant === "icon") {
    return <div className={`inline-flex shrink-0 ${className}`.trim()} data-audio-state={state}>
      {audioElement}
      <button
        type="button"
        onClick={() => void playOrRetry()}
        disabled={disabled}
        aria-disabled={busy || unavailable}
        aria-busy={state === "loading"}
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
      <div className="min-w-48 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-800">{asset?.sourceLabel ?? "Pronunciation audio"}</p>
        <p className="mt-1 text-xs text-slate-600" aria-live="polite">{statusText}</p>
        {showProgress && duration > 0 && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100" role="progressbar" aria-label="Audio playback progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <span className="block h-full rounded-full bg-blue-700 transition-[width]" style={{ width: `${progress}%` }} />
        </div>}
      </div>
      <button
        type="button"
        onClick={() => void playOrRetry()}
        disabled={disabled}
        aria-disabled={busy || unavailable}
        aria-busy={state === "loading" || verificationState === "verifying"}
        aria-label={accessibleActionLabel}
        className="inline-flex min-h-11 min-w-40 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
      >
        <AudioIcon state={verificationState === "verifying" ? "loading" : state} />
        <span>{actionText}</span>
      </button>
    </div>
  </div>;
}
