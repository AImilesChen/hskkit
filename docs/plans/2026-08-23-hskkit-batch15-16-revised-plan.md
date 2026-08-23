# HSKKit 批次15—16修订执行规划

**目标：** 严格串行完成尚未上线的P2商业闭环，再以38条Requirement为唯一分母完成增量PRD全量终验。

**核心修订：** PRD、定价、合规、文案和Stage 06 Stitch UI真源已经完成，不重新立项、不重写、不重新走Owner确认；批次15直接从既有权威真源进入实现。批次16只做全量终验和证据驱动返修，不重做已通过功能。

**技术栈：** Next.js / Cloudflare OpenNext / Workers / D1 / R2 / Queues / Stripe Test。

---

## 一、权威真源与范围纪律

### 批次15必须只读引用

- PRD：`docs/stage07/baseline/stage06-design-truth/source-inputs/HSKKit-PRD-v4.0-owner-review.md`
- 定价：`docs/stage07/baseline/stage06-design-truth/source-inputs/HSKKit-Pricing-v4.0.md`
- 合规：`docs/stage07/baseline/stage06-design-truth/source-inputs/HSKKit-Compliance-v1.4.md`
- 文案：`docs/stage07/baseline/stage06-design-truth/source-inputs/HSKKit-Copy-Freeze-v1.3.md`
- UI真源：`docs/stage07/baseline/stage06-design-truth/metadata/canonical-manifest.json`
- UI最终门：`docs/stage07/baseline/stage06-design-truth/reports/FINAL-GATE.md`

### 不采用

- 不采用任何新生成的重复定价、合规、文案或UI草稿。
- 不把批次15重新包装为一条新做站流水线。
- 不因实现阶段发现技术细节而改写已冻结产品范围；真正合同冲突单列给建哥决策。

### 串行规则

- 同一时间只允许一个批次运行。
- 同一时间只允许一个成员执行一张实现/复核卡。
- 每张任务卡只覆盖一个明确责任边界。
- 实现者不能给自己的交付最终GO。
- 返修只修独立QA证实的问题，不扩项、不重跑无关门禁。

---

# 二、批次15：离线包、导出、高级PDF与商业化

## 15-0 现状对账与启动闸门（大总管亲自执行，不派成员）

**目的：** 只读确认代码断点、生产基线和权威真源对应关系，避免重复开发或从错误分支起步。

**动作：**

1. 核对当前生产版本、源码分支、HEAD、工作区和远端关系。
2. 按权威真源建立“已有 / 部分已有 / 未实现”矩阵，仅针对批次15范围。
3. 核对正式内容、资产版本、许可、`offline_right`、撤回状态；演示内容不得进入商业包。
4. 冻结批次15路由、对象和状态机：`/exports`、`/pricing`、Checkout、Order、Entitlement、ExportJob、AssetManifest、PackPurchase、Webhook。
5. 输出唯一执行清单；已有实现从断点续做，不重复重写。

**启动条件：** 真源明确、生产基线可追溯、无未归属脏改动。内容授权不足时实现必须fail closed，但不得用演示数据冒充正式商品。

## 15-1 后端、数据与异步制品闭环（负责人：小库）

**范围：** 只做Workers/D1/R2/Queues、权限、账本、Stripe Test服务端合同。

**交付：**

1. 数据对象及迁移：AssetManifest、ExportJob、ExportAttempt、Order、Entitlement、PackPurchase、WebhookEvent、Refund/Revocation、Idempotency/Usage ledger。
2. Owner-scoped API：创建、查询、取消、失败恢复、重试、过期、下载授权、退款申请和撤权。
3. Queue消费者：原子claim、随机lease fencing、attempt独立R2 key、赢家原子发布、过期worker精确清理。
4. R2私有对象和短时签名下载；退款、撤权、账号删除、资产撤回后失效。
5. Stripe Test：Price白名单、Checkout、支付成功/处理中/失败/取消、签名Webhook、重放幂等、退款和权益撤销。
6. 聚焦测试：跨用户拒绝、重复请求不重复消费、失败不扣、退款撤权、Queue/Webhook重放、ambiguous R2/D1回读。

