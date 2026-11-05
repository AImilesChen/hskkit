import fs from 'node:fs';
import { pinyinDisplaySegments } from '../src/lib/dictionary/pinyin-display.ts';
import { publishedContentAudioAsset } from '../src/lib/audio/assets.ts';

// Curated common words. Only existing published audio is eligible. No synthesis,
// voice conversion, neutral-tone guessing or third-tone-sandhi inference here.
const singles = ['八 包 车 吃 穿 灯 东 多 飞 高 歌 开', '茶 床 读 国 回 来 忙 门 词 从 零 和', '笔 本 比 打 点 短 狗 好 几 九 买 口', '爱 半 病 菜 唱 次 大 到 电 对 饭 贵'];
const doubles = '超市 牛奶 苹果 商店 学习 环境 习惯 新鲜 需要 白天 大家 大学 电话 电脑 电视 电影 读书 饭店 房间 非常 飞机 分钟 高兴 公司 工作 汉语 汉字 好吃 好看 好听 火车 鸡蛋 今年 今天 开车 看病 看见 帮忙 出国 出来 地铁 机场 考试 旅游 安全 发现 帮助 参加'.split(' ');
const index = JSON.parse(fs.readFileSync('src/lib/content/runtime-content-index.json','utf8'));
const words = [...index.dictionaryAssets, ...Object.values(index.runtimeWords).flat()] as Array<{id:string;hanzi:string;pinyin:string;meaning:string;level:number;audioSrc?:string}>;
const items: object[]=[];
for (const [mode, list] of [['single',singles.join(' ').split(' ')],['double',doubles]] as const) {
  for(const hanzi of list){
    const word=words.find(w=>w.hanzi===hanzi && publishedContentAudioAsset(w.id,w.hanzi));
    if(!word){console.log('Excluded (no published asset):',hanzi);continue;}
    const syllables=pinyinDisplaySegments(word.pinyin).filter(s=>s.text.trim());
    const tones=syllables.map(s=>s.tone);
    if(syllables.length!==(mode==='single'?1:2)||tones.some(t=>!t)||/一|不/.test(hanzi)||tones.join('-')==='3-3'){console.log('Excluded (neutral, ambiguous or sandhi):',hanzi,word.pinyin);continue;}
    const asset=publishedContentAudioAsset(word.id,word.hanzi)!;
    if(!fs.existsSync('public'+asset.src))throw Error('Missing local audio '+asset.src);
    items.push({id:word.id,mode,hanzi,pinyin:syllables.map(s=>s.text).join(' '),meaning:word.meaning,tones,audioSrc:asset.src,wordHref:'/word/'+word.id,audioSource:'Existing QA-approved synthesized pronunciation',sourceAssetId:asset.id});
  }
}
const bank={version:'tone-trainer-v1',audioPolicy:'Existing published HSKKit word audio; no browser TTS. Neutral tones, 一/不 and 3+3 excluded from this foundation bank.',items};
fs.writeFileSync('src/lib/tones/bank.json',JSON.stringify(bank,null,2)+'\n');
const counts=items.reduce<Record<string,number>>((counts,item)=>{const mode=(item as {mode:string}).mode;counts[mode]=(counts[mode]??0)+1;return counts;},{});
if(counts.single!==48||counts.double!==48)throw Error('Foundation bank must have 48 approved items per mode');
console.log('Bank counts',JSON.stringify(counts));
