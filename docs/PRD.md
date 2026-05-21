# HSKKit.com 产品需求文档 (PRD) v3.4

> 版本: v3.4
> 交付日期: 2026-05-19
> 交付人: 战略顾问\_老K
> 状态: P0a/P0 Full 可直接交付执行；P1 首版仅 Pro Monthly/Yearly，Lifetime/Beta/Teacher推迟
> 变更摘要: P1首版仅保留Pro Monthly($5.99)和Pro Yearly($49)；Lifetime/Beta/Teacher推迟；取消路径明确PayPal为主+support fallback；取消后Pro保留到周期结束；失败续费3-7天宽限期；P1不单独售卖credits pack；PayPal个人账号USD结算

\---

## 1\. 项目结论

**一句话原则**: 先做小、做准、做可上线。首版聚焦 HSK 1 / Beginner 用户，P0a 先验证词汇、测试、错题、总结的核心学习路径；P0 Full 再补 reading 和 browser-print worksheet，形成完整「每日10分钟练习闭环」。通过 SEO 工具页获客，通过进度保存、PDF 下载、AI 解析和 Pro 订阅变现。

**不做**: HSK 1-6 全量大平台、移动 App、视频课程、社区、直播课、教师后台、重 AI 对话陪练。

\---

## 2\. 产品定位

**产品名**: HSKKit
**域名**: HSKKit.com
**英文定位**: Daily HSK Practice Toolkit for Chinese Learners
**中文定位**: 面向海外中文学习者的每日 HSK 练习工具箱

**核心定位句**:

> HSKKit is a daily HSK practice toolkit that helps Chinese learners practice vocabulary, take beginner tests, read with pinyin, review mistakes, and print worksheets — in 10 minutes a day.

**品牌备注**: HSKKit 先以 HSK 为切入口，验证后可扩展至 pinyin、reading、worksheets、teacher resources。

\---

## 3\. 目标用户

**探索者** (HSK 1 新手) — \~50%

* 特征: 刚接触中文，不确定是否准备好考试
* 需求: 水平测试、简单练习、免费资源
* 变现潜力: 中 → Pro 转化

**目标者** (HSK 2-3 进阶) — \~35%

* 特征: 有明确考试目标，需要系统练习
* 需求: 题库、错题复习、PDF 材料、进度跟踪
* 变现潜力: 高 → Pro 订阅

**辅助者** (教师/家长) — \~15%

* 特征: 为学生/孩子寻找教学资源
* 需求: 可打印 worksheet、教学指南、班级包
* 变现潜力: 高 → Teacher Pack

\---

## 4\. 用户痛点

### HSK 1 用户痛点

* 不知道自己是否准备好考试
* 背完词但不会做题
* 想要简单 practice test
* 想要 PDF / worksheet 打印材料

### HSK 2 → HSK 3 用户痛点

* 句子突然变长，阅读从短句变成小段落
* 没有拼音后压力变大
* 词都认识，但语序和结构看不懂
* 听力密度变高

### HSK 3 / 4 用户痛点

* 词汇量变大后记不住
* Anki 卡片维护麻烦
* 不知道每天该复习什么
* 需要例句、音频、语法解释、弱项复习

### 高价值 SEO 内容痛点 (语法混淆)

建议独立页面覆盖：

* 已经……了 vs 都……了
* 又 vs 再
* 会 vs 能 vs 可以
* 了 vs 过 vs 着
* 一点儿 vs 有点儿

\---

## 5\. 产品核心路径

### P0a 简化路径 (4步)

**首页主 CTA**: Start Today's HSK 1 Practice

**每日练习路径**:

1. **Learn** — 学习 5 个 HSK 1 词汇 (带例句)
2. **Test** — 完成 5-10 道 HSK 1 练习题 (即时反馈)
3. **Review** — 查看错题、静态 explanation 和薄弱词提示
4. **Summary** — 展示完成总结，并提示 "Save your progress later / Join waitlist"

### P0 Full 完整闭环 (6步)

**首页主 CTA**: Start Today's 10-Minute HSK Practice

**每日练习路径**:

