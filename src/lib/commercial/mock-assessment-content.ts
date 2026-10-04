export type AssessmentForm="A"|"B"|"C";
export type ObjectiveItem={prompt:string;options:[string,string,string];answer:"A"|"B"|"C";explanation:string;distractorAnalysis:string};
export type AssessmentScenario={transcript:string;listeningGenre:string;listening:ObjectiveItem[];readingText:string;readingTaskFamilies:string[];reading:ObjectiveItem[];order:string[];orderAnswer:string;informationMatch:string[];sourceB:string;levelTask:string};

type Seed={actor:string;time:string;action:string;reason:string;outcome:string;sourceA:string;sourceB:string;aMain:string;bMain:string;relation:string};
const s=(actor:string,time:string,action:string,reason:string,outcome:string,sourceA:string,sourceB:string,aMain:string,bMain:string,relation:string):Seed=>({actor,time,action,reason,outcome,sourceA,sourceB,aMain,bMain,relation});

const seeds:Seed[][]=[
[
s("小林和小雨","七点五十分","在车站见面后坐八点的公共汽车去学校","两个人想一起到学校","他们按时上车", "小林八点坐公共汽车去学校。小雨七点五十分在车站等他。两个人一起上车。", "天气预报说早上有小雨。小雨带了一把伞，也提醒小林早点出门。", "两位同学约好一起去学校","出门前要准备雨具","见面计划不变，但要为下雨做准备"),
s("孩子和妈妈","下午五点以前","去超市买三个苹果","家里没有苹果了","孩子买完苹果回家", "妈妈请孩子下课后去超市买三个苹果，不用买牛奶。孩子答应五点以前回来。", "超市四点开始整理水果区，苹果仍可购买，牛奶柜暂时关闭。", "妈妈请孩子买苹果，并约定回家时间","商店仍供应清单里的水果","两份资料都说明不用处理牛奶"),
s("小安和朋友","下午两点","天气晴就去公园，下雨就留在家里","他们想一起过周末","小安准备水，朋友准备水果", "小安和朋友约好下午两点去公园。小安带水，朋友带水果；如果下雨，他们就留在家里。", "公园下午开放，气象台却说两点以后可能下雨。室内电影三点开始。", "小安和朋友约好去公园，并商量了雨天留家的办法","天气可能影响活动地点","气象台提醒两点以后可能下雨")
],
[
s("王老师和学生","上午九点","先上课，再在十一点开会","当天有两项学校安排","下午三点给学生打电话", "王老师九点上课，十一点开会。她下午三点给学生打电话，提醒大家准备明天的作业。", "学生群通知：明天的作业不用打印，但要在晚上八点前上传照片。", "老师按时间安排了三项工作","学生需要按新方式交作业","电话提醒和群通知共同说明交作业要求"),
s("服务员和顾客","中午十二点","把两碗面和一杯茶送到六号桌","顾客已经点好午饭","顾客确认茶不要加糖", "六号桌点了两碗面和一杯茶。顾客说茶里不要加糖，服务员答应十二点送来。", "餐厅今天的牛肉面售完，六号桌已改成两碗西红柿鸡蛋面，价格不变。", "顾客确认午餐和饮料要求","餐厅更换了面条种类","订单数量不变，但主食种类有调整"),
s("护士和赵明","星期四上午十点","在二楼诊室复查并带上检查单","医生需要查看上次结果","赵明提前十分钟到医院", "护士请赵明星期四上午十点到二楼复查，并带上上次的检查单。赵明说会提前十分钟到。", "医院入口正在维修，病人要从东门进入；二楼诊室照常开放。", "赵明预约星期四上午十点复查","到院路线临时改变","复查安排不变，只需更换入口")
],
[
s("会议组织者","上午八点五十分","把会议从二零三教室改到三零五教室","原教室设备出现故障","会议仍在九点开始", "通知说会议九点开始，地点改为三零五教室，原因是二零三的设备坏了。参会者要在八点五十分到场。", "教学楼电梯上午检修，三零五教室只能走东侧楼梯到达。", "会议九点开始，教室改到三零五","到新教室的路线受检修影响","会议九点开始，地点与到达路线均有变化"),
s("摄影课学员","晚上七点","参加夜间摄影课并自带相机","小周没报上下午摄影课","学员借到一台相机", "小周没报上下午摄影课，于是选择晚上七点的班。夜间班要求自己带相机，她已经向朋友借到一台。", "课程邮件补充：第一节课在校门口集合，若下雨则改在图书馆一楼。", "学员改报夜间班并准备设备","集合地点会随天气改变","第二份资料补充了上课地点的条件"),
s("志愿者小组","周六九点","先参加半小时培训，再做接待工作","接待组还缺人","新志愿者培训后接待读者", "周六的志愿活动还缺接待人员。新志愿者九点参加半小时培训，之后到入口接待读者。", "活动表显示：入口组负责登记，咨询台负责路线说明，书架组只整理归还的图书。", "新人培训后加入接待组","不同岗位有明确分工","第二份资料说明了接待工作内部的任务")
],
[
s("学校食堂","前一天晚上八点前","接受第二天午餐预约并用二维码取餐","午间排队时间太长","取消预约须在当天九点前完成", "因为午间排队时间太长，食堂试行线上预约。学生在前一天晚上八点前选餐，到店出示二维码；若要取消，必须在当天早上九点前操作。", "试行首周数据显示，十二点十分前到店的人平均少等八分钟，晚到者仍可能排队。", "预约制度规定了选择、取消和取餐流程","到店时间仍会影响等待长度","首周数据显示提前到店者平均少等八分钟，但晚到仍可能排队"),
s("市图书馆","考试季工作日晚上十点前","延长普通阅览区开放时间","学生需要更多复习座位","儿童区仍在六点关闭", "考试季期间，为满足学生复习座位需求，图书馆工作日普通阅览区的闭馆时间从八点延长到十点。儿童区仍在六点关闭，周末安排不变。", "座位系统显示，晚八点后的使用率只有周二和周四超过七成，其他工作日晚间仍有空位。", "图书馆延长了部分区域的工作日开放时间","不同日期的晚间需求并不相同","延长开放有需求，但应继续观察日期差异"),
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
s("公共健康传播机构","证据或建议发生变化时","同时说明已知证据、未知部分和调整条件","只公布统计结论会让谨慎表述显得矛盾","公众可以判断建议适用的边界", "公共健康信息准确只是最低条件。例如某地公布筛查建议时，只写有效率上升，未说明样本主要来自年轻成年人，老年人误以为结论同样适用。机构应交代样本范围、尚未确定的效果与可能改变建议的新证据，并把行动建议同证据强度分开标示。这样做并非要求公众自行计算风险，而是让人知道目前建议适用于谁、何时须重新评估。", "一线医生赞成透明说明，却担心一次列出多组概率会使赶时间的患者抓不住重点。有诊室试把信息分为简短行动卡和可展开的证据页：先说明当前该做什么，再说明样本限制及可能变更的条件。但分层不能把关键副作用藏在第二层；医生建议由不同年龄的患者试读，记录误解，再决定哪些警示必须放在首页。", "透明沟通需要交代证据和不确定性","医生主张按受众需要分层呈现信息","双方都重视透明，但对信息呈现顺序有不同判断"),
s("人工智能课堂项目","每次使用工具后","保留可核查的思考过程并由学习者完成关键判断","只追求答案速度会削弱知识结构理解","教师依据过程证据评价学习", "课堂讨论不应停留在使用或禁止人工智能。一次写作练习中，有学生用工具搜集反例，却未核查来源便把虚构引文写进论证；另有学生用它比较提纲后自行重写，反而更能说明选择理由。项目拟允许工具辅助检索和修改，但核心判断、引文核验与最终解释须由学生完成。评分要看推理过程，而非只看答案速度；同时不能把每一次尝试都当作违规。", "部分学生认为强制提交全部草稿会增加无效负担，也可能暴露尚未成形的私人想法。他们建议只在关键结论旁标记工具参与范围、原始资料出处和人工核验步骤。教师担心简短标记不足以发现代写，因此提出随机口头追问：学生若能解释为何舍弃工具建议，可免交完整对话记录。两方争议集中在证明责任所需的记录粒度，而非是否核查引文。", "课堂规则关注判断责任和过程证据","学生要求把记录义务限制在关键节点","双方认可可核查性，但对记录粒度存在分歧"),
s("地方旅游委员会","下一年度预算讨论前","比较大型节庆与社区常态项目的长期影响","游客数量不能单独反映居民收益","把就业稳定和公共空间压力纳入评估", "委员会过去用游客总量评价旅游项目。上次大型节庆吸引许多访客，却只带来短期岗位；活动结束后就业很快回落，附近居民还反映广场无法正常使用。新评估拟加入本地就业的持续时间、居民实际收入和公共空间压力，并与全年开放的社区项目比较。不过常态项目初期人数较少，若只观察首月，也会低估其积累效果。", "酒店协会认为大型活动能迅速提高城市曝光，直接收益以外还可能带来数月后的预订。但曝光次数本身不能证明预订是由节庆带来的，协会建议比较活动前后的订单来源，并与未举办活动的相近城市对照。委员会提醒，若后续订单增长却伴随房租和场地使用成本上升，也不能只把增长记作净收益；双方同意先试行两套指标，再讨论预算分配。", "新评估质疑只看游客数量的做法","行业方要求保留短期曝光的间接价值","两份资料对指标权重不同，需要同时验证短期与长期证据")
],
[
s("城市更新评估组","项目批准与复评阶段","追踪居民留存、服务可达性和参与质量","只看投资额会忽略社区关系受损","把社会影响纳入更新成效", "城市更新若推高租金并迫使长期居民迁出，即使环境更美观，也可能削弱社区网络。某街区翻新后新增绿地，但原租户中不少人搬到交通更差的地区；只计算投资额与绿化面积会漏掉这笔代价。评估组主张在批准前记录居民留存、公共服务可达性及参与质量，完工后再追踪，而不是把一次听证会当作充分参与。迁出也可能有其他原因，因此还须访谈居民并比较相近街区。", "开发方认为提高建设密度能增加住房总量；若一味压低规模，可能让更多家庭无房可租。他们提出对施工期间搬迁者发放租赁补贴，并保留一定比例的可负担住房。不过补贴若只覆盖一年，而新租金长期上涨，就不能证明老住户可以返回。开发方愿意公布补贴领取率和回迁率，评估组则要求按收入组分别报告，以免总体回迁数字掩盖低收入住户的流失。", "社会影响指标揭示空间改善之外的代价","开发方以住房供给和补贴回应迁出风险","双方对代价的处理方式不同，评估须检验补贴能否真正维持居民留存"),
s("开放数据办公室","每次数据更新时","同时维护字段说明、反馈渠道和影响评估","发布文件本身不会自动产生公共价值","外部使用者可以判断数据是否可靠", "开放数据若缺少字段说明、更新频率和责任主体，使用者很难判断结论是否可靠。曾有地图把未上报的区域标成零事故，引发错误的安全排名；补齐缺失值说明后，排名发生改变。办公室主张发布时同时提供字段定义、缺漏范围和纠错联系人，并记录更新后的版本差异。维护不等于无限审核，但如果纠错只能覆盖热门地区，也须检查对资源较少地区的影响。", "创业团队担心资料说明要经过层层审核，等数据完整时已经错过使用窗口。他们建议先发布机器可读的临时版本，醒目标注尚未核实的字段，并承诺在固定期限内补齐说明和错误记录。办公室指出，临时版本一旦被下游复制，后来的更正未必能传达到所有人；团队因此建议提供版本号和变更通知。争议不在是否说明，而在何时发布以及由谁承担传播更正的责任。", "可靠开放需要持续维护和责任信息","使用方强调发布速度和可用时效","争议不在是否说明，而在说明应在发布前还是限期补齐"),
s("医院分诊改革小组","试点的前三个月","结合症状风险和等候时间调整分诊","单按到院先后可能延误高风险病人","公开规则并提供复核渠道", "医院拟用症状风险与等候时间共同分诊，高风险者优先。过去按到院顺序排队时，某些急症可能等得过久；但单靠问卷也不能完整判断病情。试点前三个月将比较高风险患者的等待时间与复诊结果，同时公布指标和护士复核流程。若整体平均时间下降而某类患者反复被错误降级，医院不能仅凭平均值宣布成功，还须记录更改分诊级别的理由。", "患者代表支持高风险优先，却担心慢性疼痛在一次简短问卷里不够显著，容易被系统低估。他们要求复核时同时看患者自述、历史病历和症状变化，并允许现场护士立即调级，而不必等申诉结束。有人担心人工复核拖慢流程；代表建议先记录复核次数、用时和纠错率，再判断是否需要增加人手。速度与公平都需要实测，不能假设只要保留人工按钮就解决偏差。", "新分诊兼顾风险、时间和人工复核","患者代表指出模型可能低估慢性问题","试点需比较效率，同时审查特定群体是否持续被低估")
],
[
s("政策协商委员会","正式表决以前","公开权衡标准并说明损失由谁承担","更多信息不会自动消除价值排序差异","把分配冲突放到可讨论的议程中", "复杂政策争议中，不同群体会按不同价值排序解释同一证据。例如修路可缩短多数人的通勤，却可能占用少数居民的公共活动场地。协商除了核对预计节省的时间，还须说明怎样衡量失去场地的损失、谁获得补偿、由谁决定权重。更多数据无法自动决定何种损失值得承受；委员会主张表决前公开权衡标准，也公开未获采纳的方案及理由，以便事后复核。", "技术顾问认为过早争论价值会干扰事实核验，建议先建立各方认可的统一数据集，再讨论分配。社区代表反问：若数据集只计通勤时间、不计活动场地使用者，所谓统一已经做出价值选择。他们并不反对核对数据，而是要求把选择指标的会议记录一并公开。顾问随后同意先列出待核验的指标清单，但提醒不同指标的测量误差不能被当成既定事实。程序仍须同时处理测量可靠性与指标选择的正当性。", "协商必须揭示证据背后的价值和分配问题","顾问与社区代表对事实和价值的先后次序有冲突","可靠程序应既核验数据，也公开数据选择和损失分配的理由"),
s("平台治理审计组","每个季度","同时审查处置数量、申诉有效性和群体影响","高删除量不等于高治理质量","发现集中错误后修正规则并补救", "平台若只统计删除数量，可能把高处置量误当高质量：一次规则更新提高了删除量，也使某类方言表达更常被误判。审计组拟按季度比较规则清晰度、申诉成功率和错误在不同群体中的分布。申诉率低未必代表错误少，也可能是用户不知道如何申诉；因此还须查申诉入口是否可达，并记录纠正后受影响内容能否恢复。发现集中错误后应修改规则并补救。", "平台方担心公开细分群体数据被人用来试探审核边界，主张只向独立审计员提供原始记录。研究者认为如果外界只看到一句合格结论，便无法复核审计方法，建议公开去标识的汇总口径、抽样方式和误差范围。双方承认个体隐私不能为透明牺牲，但仍需决定哪些方法信息可公开，以及独立审计员如何说明未公开数据对结论的影响。仅公开总删除量不能回应这些问题。", "治理质量要同时考察程序和结果分布","数据透明需要在防滥用与可复核之间取舍","可接受方案应保护个体信息，同时让外部人员验证审计方法"),
s("气候适应规划组","未来五年滚动评估中","按风险、可逆性和公平影响安排投资","只依据平均预测会忽略高风险社区","为不确定情景保留调整空间", "气候适应不能只采用一个平均预测：平均降雨变化温和，不等于低洼社区不会遭遇极端积水。规划组拟比较多种情景，优先处理一旦发生就难以恢复的风险，并追踪防护成本是否集中落在资源较少的社区。可拆卸挡水设施可以随新数据调整，而永久工程更须事前检验；两者并非只能选其一。未来五年应定期复核预测、受益范围和未被保护的人群。", "财政部门担心同时准备多套方案会稀释今年有限的资金，主张先投向最可能出现的情景，待新数据出炉再调整。保险专家指出，低概率的极端灾害若造成无法恢复的损失，单按发生概率排序会低估风险。他们建议为不可逆损失设最低防护线，同时把较容易调整的支出留到下一轮决策。两方都承认预算有限，分歧在于现在为罕见但严重的风险预留多少资源，而非是否需要计算概率。", "适应规划以多情景和公平指标管理不确定性","财政效率与尾部风险防护形成直接张力","决策应比较概率、损失规模和可逆性，而不是只选择最常见情景")
]
];