**门禁：** 独立代码复核GO后才能交给前端；不得启动Stripe Live。

## 15-2 前端与真实文件体验（负责人：小帅）

**依赖：** 15-1独立复核GO。

**范围：** 严格按冻结文案与Stitch真源实现，不调整已完成页面视觉系统。

**交付：**

1. `/exports`：空态、生成中、取消、失败、重试、ready、过期、撤权、下载状态。
2. PDF Pack目录、权益状态、资产版本、预览、购买入口、下载次数和有效期。
3. `/pricing`、Checkout return、成功/失败/取消、退款申请和撤权反馈。
4. PDF真实生成与下载；若同时提供DOCX，必须独立生成、独立下载、独立验收。
5. 桌面与390×844可用性：无根级横向溢出、控件可触达、状态文案真实、不得暴露内部实现词。

**门禁：** 实现完成只算Implementation ready，不得自报最终GO。

## 15-3 聚焦SEO复核（负责人：小优）

**依赖：** 15-2实现完成且独立代码复核通过。

**只审批次15新增/变化页面：**

- `/pricing`及公开PDF Pack目录的indexability、canonical、title/meta、schema、内部链接、sitemap。
- `/exports`、Checkout return、订单、下载、退款等私有页面必须noindex且不进入sitemap。
- 不修改既有已通过页面，不做全站SEO重构。

**门禁：** P0/P1必须返修并聚焦复验；P2记录但不得顺手扩项。

## 15-4 独立QA与发布候选GO（负责人：大总管亲验）

**依赖：** 15-3 GO。

**一次性验收矩阵：**

1. 真实PDF最终字节：英文、中文、Emoji、字体嵌入、分页、可搜索文本。
2. DOCX若提供则独立验收，不能用PDF通过替代。
3. ZIP/manifest：资产ID、版本、授权范围、hash、过期和撤回同步。
4. 导出：生成、取消、失败、重试、过期链接、刷新恢复。
5. 幂等：重复请求不重复生成、不重复消费；失败不扣权益。
6. 权限：用户A无法访问用户B的job、order、文件或退款。
7. Stripe Test：成功、处理中、失败、取消、重复Webhook、退款、退款失败、撤权和下载失效。
8. 浏览器：桌面完整流 + 390×844完整流；交叉核对API、D1和R2证据。
9. 安全与合规：私有R2、签名下载、Webhook验签、用户可见口径与冻结文案一致。
10. 精确清理：删除本轮QA账户/订单/job/ledger/R2 keys/Test对象映射，逐表逐对象回读为0；不得 broad delete。

## 15-5 发布、生产终验与批次15结论

1. 独立QA P0=0、P1=0后，提交并推送最终代码。
2. 用最终代码生成一次新平台制品并部署。
3. 在生产完成批次15最小完整用户流、桌面/390×844、真实文件字节、Stripe Test和精确清理回读。
4. 由大总管给出`Batch15 GO/NO-GO`，再交建哥确认。
5. 建哥确认Batch15 GO后，才允许进入批次16。
6. 可创建“批次15生产GO”回退点；名称和说明必须明确它不是全PRD完成标签。

**批次15完成定义：** 实现、聚焦复核、提交、推送、部署、生产QA、精确清理、独立GO和建哥确认全部完成。任何一项缺失均不得称批次15完成。

---

# 三、批次16：38条Requirement增量PRD全量终验

## 16-0 冻结唯一终验矩阵（大总管）