1. **Learn** — 学习 5 个 HSK 词汇 (带例句、音频)
2. **Test** — 完成 5 道练习题 (即时反馈)
3. **Read** — 阅读 1 篇带拼音的短故事
4. **Review** — 复习薄弱词汇 (基于错题)
5. **Generate** — 生成 1 份浏览器打印版 worksheet
6. **Summary** — 展示完成总结、进度条和连续天数

\---

## 6\. P0a / P0 Lite / P0 Full / P1 / P2 范围

### P0a / P0 Lite: 约 2 周上线，保守排期 17 天 (SEO + 核心路径验证)

**商业化/支付范围**: Free only；不接账号、不接支付、不接 AI

**目标**: 验证 SEO 流量、核心学习路径和用户留存信号，不做付费闭环

|页面/功能|说明|验收标准|
|-|-|-|
|首页 (/)|突出每日练习 CTA，功能入口精简|CTA 可点击、事件可追踪、移动端适配正常|
|HSK Level Test (/hsk-level-test)|免费水平测试，推荐适合的 HSK 级别|≥15 题，提交后给出推荐等级+正确率+下一步 CTA|
|HSK 1 Practice Test (/hsk-1-practice-test)|基础版题库，即时判分|≥50 题题库，每次抽 10-15 题，自动判分，显示答案解析|
|HSK 1 Vocabulary (/hsk-1-vocabulary)|词汇浏览 + 基础 Flashcards|150 词，支持搜索，含 hanzi/pinyin/English/example sentence|
|HSK Levels Guide (/hsk-levels)|HSK 级别说明页|完整级别对比表格，SEO Meta 完整|
|New HSK 3.0 Guide (/new-hsk-3-0)|新 HSK 3.0 改革说明|2.0 vs 3.0 对比，FAQ 覆盖|
|Privacy Policy / Terms of Service / Disclaimer|合规必需|三页完整，每页底部固定 Disclaimer|

### P0 Full: \~3 周上线 (补齐阅读、字帖、埋点)

**商业化/支付范围**: 仍可不接支付；如接账号也需另行确认

**目标**: 继续验证转化意图，例如 email capture / waitlist / pricing interest click

|页面/功能|说明|验收标准|
|-|-|-|
|HSK 1 Reading with Pinyin (/hsk-1-reading-practice)|带拼音的短篇阅读|≥5 篇原创阅读，词汇高亮，拼音渲染正确|
|Worksheet Generator — 浏览器打印版 (/tools/chinese-character-practice-sheet-generator)|输入中文 → 选择田字格 → 浏览器打印页|支持田字格，浏览器打印效果正常，暂不做复杂 PDF|
|基础 Flashcards 交互|翻卡模式|正面 hanzi，背面 pinyin+English+例句|
|基础埋点|核心事件追踪|page\_view / level\_test\_complete / practice\_test\_complete / worksheet\_generate|

### P1: 验证后再做 (上线后 1-2 月)

**商业化/支付范围**: PayPal + Pro subscription + AI credits + refund/cancel flow

**目标**: 正式上线商业化闭环和合规支付/退款/取消机制

|页面/功能|说明|
|-|-|
|HSK 2 / HSK 3 题库|扩展级别覆盖|
|错题本 (Mistake Review)|保存错题、薄弱词追踪|
|学习进度保存 — 用户账户体系|邮箱注册/登录|
|Worksheet Generator — 高级 PDF 版|PDF 下载、米字格、pinyin、English meaning、批量词表、Teacher templates|
|PDF Pack 下载|批量 worksheet PDF|
|Pro 订阅接入|PayPal 支付|
|AI Explanations|基于 AI 的答案解析，通过 credits / Fair Use 控制成本|
|AI Study Plan|基于水平的个性化计划|
|Teacher / Classroom Pack|教师批量资源|

### P2 (暂不做)

* HSK 1-6 全量大题库
* 移动 App (iOS/Android)
* 视频课程
* 社区/论坛
* 直播课
* 教师后台管理系统
* 重 AI 对话陪练 (API 成本高，ROI 不确定)

\---

## 7\. 页面与功能清单

