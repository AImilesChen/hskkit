# HSKKit Stage 07 唯一总矩阵 v2（冻结）

- 状态：`FROZEN`
- 冻结日期：2026-08-22
- 作用：从本文件冻结后，HSKKit 前八步及后续有界批次只以本矩阵作为 Requirement 分母、范围边界和验收入口；旧的阶段性汇报不能替代本矩阵。
- 冻结 PRD：`docs/product/HSKKit-PRD-v4.0-owner-review.md`
- PRD SHA256：`09b5b7b8a372fedd6f472368381187bf4ed71818a6316200b266640b02f29688`
- Stage 06 canonical manifest SHA256：`e5099d099f46430a7121e75a896803c0e4ef214252079e075ff360fddf22fb2a`
- 冻结代码提交：`7e265a2ab764e7d3c93d13484d3ef5e5d62b08e1`
- 远端分支：`origin/stage07-content-foundation` 指向同一提交。
- 批次 9 生产 GO 标签：`hskkit-batch9-prod-go-20260822T064749Z`，peeled commit 指向同一提交。
- 批次 9 最终报告 SHA256：`566d10d6ceb283e9783ecce16fb6b19418e5ad5610f84207551ebf797dae1560`
- Requirement 分母：38；P0=21，P1=12，P2=5。

## 1. 状态与证据等级

- `DONE`：当前冻结版本已具备需求主合同，并有自动化或生产证据；不代表未来内容数量永久完整。
- `PARTIAL`：已有实现或相邻能力，但该 Requirement 的全部验收合同尚未闭合。
- `OPEN`：未形成可验收实现，或按当前产品边界明确保持关闭。
- `L3`：生产真实流/生产回读 + 自动门禁。
- `L2`：代码 + 定向自动化/构建证据；生产仅有批次级证据。
- `L1`：存在代码/页面或局部能力，但缺完整验收证据。
- `L0`：无可验收实现。

重要边界：2026-08-22 冻结时，从当前服务器使用非浏览器 HTTP 客户端重探 `hskkit.com` 返回 Cloudflare `403`。因此本矩阵的生产状态绑定批次 9 已归档浏览器证据与远端 GO 标签，不把本次 403 探测误当作功能失败，也不把它当作新的生产通过证据。

## 2. 38 条 Requirement 唯一总矩阵

