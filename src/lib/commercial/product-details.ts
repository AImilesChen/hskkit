import {DIGITAL_PRODUCTS,digitalProduct,productDeliverableLabels,type DigitalProduct,type DigitalProductId} from "./products.ts";
import {resourceProductDetail,type ResourceProductDetail} from "./resource-products.ts";

export type StoreProductDetail=ResourceProductDetail;

const sample=(src:string,label:string,caption:string)=>({src,alt:`Readable ${label} sample from the actual HSKKit delivery file`,label,caption});
const vocabularySamples:Partial<Record<DigitalProductId,StoreProductDetail["samplePages"]>>={
  "level-1":[sample("/store/samples/vocabulary/level-1-sample-1.webp","Level 1 opening page","Inspect the real entry layout, tone-marked pinyin, English meaning and canonical source ID."),sample("/store/samples/vocabulary/level-1-sample-2.webp","Level 1 interior page","Confirm the same readable structure continues through the complete 500-entry file.")],
  "level-2":[sample("/store/samples/vocabulary/level-2-sample-1.webp","Level 2 opening page","A real rendered page from the complete 772-entry searchable PDF."),sample("/store/samples/vocabulary/level-2-sample-2.webp","Level 2 interior page","Inspect Chinese, pinyin, English and traceable source IDs before checkout.")],
  "level-3":[sample("/store/samples/vocabulary/level-3-sample-1.webp","Level 3 opening page","A real rendered page from the complete 973-entry searchable PDF."),sample("/store/samples/vocabulary/level-3-sample-2.webp","Level 3 interior page","Confirm readable wrapping and complete entry fields in the actual delivery format.")],
  "level-4":[sample("/store/samples/vocabulary/level-4-sample-1.webp","Level 4 opening page","A real rendered page from the complete 1,000-entry searchable PDF."),sample("/store/samples/vocabulary/level-4-sample-2.webp","Level 4 interior page","Inspect the denser vocabulary layout at a practical reading scale.")],
  "level-5":[sample("/store/samples/vocabulary/level-5-sample-1.webp","Level 5 opening page","A real rendered page from the complete 1,071-entry searchable PDF."),sample("/store/samples/vocabulary/level-5-sample-2.webp","Level 5 interior page","Confirm long English meanings wrap on word boundaries without clipping.")],
  "level-6":[sample("/store/samples/vocabulary/level-6-sample-1.webp","Level 6 opening page","A real rendered page from the complete 1,140-entry searchable PDF."),sample("/store/samples/vocabulary/level-6-sample-2.webp","Level 6 interior page","Inspect the actual Chinese, pinyin, English and source-ID presentation.")],
  "starter-1-3":[sample("/store/samples/vocabulary/starter-1-3-sample-1.webp","Level 1 component","The Bundle includes the complete Level 1 PDF, not a shortened sample list."),sample("/store/samples/vocabulary/starter-1-3-sample-2.webp","Level 3 component","A real interior page from another complete component PDF in this Bundle.")],
  "progression-4-6":[sample("/store/samples/vocabulary/progression-4-6-sample-1.webp","Level 4 component","The Bundle includes the complete Level 4 PDF with canonical source IDs."),sample("/store/samples/vocabulary/progression-4-6-sample-2.webp","Level 6 component","A real interior page from the complete Level 6 component PDF.")],
  "advanced-7-9":[sample("/store/samples/vocabulary/advanced-7-9-sample-1.webp","Advanced index opening","The official Advanced 7–9 vocabulary is represented as one unified complete index."),sample("/store/samples/vocabulary/advanced-7-9-sample-2.webp","Advanced index interior","A real interior page from the 5,636-entry complete index; reading volumes are only usability divisions.")],
  "complete-1-9":[sample("/store/samples/vocabulary/complete-1-9-sample-1.webp","Level 1 component","The complete library starts with the full Level 1 PDF."),sample("/store/samples/vocabulary/complete-1-9-sample-2.webp","Advanced component","The same purchase includes the full unified Advanced 7–9 index and reading volumes.")],
};

const bundleSamples:Record<"learner-practice-toolkit"|"exam-preparation-bundle",StoreProductDetail["samplePages"]>={
  "learner-practice-toolkit":[sample("/store/samples/worksheet-pack/quick-start.webp","Worksheet workflow","Read the actual Worksheet Pack workflow included in this Bundle."),sample("/store/samples/30-day-planner/day-8-routes.webp","Planner daily routes","Inspect the distinct 20, 30 and 45-minute routes included in the Planner component.")],
  "exam-preparation-bundle":[sample("/store/samples/practice-assessment-pack/timed-instructions.webp","Assessment instructions","Read the actual timed checkpoint instructions included in this Bundle."),sample("/store/samples/30-day-planner/assessment-mapping.webp","Assessment mapping","See how the Planner turns the weakest diagnostic result into a concrete practice assignment.")],
};