|页面路径|类型|优先级|核心功能|
|-|-|-|-|
|/|首页|P0a|每日练习 CTA、功能导航、品牌声明|
|/hsk-level-test|工具页|P0a|水平测试、级别推荐|
|/hsk-1-practice-test|工具页|P0a|模拟测试、即时判分、答案解析|
|/hsk-1-vocabulary|内容页|P0a|词汇列表、搜索、基础 Flashcards|
|/hsk-1-reading-practice|内容页|P0 Full|带拼音阅读、词汇高亮|
|/tools/chinese-character-practice-sheet-generator|工具页|P0 Full|浏览器打印版字帖生成|
|/hsk-levels|内容页|P0a|HSK 级别说明、对比表格|
|/new-hsk-3-0|内容页|P0a|新 HSK 3.0 改革说明|
|/hsk-2-practice-test|工具页|P1|HSK 2 模拟测试|
|/hsk-2-vocabulary|内容页|P1|HSK 2 词汇|
|/hsk-3-practice-test|工具页|P1|HSK 3 模拟测试|
|/hsk-grammar|内容页|P1|语法对比、常见混淆|
|/hsk-flashcards|工具页|P1|高级 Flashcards (SRS)|
|/hsk-word-list-pdf|工具页|P1|词汇表 PDF 下载|

\---

## 8\. SEO 页面矩阵

### S 级页面 — P0a 必做 (6页)

|页面|目标关键词|搜索意图|页面类型|
|-|-|-|-|
|/|HSK practice, learn Chinese|品牌/导航|首页|
|/hsk-level-test|HSK level test, HSK placement test|工具型|测试工具|
|/hsk-1-practice-test|HSK 1 practice test online|工具型|测试工具|
|/hsk-1-vocabulary|HSK 1 vocabulary list|信息型|内容页|
|/hsk-levels|HSK levels explained|信息型|指南页|
|/new-hsk-3-0|New HSK 3.0, HSK 2.0 vs 3.0|信息型|指南页|

### S 级页面 — P0 Full 补齐 (2页)

|页面|目标关键词|搜索意图|页面类型|
|-|-|-|-|
|/hsk-1-reading-practice|HSK 1 reading practice with pinyin|工具型|内容页|
|/tools/chinese-character-practice-sheet-generator|Chinese character practice sheet|工具型|生成工具|

### A 级页面 (P1 及以后)

* /hsk-2-practice-test
* /hsk-2-vocabulary
* /hsk-2-to-hsk-3
* /hsk-3-practice-test
* /hsk-3-vocabulary
* /hsk-grammar
* /hsk-flashcards
* /hsk-word-list-pdf

### B 级页面 (后续扩展)

* /hsk-4-practice-test 至 /hsk-6-practice-test
* /old-hsk-vs-new-hsk
* /hsk-2-0-vs-3-0
* /how-long-to-pass-hsk-1 至 /how-long-to-pass-hsk-4
* /best-hsk-books

\---

## 9\. 数据结构建议

### P0a / P0 Lite 静态/本地数据 (不依赖数据库和账号)

|实体|存储方式|说明|
|-|-|-|
|**Vocabulary JSON**|静态文件|HSK 1 词汇 150 词，含 hanzi/pinyin/English/example sentence|
|**Question JSON**|静态文件|HSK 1 题库 ≥50 题，含题目/选项/正确答案/静态 explanation|
|**LocalProgress**|localStorage|本地缓存练习进度、连续天数 (7 天有效期)|

### P0 Full 新增静态数据

|实体|存储方式|说明|
|-|-|-|
|**Reading JSON**|静态文件|HSK 1 阅读 ≥5 篇，含 content/pinyin\_content/vocabulary\_highlighted|
|**Worksheet Settings**|本地状态|用户输入的字符、格子类型选择|

### P1 云端数据 (接入账户、订阅、AI)

|实体|字段|说明|
|-|-|-|
|**User**|id, email, created\_at, pro\_status, streak\_days|用户基础信息|
|**UserProgress**|user\_id, word\_id, mastery\_level, last\_reviewed, next\_review|学习进度|
|**Mistake**|user\_id, question\_id, timestamp, review\_count|错题记录|
|**Worksheet History**|user\_id, title, characters, settings, pdf\_url|字帖历史|
|**Pro Subscription**|user\_id, plan, credits\_remaining, renew\_date|订阅状态|
|**AI Credits**|user\_id, monthly\_credits, used\_credits|AI 使用额度|

### 技术栈建议

