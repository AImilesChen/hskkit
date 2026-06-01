# HSKKit P0 Full — 设计 Handoff 文档

> 阶段：06-design  
> 项目：HSKKit.com  
> PRD 版本：v3.4  
> 上游文案：copywriting-p0full-rev1.md（已冻结，二次返修通过）  
> 交付人：小美（UI 设计）  
> 下游：小帅（前端实现）  
> 状态：DESIGN DONE — 可直接进入开发

---

## 1. 设计方向

### 1.1 视觉概念

P0 Full 在 P0 Lite 现有设计系统上扩展，保持视觉一致性，不引入新品牌色或新字体。新增两个工具页（Reading + Worksheet）和首页 Tools 区两个入口，设计语言与现有页面统一。

**核心原则：**
- 简洁优先：学习工具，减少视觉干扰
- 移动端优先：60%+ 流量来自移动设备
- 无障碍：对比度符合 WCAG AA
- 内容可读性优先：中文 + 拼音 + 英文三层文本需清晰分层

### 1.2 字体

| 用途 | 字体 | 回退 |
|------|------|------|
| 英文正文 / UI | Inter | system-ui, -apple-system, Segoe UI, Roboto |
| 中文汉字 | Noto Serif SC | STSong, serif |
| 英文标题（可选强调） | Source Serif 4 | Georgia, serif |

**注意：** 拼音使用 Inter（拉丁字符），声调符号需确保渲染正确。中文汉字使用 Noto Serif SC，与现有 `globals.css` 中 `.chinese-char` 定义一致。

### 1.3 颜色系统（继承 P0 Lite）

| Token | HEX | 用途 |
|-------|-----|------|
| `--color-primary` | `#2563EB` | 主按钮、链接、高亮、图标背景 |
| `--color-primary-dark` | `#1D4ED8` | hover 状态 |
| `--color-primary-light` | `#EFF6FF` | 浅色背景、hover 背景 |
| `--color-text-primary` | `#0F172A` | 标题、主文本 |
| `--color-text-secondary` | `#334155` | 正文 |
| `--color-text-muted` | `#64748B` | 辅助文本、标签 |
| `--color-border` | `#E2E8F0` | 卡片边框、分割线 |
| `--color-bg-base` | `#FFFFFF` | 页面背景 |
| `--color-bg-alt` | `#F8FAFC` | 交替区块背景 |
| `--color-accent-red` | `#C23A30` | 中文汉字强调色（与现有 `.chinese-char` 一致） |
| `--color-success` | `#10B981` | 正确/通过 |
| `--color-warning` | `#F59E0B` | 提示/警告 |
| `--color-error` | `#DC2626` | 错误/过长输入 |

**PRD 建议色 `#E74C3C` / `#2C3E50` 说明：** 现有系统已使用 `#2563EB` 为主色并在 P0 Lite 上线验证，P0 Full 不更换主色，保持品牌一致性。中文强调色 `#C23A30` 已接近 PRD 建议的中国红。

### 1.4 间距系统

| Token | 值 | 用途 |
|-------|-----|------|
| `--space-xs` | 4px | 紧凑间距 |
| `--space-sm` | 8px | 元素内间距 |
| `--space-md` | 16px | 组件内间距 |
| `--space-lg` | 24px | 组件间间距 |
| `--space-xl` | 32px | 区块内间距 |
| `--space-2xl` | 48px | 区块间距 |
| `--space-3xl` | 64px | 大区块间距 |
| `--space-section` | 80px (desktop) / 48px (mobile) | section 垂直 padding |

### 1.5 圆角

| Token | 值 | 用途 |
|-------|-----|------|
| `--radius-sm` | 8px | 按钮、输入框 |
| `--radius-md` | 12px | 卡片 |
| `--radius-lg` | 16px | 大卡片、modal |
| `--radius-full` | 9999px | CTA 按钮（pill shape） |

