import { createHash } from "node:crypto";
import runtimeIndex from "../content/runtime-content-index.json" with { type: "json" };
import hsk1QuestionBank from "../data/hsk1.json" with { type: "json" };
import hsk2QuestionBank from "../data/hsk2.json" with { type: "json" };
import hsk3QuestionBank from "../data/hsk3.json" with { type: "json" };
import hsk4QuestionBank from "../data/hsk4.json" with { type: "json" };
import hsk5QuestionBank from "../data/hsk5.json" with { type: "json" };
import { LISTENING_LIBRARY_HISTORY_QUESTIONS } from "../learning/listening-library.ts";
import { READING_LIBRARY_QUESTIONS } from "../learning/reading-library.ts";
import practiceAudioManifest from "./audio-assets.json" with { type: "json" };
import practiceV3History from "./practice-v3-history.json" with { type: "json" };

export const PRACTICE_VERSION = "hskkit-practice-authored-v4";
const LEGACY_MULTISKILL_VERSION = "hskkit-practice-multiskill-v2";
export const PRACTICE_SESSION_SIZE = 8;
export const PRACTICE_SKILLS = ["vocabulary", "grammar", "reading", "listening"] as const;
export type PracticeSkill = typeof PRACTICE_SKILLS[number];
export type PracticeAnswerChoice = "a" | "b" | "c" | "d";

export interface PracticeQuestion {
  id: string;
  standardVersion: "HSK 3.0";
  standardRef: "GF0025-2021";
  contentVersion: string;
  setVersion: string;
  level: number;
  levelBand: string;
  sourceLevel?: number;
  sourceGroupId?: string;
  templateId?: string;
  skill: PracticeSkill;
  prompt: string;
  context?: string;
  audioSrc?: string;
  audioText?: string;
  options: Record<PracticeAnswerChoice, string>;
  correctAnswer: PracticeAnswerChoice;
  explanation: string;
  weaknessTag: string;
  sourceRef: string;
  sourceUrl: string;
  authorizationStatus: "authorized" | "unavailable";
  qaStatus: "approved" | "pending" | "rejected";
  publicationStatus: "formal-practice";
  lifecycleStatus: "published" | "withdrawn";
}

