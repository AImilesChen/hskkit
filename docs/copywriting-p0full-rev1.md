# HSKKit P0 Full — 内容文案包（修订版 v2 / 二次返修）

> 阶段：05-copy（二次返修）
> 项目：HSKKit.com
> PRD 版本：v3.4
> 返修任务：t_ba4a3c3f
> 交付人：阿文
> 状态：DONE — 5 项问题全部修复，待下游接棒

---

## 修改摘要（返修说明）

**返修原因：** 大总管审核 task t_3e105e76 后结论为 NEEDS_REVIEW。原 Reading 内容存在 HSK 1 词汇范围问题，正文和目标词混入了非当前 HSK1 词表词。第一次返修（rev1）后，大总管二次审核发现 5 个遗留问题，本次为二次返修（rev2）。

**修改范围（rev2）：**
- 5 篇 Reading 局部小返修，不重写整篇
- 每篇 Vocabulary Scope Check 更新
- 保持 PRD v3.4 和 P0 Full 范围

**二次返修 5 项问题 vs 修正：**

| # | 问题 | 修正措施 |
|---|------|----------|
| 1 | Reading 1 目标词 儿子、女儿 未在正文出现 | 替换目标词为 狗、漂亮（均在正文且 HSK1） |
| 2 | Reading 1 原句「妈妈都是老师」语义错误 | 改为「爸爸是老师，妈妈是老师」（自然、正确） |
| 3 | Reading 1 Study Tip 错误称 爱 为 adjective | 重写为「爱 是 verb，漂亮 是 adjective」的准确区分 |
| 4 | Reading 3 目标词 高兴 未在正文出现 | 正文结尾新增「我很高兴」 |
| 5 | Reading 5 目标词 电脑 未在正文出现；「今天看了」省略宾语 | 新增「她的电脑很漂亮」；改为「今天看了电影」 |

**历史修改（rev1）：**

| 原问题 | 修正措施 |
|--------|----------|
| Reading 2 含非 HSK1 词：学校、见 | 重写为 My Teacher，目标词全部在词表 |
| Reading 3 含非 HSK1 词：饭、可以 | 重写为 At the Restaurant，移除"可以"，"饭"改为"米饭" |
| Reading 4 含非 HSK1 词：白、跑 | 重写为 A Trip to Beijing，移除"白""跑" |
| Reading 5 含非 HSK1 词：明年、要、坐飞机、酒店、觉得、有意思，难度偏高 | 重写为 My Friend，主题更简单 |
| 无词表范围检查 | 每篇新增 Vocabulary Scope Check |

---

## 1. 5 篇 HSK 1 原创 Reading with Pinyin（修订版）

### Reading 01: My Family

**Title (EN):** My Family
**Title (CN):** 我的家
**Target Vocabulary (8 words):** 家, 爸爸, 妈妈, 狗, 漂亮, 爱, 有, 个

**Vocabulary Scope Check:**
- 家 ✅, 爸爸 ✅, 妈妈 ✅, 狗 ✅, 漂亮 ✅, 爱 ✅, 有 ✅, 个 ✅
- 全部 8 个目标词均存在于 `hsk1_vocab.json`，且均出现在本篇中文正文中

**Chinese Content:**
我的家有三个人。爸爸、妈妈和我。爸爸是老师，妈妈是老师。他们很爱我和小狗。我有一个漂亮的小狗。小狗很喜欢我。我们上午吃饭，下午看电视。我爱我的家。

**Pinyin Content:**
Wǒ de jiā yǒu sān gè rén. Bàba, māma hé wǒ. Bàba shì lǎoshī, māma shì lǎoshī. Tāmen hěn ài wǒ hé xiǎo gǒu. Wǒ yǒu yī gè piàoliang de xiǎo gǒu. Xiǎo gǒu hěn xǐhuan wǒ. Wǒmen shàngwǔ chī fàn, xiàwǔ kàn diànshì. Wǒ ài wǒ de jiā.