* 前端: Next.js 14 (App Router) + Tailwind CSS
* 部署: Cloudflare Workers / Pages 或 Vercel Edge（二选一，开发最终确认）
* P0a 数据: 静态 JSON + localStorage (无数据库)
* P1 Auth: Clerk
* P1 数据库: Supabase (Cloudflare D1 仅作为备选)
* P1 支付: PayPal
* P1 Email: Resend (Mailchimp 仅作为未来营销邮件备选)
* P1 AI: OpenAI API (通过 credits / Fair Use 控制成本；Gemini/Anthropic 作为后续备选)

\---

## 10\. 商业化与定价 (Pricing \& Monetization)

### 10.1 阶段商业化边界

|阶段|产品范围|商业化/支付范围|PRD 应写法|
|-|-|-|-|
|P0a / P0 Lite|静态 JSON / localStorage；核心学习工具；SEO 获客；基础练习闭环|Free only；不接账号、不接支付、不接 AI|目标是验证 SEO 流量、核心学习路径和用户留存信号，不做付费闭环|
|P0 Full|可增加阅读、浏览器打印字帖、Plausible 埋点、更多内容页|仍可不接支付；如接账号也需另行确认|继续验证转化意图，例如 email capture / waitlist / pricing interest click|
|P1 Paid|账号体系、Pro 权益、AI explanation/study plan、云端进度|PayPal + Pro subscription + AI credits + refund/cancel flow|正式上线商业化闭环和合规支付/退款/取消机制|

### 10.2 Free 免费层

**P0a Free (开放)**:

* HSK Level Test (完整)
* HSK 1 Vocabulary 浏览
* HSK 1 Practice Test 基础版 (每日限 1 套)
* 部分 Flashcards
* HSK Levels / HSK 3.0 Guide (完整)

**P0 Full Free (新增开放)**:

* Reading with Pinyin (部分)
* 基础 Worksheet Generator — 浏览器打印版 (每日限 3 份)

### 10.3 Free 限制 (促转化)

* 不保存完整进度 (本地缓存仅 7 天)
* 错题复习仅显示最近 5 题
* P0 Full 浏览器打印版 worksheet 每日限 3 份（软限制）
* 高级 Flashcards (SRS 算法) 不开放
* AI Explanations 不开放 (P0a 不接 AI，P1 后免费每日少量次数)
* P1 PDF Pack 上线后：PDF 下载限 1 页/日

### 10.4 Pro 定价结构 v3.4 (P1 Initial)

**P1 首版仅上线以下两种订阅计划**，Lifetime / Beta Lifetime / Teacher Pack 推迟至后续版本：

|Plan|价格|续费性质|AI Credits|备注|
|-|-|-|-|-|
|Free|$0|免费|P0a 不开放 AI；P1 后可给每日少量免费 AI 次数|SEO 获客 + 核心学习体验|
|Pro Monthly|$5.99 / month|月度自动续费|500 credits / month|月度 credits 每账期重置，不结转|
|Pro Yearly|$49 / year|年度自动续费|500 credits / month|年付折扣；仍按月发放/重置 credits|

**推迟至后续版本**:

* Lifetime ($99 one-time)
* Beta Lifetime ($49–$59 one-time, 前 100 名)
* Teacher Pack ($19/month 或 $149/year)

**Lifetime AI Credits 说明** (未来版本参考):

* Lifetime is primarily for non-AI Pro features.
* AI credits are limited and may be granted as a one-time bonus or subject to separate purchase/fair use limits.
* Lifetime 一次性赠送 1,000 credits；Beta Lifetime 一次性赠送 500 credits。
* 用完后需用户订阅或购买 credits 包（如后续推出）。

## 10.5 Credits 消耗规则 (P1)

**核心规则**:

* Monthly credits reset at the beginning of each billing cycle.
* Unused monthly credits do not roll over to the next billing cycle.
* Credits have no cash value and cannot be transferred, exchanged, or redeemed for money.
* Credits are subject to Fair Use Policy, rate limits, abuse prevention, and technical safeguards.
* AI credit consumption may change as features evolve, but material changes should be disclosed clearly.
* If standalone credits packs are introduced later, PRD must add separate pricing and refund rules.
* **P1 initial launch will not sell standalone credits packs.**

**Credits 消耗规则 (P1)**:

