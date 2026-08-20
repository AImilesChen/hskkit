# HSKKit Stage 07 功能差异矩阵

> 检查基线：Git `main` / `129ec000a74ac26215524adafc766b6d17347304`
>
> 本文件只记录现状、目标合同和差异，不修改功能、不部署。

## 1. 状态定义

- **已有且保留**：现有用户能力可继续存在，不因 Stage 07 重写而删除；仍须在相关批次做回归。
- **已有但需修改**：已有页面或局部交互，但路由、数据、权限、状态、设计或验收不满足 v4.0。
- **尚未开发**：当前代码、API、表结构和配置中没有该能力。
- **当前禁用**：范围仍在 P0/P1/P2，但在对应硬门关闭前不得对外开放或创建真实副作用。

“已有页面”不等于“目标能力已完成”；Stitch Screen 的 `ADOPTED` 只代表设计真源已采用，不代表代码已实现。

## 2. 当前实现盘点

### 2.1 已有页面路由（22）

- 公共首页/说明：`/`、`/hsk-levels`、`/new-hsk-3-0`。
- 传统词汇：`/hsk-1-vocabulary` 至 `/hsk-6-vocabulary`；其中 HSK 6 是 planned 占位。
- 传统练习：`/hsk-1-practice-test` 至 `/hsk-5-practice-test`。
- 自测：`/hsk-level-test`。
- 阅读：`/hsk-1-reading-practice`。
- 工具：`/worksheet`、`/tools/chinese-character-practice-sheet-generator`。
- 法律/联系：`/privacy-policy`、`/terms-of-service`、`/disclaimer`、`/contact`。

### 2.2 当前数据与运行能力

- `src/lib/data/hsk1.json` 至 `hsk5.json`：每级当前实际 50 道传统练习题，共 250 道；`src/lib/data/index.json` 的旧 count/total 元数据与实际文件不一致，不能作为新底座真源。
- `src/lib/data/level_test.json`：18 道传统 HSK 1–6 自测题。
- `src/lib/data/hsk1_vocab.json`：150 个传统 HSK 1 词条；只有 HSK 1 使用完整 JSON 词表。
- HSK 2–5 词汇页只含页面内少量 `sampleWords`，不是完整可查询词库。
- `src/lib/data/reading-hsk1.json`：5 篇 HSK 1 阅读内容。
- Practice 使用前端内存状态；结束时仅把摘要、最多 5 个错题 ID 写入 `localStorage`，TTL 7 天。
- Level Test 使用前端内存状态；无可恢复 Attempt、私有结果路由或服务端提交。
- Worksheet/打印工具已有浏览器生成和打印能力，可保留；专用 PDF 下载仍是 planned。
- API route：0。
- 数据库 migration/schema：0。
- Cloudflare binding：无 D1、R2、KV、Queue；只有 Assets、Images 和 Worker self-reference。
- Auth、账号、同步、Stripe、订单、权益、Webhook、AI、受控音频、导出/PDF Job：均不存在。
- 自动化 test/spec：0。

## 3. 页面—API—数据—Stitch—验收对应矩阵

### M01 首页与学习入口（P0）

- **状态：已有但需修改**
- 当前页面：`/` 已有；内容仍以传统 HSK 1–5、HSK 6 planned、旧 `/hsk-level-test` 等为主。
- 目标页面：`/`。
- 目标 API：`GET/POST /api/v1/daily-sessions`（只有进入已有进度/今日学习状态时需要）。
- 目标数据：`DailySession`、`AccessPolicy`、`AuditEvent`。
- Stitch：Desktop `b389ec9adafa46318c151a1d6f124834`；Mobile `b309edcf1cd2427ba0bd542be2419ac1`。
- 验收：HSK 3.0 学习路径；Placement/Levels/Dictionary/Today 入口；游客、已有进度、无 session、loading、sync conflict 均有明确状态；公开可索引；Desktop 和 `390×844` Mobile 无越界，主色 `#2563EB`。

### M02 等级与标准说明（P0）

- **状态：已有但需修改**
- 当前页面：`/hsk-levels`、`/new-hsk-3-0`；传统 HSK 1–6 结构，目标 canonical 路由未实现。
- 目标页面：`/levels`、`/hsk-3-0`、`/hsk-2-0-vs-3-0`。
- 目标 API：`GET /api/v1/catalog/words`。
- 目标数据：`ContentAsset`，必须有 `standard_version`、`level_band`、`content_version`、QA/发布状态。
- Stitch：
  - `/levels` Desktop `0ce5274a69be4d6aaf889c85a928b046`；Mobile `0e7b4f3014bf47dc9ea49f8129a8efba`。
  - `/hsk-3-0` Desktop `cbd34ca6970c4c57ab6570c7462a50d9`；Mobile `84c137a517484a52b332b6c456ac3813`。
  - `/hsk-2-0-vs-3-0` Desktop `2b0a75fade1c4cb9a282d21b8048a73b`；Mobile `87c9b49163724639b3a0330df4de0da4`。