| Requirement | 优先级 | 状态 | 证据 | 冻结结论 / 缺口 |
|---|---:|---|---|---|
| REQ-LVL-01 | P0 | DONE | L3 | HSK 3.0 默认隔离、标准/等级/内容版本合同已进入发布目录与生产门。 |
| REQ-LVL-02 | P0 | DONE | L3 | Level 1–7 为已发布正式内容；Level 8–9 明确 `gap`，满足“已发布或明确缺口”，不得宣传完整 1–9。 |
| REQ-LVL-03 | P1 | PARTIAL | L1 | 已有统一高级学习/听力入口，但 `/mock/:band` 统一高级诊断与能力区间合同未完整验收。 |
| REQ-LVL-04 | P0 | DONE | L2 | 内容版本、撤回和历史 Attempt 可追溯合同已有目录/领域测试。 |
| REQ-AUD-01 | P0 | DONE | L2 | 音频来源、许可、使用权、版本、QA 与报告门已有模型和发布阻断测试。 |
| REQ-AUD-02 | P0 | DONE | L2 | reading/audio/context_audio mastery 分离并有领域测试。 |
| REQ-AUD-03 | P0 | DONE | L3 | 音频 SRS、播放后评分、恢复与无可用音频降级已纳入学习闭环。 |
| REQ-AUD-04 | P0 | DONE | L3 | 播放状态、失败不写 mastery、重播幂等及恢复路径已有测试与生产流证据。 |
| REQ-AUD-05 | P1 | DONE | L3 | 分级听力与高级听力素材已发布；跟读仍保持“未评分”边界，不输出伪分数。 |
| REQ-LEARN-01 | P0 | DONE | L3 | Today/Daily Session 的 Review→Learn→Listen/Practice→Summary 主链与版本规则已验收。 |
| REQ-LEARN-02 | P0 | DONE | L3 | SRS card/grade/due/算法版本/来源 attempt 与幂等提交已验收。 |
| REQ-LEARN-03 | P0 | DONE | L3 | Practice 错题进入 Mistakes/Review，复练保留原 Attempt 与解决状态。 |
| REQ-LEARN-04 | P1 | DONE | L2 | streak 以完成学习事件和账号 IANA 时区计算；访问页面不计 streak。 |
| REQ-LEARN-05 | P0 | DONE | L3 | Guest merge preview/confirm/skip、幂等合并与生产真实账号流已验收。 |
| REQ-LEARN-06 | P1 | DONE | L3 | 跨设备 revision 同步与冲突规则已验收；导出/删除请求具有状态机领域合同。 |
| REQ-LEARN-07 | P1 | DONE | L3 | 服务端真相、断网失败提示、恢复后恰好同步/继续与冲突状态已验收。 |
| REQ-AI-01 | P1 | DONE | L2 | AI 身份/额度/成本/速率/降级与无供应商替代路径已有有界实现和测试。 |
| REQ-AI-02 | P1 | DONE | L2 | 输入最小化、输出安全、供应商失败、重试边界及非考试承诺已有测试。 |
| REQ-PDF-01 | P2 | OPEN | L0 | 高级 PDF/PDF Pack 尚未获批上线；授权、下载权益、撤回与退款合同待后续独立批次。 |
| REQ-PDF-02 | P2 | OPEN | L0 | 异步导出、取消和过期链接未形成生产实现。 |
| REQ-PAY-01 | P1 | OPEN | L0 | 商业配置未获批；当前不得展示虚构价格或创建订单，`/pricing` 待独立商业批次。 |
| REQ-PAY-02 | P1 | OPEN | L0 | checkout 状态机与权益生效链未启用；Payment Live 明确禁止。 |
| REQ-TEST-01 | P0 | DONE | L3 | Placement 已绑定题库/标准/技能/版本；缺 Listening 时明确降级。 |
| REQ-TEST-02 | P0 | DONE | L3 | 推荐起点、证据、不确定性、重测及下一步入口已生产验收，非官方成绩。 |
| REQ-TEST-03 | P0 | DONE | L3 | Practice 逐题反馈、版本 Session/Attempt、刷新恢复和幂等提交已验收；Mock 扩展不冒充 P0。 |
| REQ-TEST-04 | P0 | DONE | L3 | 报题、撤回、版本审计与历史 Attempt 可解释合同已进入自动门。 |
| REQ-TEST-05 | P2 | OPEN | L0 | HSK 7–9 正式 Mock 未获批开放；不能启动伪模考。 |
| REQ-TEST-06 | P1 | PARTIAL | L1 | Placement/Practice 已可进入后续学习路径，Planner 本体已实现；Mock 输入与明确“创建/更新计划”取消合同未完整闭合。 |
| REQ-KNOW-01 | P0 | DONE | L2 | 词典检索、等级筛选、来源/版本/可用状态及无音频降级已有实现。 |
| REQ-KNOW-02 | P0 | DONE | L2 | 汉字页最小字段、真实 404/noindex 边界已有实现/门禁。 |
| REQ-KNOW-03 | P1 | DONE | L2 | 语法/阅读的任务、示例、练习和关联复习动作已有 Step 7 自动证据。 |
| REQ-KNOW-04 | P0 | DONE | L3 | sitemap 仅纳入已发布可索引内容；Level 8–9 gap 与撤回内容不伪装为有效页。 |
| REQ-PLAN-01 | P1 | DONE | L2 | goal/time/target/SRS/弱项、版本化计划、过载提示和调整理由已有有界实现/测试。 |
| REQ-OFF-01 | P2 | OPEN | L0 | 离线包未获批实现；无离线再分发权的音频不得进入包。 |
| REQ-PDF-03 | P2 | OPEN | L0 | PDF 包与用户练习数据隔离、生成版本及资产清单追溯未形成生产实现。 |
| REQ-PLAT-01 | P0 | DONE | L3 | 公开/私有边界、受控操作确认及无权请求拒绝已纳入生产权限探测。 |
| REQ-PLAT-02 | P0 | DONE | L3 | authenticated user/受控 guest token、写入幂等与审计标识已在核心流验收。 |
| REQ-PLAT-03 | P0 | DONE | L3 | loading/empty/error/unauthorized/withdrawn/网络失败状态与恢复动作已纳入双端用户流。 |