|AI 功能|建议消耗|定义|
|-|-|-|
|AI Explanation|2 credits / use|\[待确认] 一次 use = 单题解析 / 单段解释 / 一次完整提交？|
|AI Study Plan|20 credits / use|\[待确认] 一次计划覆盖周期：7 天 / 14 天 / 30 天？|
|AI Quiz Generation|5 credits / set|\[待确认] 一组 quiz 包含多少题，例如 5-10 题？|

### 10.6 Pro 卖点

* Unlimited Practice Tests (全级别，受 Fair Use 限制)
* Saved Progress (云端同步)
* Weak-Word Review (智能薄弱词推送)
* Full PDF Packs (批量下载)
* More Worksheets (无限制)
* AI Explanations (使用 monthly credits，高额度但非 unlimited)
* AI Study Plan (使用 credits 生成个性化学习计划)
* Advanced Flashcards (SRS 算法)
* Teacher Printables (班级资源 — 推迟至 Teacher Pack 上线)

**注意**: 不写 "Unlimited AI"。改成 "Generous AI credits" 或 "High monthly AI credit allowance"。

\---

## 11\. 支付与退款 (Payment \& Refund)

### 11.1 支付提供商

* **Payment Provider**: PayPal
* P1 paid plans use PayPal Checkout / PayPal Subscription where available.

### 11.2 订阅类型

* Pro Monthly / Pro Yearly are auto-renewing subscriptions unless canceled before the next billing date.
* Lifetime / Beta Lifetime / Teacher Pack are postponed in P1 initial launch.

### 11.3 退款与取消规则

**退款规则**:

* **Refund window**: 7 days from purchase.
* Refunds may be denied or prorated for heavily used AI credits, consumed service quotas, or completed AI-generated services, except where required by applicable law.

**取消规则**:

* Users cancel subscriptions primarily through PayPal.
* **Fallback support**: support@hskkit.com for users who need assistance with cancellation.
* After cancellation, Pro access remains active until the end of the current billing period.
* Failed renewals receive a **3–7 day grace period** before downgrade to Free.

### 11.4 定价页文案红线

**禁止表达**:

* ❌ "Unlimited AI"
* ❌ "Lifetime includes 500 AI credits every month forever"
* ❌ "Guaranteed pass"
* ❌ "100% score improvement"
* ❌ "Official HSK prep"
* ❌ "No refunds after 7 days" (绝对话术)

**推荐表达**:

* ✅ "Generous AI credits"
* ✅ "High monthly AI credit allowance"
* ✅ "Lifetime is primarily for non-AI Pro features"
* ✅ "Generally non-refundable, except where required by applicable law"

\---

## 12\. Free / Pro 功能边界

|模块|Free|Pro|
|-|-|-|
|Practice Tests|每日/每级限制，例如 HSK 1 Practice Test 每日 1 套|全级别、更高频/不限量，受 Fair Use 限制|
|Progress|P0a 本地缓存；不保证云同步|云端保存进度、跨设备同步|
|Weak-word Review|最近少量错题/基础回顾|完整薄弱词复习、历史追踪|
|PDF / Worksheets|每日/数量限制；基础模板|更多 worksheets、完整 PDF packs、Teacher printables|
|AI Explanations|P0a 不开放；P1 后可每日少量免费次数|使用 monthly credits，高额度但非 unlimited|
|AI Study Plan|不开放或仅试用|使用 credits 生成个性化学习计划|
|Advanced Flashcards / SRS|基础 flashcards|高级 SRS、复习计划、云端同步|

\---

## 13\. 合规边界

### 品牌声明 (每页底部固定)

> HSKKit is an independent study tool and is not affiliated with, endorsed by, or operated by the official HSK test organizers.

**中文备注**: HSKKit 是独立学习工具，不隶属于、不代表、不受官方 HSK 考试机构背书。

### 禁止表达

* ❌ "Official HSK"
* ❌ "Guaranteed pass"
* ❌ "Certified HSK preparation"
* ❌ "Endorsed by HSK"
* ❌ "100% pass guarantee"

### 合规页面清单 (P0a 必须)

* \[ ] Privacy Policy
* \[ ] Terms of Service
* \[ ] Cookie Policy
* \[ ] Disclaimer
* \[ ] Refund Policy (P1 接支付时补)
* \[ ] AI 内容免责声明 (P1 接 AI 时补)

### 数据与第三方清单

