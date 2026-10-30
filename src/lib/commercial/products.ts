export const DIGITAL_CURRENCY="usd" as const;
export const DIGITAL_ACCESS_DAYS=14;
export const DIGITAL_REFUND_DAYS=7;
export const DIGITAL_DOWNLOAD_LIMIT=3;
export const DEFAULT_PRODUCT_GENERATION_VERSION="complete-vocabulary-v2";
export const HSK1_VOCABULARY_GENERATION_VERSION="complete-vocabulary-hsk1-2025-v3";
export const HSK123_VOCABULARY_GENERATION_VERSION="complete-vocabulary-hsk123-2025-v1";
export const HSK1234_VOCABULARY_GENERATION_VERSION="complete-vocabulary-hsk1234-2025-v1";
export const PLANNER_GENERATION_VERSION="planner-guided-v6";
export const PLANNER_BUNDLE_GENERATION_VERSION="learner-toolkit-current-v6";
export const EXAM_BUNDLE_GENERATION_VERSION="exam-preparation-current-v4";
export const PRACTICE_ASSESSMENT_GENERATION_VERSION="practice-guided-edition-v4";
export const TEACHER_PACK_GENERATION_VERSION="teacher-pack-v4";
export const WORKSHEET_GENERATION_VERSION="worksheet-guided-v17";
export const PURCHASED_PRODUCT_LICENSE="The purchaser may keep and use downloaded files without a time limit and print as many copies as needed for personal study or learners they teach. Printed copies may be given to those learners without charge. Printed copies and digital files may not be sold or resold.";
export const VOCABULARY_PRODUCT_LICENSE="The purchaser may keep the HSKKit files without a time limit, print copies for personal study or learners they teach, and give those learners printed copies without charge. HSKKit does not grant permission to sell its original layout, exercises, branding or packaged files. Third-party vocabulary data and English definitions retain their MIT and CC BY-SA 4.0 licences; these terms do not limit rights granted by those licences.";
export const TEACHER_PRODUCT_LICENSE=`${PURCHASED_PRODUCT_LICENSE} The purchaser may adapt the editable lesson-plan files for their own teaching.`;

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
  {level:1,count:300,amountCents:399},{level:2,count:200,amountCents:599},{level:3,count:500,amountCents:799},
  {level:4,count:1000,amountCents:1099},{level:5,count:1071,amountCents:1399},{level:6,count:1140,amountCents:1799},
] as const;
const levelProducts=levelDefinitions.map(({level,count,amountCents})=>({
  id:`level-${level}` as DigitalProductId,sku:`hskkit_hsk3_level_${level}_complete_v2`,name:`HSK ${level} Complete Vocabulary`,shortName:`HSK ${level} Complete`,amountCents,currency:DIGITAL_CURRENCY,category:"level" as const,levels:[level],format:"pdf" as const,vocabularyCount:count,
  description:`All ${count.toLocaleString("en-US")} HSK 3.0 Level ${level} entries${level<=4?" following the 2025 exam syllabus":""}, with Hanzi, tone-marked pinyin, dictionary-style English glosses, available part-of-speech labels and source IDs.`,
}));
export const DIGITAL_PRODUCTS:readonly DigitalProduct[]=[
  ...levelProducts,
  {id:"starter-1-3",sku:"hskkit_hsk3_starter_1_3_complete_v2",name:"HSK 1–3 Starter Complete",shortName:"Starter 1–3",amountCents:999,currency:DIGITAL_CURRENCY,category:"bundle",levels:[1,2,3],format:"zip",vocabularyCount:1000,description:"1,000 distinct 2025 HSK exam-syllabus entries across Levels 1–3 in three searchable PDFs and one offline ZIP."},
  {id:"progression-4-6",sku:"hskkit_hsk3_progression_4_6_v2",name:"HSK 4–6 Progression",shortName:"Progression 4–6",amountCents:2999,currency:DIGITAL_CURRENCY,category:"bundle",levels:[4,5,6],format:"zip",vocabularyCount:3211,description:"3,211 entries across Levels 4–6: 2025 exam-syllabus Level 4 plus separately labelled Levels 5–6 study-standard lists, in three searchable PDFs and one ZIP."},
  {id:"advanced-7-9",sku:"hskkit_hsk3_advanced_7_9_complete_v2",name:"HSK 3.0 Advanced 7–9 Complete Vocabulary Pack",shortName:"Advanced 7–9",amountCents:3999,currency:DIGITAL_CURRENCY,category:"bundle",levels:[7],format:"zip",vocabularyCount:5636,description:"The complete unified HSK 3.0 Advanced 7–9 band: one complete index plus three HSKKit reading volumes, never presented as official separate Level 7, 8 and 9 lists."},
  {id:"complete-1-9",sku:"hskkit_hsk3_complete_1_9_library_v2",name:"HSK 1–9 Complete Vocabulary Library",shortName:"Complete Library",amountCents:4999,currency:DIGITAL_CURRENCY,category:"bundle",levels:[1,2,3,4,5,6,7],format:"zip",vocabularyCount:9847,description:"9,847 entries in seven searchable PDFs and one ZIP: 2025 exam-syllabus Levels 1–4 plus separately versioned Levels 5–6 and the unified Advanced 7–9 band."},
  {id:"worksheet-pack",sku:"hskkit_hsk3_worksheet_pack_v2",name:"HSK Worksheet Pack",shortName:"Worksheet",amountCents:1299,currency:DIGITAL_CURRENCY,category:"resource",levels:[1,2,3,4,5,6,7],format:"zip",description:"Levels 1–9 student workbook, answer key, completed samples and progress checklist; study flow in README."},
  {id:"assessment-tracker",sku:"hskkit_hsk3_assessment_tracker_v2",name:"HSK Assessment Tracker",shortName:"Tracker",amountCents:499,currency:DIGITAL_CURRENCY,category:"resource",levels:[1,2,3,4,5,6,7],format:"zip",description:"Spreadsheet-ready tracker for the earlier 11,092-entry study-standard catalog, with weekly review records, scoring guide and printable checkpoints. This edition has not yet migrated to the 2025 HSK 1–3 list."},
  {id:"30-day-planner",sku:"hskkit_hsk3_30_day_planner_v2",name:"HSK 30-Day Planner",shortName:"30-Day Planner",amountCents:699,currency:DIGITAL_CURRENCY,category:"resource",levels:[1,2,3,4,5,6,7],format:"zip",description:"Personalized thirty-day study system with Assessment mapping, distinct 20/30/45-minute routes, weekly reviews and recovery worksheet."},
  {id:"practice-assessment-pack",sku:"hskkit_hsk3_practice_assessment_pack_v2",name:"HSK Practice Assessment Pack",shortName:"Practice Assessment",amountCents:1699,currency:DIGITAL_CURRENCY,category:"resource",levels:[1,2,3,4,5,6,7],format:"zip",description:"Three unofficial HSK 3.0 practice assessments with Mandarin MP3 listening, answer sheets, explanations, rubrics, score report and review pathways."},
  {id:"learner-practice-toolkit",sku:"hskkit_hsk3_learner_practice_toolkit_v1",name:"Learner Practice Toolkit",shortName:"Learner Toolkit",amountCents:1699,currency:DIGITAL_CURRENCY,category:"resource_bundle",levels:[1,2,3,4,5,6,7],format:"zip",componentProductIds:["worksheet-pack","assessment-tracker","30-day-planner"],description:"Worksheet, Tracker and 30-Day Planner together for daily practice, planning and evidence-based progress review."},
  {id:"exam-preparation-bundle",sku:"hskkit_hsk3_exam_preparation_bundle_v1",name:"Exam Preparation Bundle",shortName:"Exam Preparation",amountCents:2499,currency:DIGITAL_CURRENCY,category:"resource_bundle",levels:[1,2,3,4,5,6,7],format:"zip",componentProductIds:["worksheet-pack","practice-assessment-pack","30-day-planner"],description:"Worksheet, Practice Assessment and 30-Day Planner together for practice, diagnosis and a structured review cycle."},
  {id:"teacher-lesson-plan-pack",sku:"hskkit_hsk3_teacher_lesson_plan_pack_v2",name:"HSK Teacher Lesson Plan Pack",shortName:"Teacher Pack",amountCents:1999,currency:DIGITAL_CURRENCY,category:"teacher",levels:[1,2,3,4,5,6,7],format:"zip",description:"Classroom-ready plans, handouts, tickets, homework, editable DOCX/PPTX and the same flexible print permission shown at checkout."},
] as const;

