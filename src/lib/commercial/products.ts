export const DIGITAL_CURRENCY="usd" as const;
export const DIGITAL_ACCESS_DAYS=14;
export const DIGITAL_REFUND_DAYS=7;
export const DIGITAL_DOWNLOAD_LIMIT=3;
export const DEFAULT_PRODUCT_GENERATION_VERSION="complete-vocabulary-v1";
export const PLANNER_GENERATION_VERSION="planner-progress-xlsx-v4";
export const PRACTICE_ASSESSMENT_GENERATION_VERSION="practice-score-xlsx-v2";
export const TEACHER_PACK_GENERATION_VERSION="teacher-pack-v3";
export const WORKSHEET_GENERATION_VERSION="worksheet-editorial-v16";
export const PERSONAL_PRODUCT_LICENSE="Personal, non-transferable study and print use only.";
export const TEACHER_CLASSROOM_LICENSE="Single-purchaser classroom licence: the purchaser may adapt editable files and print or share student handouts only with learners they personally teach at one teaching site. No resale, public upload, shared-drive distribution, sublicensing, transfer or use by another teacher.";

export type DigitalProductId=
  |`level-${1|2|3|4|5|6}`
  |"starter-1-3"|"progression-4-6"|"advanced-7-9"|"complete-1-9"
  |"worksheet-pack"|"assessment-tracker"|"30-day-planner"|"practice-assessment-pack"
  |"learner-practice-toolkit"|"exam-preparation-bundle"|"teacher-lesson-plan-pack";
export type DigitalProductCategory="level"|"bundle"|"resource"|"resource_bundle"|"teacher";
export type DigitalProduct={
  id:DigitalProductId;sku:string;name:string;shortName:string;amountCents:number;currency:"usd";
  category:DigitalProductCategory;levels:number[];description:string;format:"pdf"|"zip";
  vocabularyCount?:number;componentProductIds?:DigitalProductId[];
};

