import runtimeIndex from "../content/runtime-content-index.json" with { type: "json" };
import canonicalRelease from "../../../content/releases/hsk3-gf0025-2021-v2.json" with { type: "json" };
import hsk1CommercialRelease from "../../../content/releases/hsk1-2025-commercial-v1.json" with { type: "json" };
import hsk23CommercialRelease from "../../../content/releases/hsk23-2025-commercial-v1.json" with { type: "json" };
import hsk4CommercialRelease from "../../../content/releases/hsk4-2025-commercial-v1.json" with { type: "json" };
import hsk5CommercialRelease from "../../../content/releases/hsk5-2025-commercial-v1.json" with { type: "json" };
import hsk6CommercialRelease from "../../../content/releases/hsk6-2025-commercial-v1.json" with { type: "json" };
import hsk789CommercialRelease from "../../../content/releases/hsk789-2025-commercial-v1.json" with { type: "json" };
import {VOCABULARY_PRODUCT_LICENSE} from "./products.ts";

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
  standardVersion: "GF0025-2021" | "HSK-EXAM-2025";
  level: number;
  assets: Array<{ id: string; version: string; contentVersion: string; sourceRef: string; licenseRef: string }>;
  excludedAudioReason: "offline_redistribution_not_authorized";
  licenseNotice: string;
};

type CanonicalEntry=(typeof canonicalRelease.entries)[number] | (typeof hsk1CommercialRelease.entries)[number] | (typeof hsk23CommercialRelease.entries)[number] | (typeof hsk4CommercialRelease.entries)[number] | (typeof hsk5CommercialRelease.entries)[number] | (typeof hsk6CommercialRelease.entries)[number] | (typeof hsk789CommercialRelease.entries)[number];
const contentAssets=canonicalRelease.entries;
const currentHsk1Assets=hsk1CommercialRelease.entries;
const currentHsk23Assets=hsk23CommercialRelease.entries;
const currentHsk4Assets=hsk4CommercialRelease.entries;
const currentHsk5Assets=hsk5CommercialRelease.entries;
const currentHsk6Assets=hsk6CommercialRelease.entries;
const currentAdvancedAssets=hsk789CommercialRelease.entries;
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

export function selectPackAssets(level: number, catalogVersion: "legacy" | "hsk1-2025" | "hsk123-2025" | "hsk1234-2025" | "hsk12345-2025" | "hsk123456-2025" | "hsk123456789-2025" = "legacy"): PackSelection {
  const band=canonicalLevelBand(level);
  const newAll=catalogVersion==="hsk123456789-2025";
  const source=(catalogVersion!=="legacy")&&level===1?currentHsk1Assets:
    (newAll||catalogVersion==="hsk123-2025"||catalogVersion==="hsk1234-2025"||catalogVersion==="hsk12345-2025"||catalogVersion==="hsk123456-2025")&&(level===2||level===3)?currentHsk23Assets:
    (newAll||catalogVersion==="hsk1234-2025"||catalogVersion==="hsk12345-2025"||catalogVersion==="hsk123456-2025")&&level===4?currentHsk4Assets:
    (newAll||catalogVersion==="hsk12345-2025"||catalogVersion==="hsk123456-2025")&&level===5?currentHsk5Assets:
    (newAll||catalogVersion==="hsk123456-2025")&&level===6?currentHsk6Assets:
    newAll&&level>=7?currentAdvancedAssets:contentAssets;
  const eligible=source.filter(asset=>asset.level_band===band&&asset.publish_status==="published"&&asset.qa_status==="approved"&&Boolean(asset.source_ref)&&Boolean(asset.license_ref));
  if (!eligible.length) throw new Error("CONTENT_NOT_RELEASED");
  const words:PackWord[]=eligible.map(asset=>toPackWord(asset,level));
  const exerciseCount=Math.min(20,words.length);
  const exercises = Array.from({length:exerciseCount},(_,index)=>words[Math.floor(index*(words.length-1)/Math.max(1,exerciseCount-1))]).map((word, index) => ({
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
  try{const manifest=JSON.parse(manifestJson) as {schemaVersion?:string;productId?:string;sourceIndependent?:boolean;assets?:PackManifest["assets"]}; if(!Array.isArray(manifest.assets))return false;if(manifest.assets.length===0)return manifest.schemaVersion==="hskkit-product-manifest-v1"&&["worksheet-pack","30-day-planner","practice-assessment-pack"].includes(manifest.productId??"")&&manifest.sourceIndependent===true;
    const byId=new Map([...contentAssets,...currentHsk1Assets,...currentHsk23Assets,...currentHsk4Assets,...currentHsk5Assets,...currentHsk6Assets,...currentAdvancedAssets].map(asset=>[asset.id,asset]));
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
    standardVersion: selection.words.every(word=>word.standardVersion==="HSK-EXAM-2025")?"HSK-EXAM-2025":"GF0025-2021",
    level: selection.level,
    assets: selection.words.map((word) => ({ id: word.id, version: word.version, contentVersion: word.contentVersion, sourceRef: word.sourceRef, licenseRef: word.licenseRef })),
    excludedAudioReason: "offline_redistribution_not_authorized",
    licenseNotice: selection.words[0]?.standardVersion==="HSK-EXAM-2025"
      ?`${selection.level>=7?"Unified Advanced 7–9 band":"Level "+selection.level} placement follows the 2025 HSK exam syllabus. Pinyin, part-of-speech labels and English learner glosses were edited by HSKKit; adapted earlier definitions retain CC BY-SA 4.0 rights. Source details: https://hskkit.com/content-license. ${VOCABULARY_PRODUCT_LICENSE}`
      :`HSK 3.0 level membership follows GF0025-2021. Pinyin and available POS labels are adapted from ivankra/hsk30 (MIT); English definitions are adapted from CC-CEDICT (CC BY-SA 4.0). Source details: https://hskkit.com/content-license. ${VOCABULARY_PRODUCT_LICENSE}`,
  };
}
