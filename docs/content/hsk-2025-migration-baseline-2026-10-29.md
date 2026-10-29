# HSK 2025 迁移基线（阶段 0）

记录时间：2026-10-29 07:30–07:49 UTC。范围：只读盘点；本文件不改变线上内容、学习记录、数据库或 Cloudflare 配置。

## 1. 可回退的代码与发布锚点

| 项目 | 已核对值 | 证据 |
| --- | --- | --- |
| 当前生产分支 | `fix/review-playback-current-prod-20261004` | [GitHub 分支](https://github.com/AImilesChen/hskkit/tree/fix/review-playback-current-prod-20261004) |
| 分支提交 | `73d61b98269f706f2b6e8c0b95a7c7c630a81720` | 2026-10-29 06:45:07 UTC 的合并提交 |
| 生产部署 | GitHub Actions run `40831110406`，`success`，06:46:57 UTC 完成 | [部署记录](https://github.com/AImilesChen/hskkit/actions/runs/40831110406) |
| 代码回退锚点 | 上述完整提交 SHA | 后续必须从此提交重建并发布；单独回滚代码不会自动回滚 D1 数据 |

生产分支和本地盘点使用同一个提交。工作区另有未提交的页面改动，未纳入本次基线；以下数据均从该生产提交直接读取。

## 2. 当前词汇内容快照

活跃 HSK 3.0 release 为 `hsk3-content-truth-v5`，发布日期 `2026-08-25T03:05:24.000Z`。公开索引共有 **11,092** 个词条；11,092 条的 `standard_version` 均为 `GF0025-2021`。这不是 2025 考试大纲的词汇表。

| 等级 / 分组 | 当前词条数 |
| --- | ---: |
| HSK 1 | 500 |
| HSK 2 | 772 |
| HSK 3 | 973 |
| HSK 4 | 1,000 |
| HSK 5 | 1,071 |
| HSK 6 | 1,140 |
| HSK 7–9 统一分组 | 5,636 |
| **合计** | **11,092** |

`catalog.json` 有 11,107 个内容资产：11,092 词条、7 语法、7 阅读、1 句子；另有 676 个音频资产。7–9 统一分组在资产记录中使用 `level=7`，不可误当成仅 HSK 7 的词表。数量差异不能直接推断哪些词要增删，必须逐条对照新版大纲。

| 生产文件 | 字节数 | SHA-256 | Git blob SHA |
| --- | ---: | --- | --- |
| `src/lib/content/catalog.json` | 10,631,549 | `5f8075ae76a79a777fafd0b631e5ab909912df6c0ff0f08f29e6918bf1bb672a` | `3a8523ac4e612ecc4094ee967a540883c50dce91` |
| `src/lib/content/public-catalog-index.json` | 2,212,935 | `e435ebd48041fa75529f6395de18c2ac5c726dad1cd4ba3cae6375fc23bfb1a0` | `88f87a8e016d0b10e9e673eb242e470136e8263d` |
| `src/lib/content/runtime-content-index.json` | 993,062 | `6073f26ca35fc42c5484c3fa984b4e42a4a64c1a2b4d773bcdf4b47593dc6a27` | `9003b86f5afba3fac8911ef0e7815f30bd831e4c` |

可复核命令：`git show 73d61b98269f706f2b6e8c0b95a7c7c630a81720:src/lib/content/public-catalog-index.json`，其余文件同理；哈希需针对 Git blob 的原始字节计算，不应对 PowerShell 显示文本计算。

## 3. 页面、数据与学习记录的关联

- 公开入口包括 `/hsk-3-0`、`/vocabulary/1` 至 `/vocabulary/9`、`/word/[slug]` 和 `/api/v1/catalog/words`。`sitemap.ts` 动态列入词条详情与可用的等级页。词条页和等级页设置 `revalidate = 86_400` 秒；普通词汇查询响应设 `s-maxage=120` 秒，闪卡模式为 `no-store`。
- 词条 ID 形如 `hsk3.word.l1.0001.v1`。`learning_states.state_json` 包含 `attempts`、`cards`、`mistakes`、`dailySessions`、`savedWordIds` 等；这些对象依赖内容 ID 和版本。`study_plan_versions` 也按用户保存学习计划。仅换词表会让旧 ID 的复习、错题或 Today 项失去内容关联。
- 因此迁移时需要旧 ID → 新 ID 的逐条映射，并保留无法确定映射的旧记录供用户查看；不能删除、重置或用新词覆盖原有学习历史。[Cloudflare D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) 自动保留可恢复的时间点。生产 `hskkit-learning` 的 Time Travel 页面已显示 **过去 30 天**的恢复窗口；本次以 **2026-10-29 07:49 UTC** 作为基线时间锚点。Cloudflare 支持按 UTC 时间戳恢复；本次没有点击“恢复”，也没有导出用户数据。这个锚点约 30 天后失效，首次写入迁移前须刷新锚点，并校验 `learning_states` 等表的行数。若迁移跨度超过恢复窗口，须另做受保护的长期导出。
- 当前站点的旧标签与 2025 内容尚未替换。本基线不代表新版内容已上线。

## 4. 新版依据与使用权状态

- [官方 HSK 页面](https://www.chinesetest.cn/HSK) 链接到[《新版 HSK 考试大纲》PDF](https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B21219.pdf)。PDF 标示 2025-11 发布、2026-07 实施，词汇表到序号 11,000，按 1–6 与 7–9 分组。此处只记录来源，未抓取后再分发整个词表。
- [官方 Legal Notice](https://www.chinesetest.cn/legal-notice) 规定了来源标注、合理引用和部分内容的转载限制。它没有说每个单词、拼音或等级事实都必须另行申请授权。HSKKit 可以核对公开大纲的等级事实，并使用已有许可的数据和自编释义、例句、练习制作独立教学内容；应清楚标注所依据的官方大纲。不要直接复制官方 PDF、页面版式、原文说明、题目或音频到站点及付费资料包。若以后计划原样再分发官方整份词表或大纲，应单独核对授权条件。此处是产品实施边界，不构成法律意见。

## 5. Cloudflare 生产用量基线

生产 Worker 为 `hskkit`，D1 绑定为 `hskkit-learning` 与 `hskkit-placement`。2026-10-29 约 07:49 UTC，用户从 Cloudflare 后台提供了以下截图读数；时间筛选均为**过去 24 小时**。读数经过界面四舍五入，不应当成精确计费账单或逐路由指标。旧截图不纳入本基线。

| 指标 | 截图显示值 | 解释边界 |
| --- | ---: | --- |
| Worker 调用次数 | 37.5k | 全 `hskkit` Worker，未按 URL 拆分 |
| Worker 错误 | 0 | 此 24 小时窗口的界面计数 |
| Worker CPU 时间卡片 | 31 ms | Cloudflare 面板显示值；不是全天 CPU ms 总量 |
| 当前部署版本 CPU 时间中位数 | 111.25 ms | 部署版本显示为 `6e20f07a`，不能直接与 Git 提交 SHA 比较 |
| Asset 请求 | 4.19k | 静态资源请求 |
| Asset 缓存命中率 | 94.13% | 静态资源缓存，不代表全部 Worker 请求均命中缓存 |
| D1 查询总数 | 约 2k | `hskkit-learning` |
| D1 已读取行 | 约 17k | `hskkit-learning` |
| D1 已写入行 | 506 | `hskkit-learning` |
| D1 当前存储 | 43.32 MB | 截图时点，不是 24 小时累计 |
| D1 表数 | 78 | 截图时点 |

Cloudflare 的 `hskkit-learning` Time Travel 页面明确显示可按日期或书签 ID 恢复**过去 30 天**，窗口右端是 `29 October 2026, 07:49`。该页面的“还原数据库”会覆盖当前数据库；本次未操作它。恢复时间锚点为 `2026-10-29T07:49:00Z`；没有另行获取书签 ID，也没有导出私有记录。

在第一次内容迁移前，刷新恢复时间锚点，并从同一时间窗口（建议最近 7 个完整自然日，并注明 UTC）补充：

1. Workers：请求数、CPU ms 总量与每请求 P50/P95、异常数/错误率；区分 `/vocabulary/*`、`/word/*`、`/api/v1/catalog/words` 的流量，若仪表盘不能按路由拆分则明确写“无路由分解”。
2. D1：`hskkit-learning` 的数据库大小、读取行数、写入行数；只做聚合计数，不导出用户内容到仓库。
3. 部署后同口径对比，若 CPU/请求或错误率显著增加，暂停下一等级发布并回退代码到上述提交；若已写入用户数据，需要按单独验证的 D1 恢复方案处理，不能只回退代码。

## 6. 阶段 0 结论与进入下一阶段的门槛

**阶段 0 基线已建立**：生产代码锚点、旧词汇各级数量、内容文件指纹、学习记录依赖、Cloudflare 24 小时用量快照和 D1 30 天恢复时间锚点均已记录。没有更改线上数据。

迁移前仍需执行的准备：刷新会过期的恢复锚点、取得学习数据聚合计数、视迁移时长决定是否做长期导出、取得同口径的 7 天指标以减少单日波动。新版独立教学内容可以按级制作和验证；原样再分发官方材料的使用权仍须另行确认。当前不应把 2021 词条直接改标为 2025，也不应清除旧学习记录。
