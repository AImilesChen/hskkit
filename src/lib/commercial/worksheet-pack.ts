import type {PackSelection,PackWord} from "./catalog.ts";

export const WORKSHEET_MODULES=[
  "meaning-match","hanzi-tone","context-cloze","sentence-order","dialogue-completion",
  "error-correction","reading-comprehension","information-match","writing-speaking","review-test",
] as const;

export type WorksheetModuleKind=typeof WORKSHEET_MODULES[number];
export type WorksheetQuestion={
  id:string;
  prompt:string;
  answer:string;
  explanation:string;
  commonError:string;
  sampleResponse:string;
  responseLines:number;
  fieldKind:"short"|"lines";
};
export type WorksheetModule={kind:WorksheetModuleKind;title:string;instruction:string;questions:WorksheetQuestion[]};
export type WorksheetLevel={level:number;difficultyNote:string;signature:string;modules:WorksheetModule[]};

type LevelProfile={signature:string;difficultyNote:string;context:string;operation:string;output:string;lines:number};

const LEVEL_PROFILES:Record<number,LevelProfile>={
  1:{signature:"concrete recognition · tone copying · one-clause response",difficultyNote:"Level 1 uses concrete labels, direct clues, tone copying and one-clause everyday responses.",context:"教室里的物品标签",operation:"找出一个明确线索",output:"一个完整短句",lines:2},
  2:{signature:"two-step routine · sequence clue · short message",difficultyNote:"Level 2 adds two-step routines, sequence words, short messages and one stated reason.",context:"早晨上学前的两步安排",operation:"连接先后两个细节",output:"两句连贯短讯",lines:3},
  3:{signature:"short narrative · reason-result inference · 50–80-character paragraph",difficultyNote:"Level 3 uses three-sentence narratives, context-controlled choices and reason-result explanations.",context:"一次班级活动的起因和结果",operation:"根据上下文说明原因和结果",output:"50–80个汉字的段落",lines:4},
  4:{signature:"multi-turn change · paragraph cohesion · supported viewpoint",difficultyNote:"Level 4 requires multi-turn reconstruction, changed conditions and a viewpoint supported by passage details.",context:"一次因天气而改变的活动计划",operation:"重建顺序并说明一个推断",output:"80–120个汉字的叙述",lines:5},
  5:{signature:"report claim · evidence selection · 120–180-character summary",difficultyNote:"Level 5 introduces a report claim, two evidence points, sentence insertion and an evidence-led summary.",context:"一份关于学习安排的简短调查报告",operation:"选择证据并说明证据怎样支持结论",output:"120–180个汉字的证据摘要",lines:6},
  6:{signature:"two-section comparison · weak-inference rejection · recommendation",difficultyNote:"Level 6 requires comparison across two report sections, rejection of a weak inference and an evidence-based recommendation.",context:"一份比较两种学习方案的报告",operation:"比较证据、排除弱推断并提出建议",output:"150–220个汉字的比较回应",lines:7},
  7:{signature:"three-paragraph discourse · register control · source-grounded synthesis",difficultyNote:"Level 7 uses an actual three-paragraph source, discourse structure, formal register and source-grounded synthesis.",context:"关于公共语言使用的三段讨论",operation:"追踪三段结构并综合两个明确观点",output:"180–240个汉字的正式综合",lines:8},
  8:{signature:"paired-text inference · claim-evidence integration · qualified proposal",difficultyNote:"Level 8 uses two substantive texts with shared evidence and different interpretations for cross-text synthesis.",context:"两篇对同一语言现象解释不同的短文",operation:"整合两篇文本、推断关系并保留分歧",output:"220–300个汉字的比较建议",lines:9},
  9:{signature:"formal claim and counterclaim · evidence ranking · rebuttal",difficultyNote:"Level 9 uses a formal claim and counterclaim, evidence limits, assumptions and a defensible rebuttal.",context:"一场关于正式措辞的编辑辩论",operation:"评估假设、排列证据并反驳反方观点",output:"300–400个汉字的正式论证",lines:10},
};