const answers=["A","B","C"] as const;
const levelTaskNames=["short statement identification","everyday exchange detail","short notice sequence","changed arrangement and condition","explanation and limitation","problem and proposed response","claim and supporting evidence","competing perspectives","argument, objection and qualification"] as const;
const listeningGenres=["five short statements","everyday exchange","short notice","two-part arrangement","informational report","problem-solving exchange","formal explanation","two perspectives","argument and objection"] as const;

function item(prompt:string,choices:[string,string,string],correct:number,level:number,variant:number,index:number,explanation:string,wrong:[string,string]):ObjectiveItem{
 const position=(level+variant+index)%3;
 const options=[choices[(correct+1)%3],choices[(correct+2)%3]] as string[];
 options.splice(position,0,choices[correct]);
 const answer=answers[position];
 return {prompt,options:options as [string,string,string],answer,explanation,
  distractorAnalysis:options.map((option,i)=>`${answers[i]}“${option}”：${i===position?`正确；${explanation}`:`错误；${wrong[i<position?i:i-1]}`}`).join(" ")};
}
function statements(text:string):string[]{return (text.match(/[^。！？]+[。！？]?/gu)??[]).map(x=>x.trim()).filter(Boolean);}
function quote(text:string){return `“${text}”`;}
function transcriptFor(level:number,seed:Seed){
 if(level===1)return `第一句：${seed.actor}。第二句：${seed.time}。第三句：${seed.action}。第四句：${seed.reason}。第五句：${seed.outcome}。`;
 if(level===2)return `甲：${seed.actor}有什么安排？乙：${seed.time}，${seed.action}。甲：为什么？乙：${seed.reason}。甲：后来呢？乙：${seed.outcome}。`;
 if(level===3)return `请听通知。${seed.sourceA} ${seed.sourceB}`;
 if(level===4)return `请听两段消息。第一段：${seed.sourceA} 第二段：${seed.sourceB}`;
 if(level===5)return `请听一段情况说明。${seed.sourceA} 另一方面，${seed.sourceB}`;
 if(level===6)return `甲：我们先看现有情况。${seed.sourceA} 乙：还需要考虑另一方的意见。${seed.sourceB}`;
 if(level===7)return `以下是情况说明及补充意见。第一份资料指出：${seed.sourceA} 第二份资料指出：${seed.sourceB}`;
 if(level===8)return `主持人：请说明各自的依据。发言人一：${seed.sourceA} 发言人二：${seed.sourceB}`;
 return `主张方：${seed.sourceA} 质疑方：${seed.sourceB}`;
}
// Scenario-specific interpretations: the tests and boundaries below are grounded in
// the respective source passages, not inferred from the short seed metadata alone.
const advanced=[
 [
  {case:"年轻样本的筛查结论被老年人当成同样适用",metric:"不同年龄患者是否误解样本限制与副作用",test:"请不同年龄患者试读并记录误解",limit:"行动卡必须保留关键副作用警示",contrast:"准确的数字仍可能因样本边界未说明而误导"},
  {case:"未经核查的工具引文被写入论证",metric:"学生能否核实引文并解释舍弃工具建议的理由",test:"对关键结论作标记并随机口头追问",limit:"无需交出每一次尝试的完整记录",contrast:"允许辅助检索不等于把最终判断交给工具"},
  {case:"节庆吸引访客但就业很快回落",metric:"后续预订来源、就业持续时间与居民实际成本",test:"核对订单来源并与未办活动的相近城市比较",limit:"订单增长还要扣除居民承担的成本",contrast:"曝光可能带来后续收益，但不能直接当成收益证据"}
 ],[
  {case:"新增绿地时原租户搬到交通更差的地区",metric:"不同收入组的长期回迁率与服务可达性",test:"按收入组追踪补贴领取与实际回迁",limit:"一年补贴不能证明长期租金可负担",contrast:"住房总量增加不能代替对原住户留存的检验"},
  {case:"未上报地区被记作零事故并改变安全排名",metric:"更正是否到达下游使用者及低资源地区",test:"发布版本号、缺漏范围及更正通知",limit:"临时版被复制后更正未必能传达到下游",contrast:"发布及时性与结论可靠性都需要维护机制"},
  {case:"慢性疼痛可能被简短问卷持续低估",metric:"慢性疼痛患者的纠错率与复核用时",test:"分组统计护士调级的次数、用时和纠错率",limit:"平均等待时间下降不能证明每类病人都获益",contrast:"人工复核按钮并不自动消除系统性偏差"}
 ],[
  {case:"修路节省多数人时间却占用少数人的活动场地",metric:"通勤收益与场地损失如何计量及分配",test:"公开指标选择、测量误差和补偿权衡",limit:"统一数据集也可能漏掉场地使用者",contrast:"核实事实与讨论损失分配不能互相取代"},
  {case:"删除量增加的同时方言表达更常被误判",metric:"方言表达误判率与申诉入口可达性",test:"公开可复核的汇总口径并由独立审计员查细分数据",limit:"低申诉率可能只是申诉入口难以找到",contrast:"保护原始记录与公开审计方法可以并行"},
  {case:"平均降雨温和但低洼社区有极端积水风险",metric:"低洼社区不可逆损失及防护成本分布",test:"比较损失可逆性并给不可逆风险设防护线",limit:"预算有限不意味着只需防最可能情景",contrast:"低概率与高损失须一起衡量，而非只看概率"}
 ]
] as const;
// Concrete cross-source decisions, rather than stitched metadata fragments.
const levelEightActions=[
 "同时追踪住房供给和不同收入组的补贴领取、回迁情况",
 "临时发布时标出未核实字段，并用版本号和通知追送更正",
 "允许护士立即复核调级，并分组记录纠错率和用时"
] as const;
const levelNineResponses=[
 "既核验数据及误差，也公开指标选择、补偿和损失权重",
 "保护可识别记录，同时公开审计口径、抽样方式和误差范围",
 "比较多种情景，在预算约束下优先防护不可逆损失并保留调整空间"
] as const;
const noSecond=[
  ["两人决定不坐车","孩子不去超市","朋友不准备水果"],
  ["群通知取消了所有作业","餐厅没有更改面条种类","医院取消了二楼诊室"],
  ["会议地点恢复到二零三","下雨时仍在校门口集合","书架组负责为读者登记"],
  ["晚到店的人也保证不用排队","每个工作日晚间都没有空位","社区站入口仍在原处"],
  ["商户要求全天撤销新线路","客户不需要九点响应","预算足以今年修好全部照明"],
  ["顾问认为大字模式已帮助所有访客","家长委员会要求只能用短信","参与家庭要求永久保存生活明细"],
  ["医生建议隐去关键副作用","学生要求提交每一次完整工具对话","酒店协会称曝光次数已证明订单因节庆增加"],
  ["开发方拒绝公布回迁情况","创业团队反对提供版本号","患者代表主张取消护士复核"],
  ["社区代表反对核对任何数据","研究者要求公开可识别的个人记录","保险专家认为极端灾害可完全不设防"]
] as const;
function comprehension(level:number,variant:number,seed:Seed,mode:"听力"|"阅读",offset=0){
 const a=statements(seed.sourceA),b=statements(seed.sourceB);
 const q=(index:number,prompt:string,choices:[string,string,string],evidence:string,wrong:[string,string])=>item(`${mode} · ${prompt}`,choices,0,level,variant,index+offset,evidence,wrong);
 const short=level<=3;
 const upper=level>=7;
 const detail=upper?advanced[level-7][variant]:undefined;
 const items:ObjectiveItem[]=[];
 if(short){
  items.push(q(0,"资料一主要说什么？",[seed.aMain,noSecond[level-1][variant],"两份安排都已经取消"],`资料一：${quote(seed.sourceA)}`,['资料一并未作出这样的决定。','资料一仍说明了安排。']));
  items.push(q(1,"资料二增加了什么信息？",[seed.bMain,seed.aMain,"资料二没有提供新的信息"],`资料二：${quote(seed.sourceB)}`,['这是资料一的信息。','资料二提供了补充。']));
  items.push(q(2,"两份信息合起来，怎样理解更合适？",[seed.relation,`${seed.aMain}，不用考虑后来的消息`,`${seed.bMain}，原来的安排均不再有效`],`资料一${quote(a[0])}；资料二${quote(b[0])}`,['遗漏资料二提供的条件。','资料二没有推翻资料一的全部安排。']));
  items.push(q(3,"资料一还明确了哪项安排？",[a[1]??a[0],b[0],"资料一没有给出可执行的安排"],`资料一：${quote(a[1]??a[0])}`,['这是资料二的信息。','资料一明确交代了安排。']));
  const levelThreeTiming=[
   {prompt:"资料一要求参会者何时到场？",choices:["上午八点五十分","上午九点","上午十点"]},
   {prompt:"资料一说小周选择了几点的夜间班？",choices:["晚上七点","下午七点","晚上八点"]},
   {prompt:"资料一说培训何时开始？",choices:["周六九点","周六九点半","周日九点"]}
  ] as const;
  const timing=levelThreeTiming[variant];
  items.push(q(4,level===3?timing.prompt:"另一份资料提醒注意什么？",level===3?[timing.choices[0],timing.choices[1],timing.choices[2]]:[seed.bMain,seed.reason,seed.actor],level===3?`资料一：${quote(seed.sourceA)}`:`资料二：${quote(seed.sourceB)}`,level===3?['这是另一时刻，并非材料要求的开始或到场时间。','材料没有给出这个时间。']:['这是起因，不是资料二的提醒。','这是参与者，不是提醒。']));
  return items;
 }
 items.push(q(0,level===9?"主张方强调什么？":level===8?"第一位发言人的核心论点是什么？":level===7?"资料一的核心主张是什么？":"资料一的主要安排或处理是什么？",[seed.aMain,noSecond[level-1][variant],level===4&&variant===0?"只需在当天九点前取消预约，不必提前选餐或到店验码":`只须执行${seed.outcome}，不必解释缘由`],`资料一：${quote(seed.sourceA)}`,['两份资料都不支持这种极端做法。',level===4&&variant===0?'资料一还要求提前选餐和到店出示二维码。':'资料一还说明了缘由或适用范围。']));
 items.push(q(1,level===9?"质疑方补充了哪项必要关切？":level===8?"第二位发言人的主要关切是什么？":"资料二的主要贡献是什么？",[seed.bMain,seed.aMain,`完全否定${seed.aMain}`],`资料二：${quote(b[0])}`,['这是资料一的主张。','资料二提出补充或质疑，而非全盘否定。']));
 items.push(q(2,level===9?"异议与主张之间的真正分歧是什么？":"资料二如何回应资料一？",[seed.relation,`资料二重复资料一的每项理由，没有新条件`,`资料二已经证明资料一所有证据都无效`],`资料一${quote(a[0])}；资料二${quote(b[0])}`,['资料二增加了另一层信息。','资料二没有推翻全部证据。']));
 items.push(q(3,level===9?"哪项判断回应异议而不抹去原主张？":"哪项做法能同时保留两份资料的关切？",level===4&&variant===1?["考试季继续开放普通阅览区至十点，并按各日晚间座位数据评估使用情况","只按周二和周四的高使用率推断每个工作日晚间都满座","因为其他晚间仍有空位，立即恢复普通阅览区八点闭馆"]:[`保留资料一的主张：${seed.aMain}；同时处理资料二的关切：${seed.bMain}`,`只落实${seed.aMain}，不检查补充意见`,`只落实${seed.bMain}，不审查原问题`],`资料一${quote(a[0])}；资料二${quote(b[0])}`,level===4&&variant===1?['只有周二和周四超过七成，不能推断其他晚间也满座。','资料二没有要求撤销延长安排，其他晚间有空位也不等于需求为零。']:['忽略资料二的补充。','忽略资料一的问题。']));
 if(upper && detail){
  items.push(q(4,"哪一具体情形说明单一指标可能误导？",[detail.case,`只要${seed.outcome}就说明每个人均受益`,`只要发表意见就能解决所有测量偏差`],`资料中的事例：${quote(a.slice(0,3).join(''))}`,['把局部结果当成普遍结果。','意见表达不能替代测量。']));
  items.push(q(5,"什么检验更能回应双方尚未解决的疑问？",[detail.test,`只统计${seed.time}有多少人听过方案`,`仅重复资料一的开头而不收集结果`],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['接触人数不能检验争议。','重复主张不是检验。']));
  items.push(q(6,"资料二的建议应受哪项边界约束？",[detail.limit,`只要加快执行，资料一的风险自然消失`,`资料二提出建议后无需再评估效果`],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['资料一说明风险仍需核验。','资料二保留了需验证的条件。']));
  items.push(q(7,"哪项表述准确区分让步与主张？",[detail.contrast,`资料二承认资料一有问题，因此只能彻底放弃改革`,`资料一提出一个指标，因此可以忽略资料二的疑虑`],`资料一${quote(a[0])}；资料二${quote(b[0])}`,['承认风险不等于取消整个方案。','一个指标不能覆盖回应意见。']));
  items.push(q(8,"评估结果时应追踪哪组证据？",[detail.metric,`只报告${seed.outcome}是否发生`,`仅引用${seed.aMain}作为成功标准`],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['单一结果不足以回答质疑。','主张不等于结果证据。']));
  items.push(q(9,"审慎的结论应是什么？",[`${seed.relation}；${detail.limit}`,`${seed.aMain}，因此任何补充检验都多余`,`${seed.bMain}，所以资料一的风险完全不存在`],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['资料二提供了仍须检查的边界。','资料二没有消除资料一指出的风险。']));
 }else{
  items.push(q(4,"哪项是资料一的依据或条件？",[a[1]??a[0],noSecond[level-1][variant],`资料一没有说明任何具体安排`],`资料一：${quote(a[1]??a[0])}`,['资料二没有提出这种做法。','资料一已有具体陈述。']));
  items.push(q(5,"哪项属于资料二的补充？",[b[1]??b[0],a[0],`资料二将原安排全部取消`],`资料二：${quote(b[1]??b[0])}`,['这是资料一的内容。','资料二仅补充条件或不同意见。']));
  items.push(q(6,"如果只看资料一，可能漏掉什么？",[seed.bMain,seed.aMain,`已经完成${seed.outcome}的证据`],`资料二：${quote(b[0])}`,['这是已读的资料一主旨。','后续结果不能代替资料二。']));
  items.push(q(7,"资料一为何提出该安排？",[seed.reason,seed.outcome,seed.time],`背景及安排：${quote(seed.sourceA)}`,['这是后续安排或要求，不是提出安排的原因。','这是时间，不是缘由。']));
  items.push(q(8,"怎样避免过度概括？",[level===4&&variant===1?"需求随工作日变化，不能凭周二和周四的数据断言每天都满座":seed.relation,`资料一适用于所有时间和所有人`,`资料二足以证明资料一的事实全错`],`资料一${quote(a[0])}；资料二${quote(b[0])}`,['资料含有具体范围或条件。','补充意见不等于推翻全部事实。']));
  items.push(q(9,"最合适的后续判断是什么？",[`结合${seed.aMain}与${seed.bMain}再判断`, `仅凭${seed.aMain}作决定`,`仅凭${seed.bMain}作决定`],`资料一${quote(a[0])}；资料二${quote(b[0])}`,['忽略资料二。','忽略资料一。']));
 }
 return items;
}
function listeningFor(level:number,variant:number,seed:Seed):ObjectiveItem[]{
 if(level>=3)return comprehension(level,variant,seed,"听力").slice(0,5);
 const q=(i:number,p:string,c:[string,string,string],e:string,w:[string,string])=>item(`听力 · ${p}`,c,0,level,variant,i,e,w);
 return [
  q(0,"谁参与了这件事？",[seed.actor,"只有旁观者","没有提到人物"],`录音：${quote(seed.actor)}`,['录音明确指出参与者。','录音提到了参与者。']),
  q(1,level===1?"第二句说的是几点？":level===2&&variant===0?"第一项安排在几点？":"什么时候进行？",[seed.time,"时间还没有定","已经取消这个时间"],`录音：${quote(seed.time)}`,['录音说出时间。','录音没有说取消。']),
  q(2,"要做什么？",[seed.action,noSecond[level-1][variant],`在${seed.time}还没有任何安排`],`录音：${quote(seed.action)}`,['录音没有提出这种安排。','录音已说出实际行动。']),
  q(3,"为什么有这个安排？",[seed.reason,seed.action,seed.time],`录音：${quote(seed.reason)}`,['这是行动，不是原因。','这是时间，不是原因。']),
  q(4,level===1?"最后一句说了什么？":"后来或接下来怎样？",[seed.outcome,seed.reason,seed.actor],`录音：${quote(seed.outcome)}`,['这是起因。','这是参与者。'])
 ];
}
function readingFor(level:number,variant:number,seed:Seed){
 const a=statements(seed.sourceA),b=statements(seed.sourceB);
 const q=(i:number,p:string,c:[string,string,string],e:string,w:[string,string])=>item(`阅读 · ${p}`,c,0,level,variant,i+5,e,w);
 // Incorrect alternatives stay local to the question. In particular an earlier
 // item's distractor must not quote the keyed response to a later item.
 const notInFirst=[
  ["小林和小雨决定分开上学","孩子答应只买牛奶","小安决定不论天气都去公园"],
  ["王老师取消了明天的作业","六号桌取消了午餐","赵明取消了复查"],
  ["会议改在下午举行","小周没有参加任何摄影课","新志愿者直接跳过培训"],
  ["食堂取消了所有午餐预约","图书馆儿童区延长到晚上十点","大型包裹可以随时留在社区站"],
  ["公司取消了医院站","弹性办公不再规定工时","水质改善后居民已大量回到河岸"],
  ["团队删除了所有导览内容","学校只保留手机应用通知","试点未经观察便扩大到所有家庭"],
  ["只报告有效率便能说明各年龄适用范围","使用工具时无需核验任何引文","游客数量足以证明居民收入增长"],
  ["绿地增加便能证明原租户没有迁出","未上报区域可以视为零事故","平均等待时间下降意味着无人被错误降级"],
  ["只核对通勤时间就能决定场地损失权重","删除数量足以代表所有群体的治理质量","平均降雨预测可排除低洼地区的极端风险"]
 ] as const;

 // Source-specific facts/actions replace keys reused by other questions in a form.
 const facts={
  1:[
   {actor:"小雨",focus:"八点的公共汽车",action:"按原计划在车站见面，同时带伞"},
   {actor:"妈妈",focus:"三个苹果",action:"照清单买苹果，不买牛奶"},
   {actor:"小安",focus:"如果下雨就留在家里",action:"先看天气，雨天留在家里"}
  ],
  2:[
   {change:"晚上八点前上传照片",detail:"明天的作业不用打印",action:"老师提醒准备作业，学生按群通知上传照片"},
   {change:"牛肉面已经售完",detail:"两碗西红柿鸡蛋面",action:"保留两碗面和无糖茶，把牛肉面改为西红柿鸡蛋面"},
   {change:"病人须从东门进入",detail:"二楼诊室照常开放",action:"按原预约去二楼，进医院时改走东门"}
  ],
  3:[
   {reason:"原教室设备坏了",check:"东侧楼梯",action:"九点在三零五教室开会，八点五十分前经东侧楼梯到场"},
   {reason:"小周没报上下午摄影课",check:"下雨时在图书馆一楼集合",action:"带借来的相机上夜间班，按天气核对集合地点"},
   {reason:"接待组还缺人",check:"入口组负责登记",action:"九点先培训，随后到入口为读者登记"}
  ],
  4:[
   {detail:"当天早上九点前取消预约",limit:"十二点十分以后到店仍可能排队"},
   {detail:"周末开放安排不变",limit:"只有周二和周四晚八点后使用率超过七成"},
   {detail:"超过六点第二天转中心站",limit:"社区站步行入口改在北侧"}
  ],
  5:[
   {change:"商户建议平峰仍经过商业区",limit:"不能仅凭科技园乘客增加就忽略商业区客流"},
   {change:"客户要求每组安排早九点轮值",limit:"核心协作时间不能覆盖九点的紧急问题"},
   {change:"今年预算只够先修主步道",limit:"照明全面更新需要推迟到下一年度"}
  ],
  6:[
   {change:"顾问还要求语音说明和实体路线卡",limit:"大字模式不能帮助所有访客"},
   {change:"家庭可选择短信、邮件或纸质信",limit:"短信可能产生费用，不能只提供短信"},
   {change:"只保存每小时总量并在试点后删明细",limit:"节能评估不能无限期保存家庭用电明细"}
  ]
 } as const;
 // Each band asks a different operation on the actual learner-visible sources.
 // Direct quotations are used only for literal retrieval, never as a substitute
 // for inference, comparison or evaluation at the higher levels.
 if(level===1){
  const reading=[
   q(0,"资料一开头说了什么？",[a[0],notInFirst[0][variant],"资料一没有交代事情"],`资料一开头：${quote(a[0])}`,['资料一没有这样的决定。','资料一交代了事情。']),
   q(1,"资料一接着说了什么？",[a[1]??a[0],a[0],noSecond[0][variant]],`资料一接着写：${quote(a[1]??a[0])}`,['这是开头，不是接下来的一句。','资料二也没有这样说。']),
   q(2,"哪句来自资料二？",[b[0],a[0],a[1]??a[0]],`资料二：${quote(b[0])}`,['这是资料一的话。','这也来自资料一。']),
   variant===1?q(3,"超市哪处暂时关闭？",["牛奶柜","苹果货架","超市大门"],`资料二：${quote(seed.sourceB)}`,['苹果仍可购买。','没有说超市关门。']):q(3,"资料二最后提到什么？",[b[b.length-1],a[a.length-1],"两份资料都已取消"],`资料二结尾：${quote(b[b.length-1])}`,['这是资料一的话。','资料没有说取消。']),
   q(4,"资料一主要讲什么？",[seed.aMain,notInFirst[0][variant],"两份资料都没有事情发生"],`资料一：${quote(seed.sourceA)}`,['资料一没有作出这个决定。','资料一有明确内容。']),
   q(5,"资料二主要提醒什么？",[seed.bMain,seed.aMain,"资料二没有新内容"],`资料二：${quote(seed.sourceB)}`,['这是资料一的内容。','资料二提供了新信息。']),
   q(6,"资料一提到谁？",[facts[1][variant].actor,"只提到商店","只提到天气预报"],`资料一：${quote(seed.sourceA)}`,['资料一写有人物，不只提到商店。','资料一写有人物，不只提到天气预报。']),
   variant===1?q(7,"关于牛奶，两份资料合起来说明什么？",["妈妈说不用买牛奶，超市的牛奶柜也暂时关闭","妈妈说要买牛奶，超市的牛奶柜暂时关闭","妈妈说不用买牛奶，超市的牛奶柜仍开放"],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['资料一说不用买牛奶，不是要买。','资料二说牛奶柜暂时关闭，不是仍开放。']):variant===2?q(7,"结合约定和天气提醒，出门前应怎样做？",["先查天气，再决定去公园还是按约定留在家里","因为可能下雨，就直接取消与朋友的约定","不用查天气，直接去看三点的电影"],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['可能下雨不等于取消约定，原文只约定雨天留家。','电影开场时间不是观影约定；应先核对天气及原方案。']):q(7,"资料一和资料二都读过后，应怎样做？",[seed.relation,`只看${seed.aMain}`,`只看${seed.bMain}`],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['遗漏资料二。','遗漏资料一。']),
   q(8,"资料一提到什么具体安排？",[facts[1][variant].focus,seed.bMain,b[0]],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['这是资料二的主题。','这是资料二原话。']),
   variant===1?q(9,"读完两份资料，下一步怎么做？",[facts[1][variant].action,"水果区整理，所以不能买苹果","牛奶柜关闭，所以要买牛奶"],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['资料二明确说苹果仍可购买。','资料一说不用买牛奶，关闭也不会使牛奶成为必买品。']):variant===2?q(9,"如果两点天气晴朗，但两点后可能下雨，应怎样安排？",["按约定两点去公园，并留意之后是否下雨","两点的公园没有开放，必须立即留在家里","气象台已经确定下雨，所以现在就去看三点的电影"],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['资料二说公园下午开放，不能说两点必须留家。','可能下雨不是确定下雨，电影开场也不是他们的约定。']):q(9,"读完两份资料，下一步怎么做？",[facts[1][variant].action,`资料二一出现，${seed.aMain}就不成立`,`有了资料一，就不用看资料二`],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['资料二不一定取消资料一。','遗漏新信息。'])
  ];
  return {reading,families:["首句定位","顺序阅读","资料归属","结尾定位","单文主旨","补充提醒","信息来源","日常行动","信息排除","两文合用"]};
 }
 if(level===2){
  const reading=[
   q(0,"资料一先说了哪项安排？",[a[0],notInFirst[1][variant],noSecond[1][variant]],`资料一开头：${quote(a[0])}`,['资料一没有取消这项安排。',variant===1?'资料二明确把牛肉面改成西红柿鸡蛋面，不是没有更改。':'资料二也没有取消这项安排。']),
   q(1,"资料一后面又交代了什么？",[a[a.length-1],a[0],noSecond[1][variant]],`资料一结尾：${quote(a[a.length-1])}`,['这是较早的信息。',variant===1?'资料二明确更改面条种类，且这不是资料一后面的交代。':'资料二没有取消原安排。']),
   q(2,"哪项是资料二的新增安排？",[seed.bMain,notInFirst[1][variant],"资料二取消了全部安排"],`资料二：${quote(seed.sourceB)}`,['原安排并未取消。','资料二没有全部取消。']),
   q(3,"哪句能在资料二中找到？",[b[0],a[0],a[a.length-1]],`资料二：${quote(b[0])}`,['这是资料一的开头。','这是资料一的结尾。']),
   q(4,"资料一主要讲什么？",[seed.aMain,seed.bMain,"没有人参与安排"],`资料一：${quote(seed.sourceA)}`,['这是资料二的补充。','资料一提到具体安排。']),
   q(5,"资料二怎样补充已有安排？",[seed.relation,`资料二重复${seed.aMain}而没有变化`,`资料二宣布${seed.aMain}全无效`],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['资料二添加了条件。','资料二没有全盘取消。']),
   q(6,"只看资料一会漏掉资料二哪项变化？",[facts[2][variant].change,seed.aMain,"什么都不会漏"],`资料二：${quote(seed.sourceB)}`,['这是已有信息。','资料二确实补充了要求。']),
   q(7,"资料二还明确了哪项细节？",[facts[2][variant].detail,seed.aMain,a[0]],`资料二：${quote(seed.sourceB)}`,['属于资料一。','这是资料一原话。']),
   q(8,"按两份消息实际行动应怎么做？",[facts[2][variant].action,`只执行${seed.aMain}不查新消息`,`只执行${seed.bMain}不查原安排`],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['遗漏补充。','遗漏原安排。']),
   q(9,"后续行动应该参考哪两部分？",[`${seed.aMain}；${seed.bMain}`,`只有${seed.aMain}`,`只有${seed.bMain}`],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['遗漏资料二。','遗漏资料一。'])
  ];
  return {reading,families:["顺序定位","后续安排","补充要求","通知检索","事务概括","条件衔接","遗漏识别","信息归属","安排整合","双文执行"]};
 }
 if(level===3){
  const reading=[
   q(0,"资料一说明了哪项活动安排？",[variant===0?"会议定在九点，改去三零五教室":seed.aMain,notInFirst[2][variant],"原有活动完全取消"],`资料一：${quote(seed.sourceA)}`,['资料一没有这样的变化。','资料一仍保留活动。']),
   q(1,"资料一给出的具体要求是什么？",[variant===0?"参会者须在开会前十分钟抵达":a[a.length-1],noSecond[2][variant],"没有给出任何要求"],`资料一：${quote(a[a.length-1])}`,['两份资料都没有这样要求。','资料一有具体要求。']),
   q(2,"资料二补充了哪项条件？",[variant===0?"电梯不能用，去三零五须经东侧楼梯":seed.bMain,seed.aMain,"资料二重复通知而无变化"],`资料二：${quote(seed.sourceB)}`,['这是资料一的主题。','资料二给出新的条件。']),
   q(3,"哪句可作为资料二内容的证据？",[variant===0?"电梯上午维修，只能走东侧楼梯去三零五":b[0],noSecond[2][variant],a[a.length-1]],`资料二：${quote(b[0])}`,['资料二没有这样安排。','这是资料一的要求。']),
   q(4,"资料一先交代了什么？",[a[0],b[0],"所有人不需要再参加"],`资料一开头：${quote(a[0])}`,['这是资料二。','资料一没有说全部取消。']),
   q(5,"新情况对原安排造成什么影响？",[variant===0?"九点在三零五开会，到场路线须避开检修的电梯":seed.relation,`只看${seed.aMain}不处理新条件`,`资料二让原安排全部无效`],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['未处理补充条件。','新情况并非全部取消。']),
   q(6,["为何改用三零五教室？","小周为什么改选夜间班？","为什么需要补充接待人员？"][variant],[facts[3][variant].reason,b[0],"两份资料均未说明"],`资料一：${quote(a[0])}`,['这是后来的补充。','资料一交代了缘由。']),
   q(7,"执行前须核对哪项具体信息？",[facts[3][variant].check,seed.aMain,"只需忽略第二份通知"],`资料二：${quote(seed.sourceB)}`,['这是原安排。','第二份资料有新条件。']),
   q(8,"哪项说法把新增信息误当取消？",[`资料二出现后，${seed.aMain}全部失效`,seed.relation,seed.bMain],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['两文合读并非误解。','资料二新增内容本身不是全盘取消。']),
   q(9,"结合两份通知，哪项行动更稳妥？",[facts[3][variant].action,`只按照${seed.aMain}而不核对条件`,`只按照${seed.bMain}而忘记原安排`],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['遗漏新条件。','遗漏原安排。'])
  ];
  return {reading,families:["通知概括","通知细节","条件补充","依据定位","首句扫描","变更影响","原因核对","到场准备","误读辨析","综合执行"]};
 }
 const reading=comprehension(level,variant,seed,"阅读");
 const detail=level>=7?advanced[level-7][variant]:undefined;
 const own=level===4?[
  q(0,"执行原安排前，先应核对哪项规则？",[variant===1?"普通阅览区延至十点不意味着儿童区同步延长":a[1]??a[0],noSecond[3][variant],"所有规则均已取消"],`资料一：${quote(seed.sourceA)}`,[variant===0?'资料二反而说晚到者仍可能排队。':'资料一没有这项说法。','规则仍有效。']),
  q(1,"资料二说明实际执行时有什么限制？",[seed.bMain,seed.aMain,"执行之后不必看反馈"],`资料二：${quote(seed.sourceB)}`,['这是资料一的安排。','资料二提供实测或额外限制。']),
  q(2,"哪项结论超过了两份资料的证据？",[`只要${seed.aMain}，${seed.bMain}就不再重要`,a[0],seed.bMain],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['这是资料一中明确记载的事实。','资料二仍须考虑。']),
  q(3,"如果执行过程出现新条件，应该怎样调整？",[`保留${seed.aMain}，并核对${seed.bMain}`,`完全忽略${seed.bMain}`,`直接取消${seed.aMain}`],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['遗漏新的限制。','补充不等于全盘取消。']),
  q(4,"原流程还有哪项明确的时间或条件？",[facts[4][variant].detail,noSecond[3][variant],"只说结果，没有任何操作要求"],`资料一：${quote(a[1]??a[0])}`,['资料二没有这样声称。','资料一列出了要求。'])
 ]:level===5?[
  q(0,"资料一怎样说明安排的背景或依据？",[a[0],noSecond[4][variant],"资料一没有给出任何背景"],`资料一：${quote(a[0])}`,['利益相关方并未要求全部撤销。','资料一交代了背景。']),
  q(1,"资料二的利益相关方提出什么不同考量？",[seed.bMain,seed.aMain,"完全否定资料一的事实"],`资料二：${quote(seed.sourceB)}`,['这是资料一的主张。','资料二补充了成本或实施方案。']),
  q(2,"怎样判断两个目标之间的张力？",[seed.relation,`只看${seed.aMain}就无需考虑受影响方`,`只看${seed.bMain}就能证明原调查失实`],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['忽略资料二。','异议没有证明调查全错。']),
  q(3,"哪项方案没有忽视两边的目标？",[`实施${seed.aMain}，同时检验${seed.bMain}`,`仅宣布${seed.aMain}完成`,`只转述${seed.bMain}而不核查数据`],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['没有回应影响。','没有回应原问题。']),
  q(4,"资料一真正提出的安排是什么？",[a[a.length-1],noSecond[4][variant],"资料一没有提出行动"],`资料一结尾：${quote(a[a.length-1])}`,['资料二没有提出这样的无条件做法。','资料一有行动。'])
 ]:level===6?[
  q(0,"资料一提出试点或改进的出发点是什么？",[seed.aMain,noSecond[5][variant],"未经检验就宣布所有问题已经解决"],`资料一：${quote(seed.sourceA)}`,['资料二没有作出这个断言。','资料一仍要求处理或检验。']),
  q(1,"资料二指出原方案尚未覆盖什么？",[seed.bMain,seed.aMain,"问题已经完全消失"],`资料二：${quote(seed.sourceB)}`,['这是已有方案。','资料二指出尚需处理的需求。']),
  q(2,"资料二是怎样扩展资料一的？",[seed.relation,"资料二宣布所有早期观察无效","资料二只重复资料一没有新信息"],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['补充不是全盘推翻。','资料二有新要求。']),
  q(3,"改进方案怎样同时处理诊断与遗漏？",[`解决${seed.aMain}，并处理${seed.bMain}`,`只解决${seed.aMain}`,`不看诊断，只处理${seed.bMain}`],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['遗漏额外需求。','忽略现有问题。']),
  q(4,"哪句明确呈现资料一的处理或检验？",[a[1]??a[0],noSecond[5][variant],"资料一没有给出任何后续安排"],`资料一：${quote(a[1]??a[0])}`,['资料二没有作出这个断言。','资料一交代了后续安排。'])
 ]:level===7?[
  q(0,"资料一的论证为什么不能只报一个表面结果？",[seed.aMain,noSecond[6][variant],"只要公布数字就能覆盖所有人"],`资料一：${quote(seed.sourceA)}`,['资料二也不赞成隐去警示或省略核验。','资料一指出推论边界。']),
  q(1,"资料二提出的表达方式是什么？",[seed.bMain,seed.aMain,"省略所有限制便能避免误解"],`资料二：${quote(seed.sourceB)}`,['这是资料一的目标。','资料二没有建议省略关键限制。']),
  q(2,"资料二对资料一作出怎样的限定？",[seed.relation,"完全否认需要交代不确定性","让读者自己判断所有未公布风险"],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['双方并未否定透明。','资料二没有免除说明责任。']),
  q(3,"哪种做法既回应资料一，又处理资料二的顾虑？",[`兼顾${seed.aMain}与${seed.bMain}`,`只要求${seed.aMain}，不考虑异议`, `只要求${seed.bMain}，不检验原主张`],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['缺少异议视角。','遗漏原主张。']),
  q(4,"资料一哪个实例暴露了证据适用范围的问题？",[detail!.case,"任何例子均表明无需核查样本","资料一只有抽象主张没有实例"],`资料一：${quote(seed.sourceA)}`,['实例恰好说明应核查。','资料一举了具体情形。'])
 ]:level===8?[
  q(0,"资料一要求评估什么被总体收益掩盖的代价？",[seed.aMain,noSecond[7][variant],"只要总体数字增加就无需分组"],`资料一：${quote(seed.sourceA)}`,['资料二也没有主张省略实际复核。','资料一要求审查分配影响。']),
  q(1,"资料二以什么利益或约束回应？",[seed.bMain,seed.aMain,"资料二认为原风险并不存在"],`资料二：${quote(seed.sourceB)}`,['这是资料一的立场。','资料二没有否认全部风险。']),
  q(2,"两方在哪个问题上仍需实测？",[seed.relation,"两方已证明所有个体同样受益","只要有一项改进就无需继续评估"],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['资料指出分组差异。','需要进一步验证。']),
  q(3,"哪项执行办法能同时回应两方？",[levelEightActions[variant],`只确认${seed.outcome}是否发生`,`只采纳资料二的总体数字`],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['结果发生不等于分配公平。','总体数字不能揭示群体差异。']),
  q(4,"哪件具体事说明总体指标会掩盖代价？",[detail!.case,"所有人都因单项指标上升而受益","有了回应方案便无需查实际结果"],`资料一：${quote(seed.sourceA)}`,['不能从单项指标推出普遍受益。','回应方案仍需实测。'])
 ]:[
  q(0,"资料一要求公开何种常被隐藏的判断前提？",[seed.aMain,noSecond[8][variant],"事实核验自动决定所有权重"],`资料一：${quote(seed.sourceA)}`,['资料二没有否定证据与程序的必要性。','资料一强调价值或分配判断。']),
  q(1,"资料二指出哪项程序或证据上的异议？",[seed.bMain,seed.aMain,"资料二主张完全不核对事实"],`资料二：${quote(seed.sourceB)}`,['这是资料一的主张。','资料二也重视证据核验。']),
  q(2,"哪项才是双方争论的关键，而不是表面矛盾？",[seed.relation,"事实一旦核对，价值分歧便消失","有价值分歧就不必测量误差"],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['事实本身不自动分配损失。','两方面需要共同处理。']),
  q(3,"哪种回应承认异议而保留原主张？",[levelNineResponses[variant],`只强调${seed.aMain}不回应异议`,`只强调${seed.bMain}而隐藏原主张`],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['回避异议。','回避原主张。']),
  q(4,"哪件具体事反驳单用一个指标就决策？",[detail!.case,"指标数量多便能消除所有价值冲突","每种不确定性都无需计入决策"],`资料一：${quote(seed.sourceA)}`,['指标本身也需讨论。','资料说明不确定性有后果。'])
 ];
 reading.splice(0,5,...own);
 if(level>=4 && level<=6){
  const overlooked=level===4?facts[4][variant].limit:level===5?facts[5][variant].change:facts[6][variant].change;
  reading[6]=q(6,"资料二哪项具体信息不能漏掉？",[overlooked,seed.aMain,`已经完成${seed.outcome}的证据`],`资料二：${quote(seed.sourceB)}`,['这是资料一已有的内容。','资料二还提出具体条件。']);
  if(level>=5){
   const boundary=level===5?facts[5][variant].limit:facts[6][variant].limit;
   reading[8]=q(8,"怎样避免过度概括？",[boundary,`资料一适用于所有时间和所有人`,`资料二足以证明资料一的事实全错`],`资料一${quote(seed.sourceA)}；资料二${quote(seed.sourceB)}`,['资料含有具体范围或条件。','补充意见不等于推翻全部事实。']);
  }
 }
 const families=level===4?["流程规则","执行限制","过度结论","条件调整","流程细节","实测补充","遗漏风险","问题起因","承诺边界","调整判断"]:level===5?["背景依据","利益方方案","目标张力","双目标方案","具体安排","异议细节","单方遗漏","调整动因","推广边界","后续检验"]:level===6?["改进出发点","未覆盖需求","范围扩展","行动整合","处理检验","建议补充","覆盖缺口","成因识别","方案边界","效果复查"]:level===7?["论证主张","回应视角","补充关系","异议处理","误导实例","检验设计","方案边界","承认限制","成效指标","审慎推论"]:level===8?["评价立场","对方回应","利益张力","分组检验","反例检验","分组追踪","回应边界","让步识别","分层证据","有限结论"]:["价值前提","程序异议","分歧定位","回应异议","反证分析","决策检验","隐含前提","立场限定","证据权重","批判综合"];
 // A distinct label alone never qualifies as a distinct task. Higher levels
 // retain evidence/objection items while later tests check their source links.
 return {reading,families};
}
function scenarioFor(level:number,variant:number):AssessmentScenario{
 const seed=seeds[level-1][variant];
 const {reading,families}=readingFor(level,variant,seed);
 const order=[seed.time,seed.action,seed.outcome];
 return {transcript:transcriptFor(level,seed),listeningGenre:listeningGenres[level-1],listening:listeningFor(level,variant,seed),readingText:seed.sourceA,readingTaskFamilies:families,reading,order,orderAnswer:order.join(" → "),informationMatch:[`${seed.actor}—${seed.action}`,`原因—${seed.reason}`,`结果—${seed.outcome}`],sourceB:seed.sourceB,levelTask:levelTaskNames[level-1]};
}
export function assessmentScenario(level:number,variant:number):AssessmentScenario{if(!Number.isInteger(level)||level<1||level>9||!Number.isInteger(variant)||variant<0||variant>2)throw new Error("INVALID_ASSESSMENT_SCENARIO");return scenarioFor(level,variant);}
export function assessmentListeningScript(form:AssessmentForm){const variant=({A:0,B:1,C:2} as const)[form];const parts=[`HSKKit 非官方 HSK 三点零分级练习测评，${form}卷听力。每个文本播放一次。每题后有五秒作答停顿。`];for(let level=1;level<=9;level++){const scenario=assessmentScenario(level,variant);parts.push(`现在开始第${level}级听力。`,scenario.transcript,...scenario.listening.map((question,index)=>`第${index+1}题。${question.prompt.replace(/^.*? · /u,"").replace(/[？。]+$/u,"")}。请作答。`),"本级听力结束。");}return parts.join("\n");}
