import runtimeIndex from "../content/runtime-content-index.json" with { type: "json" };
import legacyHsk1Audio from "../content/legacy-hsk1-audio.json" with { type: "json" };
import legacyHsk23Audio from "../content/legacy-hsk23-audio.json" with { type: "json" };
import legacyHsk4Audio from "../content/legacy-hsk4-audio.json" with { type: "json" };
import legacyHsk5Audio from "../content/legacy-hsk5-audio.json" with { type: "json" };
import type { AudioAssetKind, PublishedAudioAsset, PublicAudioAsset } from "./assets.ts";
export type { PublicAudioAsset } from "./assets.ts";

// Word pages only need published content audio. Keep training banks out of this path.
const synthesizedLabel = (kind: AudioAssetKind): PublishedAudioAsset["sourceLabel"] =>
  kind === "word" ? "Synthesized pronunciation" : "Synthesized listening audio";

const contentAssets = new Map(runtimeIndex.publishedAudioAssets.flatMap((asset) => {
  if (asset.authorization.status !== "authorized" || asset.qaStatus !== "approved") return [];
  const kind = asset.audioKind as AudioAssetKind;
  const published: PublishedAudioAsset = {
    id: asset.id,
    src: `/${asset.storageKey}`,
    text: "",
    kind,
    sourceType: "synthesized",
    sourceLabel: synthesizedLabel(kind),
    provider: "Microsoft Azure AI Speech",
    voice: asset.voice.replace(/^Microsoft\s+/, ""),
    authorization: {
      status: "authorized",
      license: asset.authorization.license,
      evidenceUrl: asset.authorization.evidenceUrl,
    },
    qa: { lifecycle: "published", content: "approved", technical: "approved" },
  };
  return [[asset.contentAssetId, published] as const];
}));
for (const [contentAssetId, storageKey] of [...legacyHsk1Audio.audio, ...legacyHsk23Audio.audio, ...legacyHsk4Audio.audio, ...legacyHsk5Audio.audio] as Array<[string, string, string]>) {
  if (contentAssets.has(contentAssetId)) continue;
  contentAssets.set(contentAssetId, {
    id: `legacy-audio:${contentAssetId}`, src: `/${storageKey}`, text: "",
    kind: "word", sourceType: "synthesized", sourceLabel: "Synthesized pronunciation",
    provider: "Microsoft Azure AI Speech", voice: "zh-CN-XiaoxiaoNeural",
    authorization: { status: "authorized", license: "HSKKit streaming audio license v1", evidenceUrl: "https://hskkit.com/content-license" },
    qa: { lifecycle: "published", content: "approved", technical: "approved" },
  });
}
export function publishedContentAudioAsset(contentAssetId: string, text: string): PublishedAudioAsset | undefined {
  const asset = contentAssets.get(contentAssetId);
  return asset ? { ...asset, text } : undefined;
}

export function publicAudioAsset(asset: PublishedAudioAsset | undefined): PublicAudioAsset | undefined {
  if (!asset) return undefined;
  const { text: _text, ...safe } = asset;
  void _text;
  return safe;
}