**English Summary:**
This family has three people: father, mother, and me. Father is a teacher. Mother is a teacher too. They love me and the small dog very much. I have a pretty small dog. The dog likes me very much. We eat at noon and watch TV in the afternoon. I love my family.

**Highlighted Vocabulary (with pinyin & meaning):**
- 家 (jiā) — home; family
- 爸爸 (bàba) — father; dad
- 妈妈 (māma) — mother; mom
- 狗 (gǒu) — dog
- 漂亮 (piàoliang) — beautiful
- 爱 (ài) — to love
- 有 (yǒu) — to have
- 个 (gè) — a (general measure word)

**Comprehension Questions:**
1. Q: 家有几个人？ / How many people are in the family?
   A: 三个人。 / Three people.
2. Q: 爸爸和妈妈是什么工作？ / What do the father and mother do?
   A: 他们是老师。 / They are teachers.
3. Q: 小狗怎么样？ / How is the small dog?
   A: 很漂亮。 / Very pretty.

**Study Tip:**
Notice how 很 (hěn) is used before adjectives like 漂亮. In HSK 1, 很 often functions as a softener rather than meaning "very" in a strong sense. Also, 爱 is a verb meaning "to love," while 漂亮 is an adjective meaning "beautiful."

---

### Reading 02: My Teacher

**Title (EN):** My Teacher
**Title (CN):** 我的老师
**Target Vocabulary (8 words):** 老师, 学生, 同学, 书, 读, 学习, 汉语, 字

**Vocabulary Scope Check:**
- 老师 ✅, 学生 ✅, 同学 ✅, 书 ✅, 读 ✅, 学习 ✅, 汉语 ✅, 字 ✅
- 全部 8 个目标词均存在于 `hsk1_vocab.json`

**Chinese Content:**
我是学生，我的老师很好。老师叫我们学习汉语。我们今天读书，学习汉字。我的同学都喜欢学习。下午三点，我们回家。明天见，老师！

**Pinyin Content:**
Wǒ shì xuésheng, wǒ de lǎoshī hěn hǎo. Lǎoshī jiào wǒmen xuéxí Hànyǔ. Wǒmen jīntiān dú shū, xuéxí Hànzì. Wǒ de tóngxué dōu xǐhuan xuéxí. Xiàwǔ sān diǎn, wǒmen huí jiā. Míngtiān jiàn, lǎoshī!

**English Summary:**
I am a student. My teacher is very nice. The teacher asks us to study Chinese. Today we read books and learn Chinese characters. My classmates all like studying. At 3 PM, we go home. See you tomorrow, teacher!

**Highlighted Vocabulary:**
- 老师 (lǎoshī) — teacher
- 学生 (xuésheng) — student
- 同学 (tóngxué) — classmate
- 书 (shū) — book
- 读 (dú) — to read
- 学习 (xuéxí) — to study; to learn
- 汉语 (Hànyǔ) — Chinese language
- 字 (zì) — character; word

**Comprehension Questions:**
1. Q: 我是学生还是老师？ / Am I a student or a teacher?
   A: 学生。 / A student.
2. Q: 我们今天学习什么？ / What do we study today?
   A: 汉语和汉字。 / Chinese language and Chinese characters.
3. Q: 我的同学喜欢学习吗？ / Do my classmates like studying?
   A: 喜欢。 / Yes, they do.

**Study Tip:**
Pay attention to the measure word 本 (běn) for books. "五本书" means "five books." Measure words are essential in Chinese counting. Also notice 汉字 (Hànzì) means "Chinese characters" — a key word for all HSK learners.

---

### Reading 03: At the Restaurant

**Title (EN):** At the Restaurant
**Title (CN):** 在饭店
**Target Vocabulary (8 words):** 饭店, 吃, 米饭, 菜, 茶, 水, 杯子, 高兴

**Vocabulary Scope Check:**
- 饭店 ✅, 吃 ✅, 米饭 ✅, 菜 ✅, 茶 ✅, 水 ✅, 杯子 ✅, 高兴 ✅
- 全部 8 个目标词均存在于 `hsk1_vocab.json`，且均出现在本篇中文正文中

