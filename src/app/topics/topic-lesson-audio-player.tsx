"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicAudioAsset } from "@/lib/audio/assets";

type LessonTrack = {
  assetId: string;
  hanzi: string;
  pinyin: string;
  audioAsset?: PublicAudioAsset;
};

const SPEEDS = [0.75, 1, 1.25] as const;

export function TopicLessonAudioPlayer({ lessonTitle, tracks }: { lessonTitle: string; tracks: LessonTrack[] }) {
  const playable = tracks.filter((track): track is LessonTrack & { audioAsset: PublicAudioAsset } => Boolean(track.audioAsset));
  const audioRef = useRef<HTMLAudioElement>(null);
  const pendingPlayRef = useRef(false);
  const [index, setIndex] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<(typeof SPEEDS)[number]>(1);
  const [autoPlay, setAutoPlay] = useState(true);
  const [status, setStatus] = useState<"ready" | "playing" | "error">("ready");
  const current = playable[index];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
    if (pendingPlayRef.current) {
      pendingPlayRef.current = false;
      void audio.play().then(() => setStatus("playing")).catch(() => setStatus("error"));
    }
  }, [playbackRate, index]);

  async function play(position = index) {
    const audio = audioRef.current;
    if (!audio || !playable[position]) return;
    if (position !== index) {
      setIndex(position);
      return;
    }
    try {
      audio.playbackRate = playbackRate;
      await audio.play();
      setStatus("playing");
    } catch {
      setStatus("error");
    }
  }

  async function playSelected(position: number) {
    pendingPlayRef.current = true;
    setIndex(position);
    setStatus("ready");
  }

  function handleEnded() {
    if (autoPlay && index < playable.length - 1) void playSelected(index + 1);
    else setStatus("ready");
  }

  if (!current) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">Lesson audio is unavailable.</div>;

  return <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4" aria-label={`${lessonTitle} continuous audio`}>
    <audio ref={audioRef} key={current.audioAsset.id} src={current.audioAsset.src} preload="metadata" onEnded={handleEnded} onPlay={() => setStatus("playing")} onPause={() => setStatus("ready")} onError={() => setStatus("error")} />
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-800">Continuous lesson audio</p><p className="mt-1 text-xl font-black text-slate-950" lang="zh-Hans">{current.hanzi}</p><p className="break-words text-sm font-bold text-blue-700">{current.pinyin}</p><p className="mt-1 text-xs text-slate-600">Track {index + 1} of {playable.length} · {status === "playing" ? "Playing" : status === "error" ? "Playback failed" : "Ready"}</p></div>
      <button type="button" onClick={() => void play()} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-black text-white hover:bg-emerald-800">Play lesson</button>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-emerald-200 pt-3">
      <span className="text-sm font-bold text-slate-700">Speed</span>
      {SPEEDS.map((speed) => <button key={speed} type="button" aria-pressed={playbackRate === speed} onClick={() => setPlaybackRate(speed)} className={`min-h-11 rounded-lg px-3 text-sm font-bold ${playbackRate === speed ? "bg-slate-900 text-white" : "border border-slate-300 bg-white text-slate-700"}`}>{speed}×</button>)}
      <label className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={autoPlay} onChange={(event) => setAutoPlay(event.target.checked)} /> Auto-play</label>
    </div>
    <ol className="mt-3 grid gap-2 sm:grid-cols-2">{playable.map((track, position) => <li key={track.assetId}><button type="button" onClick={() => void playSelected(position)} aria-current={position === index ? "true" : undefined} className={`min-h-11 w-full rounded-lg px-3 text-left text-sm font-bold ${position === index ? "bg-emerald-700 text-white" : "bg-white text-slate-700"}`}><span lang="zh-Hans">{track.hanzi}</span> · {track.pinyin}</button></li>)}</ol>
  </section>;
}