### 1.6 阴影

| Token | 值 | 用途 |
|-------|-----|------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.04)` | 默认按钮 |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.06)` | 卡片默认 |
| `--shadow-lg` | `0 12px 32px rgba(0,0,0,0.08)` | 卡片 hover、Study Path Block |
| `--shadow-primary` | `0 4px 12px rgba(37,99,235,0.08)` | 主色相关 hover |

---

## 2. 页面结构

### 2.1 页面清单

| 页面 | 路径 | 类型 | 说明 |
|------|------|------|------|
| Reading Practice | `/hsk-1-reading-practice` | 内容页 | 5 篇带拼音阅读故事 |
| Worksheet Generator | `/tools/chinese-character-practice-sheet-generator` | 工具页 | 田字格练习纸生成器 |
| 首页 Tools 更新 | `/` | 首页 | 新增 Reading + Worksheet 入口 |

### 2.2 /hsk-1-reading-practice 页面结构

```
┌─────────────────────────────────────────┐
│  SiteHeader (sticky, 继承现有)           │
├─────────────────────────────────────────┤
│  HERO                                   │
│  ├── H1: HSK 1 Reading Practice with    │
│  │        Pinyin                        │
│  ├── Subtitle                           │
│  ├── Primary CTA: Start Reading — Story 1│
│  └── Secondary CTA: Try HSK 1 Practice  │
│      Test                               │
├─────────────────────────────────────────┤
│  HOW IT WORKS (3 steps)                 │
│  ├── Step 1: Read with pinyin           │
│  ├── Step 2: Tap highlighted words      │
│  └── Step 3: Answer questions           │
├─────────────────────────────────────────┤
│  STORY LIST / NAVIGATION                │
│  ├── 5 story cards (horizontal scroll   │
│  │   on mobile, grid on desktop)        │
│  └── Each: title CN/EN, theme tag       │
├─────────────────────────────────────────┤
│  STORY SECTIONS (5 stories, stacked)    │
│  ├── Story Card 01: My Family           │
│  ├── Story Card 02: My Teacher          │
│  ├── Story Card 03: At the Restaurant   │
│  ├── Story Card 04: A Trip to Beijing   │
│  └── Story Card 05: My Friend           │
├─────────────────────────────────────────┤
│  WHY READ WITH PINYIN?                  │
│  ├── 3 benefit cards                    │
├─────────────────────────────────────────┤
│  CTA BANNER                             │
│  ├── "Ready to test your HSK 1 level?"  │
│  └── CTA: Take the Free HSK Level Test  │
├─────────────────────────────────────────┤
│  FAQ / SCHEMA                           │
│  ├── 5 FAQ items (accordion)            │
│  └── FAQPage JSON-LD (同首页实现)        │
├─────────────────────────────────────────┤
│  FOOTER DISCLAIMER                      │
│  └── 固定合规声明                        │
├─────────────────────────────────────────┤
│  SiteFooter (继承现有)                   │
└─────────────────────────────────────────┘
```

### 2.3 /tools/chinese-character-practice-sheet-generator 页面结构

