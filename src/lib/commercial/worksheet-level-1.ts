import type {WorksheetQuestion,WorksheetModuleKind} from './worksheet-pack.ts';

// Editorially authored Level 1 pilot. Answers are deliberately absent from the
// retrieval stimulus; the answer key and completed sample share these records.
type Draft=[prompt:string,answer:string,explanation:string,commonError:string,sampleResponse:string,lines?:number];
const units:Record<WorksheetModuleKind,Draft[]>={
  'meaning-match':[
    ['1. You want a cup of tea. Which object holds the tea? A. 杯子  B. 本子  C. 包子. Write its hanzi.', 'A · 杯子','杯子 holds a drink; 本子 is for writing and 包子 is food.','Choosing 包子 because its first sound resembles 杯子.','A · 杯子'],
    ['2. It is eight o’clock. Which character writes the number eight? A. 百  B. 八  C. 半. Write the character and read it aloud.','B · 八 (bā)','八 is 8; 百 is 100 and 半 is one half.','Confusing 八 with 百 because both begin with b.','B · 八 (bā)'],
    ['3. Someone is ill and is waiting for a doctor. Choose A. 病人  B. 别人  C. 爸爸. Copy the best word.','A · 病人','病人 is a patient; 别人 means other people and 爸爸 means dad.','Choosing 爸爸 because the patient could also be someone’s father; that is not stated.','A · 病人'],
  ],
  'hanzi-tone':[
    ['1. Guided form: 茶, pinyin chá. Copy 茶 once and circle the rising tone mark in chá. Then say the syllable aloud.','茶 · chá','茶 is a second-tone syllable; the rising mark goes above a.','Writing cha without a tone does not identify the practiced pronunciation.','茶 · chá (rising tone)',2],
    ['2. From memory, write the character for the number 8 in the box. Then add the correct tone to ba: ____.','八 · bā','The numeral 八 has a first tone, not the neutral-tone particle 吧.','Writing 吧 confuses a suggestion particle with the numeral.','八 · bā',2],
    ['3. Your father calls you. Say the everyday word for “dad” aloud, then write its two-syllable pinyin with tones: ______. Which syllable is neutral?','bàba · second syllable','The first 爸 is fourth tone; the repeated syllable is neutral in this everyday form.','Marking both syllables fourth tone rather than noticing the neutral ending.','bàba；第二个 ba 是轻声。',2],
  ],
  'context-cloze':[
    ['1. 我口渴了，请给我一____水。 A. 杯  B. 本  C. 病. Choose and copy the full sentence.','A · 杯；我口渴了，请给我一杯水。','杯 counts a serving of liquid; 本 counts books and 病 is an illness.','Choosing 本 because 一 also precedes book measures; 水 selects 杯.','我口渴了，请给我一杯水。',2],
    ['2. 现在是上午九点，不是晚上。现在是____。 A. 白天  B. 半夜  C. 半年.','A · 白天','上午九点 is in the daytime; 半夜 is midnight and 半年 is six months.','Selecting 半夜 because it describes a time, ignoring 上午.','现在是白天。'],
    ['3. 我不会做这个题。你能____我吗？ A. 帮  B. 唱  C. 喝.','A · 帮；你能帮我吗？','帮我 means help me with the task; 唱我 and 喝我 do not express an offer of help and do not fit this sentence.','Using 帮忙我 is not grammatical here: use 帮我 or 帮我一个忙.','你能帮我吗？'],
  ],
  'sentence-order':[
    ['1. Put the slips in a sensible order: A. 我喝茶。 B. 我拿杯子。 C. 我倒茶。 Write letters and a complete sentence for the last action.','B → C → A','A cup is needed before pouring; the tea is poured before it is drunk.','Drinking before pouring breaks the physical sequence.','B → C → A；我喝茶。',2],
    ['2. Order: A. 爸爸说“谢谢”。 B. 我帮爸爸拿包。 C. 爸爸的包很重。 Which event explains the thanks?','C → B → A；B explains the thanks.','The heavy bag motivates help; thanks follows the help.','Putting thanks first removes its cause.','C → B → A；我帮爸爸拿包。',2],
    ['3. Order the day: A. 我晚上回家。 B. 我白天上课。 C. 我早上起床。 Write the three letters.','C → B → A','早上 precedes 白天的课, which precedes 晚上.','Ordering by letter instead of the time expressions.','C → B → A'],
  ],
  'dialogue-completion':[
    ['1. A: 你想喝什么？ B: ______. Reply politely using 茶 and 杯.','我想喝一杯茶。','一杯茶 states both a quantity and the requested drink.','Answering only 茶 is understandable but does not practise the complete request.','我想喝一杯茶。',2],
    ['2. A: 这个题我不会做，你能帮我吗？ B: ______. Agree and offer help in a full sentence.','可以，我帮你。','可以 answers the request; 我帮你 offers the action.','Repeating the question does not answer the other speaker.','可以，我帮你。',2],
    ['3. A: 谢谢你帮我！ B: ______. Respond naturally; do not repeat 谢谢.','不客气。','不客气 is an appropriate response to thanks, not another request for help.','Repeating 谢谢 fails to take the second conversational turn.','不客气。',2],
  ],
  'error-correction':[
    ['1. A learner wrote “我喝一本茶”。 Replace only the wrong character and write the corrected sentence.','我喝一杯茶。','杯 measures the tea serving; 本 measures books.','Leaving 本 unchanged because the sentence still has a number and a measure.','我喝一杯茶。'],
    ['2. A learner wrote “现在是早上九点，所以是半夜”。 Replace the wrong time word.','现在是早上九点，所以是白天。','九点 in the morning belongs to 白天, not 半夜.','Changing 早上 instead of repairing the contradictory conclusion.','现在是早上九点，所以是白天。'],
    ['3. A learner wrote “爸爸病了，所以他是杯子”。 Replace the last word with a person word.','爸爸病了，所以他是病人。','病人 identifies an ill person; 杯子 is a drinking vessel.','Using 病 instead of 病人 when a person noun is needed.','爸爸病了，所以他是病人。'],
  ],
  'reading-comprehension':[
    ['1. Read: 小美早上带了一个杯子。到了学校，她用杯子喝水。她没买茶。 What did she drink? A. 水  B. 茶  C. 包子. Cite the words that decide it.','A · 水；“用杯子喝水”','The passage says 喝水 and explicitly rules out buying tea; 包子 is food.','Choosing 茶 because it is a common drink, not because this passage says so.','A · 水；材料写“用杯子喝水”。',2],
    ['2. Read: 爸爸今天病了，没有去上班。下午，医生来看他。 Who came in the afternoon? A. 老师  B. 医生  C. 别人.','B · 医生','医生 is explicitly named as the afternoon visitor; the other choices are unsupported.','Assuming 老师 came because the learner has seen classroom stories.','B · 医生；“下午，医生来看他”。',2],
    ['3. Read: 小安先写作业，写完后才唱歌。 When did 小安 sing? A. before homework  B. after homework  C. during homework.','B · after homework','写完后才 makes singing later than completing homework.','Ignoring 后才 and reporting an activity but not its order.','B；写完作业以后唱歌。',2],
  ],
  'information-match':[
    ['1. Notices: A “明天早上八点见。” B “明天晚上八点见。” Your class meets before lunch. Which notice matches? Give one clue.','A；早上','Before lunch is compatible with 早上, not 晚上.','Matching 八点 alone and missing the morning/evening contrast.','A；早上八点是在午饭前。',2],
    ['2. Lists: A 茶、杯子、水；B 本子、笔、书. You need things for a drink. Which list fits and why?','A；茶、水可以喝，杯子装水或茶。','A contains drink-related items; B is for writing/reading.','Choosing B because it includes three familiar objects but none serve the drink.','A；杯子里可以放水或茶。',2],
    ['3. Cards: A “我能帮你拿包。” B “我今天病了。” A friend needs help carrying a bag. Which card is an offer?','A；“帮你拿包”','A offers the requested help; B reports illness but offers nothing.','Choosing B because the speaker may need help rather than offering it.','A；“我能帮你拿包。”',2],
  ],
  'writing-speaking':[
    ['1. Draw or imagine a table with a cup and tea. Write one new sentence using 一杯茶; do not copy a sentence from this page.','Accept a grammatical original sentence, e.g. 爸爸想喝一杯茶。','Score 1 for 一杯茶 used as a drink phrase and 1 for a complete understandable sentence.','Listing 茶 and 杯 without making a sentence does not show use.','爸爸想喝一杯茶。',2],
    ['2. Your friend cannot carry a heavy bag. Say or write one complete offer using 帮; include who will help whom.','Accept e.g. 我帮你拿包。','Score 1 for a correct offer with 帮 and 1 for a named helper and recipient.','“帮忙” alone does not specify the offered action or the people.','我帮你拿包。',2],
    ['3. Write two short sentences about something you do in 白天 and something you do in 晚上.','Accept e.g. 我白天上课。我晚上看书。','Score 1 for the daytime activity, 1 for the evening activity, and 1 for two coherent sentences.','Writing both activities at the same time misses the contrast.','我白天上课。我晚上看书。',3],
  ],
  'review-test':[
    ['1. Tomorrow, without looking at earlier pages: your friend asks for one serving of water. Write a complete request with the right measure word.','请给我一杯水。','杯 measures a drink; a complete request includes the item and the measure.','Writing 一本水 transfers the book measure to a drink.','请给我一杯水。',2],
    ['2. Tomorrow: someone thanks you for carrying a bag. Write a natural reply in Chinese.','不客气。','Respond to gratitude with 不客气, not with another 谢谢.','Echoing the thanks rather than answering it.','不客气。'],
    ['3. Tomorrow: a classmate is ill. Write two short sentences: say who needs help and offer to help with a bag.','Accept e.g. 他是病人。我帮他拿包。','Score 1 for identifying the ill person, 1 for a complete offer and 1 for correct pronoun reference.','Copying an earlier answer without adapting the recipient to 他.','他是病人。我帮他拿包。',3],
  ],
};
export function authoredLevelOne(kind:WorksheetModuleKind):WorksheetQuestion[]{
  return units[kind].map(([prompt,answer,explanation,commonError,sampleResponse,lines],index)=>({
    id:`L1-${kind}-${index+1}`,prompt,answer,explanation,commonError,sampleResponse,
    responseLines:lines??1,fieldKind:(lines??1)>=3?'lines':'short',
  }));
}