type PassageSeed = { text: string; facts: string[]; falseFacts: string[] };
type BandSeed = { grammar: string[]; reading: PassageSeed[]; listening: PassageSeed[] };
const BANDS: Record<number, BandSeed> = {
  1: {
    grammar: ["我是学生。", "她有一本书。", "你叫什么名字？", "我们明天去学校。", "他不喝咖啡。", "桌子上有一杯水。", "请坐在这里。", "妈妈在家做饭。"],
    reading: [
      { text: "小林早上七点起床。他喝牛奶，吃面包，然后八点去学校。", facts: ["小林七点起床。", "他喝牛奶。", "他吃面包。", "他八点去学校。"], falseFacts: ["小林九点起床。", "他只喝咖啡。", "他不吃早饭。", "他八点回家。"] },
      { text: "王老师家有三个人：王老师、她的丈夫和女儿。他们周日一起去公园。", facts: ["王老师家有三个人。", "王老师有一个女儿。", "他们周日去公园。", "一家人一起出门。"], falseFacts: ["王老师家有五个人。", "王老师有两个儿子。", "他们周一去公园。", "王老师一个人出门。"] },
    ],
    listening: [
      { text: "请给我一杯水，谢谢。", facts: ["说话人要一杯水。", "说话人用了请。", "说话人说了谢谢。", "这是一句请求。"], falseFacts: ["说话人要一杯茶。", "说话人在告别。", "说话人没有道谢。", "这是一句自我介绍。"] },
      { text: "我叫李明，今年十八岁，是学生。", facts: ["他叫李明。", "他十八岁。", "他是学生。", "这是一段自我介绍。"], falseFacts: ["他叫王明。", "他八十岁。", "他是老师。", "这是一段天气预报。"] },
    ],
  },
  2: {
    grammar: ["火车比汽车快。", "他正在写作业。", "我已经吃过饭了。", "妹妹越来越高了。", "因为下雨，所以我们没出门。", "她每天骑自行车上班。", "这件衣服又便宜又好看。", "你可以帮我一下吗？"],
    reading: [
      { text: "王明周末想去杭州。火车比汽车快，也更准时。他决定星期六早上坐火车去，星期天下午回来。", facts: ["王明周末去杭州。", "火车比汽车快。", "他星期六早上出发。", "他星期天下午回来。"], falseFacts: ["王明周末去北京。", "汽车比火车快。", "他星期日早上出发。", "他星期六下午回来。"] },
      { text: "刘芳每天走路去公司，大约需要二十分钟。下雨时她坐地铁，因为公交车常常堵车。", facts: ["刘芳平时走路上班。", "走路需要约二十分钟。", "下雨时她坐地铁。", "公交车常常堵车。"], falseFacts: ["刘芳每天开车上班。", "走路需要两个小时。", "下雨时她骑车。", "公交车从不堵车。"] },
    ],
    listening: [
      { text: "老师让我们练习发音，明天上课前要练习三遍。", facts: ["老师要求练习发音。", "练习要在明天上课前完成。", "学生要练习三遍。", "这是老师布置的任务。"], falseFacts: ["老师要求练习写字。", "练习下周完成。", "学生只练习一遍。", "这是餐厅点菜。"] },
      { text: "今天比昨天冷，你出门的时候别忘了带外套。", facts: ["今天比昨天冷。", "说话人提醒带外套。", "提醒发生在出门前。", "内容和天气有关。"], falseFacts: ["今天比昨天热。", "说话人提醒带雨伞。", "提醒发生在回家后。", "内容和考试有关。"] },
    ],
  },
  3: {
    grammar: ["我把作业写完了。", "虽然今天下雨，他还是按时到了。", "只要坚持练习，就会有进步。", "除了中文以外，她还会说法语。", "这本书是朋友送给我的。", "他一边听音乐，一边整理房间。", "老师让我们先检查答案。", "会议结束以后，我们再讨论细节。"],
    reading: [
      { text: "每天早上，林月先复习十个生词，再听十五分钟中文。她把不懂的句子写在本子上，晚上再看一遍。", facts: ["林月早上复习生词。", "她听十五分钟中文。", "她写下不懂的句子。", "她晚上再次复习。"], falseFacts: ["林月早上只看电影。", "她听五个小时中文。", "她把句子全部忘掉。", "她晚上从不复习。"] },
      { text: "陈伟原来每天开车上班。搬家以后，公司离家只有两站地铁，他开始坐地铁，不但省时间，也不用找停车位。", facts: ["陈伟以前开车上班。", "搬家后公司离家两站地铁。", "他现在坐地铁。", "坐地铁省去找停车位。"], falseFacts: ["陈伟以前走路上班。", "公司离家二十站。", "他现在每天骑马。", "坐地铁更难停车。"] },
    ],
    listening: [
      { text: "每天早上，林月先复习十个生词，再听十五分钟中文。她把不懂的句子写在本子上，晚上再看一遍。", facts: ["林月先复习生词。", "她听十五分钟中文。", "她记录不懂的句子。", "她晚上再看一遍。"], falseFacts: ["林月先去跑步。", "她只听一分钟中文。", "她不记录问题。", "她晚上不再学习。"] },
      { text: "会议改到下午三点，地点还是二楼会议室，请大家提前十分钟到。", facts: ["会议在下午三点。", "地点在二楼会议室。", "大家要提前十分钟到。", "会议时间发生了变化。"], falseFacts: ["会议在上午三点。", "地点改到一楼。", "大家可以迟到十分钟。", "会议已经取消。"] },
    ],
  },
  4: {
    grammar: ["无论遇到什么问题，我们都要冷静处理。", "与其等待机会，不如主动准备。", "这项工作不仅需要经验，而且需要耐心。", "即使计划有变化，也不会影响最终目标。", "只有了解原因，才能找到合适的办法。", "他之所以成功，是因为一直坚持记录。", "随着城市的发展，公共交通越来越方便。", "这份报告由三个部分组成。"],
    reading: [
      { text: "社区图书馆把闭馆时间从晚上六点延长到九点。工作人员发现，晚饭后来学习的居民明显增加，尤其是准备考试的年轻人。", facts: ["图书馆现在九点闭馆。", "晚饭后读者增加。", "准备考试的年轻人很多。", "闭馆时间被延长了。"], falseFacts: ["图书馆现在五点闭馆。", "晚饭后没有读者。", "年轻人不来学习。", "闭馆时间被缩短了。"] },
      { text: "小李本来打算周六去爬山，可是天气预报说会有大雨，所以他决定改到下周，并通知了同行的朋友。", facts: ["小李原计划周六爬山。", "天气预报有大雨。", "活动改到下周。", "朋友收到了通知。"], falseFacts: ["小李原计划周一游泳。", "天气预报是晴天。", "活动提前到今天。", "朋友不知道变化。"] },
    ],
    listening: [
      { text: "各位乘客请注意，开往上海的列车晚点二十分钟，新的检票时间是九点十分。", facts: ["列车开往上海。", "列车晚点二十分钟。", "检票时间是九点十分。", "这是一则车站通知。"], falseFacts: ["列车开往北京。", "列车提前二十分钟。", "检票时间是八点。", "这是一则商店广告。"] },
      { text: "我已经把修改后的合同发到你的邮箱，请在今天下班前确认金额和日期。", facts: ["合同已经修改。", "合同通过邮箱发送。", "需要确认金额。", "确认期限是今天下班前。"], falseFacts: ["合同还没有修改。", "合同通过快递发送。", "只需要确认颜色。", "确认期限是下个月。"] },
    ],
  },
  5: {
    grammar: ["既然目标已经确定，就应该集中资源执行。", "尽管数据有所改善，风险仍然不能忽视。", "方案是否可行，取决于成本能否控制。", "一旦发现异常，系统就会自动发出提醒。", "这次调整并非减少服务，而是提高处理效率。", "任何结论都应当建立在可靠证据之上。", "经过反复讨论，双方终于达成了一致。", "与去年相比，今年的需求增长得更稳定。"],
    reading: [
      { text: "这家书店面积不大，却经常举办读书会。附近居民不仅来买书，也把这里当作交流想法的地方。店主因此减少了货架，增加了可以坐下来讨论的空间。", facts: ["书店经常举办读书会。", "居民来这里交流想法。", "店主减少了货架。", "讨论空间增加了。"], falseFacts: ["书店从不举办活动。", "居民只来寄快递。", "店主增加了所有货架。", "讨论空间被取消了。"] },
      { text: "公司试行弹性上班后，员工可以在七点到十点之间到岗。调查显示，迟到明显减少，但跨部门会议需要更早确认时间。", facts: ["员工可在七点到十点到岗。", "迟到现象减少。", "公司试行弹性上班。", "跨部门会议要更早确认。"], falseFacts: ["员工必须凌晨到岗。", "迟到现象增加。", "公司取消了所有制度。", "会议不再需要确认。"] },
    ],
    listening: [
      { text: "调查结果显示，多数用户喜欢新的搜索方式，但希望保留旧版筛选条件作为备用。", facts: ["多数用户喜欢新搜索。", "用户希望保留旧筛选。", "旧筛选被视为备用。", "内容来自调查结果。"], falseFacts: ["所有用户反对新搜索。", "用户要求删除旧筛选。", "旧筛选是唯一入口。", "内容来自天气预报。"] },
      { text: "由于原材料价格上涨，本季度成本增加了百分之八，不过交付时间没有受到影响。", facts: ["原材料价格上涨。", "成本增加百分之八。", "变化发生在本季度。", "交付时间未受影响。"], falseFacts: ["原材料价格下降。", "成本增加百分之八十。", "变化发生在十年前。", "交付已经全部停止。"] },
    ],
  },
  6: {
    grammar: ["面对突发变化，团队需要及时调整原来的方案。", "该措施能否持续，尚有待进一步观察。", "与短期收益相比，长期影响更值得重视。", "他并没有回避争议，反而主动公开了证据。", "相关部门已就此问题展开调查。", "倘若缺乏统一标准，比较结果便失去意义。", "该研究既考虑了效率，也兼顾了公平。", "事实证明，过度简化并不能解决根本问题。"],
    reading: [
      { text: "研究团队比较了三种节能方案。第一种成本最低，但效果不稳定；第二种投入较高，却能长期降低能耗；第三种实施最快，不过适用范围有限。团队最终选择了第二种。", facts: ["研究比较了三种方案。", "第一种成本最低。", "第二种长期降低能耗。", "团队选择了第二种。"], falseFacts: ["研究只比较一种方案。", "第一种成本最高。", "第二种不能节能。", "团队选择了第四种。"] },
      { text: "城市更新并不只是拆旧建新。若忽视原有社区关系，即使居住条件改善，居民也可能失去熟悉的支持网络。因此，规划者开始让居民参与方案讨论。", facts: ["城市更新不只是拆建。", "社区关系会影响居民。", "居民可能失去支持网络。", "规划者让居民参与讨论。"], falseFacts: ["城市更新只需拆建。", "社区关系毫无影响。", "居民一定获得新网络。", "规划者拒绝居民参与。"] },
    ],
    listening: [
      { text: "专家提醒，相关性并不等于因果关系，在获得更多实验数据之前，不应把初步发现写成确定结论。", facts: ["相关性不等于因果。", "还需要更多实验数据。", "目前只是初步发现。", "专家反对过早下结论。"], falseFacts: ["相关性一定代表因果。", "不需要任何数据。", "结论已经完全确定。", "专家鼓励夸大结果。"] },
      { text: "谈判暂时没有达成最终协议，不过双方同意继续交换资料，并在两周后举行下一轮会议。", facts: ["最终协议尚未达成。", "双方继续交换资料。", "下一轮会议在两周后。", "谈判仍会继续。"], falseFacts: ["协议已经签署。", "双方停止交换资料。", "会议在两年后。", "谈判已经永久结束。"] },
    ],
  },
  7: {
    grammar: ["信息传播越迅速，来源核验就越不可或缺。", "倘若评价体系只强调速度，质量难免被边缘化。", "该观点看似矛盾，实则建立在不同时间尺度之上。", "与其将例外视为噪声，不如检验模型是否遗漏关键变量。", "政策成效固然重要，其影响如何分布同样值得追踪。", "唯有公开假设与限制，结论才具备可复核性。", "这一变化并非偶然，而是多重因素共同作用的结果。", "即便短期指标改善，也不意味着结构性问题已经缓解。"],
    reading: [
      { text: "技术提高了信息传播效率，但如果只追求速度而忽视来源核验，错误信息也会以同样的速度扩散。平台因此引入分层审核：普通内容自动检查，高风险内容由人工复核。", facts: ["技术提高传播效率。", "错误信息也可能快速扩散。", "平台采用分层审核。", "高风险内容由人工复核。"], falseFacts: ["技术必然消除错误。", "错误信息无法传播。", "平台取消所有审核。", "高风险内容从不复核。"] },
      { text: "公共政策的成效往往难以用单一指标衡量。短期数据可能改善，却未必意味着长期结构性问题已经缓解。因此，评估既要关注即时结果，也要追踪影响如何分布。", facts: ["政策成效难用单一指标衡量。", "短期改善不代表长期问题解决。", "评估要关注即时结果。", "评估要追踪影响分布。"], falseFacts: ["单一指标足以衡量一切。", "短期改善能证明所有问题解决。", "评估不应关注即时结果。", "影响分布没有价值。"] },
    ],
    listening: [
      { text: "委员会认可试点取得的阶段性进展，但认为样本范围仍然有限，建议扩大观察周期后再决定是否全面推广。", facts: ["试点取得阶段性进展。", "样本范围仍有限。", "建议扩大观察周期。", "全面推广尚未决定。"], falseFacts: ["试点完全失败。", "样本已经覆盖所有人。", "建议停止观察。", "全面推广已经完成。"] },
      { text: "表面上看，两个方案的平均收益相近，然而第二个方案的波动更大，对资源不足的参与者而言风险也更高。", facts: ["两个方案平均收益相近。", "第二个方案波动更大。", "资源不足者风险更高。", "比较不能只看平均收益。"], falseFacts: ["两个方案毫无相似之处。", "第二个方案没有波动。", "资源不足者没有风险。", "只看平均收益就足够。"] },
    ],
  },
};

