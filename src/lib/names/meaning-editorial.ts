import type {NameSelection,NameTrait} from './editorial.ts';

// Original whole-name interpretations. No external naming/LLM lookup is used.
export const meaningNames:NameSelection[]=[
 {id:'meaning-jinming',given:'瑾明',pinyin:'Jǐnmíng',syllables:['jǐn','míng'],feel:'masculine',styles:['modern','poetic','classical'],traits:['beauty','wisdom','hope'],meaning:'The value of fine jade and clear understanding.',explanation:'瑾 refers to beautiful jade and 明 to brightness and understanding. Their pairing values both a refined character and a clear, thoughtful outlook.',surnames:[]},
 {id:'meaning-yuheng',given:'玉衡',pinyin:'Yùhéng',syllables:['yù','héng'],feel:'masculine',styles:['classical','wuxia'],traits:['beauty','wisdom','confidence'],meaning:'The beauty of jade with a balanced outlook.',explanation:'玉 gives the image of jade and 衡 balance. This interpretation joins something carefully valued with judgement and composure, without assigning a quotation.',surnames:[]},
 {id:'meaning-jinan',given:'瑾安',pinyin:"Jǐn'ān",syllables:['jǐn','ān'],feel:'neutral',styles:['modern','poetic','classical'],traits:['beauty','calm'],meaning:'Something treasured and a wish for peace.',explanation:'瑾 contributes the beauty of fine jade and 安 peace. Together they express valuing what matters and wishing for a safe, settled life.',surnames:[]},
 {id:'meaning-ruian',given:'瑞安',pinyin:"Ruì'ān",syllables:['ruì','ān'],feel:'masculine',styles:['modern','poetic','classical'],traits:['fortune','calm'],meaning:'Auspicious wishes and a peaceful life.',explanation:'瑞 suggests an auspicious sign and 安 peace. Together they offer a positive wish for well-being; they do not predict events or guarantee good luck.',surnames:[]},
 {id:'meaning-jiayou',given:'嘉佑',pinyin:'Jiāyòu',syllables:['jiā','yòu'],feel:'masculine',styles:['modern','classical','wuxia'],traits:['fortune','kindness','strength'],meaning:'Goodness, help and positive wishes.',explanation:'嘉 suggests goodness or praise and 佑 help or protection. The pairing expresses a warm wish to support others and meet life with care.',surnames:[]},
 {id:'meaning-shuyun',given:'舒云',pinyin:'Shūyún',syllables:['shū','yún'],feel:'feminine',styles:['modern','poetic','classical'],traits:['freedom','calm','nature'],meaning:'Ease and the freedom of an open sky.',explanation:'舒 suggests unfolding or ease and 云 clouds. Together they create a spacious, unhurried image with room for an independent spirit.',surnames:[]},
 {id:'meaning-siyao',given:'思遥',pinyin:'Sīyáo',syllables:['sī','yáo'],feel:'feminine',styles:['modern','poetic','classical'],traits:['freedom','wisdom','hope'],meaning:'Thoughts reaching toward a distant horizon.',explanation:'思 means thought or reflection and 遥 suggests distance. Their pairing evokes an imaginative, forward-looking mind with room to explore.',surnames:[]},
 {id:'meaning-huining',given:'惠宁',pinyin:'Huìníng',syllables:['huì','níng'],feel:'neutral',styles:['modern','poetic','classical'],traits:['kindness','calm'],meaning:'Kindness and a peaceful heart.',explanation:'惠 suggests kindness and generosity, while 宁 means peace. Together they express consideration for others and a wish for a settled life.',surnames:[]},
 {id:'meaning-huairen',given:'怀仁',pinyin:'Huáirén',syllables:['huái','rén'],feel:'masculine',styles:['classical','wuxia'],traits:['kindness','wisdom'],meaning:'Keeping humaneness close to the heart.',explanation:'怀 suggests holding something in the heart or mind and 仁 humaneness. Their pairing puts care for others at the centre of a considered outlook.',surnames:[]},
 {id:'meaning-renya',given:'仁雅',pinyin:'Rényǎ',syllables:['rén','yǎ'],feel:'feminine',styles:['modern','poetic','classical'],traits:['kindness','creativity','beauty'],meaning:'Humaneness expressed with grace.',explanation:'仁 suggests humaneness and 雅 refinement. Together they connect consideration for others with a gentle, thoughtful manner.',surnames:[]},
 {id:'meaning-huaici',given:'怀慈',pinyin:'Huáicí',syllables:['huái','cí'],feel:'feminine',styles:['classical','wuxia'],traits:['kindness','strength'],meaning:'Holding compassion at the heart of resolve.',explanation:'怀 suggests keeping something in the heart and 慈 compassion. The pairing gives a determined outlook a caring centre, without claiming a historical or literary source.',surnames:[]},
 {id:'meaning-jiarui',given:'嘉瑞',pinyin:'Jiāruì',syllables:['jiā','ruì'],feel:'masculine',styles:['modern','poetic','classical'],traits:['fortune','joy','hope'],meaning:'Goodness and auspicious wishes.',explanation:'嘉 expresses goodness or praise and 瑞 an auspicious sign. Together they offer a positive wish for a good life; the interpretation is not a prediction of luck.',surnames:[]},
 {id:'meaning-jiayue',given:'嘉悦',pinyin:'Jiāyuè',syllables:['jiā','yuè'],feel:'feminine',styles:['modern','poetic','classical'],traits:['fortune','joy'],meaning:'Positive wishes and a delighted heart.',explanation:'嘉 suggests goodness and 悦 delight. Their combination offers a warm wish for happiness, rather than a promise about someone’s future.',surnames:[]},
 {id:'meaning-mingxi',given:'明曦',pinyin:'Míngxī',syllables:['míng','xī'],feel:'feminine',styles:['poetic','classical'],traits:['hope','wisdom','nature'],meaning:'Clear understanding in the light of morning.',explanation:'明 contributes brightness and understanding and 曦 the light of the rising sun. Together they create a fresh, hopeful image of a new day.',surnames:[]},
 {id:'meaning-ziruo',given:'自若',pinyin:'Zìruò',syllables:['zì','ruò'],feel:'neutral',styles:['modern','classical','wuxia'],traits:['confidence','calm'],meaning:'Composure and an assured, unhurried manner.',explanation:'自若 is an expression for remaining composed and at ease. As a given name, the pairing suggests self-possession when circumstances change.',surnames:[]},
];
export const meaningCharacterMeanings:Record<string,string>={惠:'kindness; generosity',慈:'compassion',瑞:'auspicious sign',曦:'morning sunlight',自:'self; oneself',瑾:'beautiful jade',玉:'jade',遥:'far; distant'};