const MODULE_META:Record<WorksheetModuleKind,{title:string;instruction:string}>={
  "meaning-match":{title:"Meaning match · 词义配对",instruction:"Match the exact meaning boundary and state why the nearest alternative fails."},
  "hanzi-tone":{title:"Hanzi and tones · 汉字与声调",instruction:"Restore every character and tone, then identify the decisive form contrast."},
  "context-cloze":{title:"Context cloze · 选词填空",instruction:"Choose from discourse evidence, not word-list proximity."},
  "sentence-order":{title:"Sentence order · 句子排序",instruction:"Reconstruct the sequence and name the connector or logic that fixes it."},
  "dialogue-completion":{title:"Dialogue completion · 对话补全",instruction:"Write a coherent turn that satisfies purpose, register and target meaning."},
  "error-correction":{title:"Error correction · 改错",instruction:"Revise the inaccurate use and explain the exact error category."},
  "reading-comprehension":{title:"Reading comprehension · 阅读理解",instruction:"Answer from the supplied source and cite the decisive evidence relationship."},
  "information-match":{title:"Information match · 信息匹配",instruction:"Map claim, source and evidence; reject one unsupported match."},
  "writing-speaking":{title:"Writing / speaking output · 写作与口语",instruction:"Produce an original response meeting the printed evidence, register and length constraints."},
  "review-test":{title:"Review Test · 综合检测",instruction:"Complete the closed-book transfer task before checking the key."},
};

const cleanMeaning=(word:PackWord)=>word.meaning.split(";")[0].trim();
const shortPinyin=(word:PackWord)=>word.pinyin.split("|")[0].trim();
const targetLabel=(word:PackWord)=>`${word.hanzi} (${shortPinyin(word)})`;

function sourceFor(level:number,word:PackWord,peer:PackWord,meaning:string,peerMeaning:string){
  if(level===1)return `标签：老师在图片旁写“${word.hanzi}”，并说明它表示“${meaning}”；另一张标签写“${peer.hanzi}”，表示“${peerMeaning}”。`;
  if(level===2)return `短讯：小安先查到“${word.hanzi}”表示“${meaning}”，然后把它写进留言；同学提醒，“${peer.hanzi}”表示“${peerMeaning}”，不能互换。`;
  if(level===3)return `短文：班级活动开始前，小安需要表达“${meaning}”，所以选了“${word.hanzi}”。小林原来写的是“${peer.hanzi}”，但它表示“${peerMeaning}”。老师说明词义不同，修改后通知才准确。`;
  if(level===4)return `记录：甲先建议用“${peer.hanzi}”，因为活动计划已经改变。乙查到它表示“${peerMeaning}”，与需要表达的“${meaning}”不符。第三轮讨论改用“${word.hanzi}”，通知的逻辑因此恢复一致。`;
  if(level===5)return `报告摘录：调查主张在学习说明中使用“${word.hanzi}”表达“${meaning}”。证据一是多数读者据此完成了正确任务；证据二是改成表示“${peerMeaning}”的“${peer.hanzi}”后，误解明显增加。因此，词义边界直接影响说明的可执行性。`;
  if(level===6)return `第一部分：方案甲使用“${word.hanzi}”表达“${meaning}”，读者能准确执行任务，但编辑成本略高。第二部分：方案乙改用“${peer.hanzi}”，它实际表示“${peerMeaning}”，文字更短，却造成新的理解偏差。报告认为，不能只凭篇幅判断方案优劣。`;
  if(level===7)return `段落一：公共说明需要表达“${meaning}”，编辑组因此提出使用“${word.hanzi}”，并把准确性列为首要标准。 段落二：试读记录显示，读者见到“${word.hanzi}”时能按要求行动；改用表示“${peerMeaning}”的“${peer.hanzi}”后，部分读者误判了任务。 段落三：作者承认前者需要更多解释，但主张在正式场合保留它，同时用例句降低理解成本。`;
  if(level===8)return `文本A：词典与试读数据都把“${word.hanzi}”界定为“${meaning}”；作者据此主张正式说明应优先保证语义精确，即使句子稍长。 文本B：社区编辑更重视阅读速度，建议使用“${peer.hanzi}”，但也承认该词通常表示“${peerMeaning}”，在关键指令中可能扩大误解。两文共享误读数据，却对效率与准确性的权重不同。`;
  return `主张：编辑委员会认为正式文件应使用“${word.hanzi}”表达“${meaning}”。其证据包括词典界定和两轮试读，但样本只来自一个学习群体。 反方：审稿人主张改用“${peer.hanzi}”，理由是句子更短、读者更熟悉；然而该词通常表示“${peerMeaning}”，反方没有证明熟悉度能够消除语义偏差。任务要求评估证据限制、指出双方假设，并反驳较弱的一方。`;
}