**P0a / P0 Full Analytics 默认**: Plausible cookieless analytics。Privacy Policy / Cookie Notice / Footer 中披露 Plausible 即可，通常不需要 Cookie Banner。

**若后续接入 Google Analytics、Microsoft Clarity、Google Ads、Meta Pixel 或其他非必要追踪脚本，必须先实现 Cookie Banner / Consent，并在 EU/UK 用户同意后再加载。**

|类型|服务|用途|合规要求|
|-|-|-|-|
|分析 (Cookieless)|Plausible|流量分析|Privacy Policy / Footer 披露|
|分析 (Cookie)|Google Analytics|流量分析|Cookie Consent 横幅 + Privacy Policy（如接入）|
|邮件|Resend|用户通知|退订机制|
|邮件 (备选)|Mailchimp|营销邮件|退订机制（未来接入时）|
|支付|PayPal (个人账号，USD 结算)|Pro 订阅|PayPal 合规要求|
|AI|OpenAI API|解析/计划|默认不用于训练；上线前需确认账号设置并留档|

\---

## 14\. 埋点与验证指标

### 北极星指标

* **每日活跃练习用户** (完成至少 1 个练习步骤)
* **Pro 转化率** (免费 → 付费)

### 关键指标

|指标|目标 (首月)|验证标准|
|-|-|-|
|首页访客 → Level Test|>30%|获客效率|
|Level Test → Practice Test|>40%|内容吸引力|
|练习完成率|>60%|产品体验|
|次日留存|>25%|留存能力|
|7日留存|>15%|习惯养成|
|邮件订阅率|>5%|私域积累|
|Pro 转化率|>2%|商业化验证|

### 埋点事件

* page\_view (页面访问)
* level\_test\_start / complete
* practice\_test\_start / complete / abandon
* vocabulary\_view / flashcard\_flip
* reading\_start / complete
* worksheet\_generate / download
* pro\_upgrade\_click / purchase\_complete

\---

## 15\. 交付给文案的要求

### 页面文案清单

|页面|文案需求|语气|
|-|-|-|
|首页|主标题、副标题、CTA、功能介绍|鼓励、简洁|
|Level Test|测试说明、结果页文案、级别推荐|友好、专业|
|Practice Test|题目文案、反馈文案、解析文案|清晰、教育性|
|Vocabulary|词汇释义、例句、分类标签|准确、易懂|
|Reading|文章标题、导读、词汇注释|有趣、实用|
|SEO 页面|标题标签、Meta Description、H1-H3|SEO 优化|

### 内容规范

* 英文为主，关键中文词汇保留拼音
* 避免学术化表达，用学习者语言
* 每页必须有明确的下一步行动 (CTA)

\---

## 16\. 交付给设计的要求

### 设计原则

* **简洁优先**: 学习工具，减少视觉干扰
* **移动端优先**: 60%+ 流量来自移动设备
* **无障碍**: 对比度符合 WCAG AA
* **品牌色**: 建议主色 #E74C3C (中国红) + 辅色 #2C3E50 (深蓝灰)

### 首页结构 (5屏)

1. **Hero**: 主标题 + 每日练习 CTA + 品牌声明
2. **How It Works**: 3步说明 (Test → Practice → Review)
3. **Tools**: P0a 核心工具入口 (Level Test / Practice / Vocabulary / HSK Guide)；P0 Full 再加入 Reading / Worksheet
4. **Social Proof**: 用户数量、评分、 testimonials (后续补充)
5. **Footer**: 功能链接 + 合规声明

### 关键交互

* 练习流程: 单题展示 → 选择 → 即时反馈 → 下一题
* 进度展示: 顶部进度条 + 完成庆祝动画
* 字帖生成 (P0 Full): 输入中文 → 选择田字格 → 预览打印页 → 浏览器打印
* 字帖生成 (P1): 实时预览 → 自定义设置 → PDF 下载 (高级 PDF、米字格、pinyin、English meaning、Teacher templates)

\---

## 17\. 交付给开发的要求

### P0a / P0 Lite 技术任务 (约 2 周，保守排期 17 天)

