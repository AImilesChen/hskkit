export const travelCategories = [
  { id: "essentials", title: "Essentials", description: "Start a conversation, be polite and ask someone to slow down.", topic: "/vocabulary/1", topicLabel: "Build your basics" },
  { id: "transport", title: "Transport", description: "Find your way, take a taxi and reach the right station.", topic: "/topics/getting-around-town", topicLabel: "Practise getting around" },
  { id: "hotels", title: "Hotels", description: "Check in, find your room and ask about breakfast.", topic: "/topics/hotel-stay", topicLabel: "Explore hotel Chinese" },
  { id: "food", title: "Food & drink", description: "Order something you want and ask for the bill.", topic: "/topics/restaurant-basics", topicLabel: "Explore restaurant Chinese" },
  { id: "shopping", title: "Shopping & payment", description: "Ask the price, choose an item and check how to pay.", topic: "/topics/grocery-shopping", topicLabel: "Practise shopping" },
  { id: "help", title: "Getting help", description: "Find a restroom, ask for help or explain what you have lost.", topic: "/topics/travel-transport", topicLabel: "Explore travel topics" },
] as const;

export type TravelCategory = typeof travelCategories[number]["id"];
export type TravelEntry = { id: string; category: TravelCategory; kind: "word" | "phrase"; hanzi: string; pinyin: string; english: string; note: string; aliases: string };
type Row = [hanzi: string, pinyin: string, english: string, note: string, aliases?: string];

