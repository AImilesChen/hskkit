// Small presentation examples; full tools remain on their own routes.
export const homeTools = [
  {id:'strokes',title:'Stroke Order & Writing',description:'Watch how a character is written, then practise it yourself.',href:'/tools/chinese-stroke-order',action:'Practise writing',icon:'pencil',tone:'green',label:'Character example'},
  {id:'comparison',title:'HSK Vocabulary Comparison',description:'Find the words that carry over and the ones to add for your new goal.',href:'/tools/hsk-vocabulary-comparison',action:'Compare vocabulary',icon:'route',tone:'purple',label:'Study-range example'},
  {id:'tones',title:'Tone Trainer',description:'Listen closely and practise the Mandarin tones you mix up.',href:'/tools/chinese-tone-trainer',action:'Train your ear',icon:'headphones',tone:'teal',label:'Four-tone example'},
  {id:'numbers',title:'Numbers & Listening',description:'Make sense of numbers, prices, dates and times in Chinese.',href:'/tools/chinese-number-converter',action:'Explore numbers',icon:'calendar',tone:'orange',label:'Number example'},
  {id:'worksheets',title:'Character Worksheets',description:'Turn the characters you are learning into printable writing practice.',href:'/tools/chinese-character-practice-sheet-generator',action:'Create a worksheet',icon:'file',tone:'rose',label:'Writing example'},
  {id:'names',title:'Chinese Name Generator',description:'Explore a name, discover its meaning and learn how to say it.',href:'/tools/chinese-name-generator',action:'Find a name',icon:'search',tone:'gold',label:'Name example'},
] as const;

export function cumulativeWordCounts(levels:ReadonlyArray<{level:number;wordCount:number}>){
  let total=0;
  return new Map([...levels].sort((a,b)=>a.level-b.level).map(level=>[level.level,total+=level.wordCount]));
}

export const featuredGuideSlugs=['chinese-pinyin-guide','chinese-tones-guide','hsk-3-0-levels-explained'] as const;