const levelDefinitions=[
  {level:1,count:500,amountCents:399},{level:2,count:772,amountCents:599},{level:3,count:973,amountCents:799},
  {level:4,count:1000,amountCents:1099},{level:5,count:1071,amountCents:1399},{level:6,count:1140,amountCents:1799},
] as const;
const levelProducts=levelDefinitions.map(({level,count,amountCents})=>({
  id:`level-${level}` as DigitalProductId,sku:`hskkit_hsk3_level_${level}_complete_v2`,name:`HSK ${level} Complete Vocabulary`,shortName:`HSK ${level} Complete`,amountCents,currency:DIGITAL_CURRENCY,category:"level" as const,levels:[level],format:"pdf" as const,vocabularyCount:count,
  description:`All ${count.toLocaleString("en-US")} canonical HSK 3.0 Level ${level} entries with Hanzi, tone-marked pinyin, English meaning, part of speech and source ID.`,
}));
export const DIGITAL_PRODUCTS:readonly DigitalProduct[]=[
  ...levelProducts,
  {id:"starter-1-3",sku:"hskkit_hsk3_starter_1_3_complete_v2",name:"HSK 1–3 Starter Complete",shortName:"Starter 1–3",amountCents:999,currency:DIGITAL_CURRENCY,category:"bundle",levels:[1,2,3],format:"zip",vocabularyCount:2245,description:"All 2,245 canonical HSK 3.0 entries from Levels 1–3 in three searchable PDFs and one offline ZIP."},
  {id:"progression-4-6",sku:"hskkit_hsk3_progression_4_6_v2",name:"HSK 4–6 Progression",shortName:"Progression 4–6",amountCents:2999,currency:DIGITAL_CURRENCY,category:"bundle",levels:[4,5,6],format:"zip",vocabularyCount:3211,description:"All 3,211 canonical HSK 3.0 entries from Levels 4–6 in three searchable PDFs and one offline ZIP."},
  {id:"advanced-7-9",sku:"hskkit_hsk3_advanced_7_9_complete_v2",name:"HSK 3.0 Advanced 7–9 Complete Vocabulary Pack",shortName:"Advanced 7–9",amountCents:3999,currency:DIGITAL_CURRENCY,category:"bundle",levels:[7],format:"zip",vocabularyCount:5636,description:"The complete unified HSK 3.0 Advanced 7–9 band: one complete index plus three HSKKit reading volumes, never presented as official separate Level 7, 8 and 9 lists."},
  {id:"complete-1-9",sku:"hskkit_hsk3_complete_1_9_library_v2",name:"HSK 1–9 Complete Vocabulary Library",shortName:"Complete Library",amountCents:4999,currency:DIGITAL_CURRENCY,category:"bundle",levels:[1,2,3,4,5,6,7],format:"zip",vocabularyCount:11092,description:"All 11,092 canonical HSK 3.0 entries: Levels 1–6 plus the unified Advanced 7–9 band, delivered as searchable PDFs and one offline ZIP."},
  {id:"worksheet-pack",sku:"hskkit_hsk3_worksheet_pack_v2",name:"HSK Worksheet Pack",shortName:"Worksheet",amountCents:1299,currency:DIGITAL_CURRENCY,category:"resource",levels:[1,2,3,4,5,6,7],format:"zip",description:"Levels 1–9 student workbook, model answers, Quick Start and progress checklist."},
  {id:"assessment-tracker",sku:"hskkit_hsk3_assessment_tracker_v2",name:"HSK Assessment Tracker",shortName:"Tracker",amountCents:499,currency:DIGITAL_CURRENCY,category:"resource",levels:[1,2,3,4,5,6,7],format:"zip",description:"Spreadsheet-ready tracker covering all 11,092 canonical entries, with weekly review records, scoring guide and printable checkpoints."},
  {id:"30-day-planner",sku:"hskkit_hsk3_30_day_planner_v2",name:"HSK 30-Day Planner",shortName:"30-Day Planner",amountCents:699,currency:DIGITAL_CURRENCY,category:"resource",levels:[1,2,3,4,5,6,7],format:"zip",description:"Personalized thirty-day study system with Assessment mapping, distinct 20/30/45-minute routes, weekly reviews and recovery worksheet."},
  {id:"practice-assessment-pack",sku:"hskkit_hsk3_practice_assessment_pack_v2",name:"HSK Practice Assessment Pack",shortName:"Practice Assessment",amountCents:1699,currency:DIGITAL_CURRENCY,category:"resource",levels:[1,2,3,4,5,6,7],format:"zip",description:"Three unofficial HSK 3.0 practice assessments with Mandarin MP3 listening, answer sheets, explanations, rubrics, score report and review pathways."},
  {id:"learner-practice-toolkit",sku:"hskkit_hsk3_learner_practice_toolkit_v1",name:"Learner Practice Toolkit",shortName:"Learner Toolkit",amountCents:1699,currency:DIGITAL_CURRENCY,category:"resource_bundle",levels:[1,2,3,4,5,6,7],format:"zip",componentProductIds:["worksheet-pack","assessment-tracker","30-day-planner"],description:"Worksheet, Tracker and 30-Day Planner together for daily practice, planning and evidence-based progress review."},
  {id:"exam-preparation-bundle",sku:"hskkit_hsk3_exam_preparation_bundle_v1",name:"Exam Preparation Bundle",shortName:"Exam Preparation",amountCents:2499,currency:DIGITAL_CURRENCY,category:"resource_bundle",levels:[1,2,3,4,5,6,7],format:"zip",componentProductIds:["worksheet-pack","practice-assessment-pack","30-day-planner"],description:"Worksheet, Practice Assessment and 30-Day Planner together for practice, diagnosis and a structured review cycle."},
  {id:"teacher-lesson-plan-pack",sku:"hskkit_hsk3_teacher_lesson_plan_pack_v2",name:"HSK Teacher Lesson Plan Pack",shortName:"Teacher Pack",amountCents:1999,currency:DIGITAL_CURRENCY,category:"teacher",levels:[1,2,3,4,5,6,7],format:"zip",description:"Classroom-ready plans, handouts, tickets, homework, editable DOCX/PPTX and a bounded single-teacher classroom licence."},
] as const;