const content: Record<TravelCategory, { words: Row[]; phrases: Row[] }> = {
  essentials: {
    words: [
      ["你好", "nǐ hǎo", "Hello", "A simple greeting for everyday situations."],
      ["谢谢", "xièxie", "Thank you", "Use after receiving help or service."],
      ["请", "qǐng", "Please", "Place before a request; it is not usually used on its own."],
      ["对不起", "duìbuqǐ", "Sorry", "Use to apologise. 不好意思 also works when interrupting someone."],
    ],
    phrases: [
      ["不好意思。", "Bù hǎoyìsi.", "Excuse me.", "A polite way to interrupt or get someone's attention.", "sorry pardon"],
      ["我听不懂。", "Wǒ tīng bu dǒng.", "I don't understand.", "Use when you cannot understand what someone is saying."],
      ["请说慢一点。", "Qǐng shuō màn yìdiǎn.", "Please speak more slowly.", "Ask for a slower explanation.", "repeat slow"],
      ["你会说英语吗？", "Nǐ huì shuō Yīngyǔ ma?", "Do you speak English?", "Ask whether someone can help in English."],
    ],
  },
  transport: {
    words: [
      ["机场", "jīchǎng", "Airport", "Useful on signs and when giving a destination."],
      ["火车站", "huǒchēzhàn", "Train station", "Check the exact station name; a city can have several stations.", "railway rail"],
      ["地铁站", "dìtiězhàn", "Subway station", "Look for the entrance and the line number.", "metro underground"],
      ["出租车", "chūzūchē", "Taxi", "Show the full Chinese address as well as the place name.", "cab didi"],
      ["票", "piào", "Ticket", "一张票 means one ticket."],
      ["出口", "chūkǒu", "Exit", "Useful for finding a station or building exit."],
    ],
    phrases: [
      ["请带我去这个地址。", "Qǐng dài wǒ qù zhège dìzhǐ.", "Please take me to this address.", "Show your destination's Chinese address on your phone.", "taxi cab hotel destination"],
      ["请问，地铁站怎么走？", "Qǐngwèn, dìtiězhàn zěnme zǒu?", "Excuse me, how do I get to the subway station?", "请问 is a polite way to start a question.", "directions metro where"],
      ["我要在这里下车。", "Wǒ yào zài zhèlǐ xiàchē.", "I'd like to get off here.", "Useful in a taxi when you have reached a suitable stopping place.", "stop taxi bus"],
    ],
  },
  hotels: {
    words: [
      ["酒店", "jiǔdiàn", "Hotel", "Keep your hotel's full Chinese name and address handy."],
      ["护照", "hùzhào", "Passport", "Useful when staff ask for identification at check-in."],
      ["房间", "fángjiān", "Room", "房间号 means room number."],
      ["房卡", "fángkǎ", "Room key card", "Ask at the front desk if the card does not work.", "key"],
      ["早餐", "zǎocān", "Breakfast", "Useful when asking about meal times."],
    ],
    phrases: [
      ["我有预订。", "Wǒ yǒu yùdìng.", "I have a reservation.", "Show the booking confirmation and the name on it.", "booking check in check-in"],
      ["我想办理入住。", "Wǒ xiǎng bànlǐ rùzhù.", "I'd like to check in.", "Use at the hotel reception.", "front desk reception"],
      ["早餐几点开始？", "Zǎocān jǐ diǎn kāishǐ?", "What time does breakfast start?", "Ask reception or restaurant staff."],
    ],
  },
  food: {
    words: [
      ["菜单", "càidān", "Menu", "Useful when asking to see what is available.", "restaurant"],
      ["水", "shuǐ", "Water", "热水 is hot water; 冰水 is iced water.", "drink"],
      ["米饭", "mǐfàn", "Cooked rice", "一碗米饭 means one bowl of rice."],
      ["面条", "miàntiáo", "Noodles", "Often followed by details about the broth or toppings."],
      ["辣", "là", "Spicy", "Useful when choosing dishes; 不辣 means not spicy.", "chilli chili hot"],
    ],
    phrases: [
      ["我要这个。", "Wǒ yào zhège.", "I'd like this one.", "Point to an item on the menu.", "order food choose"],
      ["请不要放辣椒。", "Qǐng bú yào fàng làjiāo.", "Please don't add chilli.", "A preference request; this does not communicate a food allergy.", "spicy chili no spice"],
      ["请给我一杯水。", "Qǐng gěi wǒ yì bēi shuǐ.", "Please give me a glass of water.", "You can specify 热水 (hot water) if needed.", "drink"],
      ["请结账。", "Qǐng jiézhàng.", "The bill, please.", "Use when you are ready to pay.", "bill check pay restaurant"],
    ],
  },
  shopping: {
    words: [
      ["钱", "qián", "Money", "多少钱 means how much money or how much something costs.", "price cost"],
      ["现金", "xiànjīn", "Cash", "Useful when asking about payment methods."],
      ["支付宝", "Zhīfùbǎo", "Alipay", "The name of a payment app; ask staff if you can pay with it.", "payment pay"],
      ["微信", "Wēixìn", "WeChat", "微信支付 means WeChat Pay.", "payment pay"],
      ["这个", "zhège", "This one", "Point to the item you mean.", "choose shopping"],
    ],
    phrases: [
      ["这个多少钱？", "Zhège duōshao qián?", "How much is this?", "Point to the item or show a photo.", "price cost shopping"],
      ["可以用支付宝吗？", "Kěyǐ yòng Zhīfùbǎo ma?", "Can I pay with Alipay?", "Ask before paying; payment availability can vary.", "payment"],
      ["不用了，谢谢。", "Bú yòng le, xièxie.", "No, thank you.", "A polite way to decline an offer.", "no thanks refuse"],
    ],
  },
  help: {
    words: [
      ["洗手间", "xǐshǒujiān", "Restroom", "厕所 is another common word for a toilet.", "toilet bathroom wc"],
      ["医院", "yīyuàn", "Hospital", "Use when asking for the location of a hospital."],
      ["药店", "yàodiàn", "Pharmacy", "Useful when looking for a pharmacy.", "chemist drugstore"],
      ["警察", "jǐngchá", "Police", "Use when asking for police assistance."],
      ["手机", "shǒujī", "Mobile phone", "手机没电了 means the phone has run out of battery.", "cellphone cell phone battery"],
    ],
    phrases: [
      ["请问，洗手间在哪儿？", "Qǐngwèn, xǐshǒujiān zài nǎr?", "Excuse me, where is the restroom?", "Useful in stations, shopping centres and restaurants.", "toilet bathroom wc"],
      ["请帮帮我。", "Qǐng bāngbang wǒ.", "Please help me.", "Follow with what you need, or show the relevant information."],
      ["我的护照丢了。", "Wǒ de hùzhào diū le.", "I've lost my passport.", "Use to explain the problem when asking staff or police for help.", "lost missing passport"],
    ],
  },
};

export const travelEntries: TravelEntry[] = travelCategories.flatMap((category) =>
  (["words", "phrases"] as const).flatMap((kind) => content[category.id][kind].map(([hanzi, pinyin, english, note, aliases = ""], index) => ({
    id: `${category.id}-${kind}-${index + 1}`, category: category.id, kind: kind === "words" ? "word" as const : "phrase" as const, hanzi, pinyin, english, note, aliases,
  }))),
);

export function normalizeTravelSearch(value: string) {
  return value.toLowerCase().replace(/ü/g, "v").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function filterTravelEntries(entries: TravelEntry[], query: string, category = "all", saved?: ReadonlySet<string>) {
  const terms = normalizeTravelSearch(query).split(/\s+/).filter(Boolean);
  return entries.filter((entry) => {
    if (category !== "all" && entry.category !== category) return false;
    if (saved && !saved.has(entry.id)) return false;
    const categoryName = travelCategories.find((item) => item.id === entry.category)?.title ?? "";
    const haystack = normalizeTravelSearch(`${entry.hanzi} ${entry.pinyin} ${entry.english} ${entry.aliases} ${categoryName}`);
    return terms.every((term) => haystack.includes(term) || haystack.replace(/\s/g, "").includes(term));
  });
}