type RuntimeWord = {
  id: string;
  logicalId: string;
  version: number;
  contentVersion: string;
  level: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
};
const runtimeWords = runtimeIndex.runtimeWords as Record<string, RuntimeWord[]>;
const wordsForLevel = (level: number) => runtimeWords[String(level)] ?? [];
const audioManifest = practiceAudioManifest as {
  assets: Array<{ id: string; authorization: { status: string }; qaStatus: string; lifecycleStatus: string }>;
};
const choices = ["a", "b", "c", "d"] as const;
const bandLabel = (level: number) => level === 7 ? "advanced-7-9" : `level-${level}`;
const versionFor = (level: number, skill: PracticeSkill) => `${LEGACY_MULTISKILL_VERSION}:${bandLabel(level)}:${skill}`;
const rotateOptions = (values: string[], key: string) => {
  const correctIndex = createHash("sha256").update(key).digest()[0] % 4;
  const ordered = values.slice(1, 4);
  ordered.splice(correctIndex, 0, values[0]);
  return { options: { a: ordered[0], b: ordered[1], c: ordered[2], d: ordered[3] }, correctAnswer: choices[correctIndex] };
};
const base = (level: number, skill: PracticeSkill) => ({ standardVersion: "HSK 3.0" as const, standardRef: "GF0025-2021" as const, contentVersion: versionFor(level, skill), setVersion: versionFor(level, skill), level, levelBand: bandLabel(level), sourceLevel: level, skill, authorizationStatus: "authorized" as const, qaStatus: "approved" as const, publicationStatus: "formal-practice" as const, lifecycleStatus: "published" as const });