```
┌─────────────────────────────────────────┐
│  SiteHeader (sticky, 继承现有)           │
├─────────────────────────────────────────┤
│  HERO                                   │
│  ├── H1: Chinese Character Practice     │
│  │        Sheet Generator               │
│  ├── Subtitle                           │
│  ├── Primary CTA: Generate Practice     │
│  │        Sheet (scroll to generator)   │
│  └── Secondary CTA: Browse HSK 1        │
│      Vocabulary                         │
├─────────────────────────────────────────┤
│  HOW IT WORKS (3 steps)                 │
│  ├── Step 1: Type Chinese text          │
│  ├── Step 2: Choose grid style          │
│  └── Step 3: Preview & Print            │
├─────────────────────────────────────────┤
│  GENERATOR TOOL                         │
│  ├── Input Section                      │
│  │   ├── Label + textarea              │
│  │   ├── Placeholder text              │
│  │   ├── Helper text                   │
│  │   └── Character counter + limit     │
│  │       warning                       │
│  ├── Grid Selector                      │
│  │   ├── Tian Zi Ge (default, selected)│
│  │   └── More coming soon (disabled)   │
│  ├── Action Buttons                     │
│  │   ├── Generate (primary)            │
│  │   ├── Reset (secondary)             │
│  │   └── Print (secondary, disabled    │
│  │       until generated)              │
│  └── Preview Section                    │
│      ├── Empty state                    │
│      ├── Generated state (Tian Zi Ge    │
│      │   grid with characters)          │
│      └── Print-optimized styles         │
├─────────────────────────────────────────┤
│  PRINT INSTRUCTIONS                     │
│  ├── A4/Letter, margins, background     │
│  │   graphics tip                       │
│  └── Browser print shortcut             │
├─────────────────────────────────────────┤
│  FAQ / SCHEMA                           │
│  ├── 5 FAQ items (accordion)            │
│  └── FAQPage JSON-LD                     │
├─────────────────────────────────────────┤
│  COMPLIANCE DISCLAIMER                  │
│  ├── 固定 Disclaimer (同其他页)          │
│  └── 额外 "非官方材料" 说明              │
├─────────────────────────────────────────┤
│  SiteFooter (继承现有)                   │
└─────────────────────────────────────────┘
```

### 2.4 首页 Tools 区更新（/）

现有首页 Block 6 "Popular Starting Points" 和导航结构保持不变，在 Tools 展示区域新增两个入口。

**当前 Tools 区（P0 Lite）：**
- HSK Level Check
- HSK 1 Vocabulary
- HSK 1 Sample Practice Questions

**P0 Full 新增（放在第 4、5 位）：**
- HSK 1 Reading with Pinyin
- Character Practice Sheets

**首页完整 Tools 矩阵（6 个）：**

| # | 标题 | 描述 | CTA | 路径 |
|---|------|------|-----|------|
| 1 | HSK Level Test | Find your HSK level in 5 minutes | Take Test | /hsk-level-test |
| 2 | HSK 1 Practice Test | 50+ HSK 1 questions, instant scoring | Start Practice | /hsk-1-practice-test |
| 3 | HSK 1 Vocabulary | 150 HSK 1 words with pinyin & English | Browse Words | /hsk-1-vocabulary |
| 4 | HSK 1 Reading | 5 original short stories with pinyin | Start Reading | /hsk-1-reading-practice |
| 5 | Practice Sheets | Generate printable Tian Zi Grids | Make a Sheet | /tools/chinese-character-practice-sheet-generator |
| 6 | HSK Levels Guide | Understand HSK 1–6 levels | Learn More | /hsk-levels |

**移动端优先级：** CTA 必须在 Study Path 前面（保持现有首页结构，Study Path 在 Hero 右侧/下方，CTA 在 Hero 主区域）。

---

## 3. 组件规范

### 3.1 Story Card（阅读故事卡片）

**用途：** 展示单篇阅读故事的完整内容。

**结构：**
```
StoryCard
├── StoryHeader
│   ├── StoryNumberBadge (01–05)
│   ├── TitleCN (中文标题)
│   ├── TitleEN (英文标题)
│   └── ThemeTag (主题标签，如 "Family")
├── VocabSection
│   ├── SectionLabel: "Target Vocabulary (8 words)"
│   └── VocabChips (8 个词汇芯片，横向 wrap)
├── ChineseTextBlock
│   ├── SectionLabel: "Chinese Text"
│   └── Paragraph (中文正文，汉字用 Noto Serif SC)
├── PinyinLine
│   ├── SectionLabel: "Pinyin"
│   └── Paragraph (拼音正文，Inter 字体，字号比中文小)
├── EnglishSummary
│   ├── SectionLabel: "English Summary"
│   └── Paragraph (英文摘要)
├── QuestionsBlock
│   ├── SectionLabel: "Comprehension Questions"
│   └── QuestionItem × 3
│       ├── QuestionText (Q: ...)
│       └── AnswerText (A: ...)
└── StudyTip
    ├── SectionLabel: "Study Tip"
    └── TipText (语法提示，可包含中文示例)
```

