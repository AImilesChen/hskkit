# HSKKit Stage 07 开发基线

> 状态：FROZEN FOR STAGE 07 IMPLEMENTATION
>
> 用途：Stage 07 开发、验收与回退的唯一版本化输入链。
>
> 本次仅固化文档和设计真源，不修改产品功能、不部署、不启用支付。

## 1. 权威顺序

发生冲突时按以下顺序处理：

1. Owner 已确认的产品范围与本阶段指令。
2. `docs/product/HSKKit-PRD-v4.0-owner-review.md`。
3. `docs/pricing/hskkit-pricing-report-v40-owner-review.md`。
4. `docs/compliance/HSKKit-Compliance-v1.4.md`。
5. `docs/copywriting/HSKKit-Copy-Freeze-v1.3.md`。
6. `docs/stage07/baseline/stage06-design-truth/metadata/canonical-manifest.json` 中的 54 个 adopted Stitch Screen。
7. Stage 06 包内的 HTML、截图、设计系统和 handoff。
8. 现有生产代码只代表“当前实现”，不得反向覆盖以上冻结合同。

历史 Screen、deprecated Screen、Stage 06 中间候选和旧文案不得实施。

## 2. 固化输入及校验值

- PRD v4.0：`docs/product/HSKKit-PRD-v4.0-owner-review.md`
  - SHA-256：`09b5b7b8a372fedd6f472368381187bf4ed71818a6316200b266640b02f29688`
- 定价 v4.0：`docs/pricing/hskkit-pricing-report-v40-owner-review.md`
  - SHA-256：`1cad5f9c79477de89838918a9b3ee45acdf4a24226e6de3c6400624ac782362e`
- 合规 v1.4：`docs/compliance/HSKKit-Compliance-v1.4.md`
  - SHA-256：`b34c9168f1594e8bb057da32190865c65812d098bf9143dbe763388dc83d02be`
  - 文档层结论：`GO — STAGE04 DOCUMENT ONLY`
- 冻结文案 v1.3：`docs/copywriting/HSKKit-Copy-Freeze-v1.3.md`
  - SHA-256：`1faf3f921b24b7afd8d26ec41cb69212caf9995aff0fc94149b7aa16b2704229`
- Stage 06 canonical manifest：`docs/stage07/baseline/stage06-design-truth/metadata/canonical-manifest.json`
  - SHA-256：`e5099d099f46430a7121e75a896803c0e4ef214252079e075ff360fddf22fb2a`
  - Gate：`GO`
  - Screen：54 个 adopted、54/54 官方 `get_screen` 回读
  - Stitch Project：`5509035292021811601`
- Stage 06 Final Gate：`docs/stage07/baseline/stage06-design-truth/reports/FINAL-GATE.md`
  - SHA-256：`6d43cc0359daa06c3b2fdb64ef68cf12a346ca4a6395666b25154a32adb9312e`

## 3. Stage 06 真源目录

`docs/stage07/baseline/stage06-design-truth/` 是正式 Stage 06 包的原样副本，包含：

- `metadata/canonical-manifest.json`：54 个 adopted Screen ID、设备、HTML/截图路径及哈希；
- `metadata/design-system.json`：冻结设计系统；
- `html/`、`screenshots/`：官方 Stitch 导出；
- `handoff/implementation-handoff.md`：实现规则；
- `deprecated/`：禁止实施的历史 Screen；
- `source-inputs/`：当时进入 Stage 06 的产品、定价、合规、文案输入快照；
- `reports/FINAL-GATE.md`：Stage 06 GO 结论。

品牌主色固定为 `#2563EB`；Desktop 与 `390×844` Mobile 均须按 adopted Screen 实现和验收。

## 4. 当前禁用边界

以下不是范围取消，而是当前不得对外启用：

- Stripe Live、真实订单、真实扣款；本阶段后续支付开发先限 Stripe Test，Live 需 Owner 另行授权。
- `/checkout/*`：Stage 06 Screen 为 BLOCKED；未配置时不得创建订单。
- `/mock/:band`：Stage 06 Screen 为 BLOCKED，待 P2 高级考试模型及题库门禁完成。
- `/exports`、`/pdf-packs`：Stage 06 Screen 为 PLANNED，待 P2 权利、生成、撤回、下载与退款门禁完成。
- 未具备内容许可、`license_ref`、QA 和撤回能力的音频播放与离线下载。
- 未完成供应商、数据处理、额度、失败返还和审计门禁的 AI 调用。
- 未获批准的自动发音评分；跟读只记录 attempt 和用户自评。
- v3.5 视频课程、教师/学校后台、社区/UGC、原生 App、Lifetime。

## 5. 当前代码事实

基线检查时：

- Next.js App Router + OpenNext/Cloudflare Worker；
- 22 个页面路由；0 个 API route；
- `wrangler.jsonc` 只有 Assets、service self-reference 和 Images，无 D1/R2/KV binding；
- 无数据库 migration/schema；
- 无 auth、Stripe、entitlement、webhook；
- 无自动化 test/spec 文件；
- 现有 Practice 结果只保存浏览器 `localStorage` 7 天；
- 现有 Level Test 为前端内存态；
- 当前数据是传统 HSK 1–5 练习题、传统 HSK 1 完整词表和少量内容页，不是 HSK 3.0 Level 1–9 版本化内容底座。

完整分类见：`docs/stage07/Stage-07-功能差异矩阵.md`。

## 6. 交付与回退规则

- 本基线提交只包含文档、设计真源和差异清单，不包含功能代码或部署。
- 回退标签指向本基线提交；后续每个开发批次必须从该标签可恢复。
- 后续如冻结输入变化，必须新建版本和决策记录，不得静默覆盖本目录。
