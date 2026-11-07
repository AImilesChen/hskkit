import {createPreviewSession,type PreviewSession,type PreviewRating} from '../learning/flashcard-preview.ts';

export type OldEntry={id:string;level:number;sourceHeadword:string;headword:string;qualifier:string};
export type NewEntry={id:string;level:number;headword:string;traditional:string;pinyin:string;meaning:string;partOfSpeech:string;audioSrc?:string};
export type ComparisonUnit={id:string;headword:string;old:OldEntry[];updated:NewEntry[];glosses:string[][];needsReview:boolean};
export type ComparisonIndex={units:ComparisonUnit[];byId:Map<string,ComparisonUnit>;release:string};
export type Category='overlap'|'gap'|'beyond'|'unlisted';
export type ComparedWord=ComparisonUnit&{category:Category};
export type Comparison={oldLevel:number;targetLevel:number;rows:ComparedWord[];counts:Record<Category,number>;oldHeadwords:number;oldEntries:number;targetHeadwords:number;targetEntries:number;coverage:number};
export type WordFilters={category:Category;query:string;oldIntroduced:number;newIntroduced:number;reviewOnly:boolean};
export const initialFilters:WordFilters={category:'gap',query:'',oldIntroduced:0,newIntroduced:0,reviewOnly:false};
export const categories:Array<{id:Category;label:string;description:string;symbol:string}>=[
 {id:'overlap',label:'Shared headwords',description:'In your old range and new target.',symbol:'✓'},
 {id:'gap',label:'Words to add',description:'In your new target, outside your old range.',symbol:'+'},
 {id:'beyond',label:'Beyond your target',description:'In your old range, introduced later in the new list.',symbol:'↗'},
 {id:'unlisted',label:'Not in the new list',description:'In your old range, outside the full new list.',symbol:'−'},
];
export const levelLabel=(level:number)=>level===7?'HSK 7–9':`HSK ${level}`;
function record(value:unknown):value is Record<string,unknown>{return Boolean(value)&&typeof value==='object'&&!Array.isArray(value);}
function integer(value:unknown,min:number,max:number):value is number{return Number.isInteger(value)&&Number(value)>=min&&Number(value)<=max;}
export function createComparisonIndex(value:unknown):ComparisonIndex {
 if(!record(value)||value.schema!==1||!Array.isArray(value.old)||!Array.isArray(value.new)||typeof value.release!=='string'||!record(value.oldGlosses))throw new Error('The vocabulary file has an unsupported format. Please reload it.');
 const units=new Map<string,ComparisonUnit>();const ids=new Set<string>();
 function unit(headword:string){let found=units.get(headword);if(!found){found={id:'',headword,old:[],updated:[],glosses:[],needsReview:false};units.set(headword,found);}return found;}
 for(const r of value.old){
  if(!Array.isArray(r)||r.length!==5||typeof r[0]!=='string'||ids.has(r[0])||!integer(r[1],1,6)||r.slice(2).some(v=>typeof v!=='string')||!r[2]||!r[3])throw new Error('An old-list source record could not be verified.');
  ids.add(r[0]);unit(r[3]).old.push({id:r[0],level:r[1],sourceHeadword:r[2],headword:r[3],qualifier:r[4]});
 }
 for(const r of value.new){
  if(!Array.isArray(r)||r.length!==8||typeof r[0]!=='string'||ids.has(r[0])||!integer(r[1],1,7)||r.slice(2,7).some(v=>typeof v!=='string')||!r[2]||(r[7]!==null&&typeof r[7]!=='string')||(r[7]&&!/^\/audio\/[a-zA-Z0-9/_.-]+\.mp3$/.test(r[7])))throw new Error('A new-list source record could not be verified.');
  ids.add(r[0]);unit(r[2]).updated.push({id:r[0],level:r[1],headword:r[2],traditional:r[3],pinyin:r[4],meaning:r[5],partOfSpeech:r[6],audioSrc:r[7]??undefined});
 }
 for(const item of units.values()){
  item.id=item.updated[0]?.id??item.old[0].id;
  item.needsReview=item.old.length>1||item.updated.length>1||item.old.some(e=>Boolean(e.qualifier));
  const extra=value.oldGlosses[item.headword];
  if(Array.isArray(extra)&&extra.every(row=>Array.isArray(row)&&row.length===2&&row.every(v=>typeof v==='string')))item.glosses=extra;
 }
 return {units:[...units.values()],byId:new Map([...units.values()].map(item=>[item.id,item])),release:value.release};
}
export function compareVocabulary(index:ComparisonIndex,oldLevel:number,targetLevel:number):Comparison {
 if(!integer(oldLevel,1,6)||!integer(targetLevel,1,7))throw new Error('Choose an old level from 1–6 and a new target from 1–6 or Advanced 7–9.');
 const counts:Record<Category,number>={overlap:0,gap:0,beyond:0,unlisted:0};const rows:ComparedWord[]=[];
 let oldHeadwords=0,oldEntries=0,targetHeadwords=0,targetEntries=0;
 for(const unit of index.units){
  const old=unit.old.filter(e=>e.level<=oldLevel),updated=unit.updated.filter(e=>e.level<=targetLevel);
  if(old.length){oldHeadwords++;oldEntries+=old.length;}
  if(updated.length){targetHeadwords++;targetEntries+=updated.length;}
  const category:Category|undefined=old.length?(updated.length?'overlap':unit.updated.length?'beyond':'unlisted'):updated.length?'gap':undefined;
  if(category){counts[category]++;rows.push({...unit,category});}
 }
 rows.sort((a,b)=>(a.updated[0]?.level??8)-(b.updated[0]?.level??8)||a.id.localeCompare(b.id));
 return {oldLevel,targetLevel,rows,counts,oldHeadwords,oldEntries,targetHeadwords,targetEntries,coverage:targetHeadwords?Math.floor(counts.overlap/targetHeadwords*1000)/10:0};
}
export function searchKey(value:string){return value.toLowerCase().normalize('NFD').replace(/u\u0308/g,'v').replace(/[\u0300-\u036f]/g,'').replace(/u:/g,'v').replace(/[\s'’-]+/g,'').replace(/v/g,'u');}
export function filterComparison(comparison:Comparison,filters:WordFilters):ComparedWord[]{
 const needle=searchKey(filters.query.trim());
 return comparison.rows.filter(row=>row.category===filters.category&&(!filters.oldIntroduced||row.old.some(e=>e.level===filters.oldIntroduced))&&(!filters.newIntroduced||row.updated.some(e=>e.level===filters.newIntroduced))&&(!filters.reviewOnly||row.needsReview)&&(!needle||searchKey([row.headword,...row.old.flatMap(e=>[e.sourceHeadword,e.id]),...row.updated.flatMap(e=>[e.traditional,e.pinyin,e.meaning,e.id]),...row.glosses.flat()].join(' ')).includes(needle)));
}
export function comparisonCsv(rows:ComparedWord[]):string {
 const escape=(value:string)=>'"'+(/^[=+\-@\t\r]/.test(value.trimStart())?'\u0027':'')+value.replace(/"/g,'""')+'"';
 const cells=[['Headword','Category','Old introduced levels','New introduced levels','Old source headwords','Old source IDs','New source IDs','Pinyin','English enrichment','Check readings and senses']];
 for(const row of rows)cells.push([row.headword,categories.find(c=>c.id===row.category)!.label,[...new Set(row.old.map(e=>e.level))].join(' | '),[...new Set(row.updated.map(e=>levelLabel(e.level)))].join(' | '),row.old.map(e=>e.sourceHeadword).join(' | '),row.old.map(e=>e.id).join(' | '),row.updated.map(e=>e.id).join(' | '),row.updated.length?row.updated.map(e=>e.pinyin).join(' | '):row.glosses.map(e=>e[0]).join(' | '),row.updated.length?row.updated.map(e=>e.meaning).join(' | '):row.glosses.map(e=>e[1]).join(' | '),row.needsReview?'Yes':'No']);
 return '\ufeff'+cells.map(row=>row.map(escape).join(',')).join('\r\n')+'\r\n';
}
export const STUDY_KEY='hskkit.vocabulary-comparison.study.v1';
export type ComparisonStudy={version:1;bankVersion:string;oldLevel:number;targetLevel:number;category:Category;scopeIds:string[];offset:number;size:number;preview:PreviewSession};
export function startComparisonStudy(rows:ComparedWord[],comparison:Comparison,bankVersion:string,size:number):ComparisonStudy {
 if(!rows.length||rows.length>12000||!integer(size,1,12000))throw new Error('Choose a non-empty filtered list and a supported round size.');
 return {version:1,bankVersion,oldLevel:comparison.oldLevel,targetLevel:comparison.targetLevel,category:rows[0].category,scopeIds:rows.map(row=>row.id),offset:0,size,preview:createPreviewSession(Math.min(size,rows.length))};
}
export function nextStudyBatch(study:ComparisonStudy):ComparisonStudy {
 const offset=study.offset+study.size;
 if(offset>=study.scopeIds.length)throw new Error('This filtered list has no next batch.');
 return {...study,offset,preview:createPreviewSession(Math.min(study.size,study.scopeIds.length-offset))};
}
export function parseComparisonStudy(value:unknown,index:ComparisonIndex,bankVersion:string):ComparisonStudy|null {
 if(!record(value)||value.version!==1||value.bankVersion!==bankVersion||!integer(value.oldLevel,1,6)||!integer(value.targetLevel,1,7)||!categories.some(c=>c.id===value.category)||!Array.isArray(value.scopeIds)||!value.scopeIds.length||value.scopeIds.length>12000||!value.scopeIds.every(id=>typeof id==='string'&&index.byId.has(id))||new Set(value.scopeIds).size!==value.scopeIds.length||!integer(value.offset,0,value.scopeIds.length-1)||!integer(value.size,1,12000)||!record(value.preview))return null;
 const p=value.preview,count=Math.min(value.size,value.scopeIds.length-value.offset);
 if(!Array.isArray(p.order)||!p.order.length||p.order.length>count||new Set(p.order).size!==p.order.length||!p.order.every(v=>integer(v,0,count-1))||!integer(p.cursor,0,p.order.length-1)||!integer(p.round,1,10000)||typeof p.complete!=='boolean'||!record(p.ratings))return null;
 if(p.round===1&&p.order.length!==count)return null;
 const ratings:Record<number,PreviewRating>={};
 for(const [key,rating] of Object.entries(p.ratings)){if(!/^\d+$/.test(key)||!integer(Number(key),0,count-1)||(rating!=='known'&&rating!=='retry'))return null;ratings[Number(key)]=rating;}
 if(p.complete&&(p.cursor!==p.order.length-1||p.order.some(id=>ratings[Number(id)]===undefined)))return null;
 const expected=new Set(compareVocabulary(index,value.oldLevel,value.targetLevel).rows.filter(row=>row.category===value.category).map(row=>row.id));
 if(!value.scopeIds.every(id=>expected.has(id)))return null;
 return {version:1,bankVersion,oldLevel:value.oldLevel,targetLevel:value.targetLevel,category:value.category as Category,scopeIds:[...value.scopeIds] as string[],offset:value.offset,size:value.size,preview:{order:[...p.order] as number[],cursor:p.cursor,round:p.round,ratings,complete:p.complete}};
}
