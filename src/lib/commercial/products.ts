export const DIGITAL_CURRENCY="usd" as const;
export const DIGITAL_ACCESS_DAYS=14;
export const DIGITAL_REFUND_DAYS=7;
export const DIGITAL_DOWNLOAD_LIMIT=3;

export type DigitalProductId=
  |`level-${1|2|3|4|5|6|7|8|9}`
  |"advanced-7-9"|"complete-1-9"
  |"worksheet-pack"|"assessment-tracker"|"30-day-planner"|"mock-exam-pack"|"teacher-lesson-plan-pack";
export type DigitalProduct={id:DigitalProductId;sku:string;name:string;shortName:string;amountCents:number;currency:"usd";category:"level"|"bundle"|"resource";levels:number[];description:string;format:"pdf"|"zip"};

const levels=Array.from({length:9},(_,index)=>index+1);
const levelProducts=levels.map(level=>({
  id:`level-${level}` as DigitalProductId,sku:`hskkit_hsk3_level_${level}_pdf_v1`,name:`HSK 3.0 Level ${level} PDF Pack`,shortName:`Level ${level} PDF Pack`,amountCents:999,currency:DIGITAL_CURRENCY,category:"level" as const,levels:[level],format:"pdf" as const,
  description:level>=7?"Level-labelled practice from the single canonical HSK 3.0 Levels 7–9 advanced band; Levels 7, 8 and 9 share the same approved source set.":"120 vocabulary entries and 20 practice prompts with answers.",
}));
export const DIGITAL_PRODUCTS:readonly DigitalProduct[]=[
  ...levelProducts,
  {id:"advanced-7-9",sku:"hskkit_hsk3_advanced_7_9_bundle_v1",name:"Advanced 7–9 Bundle",shortName:"Advanced 7–9 Bundle",amountCents:2499,currency:DIGITAL_CURRENCY,category:"bundle",levels:[7,8,9],format:"zip",description:"Three level-labelled PDFs sourced from the single canonical Levels 7–9 advanced band, plus one combined offline ZIP."},
  {id:"complete-1-9",sku:"hskkit_hsk3_complete_1_9_bundle_v1",name:"Complete 1–9 Bundle",shortName:"Complete 1–9 Bundle",amountCents:6499,currency:DIGITAL_CURRENCY,category:"bundle",levels,format:"zip",description:"Nine level-labelled PDFs plus one combined offline ZIP; Levels 7–9 transparently use the single canonical advanced-band source set."},
  {id:"worksheet-pack",sku:"hskkit_hsk3_worksheet_pack_v1",name:"HSK Worksheet Pack",shortName:"HSK Worksheet Pack",amountCents:999,currency:DIGITAL_CURRENCY,category:"resource",levels,format:"zip",description:"Printable student worksheets, vocabulary exercises and answer key."},
  {id:"assessment-tracker",sku:"hskkit_hsk3_assessment_tracker_v1",name:"HSK Assessment Tracker",shortName:"HSK Assessment Tracker",amountCents:999,currency:DIGITAL_CURRENCY,category:"resource",levels,format:"zip",description:"Spreadsheet-ready CSV tracker and printable assessment record."},
  {id:"30-day-planner",sku:"hskkit_hsk3_30_day_planner_v1",name:"HSK 30-Day Planner",shortName:"HSK 30-Day Planner",amountCents:999,currency:DIGITAL_CURRENCY,category:"resource",levels,format:"pdf",description:"Goal, daily practice, weekly review and reflection pages."},
  {id:"mock-exam-pack",sku:"hskkit_hsk3_mock_exam_pack_v1",name:"HSK Mock Exam Pack",shortName:"HSK Mock Exam Pack",amountCents:999,currency:DIGITAL_CURRENCY,category:"resource",levels,format:"zip",description:"Unofficial level-labelled practice paper, answers and rubric."},
  {id:"teacher-lesson-plan-pack",sku:"hskkit_hsk3_teacher_lesson_plan_pack_v1",name:"HSK Teacher Lesson Plan Pack",shortName:"HSK Teacher Lesson Plan Pack",amountCents:999,currency:DIGITAL_CURRENCY,category:"resource",levels,format:"zip",description:"45, 60 and 90-minute HSK 3.0 lesson-plan templates."},
] as const;

export function digitalProduct(value:unknown){return DIGITAL_PRODUCTS.find(product=>product.id===value)??null;}
export function productDeliverableLabels(productId:unknown):string[]{const product=digitalProduct(productId);if(!product)throw new Error("INVALID_PRODUCT");return buildProductDeliveries(product.id).map(delivery=>delivery.artifactType==="level"?`Level ${delivery.level} searchable PDF`:delivery.artifactType==="bundle"?`Combined Levels ${product.levels[0]}–${product.levels.at(-1)} offline ZIP`:delivery.artifactType==="worksheet"?"Student worksheets and answer-key PDFs in one ZIP":delivery.artifactType==="assessment"?"CSV tracker and printable assessment PDF in one ZIP":delivery.artifactType==="planner"?"Printable 30-day planner PDF":delivery.artifactType==="mock_exam"?"Student paper, facilitator script, answers and rubric in one ZIP":"45, 60 and 90-minute lesson-plan PDFs in one ZIP");}
export type ProductDelivery={deliveryKey:string;level:number|null;artifactType:"level"|"bundle"|"worksheet"|"assessment"|"planner"|"mock_exam"|"lesson_plan";format:"pdf"|"zip";downloadLimit:number};
export function buildProductDeliveries(productId:unknown):ProductDelivery[]{
  const product=digitalProduct(productId);if(!product)throw new Error("INVALID_PRODUCT");
  if(product.category==="level")return [{deliveryKey:`level-${product.levels[0]}`,level:product.levels[0],artifactType:"level",format:"pdf",downloadLimit:DIGITAL_DOWNLOAD_LIMIT}];
  if(product.category==="bundle")return [
    ...product.levels.map(level=>({deliveryKey:`level-${level}`,level,artifactType:"level" as const,format:"pdf" as const,downloadLimit:DIGITAL_DOWNLOAD_LIMIT})),
    {deliveryKey:"bundle-zip",level:null,artifactType:"bundle",format:"zip",downloadLimit:DIGITAL_DOWNLOAD_LIMIT},
  ];
  const types:Record<string,ProductDelivery["artifactType"]>={"worksheet-pack":"worksheet","assessment-tracker":"assessment","30-day-planner":"planner","mock-exam-pack":"mock_exam","teacher-lesson-plan-pack":"lesson_plan"};
  return [{deliveryKey:"product",level:null,artifactType:types[product.id],format:product.format,downloadLimit:DIGITAL_DOWNLOAD_LIMIT}];
}