function commonErrorFor(kind:WorksheetModuleKind,word:PackWord,peer:PackWord){
  const errors:Record<WorksheetModuleKind,string>={
    "meaning-match":`Common error: matching ${word.hanzi} by topic alone instead of checking the exact meaning boundary against ${peer.hanzi}.`,
    "hanzi-tone":`Common error: writing the right hanzi but omitting or changing one tone in ${shortPinyin(word)}.`,
    "context-cloze":`Common error: choosing ${peer.hanzi} from vocabulary-list proximity while ignoring the sentence-level clue.`,
    "sentence-order":`Common error: producing a grammatical line but placing the reason, contrast or result before its required antecedent.`,
    "dialogue-completion":`Common error: repeating the speaker's words without answering the communicative purpose or matching register.`,
    "error-correction":`Common error: replacing the form without naming whether the original problem was meaning, tone, context or register.`,
    "reading-comprehension":`Common error: giving outside knowledge instead of citing the decisive statement and qualification in the supplied source.`,
    "information-match":`Common error: matching one shared keyword while leaving the source-to-claim evidence link unstated.`,
    "writing-speaking":`Common error: using ${word.hanzi} once but missing the printed length, evidence, comparison or register constraint.`,
    "review-test":`Common error: recalling the definition but failing to transfer ${word.hanzi} into a new evidence-based response.`,
  };
  return errors[kind];
}

function extendedSample(level:number,word:PackWord,peer:PackWord,meaning:string,peerMeaning:string){
  const sentences=[
    `本文主张在这份正式说明中使用“${word.hanzi}”。`,
    `词典把它界定为“${meaning}”，这一界定直接对应文件要表达的核心意思。`,
    `试读材料也显示，读者看到“${word.hanzi}”后更容易完成规定任务。`,
    `相比之下，“${peer.hanzi}”通常表示“${peerMeaning}”，两者只是在同一话题中出现，并不等于可以互换。`,
    `支持“${peer.hanzi}”的人强调句子较短、词语较熟悉，这个考虑有助于提高阅读速度。`,
    `但是，阅读速度不能代替语义准确性，尤其是在错误理解会改变行动结果的时候。`,
    `现有证据的限制是样本范围较小，因此结论不应扩大到所有读者。`,
    `即便如此，反方仍未证明熟悉度足以消除词义偏差，所以它的核心假设较弱。`,
    `更稳妥的方案是保留“${word.hanzi}”，同时增加一个简短例句来降低理解成本。`,
    `这个方案既回应了效率问题，也保持了正式文本所需要的准确性和可核查性。`,
    `如果后续试读出现相反数据，编辑组可以重新评估措辞，而不是把当前决定说成绝对结论。`,
    `因此，在现有证据范围内，“${word.hanzi}”仍是更可辩护的选择。`,
  ];
  const count=level===9?12:level===8?9:level===7?7:level===6?6:level===5?5:level===4?4:level===3?3:level===2?2:1;
  return sentences.slice(0,count).join("");
}