- 验收：HSK 2.0 与 HSK 3.0 硬隔离；Level 1–9 信息准确；标准更新/内容撤回状态存在；真实 canonical、BreadcrumbList 与内部链接正确。

### M03 分级词汇与词条（P0）

- **状态：已有但需修改**
- 当前页面：`/hsk-1-vocabulary` 有 150 词搜索/Flashcards；HSK 2–5 只有少量示例；`/hsk-6-vocabulary` 是占位；路由体系与 HSK 3.0 目标不同。
- 目标页面：`/vocabulary/:level`、`/word/:slug`。
- 目标 API：`GET /api/v1/catalog/words`；`POST /api/v1/content/:id/reports`；音频启用后使用 `/api/v1/audio/:assetId/playback`。
- 目标数据：`ContentAsset`、`AudioAsset`、`ContentReport`、`AccessPolicy`。
- Stitch：
  - `/vocabulary/:level` Desktop `7729dae23a204d288fa6a8472b342040`；Mobile `41ae8e6befde4dc0a0b6ad1a5a2d2b6f`。
  - `/word/:slug` Desktop `156a934545074bcb97df57c4667dd759`；Mobile `17852655874f4be6bdcfe03c094e0902`。
- 验收：Level 1–9 版本化查询；只返回 published 内容；搜索空结果、真实 404、withdrawn/410、音频 unavailable 均可达；达标词条可索引，未达标/撤回不得生成薄页或进入 sitemap；报告幂等。

### M04 字典与汉字（P0）

- **状态：尚未开发**
- 当前页面/API/表：无。
- 目标页面：`/dictionary`、`/character/:hanzi`。
- 目标 API：`GET /api/v1/catalog/words`、`GET /api/v1/catalog/characters/:hanzi`。
- 目标数据：`ContentAsset`、`AudioAsset`、`AccessPolicy`。
- Stitch：
  - `/dictionary` Desktop `754327e6293540829f24a033a5dfe213`；Mobile `cab0b2342fc8459d88da6f793d6437cb`。
  - `/character/:hanzi` Desktop `2645bbd2e3b34876828c11160b995c68`；Mobile `a03b1d57012543b8b123ae7b1327d20f`。
- 验收：汉字/拼音/英文搜索；空结果与真实 404；withdrawn 返回 410；字页含读音、部首、笔画、关联词、版本/QA；仅达标内容可索引；SearchAction/BreadcrumbList 正确。

### M05 Placement（P0）

- **状态：已有但需修改**
- 当前页面：`/hsk-level-test` 有 15 题前端自测与推荐级别；无 session、恢复、过期、私有结果、版本化内容或服务端提交。
- 目标页面：`/placement`、`/placement/result/:id`。
- 目标 API：`POST /api/v1/placement/sessions`、`POST /api/v1/attempts/:id/submit`。
- 目标数据：`Attempt`、`ContentAsset`、`AccessPolicy`、`AuditEvent`。
- Stitch：
  - `/placement` Desktop `e390b81a0c1545a8844ab3a502496f6f`；Mobile `ee433819b2d14ebcb5e000bb1de5d564`。
  - `/placement/result/:id` Desktop `ecf68bd267bc47cdaab5ea4126a6f523`；Mobile `9a83a34a08ce46d2b3ca1482dd695016`。
- 验收：创建幂等；活跃 session 可恢复；提交重复 key 返回原结果；expired/loading/error/no-data 都有用户可达动作；结果私有 noindex；只给学习建议，不承诺官方考试结果。

### M06 Practice 与 Mock（P0/P2）

- **状态：Practice 已有但需修改；Mock 当前禁用**
- 当前页面：`/hsk-1-practice-test` 至 `/hsk-5-practice-test`；前端随机抽题、即时判分、7 天 localStorage 摘要；无技能路由、Attempt、幂等提交、恢复或计时状态。
- 目标页面：`/practice/:level/:skill`；P2 `/mock/:band`。
- 目标 API：`POST/GET /api/v1/practice/sessions`、`POST/GET /api/v1/mock/sessions`、`POST /api/v1/attempts/:id/submit`、`POST /api/v1/content/:id/reports`。
- 目标数据：`Attempt`、`ContentAsset`、`ContentReport`、`AccessPolicy`。
- Stitch：
  - Practice Desktop `138331f372044a34b1b2904f5258656b`；Mobile `88b71ccd23914d7a8138bf6b917a45f9`。
  - Mock BLOCKED Desktop `abaeb10d20cf46908ee3134fdfefaaf5`；Mobile `f5a174ecf320455d9420704e2567d471`。
