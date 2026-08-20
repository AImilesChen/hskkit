# HSKKit Stage 07 首批开发清单

> 当前状态：SCOPE FROZEN，尚未开始编码。
>
> 本文件只定义第一批实际代码范围；本次基线任务不修改功能、不部署。

## 1. 首批目标

只执行 PRD Backlog `TSK-P0-01`：

**建立 HSK 2.0 / HSK 3.0 隔离的版本化内容合同、Level 1–9 清单、音频权利/版本清单和机械质量门。**

本批不做页面改版、API、数据库、账号、支付、部署，也不宣称 HSK 3.0 Level 1–9 内容已上线。

## 2. 为什么首批从这里开始

当前页面和题库可以继续为用户提供传统 HSK 学习，但存在四个不能直接向上开发的问题：

1. 数据没有 `standard_version`，会混淆 HSK 2.0 与 HSK 3.0。
2. 只有传统 HSK 1 有完整 150 词 JSON；HSK 2–5 页面只是少量示例，HSK 6 是占位，HSK 3.0 Level 1–9 不存在。
3. 内容没有 `content_version/source_ref/license_ref/qa_status/publish_status`，无法安全发布、撤回或回滚。
4. 音频没有权利、QA、版本和撤回清单；提前做播放器会把未授权资产暴露给用户。

因此先建数据合同和验证门，后续 Dictionary、Placement、Practice、Today/SRS 才能共享同一真源，不会重复迁移。

## 3. 本批实际代码范围

### B1 内容类型与状态合同

拟新增：

- `src/lib/content/contracts.ts`
- `src/lib/content/status.ts`

包含：

- `StandardVersion = "hsk_2_0" | "hsk_3_0"`；
- `LevelBand`：传统 1–6 与 HSK 3.0 Level 1–9 的明确结构；
- `ContentAssetType`：word/sentence/character/reading/grammar/question；
- `QaStatus`、`PublishStatus`；
- `ContentAssetRecord` 必填字段；
- `AudioAssetRecord` 必填字段和 `cache_right/offline_right`；
- `AssetManifestRecord`、`AudioLicensePoolRecord`；
- 发布规则：缺来源、许可、QA、版本或标准信息时只能 draft/in_qa，不能 published。

验收：类型层不能表达“无标准版本但已发布”“无许可音频但已发布”等非法状态。

### B2 版本化内容清单

拟新增：

- `content/catalog/manifest.json`
- `content/catalog/hsk-2.0/manifest.json`
- `content/catalog/hsk-3.0/manifest.json`
- `content/audio/manifest.json`
- `content/licenses/README.md`

要求：

- Level 1–9 每个 level 都有 manifest 条目；没有已核验内容时状态必须是 `not_ready`，不得生成空 SEO 页面。
- 每个内容文件记录 `standard_version`、`level_band`、`content_version`、`source_ref`、`license_ref`、`qa_status`、`publish_status` 和 SHA-256。
- 音频清单记录 transcript、pronunciation、tones、speech_rate、voice_or_engine、来源、许可、cache/offline 权利、QA 和 version。
- 权利未知时使用明确的 `unverified`/`not_publishable`，不得伪造 `license_ref`。

验收：清单可机械枚举、校验和回读；不存在“文件在但清单无记录”或“清单 published 但文件/权利不存在”。

### B3 现有数据隔离迁移

拟新增迁移输出目录：

- `content/catalog/hsk-2.0/legacy/`

迁移输入只读取、不覆盖：

- `src/lib/data/hsk1.json` 至 `hsk5.json`；
- `src/lib/data/level_test.json`；
- `src/lib/data/hsk1_vocab.json`；
- `src/lib/data/reading-hsk1.json`；
- HSK 2–5 页面内的 `sampleWords` 只作现状证据，不自动升级为完整正式词库。

迁移规则：