function vocabularyQuestions(level: number): PracticeQuestion[] {
  const words = [...new Map(wordsForLevel(level).map((word) => [word.hanzi.normalize("NFC"), word])).values()].slice(0, 12);
  if (words.length < 12) return [];
  return words.slice(0, 8).map((word, index) => {
    const distractors = [words[(index + 1) % 12], words[(index + 4) % 12], words[(index + 7) % 12]];
    const arranged = rotateOptions([word.hanzi, ...distractors.map((item) => item.hanzi)], word.id);
    return { ...base(level, "vocabulary"), id: `practice-v2-${bandLabel(level)}-vocabulary-${index + 1}`, prompt: `Which Chinese entry means “${word.meaning}”?`, ...arranged, explanation: `${word.hanzi} (${word.pinyin}) means “${word.meaning}.”`, weaknessTag: `${bandLabel(level)}-vocabulary`, sourceRef: `${runtimeIndex.releaseId}:${word.id}`, sourceUrl: "https://hskkit.com/content-license" };
  });
}

function grammarQuestions(level: number, seed: BandSeed): PracticeQuestion[] {
  return seed.grammar.map((sentence, index) => {
    const pieces = sentence.replace(/[。？！]/g, "").split("");
    const wrong = [pieces.slice().reverse().join("") + "。", pieces.slice(1).join("") + pieces[0] + "。", pieces.filter((_, i) => i % 2 === 0).join("") + pieces.filter((_, i) => i % 2 === 1).join("") + "。"];
    const arranged = rotateOptions([sentence, ...wrong], `${level}:grammar:${index}`);
    return { ...base(level, "grammar"), id: `practice-v2-${bandLabel(level)}-grammar-${index + 1}`, prompt: "Choose the sentence with natural Chinese word order.", ...arranged, explanation: `The natural order is: ${sentence}`, weaknessTag: `${bandLabel(level)}-grammar-order`, sourceRef: `hskkit-batch11-editorial:grammar:${bandLabel(level)}:${index + 1}`, sourceUrl: "https://hskkit.com/content-license" };
  });
}

function comprehensionQuestions(level: number, skill: "reading" | "listening", seeds: PassageSeed[]): PracticeQuestion[] {
  return seeds.flatMap((seed, passageIndex) => seed.facts.map((fact, index) => {
    const audioId = `hsk3.practice.audio.${bandLabel(level)}-${passageIndex + 1}.v1`;
    const audio = skill === "listening" ? audioManifest.assets.find((asset) => asset.id === audioId) : undefined;
    const arranged = rotateOptions([fact, seed.falseFacts[index], seed.falseFacts[(index + 1) % 4], seed.falseFacts[(index + 2) % 4]], `${level}:${skill}:${passageIndex}:${index}`);
    return { ...base(level, skill), id: `practice-v2-${bandLabel(level)}-${skill}-${passageIndex + 1}-${index + 1}`, prompt: skill === "reading" ? "Which statement is supported by the passage?" : "Which statement matches what you hear?", context: skill === "reading" ? seed.text : undefined, audioSrc: skill === "listening" ? `/audio/practice/batch11-${bandLabel(level)}-listening-${passageIndex + 1}.mp3` : undefined, audioText: skill === "listening" ? seed.text : undefined, ...arranged, explanation: `The source says: ${fact}`, weaknessTag: `${bandLabel(level)}-${skill}-detail`, sourceRef: skill === "listening" ? audioId : `hskkit-batch11-reading:${bandLabel(level)}:${passageIndex + 1}`, sourceUrl: "https://hskkit.com/content-license", authorizationStatus: skill !== "listening" || audio?.authorization.status === "authorized" ? "authorized" : "unavailable", qaStatus: skill !== "listening" || audio?.qaStatus === "approved" ? "approved" : audio?.qaStatus === "rejected" ? "rejected" : "pending", lifecycleStatus: skill !== "listening" || audio?.lifecycleStatus === "published" ? "published" : "withdrawn" };
  }));
}

const ALL_V2_QUESTIONS: PracticeQuestion[] = Object.entries(BANDS).flatMap(([rawLevel, seed]) => {
  const level = Number(rawLevel);
  return [
    ...vocabularyQuestions(level),
    ...grammarQuestions(level, seed),
    ...comprehensionQuestions(level, "reading", seed.reading),
    ...comprehensionQuestions(level, "listening", seed.listening),
  ];
});

type AuthoredBankQuestion = {
  id: string;
  level: number;
  type: string;
  question_cn: string;
  question_en?: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string;
};

const AUTHORED_BANKS = new Map<number, AuthoredBankQuestion[]>([
  [1, hsk1QuestionBank as AuthoredBankQuestion[]],
  [2, hsk2QuestionBank as AuthoredBankQuestion[]],
  [3, hsk3QuestionBank as AuthoredBankQuestion[]],
  [4, hsk4QuestionBank as AuthoredBankQuestion[]],
  [5, hsk5QuestionBank as AuthoredBankQuestion[]],
]);

