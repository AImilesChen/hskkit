import { p2TopicExpansions } from "./p2-expansions.ts";
import { p3AdditionalTopics } from "./p3-additional-topics.ts";

export type TopicStatus = "draft" | "published" | "withdrawn";

export interface TopicCategory {
  id: string;
  slug: string;
  title: string;
  titleZh: string;
  description: string;
  outcome: string;
  marker: string;
  sortOrder: number;
}

export type TopicDifficulty = "starter" | "developing" | "stretch";
export type TopicExpression = { hanzi: string; pinyin: string; meaning: string };
export type TopicDialogueTurn = TopicExpression & { speaker: "A" | "B" };
export interface TopicLesson {
  id: string;
  title: string;
  titleZh: string;
  outcome: string;
  wordAssetIds: string[];
  expressions: TopicExpression[];
  dialogue: TopicDialogueTurn[];
  task: { title: string; scenario: string; successCriteria: string[] };
}

export interface LearningTopic {
  id: string;
  slug: string;
  categoryId: string;
  title: string;
  titleZh: string;
  description: string;
  learningGoal: string;
  levelBands: string[];
  wordAssetIds: string[];
  featuredWordAssetIds: string[];
  estimatedMinutes: number;
  difficulty: TopicDifficulty;
  expressions: TopicExpression[];
  dialogue: TopicDialogueTurn[];
  lessons?: TopicLesson[];
  cultureNote: string;
  relatedTopicSlugs: string[];
  sortOrder: number;
  status: TopicStatus;
  contentVersion: string;
  sourceReleaseId: string;
  seoTitle: string;
  seoDescription: string;
  marker: string;
}

export const topicsSourceReleaseId = "hsk3-content-truth-v5";

export const topicCategories: TopicCategory[] = [
  {
    id: "topic-category.daily-life",
    slug: "daily-life",
    title: "Daily Life",
    titleZh: "日常生活",
    description: "Build the words you need to describe routines, plans, time and everyday weather.",
    outcome: "Talk through a normal day and make simple arrangements.",
    marker: "日",
    sortOrder: 1,
  },
  {
    id: "topic-category.food-drink",
    slug: "food-drink",
    title: "Food & Drink",
    titleZh: "饮食",
    description: "Learn practical vocabulary for eating out, buying ingredients and preparing a meal.",
    outcome: "Order, shop and follow the basic steps of cooking.",
    marker: "食",
    sortOrder: 2,
  },
  {
    id: "topic-category.travel-transport",
    slug: "travel-transport",
    title: "Travel & Transport",
    titleZh: "旅行交通",
    description: "Move through airports, public transport and hotel stays with task-focused vocabulary.",
    outcome: "Handle common travel stages from departure to check-in.",
    marker: "行",
    sortOrder: 3,
  },
];