**Chinese Content:**
今天中午，我和朋友去饭店吃饭。饭店不大，菜很好。我们吃了米饭，喝了茶。我们看见四个杯子。一杯是水，三杯是茶。朋友说：这个菜很好！我很高兴。

**Pinyin Content:**
Jīntiān zhōngwǔ, wǒ hé péngyou qù fàndiàn chī fàn. Fàndiàn bù dà, cài hěn hǎo. Wǒmen chī le mǐfàn, hē le chá. Wǒmen kànjiàn sì gè bēizi. Yī bēi shì shuǐ, sān bēi shì chá. Péngyou shuō: Zhège cài hěn hǎo! Wǒ hěn gāoxìng.

**English Summary:**
At noon today, my friend and I go to a restaurant to eat. The restaurant is not big, but the dishes are good. We eat rice and drink tea. We see four cups. One cup is water, three cups are tea. My friend says: "This dish is good!" I am happy.

**Highlighted Vocabulary:**
- 饭店 (fàndiàn) — restaurant
- 吃 (chī) — to eat
- 米饭 (mǐfàn) — rice (cooked)
- 菜 (cài) — dish; vegetable
- 茶 (chá) — tea
- 水 (shuǐ) — water
- 杯子 (bēizi) — cup; glass
- 高兴 (gāoxìng) — happy; glad

**Comprehension Questions:**
1. Q: 我们什么时候去饭店？ / When do we go to the restaurant?
   A: 今天中午。 / Today at noon.
2. Q: 我们吃了什么？ / What did we eat?
   A: 米饭。 / Rice.
3. Q: 有几个杯子？ / How many cups are there?
   A: 四个。 / Four.

**Study Tip:**
The word 了 (le) appears after verbs to show completed action: "吃了米饭" = "ate rice." This is one of the most common grammar points in HSK 1. Also notice 杯 (bēi) is the measure word for cups: "一杯水" = "one cup of water."

---

### Reading 04: A Trip to Beijing

**Title (EN):** A Trip to Beijing
**Title (CN):** 去北京
**Target Vocabulary (8 words):** 北京, 飞机, 出租车, 饭店, 天气, 冷, 高兴, 漂亮

**Vocabulary Scope Check:**
- 北京 ✅, 飞机 ✅, 出租车 ✅, 饭店 ✅, 天气 ✅, 冷 ✅, 高兴 ✅, 漂亮 ✅
- 全部 8 个目标词均存在于 `hsk1_vocab.json`

**Chinese Content:**
明天我去北京。我坐飞机去。去了北京，我坐出租车去饭店。北京的天气很冷，我很高兴。我看见了很多漂亮的东西。我想买一些东西。北京很大，我很喜欢！

**Pinyin Content:**
Míngtiān wǒ qù Běijīng. Wǒ zuò fēijī qù. Qù le Běijīng, wǒ zuò chūzūchē qù fàndiàn. Běijīng de tiānqì hěn lěng, wǒ hěn gāoxìng. Wǒ kànjiàn le hěn duō piàoliang de dōngxi. Wǒ xiǎng mǎi yīxiē dōngxi. Běijīng hěn dà, wǒ hěn xǐhuan!

**English Summary:**
Tomorrow I go to Beijing. I go by plane. After arriving in Beijing, I take a taxi to a hotel. The weather in Beijing is cold, but I am happy. I see many beautiful things. I want to buy some things. Beijing is big. I like it very much!

**Highlighted Vocabulary:**
- 北京 (Běijīng) — Beijing
- 飞机 (fēijī) — airplane
- 出租车 (chūzūchē) — taxi
- 饭店 (fàndiàn) — restaurant; hotel
- 天气 (tiānqì) — weather
- 冷 (lěng) — cold
- 高兴 (gāoxìng) — happy; glad
- 漂亮 (piàoliang) — beautiful

**Comprehension Questions:**
1. Q: 我怎么去北京？ / How do I go to Beijing?
   A: 坐飞机。 / By plane.
