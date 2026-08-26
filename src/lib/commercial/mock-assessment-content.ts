export type AssessmentForm="A"|"B"|"C";
export type ObjectiveItem={prompt:string;options:[string,string,string];answer:"A"|"B"|"C";explanation:string;distractorAnalysis:string};
export type AssessmentScenario={transcript:string;listeningGenre:string;listening:ObjectiveItem[];readingText:string;readingTaskFamilies:string[];reading:ObjectiveItem[];order:string[];orderAnswer:string;informationMatch:string[];sourceB:string;levelTask:string};

type Seed={actor:string;time:string;action:string;reason:string;outcome:string;sourceA:string;sourceB:string;aMain:string;bMain:string;relation:string};
const s=(actor:string,time:string,action:string,reason:string,outcome:string,sourceA:string,sourceB:string,aMain:string,bMain:string,relation:string):Seed=>({actor,time,action,reason,outcome,sourceA,sourceB,aMain,bMain,relation});

const seeds:Seed[][]=[
[
s("小林和小雨","七点五十分","在车站见面后坐八点的公共汽车去学校","两个人想一起到学校","他们按时上车", "小林八点坐公共汽车去学校。小雨七点五十分在车站等他。两个人一起上车。", "天气预报说早上有小雨。小雨带了一把伞，也提醒小林早点出门。", "两位同学约好一起去学校","出门前要准备雨具","见面计划不变，但要为下雨做准备"),
s("孩子和妈妈","下午五点以前","去超市买三个苹果","家里没有苹果了","孩子买完苹果回家", "妈妈请孩子下课后去超市买三个苹果，不用买牛奶。孩子答应五点以前回来。", "超市四点开始整理水果区，苹果仍可购买，牛奶柜暂时关闭。", "孩子按清单购买苹果","商店仍供应清单里的水果","两份资料都说明不用处理牛奶"),
s("小安和朋友","下午两点","天气晴就去公园，下雨就在家看电影","他们想一起过周末","朋友分别准备水和水果", "小安和朋友约好下午两点去公园。小安带水，朋友带水果；如果下雨，他们就留在家里。", "公园下午开放，气象台却说两点以后可能下雨。室内电影三点开始。", "朋友准备了晴天和雨天方案","天气可能影响活动地点","第二份资料增加了下雨的可能性")
],
[
s("王老师和学生","上午九点","先上课，再在十一点开会","当天有两项学校安排","下午三点给学生打电话", "王老师九点上课，十一点开会。她下午三点给学生打电话，提醒大家明天带作业。", "学生群通知：明天的作业不用打印，但要在晚上八点前上传照片。", "老师按时间完成三项工作","学生需要按新方式交作业","电话提醒和群通知共同说明交作业要求"),
s("服务员和顾客","中午十二点","把两碗面和一杯茶送到六号桌","顾客已经点好午饭","顾客确认茶不要加糖", "六号桌点了两碗面和一杯茶。顾客说茶里不要加糖，服务员答应十二点送来。", "餐厅今天的牛肉面售完，六号桌已改成两碗西红柿鸡蛋面，价格不变。", "顾客确认午餐和饮料要求","餐厅更换了面条种类","订单数量不变，但主食种类有调整"),
s("护士和赵明","星期四上午十点","在二楼诊室复查并带上检查单","医生需要查看上次结果","赵明提前十分钟到医院", "护士请赵明星期四上午十点到二楼复查，并带上上次的检查单。赵明说会提前十分钟到。", "医院入口正在维修，病人要从东门进入；二楼诊室照常开放。", "赵明按预约时间复查","到院路线临时改变","复查安排不变，只需更换入口")
],
[
s("会议组织者","上午八点五十分","把会议从二零三教室改到三零五教室","原教室设备出现故障","会议仍在九点开始", "通知说会议地点改为三零五教室，原因是二零三的设备坏了。参会者要在八点五十分到场。", "教学楼电梯上午检修，三零五教室只能走东侧楼梯到达。", "会议换了地点但没有改时间","到新教室的路线受检修影响","地点和路线都有变化，开始时间保持不变"),
s("摄影课学员","晚上七点","参加夜间摄影课并自带相机","下午班已经满员","学员借到一台相机", "小周没报上下午摄影课，于是选择晚上七点的班。夜间班要求自己带相机，她已经向朋友借到一台。", "课程邮件补充：第一节课在校门口集合，若下雨则改在图书馆一楼。", "学员改报夜间班并准备设备","集合地点会随天气改变","第二份资料补充了上课地点的条件"),
s("志愿者小组","周六上午九点","先参加半小时培训，再做接待工作","整理图书组人数已满","接待组补到两名新人", "周六的志愿活动还缺接待人员。新志愿者九点参加半小时培训，之后到入口接待读者。", "活动表显示：入口组负责登记，咨询台负责路线说明，书架组只整理归还的图书。", "新人培训后加入接待组","不同岗位有明确分工","第二份资料说明了接待工作内部的任务")
],
[
s("学校食堂","前一天晚上八点前","接受第二天午餐预约并用二维码取餐","午间排队时间太长","取消预约须在当天九点前完成", "食堂试行线上预约。学生在前一天晚上八点前选餐，到店出示二维码；若要取消，必须在当天早上九点前操作。", "试行首周数据显示，十二点十分前到店的人平均少等八分钟，晚到者仍可能排队。", "预约制度规定了选择、取消和取餐流程","到店时间仍会影响等待长度","预约减少等待，但不能保证任何时间都无需排队"),
s("市图书馆","考试季工作日晚上十点前","延长普通阅览区开放时间","学生需要更多复习座位","儿童区仍在六点关闭", "考试季期间，图书馆工作日闭馆时间从八点延长到十点。儿童区仍在六点关闭，周末安排不变。", "座位系统显示，晚八点后的使用率只有周二和周四超过七成，其他工作日晚间仍有空位。", "图书馆延长了部分区域的工作日开放时间","不同日期的晚间需求并不相同","延长开放有需求，但应继续观察日期差异"),
s("快递站和居民","下午六点以前","凭取件码到社区快递站领取包裹","大型包裹不能放入自助柜","逾期包裹第二天转到中心站", "短信提醒居民在下午六点前凭取件码到社区站取大型包裹。超过时间，包裹会在第二天送往中心站。", "社区站门前修路，步行入口在北侧；中心站距离社区三公里，晚上九点关闭。", "大型包裹有明确的取件时限","两个站点的位置和关闭时间不同","及时去社区站可避免更远的取件路程")
],
[
s("公交公司","下月第一个工作日","调整线路并增加科技园站","早高峰去科技园的乘客增加三成","保留医院站并减少绕行十五分钟", "公交调查发现，早高峰去科技园的乘客增加三成，旧线绕行商业区平均多花十五分钟。公司决定增加科技园站，同时保留医院站。", "社区听证会上，商业区商户担心客流下降，建议早晚高峰走新线，平峰仍经过商业区。", "新线路根据客流和时间数据进行调整","商户提出分时段保留旧线路的方案","两份资料目标不同，需要在效率和商业影响间权衡"),
s("公司项目组","三个月试行期内","实行十点到四点的核心协作时间","员工希望避开通勤高峰","根据项目进度和员工反馈决定是否保留", "公司试行弹性办公，不减少工时。员工须在上午十点到下午四点协作，其他时间自行安排，三个月后再评估。", "客户团队表示，紧急问题多发生在早上九点，若无人值班会延迟响应，因此要求每组安排轮值。", "弹性办公兼顾协作和通勤","客户提出核心时间之外的响应风险","试行需要同时观察员工体验和客户响应"),
s("河岸治理项目组","今年夏季","在监测水质之外增加居民访谈","污染数据不能解释居民为何避开河岸","把照明和步道安全纳入改造", "项目组发现水质改善后居民仍少去河岸。访谈显示，夜间照明不足和步道破损同样影响使用，因此改造范围被扩大。", "财政评估指出，今年预算只够先修主步道；照明若全面更新，要推迟到下一年度。", "居民访谈补充了单靠水质数据看不到的问题","预算限制了同时完成所有改造的可能","治理目标明确，但实施顺序要依据安全和预算决定")
],
[
s("博物馆数字导览团队","下一次版本更新","保留深度内容并增加大字模式和一键返回","老年访客完成率下降","新版先做小范围可用性测试", "数字导览上线后，年轻访客停留更久，老年访客完成率却下降。团队发现主要问题是字体过小、步骤过多，因此保留内容并简化操作。", "无障碍顾问提醒，大字模式仍不足以帮助所有人，还应提供语音说明和实体路线卡。", "团队用数据定位并修正界面障碍","顾问要求提供不依赖屏幕的替代方案","第二份资料扩展了第一份资料的无障碍范围"),
s("学校信息中心","下学期开始前","为关键通知增加短信并允许家庭选择渠道","部分家长不会每天查看应用","保留应用而不恢复全部纸质通知", "学校取消纸质通知后发布更快，但有家庭错过日期。调查发现部分家长不常看应用，于是学校为关键事项增加短信。", "家长委员会认为短信可能产生费用，建议入学登记时让家庭在短信、邮件和纸质信之间自行选择。", "学校用多渠道提醒弥补应用覆盖不足","家长委员会强调成本和选择权","改进方向一致，但第二份资料要求更明确的自主选择")
,s("社区能源试点","六个月内","在二十户家庭安装用电反馈设备","居民想降低高峰时段用电","先比较账单变化再决定扩大", "社区选择二十户家庭试用实时用电反馈设备，希望减少晚间高峰。六个月后将比较用电量和账单，再决定是否扩大。", "参与家庭担心设备收集生活规律，要求只保存每小时总量，并在试点结束后删除明细。", "试点用数据评估节能效果","参与者要求限制数据收集和保存","效果评估必须同时满足隐私边界")
],
[
s("公共健康传播机构","证据或建议发生变化时","同时说明已知证据、未知部分和调整条件","只公布统计结论会让谨慎表述显得矛盾","公众可以判断建议适用的边界", "公共健康信息准确只是最低条件。机构还应解释不确定性、证据边界，以及建议会在什么条件下调整，否则谨慎表述可能被误解。", "一线医生赞成透明说明，但担心一次列出过多概率会增加理解负担，主张先给行动建议，再分层展示证据。", "透明沟通需要交代证据和不确定性","医生主张按受众需要分层呈现信息","双方都重视透明，但对信息呈现顺序有不同判断"),
s("人工智能课堂项目","每次使用工具后","保留可核查的思考过程并由学习者完成关键判断","只追求答案速度会削弱知识结构理解","教师依据过程证据评价学习", "课堂讨论不应停留在使用或禁止人工智能。更重要的是区分适合辅助的环节、必须由学生完成的判断，并留下思考过程。", "部分学生认为强制提交全部草稿会增加无效负担，建议只在关键结论旁标记工具参与和人工核验步骤。", "课堂规则关注判断责任和过程证据","学生要求把记录义务限制在关键节点","双方认可可核查性，但对记录粒度存在分歧"),
s("地方旅游委员会","下一年度预算讨论前","比较大型节庆与社区常态项目的长期影响","游客数量不能单独反映居民收益","把就业稳定和公共空间压力纳入评估", "委员会过去用游客总量评价旅游项目，却发现大型节庆结束后就业很快回落。新评估加入本地就业稳定、居民收益和公共空间压力。", "酒店协会认为大型活动能迅速提高城市曝光，若只看长期指标，可能低估品牌传播带来的后续预订。", "新评估质疑只看游客数量的做法","行业方要求保留短期曝光的间接价值","两份资料对指标权重不同，需要同时验证短期与长期证据")
],
[
s("城市更新评估组","项目批准与复评阶段","追踪居民留存、服务可达性和参与质量","只看投资额会忽略社区关系受损","把社会影响纳入更新成效", "城市更新若推高租金并迫使长期居民迁出，即使环境更美观，也可能削弱社区网络。评估应追踪居民留存、服务可达性和参与质量。", "开发方反驳说，提高建设密度能增加住房总量，并主张用租赁补贴处理短期搬迁，而不是降低改造规模。", "社会影响指标揭示空间改善之外的代价","开发方以住房供给和补贴回应迁出风险","双方对代价的处理方式不同，评估须检验补贴能否真正维持居民留存"),
s("开放数据办公室","每次数据更新时","同时维护字段说明、反馈渠道和影响评估","发布文件本身不会自动产生公共价值","外部使用者可以判断数据是否可靠", "开放数据若缺少字段说明、更新频率和责任主体，使用者很难判断结论是否可靠。真正的开放还需要维护、纠错和公平影响评估。", "创业团队担心过多审核会让数据过时，建议先发布机器可读版本，再在固定期限内补齐说明和错误记录。", "可靠开放需要持续维护和责任信息","使用方强调发布速度和可用时效","争议不在是否说明，而在说明应在发布前还是限期补齐"),
s("医院分诊改革小组","试点的前三个月","结合症状风险和等候时间调整分诊","单按到院先后可能延误高风险病人","公开规则并提供复核渠道", "医院拟用症状风险与等候时间共同分诊，高风险者优先。为避免规则变成黑箱，医院承诺公开指标并允许护士复核。", "患者代表支持高风险优先，却担心慢性疼痛被低估，要求把患者自述和历史病历纳入复核，而不能只依赖一次问卷。", "新分诊兼顾风险、时间和人工复核","患者代表指出模型可能低估慢性问题","试点需比较效率，同时审查特定群体是否持续被低估")
],
[
s("政策协商委员会","正式表决以前","公开权衡标准并说明损失由谁承担","更多信息不会自动消除价值排序差异","把分配冲突放到可讨论的议程中", "复杂政策争议中，不同群体会按不同价值排序解释同一证据。协商除核对事实外，还要公开权衡标准和损失承担者。", "技术顾问认为过早讨论价值会妨碍事实核验，建议先形成统一数据集；社区代表则认为数据选择本身已经包含价值判断。", "协商必须揭示证据背后的价值和分配问题","顾问与社区代表对事实和价值的先后次序有冲突","可靠程序应既核验数据，也公开数据选择和损失分配的理由"),
s("平台治理审计组","每个季度","同时审查处置数量、申诉有效性和群体影响","高删除量不等于高治理质量","发现集中错误后修正规则并补救", "平台若只统计删除数量，可能把高处置量误当高质量。审计还应检查规则清晰度、申诉效果和错误是否集中影响某些群体。", "平台方认为公开群体差异可能被恶意利用，主张只向独立审计员提供细分数据；研究者则要求公开可复现的汇总方法。", "治理质量要同时考察程序和结果分布","数据透明需要在防滥用与可复核之间取舍","可接受方案应保护个体信息，同时让外部人员验证审计方法"),
s("气候适应规划组","未来五年滚动评估中","按风险、可逆性和公平影响安排投资","只依据平均预测会忽略高风险社区","为不确定情景保留调整空间", "气候适应不能只采用一个平均预测。规划组建议比较多种情景，优先处理不可逆风险，并追踪成本是否集中落在资源较少的社区。", "财政部门担心同时准备多套方案会稀释资金，主张先投资最可能情景；保险专家则指出低概率灾害可能造成无法恢复的损失。", "适应规划以多情景和公平指标管理不确定性","财政效率与尾部风险防护形成直接张力","决策应比较概率、损失规模和可逆性，而不是只选择最常见情景")
]
];