function sampleFor(kind:WorksheetModuleKind,level:number,word:PackWord,peer:PackWord,meaning:string,peerMeaning:string){
  const long=extendedSample(level,word,peer,meaning,peerMeaning);
  const samples:Record<WorksheetModuleKind,string>={
    "meaning-match":`${targetLabel(word)} — ${meaning}；${peer.hanzi}表示“${peerMeaning}”，所以不选。`,
    "hanzi-tone":`${targetLabel(word)}。我逐字核对了汉字，并保留了${shortPinyin(word)}中的全部声调。`,
    "context-cloze":`${word.hanzi}。上下文明确要求“${meaning}”，而${peer.hanzi}表示“${peerMeaning}”。`,
    "sentence-order":`先说明任务情境，再写“${word.hanzi}”及其“${meaning}”这一线索，最后用“因此”引出结果。`,
    "dialogue-completion":`乙：这里应该用“${word.hanzi}”，因为它表示“${meaning}”；如果改用“${peer.hanzi}”，意思就会变成“${peerMeaning}”。`,
    "error-correction":`应改为“${targetLabel(word)}表示‘${meaning}’”。原句把${peer.hanzi}的词义错配给了目标词。`,
    "reading-comprehension":`材料用定义和试读结果支持“${word.hanzi}”；${peer.hanzi}只作为对照出现，不能据此替换目标词。`,
    "information-match":`来源A → 主张使用${word.hanzi} → 证据是其词义“${meaning}”与任务要求一致；拒绝${peer.hanzi}。`,
    "writing-speaking":long,
    "review-test":level>=7?long:`闭卷答案：${targetLabel(word)}表示“${meaning}”。在这个情境中我会使用“${word.hanzi}”，而不用表示“${peerMeaning}”的“${peer.hanzi}”。`,
  };
  return samples[kind];
}