|任务|优先级|预估工时|
|-|-|-|
|项目脚手架 (Next.js + Tailwind)|P0a|1d|
|首页 + 导航 + Footer|P0a|2d|
|HSK Level Test (逻辑 + 结果页)|P0a|3d|
|HSK 1 Practice Test (题库 + 判分 + 静态 explanation)|P0a|4d|
|HSK 1 Vocabulary (列表 + 基础 Flashcards)|P0a|3d|
|HSK Levels / New HSK 3.0 内容页|P0a|2d|
|Privacy / Terms / Disclaimer|P0a|1d|
|SEO 基础 (Meta / Sitemap / Robots)|P0a|1d|
|**P0a 小计**||**\~17 天**|

### P0 Full 技术任务 (+1 周)

|任务|优先级|预估工时|
|-|-|-|
|HSK 1 Reading (带拼音渲染)|P0 Full|2d|
|Worksheet Generator — 浏览器打印版|P0 Full|2d|
|基础埋点 (核心事件追踪)|P0 Full|1d|
|**P0 Full 小计**||**\~5 天**|

**总计**: P0a \~17 天 + P0 Full \~5 天 = **\~3 周完整上线**

### P1 技术任务 (商业化闭环)

|任务|优先级|预估工时|
|-|-|-|
|用户账户体系 (注册/登录)|P1|3d|
|PayPal 支付集成|P1|3d|
|AI Credits 系统|P1|2d|
|云端进度同步|P1|2d|
|错题本 + 薄弱词追踪|P1|2d|
|高级 PDF Worksheet|P1|2d|
|AI Explanation / Study Plan|P1|3d|
|Refund / Cancel flow|P1|1d|
|**P1 小计**||**\~18 天**|

### 性能要求

* 首屏加载 < 2s (Lighthouse Performance > 90)
* 核心 Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
* 支持 SSR/SSG for SEO

\---

## 18\. 交付给合规的要求

### 小财合规审查清单

* \[ ] Privacy Policy 草稿 (数据收集、Cookie、第三方服务)
* \[ ] Terms of Service 草稿 (用户责任、知识产权、免责声明)
* \[ ] Cookie Policy 草稿 (必要/分析/营销 Cookie 分类)
* \[ ] Disclaimer 草稿 (非官方声明、学习工具定位)
* \[ ] Refund Policy 草稿 (7 天窗口、pro-rated 规则、法律例外)
* \[ ] 数据流图 (用户数据从收集到存储到删除)
* \[ ] 第三方服务清单 (Analytics、Email、支付、AI)
* \[ ] 用户数据收集清单 (哪些数据、用途、保留期限)
* \[ ] 支付/订阅合规检查 (PayPal、自动续费披露)
* \[ ] AI 内容免责声明 (P1 阶段)
* \[ ] Credits 规则合规检查 (no cash value、no rollover、Fair Use)
* \[ ] 高风险项目律师复核建议

### 合规页面内容要求

* 每页底部固定 Disclaimer
* P0a / P0 Full 默认使用 Plausible cookieless analytics → 页脚披露即可，无需 Cookie Banner
* 若后续接入 Google Analytics、Microsoft Clarity、Google Ads、Meta Pixel 或其他非必要追踪脚本 → 必须先实现 Cookie Banner / Consent，并在 EU/UK 用户同意后再加载
* 隐私设置入口 (页脚)

\---

## 19\. 首版内容质量标准

* 词汇、拼音、英文释义必须人工校对
* 题目不能直接复制官方/竞品材料，必须原创
* 阅读文章必须原创或自写
* 每道题必须有 explanation
* 中文句子要符合 HSK 1 难度

\---

## 20\. 首页转化路径与 Email Capture

**P0a 主转化路径**:

1. Start Today's HSK 1 Practice (主 CTA)
2. Take Level Test (次 CTA)
3. Try HSK 1 Practice Test (次 CTA)
4. Save progress / Email capture (完成练习后)

**P0 Full 升级路径**:

1. Start Today's 10-Minute HSK Practice (主 CTA)
2. Take Level Test (次 CTA)
3. Try HSK 1 Practice Test (次 CTA)
4. Download / Print Worksheet (次 CTA)
5. Save progress / Email capture (完成练习后)

**Lead Magnet**:

* Get the free HSK 1 vocabulary PDF (邮箱订阅换取)

\---

## 21\. 不依赖登录原则

* 新用户不登录也能完成 Day 1 练习
* Day 1 完成后再提示 Save your progress (邮箱/注册)
* 本地进度保存 7 天，过期后引导注册