const answers=["A","B","C"] as const;
const evidenceKeys=["actor","action","reason","time","outcome"] as const;
const levelTaskNames=["short utterance detail","dialogue sequence","short passage inference","two-part dialogue reconstruction","extended passage stance","multi-turn cause and effect","register and structure","multi-speaker synthesis","argument and counterargument synthesis"] as const;
const listeningGenres=["five short utterances","short everyday dialogue","short narrative passage","two-part changed-plan dialogue","extended informational passage","multi-turn problem-solving dialogue","formal extended discourse","multi-speaker discussion","argument with counterargument"] as const;
const readingFamilies=[
 ["sentence meaning","direct detail","information matching","short-passage detail","basic cause","reference","sentence ordering","simple cloze","main idea","short summary"],
 ["context cloze","event sequence","information matching","dialogue detail","time reference","sentence ordering","pronoun reference","short-passage sequence","reason","summary"],
 ["short-passage comprehension","context cloze","information matching","sentence ordering","explicit inference","cause and effect","sentence insertion","detail evidence","main idea","guided summary"],
 ["paragraph cloze","changed-plan reconstruction","information matching","sentence ordering","speaker purpose","cause and effect","sentence insertion","cross-part detail","main idea","reason-result summary"],
 ["extended-passage main idea","paragraph cloze","stance evidence","sentence insertion","detail inference","cause and effect","information matching","paragraph organization","author purpose","structured summary"],
 ["multi-turn cause and effect","discourse cloze","speaker stance","sentence insertion","cross-source information matching","paragraph organization","author purpose","evidence evaluation","recommendation","comparative summary"],
 ["extended-discourse inference","register","argument structure","multi-source information matching","paragraph ordering","sentence insertion","claim-evidence match","qualification","source synthesis","structured summary"],
 ["multi-speaker synthesis","implicit stance","multi-source synthesis","claim-evidence matching","paragraph ordering","counterpoint","sentence insertion","evidence comparison","proposal evaluation","comparative synthesis"],
 ["assumption and implication","rhetorical structure","cross-source information matching","evidence strength","counterargument analysis","paragraph ordering","qualification","sentence insertion","critical synthesis","independent conclusion"]
] as const;
type EvidenceKey=typeof evidenceKeys[number]|"aMain"|"bMain"|"relation";
function sourceOptions(level:number,key:EvidenceKey){return seeds[level-1].map(seed=>seed[key]) as [string,string,string];}
function arranged(choiceSet:[string,string,string],correctIndex:number,position:number){const correct=choiceSet[correctIndex],wrong=choiceSet.filter((_,index)=>index!==correctIndex);const output=[...wrong] as string[];output.splice(position,0,correct);return output as [string,string,string];}
function analysisFor(options:[string,string,string],answer:"A"|"B"|"C",evidence:string){return options.map((option,index)=>`${answers[index]}“${option}”：${answers[index]===answer?`正确，${evidence}`:"错误；它混入同级平行卷的信息，当前材料没有这项证据。"}`).join(" ");}
function objective(prompt:string,level:number,variant:number,itemIndex:number,key:EvidenceKey,explanation:string):ObjectiveItem{const position=(level+variant+itemIndex)%3,choices=arranged(sourceOptions(level,key),variant,position),answer=answers[position];return {prompt,options:choices,answer,explanation,distractorAnalysis:analysisFor(choices,answer,explanation)};}
function localObjective(prompt:string,choiceSet:[string,string,string],correctIndex:number,level:number,variant:number,itemIndex:number,explanation:string):ObjectiveItem{const position=(level+variant+itemIndex)%3,choices=arranged(choiceSet,correctIndex,position),answer=answers[position];return {prompt,options:choices,answer,explanation,distractorAnalysis:analysisFor(choices,answer,explanation)};}
function transcriptFor(level:number,seed:Seed){switch(level){
 case 1:return `短句一：${seed.actor}。短句二：时间是${seed.time}。短句三：要${seed.action}。短句四：因为${seed.reason}。短句五：最后${seed.outcome}。`;
 case 2:return `女：我们在${seed.time}做什么？男：${seed.action}。女：为什么？男：因为${seed.reason}。女：结果呢？男：${seed.outcome}。`;
 case 3:return `请听一段短文。${seed.actor}原计划在${seed.time}${seed.action}。安排的原因是${seed.reason}。事情完成以后，${seed.outcome}。短文按时间顺序说明了人物、行动、原因和结果。`;
 case 4:return `第一段对话。甲：我们在${seed.time}${seed.action}。乙：我记住了。第二段对话。乙：计划有变化吗？甲：核心安排不变，因为${seed.reason}。乙：最后怎么处理？甲：${seed.outcome}。`;
 case 5:return `请听一段较长说明。${seed.actor}准备在${seed.time}${seed.action}。表面上这是一般安排，但关键依据是${seed.reason}。从材料立场看，行动不是目的本身；它要解决具体问题。实施以后，${seed.outcome}。`;
 case 6:return `甲：当前问题是什么？乙：${seed.reason}。甲：什么时候处理？乙：${seed.time}。甲：具体方案呢？乙：由${seed.actor}${seed.action}。甲：这样会带来什么结果？乙：${seed.outcome}。甲：那么原因、行动和结果已经形成完整链条。`;
 case 7:return `正式说明如下。${seed.actor}提出在${seed.time}${seed.action}，直接动因是${seed.reason}。这项安排不仅回应眼前问题，也改变了执行结构。材料通过“问题—方案—结果”的组织推进论述，最终指出：${seed.outcome}。`;
 case 8:return `主持人：请分别说明立场。发言人一：${seed.aMain}，所以${seed.actor}应在${seed.time}${seed.action}。发言人二：我补充一点，${seed.bMain}。主持人：两位的共同点和分歧是什么？发言人一：${seed.relation}。综合现有意见，${seed.outcome}。`;
 default:return `主张方认为，${seed.actor}应在${seed.time}${seed.action}，依据是${seed.reason}。质疑方则指出，${seed.bMain}，不能只依据单一指标。回应方承认这一限制，并强调${seed.relation}。因此，结论必须同时处理主张、反驳、证据边界与后果：${seed.outcome}。`;
 }}