- 验收：Attempt 可恢复；内容版本固定；submit/timeout/withdrawn/非法答案状态可测；结果和答案私有 noindex；HSK 7–9 使用统一高级考试模型；跟读仅记录 attempt/自评，不做自动发音评分。

### M07 Today、SRS、Review、Mistakes（P0）

- **状态：尚未开发**
- 当前仅有 Practice 结果页即时错题列表和 7 天摘要，不是可恢复 MistakeCase 或真实 SRS。
- 目标页面：`/today`、`/review`、`/mistakes`。
- 目标 API：`GET/POST /api/v1/daily-sessions`、`POST /api/v1/reviews/:id/grade`。
- 目标数据：`DailySession`、`Mastery`、`ReviewSchedule`、`MistakeCase`、`UsageLedger`、`AccessPolicy`、`AuditEvent`。
- Stitch：
  - `/today` Desktop `16b545ac2b9540c6985392a4e055f7ac`；Mobile `76fb6d6c4b3e447e9ea8254db47872a4`。
  - `/review` Desktop `d35020a589064eb793cc0694a9de59a5`；Mobile `2f52b7516f634bb9bcca6f00d7e3cf64`。
  - `/mistakes` Desktop `6ff2bc7174114164bf168f3027c441de`；Mobile `42e0a57054c543b2a8b40bba29fb12fb`。
- 验收：同 owner/day/rule session 幂等可恢复；reading/audio/context_audio 三类 mastery 分离；评分重复提交不重复计数；错题可恢复和 resolved/retired；empty queue、pending sync、conflict、offline 均有可执行动作；私有 noindex。

### M08 音频与听力（P0/P1）

- **状态：尚未开发；无许可资产时当前禁用**
- 当前代码：无 `AudioAsset`、播放器、受控 URL、R2、音频配额或音频 QA。
- 目标页面：`/listen`、`/listen/:assetId`，并嵌入 `/word/:slug`、`/review`、Practice。
- 目标 API：`GET/POST /api/v1/audio/:assetId/playback`、`POST /api/v1/reviews/:id/grade`、`POST /api/v1/content/:id/reports`。
- 目标数据：`AudioAsset`、`Mastery`、`ReviewSchedule`、`ContentReport`、`AssetManifest`、`AudioLicensePool`、`UsageLedger`。
- Stitch：
  - `/listen` Desktop `cecde4f4fd7d46c8990dfc08d85941a0`；Mobile `319af02fc21141a69e21fc832abc6cd1`。
  - `/listen/:assetId` Desktop `fc3bc31b7aa34d92a8af9f5f30fc9b7c`；Mobile `53d517299d9a4098855242a5fa2b2987`。
- 验收：必填许可/来源/QA/版本字段缺一不可发布；撤回后停止新签 URL；idle/loading/ready/playing/paused/ended/error/unavailable 可达；只在有效播放后允许评分；播放本身不更新 mastery；403/410/503 明确；无未授权缓存/离线。

### M09 语法、阅读与 Planner（P1）

- **状态：阅读已有局部能力但需修改；语法与 Planner 尚未开发**
- 当前页面：只有 `/hsk-1-reading-practice` 和 5 篇本地阅读；无 canonical slug、版本/撤回、关联练习 API；无 Grammar/Planner。
- 目标页面：`/grammar/:slug`、`/reading/:slug`、`/planner`。
- 目标 API：`GET /api/v1/catalog/grammar/:slug`、`GET /api/v1/catalog/readings/:slug`、`POST/PUT /api/v1/plans`。
- 目标数据：`ContentAsset`、`Plan`、`Attempt`、`Mastery`。
- Stitch：
  - Grammar Desktop `c716b5941dd44cf38f028f07db2ed1c7`；Mobile `040c9de2553945f39c208e3f50e062c6`。
  - Reading Desktop `ec34d44d118c4e69846d7d05a7145ba7`；Mobile `068c0d7ce28c498a9626d0ff86711464`。
  - Planner Desktop `8527b58635204d76823c713a9bc095b4`；Mobile `efc7427807c44ac5a07db9635a92b007`。