**样式规范：**

| 元素 | 样式 |
|------|------|
| 卡片容器 | bg-white, border `#E2E8F0`, radius 16px, padding 32px (desktop) / 20px (mobile) |
| StoryNumberBadge | w-10 h-10, bg `#2563EB`, text white, radius full, font-bold |
| TitleCN | text-2xl (24px), font-weight 700, color `#0F172A`, font-family Noto Serif SC |
| TitleEN | text-lg (18px), font-weight 600, color `#64748B`, margin-top 4px |
| ThemeTag | text-xs, font-weight 600, color `#2563EB`, bg `#EFF6FF`, px-2 py-0.5, radius full |
| SectionLabel | text-xs, font-weight 600, uppercase, tracking-wider, color `#64748B`, mb-3 |
| 中文正文 | text-lg (18px), line-height 1.8, color `#0F172A`, font-family Noto Serif SC |
| 拼音正文 | text-sm (14px), line-height 1.6, color `#64748B`, font-family Inter, letter-spacing 0.02em |
| 英文摘要 | text-base (16px), line-height 1.7, color `#334155`, font-style italic |
| QuestionText | text-base, font-weight 600, color `#0F172A`, mb-1 |
| AnswerText | text-base, color `#334155`, pl-4 (缩进) |
| StudyTip | bg `#FEF3C7` (浅黄), border-l-4 border `#F59E0B`, padding 16px, radius 8px |
| 卡片间距 | margin-bottom 48px (desktop) / 32px (mobile) |

### 3.2 Vocab Chip（词汇芯片）

**用途：** 在 Story Card 中展示目标词汇。

**结构：**
```
VocabChip
├── Hanzi (汉字)
├── Pinyin (拼音，小字)
└── Meaning (英文释义，tooltip/hover 显示)
```

**样式规范：**

| 元素 | 样式 |
|------|------|
| 容器 | inline-flex, flex-col, items-center, bg `#F8FAFC`, border `#E2E8F0`, radius 8px, padding 8px 12px, min-width 64px |
| Hanzi | text-lg, font-weight 600, color `#C23A30`, font-family Noto Serif SC |
| Pinyin | text-xs, color `#64748B`, mt-2px |
| Hover | bg `#EFF6FF`, border `#2563EB`, transform translateY(-1px), shadow-sm |
| Mobile tap | 同 hover 效果，点击后显示完整释义（tooltip 或展开） |

**交互说明：**
- Desktop：hover 显示 tooltip（汉字 + 拼音 + 英文释义）
- Mobile：tap 展开/收起释义（避免 tooltip 在触摸设备上的可用性问题）

### 3.3 Pinyin Line（拼音行）

**用途：** 在中文正文下方显示拼音，形成「汉字在上、拼音在下」的对应关系。

**样式规范：**

| 元素 | 样式 |
|------|------|
| 容器 | margin-top 16px, padding 16px, bg `#F8FAFC`, radius 8px |
| 拼音文本 | text-sm, color `#64748B`, font-family Inter, line-height 1.6 |
| 声调符号 | 确保字体支持（Inter 支持拉丁扩展，声调符号正常渲染） |

**重要：** 拼音默认显示，不可隐藏（P0 Full 范围）。未来版本（P1+）可考虑 toggle 切换。

### 3.4 Question Block（阅读理解题块）

**用途：** 展示 3 道阅读理解题及答案。

**样式规范：**