export function digitalProduct(value:unknown){return DIGITAL_PRODUCTS.find(product=>product.id===value)??null;}
export function productLicenseNotice(productId:unknown){return productId==="teacher-lesson-plan-pack"?TEACHER_CLASSROOM_LICENSE:PERSONAL_PRODUCT_LICENSE;}
export function generationVersionForProduct(productId:unknown){return productId==="worksheet-pack"||productId==="learner-practice-toolkit"||productId==="exam-preparation-bundle"?WORKSHEET_GENERATION_VERSION:productId==="30-day-planner"?PLANNER_GENERATION_VERSION:productId==="practice-assessment-pack"?PRACTICE_ASSESSMENT_GENERATION_VERSION:productId==="teacher-lesson-plan-pack"?TEACHER_PACK_GENERATION_VERSION:DEFAULT_PRODUCT_GENERATION_VERSION;}
export function productDeliverableLabels(productId:unknown):string[]{
  const product=digitalProduct(productId);if(!product)throw new Error("INVALID_PRODUCT");
  if(product.category==="level")return [`${product.vocabularyCount?.toLocaleString("en-US")} canonical entries in one searchable PDF`,`Manifest and README/licence information`];
  if(product.category==="bundle")return product.id==="advanced-7-9"?["Complete Advanced 7–9 index and three HSKKit reading volumes","Manifest, README/licence and checksums in one ZIP"]:[`${product.levels.length} searchable vocabulary PDFs covering ${product.vocabularyCount?.toLocaleString("en-US")} entries`,`Manifest, README/licence and checksums in one ZIP`];
  if(product.category==="resource_bundle")return [`${product.componentProductIds?.length} complete resource products in one purchase`,`One combined ZIP with manifest, licence and checksums`];
  return buildProductDeliveries(product.id).map(delivery=>delivery.artifactType==="worksheet"?"Seven searchable PDFs: four student editions, answer key, completed samples and progress checklist in one ZIP":delivery.artifactType==="assessment"?"Complete 11,092-entry tracker, scoring guide and printable records in one ZIP":delivery.artifactType==="planner"?"Printable, fillable and Quick Start PDFs in one ZIP":delivery.artifactType==="practice_assessment"?"Forms A/B/C, MP3s, scripts, answers, rubrics and score tracker in one ZIP":"Teacher plans, handouts, tickets/cards, homework key/rubric and editable DOCX/PPTX in one ZIP");
}
export type ProductDelivery={deliveryKey:string;level:number|null;artifactType:"level"|"bundle"|"worksheet"|"assessment"|"planner"|"practice_assessment"|"lesson_plan"|"resource_bundle";format:"pdf"|"zip";downloadLimit:number};
export function buildProductDeliveries(productId:unknown):ProductDelivery[]{
  const product=digitalProduct(productId);if(!product)throw new Error("INVALID_PRODUCT");
  if(product.category==="level")return [{deliveryKey:`level-${product.levels[0]}`,level:product.levels[0],artifactType:"level",format:"pdf",downloadLimit:DIGITAL_DOWNLOAD_LIMIT}];
  if(product.category==="bundle")return [
    ...product.levels.map(level=>({deliveryKey:`level-${level}`,level,artifactType:"level" as const,format:"pdf" as const,downloadLimit:DIGITAL_DOWNLOAD_LIMIT})),
    {deliveryKey:"bundle-zip",level:null,artifactType:"bundle",format:"zip",downloadLimit:DIGITAL_DOWNLOAD_LIMIT},
  ];
  if(product.category==="resource_bundle")return [{deliveryKey:"product",level:null,artifactType:"resource_bundle",format:"zip",downloadLimit:DIGITAL_DOWNLOAD_LIMIT}];
  const types:Record<string,ProductDelivery["artifactType"]>={"worksheet-pack":"worksheet","assessment-tracker":"assessment","30-day-planner":"planner","practice-assessment-pack":"practice_assessment","teacher-lesson-plan-pack":"lesson_plan"};
  return [{deliveryKey:"product",level:null,artifactType:types[product.id],format:product.format,downloadLimit:DIGITAL_DOWNLOAD_LIMIT}];
}
export function currentProductDelivery(productId:unknown,deliveryKey:unknown,level:unknown){
  if(typeof deliveryKey!=="string")return null;
  return buildProductDeliveries(productId).find(item=>item.deliveryKey===deliveryKey&&(item.level??null)===(level??null))??null;
}