- 验收：公开内容仅 published/index；empty/withdrawn/404；Planner 输入完整、版本化、可编辑；overload/recalculating/conflict 有用户动作；Planner 私有 noindex；订阅时钟不提前终止有效计划。

### M10 账号、游客合并、同步、Streak、数据请求（P0/P1）

- **状态：尚未开发；Auth/个人数据存储控制未关闭时当前禁用**
- 当前代码/API/绑定：无。
- 目标页面：`/account`、`/account/data`。
- 目标 API：`POST /api/v1/guest/merge-preview`、`POST /api/v1/guest/merge-confirm`、`GET/POST /api/v1/account/sync`、`GET /api/v1/account/streak`、`POST/GET/PATCH /api/v1/account/data-requests`。
- 目标数据：`GuestMerge`、`SyncState`、`Streak`、`AccountDataRequest`、`DeviceBinding`、`AccessPolicy`、`AuditEvent`。
- Stitch：
  - `/account` Desktop `70ee08ba5a7f432e847ea43b23b0bd15`；Mobile `6fa0f3e08f9041e2a08db3fb822dd4c3`。
  - `/account/data` Desktop `f5ae6b45d2ed4f5f888408def254c5ec`；Mobile `b9af1d3aeb534201b726ef42213ebe12`。
- 验收：游客合并先预览、再确认、冲突不覆盖；一次性 token 和幂等；最多 3 台活跃设备；revision conflict 可解决；Streak 只由定义学习事件按用户时区更新；导出/删除请求可取消/重试；所有页面私有 noindex；删除传播和最小审计满足合规合同。

### M11 AI Explanation / Study Plan（P1）

- **状态：尚未开发；当前禁用**
- 当前代码/API/供应商：无。
- 目标入口：`/placement/result/:id`、`/planner`；无独立 Stitch 页面。
- 目标 API：`POST /api/v1/ai/explanations`、报告时复用 `/api/v1/content/:id/reports`。
- 目标数据：`AIRequest`、`QuotaLedger`、`UsageLedger`、`AuditEvent`。
- 验收：只有账号+额度可调用；500 credits/自然月仅按冻结候选合同实现，未完成供应商和数据门前不开外部调用；每请求最多 25 credits、10 请求/小时、并发 1；quota/rate/provider failure 不调用或不扣/原子返还；记录 audit ID，不记录 prompt/response 全文；必须提供非 AI 替代动作。

### M12 Pricing、Checkout、Order、Entitlement（P1）

- **状态：尚未开发；Pricing 为 planned，Checkout 当前禁用**
- 当前代码/API/Stripe：无。
- 目标页面：`/pricing`、`/checkout/*`。
- 目标 API：`POST/GET /api/v1/checkout/*`。
- 目标数据：`OrderDraft`、`Entitlement`、`QuotaLedger`、`AuditEvent`。
- Stitch：
  - Pricing Desktop `f47203ca5be348f8931c558077a435cc`；Mobile locked `658796597d1a45108e1cd961ee235a56`。
  - Checkout BLOCKED Desktop `0cdeedec85f240c88c66eb1509c08f7a`；Mobile `a2a78d0055234c2784f3bb1d90cbb6f1`。
- 验收：未配置时返回可恢复不可用状态且不创建 OrderDraft；支付状态与 Entitlement 状态分离；事件幂等；只允许批准的 plan/price；Stripe 先 Test；Stripe Live、生产订单、真实扣款另需 Owner 授权；价格展示与退款/取消合同一致。

### M13 PDF Pack、Export、离线（P2）

- **状态：尚未开发；当前禁用/PLANNED**
- 当前只有 Worksheet 的浏览器打印；它不是 ExportJob 或 P2 PDF Pack。
- 目标页面：`/pdf-packs`、`/exports`。
- 目标 API：`POST/GET /api/v1/exports`、`POST /api/v1/exports/:id/cancel`。
- 目标数据：`ExportJob`、`AssetManifest`、`Entitlement`、`PackPurchase`、`AuditEvent`。
- Stitch：
  - `/pdf-packs` Desktop `9d8449c0a1b549e89efa92d29b92d5dc`；Mobile `2c6bafe3185444a897a6572b9662e5ea`。
  - `/exports` Desktop `1bc7112d12a148fab9c8fe92c0007a10`；Mobile `2ad75c4226dc46c1b08c17b1ad323d88`。
- 验收：queued/generating/ready/failed/expired/cancelled/revoked 全状态；只使用授权 manifest；首个 ready 后 14 日、最多 3 次成功下载；撤回/退款/删除后停止新签发；失败不计成功下载；PDF 与 PDF Pack 分别验收；私有 noindex。

