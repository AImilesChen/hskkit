// Independently phrased factual summaries, with references checked 2026-11-06.
// References are not runtime dependencies and no third-party database is copied.
export const meaningInspirations=[
  {id:'wisdom',label:'Wisdom & learning',terms:['wisdom','wise','knowledge','learning','智慧','学习']},
  {id:'peace',label:'Peace & calm',terms:['peace','peaceful','calm','tranquil','平和','平静','宁静']},
  {id:'brightness',label:'Light & clarity',terms:['bright','brightness','light','clear','clarity','光明','明亮']},
  {id:'protection',label:'Protection & care',terms:['protect','protection','defender','defend','guardian','守护','保护']},
  {id:'joy',label:'Joy & delight',terms:['joy','happy','happiness','delight','喜悦','快乐']},
  {id:'fortune',label:'Good fortune & positive wishes',terms:['luck','lucky','fortune','fortunate','blessing','福气','幸运']},
  {id:'stars',label:'Stars & the night sky',terms:['star','stars','starlight','星','星空']},
  {id:'flowers',label:'Flowers & grace',terms:['flower','flowers','rose','orchid','花','兰']},
  {id:'courage',label:'Courage & resolve',terms:['courage','brave','strength','lion','勇气','力量']},
  {id:'victory',label:'Victory & achievement',terms:['victory','achievement','success','胜利','成就']},
] as const;
export type MeaningId=typeof meaningInspirations[number]['id'];
export type EnglishOrigin={id:string;name:string;aliases:string[];origin:string;meaning:string;inspiration?:MeaningId;source:string};
const source=(slug:string)=>`https://www.behindthename.com/name/${slug}`;
export const englishOrigins:EnglishOrigin[]=[
  {id:'sophia',name:'Sophia',aliases:['Sophia','Sofia','Sophie','Sophy'],origin:'Greek root, used in English and other languages',meaning:'Wisdom.',inspiration:'wisdom',source:source('sophia')},
  {id:'alexander',name:'Alexander',aliases:['Alexander','Alex'],origin:'Greek-derived Alexander',meaning:'Defending or protecting people.',inspiration:'protection',source:source('alexander')},
  {id:'alexandra',name:'Alexandra',aliases:['Alexandra','Alex','Alexa','Lexi','Lexie'],origin:'Greek-derived Alexandra',meaning:'The feminine form of Alexander, sharing its protective meaning.',inspiration:'protection',source:source('alexandra')},
  {id:'irene',name:'Irene',aliases:['Irene','Irena','Irina','Eirene','Eireen'],origin:'Greek root',meaning:'Peace.',inspiration:'peace',source:source('irene')},
  {id:'clara',name:'Clara',aliases:['Clara','Clare','Claire','Klara'],origin:'Latin root',meaning:'Clear or bright; the root also carries an association with fame.',inspiration:'brightness',source:source('clara')},
  {id:'felix',name:'Felix',aliases:['Felix','Félix','Feliks'],origin:'Latin root',meaning:'Lucky or successful.',inspiration:'fortune',source:source('felix')},
  {id:'stella-latin',name:'Stella',aliases:['Stella','Estelle'],origin:'Latin star interpretation',meaning:'Star.',inspiration:'stars',source:source('stella-1')},
  {id:'stella-greek',name:'Stella',aliases:['Stella'],origin:'Greek short form of Styliani',meaning:'A short form of Styliani. This is a different origin from the Latin star interpretation; choose an intended meaning below.',source:source('stella-2')},
  {id:'rose-flower',name:'Rose',aliases:['Rose','Rosie','Rosy'],origin:'Flower association in English usage',meaning:'Associated with the rose flower; the name also has an older Germanic history.',inspiration:'flowers',source:source('rose')},
  {id:'rose-historical',name:'Rose',aliases:['Rose'],origin:'Older Germanic / Norman French history',meaning:'The older name elements relate to fame and kind or type. Choose the meaning you wish to carry into a Chinese name below.',source:source('rose')},
  {id:'victoria',name:'Victoria',aliases:['Victoria','Viktoria','Vicky','Vicki','Tori'],origin:'Latin root',meaning:'Victory.',inspiration:'victory',source:source('victoria')},
  {id:'leo',name:'Leo',aliases:['Leo','Léo'],origin:'Latin lion interpretation',meaning:'Lion. Courage is a suggested naming inspiration, rather than a literal translation of a Chinese name.',inspiration:'courage',source:source('leo')},
];
export function normalizeEnglishName(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();}
export function lookupEnglishName(value:string){if(value.length>60)return [];const normalized=normalizeEnglishName(value);return englishOrigins.filter(item=>item.aliases.some(alias=>normalizeEnglishName(alias)===normalized));}
export function findMeaning(value:string){return meaningInspirations.find(item=>item.id===value);}
export function suggestedMeanings(text:string){const normalized=text.trim().toLowerCase();if(normalized.length>160)return [];return meaningInspirations.filter(item=>item.terms.some(term=>/[a-z]/i.test(term)?new RegExp(`\\b${term}\\b`,'i').test(normalized):normalized.includes(term))).map(item=>item.id);}
