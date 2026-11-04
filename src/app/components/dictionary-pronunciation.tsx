"use client";

import { AudioButton } from "./audio-button";
import { AudioPlaybackControl } from "./audio-playback-control";
import type { PublicAudioAsset } from "@/lib/audio/assets";
import { DictionaryPinyin, PinyinToneGuide } from "./dictionary-pinyin";

export function DictionaryPronunciation({
  hanzi,
  pinyin,
  asset,
}: {
  hanzi: string;
  pinyin: string;
  asset?: PublicAudioAsset;
}) {
  return <div className="dictionary-pronunciation">
    <p className="dictionary-word-pinyin"><DictionaryPinyin text={pinyin} /></p>
    {asset
      ? <AudioPlaybackControl asset={asset} variant="icon" label={hanzi} />
      : <AudioButton text={hanzi} variant="icon" label={`Play browser voice preview for ${hanzi}`} />}
    <p className="dictionary-audio-note">{asset ? asset.sourceLabel : "Browser voice preview · Temporary Mandarin guide; voice varies by device."}</p>
    <PinyinToneGuide />
  </div>;
}