export function digitalProduct(value:unknown){return DIGITAL_PRODUCTS.find(product=>product.id===value)??null;}
export function productLicenseNotice(productId:unknown){const product=digitalProduct(productId);return product?.category==="level"||product?.category==="bundle"?VOCABULARY_PRODUCT_LICENSE:productId==="teacher-lesson-plan-pack"?TEACHER_PRODUCT_LICENSE:PURCHASED_PRODUCT_LICENSE;}
export function generationVersionForProduct(productId:unknown){return productId==="level-4"||productId==="progression-4-6"||productId==="complete-1-9"?HSK1234_VOCABULARY_GENERATION_VERSION:productId==="level-1"||productId==="level-2"||productId==="level-3"||productId==="starter-1-3"?HSK123_VOCABULARY_GENERATION_VERSION:productId==="assessment-tracker"?"assessment-tracker-v5":productId==="learner-practice-toolkit"?PLANNER_BUNDLE_GENERATION_VERSION:productId==="exam-preparation-bundle"?EXAM_BUNDLE_GENERATION_VERSION:productId==="worksheet-pack"?WORKSHEET_GENERATION_VERSION:productId==="30-day-planner"?PLANNER_GENERATION_VERSION:productId==="practice-assessment-pack"?PRACTICE_ASSESSMENT_GENERATION_VERSION:productId==="teacher-lesson-plan-pack"?TEACHER_PACK_GENERATION_VERSION:DEFAULT_PRODUCT_GENERATION_VERSION;}
export function productDeliverableLabels(productId:unknown):string[]{
  const product=digitalProduct(productId);if(!product)throw new Error("INVALID_PRODUCT");
  if(product.category==="level")return [`${product.vocabularyCount?.toLocaleString("en-US")} entries in one searchable PDF`,`Source and licence notes inside the PDF`];
  if(product.category==="bundle")return product.id==="advanced-7-9"?["One complete Advanced 7–9 index plus three HSKKit reading volumes","Manifest, README, licence and checksums in one ZIP"]:product.id==="complete-1-9"?["Seven complete catalogs covering 9,847 entries","Three additional Advanced reading volumes plus manifest and licence in the ZIP"]:[`${product.levels.length} searchable vocabulary PDFs covering ${product.vocabularyCount?.toLocaleString("en-US")} entries`,`Manifest, README, licence and checksums in one ZIP`];
  if(product.category==="resource_bundle")return [`${product.componentProductIds?.length} complete resource products in one purchase`,`One combined ZIP with manifest, licence and checksums`];
  return buildProductDeliveries(product.id).map(delivery=>delivery.artifactType==="worksheet"?"Eight searchable PDFs: Start Here page map, four student editions, answer key, completed samples and progress checklist in one ZIP":delivery.artifactType==="assessment"?"Earlier 11,092-entry study-standard tracker, scoring guide and printable records in one ZIP":delivery.artifactType==="planner"?"Printable, fillable and Quick Start PDFs in one ZIP":delivery.artifactType==="practice_assessment"?"Forms A/B/C, MP3s, scripts, answers, rubrics and score tracker in one ZIP":"Teacher plans, handouts, tickets/cards, homework key/rubric and editable DOCX/PPTX in one ZIP");
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