const GRAMMAR_SUPPLEMENTS: Record<number, Array<{ sentence: string; sourceLevel?: number }>> = {
  1: [{ sentence: "他今天没有去学校。" }],
  6: [
    { sentence: "无论证据是否符合预期，研究者都应如实记录。" },
    { sentence: "与其仓促扩大样本，不如先验证测量工具。" },
    { sentence: "哪怕成本有所上升，也不能省略安全检查。" },
    { sentence: "之所以暂缓发布，是因为核心数据仍需复核。" },
    { sentence: "只有在控制其他变量后，才能讨论因果关系。" },
    { sentence: "就现有证据而言，这一解释尚不足以成立。" },
    { sentence: "该方案一方面提高效率，另一方面增加协调成本。" },
    { sentence: "结果未必支持假设，却为后续研究提供了线索。" },
    { sentence: "除非获得明确授权，否则不得公开个人信息。" },
    { sentence: "不仅样本规模有限，观察时间也相对较短。" },
    { sentence: "即便两组均值相同，数据分布也可能明显不同。" },
    { sentence: "与原计划不同，本次调整仅涉及测试环节。" },
    { sentence: "凡是无法追溯来源的数据，都不应进入正式报告。" },
    { sentence: "鉴于风险尚未排除，项目决定延长试运行期。" },
    { sentence: "无论采用哪种方法，都必须说明适用条件。" },
    { sentence: "所谓显著改善，仍需结合基线和误差范围判断。" },
  ],
  7: [
    { sentence: "固然自动化能提高速度，然而关键判断仍需人工复核。", sourceLevel: 8 },
    { sentence: "与其争论单一指标的高低，不如检验指标是否衡量了真正目标。", sourceLevel: 8 },
    { sentence: "若非前提发生变化，模型的预测不应出现如此剧烈的波动。", sourceLevel: 8 },
    { sentence: "诚然局部样本表现良好，但这不足以证明结论可以普遍推广。", sourceLevel: 8 },
    { sentence: "其结论之所以引发争议，恰恰在于因果链条尚未得到验证。", sourceLevel: 8 },
    { sentence: "不论短期收益多么可观，制度成本都不应被排除在评估之外。", sourceLevel: 8 },
    { sentence: "表面上两种方案差异不大，实则风险分布截然不同。", sourceLevel: 8 },
    { sentence: "与其说政策失效，不如说原有评价框架遗漏了关键结果。", sourceLevel: 8 },
    { sentence: "即便所有观察值都准确无误，解释过程仍可能受到选择偏差影响。", sourceLevel: 9 },
    { sentence: "唯有把反例纳入分析，论证才不至于成为自我验证。", sourceLevel: 9 },
    { sentence: "倘若公开标准在执行中不断改变，跨期比较便失去基础。", sourceLevel: 9 },
    { sentence: "该结论既不能由相关性单独推出，也不能靠个别案例证成。", sourceLevel: 9 },
    { sentence: "凡涉及群体差异的判断，均应报告分布而非只给平均值。", sourceLevel: 9 },
    { sentence: "除非后续样本重现同一趋势，否则当前发现只能视为初步证据。", sourceLevel: 9 },
    { sentence: "虽说技术限制可以解释部分误差，却无法解释方向相反的结果。", sourceLevel: 9 },
    { sentence: "从程序正义的角度看，效率提升并不能替代知情与申诉机制。", sourceLevel: 9 },
  ],
};

const normalizeChoices = (options: Record<string, string>) => {
  const values = Object.values(options);
  while (values.length < 4) values.push("None of the above.");
  return { a: values[0], b: values[1], c: values[2], d: values[3] };
};
const answerChoice = (answer: string): PracticeAnswerChoice => {
  const normalized = answer.toLowerCase();
  if (!choices.includes(normalized as PracticeAnswerChoice)) throw new Error(`INVALID_PRACTICE_SOURCE_ANSWER:${answer}`);
  return normalized as PracticeAnswerChoice;
};
const itemDigest = (value: string) => createHash("sha256").update(value).digest("base64url").slice(0, 16);
const v3Base = (level: number, skill: PracticeSkill, contentVersion: string, sourceLevel = level) => ({
  standardVersion: "HSK 3.0" as const,
  standardRef: "GF0025-2021" as const,
  contentVersion,
  setVersion: "",
  level,
  levelBand: bandLabel(level),
  sourceLevel,
  skill,
  authorizationStatus: "authorized" as const,
  qaStatus: "approved" as const,
  publicationStatus: "formal-practice" as const,
  lifecycleStatus: "published" as const,
});

function v3VocabularyQuestions(level: number): PracticeQuestion[] {
  const sources = level === 7
    ? (() => {
      const seen = new Set<string>();
      const advanced: Array<{ word: RuntimeWord; sourceLevel: number }> = [];
      for (const sourceLevel of [7, 8, 9]) {
        let added = 0;
        for (const word of wordsForLevel(sourceLevel)) {
          const key = word.hanzi.normalize("NFC");
          if (seen.has(key)) continue;
          seen.add(key);
          advanced.push({ word, sourceLevel });
          added += 1;
          if (added === 8) break;
        }
      }
      return advanced;
    })()
    : wordsForLevel(level).slice(0, 32).map((word) => ({ word, sourceLevel: level }));
  const unique = [...new Map(sources.map((entry) => [entry.word.hanzi.normalize("NFC"), entry])).values()].slice(0, level === 7 ? 24 : 32);
  if (unique.length < 24) return [];
  return unique.slice(0, 24).map(({ word, sourceLevel }, index) => {
    const distractors = [unique[(index + 5) % unique.length].word, unique[(index + 11) % unique.length].word, unique[(index + 17) % unique.length].word];
    const family = index % 5;
    const values = family === 1 ? [word.meaning, ...distractors.map((item) => item.meaning)] : family === 3 ? [word.pinyin, ...distractors.map((item) => item.pinyin)] : [word.hanzi, ...distractors.map((item) => item.hanzi)];
    const arranged = rotateOptions(values, `v4:${word.logicalId}:${word.contentVersion}:${family}`);
    const prompts = [`Which Chinese entry means “${word.meaning}”?`, `What does “${word.hanzi}” mean?`, `Which Chinese entry is pronounced “${word.pinyin}”?`, `Which pinyin matches “${word.hanzi}”?`, `Which entry matches both “${word.pinyin}” and “${word.meaning}”?`];
    const tags = ["meaning-to-hanzi", "hanzi-to-meaning", "pinyin-to-hanzi", "hanzi-to-pinyin", "combined-recognition"];
    return {
      ...v3Base(level, "vocabulary", `${PRACTICE_VERSION}:word:${word.logicalId}:${word.contentVersion}`, sourceLevel),
      id: `practice-v4-${bandLabel(level)}-vocabulary-${itemDigest(`${sourceLevel}:${word.logicalId}:${family}`)}`,
      prompt: prompts[family],
      ...arranged,
      explanation: `${word.hanzi} (${word.pinyin}) means “${word.meaning}.”`,
      weaknessTag: `${bandLabel(level)}-vocabulary-${tags[family]}`,
      sourceRef: `${runtimeIndex.releaseId}:${word.id}`,
      sourceUrl: "https://hskkit.com/content-license",
    };
  });
}

