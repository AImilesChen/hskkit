# HSKKit 前八步 P0 唯一验收矩阵

> 状态：FROZEN FOR IMPLEMENTATION  
> 责任人：亦菲（亲自执行，禁止转派）  
> 产品真源：`docs/product/HSKKit-PRD-v4.0-owner-review.md`  
> 设计真源：`docs/stage07/baseline/stage06-design-truth/metadata/canonical-manifest.json`（54 个 adopted 屏）  
> 生产基线：`docs/stage07/evidence/p0-baseline.json`  
> 边界：只做前八步 P0；第9步、P1、P2、Mock、付费、PDF、导出不在本轮。

## 1. 唯一判定规则

1. “代码存在”“路由 200”“提交已合并”均不等于完整上线。
2. 完整上线必须同时满足：正式数据合同、可发现入口、真实用户闭环、失败恢复、桌面端与 390×844 移动端验收、生产 URL 回读。
3. HSK 2.0 与 HSK 3.0 必须显式隔离；旧 HSK 1–5 数据不得自动映射或冒充 HSK 3.0。
4. Level 1–9 的正式内容必须具备：`standard/releaseId/releaseVersion/source/license/qaStatus/publishStatus`；未通过内容门时必须返回明确 gap，不展示伪完整数量。
5. HSK 7–9 使用统一高级路径，不虚构三个互相独立的官方考试级别。
6. Stage 06 的 superseded/deprecated 屏一律不实现；只采用 canonical manifest 中 `implementation_status=ADOPTED` 的屏。
7. 全部 P0 生产门禁通过后才允许部署 GO、创建回退标签；任一 P0 阻塞时不得打“已完成”标签。

## 2. 基线事实

- Git 基线：分支 `stage07-content-foundation`，HEAD `5c0d4176d66e6362d81381d1dbde89cf6161c520`。
- 正式内容目录：`contentAssets=0`，`audioAssets=0`；当前不存在可被称为“完整 HSK 3.0 内容库”的发布包。
- `/levels`、`/vocabulary/1`、`/vocabulary/9`：生产 200，但词汇页仅为样例级展示，不代表完整覆盖。
- `/placement`、`/placement/result/:id`、`/practice/:level/:skill`：生产 404。
- `/today`、`/mistakes`、`/account`：生产 200，已有基础能力，需接入新版 Session/Attempt 主链并回归。
- `/hsk-3-0`、`/hsk-2-0-vs-3-0`：生产 404。
- 旧首页仍以传统 HSK 1–5 为主要可见路径，是用户仍看到 HSK5 的直接原因。

## 3. Requirement 验收矩阵

### P0-01 内容与标准门

- **Requirement**：正式 HSK 3.0 Level 1–9 内容和音频只从版本化发布包读取；内容不足时返回 gap。
- **代码/数据**：`src/lib/content/catalog.json`、`catalog.ts`、`repository.ts`、内容 API。
- **设计屏**：`/levels` 24/25，`/hsk-3-0` 22/23，`/hsk-2-0-vs-3-0` 20/21。
- **当前状态**：技术底座存在；正式目录为空；不完整。
- **本轮实现**：发布门校验、标准隔离、来源/许可/QA 校验、1–9 gap 状态、隐藏误导性样例数量。
- **通过标准**：校验脚本全绿；Level 1–9 均返回正式内容或结构化 gap；页面不宣称完整1–9。

### P0-02 首页与导航统一

- **Requirement**：首页主路径迁移到 HSK 3.0 学习路径；Placement、Levels、Practice、Today 可发现；旧体系显式标注。
- **代码/数据**：`src/app/page.tsx`、`src/app/site-header.tsx`、Footer、sitemap。
- **设计屏**：HOME 02/03。
- **当前状态**：生产首页仍以 HSK 1–5 为核心；不完整。
- **本轮实现**：只改入口和状态文案，不删除旧 SEO 页面，不虚构词数/可用性。
- **通过标准**：桌面/移动首屏可进入 Placement 与 Levels；所有 CTA href 真实；无横向越界；旧标准标签明确。

### P0-03 Levels 1–9

- **Requirement**：Level 1–6 与统一高级 Level 7–9 路径可浏览；每级有内容状态和下一步。
- **代码/数据**：`/levels`、`/vocabulary/:level`、内容仓库。
- **设计屏**：Levels 24/25。
- **当前状态**：路由存在，但样例内容被误当成 published study words；部分完成。
- **本轮实现**：1–9统一卡片、正式/gap状态、标准说明、Placement/Practice 下一步。
- **通过标准**：1–9均可发现；gap 不显示词条；7–9说明统一高级路径；键盘和触控通过。

### P0-04 Placement 主入口与结果闭环

