import runtimeIndex from "../content/runtime-content-index.json" with { type: "json" };

export type PackWord = {
  id: string;
  version: string;
  contentVersion: string;
  standardVersion: string;
  level: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  partOfSpeech: string;
  sourceRef: string;
  licenseRef: string;
  publishStatus: "published";
  qaStatus: "approved";
  authorizationStatus: "authorized";
};
export type PackExercise = { id: string; prompt: string; answer: string; sourceAssetId: string };
export type PackSelection = { level: number; words: PackWord[]; exercises: PackExercise[]; audio: Array<{ id: string }> };
export type PackManifest = {
  schemaVersion: "hskkit-pack-manifest-v1";
  generationVersion: string;
  standard: "HSK 3.0";
  standardVersion: "GF0025-2021";
  level: number;
  assets: Array<{ id: string; version: string; contentVersion: string; sourceRef: string; licenseRef: string }>;
  excludedAudioReason: "offline_redistribution_not_authorized";
  licenseNotice: string;
};

const contentAssets = Object.values(runtimeIndex.runtimeWords).flat();
const audioAssets = runtimeIndex.publishedAudioAssets;

export function selectPackAssets(level: number): PackSelection {
  if (!Number.isInteger(level) || level < 1 || level > 9) throw new Error("INVALID_LEVEL");
  const levelAssets=(runtimeIndex.runtimeWords as Record<string,typeof contentAssets>)[String(level)]??[];
  const eligible = levelAssets.filter((asset) =>
    Boolean(asset.sourceRef) && Boolean(asset.licenseRef),
  ).slice(0, 120);
  if (!eligible.length) throw new Error("CONTENT_NOT_RELEASED");
  const words: PackWord[] = eligible.map((asset) => ({
    id: asset.id,
    version: String(asset.version),
    contentVersion: asset.contentVersion,
    standardVersion: asset.standardVersion,
    level,
    hanzi: asset.hanzi,
    pinyin: asset.pinyin,
    meaning: asset.meaning,
    partOfSpeech: asset.partOfSpeech,
    sourceRef: asset.sourceRef,
    licenseRef: asset.licenseRef,
    publishStatus: "published",
    qaStatus: "approved",
    authorizationStatus: "authorized",
  }));
  const exercises = words.slice(0, 20).map((word, index) => ({
    id: `exercise-${level}-${index + 1}`,
    prompt: `${index + 1}. Write the meaning and pinyin for “${word.hanzi}”.`,
    answer: `${word.pinyin} — ${word.meaning}`,
    sourceAssetId: word.id,
  }));
  const audio = audioAssets
    .filter((asset) => asset.level === level && asset.qaStatus === "approved" && asset.authorization.status === "authorized" && asset.usageRights.offlineRedistribution)
    .map((asset) => ({ id: asset.id }));
  return { level, words, exercises, audio };
}

export function manifestStillAuthorized(manifestJson:string|null|undefined){
  if(!manifestJson)return false;
  try{const manifest=JSON.parse(manifestJson) as {schemaVersion?:string;productId?:string;sourceIndependent?:boolean;assets?:PackManifest["assets"]}; if(!Array.isArray(manifest.assets))return false;if(manifest.assets.length===0)return manifest.schemaVersion==="hskkit-product-manifest-v1"&&manifest.productId==="30-day-planner"&&manifest.sourceIndependent===true;
    const byId=new Map(contentAssets.map(asset=>[asset.id,asset]));
    return manifest.assets.every(ref=>{const asset=byId.get(ref.id); return Boolean(
      asset&&String(asset.version)===ref.version&&Boolean(asset.sourceRef)&&Boolean(asset.licenseRef),
    );});
  }catch{return false;}
}

export function buildPackManifest(selection: PackSelection, generationVersion: string): PackManifest {
  if (!generationVersion.trim()) throw new Error("GENERATION_VERSION_REQUIRED");
  return {
    schemaVersion: "hskkit-pack-manifest-v1",
    generationVersion,
    standard: "HSK 3.0",
    standardVersion: "GF0025-2021",
    level: selection.level,
    assets: selection.words.map((word) => ({ id: word.id, version: word.version, contentVersion: word.contentVersion, sourceRef: word.sourceRef, licenseRef: word.licenseRef })),
    excludedAudioReason: "offline_redistribution_not_authorized",
    licenseNotice: "Text includes CC BY-SA 4.0 material. Attribution and source references are preserved in this manifest. Personal, non-transferable study/print use only.",
  };
}