1. 以已确认PRD中的38条Requirement为唯一分母，编号保持不变。
2. 每条只允许：PASS / FAIL-P0 / FAIL-P1 / FAIL-P2 / BLOCKED。
3. 每条记录证据：代码、API、生产页面、桌面、390×844、D1/R2/Queue、支付Test、内容/授权、SEO/合规。
4. 批次15 GO只作为其中相关Requirement的证据，不替代其余Requirement终验。

## 16-1 静态与数据事实回读（大总管独立执行）

- 38条逐项映射现有实现和生产证据。
- 正式内容数量、版本、QA、发布状态、授权和撤回状态。
- 生产路由、API、schema、迁移、权限、SEO、法律页和安全配置。
- 已有证据有效则复用；代码或生产未变化的已通过功能不重复重做。

## 16-2 桌面完整用户流

按真实用户顺序验：

- 游客 → Placement → Result → Today入口。
- Practice → Mistakes → Review/SRS。
- Mock、Planner、AI额度/失败恢复。
- 登录、游客合并、账号数据、跨设备同步。
- 离线、导出、PDF、Test支付、退款和撤权。

每个动态步骤同时保留浏览器结果与API/数据状态证据；实现者不得参与最终判定。

## 16-3 390×844与恢复矩阵

- 在真实`window.innerWidth=390`下完成同一核心用户流。
- 验证触控、可滚动、无遮挡、无根级横向溢出。
- 验证刷新恢复、断网队列、重连、跨设备冲突和幂等重放。
- 已通过且未受变化影响的页面只做防回归抽样，不重复全链。

## 16-4 横切终验

- 内容与授权：不以演示数据冒充正式内容。
- AI：额度、失败不扣、幂等、隐私与降级状态。
- 导出/PDF：最终文件字节、撤回、过期和权限。
- Stripe Test：成功/失败/取消/退款/撤权，无Live实付。
- SEO：canonical、sitemap、robots、schema、index/noindex边界。
- 合规：Privacy/Terms/Cookie/Refund与实际数据流一致。
- 安全：owner scope、CSRF、Webhook验签、R2私有、日志无敏感原文。
- QA数据：精确清理并逐表/对象回读为0。

## 16-5 独立缺陷分级与单卡返修

1. 输出38条Requirement终验表和P0/P1/P2清单。
2. P0/P1按根因归属，一次只给一个成员一张返修卡。
3. 每张返修卡只包含：失败Requirement、复现证据、最小修复范围、直接受影响测试、生产复验点。
4. 返修后只复验直接受影响项及相邻回归；除非最终代码变化使证据失效，不重跑已通过全链。
5. 同一问题最多两轮复核；仍未闭环则明确BLOCKED，不继续扩项。

## 16-6 全PRD最终GO与回退标签

必须同时满足：

- 38/38均有明确结论和证据。
- P0=0、P1=0。
- P2全部有已确认处置，不冒充P0/P1完成。
- 最终代码已提交、推送、部署。
- 桌面和390×844生产终验通过。
- Test支付、退款、撤权、离线、导出和真实文件通过。
- 生产QA数据精确清理且回读为0。
- 工作区干净，本地HEAD、远端分支和生产版本可对应。

达标后：

1. 由大总管给出`Full PRD GO`，交建哥最终确认。
2. 建哥确认后创建全PRD回退标签。
3. 推送标签并远端核验标签对象及解引用commit。
4. 报告必须明确：批次15 GO、批次16 GO、全PRD GO三层结论，不能互相替代。

---

# 四、调度顺序

严格顺序：

`大总管15-0只读对账 → 小库15-1 → 大总管独立复核 → 小帅15-2 → 大总管独立复核 → 小优15-3 → 大总管15-4/15-5生产QA → 建哥确认Batch15 GO → 大总管16-0至16-4终验 → 按缺陷一次只派一个成员返修 → 大总管独立复验 → 建哥确认Full PRD GO → 全PRD回退标签`

未获得建哥对本规划的确认前：不创建Kanban任务、不派成员、不改代码、不部署。