- **Requirement**：开始、答题、恢复、提交、结果、低置信度降级、重测、进入学习计划。
- **代码/数据**：`/placement`、`/placement/result/:id`、版本化 Session/Attempt API、D1 状态。
- **设计屏**：Placement 36/37，Result 38/39。
- **当前状态**：生产 404；未上线。
- **本轮实现**：内部版本化诊断题；每维度证据不足时必须明确低置信度，不给伪精确结论。
- **通过标准**：匿名用户可完成；刷新恢复；重复提交幂等；结果 URL 可回读；可重测；可跳 Practice/Planner。

### P0-05 新版 Practice Session/Attempt

- **Requirement**：`/practice/:level/:skill` 具备版本化题集、逐题作答、恢复、提交、反馈和结果。
- **代码/数据**：Practice 页面、Session/Attempt API、`learning/domain.ts`、`engine.ts`、`storage.ts`。
- **设计屏**：Practice 42/43。
- **当前状态**：目标路由生产 404；旧 Practice 不能冒充；未上线。
- **本轮实现**：只支持有 QA 题目的 level/skill；无题返回 gap；Attempt 记录 questionVersion、答案、结果、时间。
- **通过标准**：刷新恢复；幂等提交；错误可重试；无题不生成空会话；桌面/移动完整答题流通过。

### P0-06 Mistakes → SRS

- **Requirement**：错误答案进入 Mistakes，并可加入 SRS/Review；重复动作幂等。
- **代码/数据**：`/mistakes`、`/review`、学习存储与 API。
- **设计屏**：Mistakes 30/31，Review 47/48。
- **当前状态**：基础页 200，但未接新版 Practice Attempt；部分完成。
- **本轮实现**：从 Practice Attempt 派生错题；加入复习；重复提交不重复计数。
- **通过标准**：错题产生→Mistakes可见→加入SRS→Review可见→正确复习后更新状态。

### P0-07 Today/SRS 主链

- **Requirement**：Today 显示真实下一步、待复习、继续学习和恢复状态。
- **代码/数据**：`/today`、TodayPanel、学习 API/存储。
- **设计屏**：Today 49/50。
- **当前状态**：基础页上线；未接 Placement/Practice 新链；部分完成。
- **本轮实现**：Placement 推荐与 Practice/SRS 状态接入 Today；保留现有可用能力。
- **通过标准**：新用户空态、完成Placement、Practice中断、存在复习项、API错误五种状态通过。

### P0-08 账号与同步

- **Requirement**：匿名可用；登录后服务端同步；冲突、离线、失败可恢复；不丢本地进度。
- **代码/数据**：`/account`、`/api/v1/learning`、D1 学习状态。
- **设计屏**：Account 06/07，Account Data 08/09。
- **当前状态**：基础同步存在；独立 `/login` `/register` 未定义实现；部分完成。
- **本轮实现**：沿用现有账号/同步，不新造认证系统；补新版 Session/Attempt 合并和冲突提示。
- **通过标准**：匿名→账号同步不丢数据；两端合并确定；失败可重试；退出后本地状态符合合同。

## 4. 批次与硬闸门

1. **Batch 0**：本矩阵、正式内容统计、生产基线；不部署、不打标签。
2. **Batch 1**：内容门、首页/Header、Levels、标准说明。
3. **Batch 2**：Placement 主入口、会话、结果。
4. **Batch 3**：Practice Session/Attempt、Mistakes。
5. **Batch 4**：Today/SRS、账号同步回归。
6. **Batch 5**：Unit/Integration/E2E/Typecheck/Build、独立复审、生产部署、桌面+390×844 QA。
7. **Batch 6**：全部生产 GO 后创建并远端验证独立回退标签。

## 5. 明确排除

- Mock `/mock/:band`
- 定价、Checkout、Stripe
- PDF Packs、Exports
- 通用 AI 聊天页
- Planner 的 P1 扩展
- HSK 7–9 高级 Mock、正式 PDF
- 未确认来源/许可/QA 的完整 HSK 3.0 词库或题库
- 任何无关重构、改品牌、换模型、改账号体系

## 6. 最终 GO 条件

- [ ] 正式内容门与标准隔离全绿
- [ ] 首页/Header/Levels 生产可发现且不误导
- [ ] Placement 完整真实流通过
- [ ] Practice Session/Attempt/Mistakes/SRS 完整真实流通过
- [ ] Today 与账号同步主链通过
- [ ] Typecheck、Unit、Integration、E2E、Build 全绿
- [ ] 所有 P0 adopted 屏桌面与 390×844 移动端通过
- [ ] 无横向越界；触控区≥44px；焦点/键盘可用
- [ ] 生产 URL、API、错误恢复和数据回读通过
- [ ] 独立复审结论 GO
- [ ] 创建并远端验证回退标签