// Explicit whole-given-name associations. A category is not a required glyph.
// Existing six-category editorial tags remain intact for compatibility.
const additionalTags:Record<string,string>={
 freedom:'明远|远|云|川|云舒|云舟|云帆|远舟|逐风|凌川|凌岳|志远|怀远|怀川|思远|天宇|宇航|星河|星舟|望岳|行舟|南初|云归|听风|向阳|博远|庭远|承风|望川|梦云',
 kindness:'仁|佑|守|嘉宁|佳怡|承安|守安|佑宁|惠宁|怀仁|仁雅|怀慈',
 hope:'明|朗|晴|晨光|晓晴|雨晴|语晴|清扬|景明|明朗|向阳|明远|景云|景安|明和|明初|清初|南初|照川|承明|清朗|诗晴|望舒|星辰|明曦|嘉瑞',
 confidence:'勇|守|胜|朗|武|毅|衡|岳|峰|俊|杰|博|志|承|仁|思齐|明朗|清扬|浩然|志远|俊杰|承安|守安|承胜|胜宁|书衡|子衡|凌岳|凌川|寒松|远松|松远|清岳|清朗|承风|自若|静|静怡|婉清|清婉|雅宁|怀慈',
 beauty:'兰|雅|婉|雯|瑶|琴|诗|俊|俊杰|若兰|静兰|清婉|婉清|雅文|书雅|若宁|云婉|雨瑶|书瑶|诗涵|诗晴|若琴|雅宁|婉宁|景和|望舒|仁雅',
 fortune:'福|嘉宁|佳怡|可欣|欣然|心悦|欣怡|景和|清和|嘉瑞|嘉悦',
};
export function meaningTraitsFor(name:Pick<NameSelection,'given'|'traits'>):NameTrait[]{
 const added=Object.entries(additionalTags).filter(([,names])=>names.split('|').includes(name.given)).map(([id])=>id as NameTrait);
 return [...new Set([...name.traits,...added])];
}
