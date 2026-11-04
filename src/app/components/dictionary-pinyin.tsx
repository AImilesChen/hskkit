import { pinyinDisplaySegments } from "@/lib/dictionary/pinyin-display";

export function DictionaryPinyin({ text }: { text: string }) {
  return <span className="dictionary-tone-pinyin" lang="zh-Latn">{pinyinDisplaySegments(text).map((segment, index) => <span key={index} data-tone={segment.tone ?? "unknown"}>{segment.text}</span>)}</span>;
}

export function PinyinToneGuide() {
  return <details className="dictionary-tone-guide"><summary>Tone colours</summary><p>Colours follow the written tone marks; the marks remain visible.</p><ul>{["mā", "má", "mǎ", "mà", "ma"].map((text, index) => <li key={text}><DictionaryPinyin text={text} /><span>{index < 4 ? `Tone ${index + 1}` : "Neutral"}</span></li>)}</ul></details>;
}