const GRAMMAR_MARKERS: Record<number, string[]> = {
  1: ["是", "有", "不", "在", "没有", "请", "吗", "上"],
  2: ["比", "正在", "已经", "越来越", "因为", "每天", "又", "可以"],
  3: ["把", "虽然", "只要", "除了", "是", "一边", "让", "以后"],
  4: ["无论", "与其", "不仅", "即使", "只有", "之所以", "随着", "由"],
  5: ["既然", "尽管", "取决于", "一旦", "并非", "应当", "经过", "相比"],
  6: ["无论", "与其", "哪怕", "之所以", "只有", "而言", "一方面", "未必", "除非", "不仅", "即便", "凡是", "鉴于", "所谓"],
  7: ["固然", "与其", "若非", "诚然", "之所以", "不论", "实则", "即便", "唯有", "倘若", "既", "凡", "除非", "虽说", "从"],
};

const GRAMMAR_EXTRA_TARGETS: Record<number, string[]> = {
  1: ["什么", "去"],
  6: ["面对", "有待", "相比", "反而", "就", "倘若", "既", "并不能", "与"],
  7: ["越", "倘若", "实则", "与其", "固然", "唯有", "并非", "即便"],
};

function reviewedGrammarQuestion(level: number, sentence: string, index: number, sourceLevel = level): PracticeQuestion {
  const markers = GRAMMAR_MARKERS[level];
  const candidates = [...(GRAMMAR_EXTRA_TARGETS[level] ?? []), ...markers].sort((left, right) => right.length - left.length);
  const target = candidates.find((marker) => sentence.includes(marker));
  if (!target) throw new Error(`REVIEWED_GRAMMAR_TARGET_MISSING:${level}:${sentence}`);
  const distractors = [...markers.slice(index + 1), ...markers.slice(0, index + 1), ...(GRAMMAR_EXTRA_TARGETS[level] ?? [])].filter((marker) => marker !== target).slice(0, 3);
  const context = sentence.includes(target) ? sentence.replace(target, "____") : `____，${sentence}`;
  const prompts = ["Choose the expression that completes the sentence naturally.", "Which connector best preserves the sentence logic?", "Complete the sentence with the grammatically appropriate form.", "Select the expression that fits this context."];
  const id = `practice-v4-${bandLabel(level)}-grammar-${itemDigest(`${sourceLevel}:${sentence}:${target}`)}`;
  const arranged = rotateOptions([target, ...distractors], id);
  return {
    ...v3Base(level, "grammar", `${PRACTICE_VERSION}:grammar:${itemDigest(sentence)}`, sourceLevel),
    id,
    prompt: prompts[index % prompts.length],
    context,
    ...arranged,
    explanation: `${target} completes the sentence naturally: ${sentence}`,
    weaknessTag: `${bandLabel(level)}-grammar-context-${index % prompts.length + 1}`,
    sourceRef: `hskkit-reviewed-grammar-v4:${bandLabel(level)}:${index + 1}`,
    sourceUrl: "https://hskkit.com/content-license",
  };
}

function v3GrammarQuestions(level: number): PracticeQuestion[] {
  const authored = (AUTHORED_BANKS.get(level) ?? []).filter((question) => question.type === "grammar").map((question) => {
    const options = normalizeChoices(question.options);
    const sourceDigest = itemDigest(JSON.stringify({
      prompt: question.question_en?.trim() || "Choose the grammatically correct answer.",
      context: question.question_cn,
      options,
      correctAnswer: question.correct_answer.toLowerCase(),
      explanation: question.explanation,
    }));
    return {
      ...v3Base(level, "grammar", `${PRACTICE_VERSION}:authored:${question.id}:${sourceDigest}`),
      id: `practice-v4-${bandLabel(level)}-grammar-${question.id}`,
      prompt: question.question_en?.trim() || "Choose the grammatically correct answer.",
      context: question.question_cn,
      options,
      correctAnswer: answerChoice(question.correct_answer),
      explanation: question.explanation,
      weaknessTag: `${bandLabel(level)}-grammar`,
      sourceRef: `hskkit-authored-question-bank:${question.id}`,
      sourceUrl: "https://hskkit.com/content-license",
    };
  });
  const editorial = [
    ...BANDS[level].grammar.map((sentence) => ({ sentence, sourceLevel: level })),
    ...(GRAMMAR_SUPPLEMENTS[level] ?? []).map((entry) => ({ sentence: entry.sentence, sourceLevel: entry.sourceLevel ?? level })),
  ].map((entry, index) => reviewedGrammarQuestion(level, entry.sentence, index, entry.sourceLevel));
  return [...authored, ...editorial].slice(0, Math.max(24, authored.length + editorial.length));
}

function v3ReadingQuestions(level: number): PracticeQuestion[] {
  const sources = READING_LIBRARY_QUESTIONS.filter((question) => level === 7 ? question.level >= 7 : question.level === level);
  return sources.map((question) => ({
    ...v3Base(level, "reading", question.contentVersion, question.level),
    id: `practice-v4-${bandLabel(level)}-reading-${question.id}`,
    sourceGroupId: question.passageId,
    prompt: question.exercise.prompt,
    context: question.passage,
    options: normalizeChoices(question.exercise.options ?? {}),
    correctAnswer: answerChoice(question.exercise.correctAnswer),
    explanation: question.exercise.explanation,
    weaknessTag: `${bandLabel(level)}-reading-${question.questionType}`,
    sourceRef: question.sourceRef,
    sourceUrl: "https://hskkit.com/content-license",
  }));
}

