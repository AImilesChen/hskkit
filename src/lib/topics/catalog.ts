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

export const learningTopics: LearningTopic[] = [
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
    titleZh: "购买食材",
    description: "Compare prices and choose everyday food in a shop or supermarket.",
    learningGoal: "Ask about price and identify common fresh ingredients.",
    levelBands: ["1", "2", "4", "5"],
    wordAssetIds: [
      "hsk3.word.l2.0060.v1", "hsk3.word.l1.0314.v1", "hsk3.word.l1.0228.v1",
      "hsk3.word.l2.0372.v1", "hsk3.word.l1.0294.v1", "hsk3.word.l2.0414.v1",
      "hsk3.word.l1.0127.v1", "hsk3.word.l4.0816.v1", "hsk3.word.l5.0707.v1",
      "hsk3.word.l1.0346.v1", "hsk3.word.l1.0164.v1",
    ],
    featuredWordAssetIds: ["hsk3.word.l2.0060.v1", "hsk3.word.l1.0228.v1", "hsk3.word.l1.0346.v1"],
    estimatedMinutes: 16,
    sortOrder: 2,
    status: "published",
    contentVersion: "2026.09-topics-p0",
    sourceReleaseId: topicsSourceReleaseId,
    seoTitle: "Grocery Shopping Chinese Vocabulary | HSKKit",
    seoDescription: "Learn published HSK 3.0 words for supermarkets, prices, fruit, vegetables and fresh food.",
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
    sortOrder: 3,
    status: "published",
    contentVersion: "2026.09-topics-p0",
    sourceReleaseId: topicsSourceReleaseId,
    seoTitle: "Chinese Hotel Vocabulary — Rooms and Booking | HSKKit",
    seoDescription: "Learn published HSK 3.0 vocabulary for hotels, rooms, booking, reception, keys and facilities.",
    marker: "宿",
  },
];

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
