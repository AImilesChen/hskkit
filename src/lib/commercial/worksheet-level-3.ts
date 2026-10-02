import type {WorksheetModuleKind,WorksheetQuestion} from './worksheet-pack.ts';

// The learner sees only prompt; keys and worked responses are printed separately.
type Draft=[prompt:string,answer:string,explanation:string,commonError:string,sampleResponse:string,lines?:number];
const units:Record<WorksheetModuleKind,Draft[]>={
  'meaning-match':[
    ['1. 小孟约了同学放学后打球。出门时天突然下起大雨，他给同学发消息说今天不去了。Which best describes the change? A. 取消 B. 继续 C. 提前. Give one reason.','A · 取消','原本约好打球，后来明确说不去了；不是继续，也没有改成更早的时间。','把“突然”误当成“提前”的线索。','A · 取消；他发消息说今天不去了。',2],
    ['2. 书店门口排了很长的队。小宁本来想进去买书，看到队伍后决定明天再来。Which action fits her decision? A. 排队 B. 推迟 C. 拒绝. Explain why.','B · 推迟','她仍打算买书，只是改到明天；并非现在排队，也不是永远不买。','把暂时改期理解成完全拒绝。','B · 推迟；她改到明天买书。',2],
    ['3. 小赵的杯子不见了，他问了几位同学。最后一位同学说，在教室窗边看见过那个杯子。What did the classmate provide? A. 线索 B. 结果 C. 要求. Cite the detail.','A · 线索','窗边的目击地点有助于继续寻找，但并没有说杯子已被找回。','把目击地点当作已经找到杯子的结果。','A · 线索；同学说在窗边看见过杯子。',2],
  ],
  'hanzi-tone':[
    ['1. You promised to bring a book, but left it at home. Write the two-character verb meaning “forget” in that sentence and its tone-marked pinyin from memory.','忘记 · wàngjì','忘是第四声，记也是第四声；“忘记带书”说的是记得要做却没做。','写成“忘纪”，或漏掉两个第四声。','我忘记带书了。忘记：wàngjì。',2],
    ['2. The meeting starts at nine; you reach the room at nine ten. Write the two-character word meaning “late” and its tone-marked pinyin from memory.','迟到 · chídào','迟为第二声，到为第四声；时间对照表明已过开始时间。','把 chí 写成第一声，或把“迟到”误写成“知道”。','我九点十分才到，迟到了。迟到：chídào。',2],
    ['3. Your friend helped you carry a heavy box. Write the two-character word for thanking them and its tone-marked pinyin from memory.','谢谢 · xièxie','第一个谢读第四声；日常“谢谢”的第二个谢读轻声。','给第二个 xie 也标第四声，忽略轻声。','谢谢你帮我搬箱子。谢谢：xièxie。',2],
  ],
  'context-cloze':[
    ['1. 小周昨天没带伞，到家时衣服全湿了。今天出门前他看见窗外又在下雨，就把伞放进包里。他说：“我今天____带伞了。” A. 终于 B. 仍然 C. 从来. Choose and explain the change.','A · 终于','昨天没带，今天带上了；“终于”体现期待中的改变，仍然与从来不符合前后对照。','只看“下雨”选仍然，忽略今天与昨天行为不同。','A · 终于；昨天忘带，今天出门前把伞装进包里。',2],
    ['2. 饭店七点关门，小林六点半才下班。他打电话问老板能不能留一份饭，老板同意了。小林说：“____来得晚，我也能吃到晚饭。” A. 虽然 B. 因为 C. 如果.','A · 虽然','来得晚与仍能吃到饭形成让步关系；“因为”表示原因，“如果”与已经发生的事实不合。','将留饭的原因误说成他来得晚。','A · 虽然来得晚，我也能吃到晚饭。',2],
    ['3. 小叶想借一本书，图书馆系统显示还有一本在架上。她走到书架前却没有找到，于是去服务台询问。“系统说有，____书架上没有。” A. 可是 B. 所以 C. 于是.','A · 可是','系统显示有与实地找不到相矛盾；“可是”引出反差，后面的询问才是结果。','用“所以”把相反事实错写成因果。','A · 可是；系统记录和书架上的情况不一致。',2],
  ],
  'sentence-order':[
    ['1. Order the three sentences into a short story: A. 老师看见后，让他先去校门口找。 B. 小方到了教室，发现书包不在身边。 C. 他回到校门口，在长椅上找到了书包。 Write the letters and the clue fixing the last event.','B → A → C','先发现丢包，老师才给寻找建议；“回到校门口”并找到书包是行动后的结果。','让找到书包发生在发现丢包之前。','B → A → C；发现没带包后，他按老师的建议回去找。',2],
    ['2. Order this message: A. 结果他错过了去比赛场地的那班车。 B. 小吴早上想坐车去参加比赛。 C. 但出门时，他才发现公交卡不见了，回家找了很久。 Give the connector that fixes the final line.','B → C → A；结果','计划先出现，“但”引出找公交卡耽误时间的意外，“结果”引出错过车的后果。','把错过车放到找公交卡之前，割断因果。','B → C → A；“结果”说明找公交卡耽误时间后错过了车。',2],
    ['3. Order the update: A. 她马上给店里打电话，请他们先别送。 B. 小唐订了一张桌子，约好周五送到家。 C. 周四晚上她接到通知，周五家里要停电，电梯不能用。 State why A follows C.','B → C → A','先有送货约定，随后停电通知改变条件，她才联系店里暂停配送。','以为“先别送”的“先”意味着打电话一定是第一件事。','B → C → A；收到停电通知后才有改配送安排的理由。',2],
  ],
  'dialogue-completion':[
    ['1. A: 今天的电影还有半小时就开场了，你怎么还在家？ B: ______. You discovered you left your ticket at the office. Explain the delay and offer a workable plan to your friend.','Accept e.g. 我把票忘在办公室了，得先去取。你先进场，我取到票就过去。','答复要解释仍在家的原因，并提出不让朋友白等的安排；不能只说迟到。','只说“马上到”，没有解决取票问题。','我把票忘在办公室了，得先去取。你先进场，我取到票就过去。',3],
    ['2. A: 明天一起去爬山吗？天气预报说下午有雨。 B: ______. You want to go, but suggest an earlier return because of the forecast.','Accept e.g. 好啊，我们早点出发，中午前回来吧。这样就不用在山上遇到下午的雨。','同意邀约，同时用下午可能下雨解释提前回程；不必凭空取消活动。','只回答“好”，没有回应天气和返程时间。','好啊，我们早点出发，中午前回来吧。这样就不用在山上遇到下午的雨。',3],
    ['3. A: 你借的那本书我明天要用，今晚能还给我吗？ B: ______. You have not finished it; ask whether returning it before class tomorrow works, and offer a useful alternative tonight.','Accept e.g. 不好意思，我还没看完，明早上课前还给你来得及吗？今晚我可以先把你要用的那几页拍给你；如果明早来不及，我今晚就还。','说明未读完，先询问明早归还是否来得及；今晚提供资料，若对方仍需原书则今晚归还，不能替对方决定。','只要求多借一天，却忽略对方明天要用原书。','不好意思，我还没看完，明早上课前还给你来得及吗？今晚可以先把你要用的几页拍给你；不方便的话我今晚就还。',3],
  ],
  'error-correction':[
    ['1. 小丽周三要交报告，周二晚上已经写完了。同学给她发消息：“你周三才开始写，肯定来不及。” Correct the mistaken time relationship without changing the deadline.','她周二晚上就写完了，周三可以按时交报告。','原句说周三才开始，与周二已完成的事实冲突；交报告仍在周三。','把截止日期也改到周二，造成新的事实错误。','她周二晚上就写完了，周三可以按时交报告。',2],
    ['2. 小高因为发烧没去参加周六的足球比赛。队友在群里写：“小高参加了比赛，所以今天要在家休息。” Rewrite the message so the cause and result are accurate.','小高发烧了，所以没参加周六的比赛，在家休息。','发烧导致缺席，不能把参赛说成在家休息的原因。','只把“所以”换成“但是”，仍保留错误的参赛事实。','小高发烧了，所以没参加周六的比赛，在家休息。',2],
    ['3. 商店通知：“买两本书，第二本半价。” 小郑给朋友解释：“两本书都是半价。” Correct the explanation; do not invent a price.','买两本书时，只有第二本半价，第一本仍按原价计算。','优惠只限定第二本，原解释把范围扩大到两本。','误以为半价是两本书总价打五折。','买两本书时，只有第二本半价，第一本仍按原价计算。',2],
  ],
  'reading-comprehension':[
    ['1. Read: “小海原计划周六去游泳。周五晚上，他的朋友说游泳馆临时关门。两人便约好周六到公园走走。” Why did the destination change? Cite the decisive detail.','因为游泳馆临时关门；证据是朋友周五晚上的消息。','原计划与后来约定不同，原因在中间一句，不是天气或两人不想见面。','凭空补充下雨作为改地点的原因。','游泳馆临时关门，所以他们改去公园；依据第二句。',2],
    ['2. Read: “阿兰每天坐地铁上班。今天她出门晚了，却正好赶上比平时晚到几分钟的地铁。她下车后跑了一小段路，最后仍准时到了公司。” Did leaving late make her late for work? Use two details.','没有；她赶上了晚到几分钟的地铁，下车后也跑了一段路，最后准时到公司。','出门晚不等于到公司晚；恰好赶上晚到的地铁和下车后跑步有助于她准时到达。','只抓住“出门晚了”就断言迟到。','没有。她赶上了晚到的地铁，下车后又跑了一段路，最后准时到了公司。',2],
    ['3. Read: “社区周日办旧书交换。居民可以带来读过的书，但不收破损严重的书。小乔挑了三本保存完好的小说，打算上午送过去。” Are all used books accepted? Give the condition and apply it to Xiao Qiao.','不是；严重破损的不收，小乔带的三本保存完好的小说符合书况要求。','“读过的书”还受保存状况限制；不能据此保证所有旧书都合格。','只读第一条规则，忽略破损严重的例外。','不是。活动不收破损严重的书；小乔的三本保存完好，符合书况要求。',2],
  ],
  'information-match':[
    ['1. Read the notice board: A 图书馆：周六九点开门，可借书；B 体育馆：周六九点开门，可借球拍；C 图书馆：周日闭馆。小周周六上午想借一本书，应看哪条？Give the letter and reject the nearest alternative.','A · 图书馆周六开门可借书','B虽然同样周六开门但只借球拍；C地点对却是周日闭馆。','只匹配“周六九点”就选体育馆。','A；周六上午图书馆开门可借书，体育馆借的是球拍。',2],
    ['2. Three messages: A “我已经到门口，等你下楼。” B “我刚上地铁，四十分钟后到。” C “我还在家，等雨停再出门。” Which sender can meet a friend downstairs now? Cite the actual location.','A；发信人已经到门口','B仍在路上，C尚未出门；只有A现在就在门口。','把“四十分钟后到”理解成此刻已抵达。','A；他已经到门口，可以马上见面。',2],
    ['3. Activity rules: A 上午十点的厨房课要自带围裙；B 下午两点的绘画课提供画笔；C 下午三点的厨房课提供围裙。小田下午才有空，想学做饭，却没带围裙。Which class fits? Give two supporting details.','C；下午三点的厨房课，且提供围裙','A教做饭却在上午并要求自带围裙；B时间合适却不是做饭。','只看下午有空便选绘画课，漏掉学习目标。','C；时间在下午，是厨房课，还提供围裙。',2],
  ],
  'writing-speaking':[
    ['1. Your class planned an outdoor picnic on Saturday. A forecast now predicts heavy rain; the classroom is free. Write a 50–80-Hanzi message to classmates explaining a sensible change, its reason and what each person should bring. Do not invent a cancellation.','Accept an original 50–80-Hanzi message: move the gathering indoors because of heavy rain and give a practical bring-list.','情境要求保留聚会、调整地点、说明天气原因，并交代携带物品；不能把活动改成取消。','只写“下雨了”或擅自宣布聚会取消。','同学们，天气预报说周六会下大雨，原来的户外野餐改在教室进行，时间不变。请大家带好自己的午饭和水杯，到了以后一起整理桌椅。',4],
    ['2. You borrowed a classmate’s notes and promised to return them today, but left them at home. Write a 50–80-Hanzi apology message with the cause, a definite return plan and an option if the classmate needs the content tonight.','Accept an original 50–80-Hanzi apology: acknowledge the promise, explain the notes are at home, set a return time and offer photos tonight.','不是只道歉：要承认失约，明确何时归还，同时照顾对方今晚可能需要笔记的情形。','用“改天还”代替明确时间，也不提供今晚可用的内容。','对不起，我答应今天还你的笔记忘在家里了，明天早上到学校就拿给你。如果你今晚要复习，我回家后可以先把需要的几页拍给你。',4],
    ['3. A community center has two rooms: a quiet room for reading and a larger room for group talk. Your group needs to discuss a project on Friday; another student wants to study alone. Write a 50–80-Hanzi recommendation that assigns each activity to a room and gives a reason.','Accept an original 50–80-Hanzi recommendation: group discussion in the larger room, solo study in the quiet room, with a reason for both.','空间分配要照顾讨论可能出声和个人阅读需安静这两个目的，不可只推荐一个房间。','把讨论安排进安静阅览室，却不考虑对其他读者的影响。','周五我们要讨论小组项目，建议去较大的活动室，大家说话也方便。想独自复习的同学可以去安静的阅览室，这样两边都不会互相打扰。',4],
  ],
  'review-test':[
    ['1. Tomorrow, closed book: a museum visit was set for Sunday morning. Your friend now has a Sunday-morning exam and is free after lunch. Write a short message proposing a new time while keeping the visit; explain the reason.','Accept e.g. 你周日上午要考试，我们把参观博物馆改到下午两点吧。吃完午饭一起过去，怎么样？','改的是参观时间，不是考试或活动本身；午饭后符合对方空闲时间。','建议仍在周日上午见面，与考试冲突。','你周日上午要考试，我们把参观博物馆改到下午两点吧。吃完午饭一起过去，怎么样？',3],
    ['2. Tomorrow, closed book: a neighbor’s package is outside in the rain. The neighbor is not home, and you can keep it dry until they return. Write a two-sentence message stating what you did and when they can collect it.','Accept e.g. 你的包裹放在门外，我怕它被雨淋湿，就先拿到我家了。你回来后给我发消息，随时可以来取。','报告已采取的保护措施和取件方式；不要声称自己打开包裹或替人签收。','只提醒包裹会淋雨，却没告诉对方现在在哪里。','你的包裹放在门外，我怕它被雨淋湿，就先拿到我家了。你回来后给我发消息，随时可以来取。',3],
    ['3. Tomorrow, closed book: your team booked a room for a meeting at four. The notice says the building closes at four thirty, and your meeting needs an hour. Write a practical change request explaining why the original booking will not work.','Accept e.g. 我们的会要开一个小时，但楼里四点半就关门了。能不能把会议室改订到三点，这样四点前就能开完？','原安排只留半小时，不足一小时；提前到三点使会议在闭馆前结束。','建议四点半才开始，忽略闭馆时间。','我们的会要开一个小时，但楼里四点半就关门了。能不能把会议室改订到三点，这样四点前就能开完？',3],
  ],
};

export function authoredLevelThree(kind:WorksheetModuleKind):WorksheetQuestion[]{
  return units[kind].map(([prompt,answer,explanation,commonError,sampleResponse,lines],index)=>({
    id:`L3-${kind}-${index+1}`,prompt,answer,explanation,commonError,sampleResponse,
    responseLines:lines??2,fieldKind:(lines??2)>=3?'lines':'short',
  }));
}