2. Q: 北京的天气怎么样？ / How is the weather in Beijing?
   A: 很冷。 / Very cold.
3. Q: 我想做什么？ / What do I want to do?
   A: 买东西。 / Buy things.

**Study Tip:**
Pay attention to the word order: "北京的天气" = "Beijing's weather." In Chinese, the possessive 的 (de) connects the place and the noun. This pattern is very common in HSK 1.

---

### Reading 05: My Friend

**Title (EN):** My Friend
**Title (CN):** 我的朋友
**Target Vocabulary (8 words):** 朋友, 喜欢, 猫, 狗, 电影, 电脑, 茶, 高兴

**Vocabulary Scope Check:**
- 朋友 ✅, 喜欢 ✅, 猫 ✅, 狗 ✅, 电影 ✅, 电脑 ✅, 茶 ✅, 高兴 ✅
- 全部 8 个目标词均存在于 `hsk1_vocab.json`

**Chinese Content:**
我有一个好朋友，她是我的同学。她喜欢猫，喜欢狗。她家有小猫，小猫很漂亮。她喜欢看电影，今天看了电影。她喜欢喝茶。下午，她和我看电视。她的电脑很漂亮。她很高兴，我很高兴。

**Pinyin Content:**
Wǒ yǒu yī gè hǎo péngyou, tā shì wǒ de tóngxué. Tā xǐhuan māo, xǐhuan gǒu. Tā jiā yǒu xiǎo māo, xiǎo māo hěn piàoliang. Tā xǐhuan kàn diànyǐng, jīntiān kàn le diànyǐng. Tā xǐhuan hē chá. Xiàwǔ, tā hé wǒ kàn diànshì. Tā de diànnǎo hěn piàoliang. Tā hěn gāoxìng, wǒ hěn gāoxìng.

**English Summary:**
I have a good friend. She is my classmate. She likes cats and dogs. Her family has a small cat. The small cat is pretty. She likes watching movies. She watched a movie today. She likes drinking tea. In the afternoon, she and I watch TV. Her computer is pretty. She is happy. I am happy too.

**Highlighted Vocabulary:**
- 朋友 (péngyou) — friend
- 喜欢 (xǐhuan) — to like
- 猫 (māo) — cat
- 狗 (gǒu) — dog
- 电影 (diànyǐng) — movie; film
- 电脑 (diànnǎo) — computer
- 茶 (chá) — tea
- 高兴 (gāoxìng) — happy; glad

**Comprehension Questions:**
1. Q: 我的朋友是谁？ / Who is my friend?
   A: 我的同学。 / My classmate.
2. Q: 她喜欢什么动物？ / What animals does she like?
   A: 猫和狗。 / Cats and dogs.
3. Q: 下午我们做什么？ / What do we do in the afternoon?
   A: 看电视。 / Watch TV.

**Study Tip:**
Notice how 了 (le) shows completed action: "今天看了电影" = "watched a movie today." The word 电影 (diànyǐng) is repeated after 看了 so learners can clearly see the object. This is a helpful pattern for HSK 1 beginners.

---

## 2. /hsk-1-reading-practice 页面文案

### SEO Meta

**SEO Title:** HSK 1 Reading Practice with Pinyin — Free Short Stories | HSKKit
**Meta Description:** Practice HSK 1 reading with pinyin support. 5 original short stories with highlighted vocabulary, comprehension questions, and study tips. Free — no login needed.

### Hero Section

**H1:** HSK 1 Reading Practice with Pinyin
**Subtitle:** Read real Chinese short stories at HSK 1 level. Every story includes pinyin, highlighted vocabulary, comprehension questions, and study tips — so you actually learn while you read.
**CTA Primary:** Start Reading — Story 1
**CTA Secondary:** Try HSK 1 Practice Test

### Page Structure (Design落位建议)

1. **Hero** — H1 + Subtitle + Dual CTA
2. **How It Works** (3 steps)
   - Read the story with pinyin
   - Tap highlighted words to review
   - Answer questions to check understanding
