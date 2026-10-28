"use client";

import { AudioButton } from "./audio-button";
import { AudioPlaybackControl } from "./audio-playback-control";
import type { PublicAudioAsset } from "@/lib/audio/assets";

export function DictionaryPronunciation({
  hanzi,
  pinyin,
  asset,
}: {
  hanzi: string;
  pinyin: string;
  asset?: PublicAudioAsset;
}) {
  return <div className="mt-4 flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-left">
    {asset
      ? <AudioPlaybackControl asset={asset} variant="icon" label={hanzi} />
      : <AudioButton text={hanzi} variant="icon" label={`Play browser voice preview for ${hanzi}`} />}
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-blue-200">
        {asset ? "Pronunciation" : "Voice preview"}
      </p>
      <p className="mt-0.5 text-xs leading-5 text-slate-300">
        {asset
          ? `${pinyin} · ${asset.sourceLabel}`
          : "Temporary Mandarin guide; voice varies by device."}
      </p>
    </div>
  </div>;
}