const baseLearningTopics: LearningTopic[] = [
  {
    id: "topic.daily-life.morning-routine",
    slug: "morning-routine",
    categoryId: "topic-category.daily-life",
    title: "Start the Day",
    titleZh: "早晨起居",
    description: "Follow a practical sequence from waking up to leaving home for work or school.",
    learningGoal: "Describe the main actions in a weekday morning.",
    levelBands: ["1", "2", "4"],
    wordAssetIds: [
      "hsk3.word.l1.0459.v1", "hsk3.word.l1.0288.v1", "hsk3.word.l4.0672.v1",
      "hsk3.word.l2.0706.v1", "hsk3.word.l2.0071.v1", "hsk3.word.l1.0316.v1",
      "hsk3.word.l1.0323.v1", "hsk3.word.l1.0386.v1",
    ],
    featuredWordAssetIds: ["hsk3.word.l1.0459.v1", "hsk3.word.l1.0288.v1", "hsk3.word.l2.0706.v1"],
    estimatedMinutes: 12,
    difficulty: "starter",
    expressions: [{"hanzi": "我每天七点起床。", "pinyin": "Wǒ měitiān qī diǎn qǐchuáng.", "meaning": "I get up at seven every day."}, {"hanzi": "吃完早饭，我就出门。", "pinyin": "Chī wán zǎofàn, wǒ jiù chūmén.", "meaning": "After breakfast, I head out."}, {"hanzi": "今天早上有点儿忙。", "pinyin": "Jīntiān zǎoshang yǒudiǎnr máng.", "meaning": "This morning is a little busy."}],
    dialogue: [{"speaker": "A", "hanzi": "你每天几点起床？", "pinyin": "Nǐ měitiān jǐ diǎn qǐchuáng?", "meaning": "What time do you get up every day?"}, {"speaker": "B", "hanzi": "我七点起床，然后吃早饭。", "pinyin": "Wǒ qī diǎn qǐchuáng, ránhòu chī zǎofàn.", "meaning": "I get up at seven and then eat breakfast."}, {"speaker": "A", "hanzi": "你几点出门？", "pinyin": "Nǐ jǐ diǎn chūmén?", "meaning": "What time do you leave home?"}, {"speaker": "B", "hanzi": "我八点出门去上班。", "pinyin": "Wǒ bā diǎn chūmén qù shàngbān.", "meaning": "I leave at eight to go to work."}],
    cultureNote: "In Chinese, a daily routine is often told in time order. Words such as 然后 and 就 make the sequence sound natural without repeating the subject.",
    relatedTopicSlugs: ["time-and-plans", "cooking-at-home"],
    sortOrder: 1,
    status: "published",
    contentVersion: "2026.09-topics-p0",
    sourceReleaseId: topicsSourceReleaseId,
    seoTitle: "Morning Routine Chinese Vocabulary — Start the Day | HSKKit",
    seoDescription: "Learn published HSK 3.0 words for getting up, breakfast, leaving home, work and school.",
    marker: "朝",
  },
  {
    id: "topic.daily-life.time-plans",
    slug: "time-and-plans",
    categoryId: "topic-category.daily-life",
    title: "Time & Plans",
    titleZh: "时间安排",
    description: "Connect dates, times and plans so you can arrange everyday activities clearly.",
    learningGoal: "Say when something happens and whether it is planned or on time.",
    levelBands: ["1", "2", "3", "4", "6"],
    wordAssetIds: [
      "hsk3.word.l1.0181.v1", "hsk3.word.l1.0248.v1", "hsk3.word.l1.0399.v1",
      "hsk3.word.l1.0333.v1", "hsk3.word.l1.0334.v1", "hsk3.word.l2.0253.v1",
      "hsk3.word.l3.0002.v1", "hsk3.word.l4.0095.v1", "hsk3.word.l4.0984.v1",
      "hsk3.word.l6.1002.v1",
    ],
    featuredWordAssetIds: ["hsk3.word.l1.0334.v1", "hsk3.word.l2.0253.v1", "hsk3.word.l3.0002.v1"],
    estimatedMinutes: 15,
    difficulty: "developing",
    expressions: [{"hanzi": "我们明天下午见。", "pinyin": "Wǒmen míngtiān xiàwǔ jiàn.", "meaning": "Let’s meet tomorrow afternoon."}, {"hanzi": "你周末有时间吗？", "pinyin": "Nǐ zhōumò yǒu shíjiān ma?", "meaning": "Do you have time this weekend?"}, {"hanzi": "请准时到。", "pinyin": "Qǐng zhǔnshí dào.", "meaning": "Please arrive on time."}],
    dialogue: [{"speaker": "A", "hanzi": "你明天有时间吗？", "pinyin": "Nǐ míngtiān yǒu shíjiān ma?", "meaning": "Are you free tomorrow?"}, {"speaker": "B", "hanzi": "下午三点以后可以。", "pinyin": "Xiàwǔ sān diǎn yǐhòu kěyǐ.", "meaning": "After three in the afternoon works."}, {"speaker": "A", "hanzi": "那我们三点半见吧。", "pinyin": "Nà wǒmen sān diǎn bàn jiàn ba.", "meaning": "Then let’s meet at three thirty."}, {"speaker": "B", "hanzi": "好，我会准时到。", "pinyin": "Hǎo, wǒ huì zhǔnshí dào.", "meaning": "Okay, I’ll arrive on time."}],
    cultureNote: "When arranging a meeting, 吧 softens a suggestion. Confirm the day and time explicitly because Chinese conversation often omits information already understood.",
    relatedTopicSlugs: ["morning-routine", "departure-and-arrival"],
    sortOrder: 2,
    status: "published",
    contentVersion: "2026.09-topics-p0",
    sourceReleaseId: topicsSourceReleaseId,
    seoTitle: "Time and Planning Vocabulary in Chinese | HSKKit",
    seoDescription: "Study published HSK 3.0 vocabulary for today, tomorrow, schedules, punctuality and booking.",
    marker: "时",
  },
  {
    id: "topic.daily-life.weather-seasons",
    slug: "weather-and-seasons",
    categoryId: "topic-category.daily-life",
    title: "Weather & Seasons",
    titleZh: "天气季节",
    description: "Describe common conditions and the four seasons with a compact set of useful words.",
    learningGoal: "Understand and give a short everyday weather description.",
    levelBands: ["1", "2"],
    wordAssetIds: [
      "hsk3.word.l1.0360.v1", "hsk3.word.l2.0441.v1", "hsk3.word.l2.0668.v1",
      "hsk3.word.l1.0396.v1", "hsk3.word.l2.0590.v1", "hsk3.word.l1.0110.v1",
      "hsk3.word.l1.0304.v1", "hsk3.word.l1.0212.v1", "hsk3.word.l2.0080.v1",
      "hsk3.word.l2.0592.v1", "hsk3.word.l2.0445.v1", "hsk3.word.l2.0133.v1",
    ],
    featuredWordAssetIds: ["hsk3.word.l1.0360.v1", "hsk3.word.l1.0396.v1", "hsk3.word.l2.0590.v1"],
    estimatedMinutes: 16,
    difficulty: "starter",
    expressions: [{"hanzi": "今天天气很好。", "pinyin": "Jīntiān tiānqì hěn hǎo.", "meaning": "The weather is nice today."}, {"hanzi": "外面正在下雨。", "pinyin": "Wàimiàn zhèngzài xiàyǔ.", "meaning": "It is raining outside."}, {"hanzi": "冬天比秋天冷。", "pinyin": "Dōngtiān bǐ qiūtiān lěng.", "meaning": "Winter is colder than autumn."}],
    dialogue: [{"speaker": "A", "hanzi": "今天天气怎么样？", "pinyin": "Jīntiān tiānqì zěnmeyàng?", "meaning": "How is the weather today?"}, {"speaker": "B", "hanzi": "有点儿冷，还刮风。", "pinyin": "Yǒudiǎnr lěng, hái guāfēng.", "meaning": "It is a little cold and windy."}, {"speaker": "A", "hanzi": "下午会下雨吗？", "pinyin": "Xiàwǔ huì xiàyǔ ma?", "meaning": "Will it rain this afternoon?"}, {"speaker": "B", "hanzi": "天气预报说不会。", "pinyin": "Tiānqì yùbào shuō bú huì.", "meaning": "The forecast says it will not."}],
    cultureNote: "天气怎么样 is a common conversation opener. 有点儿 usually introduces an amount the speaker finds less than ideal, such as too cold or too hot.",
    relatedTopicSlugs: ["morning-routine", "getting-around-town"],
    sortOrder: 3,
    status: "published",
    contentVersion: "2026.09-topics-p0",
    sourceReleaseId: topicsSourceReleaseId,
    seoTitle: "Weather and Seasons Chinese Vocabulary | HSKKit",
    seoDescription: "Learn published HSK 3.0 words for sun, clouds, rain, snow, temperature and seasons.",
    marker: "天",
  },
  {
    id: "topic.food-drink.restaurant-basics",
    slug: "restaurant-basics",
    categoryId: "topic-category.food-drink",
    title: "Restaurant Basics",
    titleZh: "餐厅用餐",
    description: "Read the menu, choose staple foods and describe simple tastes while eating out.",
    learningGoal: "Recognize core words needed to choose and discuss a meal.",
    levelBands: ["1", "2", "4", "5"],
    wordAssetIds: [
      "hsk3.word.l2.0156.v1", "hsk3.word.l5.0076.v1", "hsk3.word.l2.0047.v1",
      "hsk3.word.l1.0242.v1", "hsk3.word.l1.0139.v1", "hsk3.word.l4.0455.v1",
      "hsk3.word.l1.0294.v1", "hsk3.word.l1.0228.v1",
    ],
    featuredWordAssetIds: ["hsk3.word.l2.0156.v1", "hsk3.word.l2.0047.v1", "hsk3.word.l1.0139.v1"],
    estimatedMinutes: 12,
    difficulty: "starter",
    expressions: [{"hanzi": "请给我看一下菜单。", "pinyin": "Qǐng gěi wǒ kàn yíxià càidān.", "meaning": "Please let me see the menu."}, {"hanzi": "我要一碗米饭。", "pinyin": "Wǒ yào yì wǎn mǐfàn.", "meaning": "I would like a bowl of rice."}, {"hanzi": "这个菜不太辣。", "pinyin": "Zhège cài bú tài là.", "meaning": "This dish is not very spicy."}],
    dialogue: [{"speaker": "A", "hanzi": "您好，想吃点儿什么？", "pinyin": "Nínhǎo, xiǎng chī diǎnr shénme?", "meaning": "Hello, what would you like to eat?"}, {"speaker": "B", "hanzi": "请给我一份菜单。", "pinyin": "Qǐng gěi wǒ yí fèn càidān.", "meaning": "Please give me a menu."}, {"speaker": "A", "hanzi": "这个菜很受欢迎。", "pinyin": "Zhège cài hěn shòu huānyíng.", "meaning": "This dish is very popular."}, {"speaker": "B", "hanzi": "好，我要这个，再要一碗米饭。", "pinyin": "Hǎo, wǒ yào zhège, zài yào yì wǎn mǐfàn.", "meaning": "Okay, I’ll have this and a bowl of rice."}],
    cultureNote: "Using 您 and 请 is polite with restaurant staff. 一份 is a useful measure word for an order, while 一碗 is used for a bowl of rice or noodles.",
    relatedTopicSlugs: ["grocery-shopping", "cooking-at-home"],
    sortOrder: 1,
    status: "published",
    contentVersion: "2026.09-topics-p0",
    sourceReleaseId: topicsSourceReleaseId,
    seoTitle: "Restaurant Chinese Vocabulary — Menu and Meals | HSKKit",
    seoDescription: "Study published HSK 3.0 vocabulary for restaurants, menus, rice, taste and paying for food.",
    marker: "餐",
  },
  {
    id: "topic.food-drink.grocery-shopping",
    slug: "grocery-shopping",
    categoryId: "topic-category.food-drink",
    title: "Grocery Shopping",
    titleZh: "超市购物",
    description: "Complete a real supermarket trip in three short lessons: find what you need, compare quantity and price, then pay and leave with the right receipt or bag.",
    learningGoal: "Find groceries, compare price and quantity, and complete checkout in a natural exchange.",
    levelBands: ["1", "2", "3", "4", "5", "7"],
    wordAssetIds: [
      "hsk3.word.l1.0314.v1", "hsk3.word.l2.0060.v1", "hsk3.word.l4.0283.v1", "hsk3.word.l1.0228.v1", "hsk3.word.l2.0372.v1",
      "hsk3.word.l3.0816.v1", "hsk3.word.l1.0346.v1", "hsk3.word.l5.0707.v1", "hsk3.word.l3.0539.v1", "hsk3.word.l1.0275.v1",
      "hsk3.word.l4.0816.v1", "hsk3.word.l3.0334.v1", "hsk3.word.l3.0335.v1", "hsk3.word.l2.0414.v1", "hsk3.word.l1.0127.v1",
      "hsk3.word.l1.0095.v1", "hsk3.word.l1.0294.v1", "hsk3.word.l2.0190.v1", "hsk3.word.l2.0293.v1", "hsk3.word.l2.0422.v1",
      "hsk3.word.l4.0139.v1", "hsk3.word.l3.0782.v1", "hsk3.word.l2.0621.v1", "hsk3.word.l3.0904.v1", "hsk3.word.l7.3760.v1",
      "hsk3.word.l2.0408.v1", "hsk3.word.l4.0686.v1", "hsk3.word.l4.0220.v1", "hsk3.word.l4.0991.v1", "hsk3.word.l3.0309.v1",
    ],
    featuredWordAssetIds: ["hsk3.word.l2.0060.v1", "hsk3.word.l1.0346.v1", "hsk3.word.l3.0334.v1", "hsk3.word.l3.0904.v1"],
    estimatedMinutes: 45,
    difficulty: "developing",
    expressions: [{"hanzi": "请问，牛奶在哪儿？", "pinyin": "Qǐngwèn, niúnǎi zài nǎr?", "meaning": "Excuse me, where is the milk?"}, {"hanzi": "这个多少钱一斤？", "pinyin": "Zhège duōshao qián yì jīn?", "meaning": "How much is this per jin?"}, {"hanzi": "我用信用卡支付。", "pinyin": "Wǒ yòng xìnyòngkǎ zhīfù.", "meaning": "I’ll pay by credit card."}, {"hanzi": "请给我收据。", "pinyin": "Qǐng gěi wǒ shōujù.", "meaning": "Please give me the receipt."}],
    dialogue: [{"speaker": "A", "hanzi": "请问，新鲜蔬菜在哪儿？", "pinyin": "Qǐngwèn, xīnxiān shūcài zài nǎr?", "meaning": "Excuse me, where are the fresh vegetables?"}, {"speaker": "B", "hanzi": "在水果旁边。今天苹果打折。", "pinyin": "Zài shuǐguǒ pángbiān. Jīntiān píngguǒ dǎzhé.", "meaning": "Beside the fruit. Apples are discounted today."}, {"speaker": "A", "hanzi": "我要一公斤苹果和一瓶牛奶，总共多少钱？", "pinyin": "Wǒ yào yì gōngjīn píngguǒ hé yì píng niúnǎi, zǒnggòng duōshao qián?", "meaning": "I’d like one kilogram of apples and a bottle of milk. How much altogether?"}, {"speaker": "B", "hanzi": "三十二块。您用现金还是信用卡？", "pinyin": "Sānshí'èr kuài. Nín yòng xiànjīn háishi xìnyòngkǎ?", "meaning": "Thirty-two yuan. Cash or card?"}],
    lessons: [
      {
        id: "find-and-buy", title: "Find what you need", titleZh: "找到并购买商品", outcome: "Ask where an item is and choose ten common grocery words.",
        wordAssetIds: ["hsk3.word.l1.0314.v1", "hsk3.word.l2.0060.v1", "hsk3.word.l4.0283.v1", "hsk3.word.l1.0228.v1", "hsk3.word.l2.0372.v1", "hsk3.word.l3.0816.v1", "hsk3.word.l1.0346.v1", "hsk3.word.l5.0707.v1", "hsk3.word.l3.0539.v1", "hsk3.word.l1.0275.v1"],
        expressions: [{"hanzi": "我需要买水果和蔬菜。", "pinyin": "Wǒ xūyào mǎi shuǐguǒ hé shūcài.", "meaning": "I need to buy fruit and vegetables."}, {"hanzi": "请问，牛奶在哪儿？", "pinyin": "Qǐngwèn, niúnǎi zài nǎr?", "meaning": "Excuse me, where is the milk?"}, {"hanzi": "这个商店卖苹果吗？", "pinyin": "Zhège shāngdiàn mài píngguǒ ma?", "meaning": "Does this shop sell apples?"}],
        dialogue: [{"speaker": "A", "hanzi": "请问，水果在哪儿？", "pinyin": "Qǐngwèn, shuǐguǒ zài nǎr?", "meaning": "Excuse me, where is the fruit?"}, {"speaker": "B", "hanzi": "在前面，蔬菜旁边。", "pinyin": "Zài qiánmiàn, shūcài pángbiān.", "meaning": "Ahead, beside the vegetables."}, {"speaker": "A", "hanzi": "这里卖牛奶吗？", "pinyin": "Zhèlǐ mài niúnǎi ma?", "meaning": "Do you sell milk here?"}, {"speaker": "B", "hanzi": "卖，在右边的冰箱里。", "pinyin": "Mài, zài yòubiān de bīngxiāng lǐ.", "meaning": "Yes, in the refrigerator on the right."}],
        task: { title: "Find four items", scenario: "You enter an unfamiliar supermarket with a list: apples, vegetables, fruit and milk. Ask a clerk where two items are, then say what you need to buy.", successCriteria: ["Ask where an item is", "Name at least four groceries", "Use 需要 and 买 in one natural sentence"] },
      },
      {
        id: "compare-and-measure", title: "Compare price and quantity", titleZh: "比较价格和数量", outcome: "Check freshness, ask a price, and choose the right unit or container.",
        wordAssetIds: ["hsk3.word.l4.0816.v1", "hsk3.word.l3.0334.v1", "hsk3.word.l3.0335.v1", "hsk3.word.l2.0414.v1", "hsk3.word.l1.0127.v1", "hsk3.word.l1.0095.v1", "hsk3.word.l1.0294.v1", "hsk3.word.l2.0190.v1", "hsk3.word.l2.0293.v1", "hsk3.word.l2.0422.v1"],
        expressions: [{"hanzi": "这些苹果新鲜吗？", "pinyin": "Zhèxiē píngguǒ xīnxiān ma?", "meaning": "Are these apples fresh?"}, {"hanzi": "这个多少钱一斤？", "pinyin": "Zhège duōshao qián yì jīn?", "meaning": "How much is this per jin?"}, {"hanzi": "我要一公斤，再要一瓶牛奶。", "pinyin": "Wǒ yào yì gōngjīn, zài yào yì píng niúnǎi.", "meaning": "I’ll take one kilogram, plus a bottle of milk."}],
        dialogue: [{"speaker": "A", "hanzi": "这些苹果新鲜吗？", "pinyin": "Zhèxiē píngguǒ xīnxiān ma?", "meaning": "Are these apples fresh?"}, {"speaker": "B", "hanzi": "很新鲜，八块钱一斤。", "pinyin": "Hěn xīnxiān, bā kuài qián yì jīn.", "meaning": "Very fresh, eight yuan per jin."}, {"speaker": "A", "hanzi": "旁边的价格更便宜吗？", "pinyin": "Pángbiān de jiàgé gèng piányi ma?", "meaning": "Is the price of the ones beside them cheaper?"}, {"speaker": "B", "hanzi": "对，但是那些苹果小一点儿。", "pinyin": "Duì, dànshì nàxiē píngguǒ xiǎo yìdiǎnr.", "meaning": "Yes, but those apples are a little smaller."}],
        task: { title: "Choose the better buy", scenario: "Two apple displays use different prices and units. Ask the price, confirm whether it is per jin or kilogram, and choose one kilogram without confusing the total.", successCriteria: ["Ask 多少钱", "Use 斤 or 公斤 correctly", "Compare 便宜 and 贵 before choosing"] },
      },
      {
        id: "pay-and-leave", title: "Pay and finish checkout", titleZh: "付款并完成结账", outcome: "Understand a discount, choose a payment method, and ask for checkout documents.",
        wordAssetIds: ["hsk3.word.l4.0139.v1", "hsk3.word.l3.0782.v1", "hsk3.word.l2.0621.v1", "hsk3.word.l3.0904.v1", "hsk3.word.l7.3760.v1", "hsk3.word.l2.0408.v1", "hsk3.word.l4.0686.v1", "hsk3.word.l4.0220.v1", "hsk3.word.l4.0991.v1", "hsk3.word.l3.0309.v1"],
        expressions: [{"hanzi": "这个会员价打折吗？", "pinyin": "Zhège huìyuán jià dǎzhé ma?", "meaning": "Is this member price discounted?"}, {"hanzi": "我用信用卡支付。", "pinyin": "Wǒ yòng xìnyòngkǎ zhīfù.", "meaning": "I’ll pay by credit card."}, {"hanzi": "请给我收据和发票。", "pinyin": "Qǐng gěi wǒ shōujù hé fāpiào.", "meaning": "Please give me the receipt and invoice."}],
        dialogue: [{"speaker": "A", "hanzi": "您好，会员商品今天打折。", "pinyin": "Nínhǎo, huìyuán shāngpǐn jīntiān dǎzhé.", "meaning": "Hello, member items are discounted today."}, {"speaker": "B", "hanzi": "好的，总共多少钱？", "pinyin": "Hǎo de, zǒnggòng duōshao qián?", "meaning": "Okay, how much is it altogether?"}, {"speaker": "A", "hanzi": "五十八块。用现金还是信用卡？", "pinyin": "Wǔshíbā kuài. Yòng xiànjīn háishi xìnyòngkǎ?", "meaning": "Fifty-eight yuan. Cash or card?"}, {"speaker": "B", "hanzi": "信用卡。请给我一个塑料袋和收据。", "pinyin": "Xìnyòngkǎ. Qǐng gěi wǒ yí ge sùliàodài hé shōujù.", "meaning": "Card. Please give me a plastic bag and the receipt."}],
        task: { title: "Complete checkout", scenario: "You reach a staffed checkout after waiting in line. Confirm the discounted total, choose cash or card, pay, and request the document and bag you need.", successCriteria: ["Confirm the total with 总共", "State a payment method", "Ask for a 收据, 发票 or 塑料袋"] },
      },
    ],
    cultureNote: "A 斤 is commonly used in mainland Chinese food markets and equals 500 grams. Supermarkets usually show fixed prices, while 会员价 marks a member price. A 收据 is a receipt; 发票 usually refers to an official invoice, so ask for the one you actually need.",
    relatedTopicSlugs: ["restaurant-basics", "cooking-at-home"],
    sortOrder: 2,
    status: "published",
    contentVersion: "2026.09-grocery-sample-p1",
    sourceReleaseId: topicsSourceReleaseId,
    seoTitle: "Grocery Shopping Chinese Vocabulary | HSKKit",
    seoDescription: "Learn 30 published HSK 3.0 grocery words in three practical lessons, with pronunciation, price questions, checkout dialogue and SRS practice.",
    marker: "购",
  },
  {
    id: "topic.food-drink.cooking-at-home",
    slug: "cooking-at-home",
    categoryId: "topic-category.food-drink",
    title: "Cook at Home",
    titleZh: "居家做饭",
    description: "Move from kitchen tools to basic actions and seasonings used in home cooking.",
    learningGoal: "Follow and describe the main steps of preparing a simple meal.",
    levelBands: ["1", "2", "3", "4", "5", "6"],
    wordAssetIds: [
      "hsk3.word.l2.0772.v1", "hsk3.word.l5.0129.v1", "hsk3.word.l5.0307.v1",
      "hsk3.word.l3.0141.v1", "hsk3.word.l1.0386.v1", "hsk3.word.l4.0581.v1",
      "hsk3.word.l1.0103.v1", "hsk3.word.l4.0850.v1", "hsk3.word.l3.0698.v1",
      "hsk3.word.l2.0681.v1", "hsk3.word.l6.1097.v1", "hsk3.word.l6.0114.v1",
    ],
    featuredWordAssetIds: ["hsk3.word.l2.0772.v1", "hsk3.word.l5.0129.v1", "hsk3.word.l4.0581.v1"],
    estimatedMinutes: 18,
    difficulty: "stretch",
    expressions: [{"hanzi": "先把菜洗干净。", "pinyin": "Xiān bǎ cài xǐ gānjìng.", "meaning": "First wash the vegetables clean."}, {"hanzi": "锅热了以后再放油。", "pinyin": "Guō rè le yǐhòu zài fàng yóu.", "meaning": "Add oil after the pan is hot."}, {"hanzi": "最后加一点儿盐。", "pinyin": "Zuìhòu jiā yìdiǎnr yán.", "meaning": "Finally add a little salt."}],
    dialogue: [{"speaker": "A", "hanzi": "晚饭我们做什么？", "pinyin": "Wǎnfàn wǒmen zuò shénme?", "meaning": "What are we making for dinner?"}, {"speaker": "B", "hanzi": "做一个西红柿炒鸡蛋吧。", "pinyin": "Zuò yí ge xīhóngshì chǎo jīdàn ba.", "meaning": "Let’s make tomato and egg stir-fry."}, {"speaker": "A", "hanzi": "我先洗菜，你来切。", "pinyin": "Wǒ xiān xǐ cài, nǐ lái qiē.", "meaning": "I’ll wash the vegetables first; you cut them."}, {"speaker": "B", "hanzi": "好，炒的时候我来放盐。", "pinyin": "Hǎo, chǎo de shíhou wǒ lái fàng yán.", "meaning": "Okay, I’ll add the salt while we stir-fry."}],
    cultureNote: "Chinese recipes often use 先…再…最后… to mark the order of steps. Home cooks may describe seasoning approximately rather than with exact measurements.",
    relatedTopicSlugs: ["grocery-shopping", "restaurant-basics"],
    sortOrder: 3,
    status: "published",
    contentVersion: "2026.09-topics-p0",
    sourceReleaseId: topicsSourceReleaseId,
    seoTitle: "Chinese Cooking Vocabulary — Kitchen and Actions | HSKKit",
    seoDescription: "Study published HSK 3.0 vocabulary for kitchens, cooking tools, seasonings and preparation actions.",
    marker: "厨",
  },
  {
    id: "topic.travel-transport.departure-arrival",
    slug: "departure-and-arrival",
    categoryId: "topic-category.travel-transport",
    title: "Departure & Arrival",
    titleZh: "出发与到达",
    description: "Prepare for a trip by recognising transport, tickets, documents, luggage and timing.",
    learningGoal: "Follow the basic sequence from terminal arrival to reaching a destination.",
    levelBands: ["1", "2", "3", "4"],
    wordAssetIds: [
      "hsk3.word.l1.0107.v1", "hsk3.word.l1.0162.v1", "hsk3.word.l1.0161.v1",
      "hsk3.word.l1.0043.v1", "hsk3.word.l2.0231.v1", "hsk3.word.l3.0803.v1",
      "hsk3.word.l2.0068.v1", "hsk3.word.l3.0143.v1", "hsk3.word.l4.0311.v1",
    ],
    featuredWordAssetIds: ["hsk3.word.l1.0107.v1", "hsk3.word.l2.0231.v1", "hsk3.word.l3.0803.v1"],
    estimatedMinutes: 14,
    difficulty: "developing",
    expressions: [{"hanzi": "请问，登机口在哪儿？", "pinyin": "Qǐngwèn, dēngjīkǒu zài nǎr?", "meaning": "Excuse me, where is the boarding gate?"}, {"hanzi": "我想取一下火车票。", "pinyin": "Wǒ xiǎng qǔ yíxià huǒchēpiào.", "meaning": "I would like to collect my train ticket."}, {"hanzi": "飞机准时到达。", "pinyin": "Fēijī zhǔnshí dàodá.", "meaning": "The plane arrives on time."}],
    dialogue: [{"speaker": "A", "hanzi": "请出示您的护照和机票。", "pinyin": "Qǐng chūshì nín de hùzhào hé jīpiào.", "meaning": "Please show your passport and ticket."}, {"speaker": "B", "hanzi": "好的。我的行李在哪儿托运？", "pinyin": "Hǎo de. Wǒ de xíngli zài nǎr tuōyùn?", "meaning": "Okay. Where do I check my luggage?"}, {"speaker": "A", "hanzi": "在前面的柜台办理。", "pinyin": "Zài qiánmiàn de guìtái bànlǐ.", "meaning": "Handle it at the counter ahead."}, {"speaker": "B", "hanzi": "谢谢，登机口是几号？", "pinyin": "Xièxie, dēngjīkǒu shì jǐ hào?", "meaning": "Thank you. What number is the gate?"}],
    cultureNote: "At transport hubs, 请问 politely starts a question to staff. Keep passports and tickets ready, and repeat numbers to confirm gates, platforms or departure times.",
    relatedTopicSlugs: ["getting-around-town", "hotel-stay"],
    sortOrder: 1,
    status: "published",
    contentVersion: "2026.09-topics-p0",
    sourceReleaseId: topicsSourceReleaseId,
    seoTitle: "Chinese Travel Vocabulary — Departure and Arrival | HSKKit",
    seoDescription: "Learn published HSK 3.0 travel words for airports, trains, tickets, passports, luggage and flights.",
    marker: "旅",
  },
  {
    id: "topic.travel-transport.getting-around",
    slug: "getting-around-town",
    categoryId: "topic-category.travel-transport",
    title: "Getting Around Town",
    titleZh: "市内交通",
    description: "Choose public transport, follow a route and know when to get on, off or change.",
    learningGoal: "Understand the core words needed to complete a local transport journey.",
    levelBands: ["1", "2"],
    wordAssetIds: [
      "hsk3.word.l2.0125.v1", "hsk3.word.l2.0188.v1", "hsk3.word.l2.0076.v1",
      "hsk3.word.l1.0461.v1", "hsk3.word.l1.0318.v1", "hsk3.word.l1.0392.v1",
      "hsk3.word.l2.0240.v1", "hsk3.word.l1.0221.v1", "hsk3.word.l2.0161.v1",
      "hsk3.word.l2.0506.v1",
    ],
    featuredWordAssetIds: ["hsk3.word.l2.0125.v1", "hsk3.word.l2.0188.v1", "hsk3.word.l2.0076.v1"],
    estimatedMinutes: 15,
    difficulty: "starter",
    expressions: [{"hanzi": "请问，地铁站怎么走？", "pinyin": "Qǐngwèn, dìtiězhàn zěnme zǒu?", "meaning": "Excuse me, how do I get to the subway station?"}, {"hanzi": "坐三站以后下车。", "pinyin": "Zuò sān zhàn yǐhòu xiàchē.", "meaning": "Get off after three stops."}, {"hanzi": "我需要换一次车。", "pinyin": "Wǒ xūyào huàn yí cì chē.", "meaning": "I need to transfer once."}],
    dialogue: [{"speaker": "A", "hanzi": "去市中心坐几路车？", "pinyin": "Qù shì zhōngxīn zuò jǐ lù chē?", "meaning": "Which bus goes downtown?"}, {"speaker": "B", "hanzi": "坐十二路，在第三站下车。", "pinyin": "Zuò shí’èr lù, zài dì-sān zhàn xiàchē.", "meaning": "Take bus 12 and get off at the third stop."}, {"speaker": "A", "hanzi": "需要换车吗？", "pinyin": "Xūyào huàn chē ma?", "meaning": "Do I need to transfer?"}, {"speaker": "B", "hanzi": "不用，直接到。", "pinyin": "Bú yòng, zhíjiē dào.", "meaning": "No, it goes there directly."}],
    cultureNote: "Bus routes use 路 after the number, while subway lines use 号线. When asking directions, repeat the stop count and transfer point to reduce mistakes.",
    relatedTopicSlugs: ["departure-and-arrival", "weather-and-seasons"],
    sortOrder: 2,
    status: "published",
    contentVersion: "2026.09-topics-p0",
    sourceReleaseId: topicsSourceReleaseId,
    seoTitle: "Chinese Public Transport Vocabulary | HSKKit",
    seoDescription: "Study published HSK 3.0 words for subway, bus, taxi, stations, routes and changing transport.",
    marker: "车",
  },
  {
    id: "topic.travel-transport.hotel-stay",
    slug: "hotel-stay",
    categoryId: "topic-category.travel-transport",
    title: "Hotel Stay",
    titleZh: "酒店住宿",
    description: "Book a room and recognise the people, places and facilities used during a hotel stay.",
    learningGoal: "Handle basic room, booking and hotel facility vocabulary.",
    levelBands: ["1", "2", "4", "5", "7–9"],
    wordAssetIds: [
      "hsk3.word.l5.0041.v1", "hsk3.word.l2.0302.v1", "hsk3.word.l1.0101.v1",
      "hsk3.word.l4.0907.v1", "hsk3.word.l7.3259.v1", "hsk3.word.l7.4847.v1",
      "hsk3.word.l4.0190.v1", "hsk3.word.l1.0387.v1",
    ],
    featuredWordAssetIds: ["hsk3.word.l2.0302.v1", "hsk3.word.l1.0101.v1", "hsk3.word.l4.0907.v1"],
    estimatedMinutes: 12,
    difficulty: "developing",
    expressions: [{"hanzi": "我预订了一个房间。", "pinyin": "Wǒ yùdìng le yí ge fángjiān.", "meaning": "I booked a room."}, {"hanzi": "请问，早餐几点开始？", "pinyin": "Qǐngwèn, zǎocān jǐ diǎn kāishǐ?", "meaning": "Excuse me, what time does breakfast begin?"}, {"hanzi": "房卡打不开门。", "pinyin": "Fángkǎ dǎ bu kāi mén.", "meaning": "The room key card will not open the door."}],
    dialogue: [{"speaker": "A", "hanzi": "您好，我预订了一个房间。", "pinyin": "Nínhǎo, wǒ yùdìng le yí ge fángjiān.", "meaning": "Hello, I booked a room."}, {"speaker": "B", "hanzi": "请出示您的证件。", "pinyin": "Qǐng chūshì nín de zhèngjiàn.", "meaning": "Please show your identification."}, {"speaker": "A", "hanzi": "这是我的护照。早餐在哪里？", "pinyin": "Zhè shì wǒ de hùzhào. Zǎocān zài nǎli?", "meaning": "Here is my passport. Where is breakfast?"}, {"speaker": "B", "hanzi": "在二楼，早上七点开始。", "pinyin": "Zài èr lóu, zǎoshang qī diǎn kāishǐ.", "meaning": "On the second floor, starting at seven."}],
    cultureNote: "Hotels commonly ask for identification at check-in. Use 请问 for facility questions and state the room number when requesting help, but do not say it loudly in crowded areas.",
    relatedTopicSlugs: ["departure-and-arrival", "restaurant-basics"],
    sortOrder: 3,
    status: "published",
    contentVersion: "2026.09-topics-p0",
    sourceReleaseId: topicsSourceReleaseId,
    seoTitle: "Chinese Hotel Vocabulary — Rooms and Booking | HSKKit",
    seoDescription: "Learn published HSK 3.0 vocabulary for hotels, rooms, booking, reception, keys and facilities.",
    marker: "宿",
  },
];