function scenarioFor(level:number,variant:number):AssessmentScenario{
 const seed=seeds[level-1][variant],focus=levelTaskNames[level-1],families=[...readingFamilies[level-1]];
 const transcript=transcriptFor(level,seed);
 const listening=evidenceKeys.map((key,index)=>objective(`${listeningGenres[level-1]} · ${["谁是核心人物或机构？","核心行动是什么？","材料给出的原因是什么？","行动在什么时候或什么条件下进行？","最后的结果、建议或立场是什么？"][index]}`,level,variant,index,key,`${key==="actor"?"行动主体":key==="action"?"核心行动":key==="reason"?"直接原因":key==="time"?"时间或条件":"结果或建议"}是${seed[key]}。`));
 const order=[seed.time,seed.action,seed.outcome],orderAnswer=`${seed.time} → ${seed.action} → ${seed.outcome}`;
 const informationMatch=[`${seed.actor}—${seed.action}`,`原因—${seed.reason}`,`结果—${seed.outcome}`];
 const orderOptions=seeds[level-1].map(candidate=>`${candidate.time} → ${candidate.action} → ${candidate.outcome}`) as [string,string,string];
 const matchOptions=seeds[level-1].map(candidate=>`${candidate.actor}—${candidate.action}`) as [string,string,string];
 const insertion:[string,string,string]=["资料一之前","资料一与资料二之间","两份资料之后"];
 const keys:[EvidenceKey,EvidenceKey,EvidenceKey,EvidenceKey,EvidenceKey]=["aMain","action","bMain","reason","relation"];
 const reading:ObjectiveItem[]=[
  objective(`${families[0]} · 资料一的中心意思是什么？`,level,variant,0,keys[0],`资料一主要说明：${seed.aMain}。`),
  objective(`${families[1]} · 资料一支持哪一项行动？`,level,variant,1,keys[1],`资料一明确支持：${seed.action}。`),
  objective(`${families[2]} · 资料二提供了什么信息？`,level,variant,2,keys[2],`资料二主要说明：${seed.bMain}。`),
  objective(`${families[3]} · 哪一项最符合材料中的时间、次序或关系？`,level,variant,3,"time",`材料给出的时间或条件是${seed.time}。`),
  objective(`${families[4]} · 哪一个原因或证据能解释材料中的安排？`,level,variant,4,keys[3],`关键原因是：${seed.reason}。`),
  localObjective(`${families[5]} · 总结句“因此，作答时要核对前文证据。”放在哪里最合适？`,insertion,2,level,variant,5,"总结句应放在两份资料之后，才能回指前文证据。"),
  localObjective(`${families[6]} · 哪一个“时间/条件→行动→结果”顺序符合本卷？`,orderOptions,variant,level,variant,6,orderAnswer),
  localObjective(`${families[7]} · 哪一组“主体—行动”匹配正确？`,matchOptions,variant,level,variant,7,`${seed.actor}与${seed.action}在资料中直接对应。`),
  objective(`${families[8]} · “这样安排，是因为____。”应选择哪一项？`,level,variant,8,"reason",`语境中的原因是：${seed.reason}。`),
  objective(`${families[9]} · 哪一个结论准确整合了本级要求的信息？`,level,variant,9,keys[4],`结论必须保留这层关系：${seed.relation}。`)
 ];
 return {transcript,listeningGenre:listeningGenres[level-1],listening,readingText:seed.sourceA,readingTaskFamilies:families,reading,order,orderAnswer,informationMatch,sourceB:seed.sourceB,levelTask:focus};
}
export function assessmentScenario(level:number,variant:number):AssessmentScenario{if(!Number.isInteger(level)||level<1||level>9||!Number.isInteger(variant)||variant<0||variant>2)throw new Error("INVALID_ASSESSMENT_SCENARIO");return scenarioFor(level,variant);}
export function assessmentListeningScript(form:AssessmentForm){const variant=({A:0,B:1,C:2} as const)[form];const parts=[`HSKKit 非官方 HSK 三点零分级练习测评，${form}卷听力。每个文本播放一次。每题后有五秒作答停顿。`];for(let level=1;level<=9;level++){const scenario=assessmentScenario(level,variant);parts.push(`现在开始第${level}级听力。`,scenario.transcript,...scenario.listening.map((question,index)=>`第${index+1}题。${question.prompt.replace(/[？。]+$/u,"")}。请作答。`),"本级听力结束。");}return parts.join("\n");}
