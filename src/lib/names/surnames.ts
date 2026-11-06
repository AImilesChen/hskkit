// Original selection, not a population ranking. Simplified forms with explicit
// name-use Mandarin readings; compound surnames remain one family-name unit.
// General reference: MOE Mandarin dictionaries. Specific compound references
// are recorded in surname-sources.md. This collection does not cover all surnames.
export type Surname={id:string;hanzi:string;pinyin:string;syllables:string[];kind:'single'|'compound';traditional?:string};
const rows:Array<[string,string,string,string?]>=[
 ['lin','林','Lín'],['wang','王','Wáng'],['chen','陈','Chén','陳'],['li','李','Lǐ'],['zhang','张','Zhāng','張'],['zhou','周','Zhōu'],['xu3','许','Xǔ','許'],['xu2','徐','Xú'],
 ['liu','刘','Liú','劉'],['yang','杨','Yáng','楊'],['huang','黄','Huáng','黃'],['zhao','赵','Zhào','趙'],['wu','吴','Wú','吳'],['sun','孙','Sūn','孫'],['hu','胡','Hú'],['zhu','朱','Zhū'],
 ['gao','高','Gāo'],['luo','罗','Luó','羅'],['zheng','郑','Zhèng','鄭'],['liang','梁','Liáng'],['xie','谢','Xiè','謝'],['song','宋','Sòng'],['tang','唐','Táng'],['deng','邓','Dèng','鄧'],
 ['han','韩','Hán','韓'],['feng','冯','Féng','馮'],['cao','曹','Cáo'],['peng','彭','Péng'],['zeng','曾','Zēng'],['xiao','肖','Xiào'],['tian','田','Tián'],['dong','董','Dǒng'],
 ['pan','潘','Pān'],['yuan','袁','Yuán'],['cai','蔡','Cài'],['jiang','蒋','Jiǎng','蔣'],['yu','余','Yú'],['du','杜','Dù'],['ye','叶','Yè','葉'],['cheng','程','Chéng'],
 ['su','苏','Sū','蘇'],['wei','魏','Wèi'],['lv','吕','Lǚ','呂'],['ding','丁','Dīng'],['ren','任','Rén'],['shen','沈','Shěn'],['yao','姚','Yáo'],['lu','卢','Lú','盧'],
 ['jiang-river','江','Jiāng'],['cui','崔','Cuī'],['zhong','钟','Zhōng','鍾'],['tan','谭','Tán','譚'],['lu-land','陆','Lù','陸'],['wang-water','汪','Wāng'],['jin','金','Jīn'],['shi','石','Shí'],
 ['liao','廖','Liào'],['jia','贾','Jiǎ','賈'],['xia','夏','Xià'],['wei-guard','韦','Wéi','韋'],['fu','傅','Fù'],['fang','方','Fāng'],['bai','白','Bái'],['zou','邹','Zōu','鄒'],
 ['meng','孟','Mèng'],['xiong','熊','Xióng'],['qin','秦','Qín'],['qiu','邱','Qiū'],['hou','侯','Hóu'],['yin','尹','Yǐn'],['xue','薛','Xuē'],['yan','闫','Yán','閆'],
 ['duan','段','Duàn'],['lei','雷','Léi'],['long','龙','Lóng','龍'],['shi-history','史','Shǐ'],['tao','陶','Táo'],['he','贺','Hè','賀'],['gu','顾','Gù','顧'],['mao','毛','Máo'],
 ['hao','郝','Hǎo'],['gong','龚','Gōng','龔'],['shao','邵','Shào'],['wan','万','Wàn','萬'],['qian','钱','Qián','錢'],['dai','戴','Dài'],['wu-martial','武','Wǔ'],['kang','康','Kāng'],
 ['zhan','詹','Zhān'],['xiong-bear','萧','Xiāo','蕭'],['guo','郭','Guō'],['ma','马','Mǎ','馬'],['he-harmony','何','Hé'],['gu-ancient','古','Gǔ'],['wen','文','Wén'],['yu-jade','于','Yú'],
 ['lu-road','路','Lù'],['chang','常','Cháng'],['wen-warm','温','Wēn','溫'],['ning','宁','Nìng','寧'],
 ['ouyang','欧阳','Ōuyáng','歐陽'],['sima','司马','Sīmǎ','司馬'],['shangguan','上官','Shàngguān'],['zhuge','诸葛','Zhūgě','諸葛'],['xiahou','夏侯','Xiàhóu'],
 ['dongfang','东方','Dōngfāng','東方'],['huangfu','皇甫','Huángfǔ'],['yuchi','尉迟','Yùchí','尉遲'],['gongsun','公孙','Gōngsūn','公孫'],['murong','慕容','Mùróng'],
 ['situ','司徒','Sītú'],['sikong','司空','Sīkōng'],['yuwen','宇文','Yǔwén'],['zhangsun','长孙','Zhǎngsūn','長孫'],['linghu','令狐','Línghú'],
 ['dugu','独孤','Dúgū','獨孤'],['nangong','南宫','Nángōng','南宮'],['gongyang','公羊','Gōngyáng'],['duanmu','端木','Duānmù'],['baili','百里','Bǎilǐ'],
];
// Syllable boundaries are explicit for compounds, never inferred from glyphs.
const compounds:Record<string,string[]>={ouyang:['ōu','yáng'],sima:['sī','mǎ'],shangguan:['shàng','guān'],zhuge:['zhū','gě'],xiahou:['xià','hóu'],dongfang:['dōng','fāng'],huangfu:['huáng','fǔ'],yuchi:['yù','chí'],gongsun:['gōng','sūn'],murong:['mù','róng'],situ:['sī','tú'],sikong:['sī','kōng'],yuwen:['yǔ','wén'],zhangsun:['zhǎng','sūn'],linghu:['líng','hú'],dugu:['dú','gū'],nangong:['nán','gōng'],gongyang:['gōng','yáng'],duanmu:['duān','mù'],baili:['bǎi','lǐ']};
export const surnameCollection:Surname[]=rows.map(([id,hanzi,pinyin,traditional])=>({id,hanzi,pinyin,syllables:compounds[id]??[pinyin.toLowerCase()],kind:compounds[id]?'compound':'single',...(traditional?{traditional}:{})}));
export const quickSurnameIds=['wang','li','zhang','liu','chen','yang','huang','zhao','lin','xu3','ouyang','sima'];
export function normalizeSurnameSearch(text:string){return text.toLowerCase().replace(/[üǖǘǚǜ]/g,'v').replace(/u:/g,'v').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\s'’\-]/g,'');}
export function searchSurnames(query:string,kind:'all'|'single'|'compound'='all'){
 const needle=normalizeSurnameSearch(query);
 return surnameCollection.filter(item=>(kind==='all'||item.kind===kind)&&(!needle||[item.hanzi,item.traditional??'',item.pinyin,item.syllables.join(' '),item.id].some(text=>{const normalized=normalizeSurnameSearch(text);return normalized.includes(needle)||(!needle.includes('v')&&normalized.replace(/v/g,'u').includes(needle));})));
}