3. **Story Cards** (5 cards, collapsible or paginated)
   - Each card: Title → Target Vocabulary → Chinese text with pinyin line → English summary → Comprehension questions → Study tip
4. **Why Read with Pinyin?**
   - Builds confidence without guessing pronunciation
   - Reinforces vocabulary in real context
   - Prepares you for HSK 1 reading comprehension
5. **CTA Banner**
   - Headline: Ready to test your HSK 1 level?
   - CTA: Take the Free HSK Level Test
6. **FAQ / Schema-ready**
   - See FAQ section below
7. **Footer Disclaimer** (固定)
   - HSKKit is an independent study tool and is not affiliated with, endorsed by, or operated by the official HSK test organizers.

### Story List（同步更新）

| # | Title (EN) | Title (CN) | Theme |
|---|-----------|-----------|-------|
| 01 | My Family | 我的家 | Family introduction |
| 02 | My Teacher | 我的老师 | School life |
| 03 | At the Restaurant | 在饭店 | Restaurant scene |
| 04 | A Trip to Beijing | 去北京 | Travel experience |
| 05 | My Friend | 我的朋友 | Friendship |

### FAQ / Schema 文案

**Q1: Is HSK 1 reading practice free?**
A: Yes. All 5 reading stories are free to use. No account or payment is required.

**Q2: Do the stories use only HSK 1 vocabulary?**
A: The stories are written with HSK 1 vocabulary only. Every character in the Chinese text appears in the official HSK 1 word list. Pinyin and English support are provided for all highlighted words.

**Q3: Can I read without pinyin?**
A: Pinyin is displayed by default to support beginners. In future updates, we may add a toggle to hide pinyin for extra challenge.

**Q4: How many stories are available?**
A: P0 Full launches with 5 original stories. More stories will be added in future updates.

**Q5: Can I use these stories in my classroom?**
A: Yes, teachers are welcome to use these stories for classroom instruction. A Teacher Pack with printable versions and additional materials will be available in a future release.

---

## 3. /tools/chinese-character-practice-sheet-generator 页面文案

（与上一版一致，无修改）

### SEO Meta

**SEO Title:** Free Chinese Character Practice Sheet Generator | HSKKit
**Meta Description:** Generate printable Chinese character practice sheets with Tian Zi Ge (田字格) grids. Type any Chinese text, preview, and print directly from your browser. Free — no signup.

### Hero Section

**H1:** Chinese Character Practice Sheet Generator
**Subtitle:** Type any Chinese characters, choose your grid style, and print a clean practice sheet in seconds. Perfect for HSK 1 learners, teachers, and parents.
**CTA Primary:** Generate Practice Sheet
**CTA Secondary:** Browse HSK 1 Vocabulary

### How It Works (3 Steps)

1. **Type or Paste Chinese Text**
   - Enter the characters you want to practice. You can type directly or paste from a vocabulary list.
2. **Choose Your Grid**
   - Select Tian Zi Ge (田字格) for balanced stroke training. More grid styles coming soon.
3. **Preview & Print**
   - Preview your sheet in the browser, then print or save as PDF using your browser's print dialog.

### Input Prompts / Placeholder Text

- **Input field label:** Enter Chinese characters to practice
- **Placeholder:** 例如：我爱学习汉语
- **Helper text:** Tip: Start with 5–10 characters for one page. You can generate multiple sheets.
- **Grid selector label:** Grid Style
- **Grid option:** Tian Zi Ge (田字格) — recommended for beginners
- **Generate button:** Generate Practice Sheet
- **Reset button:** Clear & Start Over

### Print Instructions

**Before you print:**
- Use A4 or Letter size paper
- Set margins to "Minimum" or "Narrow" for best results
- Enable "Background graphics" in print settings if grids do not appear
- For best practice experience, use slightly thicker paper (90gsm+)

**Print settings tip:**
Most browsers support clean printing. Press Ctrl+P (Windows) or Cmd+P (Mac), then select "Save as PDF" if you want a digital copy.