### M14 法律页（现有公共基线）

- **状态：已有但需修改；发布法律效力仍受主体/辖区/供应商门控制**
- 当前页面：`/privacy-policy`、`/terms-of-service`、`/disclaimer`、`/contact`；Stage 06 设计采用 six-route legal template。
- 目标页面：现有法律页以及合规合同要求的 Cookie、Refund 等完整六路由。
- 目标 API/数据：本批不新增；后续按 Consent、AccountDataRequest、Support/支付合同接入。
- Stitch：Desktop `92eebad4e6aa436aa0527da665acf20c`；Mobile `d66718d3a574454aa3bbbd5116709efd`。
- 验收：六份完整正文、无 debug/metadata 泄露、移动端无截断；公开内容与真实处理活动一致；未选择的供应商不得写成已使用；主体/辖区等未确认时不得虚构。

### M15 现有 Worksheet/打印工具（非 Stage 07 新增主链）

- **状态：已有且保留**
- 当前页面：`/worksheet`、`/tools/chinese-character-practice-sheet-generator`。
- 当前能力：输入汉字、生成田字格、浏览器打印；localStorage 日次数记录；专用 PDF 下载未实现。
- Stitch：Stage 06 54 Screen 中无独立 canonical Screen，不得用 deprecated Screen补造。
- 验收：后续相关改动不得破坏现有生成、打印、移动端输入和本地额度；专用 PDF 下载仍归 M13/P2，不得提前宣称已上线。

## 4. API 总体差异

目标 PRD API 组均为 **尚未开发**：

1. Catalog：words、characters、grammar、readings。
2. Content report。
3. Placement/Practice/Mock session 与 Attempt submit。
4. Daily session、Review grade、Audio playback。
5. Guest merge、Account sync/streak/data request。
6. Plans、AI explanations。
7. Exports/cancel。
8. Checkout。

统一验收底线：版本字段、owner scope、权限、Idempotency-Key、revision conflict、404/410/422/429/503、审计最小化和 feature-off 行为必须按冻结合同实现，不能以页面 mock 代替。

## 5. 数据表/实体总体差异

当前 **0 张应用数据库表**。目标至少包含 PRD 21 个 canonical entity：

`ContentAsset`、`AudioAsset`、`Mastery`、`ReviewSchedule`、`Attempt`、`DailySession`、`MistakeCase`、`GuestMerge`、`SyncState`、`Streak`、`AccountDataRequest`、`ContentReport`、`Entitlement`、`AssetManifest`、`Plan`、`AIRequest`、`QuotaLedger`、`AccessPolicy`、`AuditEvent`、`OrderDraft`、`ExportJob`。

合规增量控制对象必须独立建模，不得复用上述表冒充：

`UsageLedger`、`DeviceBinding`、`AudioLicensePool`、`PackPurchase`。

第一批只实现内容合同/清单/校验，不提前创建个人数据表、支付表或生产 binding；详见首批开发清单。

## 6. 分类结论

### 已有且保留

- Worksheet/汉字练习纸生成与浏览器打印。
- 现有公共法律/联系路由的可访问性（正文和路由仍需按最终合规合同调整）。
- 现有传统练习、Level Test、HSK 1 词表、阅读内容作为迁移输入和回归对象；不得误标为 HSK 3.0 Level 1–9 完成。

### 已有但需修改

- 首页、等级说明、New HSK 3.0 说明。
- 传统词汇 1–6 页面。
- Level Test → Placement。
- Practice 1–5。
- HSK 1 Reading。
- 法律页与导航/路由结构。

### 尚未开发

- 目标 API 全部。
- 目标数据库 schema/migration 全部。
- HSK 3.0 Level 1–9 版本化内容底座。
- Dictionary、Word、Character canonical 页面。
- Today、SRS、Review、Mistakes、受控音频。
- Account、Guest Merge、Sync、Streak、Data Request。
- Grammar、canonical Reading、Planner。
- AI、Pricing/Checkout、Order/Entitlement。
- Mock、Exports、PDF/PDF Pack、离线。
- 自动化测试体系。

### 当前禁用

- 未授权音频发布、缓存、离线与受控播放。
- Auth/个人数据同步（直到 provider、DPA/region/retention/deletion 等实施门关闭）。
- AI 外部调用。
- Checkout、Stripe Live、真实订单/扣款。
- Mock 高级考试公开入口。
- Export/PDF Pack/离线下载。
- 自动发音评分。