function questionFor(level:number,kind:WorksheetModuleKind,index:number,word:PackWord,peer:PackWord,third:PackWord,profile:LevelProfile):WorksheetQuestion{
  const number=index+1,id=`L${level}-${kind}-${number}`,meaning=cleanMeaning(word),peerMeaning=cleanMeaning(peer);
  const source=sourceFor(level,word,peer,meaning,peerMeaning);
  const responseLines=kind==="writing-speaking"||kind==="review-test"?profile.lines:kind==="reading-comprehension"||kind==="dialogue-completion"?Math.max(2,profile.lines-2):Math.max(1,Math.ceil(level/3));
  const comparison=`${word.hanzi} means “${meaning}”; ${peer.hanzi} means “${peerMeaning}”.`;
  let prompt="",answer="",explanation="";
  switch(kind){
    case "meaning-match":
      prompt=`${number}. ${source} Choose ${word.hanzi}, ${peer.hanzi}, or ${third.hanzi} for “${meaning}”. ${level<=2?"Copy the matching hanzi and pinyin.":level<=6?"Cite the decisive source clue and reject the nearest alternative.":"Classify the competing claim, then justify the exact semantic boundary from the source."}`;
      answer=`${targetLabel(word)} — ${meaning}. ${peer.hanzi} is rejected because it means “${peerMeaning}”.`;
      explanation=`The source defines the target directly. ${comparison}`;
      break;
    case "hanzi-tone":
      prompt=`${number}. ${source} Without copying the source, restore the hanzi and tone-marked pinyin for the item meaning “${meaning}”. ${level>=4?"Then explain how one form or tone error would alter identification.":"Copy it once accurately."}`;
      answer=targetLabel(word);
      explanation=`The approved form is ${targetLabel(word)}; every character and tone mark is part of the identification.`;
      break;
    case "context-cloze":
      prompt=`${number}. ${source} Complete: “根据材料，需要表达‘${meaning}’，最准确的词是______。” ${level>=3?"Quote or paraphrase one surrounding clue.":"Write the target only."}${level>=7?" Preserve the source's qualification or disagreement.":""}`;
      answer=`${word.hanzi}.`;
      explanation=`The explicit definition and the source outcome support ${word.hanzi}; ${peer.hanzi} has the different meaning “${peerMeaning}”.`;
      break;
    case "sentence-order":
      prompt=`${number}. ${source} Reorder these moves: [source setting] [claim using ${word.hanzi}] [evidence] [${level<=3?"result":"qualification or counterpoint"}]. Write the final sequence and underline the connector that fixes it.`;
      answer=`Setting → claim with ${word.hanzi} → evidence → ${level<=3?"result":"qualification/counterpoint"}. Equivalent coherent wording is acceptable.`;
      explanation=`The evidence must follow the claim it supports, while the final move uses the printed logical relationship rather than word-list order.`;
      break;
    case "dialogue-completion":
      prompt=`${number}. ${source} Speaker A asks which wording the group should adopt. Write Speaker B's complete reply using ${word.hanzi}. ${level<=3?"Give one reason.":`Also ${profile.operation}.`}`;
      answer=`A complete reply must adopt ${word.hanzi}, state “${meaning}”, and answer the decision rather than repeat the question.`;
      explanation=`The communicative purpose is a decision with support; accurate target use alone is not a complete turn.`;
      break;
    case "error-correction":
      prompt=`${number}. ${source} Correct this note: “${peer.hanzi} (${shortPinyin(peer)}) means ‘${meaning}’, so it is the supported choice.” Rewrite it and identify the error as meaning, evidence, tone or register. ${level>=7?"Address the source limitation as well.":""}`;
      answer=`Correction: ${targetLabel(word)} means “${meaning}”; ${peer.hanzi} means “${peerMeaning}”.`;
      explanation=`The note assigns the target meaning and source support to the wrong lexical item.`;
      break;
    case "reading-comprehension":
      prompt=`${number}. Read the source: ${source} What does ${word.hanzi} contribute? ${level<=2?"Copy the sentence that tells you.":level<=6?`State the evidence and ${profile.operation}.`:`Synthesize the evidence, qualification and competing interpretation without erasing disagreement.`}`;
      answer=`${word.hanzi} contributes “${meaning}”; the definition and reported outcome are decisive, while ${peer.hanzi} supplies the comparison.`;
      explanation=`A complete answer links claim to source evidence${level>=7?" and preserves the printed limitation or disagreement":""}.`;
      break;
    case "information-match":
      prompt=`${number}. ${source} Complete the map: source → claim → evidence → decision. Match “${meaning}” to ${word.hanzi}, ${peer.hanzi}, or ${third.hanzi}. ${level>=6?"Reject one tempting match and state the missing evidence link.":""}`;
      answer=`Source → ${word.hanzi} → “${meaning}” → supported decision. Reject ${peer.hanzi}: “${peerMeaning}”.`;
      explanation=`Only ${word.hanzi} preserves the complete source-to-claim evidence chain.`;
      break;
    case "writing-speaking":
      prompt=`${number}. Source: ${source} Produce ${profile.output}. Use ${word.hanzi} accurately and ${profile.operation}. ${level>=7?"Separate evidence from interpretation and maintain formal register.":"Include every stated source detail."}`;
      answer=`Rubric: accurate ${word.hanzi}; ${profile.output}; evidence used; ${profile.operation}; source meaning not contradicted.`;
      explanation=`Accept original language only when every printed content, evidence, length and register constraint is met.`;
      break;
    case "review-test":
      prompt=`${number}. Closed book. ${source} First write and define ${targetLabel(word)} from memory. Then produce ${profile.output} that ${profile.operation}. ${level===8?"Compare 文本A and 文本B and preserve their disagreement.":level===9?"State a thesis, rank two evidence points, identify one assumption and rebut the 反方 claim.":"Contrast the target with the nearest alternative."}`;
      answer=`Required: ${targetLabel(word)}; “${meaning}”; accurate contrast with ${peer.hanzi}; ${profile.operation}; all printed output constraints.`;
      explanation=`This transfer item combines form, meaning, source use and Level ${level} reasoning under one matching question ID.`;
      break;
  }
  return {id,prompt,answer,explanation,commonError:commonErrorFor(kind,word,peer),sampleResponse:sampleFor(kind,level,word,peer,meaning,peerMeaning),responseLines,fieldKind:responseLines>=3?"lines":"short"};
}

export function buildWorksheetLevel(selection:PackSelection):WorksheetLevel{
  const {level}=selection,profile=LEVEL_PROFILES[level];
  if(!profile)throw new Error("INVALID_WORKSHEET_LEVEL");
  if(selection.words.length<36)throw new Error("WORKSHEET_SOURCE_WORDS_REQUIRED");
  const modules=WORKSHEET_MODULES.map((kind,moduleIndex)=>{
    const start=moduleIndex*3;
    const questions=Array.from({length:3},(_,index)=>questionFor(level,kind,index,selection.words[(start+index)%selection.words.length],selection.words[(start+index+11)%selection.words.length],selection.words[(start+index+23)%selection.words.length],profile));
    return {kind,title:MODULE_META[kind].title,instruction:`${MODULE_META[kind].instruction} Level ${level} focus: ${profile.operation}.`,questions};
  });
  return {level,difficultyNote:profile.difficultyNote,signature:profile.signature,modules};
}
