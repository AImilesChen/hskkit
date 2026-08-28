import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { buildPackManifest, selectPackAssets, type PackSelection } from "../src/lib/commercial/catalog.ts";
import { generatePackPdf, generateZipFiles } from "../src/lib/commercial/generator.ts";
import { generateDifferentiatedProductArtifact } from "../src/lib/commercial/product-generator.ts";
import { buildProductDeliveries, DEFAULT_PRODUCT_GENERATION_VERSION, DIGITAL_PRODUCTS, generationVersionForProduct } from "../src/lib/commercial/products.ts";

const selectedProductId=process.env.PRODUCT_ID?.trim();
const vocabularyOnly=process.env.VOCABULARY_ONLY==="1";
const requestedGenerationVersion=process.env.GENERATION_VERSION?.trim();
if(requestedGenerationVersion&&(!/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(requestedGenerationVersion)||requestedGenerationVersion==="."||requestedGenerationVersion===".."))throw new Error("INVALID_GENERATION_VERSION");
const outputRoot=resolve(process.argv[2]||"/tmp/hskkit-commercial-artifacts");
if(selectedProductId&&!DIGITAL_PRODUCTS.some(product=>product.id===selectedProductId))throw new Error("INVALID_PRODUCT_ID");
const [fontBytes,emojiBytes,assessmentAudioA,assessmentAudioB,assessmentAudioC]=await Promise.all([
  readFile(new URL("../assets/fonts/HskKitSansSubset.ttf",import.meta.url)),
  readFile(new URL("../assets/fonts/HskKitEmoji.ttf",import.meta.url)),
  readFile(new URL("../assets/audio/mock-assessment-v2/form-A.mp3",import.meta.url)),
  readFile(new URL("../assets/audio/mock-assessment-v2/form-B.mp3",import.meta.url)),
  readFile(new URL("../assets/audio/mock-assessment-v2/form-C.mp3",import.meta.url)),
]);
const assessmentAudio={A:new Uint8Array(assessmentAudioA),B:new Uint8Array(assessmentAudioB),C:new Uint8Array(assessmentAudioC)};
const levelGenerationVersion=requestedGenerationVersion||DEFAULT_PRODUCT_GENERATION_VERSION;
const levelArtifacts=new Map<number,{bytes:Uint8Array;manifest:Record<string,unknown>;selection:PackSelection}>();
for(let level=1;level<=7;level++){
  const selection=selectPackAssets(level);const packManifest=buildPackManifest(selection,levelGenerationVersion);const manifest=packManifest as unknown as Record<string,unknown>;
  levelArtifacts.set(level,{bytes:await generatePackPdf(selection,packManifest,fontBytes,emojiBytes),manifest,selection});
}
async function advancedVolumeArtifacts(){
  const complete=levelArtifacts.get(7)!;const total=complete.selection.words.length;const size=Math.ceil(total/3);
  const volumes=[];
  for(let index=0;index<3;index++){
    const selection={...complete.selection,words:complete.selection.words.slice(index*size,Math.min((index+1)*size,total)),exercises:[]} satisfies PackSelection;
    const manifest=buildPackManifest(selection,levelGenerationVersion);
    volumes.push({name:`HSKKit-Advanced-7-9-Reading-Volume-${index+1}-of-3.pdf`,data:await generatePackPdf(selection,manifest,fontBytes,emojiBytes,{label:`Advanced 7–9 Reading Volume ${index+1} of 3`})});
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
async function vocabularyBundleFiles(productId:string,levels:number[]){
  const files:Array<{name:string;data:Uint8Array}>=[];
  for(const level of levels){
    const artifact=levelArtifacts.get(level)!;
    files.push({name:level===7?"HSKKit-Advanced-7-9-Complete-Index.pdf":`HSKKit-Level-${level}-Complete-Vocabulary.pdf`,data:artifact.bytes});
    if(level===7)files.push(...await advancedVolumeArtifacts());
  }
  const readme=new TextEncoder().encode(`HSKKit ${productId} offline vocabulary library. Every entry is from the canonical GF0025-2021 release. Advanced 7–9 is one official unified band; the three reading volumes are HSKKit usability divisions, not separate official level lists.\n`);
  const licence=new TextEncoder().encode("Personal, non-transferable study and print use only. Text includes CC BY-SA 4.0 material; attribution and source references are preserved in manifest.json.\n");
  return [...files,{name:"README.txt",data:readme},{name:"LICENSE.txt",data:licence}];
}
for(const product of DIGITAL_PRODUCTS){
  if(selectedProductId&&product.id!==selectedProductId)continue;
  if(vocabularyOnly&&product.category!=="level"&&product.category!=="bundle")continue;
  const generationVersion=requestedGenerationVersion||generationVersionForProduct(product.id);
  const deliveries=buildProductDeliveries(product.id);
  if(product.category==="level"){
    const level=product.levels[0];const artifact=levelArtifacts.get(level)!;await save(product.id,deliveries[0].deliveryKey,"pdf",artifact.bytes,artifact.manifest,generationVersion);continue;
  }
  if(product.category==="bundle"){
    for(const delivery of deliveries.filter(item=>item.artifactType==="level")){
      const artifact=levelArtifacts.get(delivery.level!)!;await save(product.id,delivery.deliveryKey,"pdf",artifact.bytes,artifact.manifest,generationVersion);
    }
    const assets=product.levels.flatMap(level=>levelArtifacts.get(level)!.manifest.assets as unknown[]);
    const manifest={schemaVersion:"hskkit-bundle-manifest-v2",productId:product.id,standard:"HSK 3.0",standardVersion:"GF0025-2021",generationVersion,officialExam:false,levels:product.levels,vocabularyCount:product.vocabularyCount,advancedBandDisclosure:"HSK 3.0 defines one unified Advanced 7–9 vocabulary band. Reading volumes are HSKKit usability divisions, not official separate level lists.",assets,licenseNotice:"Personal, non-transferable study and print use only."};
    const files=await vocabularyBundleFiles(product.id,product.levels);const manifestFile={name:"manifest.json",data:new TextEncoder().encode(JSON.stringify(manifest,null,2))};const payload=[...files,manifestFile];
    const bytes=generateZipFiles([...payload,{name:"checksums.sha256",data:checksumFile(payload)}]);
    await save(product.id,"bundle-zip","zip",bytes,manifest,generationVersion);continue;
  }
  if(product.category==="resource_bundle"){
    const componentFiles=[] as Array<{name:string;data:Uint8Array}>;
    for(const componentId of product.componentProductIds??[]){
      const component=await generateDifferentiatedProductArtifact(componentId,fontBytes,emojiBytes,generationVersion,assessmentAudio);
      componentFiles.push({name:`${componentId}.${component.format}`,data:component.bytes});
    }
    const manifest={schemaVersion:"hskkit-product-manifest-v1",productId:product.id,generationVersion,standard:"HSK 3.0",standardVersion:"GF0025-2021",officialExam:false,levels:product.levels,componentProductIds:product.componentProductIds,files:componentFiles.map(file=>file.name),licenseNotice:"Personal, non-transferable study and print use only."};
    const manifestFile={name:"manifest.json",data:new TextEncoder().encode(JSON.stringify(manifest,null,2))};
    const readme={name:"README.txt",data:new TextEncoder().encode(`HSKKit ${product.name}. Each included ZIP is the complete standalone component product. Read each component README before use.\n`)};
    const licence={name:"LICENSE.txt",data:new TextEncoder().encode("Personal, non-transferable study and print use only. This notice applies to every component and generated file in this Bundle.\n")};
    const payload=[...componentFiles,manifestFile,readme,licence];
    const bytes=generateZipFiles([...payload,{name:"checksums.sha256",data:checksumFile(payload)}]);
    await save(product.id,"product","zip",bytes,manifest,generationVersion);continue;
  }
  const artifact=await generateDifferentiatedProductArtifact(product.id,fontBytes,emojiBytes,generationVersion,assessmentAudio);
  await save(product.id,deliveries[0].deliveryKey,artifact.format,artifact.bytes,artifact.manifest as unknown as Record<string,unknown>,generationVersion);
}