\---

## 22\. 风险与暂不做事项

### 风险

|风险|等级|应对|
|-|-|-|
|HSK 官方品牌争议|中|固定 Disclaimer，避免官方关联表达|
|内容版权 (词汇/题库)|低|自主编写，不直接复制官方材料|
|SEO 竞争 (现有工具站)|中|差异化「每日练习」路径，不仅做工具页|
|AI 成本波动|中|P1 接入，首版不依赖 AI；credits + Fair Use 控制|
|支付合规 (跨境)|中|P1 接入 PayPal，先做欧美市场|
|Lifetime AI 成本黑洞|高|改为一次性赠送 credits，不承诺长期月度额度|

### 暂不做 (明确边界)

* HSK 4-6 内容 (验证 HSK 1-3 后再扩展)
* 移动 App (先做 PWA/响应式)
* 视频课程 (成本过高)
* 社区/论坛 (运营成本高)
* 直播课 (重运营)
* 教师后台 (Teacher Pack 先做资源包)
* 重 AI 对话陪练 (API 成本高，ROI 不确定)

\---

## 23\. 附录: 快速参考

**品牌统一**:

* ✅ HSKKit / HSKKit.com
* ❌ HSK SEO 工具站 / HSKPrep / HanziKit / hsk.tools / HSK 工具站

**核心关键词**:
Daily practice, HSK beginner, Vocabulary, Practice test, Reading with pinyin, Flashcards, Printable worksheets, Mistake review

**一句话总结**:

> HSKKit.com 首版 = HSK 1 每日练习工具箱，10 分钟闭环，SEO 获客，Pro 变现。

\---

## 24\. PRD v3.4 内部一致性检查清单

* \[ ] 第 1 节一句话原则按阶段拆分：P0a 词汇/测试/错题/总结 → P0 Full 补 reading/worksheet
* \[ ] 第 5 节路径按阶段拆开：P0a 4步 / P0 Full 6步
* \[ ] 第 6 节(范围)和第 7 节(页面清单)优先级一致
* \[ ] 第 6 节(范围)和第 16 节(设计)交互描述一致
* \[ ] 第 6 节(范围)和第 17 节(开发)任务拆分一致
* \[ ] 第 8 节 SEO S级页面分两批：P0a 6页 + P0 Full 2页
* \[ ] 第 9 节数据结构分层：P0a 不含 Reading/Worksheet → P0 Full 新增
* \[ ] 第 10.2 节 Free 层按阶段拆分：P0a / P0 Full
* \[ ] 第 10.4 节 P1 首版仅 Pro Monthly/Yearly；Lifetime/Beta/Teacher 推迟
* \[ ] 第 10.5 节 P1 不单独售卖 credits pack
* \[ ] 第 11.2 节订阅类型仅 Pro Monthly/Yearly 自动续费
* \[ ] 第 11.3 节取消路径：PayPal 为主 + support@hskkit.com fallback
* \[ ] 第 11.3 节取消后 Pro access 保留到账单周期结束
* \[ ] 第 11.3 节失败续费 3-7 天宽限期
* \[ ] 第 16 节首页 Tools 按阶段拆分：P0a 4个 + P0 Full 补 Reading/Worksheet
* \[ ] 第 20 节转化路径按阶段拆分：P0a / P0 Full
* \[ ] Free/Pro 功能和 AI 接入阶段一致
* \[ ] 技术栈默认值统一：Clerk + Supabase + PayPal(个人账号,USD) + Resend + OpenAI
* \[ ] Analytics 默认 Plausible-first，GA/Clarity/Ads Pixel 后置
* \[ ] 合规要求在不同章节表述一致
* \[ ] 章节编号连续无跳号
* \[ ] 支付工具已从 Stripe 统一改为 PayPal
* \[ ] P0a/P0 Lite 明确不写 PayPal checkout / subscription implementation
* \[ ] Lifetime/Beta Lifetime 已移除"每月 500 AI credits"承诺
* \[ ] Credits reset / no rollover / no cash value / Fair Use 已写入
* \[ ] Refund / cancellation / auto-renewal 与合规报告一致
* \[ ] 定价页文案避免 unlimited AI / guaranteed pass / official HSK 等高风险表达

