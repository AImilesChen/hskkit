import {type NameSelection,type NameTrait} from './editorial.ts';
import {type NameTheme} from './options.ts';

// Original name-use explanations and pair selections. Literary names below
// describe imagery; no historical bearer or quotation attribution is implied.
const singles:Array<[string,string,string,string,NameTrait[]]>=[
  ['ning','宁','níng','peace and a settled spirit',['calm']],
  ['an','安','ān','peace and a sense of security',['calm']],
  ['ming','明','míng','brightness and understanding',['wisdom']],
  ['qing','清','qīng','clarity and a composed outlook',['calm']],
  ['zhi','知','zhī','knowledge and curiosity',['wisdom']],
  ['hui','慧','huì','intelligence and discernment',['wisdom']],
  ['xin','欣','xīn','delight and a welcoming outlook',['joy']],
  ['yue','悦','yuè','inward joy and contentment',['joy']],
  ['qing-sky','晴','qíng','the brightness of clear skies',['nature','joy']],
  ['yun','云','yún','clouds and a spacious imagination',['nature','creativity']],
  ['chuan','川','chuān','rivers and a sense of movement',['nature','strength']],
  ['yuan','远','yuǎn','a far-reaching outlook',['strength','wisdom']],
  ['lang','朗','lǎng','brightness and an open disposition',['joy','strength']],
  ['yong','勇','yǒng','courage and resolve',['strength']],
  ['shou','守','shǒu','keeping faith and protecting what matters',['strength','calm']],
  ['you','佑','yòu','help and protection',['strength','calm']],
  ['xing','星','xīng','starlight and a wide imagination',['nature','creativity']],
  ['sheng','胜','shèng','a wish for victory and achievement',['strength']],
  ['lan','兰','lán','the grace of an orchid',['nature','creativity']],
  ['ren','仁','rén','humaneness and consideration for others',['calm','wisdom']],
  ['fu','福','fú','good fortune and well-being',['joy']],
];
const neutralClassical=new Set(['宁','安','清','知','云','川','远','守','佑','星','兰','仁']);
const martial=new Set(['川','远','勇','守','佑','星','胜']);
export const singleNames:NameSelection[]=singles.map(([id,given,syllable,idea,traits])=>({
  id:`single-${id}`,given,pinyin:syllable[0].toUpperCase()+syllable.slice(1),syllables:[syllable],feel:'neutral',traits,
  meaning:idea[0].toUpperCase()+idea.slice(1)+'.',
  explanation:`As a single-character given name, ${given} places the focus on ${idea}. Its interpretation belongs to the given name; the family name identifies the surname rather than adding a second literal meaning.`,
  surnames:[0,1,2,3,4,5,6,7],styles:['modern','poetic',...(neutralClassical.has(given)?['classical' as const]:[]),...(martial.has(given)?['wuxia' as const]:[])],
}));