| 元素 | 样式 |
|------|------|
| 容器 | margin-top 24px |
| QuestionItem | padding 16px, border-bottom `#E2E8F0`, last-child border-none |
| Q 前缀 | color `#2563EB`, font-weight 700, margin-right 8px |
| A 前缀 | color `#10B981`, font-weight 700, margin-right 8px |
| 中文问题 | font-family Noto Serif SC |

### 3.5 Worksheet Input（字帖输入区）

**用途：** 用户输入中文字符并配置生成选项。

**结构：**
```
WorksheetInput
├── InputGroup
│   ├── Label: "Enter Chinese characters to practice"
│   ├── Textarea
│   │   ├── Placeholder: "例如：我爱学习汉语"
│   │   ├── maxLength: 200 (软限制，超长发警告)
│   │   └── rows: 3
│   └── HelperText: "Tip: Start with 5–10 characters..."
├── CharacterCounter
│   ├── "{current} / {max} characters"
│   └── 超过 50 字符时显示 warning 色
├── GridSelector
│   ├── Label: "Grid Style"
│   └── RadioGroup
│       ├── Tian Zi Ge (selected, default)
│       └── Mi Zi Ge / Others (disabled, "Coming soon")
└── ActionButtons
    ├── Generate (primary)
    ├── Reset (secondary)
    └── Print (secondary, disabled until generated)
```

**样式规范：**

| 元素 | 样式 |
|------|------|
| Label | text-sm, font-weight 600, color `#0F172A`, mb-2 |
| Textarea | w-full, padding 12px 16px, border `#E2E8F0`, radius 8px, font-family Noto Serif SC, text-lg, resize vertical, min-height 80px |
| Textarea focus | border `#2563EB`, ring-2 ring `#2563EB`/20 |
| Textarea error (超长) | border `#DC2626`, ring-2 ring `#DC2626`/20 |
| HelperText | text-xs, color `#64748B`, mt-2 |
| CharacterCounter | text-xs, color `#64748B`, mt-1, text-right |
| CharacterCounter warning | color `#F59E0B` (>50 chars), color `#DC2626` (>200 chars) |
| GridSelector | flex gap-3, flex-wrap |
| GridOption | padding 12px 16px, border 2px, radius 8px, cursor pointer |
| GridOption selected | border `#2563EB`, bg `#EFF6FF` |
| GridOption disabled | opacity 50, cursor not-allowed |
| ActionButtons | flex gap-3, mt-6, flex-wrap |

### 3.6 Tian Zi Ge Preview（田字格预览）

**用途：** 展示生成的田字格练习纸。

**结构：**
```
TianZiGePreview
├── EmptyState (未生成时)
│   ├── Icon (Grid placeholder)
│   └── Text: "Enter characters and click Generate..."
└── GeneratedState
    ├── PreviewHeader
    │   ├── Title: "Practice Sheet Preview"
    │   └── PrintHint
    └── GridContainer
        └── GridRow × N
            └── TianZiGeCell × M (每行 8–10 格)
                ├── Outer square (田字格外框)
                ├── Horizontal center line (虚线)
                ├── Vertical center line (虚线)
                └── Character (用户输入的汉字，居中)
```

**田字格 SVG/CSS 规范：**

| 元素 | 样式 |
|------|------|
| 外框 | 1px solid `#0F172A`, 正方形 |
| 横中线 | 1px dashed `#94A3B8` |
| 竖中线 | 1px dashed `#94A3B8` |
| 格子尺寸 | 80px × 80px (desktop), 60px × 60px (mobile) |
| 格子间距 | 8px |
| 每行格子数 | 8 (desktop), 4 (mobile) |
| 字符 | font-family Noto Serif SC, font-size 36px (desktop) / 28px (mobile), color `#0F172A`, 居中 |
| 容器 | bg white, padding 24px, border `#E2E8F0`, radius 12px |