function vocabularyDetail(product:DigitalProduct):StoreProductDetail{
  const samples=vocabularySamples[product.id]??[];
  const isBundle=product.category==="bundle";
  const advanced=product.id==="advanced-7-9";
  return {id:product.id,slug:product.id,name:product.name,amountCents:product.amountCents,
    eyebrow:isBundle?"Complete HSK 3.0 vocabulary Bundle":"Complete HSK 3.0 vocabulary PDF",
    promise:advanced?"Study the complete official Advanced 7–9 vocabulary as one unified band.":`Download the complete ${product.vocabularyCount?.toLocaleString("en-US")}‑entry vocabulary set—never a preview subset.`,
    summary:product.description,audience:["Independent learners building an offline reference","Tutors who need a searchable, printable vocabulary source","Learners who want canonical source IDs and traceability"],
    outcomes:["Search Chinese, tone-marked pinyin and English meanings in one consistent layout","Keep every canonical source ID for verification and updates",isBundle?"Use complete component PDFs separately or keep the verified offline ZIP":"Print or annotate one complete level without relying on a bounded app preview"],
    inside:productDeliverableLabels(product.id),formats:isBundle?["Searchable component PDFs","Offline ZIP","manifest.json, README, licence and checksums"]:["One searchable PDF","Manifest and licence information","14-day private access with 3 successful downloads"],
    howToUse:["Open the readable samples and confirm the entry structure suits your study workflow.","Search Hanzi, pinyin, English meaning or canonical source ID in the delivered PDF.","Keep the manifest and checksum files with the download when using a Bundle."],
    previewImage:samples[0]?.src??"/store/previews/worksheet-pack.webp",previewAlt:samples[0]?.alt??`${product.name} readable delivery sample`,previewPages:[],samplePages:samples,
    fit:{idealFor:["You need the complete stated vocabulary count","You value searchable PDFs and source traceability","You want an offline personal study copy"],notFor:["You need official separate Level 7, 8 and 9 word lists", "You need audio lessons or an interactive course","You intend to redistribute or resell the files"],facts:[`${product.vocabularyCount?.toLocaleString("en-US")} unique canonical entries`,"Personal, non-transferable study and print use only","14-day access · 3 successful downloads per delivery"]},
    faqs:[{question:"Is this the complete dataset?",answer:`Yes. The delivery contract requires exactly ${product.vocabularyCount?.toLocaleString("en-US")} unique canonical source IDs and rejects preview-index subsets.`},{question:"Are Advanced Levels 7, 8 and 9 separate lists?",answer:"No. HSK 3.0 defines one unified Advanced 7–9 vocabulary band. Any reading volumes are HSKKit usability divisions, not official separate level lists."},{question:"Can I redistribute the files?",answer:"No. The purchase grants personal, non-transferable study and print use only."}]};
}

function resourceBundleDetail(product:DigitalProduct):StoreProductDetail{
  const samples=bundleSamples[product.id as keyof typeof bundleSamples];
  const components=(product.componentProductIds??[]).map(id=>digitalProduct(id)?.name).filter(Boolean) as string[];
  return {id:product.id,slug:product.id,name:product.name,amountCents:product.amountCents,eyebrow:"Multi-resource HSK 3.0 Bundle",promise:product.description,summary:`One purchase delivers ${components.join(", ")} as complete products in one checksum-verified Bundle.`,audience:["Learners who want one connected practice system","Tutors assigning structured independent work","Students who prefer complete files over subscriptions"],outcomes:["Combine guided practice with a defined review loop","Keep each component as a complete standalone resource","Pay once instead of purchasing each included component separately"],inside:[...components.map(name=>`Complete ${name}`),"Combined manifest, README, licence and SHA-256 checksums"],formats:["One combined ZIP","Complete component ZIP files","Searchable PDFs and component-native formats"],howToUse:["Inspect both readable component samples before checkout.","Download and verify the combined ZIP, then open each component README.","Follow the included workflow from diagnosis or planning into practice and review."],previewImage:samples[0].src,previewAlt:samples[0].alt,previewPages:[],samplePages:samples,fit:{idealFor:["You want every listed component in one purchase","You will use the resources for personal study","You prefer printable and offline files"],notFor:["You need an official HSK exam product","You need a subscription or live teaching","You intend to share files with another purchaser"],facts:[`${components.length} complete component products`,"Personal, non-transferable study and print use only","14-day access · 3 successful downloads"]},faqs:[{question:"Are these shortened Bundle editions?",answer:"No. Each listed component is packaged as its complete product delivery."},{question:"Does this include official exams?",answer:"No. Practice assessments are original, unofficial diagnostic materials."},{question:"Can I buy a component separately?",answer:"Yes. Each component remains available as an individual product."}]};
}

export const storeProductDetails:StoreProductDetail[]=DIGITAL_PRODUCTS.map(product=>{
  const rich=resourceProductDetail(product.id);
  if(rich)return {...rich,id:product.id,slug:product.id,name:product.name,amountCents:product.amountCents};
  if(product.category==="resource_bundle")return resourceBundleDetail(product);
  return vocabularyDetail(product);
});
export function storeProductDetail(id:unknown){return storeProductDetails.find(product=>product.id===id||product.slug===id)??null;}