type Pair=[string,string,string,[string,string],NameTrait[],string,string];
const poetic:Pair[]=[
 ['qingfeng','清风','Qīngfēng',['qīng','fēng'],['nature','calm'],'A clear breeze and a light spirit.','清 suggests clarity and 风 means wind. The pairing creates a fresh, unhurried natural image.'],
 ['tingyu','听雨','Tīngyǔ',['tīng','yǔ'],['nature','calm'],'Listening quietly to the rain.','听 is listening and 雨 is rain. Together they evoke attention to a quiet moment in nature.'],
 ['wangshu','望舒','Wàngshū',['wàng','shū'],['nature','creativity'],'A spacious outlook and a sense of ease.','望 suggests looking into the distance and 舒 suggests unfolding or ease. This explanation uses the characters’ imagery without assigning a literary quotation.'],
 ['qinghe','清和','Qīnghé',['qīng','hé'],['calm','joy'],'Clarity and a harmonious disposition.','清 suggests clarity and 和 suggests harmony. Together they balance a fresh impression with an easy, peaceful character.'],
 ['ruozhu','若竹','Ruòzhú',['ruò','zhú'],['nature','strength'],'The quiet resilience of bamboo.','若 introduces a comparison and 竹 is bamboo. Their combination draws on the image of flexible, upright growth.'],
 ['jingyun','景云','Jǐngyún',['jǐng','yún'],['nature','creativity'],'An open landscape with drifting clouds.','景 suggests a scene or view, while 云 means cloud. The pairing offers a spacious landscape image.'],
];
const classical:Pair[]=[
 ['yunzhou','云舟','Yúnzhōu',['yún','zhōu'],['nature','creativity'],'A boat journey beneath the clouds.','云 is cloud and 舟 is boat. Their combination evokes a literary journey; it is presented as original character imagery.'],
 ['zhiwei','知微','Zhīwēi',['zhī','wēi'],['wisdom','calm'],'An observant mind that notices small things.','知 is knowing and 微 suggests what is small or subtle. The pairing conveys close attention and discernment.'],
 ['tingan','庭安',"Tíng'ān",['tíng','ān'],['calm'],'A quiet courtyard and a wish for peace.','庭 suggests a courtyard and 安 means peace. The pairing gives a fictional character a settled, reflective impression.'],
 ['shuheng','书衡','Shūhéng',['shū','héng'],['wisdom','creativity'],'A learned mind with a sense of balance.','书 points to books and 衡 to balance. Together they suggest a thoughtful, scholarly character.'],
 ['nanchu','南初','Nánchū',['nán','chū'],['nature','creativity'],'A southern horizon and a new beginning.','南 gives a sense of direction and 初 suggests a beginning. This is an imaginative pairing rather than a claim about a historical person.'],
 ['yungui','云归','Yúnguī',['yún','guī'],['nature','calm'],'Clouds returning to a familiar horizon.','云 means cloud and 归 means returning. The image suggests a reflective journey and a place to return to.'],
 ['huaiyuan','怀远','Huáiyuǎn',['huái','yuǎn'],['wisdom','strength'],'Holding a distant horizon in mind.','怀 suggests holding something in the heart or mind and 远 suggests distance. Together they evoke long perspective and resolve.'],
 ['zimo','子墨','Zǐmò',['zǐ','mò'],['wisdom','creativity'],'A person with a literary, ink-brush spirit.','子 is a familiar name element and 墨 means ink. The combination gives an original character a literary association.'],
];
const wuxia:Pair[]=[
 ['lingchuan','凌川','Língchuān',['líng','chuān'],['strength','nature'],'Resolve carried across a wide river.','凌 suggests rising above or braving something, and 川 is river. Together they create an adventurous landscape image for a fictional character.'],
 ['zhufeng','逐风','Zhúfēng',['zhú','fēng'],['strength','nature'],'Following the wind into a new journey.','逐 means pursuing or following and 风 means wind. The pairing suggests movement and freedom in an adventure setting.'],
 ['zhaochuan','照川','Zhàochuān',['zhào','chuān'],['nature','wisdom'],'Light falling across a river.','照 suggests illumination and 川 a river. The image combines a clear outlook with the movement of a journey.'],
 ['yunfan','云帆','Yúnfān',['yún','fān'],['nature','strength'],'A sail moving toward an open horizon.','云 brings a sky image and 帆 is a sail. Together they suggest travel and forward movement for an original adventure character.'],
 ['qingyue','清岳','Qīngyuè',['qīng','yuè'],['nature','calm'],'Clear air and the steadiness of a mountain.','清 suggests clarity and 岳 a great mountain. Their pairing gives a fictional character a composed, landscape-led presence.'],
 ['yuanzhou','远舟','Yuǎnzhōu',['yuǎn','zhōu'],['nature','strength'],'A boat bound for a distant shore.','远 means distant and 舟 means boat. The combination places a character within a journey and an expansive world.'],
 ['hansong','寒松','Hánsōng',['hán','sōng'],['nature','strength'],'A pine standing firm in the cold.','寒 evokes cold weather and 松 a pine tree. The image suggests endurance in an adventure story.'],
 ['jianqiu','剑秋','Jiànqiū',['jiàn','qiū'],['strength','creativity'],'A blade and the clear air of autumn.','剑 is a sword and 秋 is autumn. This is a deliberately stylised pairing intended for a fictional martial-arts character.'],
 ['xinghe','星河','Xīnghé',['xīng','hé'],['nature','creativity'],'A river of stars above a journey.','星 means star and 河 means river. The pairing offers an expansive night-sky image for an original fictional character.'],
 ['tingfeng','听风','Tīngfēng',['tīng','fēng'],['nature','wisdom'],'An attentive traveller listening to the wind.','听 means listening and 风 means wind. Together they evoke awareness and movement through a martial-arts story world.'],
];
const modern:Pair[]=[
 ['shouan','守安',"Shǒu'ān",['shǒu','ān'],['strength','calm'],'Protecting a sense of peace.','守 suggests guarding or keeping, while 安 means peace. Together they express care for a safe and settled life.'],
 ['youning','佑宁','Yòuníng',['yòu','níng'],['strength','calm'],'Help, protection and a peaceful life.','佑 suggests helping or protecting and 宁 suggests peace. The combination centres on protection and well-being.'],
 ['shengning','胜宁','Shèngníng',['shèng','níng'],['strength','calm'],'Achievement balanced with peace.','胜 suggests victory or achievement and 宁 means peace. Their pairing tempers ambition with a wish for a settled life.'],
 ['chengsheng','承胜','Chéngshèng',['chéng','shèng'],['strength'],'Carrying achievement forward with resolve.','承 suggests carrying on or receiving responsibility and 胜 suggests victory. Together they express a wish to build on achievement.'],
];
function selections(rows:Pair[],styles:NameTheme[]):NameSelection[]{return rows.map(([id,given,pinyin,syllables,traits,meaning,explanation])=>({id,given,pinyin,syllables,traits,meaning,explanation,feel:'neutral',surnames:[0,1,2,3,4,5,6,7],styles}));}
export const expandedNames=[...singleNames,...selections(poetic,['poetic','classical']),...selections(classical,['classical']),...selections(wuxia,['wuxia']),...selections(modern,['modern','poetic'])];
export const expandedCharacterMeanings:Record<string,string>={
  慧:'wisdom; discernment',川:'river',勇:'courage',守:'to guard; keep',佑:'to help; protect',胜:'victory; achievement',兰:'orchid',仁:'humaneness',福:'good fortune',风:'wind',听:'to listen',望:'to look into the distance',怀:'to hold in the heart or mind',墨:'ink',舟:'boat',和:'harmony',微:'small; subtle',庭:'courtyard',衡:'balance',竹:'bamboo',南:'south',初:'beginning',归:'to return',凌:'to brave; rise above',逐:'to pursue; follow',照:'to illuminate',帆:'sail',岳:'great mountain',寒:'cold',松:'pine',剑:'sword',秋:'autumn',河:'river'
};