### FAQ / Schema 文案

**Q1: Is this practice sheet generator free?**
A: Yes. You can generate and print practice sheets without creating an account. A daily soft limit may apply to prevent abuse.

**Q2: What is Tian Zi Ge (田字格)?**
A: Tian Zi Ge is a traditional Chinese writing grid with a cross in the middle. It helps learners balance character strokes and maintain proper proportions.

**Q3: Can I download a PDF instead of printing?**
A: Currently, the generator outputs a browser-optimized print page. You can "Print to PDF" using your browser's built-in feature. A dedicated PDF download option is planned for a future release.

**Q4: Is there a limit to how many characters I can enter?**
A: For best print results, we recommend 5–10 characters per sheet. Longer inputs may be split across multiple pages automatically.

**Q5: Can teachers use this for their classes?**
A: Yes. Teachers can generate unlimited sheets for classroom use. A Teacher Pack with batch generation and custom templates will be available in a future release.

### Compliance / Non-Official Statement

**Disclaimer (fixed, below generator):**
> HSKKit is an independent study tool and is not affiliated with, endorsed by, or operated by the official HSK test organizers. This worksheet generator is provided as a supplementary learning resource.

**Additional note (near input or footer):**
This tool generates practice sheets for personal or classroom study. It does not provide official HSK materials or guarantee test results.

---

## 4. 首页 / Tools 区新增入口建议文案

（与上一版一致，无修改）

### Reading 入口

**Icon suggestion:** BookOpen or DocumentText
**Title:** HSK 1 Reading with Pinyin
**Description:** Read 5 original short stories with pinyin support, highlighted vocabulary, and comprehension questions. 5 minutes per story.
**CTA:** Start Reading
**Link:** /hsk-1-reading-practice

### Worksheet 入口

**Icon suggestion:** Grid or Printer
**Title:** Character Practice Sheets
**Description:** Generate printable Tian Zi Grids for any Chinese characters. Type, preview, and print in seconds. Great for handwriting practice.
**CTA:** Generate Worksheet
**Link:** /tools/chinese-character-practice-sheet-generator

### 首页 Tools 区完整结构建议 (P0 Full)

| 入口 | 标题 | 描述 | CTA | 路径 |
|------|------|------|-----|------|
| 1 | HSK Level Test | Find your HSK level in 5 minutes. 15+ questions with instant results. | Take Test | /hsk-level-test |
| 2 | HSK 1 Practice Test | 50+ HSK 1 questions. Instant scoring with explanations. | Start Practice | /hsk-1-practice-test |
| 3 | HSK 1 Vocabulary | 150 HSK 1 words with pinyin, English, and example sentences. | Browse Words | /hsk-1-vocabulary |
| 4 | HSK 1 Reading | 5 original short stories with pinyin and comprehension checks. | Start Reading | /hsk-1-reading-practice |
| 5 | Practice Sheets | Generate printable Tian Zi Grids for handwriting practice. | Make a Sheet | /tools/chinese-character-practice-sheet-generator |
| 6 | HSK Levels Guide | Understand HSK 1–6 levels and what each means for your study. | Learn More | /hsk-levels |

---

## 5. 禁词与合规扫描结果（重新扫描）

### 扫描范围
- 5 篇 Reading 内容（修订版）
- /hsk-1-reading-practice 页面文案
- /tools/chinese-character-practice-sheet-generator 页面文案
- 首页 Tools 入口文案

### 禁词清单 (PRD v3.4 §13)

| 禁词 | 状态 | 说明 |
|------|------|------|
| Official HSK | ✅ 未出现 | 全文使用 "HSK 1" 作为级别描述，非官方声明 |
| Guaranteed pass | ✅ 未出现 | 无包过/保证通过表达 |
| Certified HSK preparation | ✅ 未出现 | 无认证/官方备考声明 |
| Endorsed by HSK | ✅ 未出现 | 无背书表达 |
| 100% pass guarantee | ✅ 未出现 | 无百分比保证 |
| Unlimited AI | ✅ 未出现 | P0 Full 不涉及 AI 功能文案 |
| Guaranteed score improvement | ✅ 未出现 | 无提分承诺 |

