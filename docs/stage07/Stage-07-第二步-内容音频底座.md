# HSKKit Stage 07 第二步：HSK 1–9 内容与音频数据底座

## 范围

本阶段只交付版本化内容底座，不开发 Placement、Today、SRS、Mistakes、Mastery、Planner、账号、支付或页面交互。

## 数据合同

- `HskStandard`：`hsk2 | hsk3`，所有 Level、ContentAsset、AudioAsset、Release 均强制携带标准版本。
- HSK 2.0：Level 1–6。
- HSK 3.0：Level 1–9，验证器要求 1–9 完整且不可重复。
- `ContentAsset`：版本 ID、稳定 logicalId、标准、等级、内容类型、递增版本、payload、来源、授权证据、QA 状态。
- `AudioAsset`：版本 ID、稳定 logicalId、关联 ContentAsset、标准、等级、递增版本、存储键、SHA-256、语言、发音人/引擎、语速、流式/缓存/离线再分发权利、来源、授权证据、QA 状态。
- `ContentRelease`：标准、递增版本、状态、内容/音频资产引用、发布时间或撤回时间。
- `activeReleaseByStandard`：HSK 2.0 与 HSK 3.0 独立活动版本指针。
- `releaseEvents`：记录 publish、withdraw、rollback 的目标版本、时间及原活动版本，回滚不改写历史版本。
- 各 Content kind 的 payload 使用字段白名单；同一资产谱系和同标准 Release 的版本必须从 1 连续递增。
- 同一 Release 不允许同时引用同一 `logicalId` 的多个版本；`releaseEvents` 必须可按时间重放并与最终活动指针一致。

权威类型与状态机：`src/lib/content/repository.ts`。

## 查询合同

```http
GET /api/v1/catalog/words?level=1
GET /api/v1/catalog/words?standard=hsk3&level=9
```

- 未传 `standard` 时固定使用 `hsk3`。
- 不允许其他 standard。
- 默认查询只读取 HSK 3.0 活动发布版本，不会混入 HSK 2.0。
- 生产目录不新建或启用 HSK 2.0 Release；显式请求 HSK 2.0 时返回 `503 CATALOG_UNAVAILABLE`，仅保留隔离合同供后续迁移已有旧数据。
- 当前阶段只发布底座级 HSK 3.0 Level 目录；尚未导入经授权审核的正式词条或音频时返回 `availability: gap`，不以空数组伪装成完整内容。
- 公开 DTO 不暴露存储键、校验和、授权证据或内部来源元数据。

## 发布门

发布 Release 前必须同时满足：

1. 所有 ContentAsset 的授权状态为 `authorized`。
2. 所有 ContentAsset 的 QA 状态为 `approved`。
3. 所有 AudioAsset 的授权状态为 `authorized`。
4. 所有 AudioAsset 的 QA 状态为 `approved`。
5. 音频必须有存储键、64 位 SHA-256、语言、发音人/引擎、语速、来源、许可证和 HTTPS 授权证据。
6. 音频必须显式允许 streaming；缓存与离线再分发权利分别记录，不能靠许可证字符串推断。
7. Release 内不允许混用 HSK 2.0 与 HSK 3.0 资产。

未授权、授权撤销、QA pending 或 QA rejected 的音频均无法发布；若活动版本中的音频在发布后被撤销授权或失去 QA approved 状态，后续查询也会立即 fail-closed，不继续返回该音频。撤回与回滚使用结构校验读取该仓库，仍可执行紧急恢复，输出结果再通过完整服务门。

## 发布、撤回和回滚

- `publish`：只允许 Draft，通过发布门后改为 Published 并切换该标准活动版本。
- `withdraw`：把 Published 版本标记为 Withdrawn；若它是活动版本则立即清除活动指针，查询停止返回其资产。
- `rollback`：只允许切回仍为 Published 的历史版本；不覆盖、不删除任何版本，并写入可审计回滚事件。

```bash
npm run content:release -- publish <repository.json> <release-id> <output.json> [ISO timestamp]
npm run content:release -- withdraw <repository.json> <release-id> <output.json> [ISO timestamp]
npm run content:release -- rollback <repository.json> <release-id> <output.json> [ISO timestamp]
```

所有写入命令显式指定新输出文件，拒绝输出路径与输入相同、拒绝覆盖已有文件，并通过同目录临时文件落盘后原子发布输出；审阅后再将输出替换为正式 `catalog.json` 并提交部署。

## 导入与校验

```bash
npm run content:validate
npm run content:import -- <repository.json> <batch.json> <output.json>
```

导入批次必须：

- 明确 `standard`。
- 只创建 Draft Release。
- 资产标准与批次标准一致。
- 不覆盖已有 ContentAsset、AudioAsset 或 Release ID。
- 同一 logicalId 的资产版本及同标准 Release 版本必须严格按下一版本递增。
- 通过完整仓库校验后才输出新文件。

## 验收对应

- Level 1–9 可查询：API 与 `queryCatalog` 行为测试。
- 可版本化：资产版本、Release 版本及独立活动指针。
- 可撤回：撤回后活动指针清除，查询不再返回该版本。
- 可回滚：切换到历史 Published 版本，版本内容不被覆盖。
- 默认不混入 HSK 2.0：默认 standard 固定 HSK 3.0，Release 引用也做同标准校验。
- 音频发布安全：授权和 QA 双门禁行为测试。