export const learningTopics: LearningTopic[] = baseLearningTopics.map((topic) => {
  const expansion = p2TopicExpansions[topic.slug];
  return expansion ? { ...topic, ...expansion } : topic;
}).concat(p3AdditionalTopics);

export function findTopicCategoryBySlug(slug: string) {
  return topicCategories.find((category) => category.slug === slug) ?? null;
}

export function findTopicBySlug(slug: string) {
  return learningTopics.find((topic) => topic.slug === slug && topic.status === "published") ?? null;
}

export function topicsForCategory(categoryId: string) {
  return learningTopics
    .filter((topic) => topic.categoryId === categoryId && topic.status === "published")
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function categoryForTopic(topic: LearningTopic) {
  return topicCategories.find((category) => category.id === topic.categoryId) ?? null;
}

export function publishedTopicRoutesForVerifiedAssets(activeReleaseId: string | null, activeAssetIds: Iterable<string>) {
  if (activeReleaseId !== topicsSourceReleaseId) return [];
  const active = new Set(activeAssetIds);
  const required = new Set(learningTopics.filter((topic) => topic.status === "published").flatMap((topic) => topic.wordAssetIds));
  if ([...required].some((assetId) => !active.has(assetId))) return [];
  const verifiedTopics = learningTopics.filter((topic) =>
    topic.status === "published"
    && topic.sourceReleaseId === activeReleaseId
    && topic.wordAssetIds.every((assetId) => active.has(assetId))
  );
  if (!verifiedTopics.length) return [];
  const categoryIds = new Set(verifiedTopics.map((topic) => topic.categoryId));
  return [
    "/topics",
    ...topicCategories.filter((category) => categoryIds.has(category.id)).sort((left, right) => left.sortOrder - right.sortOrder).map((category) => `/topics/${category.slug}`),
    ...verifiedTopics.map((topic) => `/topics/${topic.slug}`),
  ];
}

export type TopicFilters = {
  level?: string;
  difficulty?: TopicDifficulty | "all";
  duration?: "quick" | "standard" | "deep" | "all";
};

export function filterPublishedTopics(filters: TopicFilters = {}) {
  const level = filters.level ?? "all";
  const difficulty = filters.difficulty ?? "all";
  const duration = filters.duration ?? "all";
  return learningTopics.filter((topic) => {
    if (topic.status !== "published") return false;
    if (level !== "all" && !topic.levelBands.includes(level)) return false;
    if (difficulty !== "all" && topic.difficulty !== difficulty) return false;
    if (duration === "quick" && topic.estimatedMinutes > 12) return false;
    if (duration === "standard" && (topic.estimatedMinutes < 13 || topic.estimatedMinutes > 15)) return false;
    if (duration === "deep" && topic.estimatedMinutes < 16) return false;
    return true;
  });
}

export function relatedTopicsFor(topic: LearningTopic) {
  const requested = new Set(topic.relatedTopicSlugs);
  return learningTopics.filter((candidate) => candidate.status === "published" && candidate.id !== topic.id && requested.has(candidate.slug));
}
