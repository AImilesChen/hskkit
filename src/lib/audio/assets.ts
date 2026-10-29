import runtimeIndex from "../content/runtime-content-index.json" with { type: "json" };
import legacyHsk1Audio from "../content/legacy-hsk1-audio.json" with { type: "json" };
import listeningBank from "../learning/listening-library.json" with { type: "json" };
import listeningManifest from "../learning/listening-library-audio.json" with { type: "json" };
import practiceManifest from "../practice/audio-assets.json" with { type: "json" };

export type AudioAssetKind = "word" | "sentence" | "context" | "listening";
export type AudioSourceType = "synthesized" | "human-recorded";

export type AudioAuthorization = {
  status: "authorized";
  license: string;
  evidenceUrl: string;
};

export type PublishedAudioAsset = {
  id: string;
  src: string;
  text: string;
  durationSeconds?: number;
  kind: AudioAssetKind;
  sourceType: AudioSourceType;
  sourceLabel: "Synthesized pronunciation" | "Synthesized listening audio" | "Native-speaker recording";
  provider: string;
  voice?: string;
  authorization: AudioAuthorization;
  qa: {
    lifecycle: "published";
    content: "approved";
    technical: "approved";
  };
};

export type PublicAudioAsset = Omit<PublishedAudioAsset, "text">;

const synthesizedLabel = (kind: AudioAssetKind): PublishedAudioAsset["sourceLabel"] =>
  kind === "word" ? "Synthesized pronunciation" : "Synthesized listening audio";

const publicAsset = (asset: PublishedAudioAsset): PublicAudioAsset => {
  const { text: _text, ...safe } = asset;
  void _text;
  return safe;
};

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
for (const [contentAssetId, storageKey] of legacyHsk1Audio.audio as Array<[string, string, string]>) {
  if (contentAssets.has(contentAssetId)) continue;
  contentAssets.set(contentAssetId, {
    id: `legacy-audio:${contentAssetId}`, src: `/${storageKey}`, text: "",
    kind: "word", sourceType: "synthesized", sourceLabel: "Synthesized pronunciation",
    provider: "Microsoft Azure AI Speech", voice: "zh-CN-XiaoxiaoNeural",
    authorization: { status: "authorized", license: "HSKKit streaming audio license v1", evidenceUrl: "https://hskkit.com/content-license" },
    qa: { lifecycle: "published", content: "approved", technical: "approved" },
  });
}
const contentLogicalIdToContentAssetId = new Map(runtimeIndex.publishedAudioAssets.map((asset) => [asset.logicalId, asset.contentAssetId]));
for (const [contentAssetId, , logicalId] of legacyHsk1Audio.audio as Array<[string, string, string]>) {
  if (!contentLogicalIdToContentAssetId.has(logicalId)) contentLogicalIdToContentAssetId.set(logicalId, contentAssetId);
}

const practiceAssets = new Map(practiceManifest.assets.flatMap((asset) => {
  if (asset.authorization.status !== "authorized" || asset.qaStatus !== "approved" || asset.lifecycleStatus !== "published") return [];
  const published: PublishedAudioAsset = {
    id: asset.id,
    src: `/${asset.storageKey}`,
    text: asset.text,
    kind: "listening",
    sourceType: "synthesized",
    sourceLabel: "Synthesized listening audio",
    provider: "HSKKit synthesized audio pipeline",
    authorization: {
      status: "authorized",
      license: asset.authorization.license,
      evidenceUrl: asset.authorization.evidenceUrl,
    },
    qa: { lifecycle: "published", content: "approved", technical: "approved" },
  };
  return [[asset.id, published] as const];
}));

const listeningGroups = new Map(listeningBank.groups.map((group) => [group.id, group]));
const listeningAssets = new Map(listeningManifest.assets.flatMap((asset) => {
  const group = listeningGroups.get(asset.id);
  if (!group || group.voiceText !== asset.text || group.audioSrc !== `/${asset.storageKey}`) return [];
  if (
    asset.authorization.status !== "authorized"
    || asset.contentQaStatus !== "approved"
    || asset.technicalQaStatus !== "approved"
    || asset.lifecycleStatus !== "published"
  ) return [];
  const published: PublishedAudioAsset = {
    id: asset.id,
    src: `/${asset.storageKey}`,
    text: asset.text,
    durationSeconds: asset.durationSeconds,
    kind: "listening",
    sourceType: "synthesized",
    sourceLabel: "Synthesized listening audio",
    provider: "Microsoft Azure AI Speech",
    voice: asset.voice,
    authorization: {
      status: "authorized",
      license: asset.authorization.license,
      evidenceUrl: asset.authorization.evidenceUrl,
    },
    qa: { lifecycle: "published", content: "approved", technical: "approved" },
  };
  return [[asset.id, published] as const];
}));

export function publishedContentAudioAsset(contentAssetId: string, text: string): PublishedAudioAsset | undefined {
  const asset = contentAssets.get(contentAssetId);
  return asset ? { ...asset, text } : undefined;
}

export function publishedContentAudioAssetByLogicalId(logicalId: string, text: string): PublishedAudioAsset | undefined {
  const contentAssetId = contentLogicalIdToContentAssetId.get(logicalId);
  return contentAssetId ? publishedContentAudioAsset(contentAssetId, text) : undefined;
}

export function publishedPracticeAudioAsset(assetId: string): PublishedAudioAsset | undefined {
  return practiceAssets.get(assetId);
}

export function publishedListeningAudioAsset(assetId: string): PublishedAudioAsset | undefined {
  return listeningAssets.get(assetId);
}

/** Returns only a duration from a published, QA-approved asset whose public URL is trusted. */
export function publishedAudioDurationBySrc(src: string | undefined): number | undefined {
  if (!src) return undefined;
  const asset = [...listeningAssets.values(), ...practiceAssets.values(), ...contentAssets.values()]
    .find((candidate) => candidate.src === src);
  return asset?.durationSeconds;
}

export function publicAudioAsset(asset: PublishedAudioAsset | undefined): PublicAudioAsset | undefined {
  return asset ? publicAsset(asset) : undefined;
}