- 现有数据统一标注为 `hsk_2_0`/legacy；
- 旧题库元数据与文件实际 count 不一致时，以真实文件解析结果为准，并输出差异报告；
- 不把传统等级映射成 HSK 3.0 等级；
- 不修改当前页面引用，确保用户功能不受本批影响。

验收：现有线上功能数据源完全不变；迁移副本可验证；HSK 2.0/3.0 无交叉引用。

### B4 验证脚本

拟新增：

- `scripts/validate-content-catalog.mjs`
- `scripts/verify-standard-isolation.mjs`
- `scripts/verify-audio-rights.mjs`
- `scripts/report-current-data-inventory.mjs`

检查项：

- JSON schema/必填字段；
- ID、slug、content version 唯一性；
- `standard_version + level_band` 合法组合；
- manifest 文件存在、SHA-256 匹配；
- published 内容的 source/license/QA 完整；
- published 音频的权利和 QA 完整；
- withdrawn/not_ready 不进入 public/indexable 集合；
- 旧 count 与实际文件 count 差异；
- HSK 2.0/HSK 3.0 交叉污染。

验收：非法 fixture 必须失败，合法 fixture 必须通过；脚本失败码非 0，适合后续 CI 门禁。

### B5 自动化测试

拟新增：

- `tests/content/contracts.test.ts`
- `tests/content/catalog-validation.test.ts`
- `tests/content/standard-isolation.test.ts`
- `tests/content/audio-rights.test.ts`
- `tests/fixtures/content/valid/`
- `tests/fixtures/content/invalid/`

必测：

- 缺 `standard_version`；
- HSK 3.0 Level 越界；
- 重复 ID/version；
- published 但缺 `license_ref`；
- published audio 但缺 cache/offline 权利结论；
- withdrawn 被加入 public manifest；
- hash 不匹配；
- HSK 2.0 内容被错误放进 HSK 3.0 manifest。

### B6 开发文档

拟新增：

- `docs/content/CONTENT-CONTRACT.md`
- `docs/content/AUDIO-RIGHTS-GATE.md`
- `docs/content/MIGRATION-REPORT-HSK2-LEGACY.md`

说明：字段、发布门、撤回/新版本回滚方式、旧数据边界、未知权利如何保持禁用。

## 4. 本批明确不做

- 不修改任何 `src/app/**` 页面、组件、文案、导航或 CSS。
- 不实现 `/levels`、`/dictionary`、`/placement`、`/practice/:level/:skill` 或其他目标路由。
- 不新增 API route。
- 不新增 D1/R2/KV/Queue binding，不创建生产资源。
- 不实现 Auth、账号、同步、SRS、Streak、AI、Stripe、PDF。
- 不上传或生成真实音频；不自行选择许可方。
- 不把占位数据、样例词或未经核验资料标记为 published。
- 不改 SEO、sitemap、robots。
- 不部署。

## 5. 本批门禁与完成定义

代码完成后必须按以下顺序验收：

1. 新增测试先覆盖非法状态并确认失败，再实现到通过。
2. 运行内容清单、标准隔离、音频权利、现有数据盘点四个脚本。
3. 运行 lint/typecheck/test/build；只修复本批引入的问题。
4. 核对 `git diff`，确认 `src/app/**`、`wrangler.jsonc` 和部署配置未变化。
5. 独立复审字段完整性、HSK 2.0/3.0 隔离、权利禁用和无空页风险。
6. 不部署；本批只提交代码和验证证据。
7. 创建本批独立回退标签后暂停，等待 Owner 确认下一批。

本批完成的准确表述应是：

> “版本化内容和音频权利门已建立；现有数据已隔离盘点；尚未对外上线 HSK 3.0 Level 1–9、音频或新页面。”

## 6. 下一批边界（仅说明依赖，不提前启动）

`TSK-P0-02` 才会在首批通过并经 Owner 确认后，建立 ContentAsset/AudioAsset QA 与发布/撤回流程；不得在本批提前实现。
