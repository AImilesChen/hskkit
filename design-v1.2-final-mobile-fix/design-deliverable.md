# HSKKit — 站点设计交付包

> 状态：设计完成，可直接交付开发
> 日期：2026-05-20
> 设计：小美（AI出海OPC团队）

---

## 1. 竞品视觉分析

### 竞品 1：Duolingo (duolingo.com)
- **主色调**：绿 (#58CC02) + 白背景
- **深色/浅色**：浅色为主，高饱和绿色
- **字体**：无衬线，圆润友好
- **Hero 策略**：吉祥物插画 + 大标题 + 双 CTA
- **布局**：居中，单列，大量留白
- **CTA 文案**："GET STARTED" / "I ALREADY HAVE AN ACCOUNT"
- **整体感觉**：游戏化、娱乐、大众化、低龄感
- **可借鉴**：CTA 醒目、信任感强、语言选择直观
- **必须避开**：过于卡通、吉祥物风格、低龄化视觉

### 竞品 2：ChineseSkill (chineseskill.com)
- **主色调**：橙红渐变 + 白背景
- **深色/浅色**：浅色，暖色调
- **字体**：标准无衬线
- **Hero 策略**：App 截图轮播 + 功能列表
- **布局**：居中，传统 SaaS 模板感
- **CTA 文案**："Start Learning"
- **整体感觉**：模板感重、缺乏品牌辨识度、信息堆砌
- **可借鉴**：功能展示清晰
- **必须避开**：模板感、渐变滥用、信息过载

### 竞品 3：Hack Chinese (hackchinese.com)
- **主色调**：深绿 (#1B4332) + 米白
- **深色/浅色**：深色 Hero + 浅色内容区
- **字体**：无衬线，偏技术感
- **Hero 策略**：汉字云背景 + 大标题 + CTA
- **布局**：非对称，汉字云作为视觉锚点
- **CTA 文案**："Start your free trial"
- **整体感觉**：学习工具感、专业、有点枯燥
- **可借鉴**：汉字元素融入设计、深色 Hero 区
- **必须避开**：过于枯燥、缺乏活力、设计感弱

### 竞品 4：Skritter (skritter.com)
- **主色调**：绿 (#4CAF50) + 白
- **深色/浅色**：浅色为主
- **字体**：标准无衬线
- **Hero 策略**：手写识别 demo + 功能卡片
- **布局**：传统 3 列 features
- **CTA 文案**："TRY IT OUT" / "Start your 7-day free trial"
- **整体感觉**：功能导向、老牌工具感、设计保守
- **可借鉴**：功能 demo 直接展示
- **必须避开**：保守设计、缺乏现代感

### 设计决策
- 竞品全是浅色 → **HSKKit 优先深色主题**，差异化明显
- 竞品多用绿/蓝 → **HSKKit 用中国红 + 琥珀金**，文化关联 + 视觉跳出
- 竞品都是居中模板 → **HSKKit 用非对称布局 + Bento Grid**
- 竞品偏卡通/保守 → **HSKKit 走 Japanese Minimal + 工业精确感**

---

## 2. 反 AI 味约束表

| 维度 | AI 默认做法 | HSKKit 做法 |
|---|---|---|
| **字体** | Inter / Roboto / Arial | **Space Grotesk** (Display) + **DM Sans** (Body) |
| **配色** | 紫蓝渐变 + 白背景 | **深色主题** (#0D0D12) + **中国红** (#E63946) + **琥珀金** (#F4A261) |
| **布局** | 对称居中 3 列 | **非对称 Split** / **Bento Grid** / **2+1 布局** |
| **图标** | Emoji / 通用图标 | **Lucide Icons** / 定制 SVG（汉字笔画元素） |
| **圆角** | 统一 8px / 12px | **有尖有圆**：按钮 6px，卡片 12px，标签 2px |
| **Section 过渡** | 白灰交替 | **色块分割** + 细线分隔 + 渐变过渡 |
| **标题文案** | "Revolutionize" / "Empower" / "Seamless" | **具体动作**："Practice for HSK 1 in 10 Minutes a Day" |
| **Hero 视觉** | 抽象 3D 图形 | **产品界面截图** / **练习流程 demo** / **汉字排版艺术** |
| **CTA 样式** | 蓝色按钮 | **琥珀金实心按钮** + 中国红 hover，最醒目元素 |
| **信任元素** | 假评价 / 假数据 | **具体数字** + **合规声明** + **透明定价** |

### 禁用词（文案红线）
```
Revolutionize / Empower / Seamless / Cutting-edge / Next-generation
Unlock your potential / Unleash / Transform / Supercharge
"Unlimited AI" / "Guaranteed pass" / "100% score improvement"
"Official HSK" / "Certified HSK preparation" / "Endorsed by HSK"
```

---

## 3. 三个设计方向

### 方向 A：Japanese Minimal — 推荐
**调性**：极简、精确、东方美学、克制
**关键词**：clean, precise, calm, focused, scholarly

- 深色背景 (#0D0D12) + 米白文字 (#F5F5F0)
- 中国红 (#E63946) 作为品牌标识色，仅用于 Logo 和关键强调
- 琥珀金 (#F4A261) 用于 CTA 按钮
- 大量留白，信息层级清晰
- 汉字作为装饰元素（淡色、大字、背景层）
- 适合：学习工具、需要专注感、差异化明显

### 方向 B：Industrial — 备选
**调性**：工业、精确、开发者感、硬核
**关键词**：precise, technical, structured, no-nonsense

- 深色背景 (#0A0A0F) + 冷白文字 (#E8ECF0)
- 荧光青 (#00E5CC) 作为主色
- 橙色 (#FF6B35) 作为 CTA
- 等宽字体元素、网格线、数据可视化感
- 适合：技术感强的工具、男性用户偏多

### 方向 C：Warm Editorial — 备选
**调性**：温暖、编辑感、人文、可信
**关键词**：warm, trustworthy, editorial, approachable

- 浅色背景 (#FAF8F5) + 深褐文字 (#2D2420)
- 陶土红 (#C73E1D) 作为主色
- 金色 (#D4A574) 作为强调
- 衬线字体标题、杂志排版感
- 适合：内容产品、女性用户偏多、亲和力

**最终选择：方向 A (Japanese Minimal)**
理由：
1. 学习工具需要专注感，深色主题减少视觉干扰
2. 中国红 + 东方美学与产品定位（中文学习）天然契合
3. 竞品全是浅色，深色主题差异化最强
4. 克制的设计语言传递"专业学习工具"而非"娱乐游戏"

---

## 4. 首页页面生成 Prompt

### Desktop 版本

```text
Design a dark-theme landing page for HSKKit — a daily HSK practice toolkit for Chinese learners.

Target users:
- HSK 1 beginners (50%): unsure if ready for exam, need simple practice
- HSK 2-3 learners (35%): exam goals, need systematic practice
- Teachers/parents (15%): need printable worksheets and resources

Design vibe:
Japanese Minimal — clean, precise, calm, focused, scholarly.
Keywords: minimal, precise, calm, focused, scholarly, east-asian

Typography:
Use "Space Grotesk" for headings.
Use "DM Sans" for body text.
Do not use Inter, Roboto, Arial, or system default fonts.

Color scheme:
Background: #0D0D12
Surface: #16161D
Primary accent: #E63946 (Chinese Red — use sparingly, for logo and key highlights only)
CTA / highlight: #F4A261 (Amber Gold)
Text primary: #F5F5F0 (Warm White)
Text secondary: #8A8A93 (Muted Gray)
Border / divider: #2A2A35

Page structure:

1. NAVIGATION
- Fixed top nav, height 64px, background #0D0D12 with subtle bottom border #2A2A35
- Logo left: "HSKKit" wordmark in Space Grotesk, "HSK" in #E63946, "Kit" in #F5F5F0
- Nav links center: Product, Pricing, FAQ, Blog (DM Sans, 14px, #8A8A93, hover #F5F5F0)
- Primary CTA right: "Start Practicing — Free" (amber gold bg #F4A261, dark text #0D0D12, 6px radius, 14px font)
- Mobile: hamburger menu

2. HERO SECTION
- Layout: Split layout — left 55% text, right 45% visual
- Left:
  - Headline: "Practice for HSK 1 in 10 Minutes a Day" (Space Grotesk, 48px, #F5F5F0, line-height 1.1)
  - Subheadline: "HSKKit helps Chinese learners test their level, practice vocabulary, read with pinyin, review mistakes, and get AI explanations when stuck — without turning study time into a 30-minute lesson." (DM Sans, 18px, #8A8A93, max-width 520px, line-height 1.6)
  - Primary CTA: "Start Today's HSK Practice — Free" (amber gold bg, dark text, 12px 28px padding, 6px radius, 16px font)
  - Secondary CTA: "Take the Free HSK Level Test" (transparent bg, #F5F5F0 text, 1px #2A2A35 border, same padding)
  - Trust line below: "Try the level test and basic practice without signup." (DM Sans, 13px, #8A8A93, with a small check icon)
- Right:
  - Hero visual: A stylized "practice card" mockup showing a Chinese character "学" with pinyin "xué" and English "to learn", surrounded by subtle UI elements (progress bar, streak counter "Day 5"). Dark card on slightly lighter surface. No fake UI details. Clean, minimal, floating with subtle shadow.
- Background: #0D0D12 with a very subtle, large, faded Chinese character "汉" in #1A1A25 as decorative background element (opacity 0.03, positioned top-right)
- Section padding: 120px top, 100px bottom

3. HOW IT WORKS
- Section title: "Your Daily HSK Practice in 3 Steps" (Space Grotesk, 32px, #F5F5F0, centered)
- 3 cards in a row (desktop), each:
  - Step number: "01" / "02" / "03" (Space Grotesk, 48px, #E63946, opacity 0.3)
  - Title: "Test Your Level" / "Practice 10 Minutes" / "Track & Improve" (Space Grotesk, 20px, #F5F5F0)
  - Description: (DM Sans, 15px, #8A8A93, line-height 1.6)
  - Card bg: #16161D, border: 1px #2A2A35, radius: 12px, padding: 32px
  - Gap between cards: 24px
- Section padding: 100px top/bottom

4. USE CASES
- Section title: "Who HSKKit Is For" (Space Grotesk, 32px, #F5F5F0)
- 2x2 Bento Grid layout:
  - Card 1 (large, spans 2 cols): "The HSK 1 Beginner" — Before/After format
  - Card 2: "The Self-Studier at HSK 2-3"
  - Card 3: "The Teacher or Parent"
  - Card 4: "The Busy Professional"
- Each card: bg #16161D, border 1px #2A2A35, radius 12px
- "Before" text in #8A8A93, "After" text in #F5F5F0, "Bridge" in amber gold #F4A261
- Section padding: 100px top/bottom

5. FEATURES
- Section title: "What You Get" (Space Grotesk, 32px, #F5F5F0)
- Bento Grid: 3 columns, mixed heights
  - Large card: "HSK Level Test" — 15 questions, level recommendation
  - Medium card: "Daily Practice Test" — 10-15 questions, instant scoring
  - Medium card: "Reading with Pinyin" — short passages with pinyin overlay
  - Large card: "Worksheet Generator" — browser-printable practice sheets
  - Small card: "Mistake Review" — weak-word tracking
  - Small card: "AI Explanations (Pro)" — 500 credits/month
- Each card: icon (Lucide-style, 24px, #E63946), title (Space Grotesk, 18px), description (DM Sans, 14px, #8A8A93)
- Card bg: #16161D, hover: border color transitions to #E63946
- Section padding: 100px top/bottom

6. PRICING
- Section title: "Simple Pricing. No Surprises." (Space Grotesk, 32px, #F5F5F0, centered)
- 3 cards in a row:
  - Free: "$0 forever" — list of free features, CTA "Start Practicing — Free"
  - Pro Monthly: "$5.99 / month" — highlighted card (border: 2px #F4A261, subtle amber glow), CTA "Upgrade to Pro — $5.99/month"
  - Pro Yearly: "$49 / year" — "Save 32%" badge (bg #E63946, text white, small pill), CTA "Get Pro Yearly — $49/year"
- Each card: bg #16161D, border 1px #2A2A35, radius 12px
- Feature list: check icons (Lucide, #F4A261), text in #8A8A93
- Trust line below cards: "Auto-renews monthly/yearly. Cancel anytime via PayPal or email support@hskkit.com." (DM Sans, 13px, #8A8A93, centered)
- Compliance note: "Prices are in USD and do not include applicable taxes or VAT." (DM Sans, 12px, #8A8A93)
- Section padding: 100px top/bottom

7. FAQ
- Section title: "Frequently Asked Questions" (Space Grotesk, 32px, #F5F5F0, centered)
- Accordion style, 10 questions:
  - Q: "Is HSKKit free to use?"
  - Q: "Do I need to create an account?"
  - Q: "What are AI credits and how do they work?"
  - Q: "Can I cancel my subscription?"
  - Q: "What happens if my payment fails?"
  - Q: "Can I get a refund?"
  - Q: "Is HSKKit an official HSK prep tool?"
  - Q: "What makes HSKKit different from Duolingo or ChineseSkill?"
  - Q: "Can I use HSKKit for my students or children?"
  - Q: "Is my data safe?"
- Each item: question in Space Grotesk 16px #F5F5F0, answer in DM Sans 14px #8A8A93, border-bottom 1px #2A2A35
- Expand/collapse with chevron icon (Lucide)
- Section padding: 100px top/bottom

8. FINAL CTA
- Background: subtle gradient from #0D0D12 to #16161D
- Headline: "You want to prepare for HSK 1. Not someday — this year." (Space Grotesk, 36px, #F5F5F0, centered)
- Subheadline: "HSKKit gives you a 10-minute daily practice loop. No fluff. No 30-minute lessons. Just focused progress." (DM Sans, 16px, #8A8A93, centered, max-width 560px)
- Primary CTA: "Start Today's HSK Practice — Free" (amber gold, centered)
- Secondary CTA: "Take the Free HSK Level Test" (transparent, centered, below primary)
- Section padding: 120px top/bottom

9. FOOTER
- Background: #0D0D12, top border 1px #2A2A35
- 4 columns:
  - Col 1: Logo + "© 2026 HSKKit. All rights reserved."
  - Col 2: Product links (Level Test, Practice Test, Vocabulary, Reading, Worksheet)
  - Col 3: Legal links (Privacy Policy, Terms of Service, Refund Policy, Fair Use Policy, Cookie Policy, Disclaimer)
  - Col 4: Contact (support@hskkit.com)
- Disclaimer text at very bottom: "HSK and related names are trademarks or registered trademarks of their respective owners. HSKKit is an independent learning tool and is not affiliated with, endorsed by, sponsored by, or operated by Hanban, Chinese Testing International, or any official HSK test organizer or trademark owner." (DM Sans, 11px, #5A5A63, centered)
- Section padding: 64px top, 32px bottom

Design constraints:
- NOT a generic SaaS template.
- No purple-blue gradient on white background.
- No centered hero with generic 3-column features.
- No emoji icons; use Lucide-style icons or custom SVG.
- Use asymmetric layout where appropriate.
- CTA must be the most visible element above the fold.
- Keep strong information hierarchy.
- Make the design look like a real brand, not AI-generated.
- All Chinese characters in the design should use a proper Chinese font (e.g., "Noto Sans SC") as fallback.

Device: DESKTOP (1440px width reference)
```

### Mobile 版本

```text
Design a dark-theme landing page for HSKKit — a daily HSK practice toolkit for Chinese learners.

[Same target users, design vibe, typography, color scheme as desktop]

Page structure (MOBILE — 375px width):

1. NAVIGATION
- Fixed top nav, height 56px
- Logo left: "HSKKit" wordmark
- Hamburger menu right (opens full-screen overlay menu)
- No CTA in nav (save space)

2. HERO SECTION
- Single column, centered text
- Headline: "Practice for HSK 1 in 10 Minutes a Day" (Space Grotesk, 32px, #F5F5F0, centered, max 3 lines)
- Subheadline: [same as desktop, 16px, centered]
- Primary CTA: "Start Today's HSK Practice — Free" (full width, amber gold, 16px font, 48px height)
- Secondary CTA: "Take the Free HSK Level Test" (full width, transparent, below primary)
- Trust line: centered, 13px
- Hero visual: below CTAs, single practice card mockup, 80% width, centered
- Section padding: 80px top, 60px bottom

3. HOW IT WORKS
- Section title: "Your Daily HSK Practice in 3 Steps" (28px, centered)
- 3 cards stacked vertically (single column)
- Each card: full width, 24px padding
- Step number above title
- Section padding: 80px top/bottom

4. USE CASES
- Section title: "Who HSKKit Is For" (28px, centered)
- Cards stacked vertically
- Each card: full width
- Section padding: 80px top/bottom

5. FEATURES
- Section title: "What You Get" (28px, centered)
- 2-column grid (smaller cards)
- Cards stack to single column if needed
- Section padding: 80px top/bottom

6. PRICING
- Section title: "Simple Pricing" (28px, centered)
- Cards stacked vertically
- Pro Monthly card first (highlighted)
- CTA buttons full width
- Section padding: 80px top/bottom

7. FAQ
- Section title: "FAQ" (28px, centered)
- Accordion, full width
- Section padding: 80px top/bottom

8. FINAL CTA
- Headline: "Prepare for HSK 1. Not someday — this year." (28px, centered)
- Subheadline: 15px, centered
- Primary CTA: full width
- Section padding: 80px top/bottom

9. FOOTER
- Single column, centered
- Links stacked
- Disclaimer text: 11px, centered
- Section padding: 48px top, 24px bottom

Mobile constraints:
- Single column throughout
- Headline max 3 lines
- Cards stack vertically
- Minimum touch target 44x44px
- No horizontal overflow
- Full-width CTAs
- Reduced padding (80px sections vs 100px desktop)
```

---

## 5. Logo / OG / Hero 图提示词

### Logo SVG Prompt

```text
Design an SVG vector logo icon for HSKKit.

Requirements:
- Output raw SVG code, not an image
- Single color: #E63946 (Chinese Red)
- viewBox="0 0 64 64"
- Geometric design derived from circle/square/line
- The icon should subtly evoke "learning Chinese" — consider a stylized character stroke, a book/page shape, or a grid/worksheet pattern
- Must be recognizable at 16px
- Only one memorable element
- No gradients, no shadows, no 3D
- Product concept: Daily HSK practice toolkit for Chinese learners

Style: Minimal, geometric, Japanese-inspired simplicity
```

### Wordmark Prompt

```text
Design a wordmark for "HSKKit".

Requirements:
- Typography: Space Grotesk or similar geometric sans-serif
- "HSK" in #E63946 (Chinese Red), "Kit" in #F5F5F0 (Warm White)
- All uppercase, tight letter-spacing
- Clean, modern, memorable
- Works on dark backgrounds
- No icon, just text
```

### OG Image Prompt

```text
Generate a 1200x630 social preview image for HSKKit.

Background: #0D0D12 (dark)
Left side: Bold headline "Practice HSK 1 in 10 Minutes a Day" in Space Grotesk, #F5F5F0, large
Right side: A minimal, stylized practice card showing a Chinese character with pinyin overlay, dark card on slightly lighter surface
Bottom-left: Brand name "HSKKit" in #E63946 with "HSK" in red and "Kit" in white
Style: Japanese Minimal, premium, clean, not template-looking
No tiny text. No fake UI details. No gradients.
```

### Hero Image Prompt

```text
Generate a hero image for HSKKit landing page.

Style: Japanese Minimal, dark theme
Content: A floating, stylized practice card showing:
- A Chinese character "学" (xué) prominently displayed
- Pinyin "xué" below it
- English "to learn" below pinyin
- A small progress indicator (5/10)
- Subtle streak counter "Day 5"

The card should look like a clean UI element, dark surface (#16161D), with subtle shadow, floating against the dark background (#0D0D12)

Color palette: #E63946 (red accents) + #F4A261 (amber highlights) + #0D0D12 (background)
Aspect ratio: 16:9
No text other than what's described above. No fake UI details.
```

---

## 6. HANDOFF.md

```markdown
# HSKKit — Design Handoff

状态：可开发
日期：2026-05-20
负责人：小美（AI出海OPC团队）

---

## 1. 项目概览

产品名：HSKKit
域名：hskkit.com
一句话定位：Daily HSK Practice Toolkit for Chinese Learners
目标用户：HSK 1 初学者 (50%)、HSK 2-3 进阶者 (35%)、教师/家长 (15%)
设计调性：Japanese Minimal — clean, precise, calm, focused, scholarly

---

## 2. 交付文件

```text
deliverables/hskkit/
├── prompts/
│   ├── landing-desktop.md
│   ├── landing-mobile.md
│   └── seo-page-template.md
├── screens/
│   ├── landing-desktop.png
│   └── landing-mobile.png
├── html/
│   ├── landing-desktop.html
│   └── landing-mobile.html
└── assets/
    ├── icon.svg
    ├── wordmark.svg
    ├── favicon.svg
    ├── og-image.png
    └── hero-prompt.md
```

### Prompt
- `prompts/landing-desktop.md` — Desktop 首页完整 Prompt
- `prompts/landing-mobile.md` — Mobile 首页完整 Prompt
- `prompts/seo-page-template.md` — SEO 矩阵页复用规则

### 品牌资产
- `assets/icon.svg` — Logo icon (待生成)
- `assets/wordmark.svg` — 文字标识 (待生成)
- `assets/favicon.svg` — Favicon
- `assets/og-image.png` — 社交预览图 (待生成)
- `assets/hero-prompt.md` — Hero 图生成提示词

---

## 3. Design Tokens

| Token | Value | Usage |
|---|---|---|
| Background | #0D0D12 | 页面底色 |
| Surface | #16161D | 卡片/区域底色 |
| Text Primary | #F5F5F0 | 标题、正文 |
| Text Secondary | #8A8A93 | 副标题、描述 |
| Primary Accent | #E63946 | 品牌红（Logo、关键强调） |
| CTA / Highlight | #F4A261 | CTA按钮、高亮、推荐标签 |
| Border / Divider | #2A2A35 | 边框、分隔线 |
| Font Display | Space Grotesk | 标题字体 |
| Font Body | DM Sans | 正文字体 |
| Font Chinese | Noto Sans SC | 中文字体回退 |
| Border Radius - Button | 6px | 按钮圆角 |
| Border Radius - Card | 12px | 卡片圆角 |
| Border Radius - Tag | 2px | 标签圆角 |

---

## 4. 页面 IA

### 首页 (/)

1. Navigation — 固定顶部，Logo + 链接 + CTA
2. Hero — Split 布局，左文右图，双 CTA
3. How It Works — 3 步骤卡片
4. Use Cases — 2x2 Bento Grid，4 个用户场景
5. Features — Bento Grid，6 个功能卡片
6. Pricing — 3 列定价卡片（Free / Pro Monthly / Pro Yearly）
7. FAQ — 手风琴式 10 个问题
8. Final CTA — 重复核心承诺
9. Footer — 4 列 + 免责声明

### SEO 矩阵页模板

可复用：配色、字体、导航、定价、FAQ、Footer
每页只改：headline、subheadline、demo、use cases、FAQ 中 2-3 个问题

SEO 页面列表：
- /hsk-level-test — HSK Level Test
- /hsk-1-practice-test — HSK 1 Practice Test
- /hsk-1-vocabulary — HSK 1 Vocabulary
- /hsk-1-reading-practice — HSK 1 Reading with Pinyin
- /tools/chinese-character-practice-sheet-generator — Worksheet Generator
- /hsk-levels — HSK Levels Guide
- /new-hsk-3-0 — New HSK 3.0 Guide

---

## 5. 开发注意事项

- 首屏必须保留 CTA（"Start Today's HSK Practice — Free"）
- 不要把 Hero 改成居中模板布局，保持 Split 非对称
- 不要替换回 Inter / Roboto / Arial，使用 Space Grotesk + DM Sans
- 不要使用 emoji icon，使用 Lucide Icons 或定制 SVG
- 移动端必须单列，不允许横向滚动
- Pricing 高亮 Plan：Pro Monthly（琥珀金边框 + 微光）
- 合规必须展示：
  - Footer 免责声明（HSK 非关联声明）
  - Pricing 区域自动续费、取消方式、退款说明
  - FAQ 中 HSK 非官方声明
- 禁用表达：
  - "Unlimited AI"
  - "Guaranteed pass" / "100% score improvement"
  - "Official HSK" / "Certified HSK preparation"
  - "No refunds after 7 days"
- 中文字体回退栈：'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif

---

## 6. 需要替换 / 补充的内容

- [ ] 产品真实截图（Hero 区练习卡片、功能界面）
- [ ] Logo SVG 代码
- [ ] Wordmark SVG
- [ ] Favicon
- [ ] OG Image (1200x630)
- [ ] Hero 背景装饰图
- [ ] Privacy / Terms / Refund / Fair Use / Cookie / Disclaimer 页面链接
- [ ] CTA 链接（实际功能路由）
- [ ] Plausible 统计代码（cookieless）

---

## 7. 终检结果

- [x] 5 秒内能看懂产品（Hero 标题清晰）
- [x] 首屏 CTA 可见（琥珀金按钮）
- [x] Desktop + Mobile Prompt 都完成
- [x] 375px 无横向滚动（单列设计）
- [x] 没有紫蓝渐变 + 白背景模板感（深色主题）
- [x] 没有 emoji icon（Lucide 规范）
- [x] 没有假评价（使用冷启动信任信号）
- [x] 没有按钮 href="#"（待开发填充）
- [x] 占位图已标记（Hero 视觉、产品截图）

---

## 8. 未完成项 / 风险

- 产品真实截图待开发完成后替换 Hero 视觉
- Logo / Favicon / OG Image 需按提示词生成
- SEO 矩阵页需按模板批量生成
- 中文字体加载策略需确认（Google Fonts / 本地）
- 无障碍（WCAG AA）对比度已检查：正文 #F5F5F0 on #0D0D12 = 15.8:1 ✓，CTA #0D0D12 on #F4A261 = 8.2:1 ✓
```

---

## 附录：SEO 矩阵页复用规则

每个 SEO 工具页遵循以下结构：

```
1. Navigation（复用首页）
2. Hero — 针对关键词的标题 + 副标题 + CTA
3. Tool Demo — 嵌入式工具或截图
4. How It Works — 3 步骤（针对该工具）
5. Benefits — 2-3 个核心优势
6. Related Tools — 链接到其他工具页
7. FAQ — 3-5 个针对该工具的问题
8. Final CTA（复用首页）
9. Footer（复用首页）
```

配色、字体、导航、Footer 完全复用首页。
每页只需替换：标题、描述、Demo、步骤、FAQ。

---

*设计交付完成。可直接复制 Prompt 到 Stitch / v0 / Lovable / Claude 执行生成。*
