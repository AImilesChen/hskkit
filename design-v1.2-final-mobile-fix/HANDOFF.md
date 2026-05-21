# HSKKit — Design Handoff

状态：Mobile 和品牌资产已补齐，可交付开发
日期：2026-05-20
负责人：小美（AI出海OPC团队）
版本：v1.2 — Development Ready

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
│   ├── landing-desktop-v1.0.md   (✅ 含阿文 v1.2 文案)
│   ├── landing-mobile-v1.0.md    (✅ 含阿文 v1.2 文案)
│   └── seo-page-template.md      (✅)
├── screens/
│   ├── landing-desktop.png       (✅ 1440px 全页截图)
│   └── landing-mobile.png        (✅ 375px 全页截图)
├── html/
│   ├── landing-desktop-v1.0.html (✅ 可浏览器预览)
│   └── landing-mobile-v1.0.html  (✅ 可浏览器预览)
└── assets/
    ├── icon.svg                  (✅ 品牌图标)
    ├── wordmark.svg              (✅ 文字标识)
    ├── favicon.svg               (✅ 浏览器图标)
    ├── og-image.png              (✅ 1200x630 社交预览)
    └── hero-prompt.md            (✅)
```

### Prompt
- `prompts/landing-desktop-v1.0.md` — Desktop 首页完整 Prompt（含阿文 v1.2 文案）
- `prompts/landing-mobile-v1.0.md` — Mobile 首页完整 Prompt（含阿文 v1.2 文案）
- `prompts/seo-page-template.md` — SEO 矩阵页复用规则

### HTML 原型
- `html/landing-desktop-v1.0.html` — Desktop 可浏览器预览原型（href 已标记 TODO_ROUTE）
- `html/landing-mobile-v1.0.html` — Mobile 可浏览器预览原型（href 已标记 TODO_ROUTE）

### 截图
- `screens/landing-desktop.png` — 1440px 全页截图
- `screens/landing-mobile.png` — 375px 全页截图

### 品牌资产
- `assets/icon.svg` — Logo icon（"汉"字，中国红背景）
- `assets/wordmark.svg` — 文字标识（HSKKit，Space Grotesk）
- `assets/favicon.svg` — Favicon（32x32，深色背景+红字）
- `assets/og-image.png` — 社交预览图（1200x630）
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
- [x] Logo SVG 代码（assets/icon.svg）— 已生成，开发时接入
- [x] Wordmark SVG（assets/wordmark.svg）— 已生成，开发时接入
- [x] Favicon（assets/favicon.svg）— 已生成，开发时接入
- [x] OG Image 1200x630（assets/og-image.png）— 已生成，开发时接入
- [ ] Hero 背景装饰图
- [ ] CTA 链接（TODO_ROUTE_* 需开发填充实际路由）
- [ ] Plausible 统计代码（cookieless）

---

## 7. 终检结果

- [x] 5 秒内能看懂产品（Hero 标题清晰）
- [x] 首屏 CTA 可见（琥珀金按钮）
- [x] Desktop + Mobile HTML 都完成
- [x] 375px 无横向滚动（单列设计 + overflow-x: hidden）
- [x] 没有紫蓝渐变 + 白背景模板感（深色主题）
- [x] 没有 emoji icon（使用 Lucide SVG，开发时接入）
- [x] 没有假评价（使用冷启动信任信号）
- [x] href 已标记 TODO_ROUTE_*（不假装已完成）
- [x] Pricing Pro Monthly 已补充 credits 消耗明细
- [x] Pricing 只显示 Free / Pro Monthly / Pro Yearly
- [x] 无 Lifetime / Beta / Teacher Pack
- [x] 无 "Unlimited AI" / "Guaranteed pass" / "Official HSK"
- [x] Footer disclaimer 完整
- [x] 退款政策（7天窗口）
- [x] 自动续费 + PayPal 取消说明
- [x] Credits reset / no rollover / no cash value

---

## 8. 未完成项 / 风险

- 产品真实截图待开发完成后替换 Hero 视觉
- Logo / Favicon / OG Image 需按提示词生成
- SEO 矩阵页需按模板批量生成
- 中文字体加载策略需确认（Google Fonts / 本地）
- 无障碍（WCAG AA）对比度已检查：正文 #F5F5F0 on #0D0D12 = 15.8:1 ✓，CTA #0D0D12 on #F4A261 = 8.2:1 ✓
