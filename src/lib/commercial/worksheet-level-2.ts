import type {WorksheetQuestion,WorksheetModuleKind} from './worksheet-pack.ts';

// Each item has a separate learner prompt, key, rationale, misconception and worked response.
type Draft=[prompt:string,answer:string,explanation:string,commonError:string,sampleResponse:string,lines?:number];
const units:Record<WorksheetModuleKind,Draft[]>={
  'meaning-match':[
    ['1. 小林上午有课，中午和妈妈吃饭。两点以后他没有安排，图书馆晚上关门。他想去图书馆。Which time fits his visit? A. 上午 B. 下午 C. 晚上. Write the letter and time.','B · 下午','上午有课；两点以后是下午，且晚上图书馆关门，所以应选下午。','认为晚上也可以去，却忽略图书馆晚上关门。','B · 下午；两点以后有空，晚上图书馆关门。'],
    ['2. 短讯：“我先去超市买水果，再去你家。” Where will the sender go first? A. 你家 B. 超市 C. 学校.','B · 超市','“先”标出超市是第一站；“再”引出随后去你家。','只看短信末尾的“你家”，忽略“先”。','B · 超市；先买水果，再去你家。'],
    ['3. 妈妈说：“雨停了以后，我们去公园。” Which condition must happen before the outing? A. 雨停 B. 到家 C. 吃饭.','A · 雨停','“以后”把出行放在雨停之后；另两项不在话中。','把“雨停了以后”当成出门后会发生的事。','A · 雨停；雨停后才去公园。'],
  ],
  'hanzi-tone':[
    ['1. Tomorrow a friend comes to visit. Write the two hanzi for the day after today, then write its tone-marked pinyin from memory.','明天 · míngtiān','明是第二声，天是第一声；合起来指今天之后的一天。','写成“今天”或把 tiān 标成第四声。','明天；míngtiān。',2],
    ['2. A bus is due at eight in the evening, not in the morning. Write the two-hanzi time word and tone-marked pinyin; identify the neutral syllable.','晚上 · wǎnshang；shang 是轻声','晚读第三声，日常“晚上”的上读轻声。','把 shang 也标成第三声，或漏掉晚的声调。','晚上；wǎnshang；第二音节轻声。',2],
    ['3. Fill the one-character sequence word in “__洗手，再吃饭”. Write its tone-marked pinyin from memory as well.','先 · xiān','先表示第一步，读第一声；后面的“再”引出第二步。','写成“再”会把两步的先后线索弄丢。','先；xiān；先洗手，再吃饭。',2],
  ],
  'context-cloze':[
    ['1. 八点上课，小周七点半出门。他说：“我____吃早饭，再去学校。” A. 先 B. 才 C. 也. Copy the completed line.','A · 先；我先吃早饭，再去学校。','“先……再……”明确安排早餐在去学校之前。','选“才”却保留“再”，使顺序表达不自然。','A；我先吃早饭，再去学校。',2],
    ['2. 短讯：“我到车站了，可是车还没来。我在这里____车。” A. 等 B. 买 C. 写. Choose and give the clue.','A · 等；车还没来','车尚未到站，人在车站等车；买、写不符合这个动作。','只见“车站”就猜“买”，忽略“车还没来”。','A · 等；“车还没来”说明要等。',2],
    ['3. 小雨下午要看医生，所以她给老师发消息：“今天下午我____去上课。” A. 不能 B. 正在 C. 一起.','A · 不能','下午要去看医生与上课时间冲突，因此不能去；“正在去”与请假消息不合。','把“正在”当作一般将来安排。','今天下午我不能去上课。',2],
  ],
  'sentence-order':[
    ['1. Put the actions in order: A. 我把书还给图书馆。 B. 我从图书馆借书。 C. 我读完这本书。 Write letters and the clue that fixes the last step.','B → C → A；读完才还书','借到书才能读，读完后才能还；“读完”确定归还前的步骤。','在借之前还同一本书。','B → C → A；我读完书以后还书。',2],
    ['2. Order the short message: A. 我到了以后给你打电话。 B. 我现在坐地铁去你家。 C. 你再下楼。 Write the sequence.','B → A → C','先乘地铁，到了打电话，对方接到电话再下楼。','在到达之前让对方下楼，忽略“到了以后”。','B → A → C；到了以后打电话，你再下楼。',2],
    ['3. Arrange dinner steps: A. 然后把菜放进锅里。 B. 先洗菜。 C. 菜做好了，我们吃饭。 State why A cannot be first.','B → A → C；菜要先洗再下锅','“先”指洗菜为第一步，“然后”是入锅，做好后才吃。','只按字母顺序排列而不看“先”“然后”。','B → A → C；先洗菜，再放进锅里。',2],
  ],
  'dialogue-completion':[
    ['1. A: 明天早上你有空吗？我们可以一起去买菜吗？ B: ______. B has a class in the morning but is free in the afternoon. Reply with both facts.','Accept e.g. 我早上有课，下午有空。我们下午去吧。','答复同时说明早上冲突与下午替代时间，才回应邀约。','只说“有空”会让对方误以为早上可以去。','我早上有课，下午有空。我们下午去吧。',2],
    ['2. A: 你怎么还没到？ B: ______. You are waiting at the bus stop because your bus has not arrived; tell your friend you will call after you reach their place.','Accept e.g. 公交车还没来。我到了以后给你打电话。','第一句解释延迟，第二句给出抵达朋友所在地后的联系安排。','只说“我到了”会误导对方以为已到约定地点；须说明车还没来。','公交车还没来。我到了以后给你打电话。',2],
    ['3. A: 晚饭前我们做什么？ B: ______. Say you will buy fruit first and then go home to cook.','Accept e.g. 我们先买水果，再回家做饭。','“先……再……”把采购和回家做饭按要求排好。','只写“做饭”漏掉采购这一步。','我们先买水果，再回家做饭。',2],
  ],
  'error-correction':[
    ['1. 小陈要坐车去上课。他写：“我先到学校，再坐车出门。” Keep the intended trip but correct the order in one sentence.','我先坐车出门，再到学校。','坐车出门是去学校的途中动作，不能在抵达之后。','只换“先”为“再”，却没有把两个动作重新排好。','我先坐车出门，再到学校。',2],
    ['2. 短讯说：“明天下午两点见。” A student replies “好，明天上午两点见。” Correct only the mistaken time word and write the reply.','好，明天下午两点见。','约定是下午两点；回复中的上午与原短信冲突。','改数字而不改上午，仍然约错时段。','好，明天下午两点见。',2],
    ['3. 小雨要先洗水果，再吃。她写：“吃完水果以后，我洗水果。” Rewrite the line so it describes her plan.','我先洗水果，再吃。','洗水果必须在吃之前；原句的“吃完以后”颠倒了顺序。','保留“吃完以后”只是换主语，错误仍在。','我先洗水果，再吃。',2],
  ],
  'reading-comprehension':[
    ['1. Read: “小海周六上午去超市买鸡蛋。下午他在家做饭，没有去公园。” What did he do after shopping? A. 做饭 B. 去公园 C. 上课. Cite a phrase.','A · 做饭；“下午他在家做饭”','上午购物，下午做饭；原文明确说没有去公园。','因周六常去公园而无视“没有去公园”。','A · 做饭；依据“下午他在家做饭”。',2],
    ['2. Read the message: “我五点下班。先回家拿书，再到图书馆找你。大约六点到。” Where does the sender go immediately after work? A. 图书馆 B. 家 C. 学校. Cite a clue.','B · 家；“先回家拿书”','回家拿书是下班后的第一站，然后才去图书馆。','把最终会面的地点当成第一站。','B · 家；“先回家拿书”。',2],
    ['3. Read: “妈妈上午不舒服，去了医院。医生让她回家休息。下午她没有去上班。” Why did she miss work in the afternoon? Give one detail from the text.','因为上午不舒服，医生让她回家休息。','身体不适并遵医嘱回家休息，解释了下午没有上班。','推测医院关门等原文没有的信息。','她不舒服；医生让她回家休息，所以下午没上班。',2],
  ],
  'information-match':[
    ['1. Calendar: A 周一上午：上课；B 周一下午：看医生；C 周二上午：买菜. A friend asks when the doctor visit is. Give the card and time.','B · 周一下午','只有B的活动是看医生；A同日但不同活动，C隔日。','只看“周一”而选上课。','B；周一下午看医生。',2],
    ['2. Two messages: A “我到了，请下楼。” B “车还没来，请再等十分钟。” Which message should a friend receive if the sender is still at the bus stop? Give the clue.','B；“车还没来”','B描述仍在等车；A宣称已经到达。','因为两条都涉及等待就随意选A。','B；车还没来，朋友需要再等。',2],
    ['3. Plans: A 先买菜，再做饭；B 先做饭，再买菜；C 买菜以后去看电影. The fridge is empty and the family wants dinner at home. Pick the suitable plan and explain both steps.','A；先买菜，再在家做饭','没有食材须先购买，目标是家中晚饭；B次序反，C没有做饭。','只匹配“买菜”就选C，忽略晚饭目标。','A；冰箱空了，先买菜才能做饭。',2],
  ],
  'writing-speaking':[
    ['1. Your friend will visit at six. You finish class at five and need to buy fruit on the way home. Write a two-sentence message stating when class ends and what you will do before going home. Do not copy the scenario word for word.','Accept e.g. 我五点下课。回家前我先去买水果。','两句分别报告五点下课及回家前买水果；可用同义自然措辞。','只说六点见面，没有交代路上的安排。','我五点下课。回家前我先去买水果。',3],
    ['2. A friend wants to meet tomorrow morning, but you must see a doctor then. Write a polite two-sentence reply that explains the conflict and suggests tomorrow afternoon instead.','Accept e.g. 不好意思，我明天上午要去看医生。我们下午见面，好吗？','需说明上午冲突且提出下午替代方案；礼貌问句完成协商。','只说“不能”而没有提出可行时间。','不好意思，我明天上午要去看医生。我们下午见面，好吗？',3],
    ['3. Tell a housemate in two short sentences what to do before dinner: wash the vegetables, then cook them. Use a sequence expression and a natural request.','Accept e.g. 请先洗菜。洗好以后再做饭。','先洗菜再做饭，语气适合向室友提出请求；两句均表达步骤。','写成饭后才洗菜，颠倒准备顺序。','请先洗菜。洗好以后再做饭。',3],
  ],
  'review-test':[
    ['1. Tomorrow, closed book: your friend expects you at the station at eight, but your bus has not arrived. Write a two-sentence message explaining the delay and promising to call when you arrive.','Accept e.g. 公交车还没来，我会晚一点到。我到了以后给你打电话。','第一句说明等车导致迟到；第二句约定抵达后再联系。','只写“我到了”与尚未到站冲突。','公交车还没来，我会晚一点到。我到了以后给你打电话。',3],
    ['2. Tomorrow, closed book: you have class in the morning and want to buy a notebook afterward. Write two connected sentences with the correct order.','Accept e.g. 我上午上课。下课以后，我去买本子。','先上课，课后买本子；“以后”准确连接两个动作。','把购物说成课前，与题目“afterward”冲突。','我上午上课。下课以后，我去买本子。',3],
    ['3. Tomorrow, closed book: a friend invites you to the park in the afternoon, but you need to take your mother to the hospital then. Write a polite reply explaining why you cannot go and proposing tomorrow morning.','Accept e.g. 不好意思，今天下午我要陪妈妈去医院，不能去公园。我们明天上午去，好吗？','答复须说明下午的冲突、礼貌拒绝并提出明早替代时间。','只提出明早，不解释今天下午为何不能赴约。','不好意思，今天下午我要陪妈妈去医院，不能去公园。我们明天上午去，好吗？',3],
  ],
};

export function authoredLevelTwo(kind:WorksheetModuleKind):WorksheetQuestion[]{
  return units[kind].map(([prompt,answer,explanation,commonError,sampleResponse,lines],index)=>({
    id:`L2-${kind}-${index+1}`,prompt,answer,explanation,commonError,sampleResponse,
    responseLines:lines??1,fieldKind:(lines??1)>=3?'lines':'short',
  }));
}
