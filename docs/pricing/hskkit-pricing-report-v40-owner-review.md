# HSKKit Stage 03：PRD v4.0 冻结后定价复核候选稿

> 状态：仅供独立复审；不是价格发布、支付启用、开发或生产上线授权。
>
> 输入 PRD：`docs/product/HSKKit-PRD-v4.0-owner-review.md`
>
> 冻结 PRD SHA256：`09b5b7b8a372fedd6f472368381187bf4ed71818a6316200b266640b02f29688`（本轮机械复核匹配）
>
> 既有定价基线：`docs/pricing/hskkit-pricing-report-v33-executable.md`、`docs/pricing.md`；本报告不重做 PRD，亦不将 v3.5 视频课程补丁并入。
>
> 性质：定价与商业模型复核候选，不构成法律、税务或支付机构意见。

## 1. 执行摘要

**主建议（不变价）：** 保留既有候选价格：Pro Monthly **US$5.99 / 月**、Pro Yearly **US$49 / 年**，以及 P2 后置上线 SKU `HSKKit Advanced Study PDF Pack` **US$9.99**。这不是以绝对低价取胜：HSKKit PDF 单个等级最多 120 个词汇/例句和 20 个练习、仅 3 次下载/首个 ready 后 14 日，与 HSKLord 的更大词量、长期访问与更新权益不可直接等价。订阅仍以免费核心之外的学习效率权益为依据。现价不作线上改动；只有 Owner 才能确认商业配置、展示价格和创建订单。

本轮的增量修复是把 v4.0 的音频学习、HSK 1–9 数据底座、Placement→Planner、Daily Session/SRS/错题/进度等范围，重新划入“免费核心”和“受限高级效率”而非对既有浏览内容重复收费；并将 AI、音频、存储、导出、失败重试、支持、反滥用、支付费率及税务缺口列为独立、非零成本变量。

- 本阶段交付状态：候选稿完成，等待独立复审。
- 独立复审状态：未完成。
- Payment Live / 生产上线状态：未授权；不得修改 Stripe/PayPal Price、代码、配置或线上价格。
- 范围语义：P0、P1、P2 均为本冻结 PRD 要求上线的范围；P2 仅表示后置实施，绝不表示取消、永久不可售或不进入上线验收。

## 2. 范围冻结：既有基线 / 本次新增 / 明确不做

|层级|内容|定价处理|
|---|---|---|
|已上线/既有基线（以现有资料为准，非本报告确认上线）|Free 的 HSK 词汇浏览、Levels Guide、基础 Placement/Practice；既有 P1 候选价格与 500 AI credits/月口径|不因 v4.0 重复收费；现有 $5.99/$49 仅作待复审候选|
|本次 v4.0 新增或调整（均为 Candidate）|HSK 3.0 Level 1–9 数据/分层、词句音频与 audio mastery、Daily Session、真实 SRS、可恢复错题、游客合并/同步、Placement→Planner、HSK 7–9 高级模型|公开学习核心进入 Free；私有同步、效率、可配置 AI 和后续受授权资源才可成为 Pro 候选权益|
|明确不做或未纳入本轮 P1|v3.5 视频课程、直播/社区/教师后台、重 AI 对话陪练、移动原生 App、Teacher/School Pack、Lifetime/Beta Lifetime、独立 credits pack；PDF Pack/离线包不进入 P1 SKU 或支付配置|不得放入 P1 Initial 表、CTA、订单、支付配置或 entitlement；P2 数字材料为 PRD 要求的后置上线范围，按第 7.3 节候选商业边界、门禁及开放购买验收执行|

## 3. 用户付费触发点与免费核心

|用户任务|免费可完成的核心价值|可收费的效率/资源候选|P1 可行性与限制|
|---|---|---|---|
|初学者：找每日该学什么|等级选择、Placement、受控 Daily Session/基础 SRS、公开词典和已授权基础音频|跨设备同步、完整历史、增强复习效率|需先确认 OD-03 账号边界和免费额度；不得因未付费阻断诊断|
|备考者：把弱项转成复习|Practice、基础错题恢复、结果/学习建议|更完整历史、可配置 Planner、额外资源|Mock/高级训练按 PRD 阶段；不能承诺考试结果|
|听力学习者：练听辨|已授权的基础音频与故障状态|高级模式或受权离线能力（非当前售卖）|音频许可与缓存/再分发边界是硬门|
|需要解释/计划的账号用户|非 AI 替代学习路径|有周期硬额度的 AI Explanation / Study Plan|未确认供应商、单位成本、数据处理前，不得宣称额度或启用|

### 3.1 冻结的可执行额度合同（仅为本候选稿复审参数）

以下数值冻结为本报告的商业候选参数；它们不改变 PRD 的产品优先级，也不授权实现或对外展示。所有按日计量在用户配置时区的本地日 `00:00` 重置；按周计量采用滚动 7×24 小时窗口；不得通过卸载、重登或切换设备重置。`Daily Session` 仅在上一会话 `completed/cancelled/expired` 后可创建下一会话；空队列不消耗额度。

