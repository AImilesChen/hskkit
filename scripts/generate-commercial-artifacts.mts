import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { buildPackManifest, selectPackAssets, type PackSelection } from "../src/lib/commercial/catalog.ts";
import { generatePackPdf, generateZipFiles, HSK30_MIT_NOTICE } from "../src/lib/commercial/generator.ts";
import { generateDifferentiatedProductArtifact, type AssessmentLevelAudio } from "../src/lib/commercial/product-generator.ts";
import { buildProductDeliveries, DIGITAL_PRODUCTS, HSK1_VOCABULARY_GENERATION_VERSION, generationVersionForProduct, productLicenseNotice } from "../src/lib/commercial/products.ts";

const selectedProductIds=(process.env.PRODUCT_IDS||process.env.PRODUCT_ID||"").split(",").map(id=>id.trim()).filter(Boolean);
const vocabularyOnly=process.env.VOCABULARY_ONLY==="1";
const requestedGenerationVersion=process.env.GENERATION_VERSION?.trim();
if(requestedGenerationVersion&&(!/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(requestedGenerationVersion)||requestedGenerationVersion==="."||requestedGenerationVersion===".."))throw new Error("INVALID_GENERATION_VERSION");
const outputRoot=resolve(process.argv[2]||"/tmp/hskkit-commercial-artifacts");
if(selectedProductIds.some(id=>!DIGITAL_PRODUCTS.some(product=>product.id===id)))throw new Error("INVALID_PRODUCT_ID");
const [fontBytes,emojiBytes,assessmentAudioA,assessmentAudioB,assessmentAudioC]=await Promise.all([
  readFile(new URL("../assets/fonts/HskKitSansSubset.ttf",import.meta.url)),
  readFile(new URL("../assets/fonts/HskKitEmoji.ttf",import.meta.url)),
  readFile(new URL("../assets/audio/mock-assessment-v2/form-A.mp3",import.meta.url)),
  readFile(new URL("../assets/audio/mock-assessment-v2/form-B.mp3",import.meta.url)),
  readFile(new URL("../assets/audio/mock-assessment-v2/form-C.mp3",import.meta.url)),
]);
const assessmentAudio={A:new Uint8Array(assessmentAudioA),B:new Uint8Array(assessmentAudioB),C:new Uint8Array(assessmentAudioC)};
async function loadAssessmentLevelAudio():Promise<AssessmentLevelAudio>{
  const dir=new URL("../assets/audio/mock-assessment-v2/",import.meta.url);
  const index=new Uint8Array(await readFile(new URL("timing-index.json",dir)));
  const parsed=JSON.parse(new TextDecoder().decode(index)) as {forms:Record<string,{levelTracks:Array<{file:string}>}>};
  const entries=Object.values(parsed.forms).flatMap(form=>form.levelTracks);
  const tracks:Record<string,Uint8Array>={};
  for(const track of entries)tracks[track.file]=new Uint8Array(await readFile(new URL(track.file,dir)));
  return {index,tracks};
}
const assessmentLevelAudio=await loadAssessmentLevelAudio();
const levelArtifacts=new Map<string,{bytes:Uint8Array;manifest:Record<string,unknown>;selection:PackSelection}>();
async function getLevelArtifact(level:number,generationVersion:string){
  const key=`${generationVersion}:${level}`;
  let artifact=levelArtifacts.get(key);
  if(!artifact){
    const selection=selectPackAssets(level,generationVersion===HSK1_VOCABULARY_GENERATION_VERSION?"hsk1-2025":"legacy");
    const packManifest=buildPackManifest(selection,generationVersion);
    artifact={bytes:await generatePackPdf(selection,packManifest,fontBytes,emojiBytes),manifest:packManifest as unknown as Record<string,unknown>,selection};
    levelArtifacts.set(key,artifact);
  }
  return artifact;
}
async function advancedVolumeArtifacts(generationVersion:string){
  const complete=await getLevelArtifact(7,generationVersion);const total=complete.selection.words.length;const size=Math.ceil(total/3);
  const volumes=[];
  for(let index=0;index<3;index++){
    const selection={...complete.selection,words:complete.selection.words.slice(index*size,Math.min((index+1)*size,total)),exercises:[]} satisfies PackSelection;
    const manifest=buildPackManifest(selection,generationVersion);
    volumes.push({name:`HSKKit-Advanced-7-9-Reading-Volume-${index+1}-of-3.pdf`,data:await generatePackPdf(selection,manifest,fontBytes,emojiBytes,{label:`Advanced 7–9 · Reading Volume ${index+1}/3`,entryNumberOffset:index*size,totalAdvancedCount:total})});
  }
  return volumes;
}
async function save(productId:string,deliveryKey:string,format:"pdf"|"zip",bytes:Uint8Array,manifest:Record<string,unknown>,generationVersion:string){
  const dir=resolve(outputRoot,generationVersion,productId);await mkdir(dir,{recursive:true});
  const delivery=buildProductDeliveries(productId).find(item=>item.deliveryKey===deliveryKey);
  if(!delivery||delivery.format!==format)throw new Error("PRODUCT_DELIVERY_MISMATCH");
  const templateChecksumSha256=createHash("sha256").update(bytes).digest("hex");
  const sidecar={...manifest,templateProductId:productId,templateDeliveryKey:deliveryKey,templateFormat:format,templateLevel:delivery.level??null,templateChecksumSha256};
  await Promise.all([writeFile(resolve(dir,`${deliveryKey}.${format}`),bytes),writeFile(resolve(dir,`${deliveryKey}.manifest.json`),JSON.stringify(sidecar,null,2))]);
  console.log(JSON.stringify({productId,deliveryKey,format,bytes:bytes.byteLength,sha256:templateChecksumSha256}));
}
function checksumFile(files:Array<{name:string;data:Uint8Array}>){return new TextEncoder().encode(files.map(file=>`${createHash("sha256").update(file.data).digest("hex")}  ${file.name}`).join("\n")+"\n");}
async function vocabularyBundleFiles(productId:string,levels:number[],generationVersion:string){
  const files:Array<{name:string;data:Uint8Array}>=[];
  for(const level of levels){
    const artifact=await getLevelArtifact(level,generationVersion);
    files.push({name:level===7?"HSKKit-Advanced-7-9-Complete-Index.pdf":`HSKKit-Level-${level}-Complete-Vocabulary.pdf`,data:artifact.bytes});
    if(level===7)files.push(...await advancedVolumeArtifacts(generationVersion));
  }
  const includes2025Hsk1=levels.includes(1)&&generationVersion===HSK1_VOCABULARY_GENERATION_VERSION;
  const scope=includes2025Hsk1
    ?"The Level 1 PDF follows the 2025 HSK exam syllabus and contains 300 entries. Other level PDFs retain their separately published scope and version."
    :"The GF0025-2021 standard determines the level scope.";
  const advancedNote=levels.includes(7)?"The Advanced 7–9 complete index contains all 5,636 Advanced entries. Three HSKKit reading volumes repeat that index in smaller parts; do not add their counts to the total. They are not official separate Level 7, 8 and 9 lists.\n\n":"";
  const readme=new TextEncoder().encode(`HSKKit ${productId} offline vocabulary library.\n${scope} These are independent HSKKit study materials, not an official exam product.\n\nIncluded PDFs:\n${files.map(file=>`- ${file.name}`).join("\n")}\n\n${advancedNote}Use the pinyin-initial index and page numbers in each PDF, or search the PDF text.\n\nSee LICENSE.txt for purchaser permissions and preserved third-party rights; manifest.json and checksums.sha256 document file integrity and sources.\n`);
  const credits=includes2025Hsk1?"Level 1 placement: 2025 HSK exam syllabus (https://www.chinesetest.cn/HSK); HSKKit-edited pinyin, POS and glosses, with adapted definitions under CC BY-SA 4.0. Other level PDFs: GF0025-2021 level membership; ivankra/hsk30 commit 4ff9e391 (MIT; pinyin, POS and variants); CC-CEDICT snapshot e0d756cb (CC BY-SA 4.0; English definitions).":"GF0025-2021 level membership; ivankra/hsk30 commit 4ff9e391 (MIT; pinyin, POS and variants); CC-CEDICT snapshot e0d756cb (CC BY-SA 4.0; English definitions).";
  const licence=new TextEncoder().encode(`${productLicenseNotice(productId)}\n\nSource credits: ${credits} Source and licence links: https://hskkit.com/content-license and https://creativecommons.org/licenses/by-sa/4.0/. Full per-entry references are preserved in manifest.json.\n\n${HSK30_MIT_NOTICE}\n`);
  return [...files,{name:"README.txt",data:readme},{name:"LICENSE.txt",data:licence}];
}
for(const product of DIGITAL_PRODUCTS){
  if(selectedProductIds.length&&!selectedProductIds.includes(product.id))continue;
  if(vocabularyOnly&&product.category!=="level"&&product.category!=="bundle")continue;
  const generationVersion=requestedGenerationVersion||generationVersionForProduct(product.id);
  const deliveries=buildProductDeliveries(product.id);
  if(product.category==="level"){
    const level=product.levels[0];const artifact=await getLevelArtifact(level,generationVersion);await save(product.id,deliveries[0].deliveryKey,"pdf",artifact.bytes,artifact.manifest,generationVersion);continue;
  }
  if(product.category==="bundle"){
    for(const delivery of deliveries.filter(item=>item.artifactType==="level")){
      const artifact=await getLevelArtifact(delivery.level!,generationVersion);await save(product.id,delivery.deliveryKey,"pdf",artifact.bytes,artifact.manifest,generationVersion);
    }
    const components=await Promise.all(product.levels.map(level=>getLevelArtifact(level,generationVersion)));
    const assets=components.flatMap(artifact=>artifact.manifest.assets as unknown[]);
    const includes2025Hsk1=product.levels.includes(1)&&generationVersion===HSK1_VOCABULARY_GENERATION_VERSION;
    const manifest={schemaVersion:"hskkit-bundle-manifest-v2",productId:product.id,standard:"HSK 3.0",standardVersion:includes2025Hsk1?"mixed-hsk1-2025-and-earlier-levels":"GF0025-2021",generationVersion,officialExam:false,levels:product.levels,vocabularyCount:product.vocabularyCount,advancedBandDisclosure:"HSK 3.0 defines one unified Advanced 7–9 vocabulary band. Reading volumes are HSKKit usability divisions, not official separate level lists.",assets,licenseNotice:productLicenseNotice(product.id)};
    const files=await vocabularyBundleFiles(product.id,product.levels,generationVersion);const manifestFile={name:"manifest.json",data:new TextEncoder().encode(JSON.stringify(manifest,null,2))};const payload=[...files,manifestFile];
    const bytes=generateZipFiles([...payload,{name:"checksums.sha256",data:checksumFile(payload)}]);
    await save(product.id,"bundle-zip","zip",bytes,manifest,generationVersion);continue;
  }
  if(product.category==="resource_bundle"){
    const componentFiles=[] as Array<{name:string;data:Uint8Array}>;
    const componentVersions=[] as Array<{productId:string;generationVersion:string;sha256:string}>;
    for(const componentId of product.componentProductIds??[]){
      const componentVersion=generationVersionForProduct(componentId);
      const component=await generateDifferentiatedProductArtifact(componentId,fontBytes,emojiBytes,componentVersion,assessmentAudio,assessmentLevelAudio);
      componentFiles.push({name:`${componentId}.${component.format}`,data:component.bytes});
      componentVersions.push({productId:componentId,generationVersion:componentVersion,sha256:createHash("sha256").update(component.bytes).digest("hex")});
    }
    const isLearnerToolkit=product.id==="learner-practice-toolkit";
    const manifest={schemaVersion:"hskkit-product-manifest-v1",productId:product.id,generationVersion,standard:"HSK 3.0",standardVersion:"GF0025-2021",officialExam:false,levels:product.levels,componentProductIds:product.componentProductIds,files:componentFiles.map(file=>file.name),components:componentVersions,licenseNotice:productLicenseNotice(product.id)};
    const manifestFile={name:"manifest.json",data:new TextEncoder().encode(JSON.stringify(manifest,null,2))};
    const learnerReadme=[
      "HSKKit Learner Practice Toolkit | START HERE",
      "This bundle includes the complete current Worksheet Pack, Assessment Tracker and 30-Day Planner as three separate ZIPs. Unzip the outer bundle, then unzip the component you need. Each component has its own README.",
      "",
      "1. Choose a current HSK level and start with the Assessment Tracker Blank workbook. Follow its guide to record a small first attempt; the worked example is fictional and must not be entered as your own result.",
      "2. Set a goal and choose one 20, 30 or 45-minute route in the 30-Day Planner. The planner is a schedule, not a self-contained course: use level-appropriate material for tasks it does not supply, especially keyed listening audio and writing feedback.",
      "3. Complete a Worksheet module without its answer key, then check the matching IDs and correct missed items. Use the printable Progress Checklist to schedule a later retry.",
      "4. Record new dated attempts in the Assessment Tracker and review progress weekly. Its Assessment Log and Full Library Scoring are separate views; update both yourself if you want both summaries. The Planner and Worksheet also do not sync automatically with the Tracker.",
      "",
      "The three component ZIPs are standalone products, not shortened editions. This bundle has no listening audio or official HSK exam. Levels 7-9 use one unified advanced source band. The manifest names each component version and its SHA-256; checksums.sha256 verifies the outer files.",
      "The purchaser may keep downloaded files without a time limit. The 14-day access window and three-download allowance apply only to retrieving this outer ZIP. Read LICENSE.txt and each component README for printing permissions.",
    ].join("\n")+"\n";
    const examReadme=[
      "HSKKit Exam Preparation Bundle | START HERE",
      "This download contains the complete current Worksheet Pack, Practice Assessment Pack and 30-Day Planner as separate ZIPs. Unzip the outer bundle, then unzip each component. Use the version and SHA-256 entries in manifest.json to identify the exact component releases.",
      "",
      "1. Choose one current HSK level and Form A in the Practice Assessment Pack. This is a short, unofficial diagnostic, not a full-length official HSK mock exam. Print the matching student and answer-sheet pages; play the level-only MP3, not the nine-level full-form MP3, for a one-level sitting.",
      "2. Score the attempt with the matching explanations and score report. Record vocabulary, listening, reading and writing results. Mark an unmeasured skill as NOT MEASURED rather than zero. Level 1 writing is an extra learning diagnostic, not an official Level 1 exam section.",
      "3. Enter the lowest measured skill in the Planner's Assessment mapping. Choose a 20, 30 or 45-minute route and use the Worksheet Pack for level-matched practice. The Planner and Worksheet do not sync with the Assessment score tracker; record progress yourself.",
      "4. Use fresh questions on Form B around the midpoint and Form C at the end. Compare results with the same scoring method; review missed question IDs and keep a dated record of your next action.",
      "",
      "The Practice Assessment Pack includes three full-form MP3s spanning all levels and 27 level-only MP3s. Levels 7-9 use one unified advanced source band. The three component ZIPs are complete products, not shortened bundle editions. Read each component README for page maps and honest limits.",
      "The 14-day access window and three-download allowance limit retrieval of this outer ZIP only. Downloaded files do not expire. See LICENSE.txt for the purchaser's printing rights.",
    ].join("\n")+"\n";
    const readme={name:"README.txt",data:new TextEncoder().encode(isLearnerToolkit?learnerReadme:examReadme)};
    const licenceText=[productLicenseNotice(product.id),...componentVersions.map(({productId})=>`${productId}: ${productLicenseNotice(productId)}`)].join("\n")+"\n";
    const licence={name:"LICENSE.txt",data:new TextEncoder().encode(licenceText)};
    const payload=[...componentFiles,manifestFile,readme,licence];
    const bytes=generateZipFiles([...payload,{name:"checksums.sha256",data:checksumFile(payload)}]);
    await save(product.id,"product","zip",bytes,manifest,generationVersion);continue;
  }
  const artifact=await generateDifferentiatedProductArtifact(product.id,fontBytes,emojiBytes,generationVersion,assessmentAudio,assessmentLevelAudio);
  await save(product.id,deliveries[0].deliveryKey,artifact.format,artifact.bytes,artifact.manifest as unknown as Record<string,unknown>,generationVersion);
}