function v3ListeningQuestions(level: number): PracticeQuestion[] {
  const sources = LISTENING_LIBRARY_HISTORY_QUESTIONS.filter((question) => level === 7 ? question.level >= 7 : question.level === level);
  return sources.map((question) => ({
    ...v3Base(level, "listening", question.contentVersion, question.level),
    id: `practice-v4-${bandLabel(level)}-listening-${question.id}`,
    sourceGroupId: question.audioSrc,
    prompt: question.exercise.prompt,
    audioSrc: question.audioSrc,
    audioText: question.voiceText,
    options: normalizeChoices(question.exercise.options ?? {}),
    correctAnswer: answerChoice(question.exercise.correctAnswer),
    explanation: question.exercise.explanation,
    weaknessTag: question.weaknessTag,
    sourceRef: question.sourceRef,
    sourceUrl: "https://hskkit.com/content-license",
    lifecycleStatus: question.lifecycleStatus,
  }));
}

function attachSetVersion(questions: PracticeQuestion[]) {
  const bySet = new Map<string, PracticeQuestion[]>();
  for (const question of questions) {
    const key = `${question.level}:${question.skill}`;
    bySet.set(key, [...(bySet.get(key) ?? []), question]);
  }
  return [...bySet.values()].flatMap((set) => {
    const digest = createHash("sha256").update(JSON.stringify(set.map((question) => [question.id, question.contentVersion]))).digest("base64url").slice(0, 20);
    const setVersion = `${PRACTICE_VERSION}:${bandLabel(set[0].level)}:${set[0].skill}:${digest}`;
    return set.map((question) => ({ ...question, setVersion }));
  });
}

const PRE_TEMPLATE_DIVERSITY_QUESTIONS = attachSetVersion([1, 2, 3, 4, 5, 6, 7].flatMap((level) => [
  ...v3VocabularyQuestions(level),
  ...v3GrammarQuestions(level),
  ...v3ReadingQuestions(level),
  ...v3ListeningQuestions(level),
]));

const PROMPT_VARIANTS: Record<string, string[]> = {
  "他们什么时候回家？": ["他们什么时候回家？", "文中说他们几点回家？", "他们回家的时间是什么时候？", "根据材料，他们何时回家？"],
  "What information is mentioned first in the recording?": ["What information is mentioned first in the recording?", "Which detail does the recording give first?", "What is the first point you hear?", "Which item is introduced at the start of the recording?"],
  "这样安排有什么作用？": ["这样安排有什么作用？", "这个安排带来了什么效果？", "为什么要作出这样的安排？", "材料说明这一安排有何作用？"],
  "Which title best matches the recording?": ["Which title best matches the recording?", "Choose the most suitable title for the recording.", "Which heading best summarizes what you hear?", "What would be the best title for this recording?"],
  "使用延长时段需要什么？": ["使用延长时段需要什么？", "进入延长时段要满足什么条件？", "材料要求使用者提供什么？", "怎样才能使用延长开放时段？"],
  "这次调整的主要目的是什么？": ["这次调整的主要目的是什么？", "为什么要作出这次调整？", "这项调整主要想解决什么问题？", "材料说明调整的核心目的是什么？"],
  "新制度提供了什么变化？": ["新制度提供了什么变化？", "新制度带来了哪项改变？", "与原来相比，新制度有什么不同？", "材料提到制度发生了什么变化？"],
  "为什么仍然保留限制条件？": ["为什么仍然保留限制条件？", "保留限制条件的原因是什么？", "材料为何没有取消这项限制？", "继续设置限制主要是出于什么考虑？"],
  "调查结果说明了什么？": ["调查结果说明了什么？", "从调查结果可以看出什么？", "这项调查支持哪一判断？", "材料中的调查数据表明什么？"],
  "支持者的主要理由是什么？": ["支持者的主要理由是什么？", "支持者最看重哪一点？", "哪项内容概括了支持方的理由？", "支持这一方案的人提出了什么依据？"],
  "反对者担心什么？": ["反对者担心什么？", "反对方主要提出了哪项顾虑？", "哪一问题令反对者担忧？", "材料中的反对意见集中在哪方面？"],
  "委员会为什么暂不作最终决定？": ["委员会为什么暂不作最终决定？", "委员会推迟决定的原因是什么？", "为什么还不能作出最终决定？", "材料说明委员会还要等待什么？"],
};

function diversifyPromptTemplates(questions: PracticeQuestion[]) {
  const occurrences = new Map<string, number>();
  return questions.map((question) => {
    const variants = PROMPT_VARIANTS[question.prompt];
    if (!variants) return question;
    const key = `${question.level}:${question.skill}:${question.prompt}`;
    const occurrence = occurrences.get(key) ?? 0;
    occurrences.set(key, occurrence + 1);
    const variantIndex = occurrence % variants.length;
    if (variantIndex === 0) return question;
    return {
      ...question,
      id: `${question.id}-prompt-v2-${variantIndex + 1}`,
      contentVersion: `${question.contentVersion}:prompt-v2-${variantIndex + 1}`,
      prompt: variants[variantIndex],
    };
  });
}

const ALL_V3_QUESTIONS = attachSetVersion(diversifyPromptTemplates(PRE_TEMPLATE_DIVERSITY_QUESTIONS));

export const PRACTICE_QUESTIONS: PracticeQuestion[] = ALL_V3_QUESTIONS.filter((question) => question.authorizationStatus === "authorized" && question.qaStatus === "approved" && question.lifecycleStatus === "published");