**打印优化：**
- 使用 `@media print` 隐藏所有 UI 元素（header、footer、按钮、说明文字）
- 只打印 GridContainer
- 格子边框使用 `border: 1px solid #000`（确保打印可见）
- 页面设置：A4/Letter, margin minimum
- 背景图形必须开启（grid lines 是内容的一部分）

### 3.7 CTA Button（继承现有）

继续使用现有按钮系统：

| 变体 | 样式 |
|------|------|
| Primary | bg `#2563EB`, text white, radius full, padding 14px 28px, hover bg `#1D4ED8` |
| Secondary | bg transparent, text `#2563EB`, border 1.5px `#2563EB`, radius full |
| Ghost | text `#2563EB`, font-weight 600, 带 → 箭头 |

### 3.8 FAQ Accordion（继承现有）

直接使用首页现有 FAQAccordion 组件，样式保持一致。

---

## 4. 关键状态

### 4.1 Reading 页面状态

| 状态 | 触发 | 视觉表现 |
|------|------|----------|
| 默认 | 页面加载 | 所有 Story Cards 展开显示，用户滚动浏览 |
| VocabChip hover | mouseenter | bg 变 `#EFF6FF`，border 变 `#2563EB`，显示 tooltip |
| VocabChip tap | mobile touch | 同 hover 效果，点击后展开释义 |
| StoryCard focus | keyboard nav | focus-visible ring `#2563EB` |
| CTA hover | mouseenter | bg 变深，shadow 增强 |
| CTA active | mousedown | scale 0.98 |

### 4.2 Worksheet 页面状态

| 状态 | 触发 | 视觉表现 |
|------|------|----------|
| Empty | 未输入或刚进入 | Preview 区显示 EmptyState 插画/图标 |
| Input focus | textarea focused | border `#2563EB`, ring 出现 |
| Input valid | 有内容且 ≤200 字符 | Generate 按钮 enabled |
| Input warning | >50 字符 | Counter 变黄色，helper text 提示分页 |
| Input error | >200 字符 | Counter 变红色，border 变红，Generate 仍可用但提示分页 |
| Generating | 点击 Generate | 按钮显示 spinner，Preview 区 loading skeleton |
| Generated | 生成完成 | Preview 区显示 Tian Zi Ge grid，Print 按钮 enabled |
| Print mode | 点击 Print 或 Ctrl+P | `@media print` 激活，只打印 grid |
| Reset | 点击 Reset | 清空 input，回到 Empty 状态 |
| Grid selected | 选择 Tian Zi Ge | 选项高亮，其他 disabled |

### 4.3 首页 Tools 区状态

| 状态 | 触发 | 视觉表现 |
|------|------|----------|
| Card hover | mouseenter | shadow 增强，border 变 `#DBEAFE` |
| Card active | mousedown | scale 0.98 |
| Mobile | <640px | 单列布局，卡片堆叠 |

---

## 5. 前端 Handoff

### 5.1 路由

| 路由 | 文件路径 | 说明 |
|------|----------|------|
| `/hsk-1-reading-practice` | `src/app/hsk-1-reading-practice/page.tsx` | 新页面 |
| `/tools/chinese-character-practice-sheet-generator` | `src/app/tools/chinese-character-practice-sheet-generator/page.tsx` | 新页面 |
| `/` | `src/app/page.tsx` | 更新 Tools 区 |

### 5.2 交互说明

**Reading 页面：**
1. 页面加载时 5 个 Story Cards 全部展开，按顺序垂直排列
2. 每个 Story Card 内部结构固定，不可折叠（P0 Full 范围）
3. VocabChips 横向排列，wrap 换行
4. 中文正文和拼音正文上下对应，形成视觉关联
5. Comprehension Questions 的 Q/A 使用不同颜色前缀区分
6. Study Tip 使用左侧黄色边框的 callout 样式
7. 页面内锚点：Story List 可点击跳转到对应 Story Card