|能力|Free（冻结）|Pro Monthly / Pro Yearly（冻结）|超额、失败与关闭行为|
|---|---|---|---|
|Daily Session|1 个/本地日；每会话最多 10 个队列项|1 个/本地日；每会话最多 30 个队列项|达到 cap 返回 `quota_denied` 和下一重置时间；不创建空白会话；网络/同步失败不消耗已完成项之外的额度|
|SRS / Review|最多 20 次已提交评分/本地日；同一 attempt 的幂等重放不重复计数|最多 100 次已提交评分/本地日；同一 attempt 的幂等重放不重复计数|第 N+1 次不写入评分且不调用外部服务；`409` 冲突不扣；`5xx`/超时仅在成功持久化后计数|
|错题与学习历史|当前浏览器临时记录最近 7 日、最多 100 条；不承诺跨设备恢复|账号内完整活动期历史；最多 10,000 条学习/错题状态，达到上限后停止新建并提示导出/清理路径（功能存在后）|Free 临时标识到期删除；Pro 订阅结束不删除既有记录，访问/保留规则仍由隐私合同决定；同步冲突不覆盖且不计新记录|
|同步|不提供跨设备同步；仅可在受控游客标识中做一次合并预览|最多 3 台活跃设备；服务端 revision 幂等同步|第 4 台须先移除一台；冲突为 `needs_resolution`，失败/断网为可重试且不静默丢失|
|音频基础学习|每滚动 7 日最多 20 次**有效播放**（同一 `asset_id+version+user_scope+7d_window` 只计一次；有效=播放达到资产时长 50% 或 15 秒，以较小者为准）|每本地日最多 100 次有效播放；仅限 `published` 且 `license_ref/cache_right` 有效资产；不含离线|额度到达后不签发新受控 URL；`unavailable/revoked/error` 不计数；重播不重复计；许可撤回立即停止新签发|
|AI Explanation / Study Plan|0 credits；不发起供应商调用|500 credits/**每自然月**；每月 1 日 00:00 UTC 重置、未用不结转；每请求最多 25 credits|第 N+1 请求在本地账本拒绝且不调用供应商；`provider_failed`/超时不扣或原子返还；限速 10 请求/小时、并发 1|

Free 的 20 次有效播放/7 日按每次 `$0.001` 的交付预算复算为 `$0.02/周`、约 `$0.09/30 日`；不把未获授权资产、离线下载或 `L_audio` 商业许可成本误设为零。本报告不沿用旧资料中 Worksheet、Reading、Flashcards 的收紧建议，因为它们不是 v4.0 已冻结商业合同。

## 4. 已完成 HSKLord 官方竞品核验与可比性矩阵

访问日期：2026-08-11。以下为已完成的官方页面核验，保留来源入口而非将第三方页面当作 HSKKit 权益承诺：

- HSKLord [pricing](https://hsklord.com/pricing)：Web Premium **US$12/月、US$79/年**，7 天完整试用且 Web 试用无需信用卡；Scholar **US$149/年**，含 Premium 权益与 Store PDF。
- HSKLord [store](https://hsklord.com/store)：PDF 单品 **US$12 / $15 / $19 / $25 / $29 / $35 / $39**；两个 Bundle 均为 **US$59**。
- HSKLord [terms](https://hsklord.com/terms) 及 [Starter](https://hsklord.com/store/hsk-1-2-3-starter)、[HSK4](https://hsklord.com/store/hsk-4)、[HSK5](https://hsklord.com/store/hsk-5)、[HSK6](https://hsklord.com/store/hsk-6)、[HSK7](https://hsklord.com/store/hsk-7)、[HSK8](https://hsklord.com/store/hsk-8)、[HSK9](https://hsklord.com/store/hsk-9)、[Mastery Bundle](https://hsklord.com/store/hsk-mastery-bundle)、[7–9 Advanced](https://hsklord.com/store/hsk-7-8-9-advanced)：核验一次购买、长期访问、邮件交付、离线/打印、后续更新及成功交付/下载后原则最终销售、缺陷或未交付可重发/退款的页面口径。Store 首页高级 Bundle 模板文字有矛盾，范围以详情页 WHAT’S INSIDE 为准。

### 4.1 App 渠道次要价格证据（不并入 Web 对比）

Apple App Store 公开页面列示 HSKLord Premium **US$14.99/月**、**US$99.99/年**。Google Play 公开页面仅证明 HSKLord App 存在 **US$14.99–99.99** 的价格区间；该页面没有把每一个价格与特定订阅周期逐项对应，**不能据此推断具体周期**。上述 App 渠道仅为次要证据：订阅主对比仍使用已核验的 HSKLord Web Premium **US$12/月、US$79/年**及 Scholar **US$149/年**，不得把 App 价格混作 Web 价格或用其替代 Web 权益比较。

### 4.2 订阅可比性矩阵

|维度|HSKKit Pro Monthly / Yearly 候选|HSKLord Web Premium / Scholar（前序官方核验事实）|定价判断|
|---|---|---|---|
|订阅价格|$5.99/月；$49/年|Web Premium $12/月、$79/年；Scholar $149/年；App 渠道价格仅为次要证据，不混入本行 Web 对比|不能只比较标价，权益范围不同|
|HSK 1–9 覆盖|v4.0 规划 HSK 3.0 Level 1–9 数据底座，未验收不得宣称全量训练已上线|前序已核验的 HSKLord 官方 pricing/产品详情证据列示 HSK 1–9 学习产品；本矩阵不据此推断每档订阅均包含每一等级或每项内容|HSKKit 仍受内容权利与上线 QA 门约束|
|Free 额度 / 试用|免费浏览、搜索、基础学习和诊断；不以付费阻断核心任务|前序已核验：Web 提供 7 天完整试用且无需信用卡；官方证据未在本轮逐项证明其 Free 层的每日/每周额度，不可据此推断具体 Free cap|不可把对方页面外的营销条件视为固定事实|
|SRS / 复习|Daily Session、真实 SRS、错题恢复为 PRD 范围|前序官方产品证据支持 HSKLord 的学习/复习产品定位；官方证据未证明与 HSKKit 相同的队列算法、评分 cap、错题保留或 SRS 参数，不可据此作能力等同|同名功能不等于队列、额度或内容深度相同|
|AI / Planner / 练习差异|有额度的 AI Explanation/Study Plan、Planner、Practice/Mock 均须相应门禁和验收|前序官方 pricing/产品详情证据支持其 Premium/Scholar 和 Store 学习材料；未核验到可与 HSKKit AI Explanation、Study Plan、Planner 或 Practice/Mock 逐项对应的具体能力，不能据此推断具备或不具备这些功能|HSKKit 不用未实现能力抬高比较价值|
|访问周期|订阅 entitlement 按账期；Planner、AI 额度和数据时钟分开|前序已核验 Web Premium 月/年价格及 Store 数字材料的一次购买、长期访问和更新权益；官方证据未证明订阅与 Store 数字材料具有同一访问周期，不可混同|不能把订阅访问期与 PDF 长期访问混为一类|
|取消 / 退款|支付前仍需确认；限制均保留适用法律例外|前序已核验 Terms/Store：成功交付或下载后原则最终销售；缺陷或未交付可重发/退款。未核验到可直接套用至 Web 订阅取消的具体步骤或完整退款窗口，不能据此推断|退款条件不可仅凭价格对比推断|

### 4.3 PDF 可比性矩阵

|维度|HSKKit P2 PDF Pack 后置上线 SKU|HSKLord 官方 PDF 单品 / Bundle|定价判断|
|---|---|---|---|
|内容量与等级|单一用户选择 Level；最多 120 词汇/例句、20 练习，且仅已授权已发布内容|单品 $12–$39；两个 Bundle $59；具体内容量/等级以各产品详情页为准|不是相同内容量 SKU|
|价格|$9.99 候选|$12/$15/$19/$25/$29/$35/$39；Bundle $59|$9.99 不能因较低就自动视为更优|
|下载 / 访问期|最多 3 次成功下载；首个 ready 后 14 日|官方详情页/terms 所列的长期访问与更新权益|访问期和更新权益存在实质差异|
|交付|异步生成、受控链接；撤回/失效时停止新签发|以官方 store/产品详情页为准|交付机制不可视为等同|
|更新|仅生成版本和资产清单可追溯；无持续更新承诺|官方详情页所列更新权益|不得把 HSKKit 的一次性生成包包装为长期更新产品|
|打印 / 离线|个人、不可转让；仅限授权内容，许可撤回可停止新下载|以官方产品详情页与 terms 为准|再分发权利与离线条件须单独核验|
|退款|未成功下载且购买后 7 日内进入人工审核；一次下载后可能受限，except where required by applicable law|以官方 terms/详情页为准|数字内容退款规则不因价格而互相替代|

**结论：** 主建议为维持 $5.99/$49 和 P2 PDF Pack $9.99 候选价，不建议仅因 HSKLord 标价更高或更低而变价。HSKKit 的 PDF 包范围、3 次下载/14 日和不承诺长期更新使其价值边界明显更窄；订阅也须待 HSK 1–9、SRS、AI/Planner/练习的实际验收后再进入商业配置。若 Owner 希望调整价格，应另作 Owner 决策记录；本报告不改线上价格。

## 5. 推荐商业模型与套餐矩阵

### 5.1 阶段路径

`P0：免费核心闭环与权利/数据/音频 QA` → `P1：账号留存 + 两个候选订阅 SKU（仅经确认后）` → `P2：高级训练、离线/导出、PDF/PDF Pack 后置实施并上线验收`

当前不创建新 SKU、补差价 SKU、私下迁移付款或数字包。P2 后置上线 SKU 不属于 P1 Initial 表、CTA、订单或 entitlement；但其为 PRD 要求的上线范围，门禁关闭后必须进入开放购买验收，而非永久保留为候选或不可购买。

### 5.2 P1 Initial 候选套餐

|权益或限制|Free|Pro Monthly 候选|Pro Yearly 候选|
|---|---|---|---|
|价格/账期|$0|$5.99/月，自动续费仅在支付合同确认后|$49/年，自动续费仅在支付合同确认后|
|公开词典、等级说明、基础词汇|可用|可用|可用|
|Placement 与基础 Practice|可用；游客进度受控|可用；进度保存按账号合同|可用；进度保存按账号合同|
|Daily Session / 基础 SRS|1 session/本地日、10 项/session；20 次评分/本地日|1 session/本地日、30 项/session；100 次评分/本地日|同 Monthly|
|音频基础学习|20 次有效播放/滚动 7 日，仅授权资产|100 次有效播放/本地日；不含未经授权离线|同 Monthly|
|同步与完整错题/进度历史|最近 7 日、最多 100 条、无跨设备同步|最多 3 台活跃设备、10,000 条活动期历史|同 Monthly|
|AI Explanation / Study Plan|0 credits；不造成隐性调用|500 credits/**每自然月**，每月 UTC 重置；未确认供应商前不开通|500 credits/**每自然月**，每月 UTC 重置；未确认供应商前不开通|
|AI/滥用硬限制|不适用|每用户周期账本、速率限制、并发上限、失败不扣或返还、N+1 次不调用供应商|同 Monthly|
|导出、PDF Pack、离线包|不可用|P2，非当前权益|P2，非当前权益|
|教师/学校材料、视频课程、Lifetime|不适用|不包含|不包含|

“500 credits/每自然月”是从 v3.3 延续的**候选上限**，不是本 PRD 已批准权益；Yearly 用户在有效年度订阅期间每月获得独立 500 credits，不是全年合计 500。credit 对应请求、成本、重置、失败重试和滥用规则必须先配置并审计；不得写成无上限服务。

### 5.3 购买触发、CTA 与公平性

- 候选触发：用户已完成免费学习核心，主动需要跨设备同步、完整学习历史或有额度的高级效率能力。
- 真实路径：商业配置为 `not_configured` 时，`/pricing` 只能说明免费路径/方案待确认；`/checkout/*` 必须返回可恢复不可用状态且不创建订单。获批后，CTA 才能指向实际支付页。
- P1 不存在 add-on/补差价路径。因此不得把“已有订阅者加钱获得不同权益”作为当前实现或财务收入。
- 若将来批准同一最高权益的直接购买和合法补差价路径：同一总支付应获得同一 capability、相同额度规则和相同生效定义；完整路径计两笔支付费，共享的 assessment/基础权益成本只计一次。新增路径须另行复核。

## 6. 生命周期、访问与数据时钟（不得互相提前终止）

|时钟|开始|结束/范围|不影响|
|---|---|---|---|
|购买资格/账期|成功支付且商业配置、事件校验均通过|Monthly 到期或 Yearly 到期；取消后至当期结束|不把付款成功误写为 entitlement 生效|
|Pro capability 访问|Entitlement `active` 事件|`ends_at` 或撤销；失败/处理中单列状态|不缩短已创建的 30/60/90 日 Planner|
|Planner 生命周期|计划成功创建的 Day 1|30/60/90 日计划按被确认版本运行|不因短账期、AI 额度、下载链接或正文删除而终止|
|AI quota ledger|每个自然月 1 日 00:00 UTC|Monthly 与有效 Yearly 均每自然月重置 500 credits、未用不结转|不重置其他历史、计划或导出权益；Yearly 12 个月成本按此口径计提|
|学习数据保留|按隐私/删除合同确定 `[待确认]`|最小必要数据与法定例外|不以数据正文删除破坏计划运行所需的最小状态|
|下载/分享链接|ExportJob ready|明确 `expires_at`、撤回或取消|不决定订单、订阅、计划或数据保留期限|

若将来允许一次免费换学习目标：同一 assessment 仅一个 active plan；旧计划只读归档，新计划从 Day 1 起。第二次自助换向必须拒绝且不得新建计划、重置 AI ledger 或产生新的权益；成本按旧计划 + 新计划 + 一次归档/支持变量完整计入。该能力未在本轮 P1 商业合同中获批。

## 7. 成本模型、假设与路径 cap

### 7.1 成本变量、证据链与关闭责任（均为非零规划预算，非供应商报价）

访问日期：2026-08-11。下列外部 URL 是可复核的证据入口，不代表已选择供应商或已获得适用报价；预算只能在获得“最小关闭证据”后用于 Payment Live。成本池按 `customer_id + sku + purchase_event_id`（订阅）或 `order_id + pack_version`（PDF）去重；同一事件不得同时计入 `U` 与 `L_audio` 的同一许可证费用。

|变量|单位、数量表达式与 low/base/stress (USD)|证据 URL / 类型 / 最小关闭证据|路径 cap、成本池与关闭责任|
|---|---|---|---|
|`A` AI/API|每个有效 Pro 用户/月：`min(500, ledger_limit) × credit_unit_cost`；$0.05/$0.10/$0.25|https://openai.com/api/pricing/；公开价格页（仅作候选供应商入口）；关闭：选定模型价、实测 credits→token/request 映射、数据条款|Monthly 500/月；Yearly 12×500/月；按 `customer_id+utc_month+feature` ledger 去重；产品+技术|
|`U` 音频交付/缓存|每有效 Pro 用户/月：受控有效播放交付；$0.10/$0.25/$0.50。Free `U_free`：20 有效播放/7日×$0.001≈$0.09/30日|https://www.cloudflare.com/developer-platform/products/r2/；公开产品/计费入口；关闭：实际 CDN/R2 账单、有效播放日志|Free 20/7日、Pro 100/日；`asset_id+version+user_scope+window` 去重；内容+技术|
|`L_audio` 音频商业许可|每有效 Pro 用户/月的分摊许可成本：`license_pool(asset_manifest_version, license_term) / eligible_paid_users`；$0.02/$0.08/$0.20|`[待签署许可方 URL/报价]`；合同/报价证据；关闭：许可合同含商业播放、缓存、地域、期限、撤回与资产清单|Monthly ≤$0.20/月；Yearly ≤$2.40/年（12×压力）；与 U 分池、不重复计；去重键 `license_ref+asset_manifest_version+license_term`；内容负责人|
|`L_audio_free` Free 音频商业许可|每个 Free 音频用户/30 日的分摊许可成本：`free_access_license_pool(asset_manifest_version, license_term, 30d) / distinct_eligible_free_audio_users`；$0.01/$0.03/$0.10。该 Free-access pool 必须为合同中可单列的免费访问分摊；若与付费访问共用同一合同池，须先按书面分摊规则拆分，不得把同一 `cost_pool_id+allocation_period` 同时全额计入 `L_audio` 与 `L_audio_free`。|`[待签署许可方 URL/报价]`；合同/报价及书面 Free/paid 分摊证据，访问日期 2026-08-11；关闭：许可合同含免费商业播放、缓存、地域、期限、撤回、资产清单与成本池分摊|Free `L_audio_free` ≤$0.10/30 日；Free 音频 all-in `U_free + L_audio_free` 为 $0.10/$0.12/$0.19/30 日；20 次有效播放/滚动 7 日不变。去重键 `license_ref+asset_manifest_version+license_term+cost_pool_id+allocation_period`；内容负责人关闭；最小关闭证据为签署许可、成本池分摊表、30 日 distinct 使用人群与播放日志|
|`S` 账户/存储|每有效 Pro 用户/月：同步、审计和最小记录；$0.05/$0.10/$0.20|https://www.cloudflare.com/developer-platform/products/r2/；公开产品入口；关闭：所选存储价与 30 日用量样本|Monthly ≤$0.20；Yearly ≤$2.40；`customer_id+utc_month`；技术|
|`R` 支持/失败重试/风控|每有效 Pro 用户/月：`retry_cost + support_case_allocation + abuse_reserve`；$0.10/$0.25/$0.50|内部工单/失败日志（待产生）；关闭：30日样本、重试上限与审批记录|Monthly ≤$0.50；Yearly ≤$6.00；`customer_id+utc_month+incident_class`；运营+技术|
|`F` 支付费|每成功购买：`price×rate+fixed`；3%+$0.30 / 5%+$0.49 / 8%+$0.60|`[待选定支付商官方定价 URL]`；公开价页+沙箱对账；关闭：账户支持订阅/webhook/refund的书面或控制台证据|每笔一次；同一 `purchase_event_id` 只计一次；Monthly≤$1.08、Yearly≤$4.52；财务+技术|
|`T` 税务准备金|每成功购买：`tax_liability_or_filing_allocation`；$0.10/$0.30/$0.60（非零）|https://taxation-customs.ec.europa.eu/vat_en；监管信息入口；关闭：主体/客户地/税种判断、含税展示和申报责任书面结论|Monthly ≤$0.60/笔；Yearly ≤$0.60/笔；`order_id+tax_jurisdiction+tax_period` 去重；财务+法律|
|`Q` 退款/拒付准备金|每成功购买的预期成本：`refund_rate×refund_amount + chargeback_rate×(amount+fee)`；$0.05/$0.20/$0.50|支付商退款/争议政策 URL及 30日订单台账（均待确认）；关闭：实际费率、退款/争议日志与政策|Monthly ≤$0.50/笔；Yearly ≤$0.50/笔；`payment_id+case_id` 去重；财务+运营|
|`E` PDF 导出|每次**成功** P2 导出：生成+对象存储+邮件；$0.15/$0.35/$0.75|`[待选定生成/存储/邮件服务官方价格 URL]`；供应商价+10 次实测；关闭：asset manifest、单次账单和交付日志|只在 P2 Pack 成功生成计；`export_job_id` 去重；内容+技术|

### 7.2 订阅路径复算（已把 T、L_audio、退款/拒付 Q 正确相减）

所有计算使用 Decimal；单用户先按未舍入金额计算，10/50/100 用户聚合后才统一以 `ROUND_HALF_UP` 显示到美元分。`T` 是未知税务责任的审慎准备金，不等同最终税额或已确认税务处理。

- Monthly：`贡献 = 5.99 − F − (A+U+L_audio+S+R) − T − Q`
- Yearly：`贡献 = 49.00 − F − 12×(A+U+L_audio+S+R) − T − Q`
- 因 Yearly AI 是 500 credits/自然月，Yearly 服务变量按 12 个月计提；所有数值为支付前候选压力模型，不是利润、税后利润或上线批准。

|SKU / 情景|F|服务成本 `A+U+L+S+R`|T+Q|单用户贡献|10 用户|50 用户|100 用户|
|---|---:|---:|---:|---:|---:|---:|---:|
|Monthly 低|$0.48|$0.32|$0.15|$5.04|$50.40|$252.02|$504.03|
|Monthly 基准|$0.79|$0.78|$0.50|$3.92|$39.21|$196.03|$392.05|
|Monthly 压力|$1.08|$1.65|$1.10|$2.16|$21.61|$108.04|$216.08|
|Yearly 低|$1.77|$3.84|$0.15|$43.24|$432.40|$2,162.00|$4,324.00|
|Yearly 基准|$2.94|$9.36|$0.50|$36.20|$362.00|$1,810.00|$3,620.00|
|Yearly 压力|$4.52|$19.80|$1.10|$23.58|$235.80|$1,179.00|$2,358.00|

路径 cap 敏感性结论：在列示压力 cap 内，两个既有候选 SKU 仍为正贡献；任一服务月度成本超过 `$1.65`、Monthly 的 `T+Q` 超过 `$1.10`、Yearly 的单次 `T+Q` 超过 `$1.10`，或 `L_audio` 超过其路径 cap 时，冻结相应 feature flag 并复核额度/价格，不得依赖低使用率。审计脚本：`scripts/verify_hskkit_pricing_v40.py`。

### 7.3 P2 PDF/PDF Pack：后置上线 SKU（非 P1 SKU）

`HSKKit Advanced Study PDF Pack` 是 PRD 要求的 **P2 后置上线 SKU**，面向希望把单一 HSK 等级的已授权学习材料离线打印的个人学习者；候选价 **US$9.99**。内容严格限于一个用户选择的 Level、最多 120 个有权利且 `published` 的词汇/例句条目、最多 20 个配套练习项、生成版本与资产清单；不含视频课程、Teacher/School、长期一次性会员方案、订阅权益、AI credits 或未授权音频。

- entitlement：每个 `order_id+pack_version` 最多 3 次成功下载，首个 ready 后 14 日有效；`expired/revoked` 后停止新签发。个人、不可转让使用许可；资产/许可撤回时阻止新下载并保留订单审计。
- 退款候选门：仅在**从未成功下载**且购买后 7 日内可进入人工退款审核；一次成功下载后不承诺退款，**except where required by applicable law**。此条在支付前仍须由合规与支付商规则复核。
- 单位经济：`贡献 = 9.99 − F − E − L_audio − T − R − Q`；不把 P2 后置实现当作零成本。低/基准/压力分别使用 `F=$0.60/$0.99/$1.40`、`E=$0.15/$0.35/$0.75`、`L_audio=$0.02/$0.08/$0.20`、`T=$0.10/$0.30/$0.60`、`R=$0.10/$0.25/$0.50`、`Q=$0.05/$0.20/$0.50`，单笔贡献为 `$8.97/$7.82/$6.04`；10/50/100 单分别为低 `$89.70/$448.50/$897.00`、基准 `$78.20/$391.00/$782.00`、压力 `$60.40/$302.00/$604.00`。PDF 路径 cap：任一成功购买的 `Q` 超过 `$0.50`、或任一列示成本超过压力 cap 时，保持不可购买硬闸并重做 P2 成本/退款复审。
- **上线前暂不可购买硬闸**：在 P2 的资产许可 manifest、供应商实际报价、支付/税务/退款合同、导出取消/过期/撤回测试和独立复审全部关闭前，`/pdf-packs` 仅能显示不可用状态，不能创建订单、价格或下载链接。门禁关闭后，必须进入开放购买验收：创建订单、支付事件与 entitlement 分离、成功/取消/处理中/失败状态、3 次下载/14 日、撤回、退款资格、对账和价格展示均通过后，方可开放购买。

## 8. 支付、订阅、退款与税务硬闸

既有资料提到个人 PayPal USD，但 v4.0 未冻结支付提供商。故本候选稿不确认 PayPal、Stripe 或其他栈，也不采用任何支付商费率为事实。

Payment Live 前必须完成：

1. 核验选定账户是否支持订阅创建、自动续费、webhook、取消、退款、幂等事件与对账；不支持即不得硬上线付费功能。
2. 冻结显示价格是否含税、适用税费展示和征收/申报责任；税务未知时不发布“含税/不含税”承诺。
3. 由合规审阅 Terms、Refund Policy、Privacy/Cookie 的支付数据处理、自动续费、取消路径、失败/处理中/权益未生效状态、credits 规则和退款文本。
4. 退款不得机械复制旧 7 日口径；若后续采用窗口或使用量限制，必须保留 “except where required by applicable law”。
5. 取消路径只能写已实现的路径；不得假设 Account Settings → Billing 已存在。
6. 对 P2 PDF Pack，许可、成本、支付、退款、导出取消/过期/撤回测试与独立复审关闭不是终点；关闭后必须执行开放购买验收，全部通过后才允许开放购买。

## 9. 风险与限制

|阶段|风险|缓解|
|---|---|---|
|P0|音频、题库、词表权利不清；免费核心被错误设为付费墙|OD-01/02、资产许可/QA 发布门；免费保留浏览、基础学习、诊断|
|P1|账号/未成年范围未定；AI 成本/输出、支付订阅能力、税务未知|OD-03、额度账本、限速、最小化输入、支付/税务硬闸；法律或专业顾问复核|
|P2|离线/PDF 再分发、下载链接、数字产品退款、HSK 7–9 Mock/跟读成本|后置实施；权利 manifest、撤回/过期、逐次成本 `E`、商业与合规复审关闭后执行开放购买验收|

## 10. 给下游的最小交接清单（不启动后续阶段）

### 合规
- [ ] 在支付栈、主体、辖区、税务和实际取消路径确认后，复核订阅/退款/支付数据条款。
- [ ] 核验音频、PDF、离线再分发权利；P2 实施前不得假定可售，关闭后复核开放购买验收与实际条款一致。

### 文案
- [ ] 仅在 Owner 批准商业配置后展示 $5.99/$49；此前使用方案待确认和免费路径。
- [ ] 不承诺考试结果、自动发音评分、AI 服务无上限或未实现的取消路径。
- [ ] 不把视频课程、Teacher/School、Lifetime、PDF Pack 写入 P1 Initial。

### 后端 entitlement
- [ ] `Entitlement(capability, source, starts_at, ends_at, status, config_version)` 与 payment 状态分开。
- [ ] `QuotaLedger(feature, period_start, period_end, limit, used, revision)` 原子扣减；AI 的 `period` 固定为 UTC 自然月，Monthly 与 Yearly 均为 `limit=500`；N+1 不调用供应商；失败返还/不扣规则可审计。
- [ ] `UsageLedger(user_scope, feature, window_key, asset_id, asset_version, effective_at, idempotency_key)` 落地 Daily Session、评分与有效播放的时间窗/去重键；设备数以 `DeviceBinding(user_id, device_id, active_at)` 限制为 3。
- [ ] `AudioLicensePool(license_ref, asset_manifest_version, license_term, cost_pool_id, status)` 与交付成本分开；撤回触发新 URL 停止签发。
- [ ] P2 实施前预留 `PackPurchase(order_id, pack_version, download_limit=3, successful_downloads, first_ready_at, expires_at, status)`；硬闸关闭后创建订单并进入开放购买验收，未通过前仍不得开放购买。
- [ ] Planner、数据保留、下载链接、账期分别记录时钟，且 `plan_version` 不由短访问期提前终止。
- [ ] 支付事件和提交均使用幂等键；成功支付不自动等同权益生效。

### QA
- [ ] 未配置商业方案时不创建订单，checkout 返回可恢复状态。
- [ ] Free/Pro 的 Daily Session、SRS、历史、同步、音频有效播放按第 3.1 节精确 cap、重置和去重键断言；失败、冲突、撤回不错误扣量。
- [ ] Monthly 与 Yearly 均断言 AI `500 credits/UTC 自然月`、未用不结转；Yearly 连续 12 个自然月各获得独立额度，且不把全年总量误设为 500。
- [ ] 10/50/100 聚合用审计脚本复算；订阅与 PDF Pack 的贡献额均相减 T、L_audio、Q（PDF 同时相减 E、R）；实际费率、用量、退款/拒付加入后再测。
- [ ] 验证音频撤回、AI 超额、供应商失败、同步冲突、计划 Day 31–90 与链接过期互不误伤。
- [ ] P2：未关闭硬闸时 `/pdf-packs` 不可下单；关闭后必须执行开放购买验收，断言创建订单、支付事件与 entitlement 分离、成功/取消/处理中/失败、3 次下载/14 日、撤回、取消、过期、退款资格、对账与价格展示，以及 PDF 单笔/10/50/100 贡献均扣减 Q、Q 不超过 $0.50/成功购买路径 cap；全部通过才可开放购买。
- [ ] Free 音频：20 次有效播放/滚动 7 日不变；复算 `U_free + L_audio_free` 的低/基准/压力 all-in 30 日成本为 $0.10/$0.12/$0.19，并验证 Free/paid 许可成本池按 `cost_pool_id+allocation_period` 不重复全额归集。

## 11. 验收清单 / 质量门槛

- [x] 冻结 PRD SHA 已计算并匹配给定值。
- [x] 已分隔既有基线、本次 v4.0 候选新增及明确不做；v3.5 视频课程未并入。
- [x] P1 主方案仅保留两个既有候选 SKU；未新设 P1 add-on、Lifetime 或 Teacher 方案。P2 PDF Pack 是后置上线 SKU，上线前暂不可购买，门禁关闭后须进入开放购买验收。
- [x] Free/Pro 核心额度、重置、超额、失败返还/关闭行为已冻结为候选参数；未作无上限承诺。
- [x] Yearly 明确为 500 AI credits/UTC 自然月，成本按 12 个月计提，且同步至套餐、时钟、entitlement 与 QA。
- [x] `A/U/L_audio/L_audio_free/S/R/F/T/Q/E` 均有非零区间、单位/数量表达式、来源或待签署证据入口、访问日期、cap、去重键、关闭责任和最小关闭证据；Free 音频 all-in 30 日成本已单列。
- [x] 已用 Decimal 复算含 T、L_audio、退款/拒付 Q 的订阅单用户及 10/50/100 情景，并给出 PDF Pack 扣减 Q 的独立单位经济。
- [x] HSKLord 官方 Web pricing/store/terms 和产品详情页核验已纳入；Apple App Store 的 US$14.99/月、US$99.99/年及 Google Play 的 US$14.99–99.99 区间仅作 App 次要证据，Google Play 不推断具体周期，且不混入 Web 对比。订阅及 PDF 的可比性矩阵覆盖要求维度；订阅矩阵的每项均写明前序已核验事实或证据边界，未将价格作绝对低价判断。
- [x] P2 PDF Pack 仅有一个有界后置上线 SKU，包含内容、下载、许可/撤回、退款候选门、上线前暂不可购买硬闸与门禁关闭后的开放购买验收；未扩展为视频、Teacher/School 或 Lifetime。
- [ ] 选定支付栈真实费率、账户 API/订阅/webhook/退款能力、税务、退款/拒付、AI/音频/存储实测成本尚未取得；阻断支付/价格发布与 P2 开放购买验收，不阻断本候选稿独立复审。

### 11.1 校验器人工告警处置

- 不得出现 unlimited：用户可见权益不使用 unlimited；报告中的“无上限”仅为内部风险否定表述。
- 必须有竞品定价表：见第 4 节 HSKLord 官方竞品核验与可比性矩阵；未复核的历史背景不作为数值定价依据。
- 必须有单位成本：见第 7.1 节 `A/U/S/R/F/T/E` 单位、表达式和场景预算。
- 必须有 Pro 额度上限：见第 5.2 节 500 credits/账期候选上限与账本/速率/并发约束。

## 12. 待确认事项

|分层|待确认项|影响|获取方式|
|---|---|---|---|
|阻断支付/价格发布|支付商、账户 API/订阅/webhook/退款能力与适用费率|订单、自动续费、对账与贡献额|技术+财务沙箱/账户验证|
|阻断支付/价格发布|主体、目标辖区、税务价格展示/申报责任|税务、条款、checkout 文案|Owner/财税或法律顾问确认|
|阻断 P1 受限 AI 启用|供应商、模型、输入最小化、单位成本、数据处理|额度、隐私、成本|技术/合规完成测试与 DPA/条款评审|
|阻断 P2 Pack 开放购买验收|签署音频/PDF/离线商业再分发许可、导出成本、支付和退款合同、导出取消/过期/撤回及独立复审|资产销售、交付、撤回与开放购买|内容权利清单、供应商报价、实际用量、P2 QA 和开放购买验收证据|

## 13. 下游交接摘要

- 当前结论：主建议保留 Pro Monthly $5.99、Pro Yearly $49 与 P2 PDF Pack $9.99 候选价，现价不作线上改动。P0/P1/P2 都是 PRD 要求上线范围；P2 为后置实施，上线前暂不可购买，硬闸关闭后必须完成开放购买验收。Free/Pro 的学习与音频额度、Yearly AI 月度重置、Free `U_free+L_audio_free` all-in 成本、`T/L_audio/Q` 压力模型及 P2 PDF Pack 扣减 Q 均已保留。没有发布授权。
- 已确认输入：冻结 PRD v4.0（SHA256 `09b5b7b8a372fedd6f472368381187bf4ed71818a6316200b266640b02f29688`）、v3.3 既有定价资料、前序完成的 HSKLord Web pricing/store/terms 与产品详情页核验，以及 App 次要价格证据（Apple US$14.99/月、US$99.99/年；Google Play US$14.99–99.99 区间，不能推断具体周期）；v3.5 视频课程排除。
- 关键风险：支付账户 API/订阅/webhook/退款能力、税务、供应商实际费率/成本、音频/PDF 权利、账号与未成年范围均未冻结。
- 交付物：本报告；`scripts/verify_hskkit_pricing_v40.py`。
- 唯一允许的下一步：独立复审本候选稿；不得据此启动 Stage04 或文案、开发、配置、支付、生产上线。P2 仅在其实施阶段、硬闸关闭和开放购买验收通过后才可开放购买。

## 14. 交付物

1. 主报告：`docs/pricing/hskkit-pricing-report-v40-owner-review.md`
2. 可复跑审计：`scripts/verify_hskkit_pricing_v40.py`
3. 交付副本：`/root/.hermes/profiles/hegui/cache/documents/hskkit-pricing-report-v40-owner-review.md`（在验证、字节比对与哈希一致后复制）

[NEEDS_REVIEW]