const normalizedIdentityText = (value: string | undefined) => (value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
export function practiceReviewIdentity(question: PracticeQuestion) {
  const sourceGroupId = question.sourceGroupId ?? question.sourceRef.replace(/(?:[:._-])v\d+(?=[:._-]|$)/gi, "");
  const promptTemplate = normalizedIdentityText(question.prompt).replace(/[“\"].*?[”\"]/g, "{value}");
  const templateId = question.templateId ?? `${question.skill}:${promptTemplate}`;
  const semantic = JSON.stringify([
    question.level,
    question.skill,
    normalizedIdentityText(question.context ?? question.audioText),
    normalizedIdentityText(question.weaknessTag),
    normalizedIdentityText(question.options[question.correctAnswer]),
  ]);
  return {
    sourceGroupId,
    templateId,
    canonicalContentKey: `practice:${createHash("sha256").update(semantic).digest("base64url").slice(0, 24)}`,
  };
}

const LEGACY_PRACTICE_VERSION = "hskkit-practice-l1-vocabulary-v1";
export function practiceSetContentVersion(releaseId: string, sources: Array<{ logicalId: string; version: string | number }>) {
  const digest = createHash("sha256").update(JSON.stringify(sources.map((source) => [source.logicalId, String(source.version)]))).digest("base64url").slice(0, 24);
  return `${releaseId}:practice-set-${digest}`;
}
const legacyBase = (level: number, contentVersion: string) => ({ ...base(level, "vocabulary" as const), contentVersion, setVersion: contentVersion, levelBand: `level-${level}` });
const LEGACY_LEVEL_ONE: PracticeQuestion[] = [
  { ...legacyBase(1, LEGACY_PRACTICE_VERSION), id: "practice-v1-l1-vocab-hello", prompt: "Which Chinese expression means “hello”?", options: { a: "你好", b: "谢谢", c: "再见", d: "对不起" }, correctAnswer: "a", explanation: "你好 is the standard greeting for “hello.”", weaknessTag: "basic-greetings", sourceRef: "hskkit-practice-v1:hello", sourceUrl: "https://hskkit.com/content-license" },
  { ...legacyBase(1, LEGACY_PRACTICE_VERSION), id: "practice-v1-l1-vocab-thanks", prompt: "Which expression means “thank you”?", options: { a: "谢谢", b: "你好", c: "再见", d: "没关系" }, correctAnswer: "a", explanation: "谢谢 is used to express thanks.", weaknessTag: "basic-greetings", sourceRef: "hskkit-practice-v1:thanks", sourceUrl: "https://hskkit.com/content-license" },
  { ...legacyBase(1, LEGACY_PRACTICE_VERSION), id: "practice-v1-l1-vocab-goodbye", prompt: "Which expression means “goodbye”?", options: { a: "再见", b: "请", c: "是", d: "有" }, correctAnswer: "a", explanation: "再见 literally means “see you again” and is used for “goodbye.”", weaknessTag: "basic-greetings", sourceRef: "hskkit-practice-v1:goodbye", sourceUrl: "https://hskkit.com/content-license" },
];
function legacyCatalogQuestions(level: number): PracticeQuestion[] {
  const words = wordsForLevel(level).slice(0, 4);
  if (words.length < 4) return [];
  const contentVersion = practiceSetContentVersion(runtimeIndex.releaseId, words.map((word) => ({ logicalId: word.logicalId, version: word.contentVersion })));
  const values = words.map((word) => word.hanzi) as [string, string, string, string];
  return words.slice(0, 3).map((word, index) => {
    const correctIndex = createHash("sha256").update(`hskkit-practice-option-order:${runtimeIndex.releaseId}:${word.logicalId}:${word.contentVersion}`).digest()[0] % 4;
    const ordered = values.filter((_, optionIndex) => optionIndex !== index); ordered.splice(correctIndex, 0, values[index]);
    return { ...legacyBase(level, contentVersion), id: `practice-catalog-l${level}-${word.logicalId}`, prompt: `Which Chinese entry means “${word.meaning}”?`, options: { a: ordered[0], b: ordered[1], c: ordered[2], d: ordered[3] }, correctAnswer: choices[correctIndex], explanation: `${word.hanzi} means “${word.meaning}.”`, weaknessTag: `hsk3-level-${level}-vocabulary`, sourceRef: `${runtimeIndex.releaseId}:${word.id}`, sourceUrl: "https://hskkit.com/content-license" };
  });
}
const LEGACY_PRACTICE_QUESTIONS = [...LEGACY_LEVEL_ONE, ...[2, 3, 4, 5, 6].flatMap(legacyCatalogQuestions)];

export const WITHDRAWN_PRACTICE_QUESTION_ID = "practice-v1-l1-vocab-retired-sample";
const WITHDRAWN_SNAPSHOT: PracticeQuestion = { ...base(1, "vocabulary"), id: WITHDRAWN_PRACTICE_QUESTION_ID, contentVersion: "hskkit-practice-l1-vocabulary-v1", setVersion: "hskkit-practice-l1-vocabulary-v1", prompt: "Retired sample", options: { a: "甲", b: "乙", c: "丙", d: "丁" }, correctAnswer: "a", explanation: "Retained only for historical audit.", weaknessTag: "retired", sourceRef: "hskkit-retired-sample", sourceUrl: "https://hskkit.com/content-license", lifecycleStatus: "withdrawn" };
const HISTORY = [...ALL_V3_QUESTIONS, ...PRE_TEMPLATE_DIVERSITY_QUESTIONS, ...(practiceV3History as PracticeQuestion[]), ...ALL_V2_QUESTIONS, ...LEGACY_PRACTICE_QUESTIONS, WITHDRAWN_SNAPSHOT];

export function practiceQuestionLifecycle(id: string) { return HISTORY.find((question) => question.id === id)?.lifecycleStatus; }
export function practiceQuestionSet(level: number, skill: string) { return PRACTICE_QUESTIONS.filter((question) => question.level === level && question.skill === skill && question.lifecycleStatus === "published"); }
export function trustedPracticeQuestion(id: string) { return HISTORY.find((question) => question.id === id); }
export function trustedPracticeQuestionVersion(id: string, version: string) { return HISTORY.find((question) => question.id === id && (question.setVersion === version || question.contentVersion === version)); }
export function publicPracticeQuestion(question: PracticeQuestion) {
  return { id: question.id, standardVersion: question.standardVersion, standardRef: question.standardRef, contentVersion: question.contentVersion, level: question.level, levelBand: question.levelBand, skill: question.skill, prompt: question.prompt, context: question.context, audioSrc: question.audioSrc, options: question.options };
}