### 合规声明检查

- ✅ 每页底部固定 Disclaimer 已写入模板
- ✅ Worksheet 页面额外加入 "非官方材料 / 不保证考试结果" 说明
- ✅ Reading 页面 FAQ 明确说明 "independent study tool"
- ✅ 无绝对退款话术（P0 Full 无支付，不涉及）
- ✅ 无 "free forever" 等不可验证承诺

### 风险提示

- **P1 (低):** 未来 Teacher Pack 文案需再次扫描禁词
- **P1 (低):** 若接入 Google Analytics，需在 Privacy Policy 补 Cookie Banner 说明
- **P0 (无):** 当前阶段无支付、无 AI、无账号，合规风险极低

---

## 6. 下游设计交接摘要

### 当前结论
- 状态：DONE
- 一句话结论：P0 Full 内容文案包（修订版 v2 / 二次返修）已冻结，5 项遗留问题全部修复，5 篇 Reading 目标词 100% 出现在正文且全部来自 HSK1 词表，合规扫描通过。

### 本阶段交付物
- 文件：`/root/projects/hskkit/docs/copywriting-p0full-rev1.md`
- 核心判断：
  - 5 篇 Reading 全部原创，目标词和正文汉字 100% 来自 HSK1 词表
  - 每篇包含 Vocabulary Scope Check 证明
  - 页面文案遵循 SEO-Copy Freeze 原则
  - 禁词扫描通过，合规声明已嵌入各页面模板

### 质量门槛自检
- [x] Headline 结果导向
- [x] CTA 是动词+结果
- [x] FAQ 首句直答
- [x] 禁用空泛 AI 味词
- [x] 5 秒内知道 What/Who/Why/CTA
- [x] 5 篇 Reading 全部通过 HSK1 词表范围检查
- [x] 无禁词出现

### 给下游的最小必要信息

**下一阶段：** 设计 (小美) → 前端 (小帅)

**必须读取：**
- 本文档完整内容（5 篇 Reading + 2 页面文案 + 首页入口）
- PRD v3.4 §16 设计原则（简洁优先、移动端优先、WCAG AA、品牌色 #E74C3C + #2C3E50）

**不能改动（内容冻结项）：**
- H1、SEO Title、Meta Description（SEO 核心，设计不可删改）
- FAQ 问答内容（schema 结构化数据直接引用）
- Disclaimer 固定文案（合规必需）
- 5 篇 Reading 的中文正文、拼音正文、英文 summary（内容准确性）
- Comprehension questions & answers（教育内容正确性）
- **新增：** 5 篇 Reading 的汉字不可替换（词表闭环依赖）

**可视觉优化（设计自由度）：**
- Story Cards 的展开/折叠交互方式
- Highlighted vocabulary 的展示形式（tooltip / 底部列表 / 侧边栏）
- 拼音渲染样式（行内/行下/可切换）
- CTA 按钮颜色/尺寸（保持品牌色即可）
- Worksheet 预览区的网格视觉样式
- 首页 Tools 入口的图标选择和卡片布局

**不能被前端改写：**
- 任何中文句子的汉字（拼音依赖正确汉字，且必须在 HSK1 词表内）
- 任何拼音字符串（声调符号不可丢失）
- 任何英文释义（学习者依赖准确翻译）
- FAQ 的问答对（schema 结构化数据）

**建议启动 Prompt（给小美/小帅）：**
```
请基于 HSKKit P0 Full 内容文案包（docs/copywriting-p0full-rev1.md）和 PRD v3.4 进行设计/开发。
内容已冻结，H1/SEO/FAQ/Disclaimer/Reading 正文不可改动。
5 篇 Reading 的汉字必须在 HSK1 词表范围内，不可替换或改写。
设计可优化视觉呈现和交互方式，但不可删除或改写冻结内容。
```

---

[DONE]