**Worksheet 页面：**
1. 输入框支持直接输入中文（调用系统输入法）
2. 实时字符计数，超过 50 字符显示黄色警告，超过 200 显示红色警告
3. Generate 按钮：将输入字符渲染到 Tian Zi Ge grid 中
4. 每个字符占一格，从左到右、从上到下排列
5. 字符数超过每行容量自动换行
6. Print 按钮：调用 `window.print()`，CSS 控制打印样式
7. Reset 按钮：清空输入和预览
8. 软限制：每日 3 次生成（通过 localStorage 计数，P0 Full 范围）

**首页更新：**
1. 在现有 "Popular Starting Points" 区块中新增两个卡片
2. 保持现有 3 列网格（desktop），2 列（tablet），1 列（mobile）
3. 卡片样式与现有完全一致
4. 新增卡片放在第 4、5 位（HSK 1 Reading、Practice Sheets）

### 5.3 埋点建议

| 事件 | 触发时机 | 页面 |
|------|----------|------|
| `reading_start` | 进入 Reading 页面 | /hsk-1-reading-practice |
| `reading_story_view` | Story Card 进入视口（IntersectionObserver） | /hsk-1-reading-practice |
| `reading_vocab_tap` | 点击/悬停 VocabChip | /hsk-1-reading-practice |
| `worksheet_generate` | 点击 Generate | /tools/... |
| `worksheet_print` | 点击 Print 或调用打印 | /tools/... |
| `worksheet_reset` | 点击 Reset | /tools/... |
| `tool_card_click` | 点击首页 Tools 卡片 | / |

### 5.4 实现注意事项

1. **中文渲染：** 确保 Noto Serif SC 已加载（layout.tsx 中已引入 Google Fonts）
2. **拼音渲染：** 声调符号使用组合字符，Inter 字体支持良好
3. **田字格实现：** 推荐用 CSS grid + border 实现，比 SVG 更轻量；打印时需确保边框可见
4. **打印样式：** 使用 `@media print` 隐藏导航、按钮、说明文字，只保留 grid
5. **移动端触摸：** VocabChip 的 tooltip 在移动端改为 tap 展开，避免 hover 不可用
6. **SEO：** 两个新页面都需要完整的 Meta title/description/OG tags
7. **Schema：** FAQ 区使用 FAQPage JSON-LD（同首页实现）
8. **性能：** Reading 页面内容较长，考虑使用 `next/dynamic` 懒加载非首屏 Story Cards
9. **无障碍：**
   - 所有交互元素有 focus-visible 样式
   - FAQ accordion 使用 button + aria-expanded
   - 颜色不单独传递信息（红绿色盲友好）
10. **字符限制：** Worksheet 输入建议 5–10 字符/页，但技术上支持更多（自动分页）

### 5.5 数据文件

**Reading 数据：**
- 建议存储在 `src/data/reading-hsk1.json`
- 结构：数组，每项包含 titleCN, titleEN, theme, targetVocab[], chineseText, pinyinText, englishSummary, questions[], studyTip

**Worksheet 配置：**
- 无需静态数据文件
- 用户输入存储在组件 state 中
- 生成次数限制存储在 localStorage：`hskkit_worksheet_count` + `hskkit_worksheet_date`

---

## 6. 不得删除 SEO/合规内容

以下内容由上游冻结，设计不得删除或改写：

| 内容 | 位置 | 说明 |
|------|------|------|
| H1 | 每页 Hero | SEO 核心，不可删改 |
| SEO Title | Meta | 不可删改 |
| Meta Description | Meta | 不可删改 |
| FAQ 问答 | FAQ Section | Schema 结构化数据直接引用 |
| Disclaimer | 每页 Footer | 合规必需 |
| 5 篇 Reading 中文正文 | Story Cards | 汉字必须在 HSK1 词表内，不可替换 |
| 5 篇 Reading 拼音正文 | Story Cards | 声调符号不可丢失 |
| 5 篇 Reading 英文释义 | Story Cards | 学习者依赖准确翻译 |
| Comprehension Q&A | Story Cards | 教育内容正确性 |
| Worksheet 合规说明 | Worksheet 页面 | "非官方材料 / 不保证考试结果" |

