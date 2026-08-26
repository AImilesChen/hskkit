import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildPackManifest, selectPackAssets } from "../src/lib/commercial/catalog.ts";
import { generatePackPdf, generateZipFiles } from "../src/lib/commercial/generator.ts";
import { generateDifferentiatedProductArtifact } from "../src/lib/commercial/product-generator.ts";
import { buildProductDeliveries, DIGITAL_PRODUCTS } from "../src/lib/commercial/products.ts";

const generationVersion=process.env.GENERATION_VERSION||"p0-p1-v2";
if(!/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(generationVersion)||generationVersion==="."||generationVersion==="..")throw new Error("INVALID_GENERATION_VERSION");
const outputRoot=resolve(process.argv[2]||"/tmp/hskkit-commercial-artifacts");
const [fontBytes,emojiBytes]=await Promise.all([
  readFile(new URL("../assets/fonts/HskKitSansSubset.ttf",import.meta.url)),
  readFile(new URL("../assets/fonts/HskKitEmoji.ttf",import.meta.url)),
]);
const levelArtifacts=new Map<number,{bytes:Uint8Array;manifest:Record<string,unknown>}>();
for(let level=1;level<=9;level++){
  const selection=selectPackAssets(level);const packManifest=buildPackManifest(selection,generationVersion);const manifest=packManifest as unknown as Record<string,unknown>;
  levelArtifacts.set(level,{bytes:await generatePackPdf(selection,packManifest,fontBytes,emojiBytes),manifest});
}
async function save(productId:string,deliveryKey:string,format:"pdf"|"zip",bytes:Uint8Array,manifest:Record<string,unknown>){
  const dir=resolve(outputRoot,generationVersion,productId);await mkdir(dir,{recursive:true});
  const delivery=buildProductDeliveries(productId).find(item=>item.deliveryKey===deliveryKey);
  if(!delivery||delivery.format!==format)throw new Error("PRODUCT_DELIVERY_MISMATCH");
  const sidecar={...manifest,templateProductId:productId,templateDeliveryKey:deliveryKey,templateFormat:format,templateLevel:delivery.level??null};
  await Promise.all([writeFile(resolve(dir,`${deliveryKey}.${format}`),bytes),writeFile(resolve(dir,`${deliveryKey}.manifest.json`),JSON.stringify(sidecar,null,2))]);
  console.log(JSON.stringify({productId,deliveryKey,format,bytes:bytes.byteLength}));
}
for(const product of DIGITAL_PRODUCTS){
  const deliveries=buildProductDeliveries(product.id);
  if(product.category==="level"){
    const level=product.levels[0];const artifact=levelArtifacts.get(level)!;await save(product.id,deliveries[0].deliveryKey,"pdf",artifact.bytes,artifact.manifest);continue;
  }
  if(product.category==="bundle"){
    for(const delivery of deliveries.filter(item=>item.artifactType==="level")){
      const artifact=levelArtifacts.get(delivery.level!)!;await save(product.id,delivery.deliveryKey,"pdf",artifact.bytes,artifact.manifest);
    }
    const files=product.levels.map(level=>({name:`HSKKit-Level-${level}.pdf`,data:levelArtifacts.get(level)!.bytes}));
    const manifest={schemaVersion:"hskkit-bundle-manifest-v1",productId:product.id,standard:"HSK 3.0",standardVersion:"GF0025-2021",generationVersion,officialExam:false,levels:product.levels,advancedBandDisclosure:"HSK 3.0 defines one unified Levels 7–9 advanced ability band; the Level 7/8/9 PDFs use the same canonical approved source set.",assets:product.levels.flatMap(level=>levelArtifacts.get(level)!.manifest.assets as unknown[]),licenseNotice:"Personal, non-transferable study and print use only."};
    const bytes=generateZipFiles([...files,{name:"manifest.json",data:new TextEncoder().encode(JSON.stringify(manifest,null,2))}]);
    await save(product.id,"bundle-zip","zip",bytes,manifest);continue;
  }
  const artifact=await generateDifferentiatedProductArtifact(product.id,fontBytes,emojiBytes,generationVersion);
  await save(product.id,deliveries[0].deliveryKey,artifact.format,artifact.bytes,artifact.manifest as unknown as Record<string,unknown>);
}