## 3. 冻结统计

- `DONE`：29
  - P0：21/21
  - P1：8/12
  - P2：0/5
- `PARTIAL`：2
  - `REQ-LVL-03`
  - `REQ-TEST-06`
- `OPEN`：7
  - P1：`REQ-PAY-01`、`REQ-PAY-02`
  - P2：`REQ-TEST-05`、`REQ-OFF-01`、`REQ-PDF-01`、`REQ-PDF-02`、`REQ-PDF-03`

## 4. 批次 10 精确范围冻结

本次第 0 步只冻结矩阵，不授权实施批次 10。若 Owner 后续明确授权批次 10，范围只能如下：

### ONLY

1. `REQ-LVL-03`：补齐 HSK 7–9 统一高级诊断/能力区间/替代训练入口，不拆成三张独立报名卷。
2. `REQ-TEST-06`：补齐 Placement/Practice 结果到 Planner 的显式创建/更新/取消合同；Mock 未开放时不得伪造 Mock 输入。
3. 仅执行上述两条直接影响到的路由、API、测试、双端用户流和证据归档。

### KEEP（不得回归破坏）

- 29 条 `DONE` Requirement 全部保持现状。
- HSK 1–7 已发布、HSK 8–9 `gap` 的真实内容边界保持不变。
- Placement 缺 Listening 时继续显示低置信度/缺失维度，禁止升级为官方成绩。
- Stage 06 canonical Stitch 真源、deprecated 排除和批次 9 生产基线保持不变。

### FORBIDDEN

- 不实施 `REQ-PAY-01/02`，不启用价格、订单、checkout、Payment Live 或权益发放。
- 不实施 `REQ-TEST-05`，不伪造 HSK 7–9 正式 Mock。
- 不实施 `REQ-OFF-01` 或 `REQ-PDF-01/02/03`。
- 不补造不存在的 HSK 8–9 正式内容、获批听力题、音频许可或考试评分口径。
- 不做全站重构、全局审计、无关 SEO/视觉改版或重复已通过门禁。

## 5. 批次 10 验收门（授权后才执行）

1. 两条 ONLY Requirement 的定向单测/集成测试全绿。
2. Typecheck 与受影响生产 Build 通过。
3. 桌面与 390×844 移动端完成：高级统一入口→诊断/替代训练，以及 Placement/Practice 结果→Planner 创建/更新/取消真实流。
4. 网络失败与恢复不丢状态、不重复创建计划。
5. 无 P0/P1 新回归；29 条 KEEP 不被破坏。
6. 独立 QA 明确 GO 后才可部署；生产回读与精确清理完成后才可创建新的回退标签。

## 6. 唯一性规则

1. Requirement ID 只允许来自本文件列出的 38 条；不得新增别名、合并、拆分或暗改优先级。
2. 后续状态变化必须逐行更新本矩阵，并绑定新的提交、生产证据和标签；口头汇报不改变状态。
3. `DONE` 不等于“全部正式内容永久齐全”；内容发布状态继续由版本化目录、授权与 QA 门决定。
4. 商业、Mock、离线、PDF 的 OPEN 状态是明确产品边界，不得用占位页面或演示数据冒充上线。