---

## 7. 设计验收自检清单

- [x] 设计方向与 P0 Lite 现有系统一致，无新品牌色/字体
- [x] 所有冻结文案（H1/SEO/FAQ/Disclaimer/Reading 正文）有设计落位，未被删除
- [x] 5 篇 Reading 的汉字、拼音、英文释义有明确视觉层级
- [x] VocabChip hover/tap 交互有设计说明
- [x] Pinyin 默认显示，不压过中文
- [x] Tian Zi Ge 网格有精确尺寸规范
- [x] 打印样式有 `@media print` 说明
- [x] Worksheet 空态/生成态/打印态/超长提示态全部覆盖
- [x] 移动端单列布局有说明
- [x] 首页 Tools 区新增入口不影响现有 CTA 优先级
- [x] 无障碍：focus-visible、aria-expanded、颜色不单独传信息
- [x] 埋点事件清单已提供
- [x] 前端可直接实现，无模糊概念

---

## 8. 下游交接摘要

### 当前结论
- 状态：DESIGN DONE
- 一句话结论：P0 Full 两个新页面（Reading + Worksheet）和首页 Tools 更新设计已完成，基于 P0 Lite 现有设计系统扩展，前端可直接实现。

### 关键输入
- PRD v3.4 §16 设计原则
- copywriting-p0full-rev1.md（已冻结）
- P0 Lite 现有设计系统（globals.css + page.tsx + site-header.tsx + site-footer.tsx）

### 本阶段交付物
- 文件：`/root/projects/hskkit/docs/design-p0full-handoff.md`
- 核心判断：
  - 不引入新设计系统，在现有系统上扩展
  - Reading 页面核心挑战是「中文+拼音+英文」三层文本的可读性分层
  - Worksheet 页面核心挑战是浏览器打印版的可用性
  - 首页 Tools 区新增 2 个入口，保持现有布局结构

### 已确认项
- [x] 颜色系统继承 P0 Lite
- [x] 字体系统继承 P0 Lite
- [x] 组件规范具体到 px 值
- [x] 所有关键状态有视觉说明
- [x] 打印样式有详细规范

### 待确认项
- [ ] 小帅确认田字格用 CSS grid 还是 SVG 实现
- [ ] 小帅确认 Reading 页面是否需要懒加载/虚拟滚动（5 篇内容较长）
- [ ] 小帅确认 Worksheet 每日 3 次限制的 localStorage 实现方案

### 风险
- P0 (无): 当前阶段无支付、无 AI、无账号，风险极低
- P1 (低): 若 P1 接入 PDF 生成，Worksheet 打印样式可能需要调整
- P1 (低): 若未来增加 pinyin toggle，Reading 页面需要额外状态设计

### 给下游的最小必要信息
- **下一阶段：** 前端实现（小帅）
- **必须读取：**
  - 本文档完整内容
  - copywriting-p0full-rev1.md（冻结文案）
  - P0 Lite 现有代码（globals.css, page.tsx, site-header.tsx, site-footer.tsx）
- **不能假设：**
  - 不能改动冻结文案的任何文字内容
  - 不能删除 FAQ/Disclaimer/SEO meta
  - Reading 的汉字不可替换（HSK1 词表闭环）
- **建议启动 Prompt（给小帅）：**
  ```
  请基于 design-p0full-handoff.md 和 copywriting-p0full-rev1.md 实现 HSKKit P0 Full。
  设计系统继承 P0 Lite（globals.css），不引入新颜色/字体。
  内容已冻结，H1/SEO/FAQ/Disclaimer/Reading 正文不可改动。
  优先实现移动端布局，确保 WCAG AA 对比度。
  ```

---

[DONE]
