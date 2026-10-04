export type ReadingArticleQuestion = {
  prompt: string;
  options: [string, string, string];
  answer: 0 | 1 | 2;
  explanation: string;
};

export type ReadingArticle = {
  slug: string;
  level: number;
  title: string;
  topic: string;
  paragraphs: string[];
  englishSummary: string;
  vocabulary: { word: string; pinyin: string; meaning: string }[];
  questions: ReadingArticleQuestion[];
};

// Editorial reading articles are separate from the 180 short, scored drills.
// Each article is a complete text with its own topic and comprehension checks.
export const READING_ARTICLES: ReadingArticle[] = [
  {
    slug: "a-market-morning", level: 1, title: "早上的菜市场", topic: "Daily life",
    paragraphs: [
      "今天是星期六。早上，妈妈和我去菜市场。我们想买水果，也想买菜。市场里有很多人。",
      "妈妈买了苹果和西红柿。我买了两个大苹果，一个给爸爸，一个给姐姐。中午，我们一起回家。爸爸做饭，我和姐姐洗水果。晚上，全家人一起吃饭。",
    ],
    englishSummary: "A child and their mother shop for fruit and vegetables on Saturday. The family prepares and eats dinner together.",
    vocabulary: [{ word: "菜市场", pinyin: "cài shìchǎng", meaning: "food market" }, { word: "水果", pinyin: "shuǐguǒ", meaning: "fruit" }, { word: "一起", pinyin: "yìqǐ", meaning: "together" }],
    questions: [
      { prompt: "妈妈和我什么时候去菜市场？", options: ["星期六早上", "星期六晚上", "星期天中午"], answer: 0, explanation: "第一句说今天是星期六，接着说早上去菜市场。" },
      { prompt: "谁做饭？", options: ["姐姐", "爸爸", "我"], answer: 1, explanation: "最后一段写着“爸爸做饭”。" },
      { prompt: "我买了几个苹果？", options: ["一个", "两个", "三个"], answer: 1, explanation: "“我买了两个大苹果”。" },
    ],
  },
  {
    slug: "the-library-card", level: 2, title: "一张新的借书证", topic: "School & study",
    paragraphs: [
      "星期三下午，李明和朋友去学校旁边的图书馆。李明想借一本中文故事书，可是他没有借书证。工作人员告诉他，可以先填写一张表，再出示学生证。",
      "李明很快办好了借书证。他找到一本关于小动物的故事书，坐在窗边看了半个小时。朋友选了一本旅行书。离开前，他们把要借的书交给工作人员。工作人员说，两周后要还书。",
      "回家的路上，李明把还书的日期写在手机里。他想下周再来，因为这里很安静，也有很多有意思的书。",
    ],
    englishSummary: "Li Ming gets a library card, borrows a storybook, and records the return date so he can visit again.",
    vocabulary: [{ word: "借书证", pinyin: "jièshūzhèng", meaning: "library card" }, { word: "填写", pinyin: "tiánxiě", meaning: "fill in" }, { word: "还书", pinyin: "huánshū", meaning: "return a book" }],
    questions: [
      { prompt: "李明为什么先不能借书？", options: ["没有借书证", "没有时间", "书不在图书馆"], answer: 0, explanation: "第一段明确说李明没有借书证。" },
      { prompt: "借的书什么时候要还？", options: ["明天", "下周", "两周后"], answer: 2, explanation: "工作人员说“两周后要还书”。" },
      { prompt: "李明为什么想再来？", options: ["这里安静，书也有意思", "朋友在这里工作", "这里离家很远"], answer: 0, explanation: "最后一句给出了两个原因。" },
    ],
  },
  {
    slug: "a-neighbours-garden", level: 3, title: "楼下的小花园", topic: "Community",
    paragraphs: [
      "小区楼下有一块空地。以前那里只有旧椅子和一些纸箱，大家路过时都走得很快。春天到了，住在三楼的周阿姨提出一个主意：把空地变成小花园。",
      "星期天上午，几个邻居一起收走纸箱，擦干净椅子，还种下了花和小树。小朋友负责给花浇水，但周阿姨提醒他们，不要一天浇太多。大家约好轮流照看花园，也把每天做的事写在门口的小本子上。",
      "一个月以后，花开了。晚上常有人坐在椅子上聊天。以前很少说话的邻居，现在见面会互相打招呼。周阿姨说，花园最好的地方不只是花，而是大家愿意一起做事。",
    ],
    englishSummary: "Neighbours turn an unused space into a small garden. Caring for it together also helps them get to know one another.",
    vocabulary: [{ word: "邻居", pinyin: "línjū", meaning: "neighbour" }, { word: "轮流", pinyin: "lúnliú", meaning: "take turns" }, { word: "打招呼", pinyin: "dǎ zhāohu", meaning: "greet someone" }],
    questions: [
      { prompt: "空地以前是什么样的？", options: ["已经种满了花", "有旧椅子和纸箱", "有很多商店"], answer: 1, explanation: "第一段介绍了改造前的旧椅子和纸箱。" },
      { prompt: "邻居们怎样照看花园？", options: ["轮流照看并记下来", "只让小朋友照看", "每天请人来修"], answer: 0, explanation: "第二段说大家轮流照看，并写在小本子上。" },
      { prompt: "周阿姨认为花园最好的地方是什么？", options: ["花特别贵", "椅子很新", "大家愿意一起做事"], answer: 2, explanation: "结尾强调的是邻居之间的合作。" },
    ],
  },
  {
    slug: "the-school-book-exchange", level: 4, title: "学校里的换书活动", topic: "Education",
    paragraphs: [
      "学校原来每年都会买一批新书，但不少旧书仍然放在学生家里，没有人再读。为了让更多人接触不同的书，学生会决定试办一次换书活动。参加者可以带来保存完好的书，换取一张卡片，再用卡片选择别人带来的书。",
      "活动开始的第一个小时，故事书最受欢迎，科学类书籍却很少有人问。负责整理的学生没有急着把它们收起来，而是在每本书旁边贴上一张介绍卡，写明书里讨论的问题。午休后，越来越多学生停下来翻看这些书。",
      "活动结束时，共有一百多本书找到了新读者。学生会也发现了一些问题：有人忘记在书上写名字，少数书的页面有破损。下次活动前，他们会公布更清楚的收书标准，并准备登记表。组织者说，换书的目的不只是节省买书的钱，更是让一本书有机会被不同的人重新发现。",
    ],
    englishSummary: "A school pilots a book exchange. Short descriptions draw attention to overlooked science books, and organisers plan clearer rules for the next event.",
    vocabulary: [{ word: "试办", pinyin: "shìbàn", meaning: "run as a trial" }, { word: "受欢迎", pinyin: "shòu huānyíng", meaning: "be popular" }, { word: "破损", pinyin: "pòsǔn", meaning: "damaged" }],
    questions: [
      { prompt: "学生会为什么组织换书？", options: ["让旧书被更多人阅读", "停止购买所有新书", "只交换科学书"], answer: 0, explanation: "第一段说明了旧书闲置和接触不同书籍的问题。" },
      { prompt: "科学类书籍后来为什么有人翻看？", options: ["价格降低了", "学生贴了介绍卡", "老师要求大家选"], answer: 1, explanation: "介绍卡说明内容后，学生开始停下来翻看。" },
      { prompt: "下次活动将改进什么？", options: ["只收故事书", "不再登记", "明确收书标准"], answer: 2, explanation: "结尾提到公布更清楚的标准并准备登记表。" },
    ],
  },
  {
    slug: "the-community-kitchen", level: 5, title: "社区厨房的一次试验", topic: "Food & community",
    paragraphs: [
      "新建的社区厨房每周三晚上开放，居民可以带食材来共同做饭。管理人员原本以为，报名的人主要会是独自生活的老人。然而第一个月的数据表明，年轻上班族也很愿意参加：他们希望下班后能吃到家常菜，同时认识住在附近的人。",
      "最初，厨房按报名顺序安排座位。后来志愿者发现，同一批熟人总坐在一起，新来的居民很难加入谈话。于是他们调整了规则：每桌至少留两个位置给第一次参加的人，做饭任务也由大家轮流承担。规则改变后，新参加者第二次再来的比例提高了。",
      "不过，管理人员没有立刻宣布试验成功。有人指出，冬天报名多也许只是因为天冷，不能证明新规则一定有效。另外，厨房的食材费用比预计略高。负责人决定继续记录三个月，并同时询问未再来的居民原因。她认为，社区活动的价值不只看当晚来了多少人，还要看不同的人能否长期参与。",
    ],
    englishSummary: "A community kitchen changes its seating and cooking rules to welcome newcomers. Early results are promising, but organisers keep collecting evidence before judging success.",
    vocabulary: [{ word: "志愿者", pinyin: "zhìyuànzhě", meaning: "volunteer" }, { word: "比例", pinyin: "bǐlì", meaning: "proportion" }, { word: "预计", pinyin: "yùjì", meaning: "estimate" }],
    questions: [
      { prompt: "为什么要改变座位规则？", options: ["厨房里没有桌子", "新居民不容易加入", "老人不想做饭"], answer: 1, explanation: "原来的安排让熟人坐在一起，新居民难以加入。" },
      { prompt: "负责人为什么继续记录三个月？", options: ["目前证据不足以说明规则有效", "她想关闭厨房", "志愿者不愿工作"], answer: 0, explanation: "季节和成本等因素使初期结果不能直接证明成功。" },
      { prompt: "文章更重视哪种结果？", options: ["某一晚的人数", "食材的颜色", "不同居民长期参与"], answer: 2, explanation: "最后一句明确指出长期、广泛参与的重要性。" },
    ],
  },
  {
    slug: "wetland-restoration", level: 6, title: "河口湿地的修复计划", topic: "Environment",
    paragraphs: [
      "城南河口曾是一片湿地，候鸟每年都会在这里停留。随着周边建设增加，部分水道被填平，雨季的积水也更难排出。市政府提出修复计划：先清理废弃物，再恢复几条浅水道，最后限制车辆进入核心区域。支持者认为，这不仅有利于鸟类，也可能减轻附近居民区的内涝。",
      "一些商户却担心，车辆限制会影响送货和游客消费。负责规划的团队没有把这些意见简单归为反对环保，而是与商户一起标出主要送货时间，并设计外围装卸点。另一组研究人员提醒，湿地恢复的效果不会立刻显现，单看施工后的第一个夏天，很容易把降雨量变化误当成工程效果。",
      "因此，评估方案把过去五年的雨量、积水记录和鸟类数量作为基线。项目实施后，还会持续比较相似但未修复的河段。如果两地都出现相同变化，就不能把结果全算在修复工程头上。团队也承诺定期公布数据与调整理由，让居民知道哪些目标实现了，哪些仍有争议。",
      "修复计划最终通过时，委员会没有给出一个保证成功的结论。它要求施工分阶段进行，并设置明确的暂停条件：若附近道路持续拥堵，或水质指标恶化，就必须重新审查方案。这样的决定看似谨慎，却能让环境改善与日常生活的需要同时进入讨论。",
    ],
    englishSummary: "A city plans to restore a wetland while addressing delivery access and flooding concerns. It will compare long-term data with an untreated area and pause work if clear harms appear.",
    vocabulary: [{ word: "湿地", pinyin: "shīdì", meaning: "wetland" }, { word: "基线", pinyin: "jīxiàn", meaning: "baseline" }, { word: "内涝", pinyin: "nèilào", meaning: "urban flooding" }],
    questions: [
      { prompt: "为什么要比较未修复的河段？", options: ["确定所有鸟都来自那里", "区分工程效果与共同变化", "让工程更快完成"], answer: 1, explanation: "对照河段有助于避免把共同变化错误归因于工程。" },
      { prompt: "团队怎样回应商户的送货担忧？", options: ["设计外围装卸点", "取消所有车辆限制", "忽略商户意见"], answer: 0, explanation: "第二段写到标出送货时间并设计装卸点。" },
      { prompt: "委员会设置暂停条件说明什么？", options: ["项目已经失败", "无需继续监测", "实施要随证据调整"], answer: 2, explanation: "暂停条件让新出现的损害可以触发重新审查。" },
    ],
  },
  {
    slug: "evidence-for-green-delivery", level: 7, title: "绿色配送试点能否推广？", topic: "Policy & evidence",
    paragraphs: [
      "某市在三个街区试行集中配送：快递车辆只到社区边缘的接驳站，最后一公里由电动货车完成。半年后，报告称核心区域的机动车通行量下降了两成，居民对街道安全的评价也有所提高。负责部门据此建议尽快把方案推广到全市。",
      "然而，试点街区原本就有较密集的接驳点，且商业建筑集中，配送路线短于全市平均水平。报告只公布了车辆进入核心区的次数，没有计算接驳站周边增加的交通量。若拥堵只是从一条街转移到了另一条街，所谓改善便需要重新界定。与此同时，参加试点的企业得到补贴，补贴结束后是否仍愿意维持服务也尚无答案。",
      "评估小组没有否认试点的积极信号。他们建议先把结果拆开看：道路安全可以通过事故和险情记录衡量；排放量应计算车辆全程耗能；居民便利程度则要调查不同年龄和行动能力的人。对老年居民而言，走到接驳站领取大件包裹所增加的负担，不能被平均满意度掩盖。",
      "为避免把有利条件误认为政策本身的成效，小组还建议选取几个接驳设施较少的街区进行第二轮试验，并提前公开评价指标。如果新街区得到相近结果，推广的理由会更有力；若效果明显减弱，也可以及时改造方案，而不必在全市范围承担同样的成本。",
    ],
    englishSummary: "A delivery pilot reports less traffic in central streets, but its favourable locations, shifted congestion, subsidies and uneven effects on residents limit broad conclusions. Evaluators propose wider measures and another trial.",
    vocabulary: [{ word: "接驳站", pinyin: "jiēbózhàn", meaning: "transfer station" }, { word: "评价指标", pinyin: "píngjià zhǐbiāo", meaning: "evaluation metric" }, { word: "推广", pinyin: "tuīguǎng", meaning: "roll out" }],
    questions: [
      { prompt: "哪项信息最直接削弱“全市都能取得相同效果”的推断？", options: ["试点街区的路线和设施优于平均水平", "居民喜欢安全的街道", "电动货车能载包裹"], answer: 0, explanation: "试点地点的有利条件可能不能复制到其他街区。" },
      { prompt: "评估小组为什么提到老年居民？", options: ["说明他们不收包裹", "指出平均满意度可能掩盖群体差异", "建议只调查老年居民"], answer: 1, explanation: "便利程度要看不同群体，而不只看总体平均值。" },
      { prompt: "第二轮试验的主要作用是什么？", options: ["替企业取消补贴", "重复第一次的新闻报道", "检验效果在较少有利条件下能否保持"], answer: 2, explanation: "在设施较少的街区试验可检验方案是否具有普遍性。" },
    ],
  },
  {
    slug: "museum-machine-translation", level: 8, title: "博物馆译文中的机器与人", topic: "Culture & technology",
    paragraphs: [
      "一家地方博物馆计划为六百件展品制作多语种介绍。过去，讲解词由研究人员撰写，再交给译者处理；新方案则先用机器生成初稿，由编辑快速校对。管理层认为，这样既能缩短上线时间，也能让经费有限的小展厅获得更多语种版本。",
      "首轮试用确实提高了处理速度，却暴露出一个不容易量化的问题。某件陶器的中文说明把“土”同时用作材料名称和地方身份的隐喻，机器译文只保留了材料含义。语法没有明显错误，读者也能理解基本信息，但展品与当地历史之间的联系消失了。另一件展品的年代存在学术争议，原文谨慎地写“可能制作于”，初稿却变成了确定的陈述。若只统计拼写错误和完成数量，这两类偏差都会被忽略。",
      "策展团队随后把文本分为三类。交通、开放时间等实用信息可在自动检查后快速发布；普通展签需要译者抽样复核；涉及文化解释、未定论的史实和敏感称谓的内容则必须逐条审阅。译者还可以在内部系统标注机器常犯的错误，让下一批初稿避开已知问题。",
      "这一安排并非拒绝技术，而是重新划分责任。机器擅长提供可修改的起点，研究人员掌握证据边界，译者判断语义与语气，编辑负责保证各展厅的一致性。管理层最后放弃用“每小时发布多少条”作为唯一指标，增加读者理解测试与学术复核结果。效率仍然重要，但只有把“译得快”与“译得对什么”同时问清楚，速度才不会掩盖内容损失。",
    ],
    englishSummary: "A museum uses machine translation to speed up multilingual labels, but subtle cultural meanings and scholarly uncertainty can be lost. It assigns different review levels to different kinds of text and measures understanding as well as speed.",
    vocabulary: [{ word: "展签", pinyin: "zhǎnqiān", meaning: "exhibit label" }, { word: "隐喻", pinyin: "yǐnyù", meaning: "metaphor" }, { word: "复核", pinyin: "fùhé", meaning: "review again" }],
    questions: [
      { prompt: "为什么仅统计拼写错误不足以评价译文？", options: ["机器不会拼错字", "语义和证据语气也可能发生偏差", "所有展品都没有中文说明"], answer: 1, explanation: "文中两例的关键问题是意义或不确定性的丢失，而非拼写。" },
      { prompt: "哪些内容必须逐条审阅？", options: ["涉及文化解释和争议史实的内容", "开放时间", "所有交通信息"], answer: 0, explanation: "第三段把这类高风险展签列为逐条审阅。" },
      { prompt: "文章对机器翻译的核心态度是什么？", options: ["完全停用", "只看发布速度", "按内容风险分工使用"], answer: 2, explanation: "结尾说明各角色如何分担责任，既利用技术又控制内容损失。" },
    ],
  },
  {
    slug: "urban-cooling-causality", level: 9, title: "城市降温项目的因果难题", topic: "Research & methods",
    paragraphs: [
      "两座规模相近的城市先后启动屋顶绿化项目。一年后，先启动项目的甲市夏季平均地表温度下降了零点八摄氏度，乙市只下降了零点二摄氏度。甲市的宣传材料据此宣布：屋顶绿化带来的降温幅度是零点六摄氏度。这个数字简洁有力，却把“同时发生的差异”直接写成了“由项目造成的效果”。",
      "研究人员重新查看数据时发现，甲市当年的降雨明显多于乙市；两市使用的地表温度影像也不是在同一时段拍摄。更复杂的是，最早参加绿化的建筑多位于甲市树荫本就较多的区域。即使补齐气象资料，把项目区域与非项目区域简单比较，也可能将原有环境差异算进项目成效。",
      "有人提出只比较甲市实施前后的温度。这个办法排除了两市测量时间不一致的问题，却无法排除整个地区那一年普遍变凉的可能。另有人建议在乙市寻找相似建筑作为对照，但相似不等于完全可比：产权、屋顶结构和维护经费都会影响谁愿意参加项目，也可能独立影响降温表现。研究小组因此没有寻找一项万能的调整，而是预先说明不同分析各自依赖什么假设。",
      "他们最后采用分阶段推进的设计：符合安全标准的建筑先登记，再在条件允许的区域内分批实施。对暂未实施的建筑持续使用同一设备、同一时段测量，同时记录降雨、遮阴和屋顶维护情况。这个设计仍不能回答所有问题，例如它无法代表不符合安全标准的老旧建筑，但至少能减少测量方式和原有条件造成的混淆。",
      "项目报告不再只给出一个平均降温值，而是分别呈现不同建筑类型的估计区间，并公开未能充分控制的因素。决策者需要知道的不仅是“有没有降温”，还包括效果在何处、对谁、在什么条件下较稳定。承认结论的边界并不会削弱研究；恰恰相反，它使下一轮投资可以根据证据逐步调整，而不是依赖一个看似精确的单一数字。",
    ],
    englishSummary: "A city attributes a temperature difference to green roofs, but rainfall, measurement timing and selection bias complicate that claim. Researchers design a staged comparison and report uncertainty and limits rather than a single definitive effect.",
    vocabulary: [{ word: "因果", pinyin: "yīnguǒ", meaning: "cause and effect" }, { word: "混淆", pinyin: "hùnxiáo", meaning: "confounding" }, { word: "估计区间", pinyin: "gūjì qūjiān", meaning: "estimate interval" }],
    questions: [
      { prompt: "最初的“零点六摄氏度”结论有什么主要问题？", options: ["温度不能用数字表示", "把两市差异直接解释为项目效果", "乙市没有任何建筑"], answer: 1, explanation: "差异还可能来自降雨、测量时间与建筑选择等因素。" },
      { prompt: "分阶段推进的设计主要改善了什么？", options: ["对照条件和测量一致性", "所有建筑都能参加", "让降雨完全停止"], answer: 0, explanation: "持续用同一方式测量未实施建筑，并记录相关条件，有助于减少混淆。" },
      { prompt: "为什么报告要展示不同建筑的估计区间？", options: ["增加页面数量", "隐藏平均值", "说明效果差异与结论的不确定性"], answer: 2, explanation: "结尾强调效果在何处、对谁、在什么条件下较稳定。" },
    ],
  },
];

export function readingArticleBySlug(slug: string) {
  return READING_ARTICLES.find((article) => article.slug === slug);
}

export function chineseCharacterCount(paragraphs: string[]) {
  return (paragraphs.join("").match(/\p{Script=Han}/gu) ?? []).length;
}
