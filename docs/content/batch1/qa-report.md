# 批次1 QA 报告

## 定向校验结果

- 汉字字段：PASS；每条至少包含中文字符，禁止空值。
- 拼音与声调：PASS；11,092 条均有来源拼音并通过字符/控制符校验。
- 英文释义：PASS；11,092 条均非空并包含英文文本。
- 重复词：PASS WITH RESOLUTION；13 条同级同字同音记录为官方不同词义/词性，使用独立 source ID 保留；资产 ID 无重复。
- 错级：PASS；Level 1–6 逐级保留，Levels 7–9 只保留统一 band。
- 空字段：PASS；发布合同必填字段为 0 空值。
- HSK 2.0/3.0 隔离：PASS；本发行 HSK 2.0 条目为 0。
- 音频权利：PASS；未批准音频为 0，正式音频资产为 0。
- Manifest/仓库/D1 seed/API/页面状态：预期均为 11,092；生产回读在部署阶段记录。

## 发布门

API 只从 active release 查询，且发行中的每条内容必须同时满足：

- `qa_status = approved`
- `publish_status = published`
- `authorization.status = authorized`
- 来源与许可字段非空

撤回发行或无 active release 时 API 不返回内容；无内容级别不生成可索引静态页。
