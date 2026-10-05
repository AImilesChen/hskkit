import runtimeIndex from "../content/runtime-content-index.json" with { type: "json" };
import canonicalRelease from "../../../content/releases/hsk3-gf0025-2021-v2.json" with { type: "json" };

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

type CanonicalEntry=(typeof canonicalRelease.entries)[number];
const contentAssets=canonicalRelease.entries;
const audioAssets = runtimeIndex.publishedAudioAssets;

function canonicalLevelBand(level:number){
  if(!Number.isInteger(level)||level<1||level>9)throw new Error("INVALID_LEVEL");
  return level>=7?"7-9":String(level);
}

function toPackWord(asset:CanonicalEntry,level:number):PackWord{
  return {
    id:asset.id,version:asset.id.match(/\.v(\d+)$/)?.[1]??"1",contentVersion:asset.content_version,
    standardVersion:asset.standard_version,level,hanzi:asset.hanzi,pinyin:asset.pinyin,meaning:asset.meaning,
    partOfSpeech:asset.partOfSpeech,sourceRef:asset.source_ref,licenseRef:asset.license_ref,
    publishStatus:"published",qaStatus:"approved",authorizationStatus:"authorized",
  };
}

export function selectPackAssets(level: number): PackSelection {
  const band=canonicalLevelBand(level);
  const eligible=contentAssets.filter(asset=>asset.level_band===band&&asset.publish_status==="published"&&asset.qa_status==="approved"&&Boolean(asset.source_ref)&&Boolean(asset.license_ref));
  if (!eligible.length) throw new Error("CONTENT_NOT_RELEASED");
  const words:PackWord[]=eligible.map(asset=>toPackWord(asset,level));
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
  try{const manifest=JSON.parse(manifestJson) as {schemaVersion?:string;productId?:string;sourceIndependent?:boolean;assets?:PackManifest["assets"]}; if(!Array.isArray(manifest.assets))return false;if(manifest.assets.length===0)return manifest.schemaVersion==="hskkit-product-manifest-v1"&&["30-day-planner","practice-assessment-pack"].includes(manifest.productId??"")&&manifest.sourceIndependent===true;
    const byId=new Map(contentAssets.map(asset=>[asset.id,asset]));
    return manifest.assets.every(ref=>{const asset=byId.get(ref.id); return Boolean(
      asset&&(asset.id.match(/\.v(\d+)$/)?.[1]??"1")===ref.version&&Boolean(asset.source_ref)&&Boolean(asset.license_ref),
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
    licenseNotice: "Text includes CC BY-SA 4.0 material. Attribution and source references are preserved in this manifest. The purchaser may print any number of copies for personal study or learners they teach, without charge; printed copies and digital files may not be sold or resold.",
  };
}
