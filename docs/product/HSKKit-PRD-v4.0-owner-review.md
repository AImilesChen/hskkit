# HSKKit PRD v4.0 Owner Review

> 文档状态：FROZEN
> 冻结版本：v4.0
> Owner 确认：陈敏建于 2026-08-11 在 Telegram 项目话题明确确认进入下一步定价复核。
> 基线：`/root/projects/hskkit/docs/product/HSKKit-PRD-v3.4-executable.md`。竞品与音频机会研究的已确认结论已吸收进本文；原研究附件不作为下游必读真源。
> 本文定义完整候选产品需求、状态、验收与产品实施依赖；不构成预算、供应商、技术方案、支付或上线批准。

---

## 1. 结论与产品边界

**结论：** 从 v3.4 的「HSK 1 每日练习工具」升级为 HSK 3.0 Level 1–9 的可持续学习系统，但实施按 P0/P1/P2 分层；先完成数据、音频、诊断—复习闭环与账号同步，再扩展高级训练、离线及数字产品。**P0、P1、P2 均属于本 PRD 明确要求上线的产品范围；P2 仅表示后置实施，不表示不做、不开发或不上线。**不得把等级覆盖或规划能力表述为已上线。

**定位：** HSKKit 是面向海外中文学习者的 HSK 3.0 学习与备考工具：用分级词汇、可验证音频、诊断测试、真实 SRS 和练习闭环，把一次搜索访问转为可恢复的每日学习。

**明确纳入：**
- HSK 3.0 Level 1–9 词汇与学习体系；HSK 7–9 按统一高级考试建模。
- 词汇、例句、听辨、声调、听写和跟读的分层训练；独立 audio mastery 与音频 SRS。
- Daily Session、SRS、错题恢复、streak、游客进度合并、跨设备同步。
- Placement、Practice/Mock、词典、汉字、语法、阅读、Study Planner、离线包/导出、高级 PDF/PDF Pack、AI 与商业化候选合同。

**明确隔离：**
- HSK 2.0 只作为历史对照/迁移说明，不与 HSK 3.0 学习队列、词库或成绩口径混合。
- 不纳入 v3.5 视频课程补丁；不纳入直播课、社区、教师后台、重 AI 对话陪练、移动原生 App。
- 不复制竞品的软 404、空 sitemap、失效 URL 或未经核验的套餐口径。

## 2. 现状与新增边界

|维度|v3.4 基线|v4.0 候选新增/调整|状态口径|
|-|-|-|-|
|学习范围|HSK 1 优先，HSK 2–3 后续|HSK 3.0 Level 1–9 数据与分层学习合同|规划，待实施|
|核心闭环|词汇、测试、阅读、字帖|Daily Session + 真实 SRS + 可恢复错题 + 同步|规划，待实施|
|音频|词卡可播放|词/句音频、独立听力 mastery、音频 SRS、QA 合同|规划，待实施|
|测评|基础 level/practice test|Placement → 学习队列；Practice/Mock → 错题/SRS|规划，待实施|
|付费|v3.4 曾提出 PayPal Pro 方向|Free/Pro 边界与支付/退款候选合同；价格/渠道待 Owner 确认|未批准|

## 3. 用户、任务与设计原则

### 3.1 目标用户与 JTBD

|主用户|关键任务（JTBD）|成功结果|
|-|-|-|
|初学/自学者（Level 1–3）|“我每天只有碎片时间时，帮我知道该学什么、听什么、复习什么。”|完成一个可中断恢复的 Daily Session，并看到下次队列|
|备考者（Level 3–6）|“我有考试目标时，帮我识别弱项并把练习转为复习。”|Placement/Mock 结果进入错题与 SRS，形成计划|
|高级学习者（HSK 7–9）|“我需要按高级统一考试能力而非三张静态词表学习。”|完成长句、正式语体和微听力训练，按能力反馈|
|教师/家长（次要）|“我需要可打印、可分享但不替代学习记录的材料。”|得到授权范围内 PDF Pack/导出；学生隐私不泄露|

### 3.2 产品原则

1. **标准先分离：** 所有内容标记标准版本；HSK 3.0 默认，2.0 历史内容不进入默认学习队列。
2. **听到不等于看懂：** reading_mastery、audio_mastery、context_audio_mastery 分别记录，互不自动抬升。
3. **先闭环再扩面：** 每项入口必须能回到练习、复习或计划；不为 SEO 制造空壳页面。
4. **免费保留核心价值：** 浏览、搜索、基础学习与诊断不被付费墙阻断；付费只对应明确的高级效率/资源权益。
5. **数据与版权可追溯：** 词、题、音频、PDF 都有版本、来源/权利、QA 与撤回状态。
6. **所有规划均为候选：** 没有验收证据即不可称上线；Owner 决策前不得部署。

### 3.3 成功指标（先冻结口径，基线待补）

|指标|定义|阶段目标/阈值|备注|
|-|-|-|-|
|学习闭环完成率|启动 Daily Session 后完成 Summary 的去重用户/启动用户|P0 建立基线；P1 再定目标|不以 page_view 代替|
|D7 复习回访率|首日完成会话且第 7 天产生 review_submit 的用户/首日完成用户|P0 建立基线|需 consent 与时区规则|
|音频有效学习率|完成 audio SRS 评分的播放次数/有效音频播放次数|P0 建立基线|播放≥指定最短阈值再计|
|诊断转队列率|Placement/Mock 完成后创建学习队列用户/完成测评用户|P0 建立基线|排除匿名重复|
|内容质量失败率|发布后被撤回或 QA fail 的词/题/音频资产数/已发布资产数|P0 阈值待 QA Owner 确认|按资产版本|
|商业化转化|付费权益生效用户/到达定价页的合资格用户|价格与渠道确认后启用|不得预设价格|

## 4. Non-goals

- 不承诺通过考试、准确等级、发音诊断结论或任何学习结果。
- 不在 P0 建设视频课程、完整口语自动评分、教师后台、社群或原生 App。
- 不把 AI Explanation/Study Plan 写成无限量服务；额度、成本上限与降级策略必须可配置。
- 不在 Owner 未确认前固化支付提供商、价格、退款期限、税务处理或一次性产品价格。
- 不将第三方音频、题目、词表或 PDF 重新分发，除非权利与用途已在资产合同中核验。

## 5. PRD 级 Owner Decisions

以下仅保留会改变产品方向、核心范围或用户承诺的决定。商业、供应商、支付、合规和生产细则不作为当前 PRD 阻断，统一留待下一阶段定价复核输入。

|ID|待确认的产品决定|不确认时的边界|
|-|-|-|
|OD-01|HSK 3.0 内容来源、可用范围与商业使用权是否支持 Level 1–9 产品方向|不发布无来源、无权利或无质量状态的内容；不把“Level 1–9”宣传成完整训练已上线|
|OD-02|音频路线是否支持词/句听辨、缓存与后续离线候选范围|无明确权利的音频不进入学习、下载或离线候选范围|
|OD-03|账号是否作为后续同步与个人学习记录的产品边界，以及未成年用户是否纳入目标用户|未确认前仅保留受控体验与明确的数据边界，不承诺跨设备同步或未成年人适配|

## 6. NEXT_STAGE_HANDOFF（Owner 确认后：先进入定价复核）

**下一阶段：定价复核。** Owner 对 §5 作出批准、拒绝或保留决定后，唯一串行下一阶段为定价复核，**不是合规初审**；本轮不启动定价、合规、供应商、生产配置、文案、设计、开发、部署、SEO、QA 或 E2E。

- 定价复核接收本 PRD 的产品范围、免费核心价值、候选高级能力、OD-01～OD-03 和 Non-goals。
- 定价复核再处理 Free/Pro 权益、价格、账期、支付渠道、取消/退款、税务、数字产品销售边界、AI/音频/导出成本与供应商约束；这些均非当前 PRD 阻断。
- 定价复核不得反向扩大本 PRD 的产品范围；未获批准的收费或数字产品不影响免费核心学习闭环。

## 7. 下游交接摘要

- **当前结论：** PENDING_OWNER_REVIEW；v4.0 是候选 PRD，不可据此宣称已批准或已上线。
- **必须有首页 IA：** 首页以 Level 选择/Placement、Today’s Session、词典查询、Practice/Mock、进度入口构成；具体页面合同见 §9。
- **必须有 NOT-DO：** 见 §4 Non-goals；视频课程、移动 App、社区、直播、教师后台、重 AI 对话陪练及未确认商业合同均不在当前实施范围。
- **必须有 SEO 页面矩阵：** 见 §9；仅将满足最小内容字段、canonical、真实可访问与可索引条件的公开页面纳入 sitemap。
- **必须有下游交接摘要：** 合规需先确认数据流、音频/PDF/AI/支付权利；文案、设计、开发只能在 Owner Decisions 和本 PRD 状态边界内推进。
- **必须读取：** 本文与项目内 `HSKKit-PRD-v3.4-executable.md`；原研究附件不是下游必读真源，且不得采用 v3.5 视频课程内容。

## 8. 需求目录（后续章节展开）

|域|Requirement IDs|优先级|
|-|-|-|
|等级与内容|REQ-LVL-01～04|P0/P1|
|音频与听力|REQ-AUD-01～05|P0/P1/P2|
|学习闭环与账号|REQ-LEARN-01～07|P0/P1|
|测评|REQ-TEST-01～06|P0/P1/P2|
|知识工具与计划|REQ-KNOW-01～04；REQ-PLAN-01|P0/P1|
|AI、离线与数字材料|REQ-AI-01～02；REQ-OFF-01；REQ-PDF-01～03|P1/P2|
|商业边界|REQ-PAY-01～02|P1|
|平台合同|REQ-PLAT-01～03|P0|

## 9. 模块需求与验收 A：等级、音频、学习闭环

### 9.1 等级与内容体系

|ID|需求与边界|主优先级|状态|可测试验收|
|-|-|-|-|-|
|REQ-LVL-01|内容实体必须标记 `standard_version`、`level_band` 与 `content_version`；默认学习体验仅取 HSK 3.0。|P0|Candidate|任取已发布词/题/阅读均可返回三字段；2.0 内容在未显式切换时不可进入默认队列。|
|REQ-LVL-02|覆盖 HSK 3.0 Level 1–9 的词汇数据底座；“覆盖”指可检索、版本化、可 QA 的数据记录，不等于所有训练已上线。|P0|Candidate|按 Level 1–9 查询均返回已发布或明确缺口状态；无标准版本/来源/QA 状态的记录不可发布。|
|REQ-LVL-03|HSK 7–9 使用统一高级考试模型：统一诊断、能力区间与高级语料训练；不得设计成三张独立报名卷。|P1|Candidate|高级入口只显示一张统一测评路径；结果输出能力区间与下一步训练，不显示三张互斥考试。|
|REQ-LVL-04|内容更新可回滚；学习记录保留当时 `content_version`，不因词义/音频版本替换而篡改历史结果。|P0|Candidate|替换一个发布资产版本后，旧 review/attempt 仍可追溯原版本；撤回资产不再进入新队列。|

### 9.2 音频、听力与发音训练

|ID|需求与边界|主优先级|状态|可测试验收|
|-|-|-|-|-|
|REQ-AUD-01|单词与例句音频资产须有文本、拼音/读音、声调、语速、发音人或引擎、来源、许可、缓存/离线再分发边界、版本与 QA 状态。|P0|Candidate|尝试发布缺任一必填字段的音频资产时被阻止；详情页可报告播放或内容问题。|
|REQ-AUD-02|学习记录分别维护 `reading_mastery`、`audio_mastery`、`context_audio_mastery`；看字答题不得自动提高听力 mastery。|P0|Candidate|完成文字卡正确后仅文字 mastery 变化；完成盲听识义后 audio mastery 才变化；句中听辨独立记录。|
|REQ-AUD-03|音频 SRS 以听辨表现生成队列；卡片先播放后显示候选/答案，并记录评分、播放状态、失败原因。|P0|Candidate|完成一次音频卡评分后产生下一到期时间；中途退出后可恢复未提交卡；无可用音频不生成伪卡。|
|REQ-AUD-04|播放器具有 loading、ready、playing、paused、ended、error、unavailable 状态，并允许重播、慢速播放和故障报告。|P0|Candidate|模拟网络失败、资源撤回、自动播放限制时给出可操作提示且不写入 mastery；重播不重复提交评分。|
|REQ-AUD-05|训练分层：Level 1–3 词/短句听辨与声调；Level 4–6 句段听写与语境；HSK 7–9 长句、新闻/学术/正式语体微听力。跟读作为 P2 扩展仅记录尝试，自动评分能力未批准前不输出发音分。|P1|Candidate|按等级进入对应题型；跟读提交仅产生日志与明确“未评分/待支持”状态，不返回伪评分。|

### 9.3 Daily Session、SRS、错题与身份同步

|ID|需求与边界|主优先级|状态|可测试验收|
|-|-|-|-|-|
|REQ-LEARN-01|Daily Session 按用户等级、到期复习、弱项和时间预算组成，顺序为 Review → Learn → Listen/Practice → Summary；队列规则版本化。|P0|Candidate|给定同一 user/day/规则版本可复现生成项；Summary 显示完成、跳过、待恢复和下一步。|
|REQ-LEARN-02|真实 SRS 保存 card type、grade、due_at、interval、ease/稳定度、算法/规则版本和来源 attempt；不得只用“已学/未学”二值。|P0|Candidate|提交不同评分会产生可解释的不同 `due_at`；重复提交同一 attempt 不创建两个计划。|
|REQ-LEARN-03|错题从 Practice/Mock/听写进入可恢复 Review Queue；错题解决不删除原 attempt，保留复习结果与关闭原因。|P0|Candidate|答错后在队列中出现；重新做对后原错题记录仍存在并标记已解决/待观察。|
|REQ-LEARN-04|streak 按学习日而非页面访问计算，采用用户时区；允许记录一次明确的冻结/补签策略，但策略与权益待 Owner 确认。|P1|Candidate|仅 page_view 不增加 streak；跨午夜按用户时区判定；未配置补签策略时显示无补签。|
|REQ-LEARN-05|游客进度仅存于受控临时标识；注册/登录时展示合并预览、冲突规则与确认动作，未确认不得覆盖账号进度。|P0|Candidate|游客有进度后登录，系统展示 merge/skip；取消合并保持账号原记录；同一游客数据不可合并两次。|
|REQ-LEARN-06|账号支持跨设备同步、登出、删除请求与数据导出请求；同步按服务端 revision/幂等写入处理冲突。|P1|Candidate|两设备写入不同复习结果时按预定义策略产生一致结果及冲突审计；删除/导出请求进入可追踪状态。|
|REQ-LEARN-07|学习状态不得以 LocalStorage 作为唯一真相；离线行为需有明确 pending/同步失败/冲突状态。|P1|Candidate|断网提交显示 pending；恢复网络后恰好同步一次或给出可重试错误；不会静默丢失。|

### 9.4 训练阶段边界

|训练|输入|输出|当前边界|
|-|-|-|-|
|听辨|音频、候选或输入|audio/context mastery、SRS grade|P0 词/句听辨；高级扩展 P1/P2|
|声调|拼音/声调辨别题或受控输入|答题结果、弱项标签|P1；不等同语音评分|
|听写|音频、文本输入|字符/词级错误与复习项|P1；需题库与输入规范|
|跟读|音频提示、用户主动录音（如启用）|attempt 日志、用户删除控制|P2；不承诺自动评分或诊断|

### 9.5 商业化与高成本能力的硬边界（先定义，不启动收费）

|ID|需求与边界|主优先级|状态|可测试验收|
|-|-|-|-|-|
|REQ-AI-01|AI Explanation/Study Plan 必须经身份、可配置周期额度、成本上限、速率限制与降级路径控制；额度用尽返回明确提示，不提供无限量承诺。|P1|Candidate|配置低额度后第 N+1 次请求不调用供应商；返回下一重置时间/替代动作且记录消耗。|
|REQ-AI-02|AI 输入输出具有数据最小化、内容安全、失败重试上限与人工报告路径；学习建议不构成考试/教育结果承诺。|P1|Candidate|模拟供应商超时/拒绝时显示可重试状态；不把完整敏感档案写入事件字段。|
|REQ-PDF-01|高级 PDF/PDF Pack 是独立数字产品候选；需内容授权、生成版本、下载权限、失效/撤回和适用退款规则。|P2|Candidate|未授权资产不能加入生成包；撤回后新下载被阻止，历史订单保留审计。|
|REQ-PDF-02|导出/离线包按用户选定等级和已授权内容生成；导出过程异步、可取消并带过期链接。|P2|Candidate|超大导出不阻塞页面；取消后无可下载文件；过期链接拒绝访问。|
|REQ-PAY-01|产品保留 Free 与候选高级权益的可理解边界；金额、账期、支付渠道、税务和退款执行规则由 Owner 确认后的定价阶段冻结，本 PRD 不预设。|P1|Candidate|商业配置为 `not_configured` 时，定价页只能显示“方案待确认”与免费路径，不得创建订单或展示虚构价格。|
|REQ-PAY-02|任何候选购买入口必须在商业配置获批后才可启用，并把成功、取消、处理中、失败和权益未生效区分为不同用户状态；不得把付款成功等同于权益已生效。|P1|Candidate|未配置时 checkout 返回可恢复的不可用状态且不创建订单；配置后取消不授予权益，处理中可安全重查，重复确认不重复授予。|

### 9.6 测评、知识工具、计划与离线

|ID|需求与边界|主优先级|状态|可测试验收|
|-|-|-|-|-|
|REQ-TEST-01|Placement Test 题目覆盖听、词汇/语法、阅读等已批准维度；每题与标准版本、等级、技能、内容版本绑定。|P0|Candidate|测试只抽取已发布、同标准版本题目；缺题维度明确降级，不产生虚假精确推荐。|
|REQ-TEST-02|Placement 输出推荐起点、证据摘要、不确定性说明和创建学习队列 CTA；不是官方认证或保证。|P0|Candidate|同一回答集可重现同一结果规则；结果页显示“学习建议”及重测入口。|
|REQ-TEST-03|Practice 为 P0，按技能练习并可即时反馈；Mock 为 P1 扩展，按已批准的考试结构计时并在完成后反馈。|P0|Candidate|Practice 可逐题反馈；Mock 在提交/结束前不泄露评分；两类 attempt 有不同 `mode`。|
|REQ-TEST-04|错题、题目质量报告、题目撤回与重新出题具备版本审计；被撤回题不进入新 session。|P0|Candidate|报告题目后进入审核状态；撤回后新测验不抽取、历史 attempt 仍可解释。|
|REQ-TEST-05|HSK 7–9 Mock 仅在题型、计时、授权与评分口径核验后开放；未就绪时只提供高级诊断/练习候选。|P2|Candidate|配置未满足时路由显示未开放与替代路径，不能启动伪模考。|
|REQ-TEST-06|Placement/Practice/Mock 结果向 Planner 提供目标等级、弱项、SRS 负载与“创建/更新计划” CTA；本条不负责计划生成、编辑或版本化。|P1|Candidate|测评完成后可将明确的结果摘要作为 Planner 输入；用户取消 CTA 不创建计划；计划生成规则仅由 REQ-PLAN-01 定义。|
|REQ-KNOW-01|词典支持汉字、拼音、英文释义及等级筛选；释义、例句、音频均显示来源版本与可用状态。|P0|Candidate|空查询、未命中、多音字结果均有明确状态；无音频条目不显示可播放假按钮。|
|REQ-KNOW-02|汉字页可显示读音、部首、笔画、关联词与等级；无足够内容时不发布为 indexable 页面。|P0|Candidate|抽样已发布页均含最小字段；未满足最小字段的 slug 返回真实 404/noindex，不产生 soft 404。|
|REQ-KNOW-03|语法与阅读内容必须有学习任务、级别、示例、练习或关联复习动作；不批量生成空模板。|P1|Candidate|每个已发布语法/阅读页通过字段完整性校验；无正文/无任务页面不进入 sitemap。|
|REQ-KNOW-04|内容 sitemap 仅包含可访问、canonical、可索引且满足最小价值字段的 URL；失效或撤回内容移除。|P0|Candidate|抽样 sitemap URL 返回有效内容；撤回页面在发布周期后不再列出。|
|REQ-PLAN-01|Planner 接收显式 `goal`、`available_time`、可选 `target_date`、SRS 负载和弱项；以 `plan_version` 保存可编辑计划、每天任务量、调整理由和过载提示。|P1|Candidate|缺 goal 或 available_time 时要求补充；修改时间/日期后生成新 plan_version；计划超容量时显示降级选项，不以 LearningRecord 代替计划输入。 |
|REQ-OFF-01|离线包只包含本地缓存/再分发权利明确的资产；包清单含版本、到期/撤回策略。|P2|Candidate|选择无离线许可音频时被排除并说明原因；撤回清单同步后标记不可继续使用。|
|REQ-PDF-03|高级 PDF/PDF Pack 与练习数据隔离：导出文件不默认包含其他用户数据；可打印内容的来源和生成版本可追溯。|P2|Candidate|下载包中只含授权的选中内容；文件元数据带生成版本，审计可定位资产清单。|
|REQ-PLAT-01|公开内容、学习记录、付费权益、内容资产、审核报告使用 AccessPolicy 定义的不同访问控制边界；涉及合并、删除、导出、撤回的受控操作必须经可取消确认框。|P0|Candidate|无权用户请求学习记录/下载链接返回拒绝而非空成功；公开词典不暴露私有学习记录；取消确认框不写入状态。 |
|REQ-PLAT-02|所有写操作使用 authenticated user 或受控 guest token，并具备请求幂等性/审计 ID。|P0|Candidate|重放同一提交不重复创建 attempt、SRS 或订单候选。|
|REQ-PLAT-03|异常、空、加载、撤权状态必须在页面与 API 合同中可区分，并提供与权限相符的恢复/返回动作。|P0|Candidate|网络失败、无数据、加载中、权限不足、资源撤回返回不同可测试 code/state；空状态不冒充成功。 |

### 9.7 Free / Pro 权益矩阵（金额与账期未确认）

|能力|游客|Free 账号|Pro 候选|必须先确认|
|-|-|-|-|-|
|公开词典/等级说明/基础词汇|可用|可用|可用|内容权利与 SEO 质量|
|Placement 与基础 Practice|可用，进度临时|可用，进度保存|可用|测试内容与隐私|
|Daily Session / 基础 SRS|有限体验|按 OD-03 确认的免费额度|高级效率/额度候选|额度与反滥用|
|音频基础学习|仅已授权资产|按免费额度|高级模式/离线候选|音频许可|
|AI Explanation / Study Plan|不可用或说明页|受额度控制的候选|受额度控制的候选|后续定价复核的成本/数据输入|
|高级 PDF / PDF Pack / 离线包|不可用|按后续定价复核决定|候选权益/独立数字产品|授权、销售与交付输入|

> 价格、周期、支付渠道、取消和退款均不在本版本冻结；任何实现/文案必须引用 Owner 已批准的单独商业化决定。

## 10. 页面矩阵与信息架构

### 10.1 首页 IA 合同

首页按以下顺序组织，移动端保持同一信息优先级并改为单列：
1. **Hero / 下一步入口：** 说明 HSK 3.0 Level 1–9 学习与备考用途；主 CTA 为“开始 Placement”，次 CTA 为“选择学习等级”。已登录且存在未完成 session 时，主 CTA 改为“继续今日学习”。
2. **Today 状态区：** 已登录显示到期复习、弱项与预计用时；游客显示可体验范围；无队列、加载失败和同步冲突分别提供“选择等级”“重试”“处理冲突”。
3. **Level 路径：** Level 1–6 分级入口与 HSK 7–9 统一高级入口；不把 HSK 7、8、9 呈现为三张独立考试。
4. **学习工具：** 词典、听力、Practice/Mock、语法/阅读入口；每个入口说明用户能完成的任务，不用空功能卡占位。
5. **进度与账号：** 游客提示登录后可选择性合并；账号用户显示 streak、复习队列和计划入口；无进度时回到 Placement/选级。
6. **候选高级能力：** 仅在权益与商业配置获批后展示 AI、离线或 PDF 候选入口；未配置时不显示购买承诺。

桌面端 Hero 可双栏，其余区块按任务分组；移动端 CTA 高度至少满足触控要求，首屏只保留一个主 CTA，横向卡片必须可滚动且不能造成页面级横向溢出。

### 10.2 Route Contract

|页面/路由|用户目的与 H1/H2 方向|主/次 CTA|优先级|权限/索引|关键状态|Schema / 内链|
|-|-|-|-|-|-|-|
|`/`|H1：HSK 3.0 learning path；H2：诊断、每日学习、词典与听力|开始 Placement / 选择等级；有进度时继续今日学习|P0|公开/index|loading、游客、已有进度、无 session、sync conflict|WebSite；内链 levels、placement、dictionary、today|
|`/levels`、`/hsk-3-0`、`/hsk-2-0-vs-3-0`|理解标准、等级和隔离边界|选择等级 / 开始诊断|P0|公开/index|内容撤回、标准更新|BreadcrumbList；内链 vocabulary、placement|
|`/vocabulary/:level`、`/word/:slug`|浏览分级词并进行词/句音频学习|加入今日学习 / 报告内容问题|P0|公开/index（达标内容）|audio unavailable、未命中、撤回|DefinedTerm/BreadcrumbList；内链 dictionary、listen、review|
|`/dictionary`、`/character/:hanzi`|按汉字、拼音或英文查词/字|搜索 / 加入复习|P0|公开/index（达标内容）|empty、not found、真实 404|SearchAction/BreadcrumbList；内链 word、vocabulary|
|`/placement`、`/placement/result/:id`|完成诊断并理解推荐起点|开始/继续诊断；结果页创建学习计划|P0|入口公开；结果私有 noindex|resume、expired、loading、error、no data|结果 noindex；内链 today、planner|
|`/practice/:level/:skill`、`/mock/:band`|完成技能练习或受控计时 Mock|开始/继续；提交|P0/P1/P2|入口公开；attempt 私有 noindex|resume、submit、timed out、题目撤回|noindex；内链 mistakes、review|
|`/today`、`/review`、`/mistakes`|完成和恢复每日学习、SRS 与错题|继续下一项 / 查看 Summary|P0|游客受控；账号私有 noindex|empty queue、pending sync、conflict、offline|noindex；内链 listen、planner|
|`/listen`、`/listen/:assetId`|完成音频 SRS 与听辨|播放/评分；报告问题|P0|按内容许可/权益；noindex|loading、error、unavailable、revoked|noindex；内链 word、review|
|`/grammar/:slug`、`/reading/:slug`|学习语法/阅读并进入练习|开始练习 / 加入复习|P1|公开/index（达标内容）|empty、withdrawn、not found|Article/BreadcrumbList；内链 practice、dictionary|
|`/planner`|根据明确输入生成、编辑并版本化学习计划|创建/更新计划 / 调整负载|P1|账号私有 noindex|缺输入、overload、recalculating、conflict|noindex；内链 today、placement result|
|`/account`、`/account/data`|管理同步、导出和删除请求|导出数据 / 请求删除；取消或重试|P1|账号私有 noindex|loading、empty、permission denied、export/deletion pending/failed/completed|noindex；内链 today、exports|
|`/pricing`、`/checkout/*`|理解已批准权益并查看购买状态|选择已批准方案 / 返回免费学习|P1|pricing 公开/index；checkout noindex|not configured、cancelled、processing、failed、entitlement pending|Product 仅在批准后；内链 free routes|
|`/pdf-packs`、`/exports`|生成或下载已授权材料|生成/取消 / 重新生成|P2|按权益；私有 noindex|queued、generating、ready、failed、expired、revoked|noindex；内链 account/data|

## 11. API、数据、生命周期与事件合同

### 11.1 API 合同（候选；具体鉴权/实现待技术评审）

|API|方法|请求/响应关键字段|权限与幂等|异常合同|
|-|-|-|-|-|
|`/api/v1/catalog/words`|GET|`standard_version, level, q, cursor` → published words|公开|400 参数错；200 空列表|
|`/api/v1/catalog/characters/:hanzi`|GET|读音、部首、笔画、关联词、版本/QA|公开，仅 published|404 真未命中；410 withdrawn|
|`/api/v1/catalog/grammar/:slug`、`/api/v1/catalog/readings/:slug`|GET|正文、等级、任务、版本/QA、关联练习|公开，仅 published|404 真未命中；410 withdrawn|
|`/api/v1/content/:id/reports`|POST|reason、asset_version → report_id/status|登录或受控 guest；Idempotency-Key|403 无权；409 重复；410 已撤回|
|`/api/v1/placement/sessions`|POST|`standard_version, band` → attempt/questions/expires_at|guest/账号；Idempotency-Key|409 活跃会话；422 无题|
|`/api/v1/practice/sessions`、`/api/v1/mock/sessions`|POST/GET|level/band、skill → attempt、questions、timer、state|attempt owner；创建幂等|409 活跃会话；410 撤题；422 未就绪|
|`/api/v1/attempts/:id/submit`|POST|answers、elapsed、content_version → result/weaknesses|attempt owner；重复 key 返回原结果|409 已提交；410 不可提交；422 非法答案|
|`/api/v1/daily-sessions`|POST/GET|time_budget、tz → queue、rule_version、state|guest/账号；同日同规则幂等|200 empty；409 sync conflict|
|`/api/v1/reviews/:id/grade`|POST|grade、observed_at、client_revision → due_at/mastery|owner；Idempotency-Key|409 revision conflict；422 无效评分|
|`/api/v1/audio/:assetId/playback`|GET/POST|状态/受控 URL；duration/error/report|按许可/权益|403 无权；410 revoked；503 delivery error|
|`/api/v1/guest/merge-preview`、`/api/v1/guest/merge-confirm`|POST|guest token / merge token+resolution → revision|登录后；一次性 token；幂等|409 已用/冲突；422 无数据|
|`/api/v1/account/sync`|GET/POST|since_revision、changes、resolution → revision/conflicts|账号；写入幂等|409 待决冲突；422 非法 revision|
|`/api/v1/account/streak`|GET|tz → current、longest、last_learning_day、policy|账号|422 无效时区；200 无记录|
|`/api/v1/account/data-requests`|POST/GET/PATCH|type=export/delete、confirmation、action=cancel/retry → request/status|账号+近期验证；幂等|403 验证不足；409 状态冲突；422 非法动作|
|`/api/v1/plans`|POST/PUT|goal、target_date、available_time、weaknesses、SRS load → plan/version/overload|账号；版本控制|422 输入不足；409 版本冲突|
|`/api/v1/ai/explanations`|POST|attempt_id/context_ref → bounded response/quota|账号+额度；审计 ID|429 额度/速率；503 provider fail|
|`/api/v1/exports`、`/api/v1/exports/:id/cancel`|POST/GET|selection → job/status/expiring URL；cancel|账号+授权；创建幂等|403 无权；409 不可取消；410 过期/撤回|
|`/api/v1/checkout/*`|POST/GET|仅已批准 plan/price；status/entitlement status|账号+已批准商业配置；事件幂等|503 未配置且不创建订单；409 重复事件|

### 11.2 核心数据实体

|实体|最小字段|生命周期/约束|
|-|-|-|
|ContentAsset（word/sentence/character/reading/grammar/question）|id、type、standard_version、level_band、content_version、source_ref、license_ref、qa_status、publish_status|`draft→in_qa→published→withdrawn`；回滚创建新版本并保留历史|
|AudioAsset|id、content_asset_id、transcript、pronunciation、tones、speech_rate、voice_or_engine、source_ref、license_ref、cache_right、offline_right、qa_status、version|缺任一必填字段不可发布；撤回停止新签发 URL|
|Mastery|owner_scope、content_asset_id、dimension、score、due_at、algorithm_version、revision|reading/audio/context_audio 分离|
|ReviewSchedule|id、mastery_id、grade、interval、due_at、source_attempt_id、idempotency_key|同一提交只产生一个有效计划|
|Attempt|id、owner_scope、mode、skill、standard_version、content_version、state、started_at、ended_at、answers、result、timer_deadline|Placement/Practice/Mock 分 mode；结果私有；可恢复|
|DailySession|id、owner_scope、local_day、tz、rule_version、queue_snapshot、state、summary|同一 owner/day/rule 可恢复|
|MistakeCase|id、attempt_id、question_version、status、weakness_tag、resolved_at|`open→in_review→resolved/retired`|
|GuestMerge|id、guest_scope、user_id、preview、resolution、state、expires_at|`previewed→confirmed/cancelled/expired`|
|SyncState|user_id、server_revision、device_id、pending_changes、conflicts、resolution、updated_at|冲突未决时不覆盖服务端数据|
|Streak|user_id、timezone、current_count、longest_count、last_learning_day、policy_version|仅完成定义的学习事件才更新；按用户时区|
|AccountDataRequest|id、user_id、type、state、confirmation_at、requested_at、completed_at、expires_at、failure_code、retention_exceptions|export：requested→processing→ready/failed/cancelled/expired；delete：requested→confirmed→processing→completed/failed/cancelled|
|ContentReport|id、reporter_scope、asset_id、asset_version、reason、state、resolution、created_at|open→reviewing→resolved/rejected；撤回/回滚可追溯|
|Entitlement|id、user_id、capability、source、starts_at、ends_at、status、config_version|仅批准商业合同后启用|
|AssetManifest|id、asset_ids、asset_versions、rights_snapshot、state、created_at|只列授权资产；撤回可使 manifest revoked|
|Plan|id、owner_scope、goal、available_time、target_date、plan_version、items、state、overload_reason|生成、编辑、版本化只由 REQ-PLAN-01 管辖|
|AIRequest|id、owner_scope、feature、input_scope、quota_cost、status、audit_id|最小化输入；失败/拒绝可追溯|
|QuotaLedger|id、owner_scope、feature、period、limit、used、revision|额度、拒绝、重置可审计|
|AccessPolicy|id、resource_type、actor_scope、action、effect、revision|公开、游客、账号和受控操作分离|
|AuditEvent|id、actor_scope、action、resource_type、result、created_at|不含敏感原文或受控 URL|
|OrderDraft|id、owner_scope、plan_ref、status、config_version|未获批准时只允许 not_configured，不创建订单|
|ExportJob|id、user_id、selection_manifest、asset_versions、state、expires_at、failure_code|queued→generating→ready→expired/cancelled/failed/revoked|

### 11.3 状态机与跨模块规则

1. **内容/音频与报告：** 资产 `draft → in_qa → published → withdrawn`；报告 `open → reviewing → resolved/rejected`。确认问题后可撤回或以新版本回滚，历史 attempt 保留原版本引用。
2. **播放器：** `idle → loading → ready → playing ↔ paused → ended`；活动态可转 `error`，许可撤回转 `unavailable`。仅有效播放后开放评分，播放本身不更新 mastery。
3. **学习会话：** `created → active → paused → completed`，或 `expired/cancelled`；同步冲突转 `needs_resolution`，用户决议前不覆盖。
4. **测验：** `created → in_progress → submitted → scored`，Mock 可 `timed_out`；POST 创建、GET 恢复、submit 或计时结束均有明确可达操作。
5. **同步与 streak：** `local_pending → syncing → synced`，失败转 `retryable_error`，版本冲突转 `conflict`；仅完成定义的学习事件后，按用户时区更新 Streak。
6. **账号导出：** `requested → processing → ready → expired`，可转 `cancelled/failed`；失败可重试并生成新审计记录。**账号删除：** `requested → confirmed → processing → completed`，确认前可取消；完成后传播至学习数据并仅保留依法必须保留的最小审计记录。
7. **导出/离线：** `queued → generating → ready → expired/cancelled/failed/revoked`；资产撤回使未完成任务失败、现有下载撤权，历史清单保留审计。
8. **AI：** `requested → allowed → completed`，或 `quota_denied/rate_limited/provider_failed/reported`；失败不扣额度或按账本返还，页面提供重试或非 AI 替代动作。
9. **支付候选：** 定价阶段完成前只允许 `not_configured`；未配置请求不得创建 OrderDraft。后续商业合同须分别定义 payment 与 entitlement 状态，付款成功不得自动冒充权益生效。

### 11.4 事件埋点与数据最小化

|事件|触发|必要字段|禁止字段|
|-|-|-|-|
|`placement_started/completed`|开始/提交诊断|attempt_id、standard_version、band、duration、result_band|完整答案文本、敏感身份信息|
|`daily_session_started/completed/resumed`|会话状态变化|session_id、rule_version、items_count、outcome、tz offset|原始学习内容全文|
|`review_graded`|提交 SRS 评分|mastery dimension、grade、due delta、source type|音频 URL、用户自由输入全文|
|`audio_playback_state`|播放器关键状态|asset version、state、effective duration、error_code|受控 URL/token|
|`attempt_completed`|Practice/Mock 结束|mode、skill、level band、score bucket、duration|答案原文（除非经专门同意）|
|`guest_merge_*`|预览/确认/取消|merge state、conflict count|游客原始标识|
|`ai_quota_consumed/denied`|AI 调用|feature、quota bucket、reason code、latency|prompt/response 全文、个人敏感数据|
|`export_job_*`|导出状态变化|job state、asset count、reason code|下载 URL、完整清单|

事件必须在 consent/地区策略确定后启用；分析数据采用最小化、可删除/导出关联键与保留期限。任何漏斗指标均以事件定义为准，不能从页面访问推断学习完成。

## 12. 需求追踪、优先级、Backlog 与风险

### 12.1 需求 → 页面 → API → 数据 → 验收 → 产品 Backlog 显式映射

|Requirement|Route|API|Data|验收锚点|Backlog|
|-|-|-|-|-|-|
|REQ-LVL-01|/levels,/vocabulary/:level|/api/v1/catalog/words|ContentAsset|§9.1 REQ-LVL-01|TSK-P0-01|
|REQ-LVL-02|/levels,/vocabulary/:level|/api/v1/catalog/words|ContentAsset|§9.1 REQ-LVL-02|TSK-P0-01|
|REQ-LVL-03|/mock/:band|/api/v1/mock/sessions|Attempt/ContentAsset|§9.1 REQ-LVL-03|TSK-P2-01|
|REQ-LVL-04|/word/:slug|/api/v1/catalog/words|ContentAsset/Attempt|§9.1 REQ-LVL-04|TSK-P0-02|
|REQ-AUD-01|/word/:slug,/listen/:assetId|/api/v1/audio/:assetId/playback,/api/v1/content/:id/reports|AudioAsset/ContentReport|§9.2 REQ-AUD-01|TSK-P0-02|
|REQ-AUD-02|/listen,/review|/api/v1/reviews/:id/grade|Mastery/ReviewSchedule|§9.2 REQ-AUD-02|TSK-P0-05|
|REQ-AUD-03|/listen,/review|/api/v1/audio/:assetId/playback,/api/v1/reviews/:id/grade|AudioAsset/Mastery/ReviewSchedule|§9.2 REQ-AUD-03|TSK-P0-05|
|REQ-AUD-04|/word/:slug,/listen/:assetId|/api/v1/audio/:assetId/playback|AudioAsset|§9.2 REQ-AUD-04|TSK-P0-02|
|REQ-AUD-05|/listen,/practice/:level/:skill|/api/v1/practice/sessions|Attempt/AudioAsset|§9.2 REQ-AUD-05|TSK-P1-02|
|REQ-LEARN-01|/today|/api/v1/daily-sessions|DailySession|§9.3 REQ-LEARN-01|TSK-P0-05|
|REQ-LEARN-02|/review|/api/v1/reviews/:id/grade|Mastery/ReviewSchedule|§9.3 REQ-LEARN-02|TSK-P0-05|
|REQ-LEARN-03|/mistakes,/review|/api/v1/reviews/:id/grade|MistakeCase/ReviewSchedule|§9.3 REQ-LEARN-03|TSK-P0-05|
|REQ-LEARN-04|/today,/account|/api/v1/account/streak|Streak|§9.3 REQ-LEARN-04|TSK-P1-01|
|REQ-LEARN-05|/account|/api/v1/guest/merge-preview,/api/v1/guest/merge-confirm|GuestMerge/SyncState|§9.3 REQ-LEARN-05|TSK-P0-06|
|REQ-LEARN-06|/account,/account/data|/api/v1/account/sync,/api/v1/account/data-requests|SyncState/AccountDataRequest|§9.3 REQ-LEARN-06|TSK-P1-01|
|REQ-LEARN-07|/today,/account|/api/v1/account/sync|SyncState|§9.3 REQ-LEARN-07|TSK-P1-01|
|REQ-TEST-01|/placement,/practice/:level/:skill|/api/v1/placement/sessions,/api/v1/practice/sessions|Attempt/ContentAsset|§9.6 REQ-TEST-01|TSK-P0-04|
|REQ-TEST-02|/placement/result/:id|/api/v1/attempts/:id/submit|Attempt|§9.6 REQ-TEST-02|TSK-P0-04|
|REQ-TEST-03|/practice/:level/:skill,/mock/:band|/api/v1/practice/sessions,/api/v1/mock/sessions,/api/v1/attempts/:id/submit|Attempt|§9.6 REQ-TEST-03|TSK-P0-04|
|REQ-TEST-04|/practice/:level/:skill,/mock/:band|/api/v1/content/:id/reports,/api/v1/attempts/:id/submit|ContentReport/Attempt/ContentAsset|§9.6 REQ-TEST-04|TSK-P0-04|
|REQ-TEST-05|/mock/:band|/api/v1/mock/sessions|Attempt/ContentAsset|§9.6 REQ-TEST-05|TSK-P2-01|
|REQ-TEST-06|/placement/result/:id,/planner|/api/v1/attempts/:id/submit,/api/v1/plans|Attempt/Plan|§9.6 REQ-TEST-06|TSK-P1-02|
|REQ-KNOW-01|/dictionary,/word/:slug|/api/v1/catalog/words|ContentAsset/AudioAsset|§9.6 REQ-KNOW-01|TSK-P0-03|
|REQ-KNOW-02|/character/:hanzi|/api/v1/catalog/characters/:hanzi|ContentAsset|§9.6 REQ-KNOW-02|TSK-P0-03|
|REQ-KNOW-03|/grammar/:slug,/reading/:slug|/api/v1/catalog/grammar/:slug,/api/v1/catalog/readings/:slug|ContentAsset|§9.6 REQ-KNOW-03|TSK-P1-02|
|REQ-KNOW-04|/levels,/dictionary|/api/v1/catalog/words,/api/v1/catalog/characters/:hanzi|ContentAsset|§9.6 REQ-KNOW-04|TSK-P0-03|
|REQ-PLAN-01|/planner|/api/v1/plans|Plan|§9.6 REQ-PLAN-01|TSK-P1-02|
|REQ-AI-01|/placement/result/:id,/planner|/api/v1/ai/explanations|AIRequest/QuotaLedger|§9.5 REQ-AI-01|TSK-P1-03|
|REQ-AI-02|/placement/result/:id,/planner|/api/v1/ai/explanations,/api/v1/content/:id/reports|AIRequest/QuotaLedger/ContentReport|§9.5 REQ-AI-02|TSK-P1-03|
|REQ-OFF-01|/exports|/api/v1/exports,/api/v1/exports/:id/cancel|ExportJob/AssetManifest|§9.6 REQ-OFF-01|TSK-P2-02|
|REQ-PDF-01|/pdf-packs,/exports|/api/v1/exports|ExportJob/AssetManifest/Entitlement|§9.5 REQ-PDF-01|TSK-P2-02|
|REQ-PDF-02|/exports|/api/v1/exports,/api/v1/exports/:id/cancel|ExportJob/AssetManifest|§9.5 REQ-PDF-02|TSK-P2-02|
|REQ-PDF-03|/pdf-packs,/exports|/api/v1/exports|ExportJob/AssetManifest|§9.6 REQ-PDF-03|TSK-P2-02|
|REQ-PAY-01|/pricing|/api/v1/checkout/*|OrderDraft/Entitlement|§9.5 REQ-PAY-01|TSK-P1-04|
|REQ-PAY-02|/pricing,/checkout/*|/api/v1/checkout/*|OrderDraft/Entitlement/AuditEvent|§9.5 REQ-PAY-02|TSK-P1-04|
|REQ-PLAT-01|/today,/account,/exports|/api/v1/account/sync,/api/v1/account/data-requests,/api/v1/exports|AccessPolicy/AuditEvent|§9.6 REQ-PLAT-01|TSK-P0-06|
|REQ-PLAT-02|/today,/review,/account|/api/v1/daily-sessions,/api/v1/reviews/:id/grade,/api/v1/account/sync|AccessPolicy/AuditEvent|§9.6 REQ-PLAT-02|TSK-P0-06|
|REQ-PLAT-03|/,/today,/account/data|/api/v1/daily-sessions,/api/v1/account/data-requests|AccessPolicy/AuditEvent|§9.6 REQ-PLAT-03|TSK-P0-06|

**集合审计：** 目录、正文定义与本表均为 38 条唯一 Requirement；每条使用精确 Route/API/Data/验收锚点并映射到存在的产品 Backlog 节点。

### 12.2 优先级与发布阶段

|阶段|范围|进入条件|退出条件|
|-|-|-|-|
|P0 Data + Loop|标准分离、L1–9 数据底座、词/句音频 QA、Placement、Practice、Daily/SRS、错题、词典/汉字、基础权限|OD-01/02 至少确认可用范围；数据/版权 QA 可运行|关键验收通过，真实 404/sitemap、同步/音频异常有测试证据|
|P1 Retention + Account|账号同步、streak、语法/阅读、Planner、音频进阶、AI 有额度|P0 核心漏斗有基线；后续定价复核提供账号、AI 数据与成本输入|跨设备冲突、额度拒绝、删除/导出路径验证|
|P2 Advanced + Products|HSK 7–9 Mock、跟读日志、离线/导出、高级 PDF/PDF Pack、候选商业能力|P1 稳定；后续定价复核完成授权与商业/合规输入|订单/权益/撤回/过期与高级训练验收通过|

### 12.3 串行产品 Backlog DAG

|任务 ID|工作项|前置|
|-|-|-|
|TSK-P0-01|冻结标准、词表与音频权利/版本清单|—|
|TSK-P0-02|建立 ContentAsset/AudioAsset QA 与发布/撤回流程|TSK-P0-01|
|TSK-P0-03|建立词典、汉字、真实 404 与 sitemap 质量门|TSK-P0-02|
|TSK-P0-04|建立 Placement/Practice 与版本化 Attempt|TSK-P0-03|
|TSK-P0-05|建立 Daily Session、SRS、错题与音频 SRS|TSK-P0-04|
|TSK-P0-06|建立游客进度、合并预览与核心异常状态|TSK-P0-05|
|TSK-P0-07|P0 产品验收：跨模块验收、事件核验与安全检查|TSK-P0-06|
|TSK-P1-01|账号同步、streak、导出/删除请求|TSK-P0-07|
|TSK-P1-02|语法/阅读/Planner 与进阶听力训练|TSK-P1-01|
|TSK-P1-03|AI 额度、成本护栏与失败降级|TSK-P1-02|
|TSK-P1-04|P1 产品验收：同步冲突、AI/隐私、留存事件与商业未配置边界复验|TSK-P1-03|
|TSK-P2-01|高级统一考试训练与跟读日志|TSK-P1-04|
|TSK-P2-02|离线包、导出与高级 PDF/PDF Pack|TSK-P2-01|
|TSK-P2-03|P2 产品验收：高级训练、导出与数字材料边界复核|TSK-P2-02|
|TSK-P2-04|P2 最终产品验收与 Owner 审核材料|TSK-P2-03|

> 定价仅在 §6 NEXT_STAGE_HANDOFF 的 Owner 确认后定价复核中说明；不属于本 PRD 的产品实施 Backlog，且本轮不启动。

### 12.4 风险与缓解

|风险|等级|缓解/门槛|
|-|-|-|
|词表/音频版权不清导致下架|P0|OD-01/02 + 资产许可字段与发布门；无权利不发布/不离线|
|HSK 2.0/3.0 混用导致错误学习|P0|所有内容/题/结果存 standard_version；默认队列硬过滤|
|TTS 或错误音频损害学习|P0|音频 QA、错误报告、unavailable 状态；不以播放代替 mastery|
|SRS/同步重复或丢失|P0|Idempotency-Key、revision、pending/conflict 状态与断网测试|
|竞品式 SEO 空页/soft 404|P0|最小内容字段、真实 404、sitemap 发布门与抽样测试|
|AI 成本或不当输出|P1|配额、成本上限、速率限制、最小化数据、降级/报告|
|支付/退款口径不一致|P1|商业合同未批准不售卖；另行冻结商业与合规合同|
|高级 PDF/离线再分发越权|P2|资产许可、manifest、撤回/到期下载控制|

## 13. Owner Review 清单与交接

### 13.1 Owner 审核结论门

- 当前状态固定为 **PENDING_OWNER_REVIEW**；本文件不是批准实施、冻结版本或上线声明。
- Owner 只需对 OD-01～OD-03 作出批准、拒绝或保留决定；拒绝的模块从当前候选范围移除或保持未启动。
- Owner 确认后唯一串行下一阶段是定价复核，不是合规初审；不自动启动任何后续阶段。

### 13.2 自检清单

- [x] HSK 3.0 Level 1–9 体系与 HSK 2.0 隔离已明确。
- [x] HSK 7–9 按统一高级考试模型定义，未拆为三张独立卷。
- [x] 音频资产、独立 mastery、音频 SRS、播放器、版权/版本/QA 合同已定义。
- [x] 听辨、声调、听写、跟读的阶段边界已定义，未承诺未批准的自动评分。
- [x] Daily Session、SRS、错题恢复、streak、游客合并与跨设备同步已定义。
- [x] Placement、Practice/Mock、词典、汉字、语法、阅读、Planner、离线/导出已纳入并分级。
- [x] AI 额度/成本边界与 Free/Pro 边界已定义；没有无限量或未确认价格承诺。
- [x] 高级 PDF/PDF Pack 和数字产品边界已定义为 P2 候选。
- [x] 页面、权限、API、实体、状态机、异常与埋点已覆盖。
- [x] 需求→页面→API→数据→验收→依赖矩阵及单链 Backlog 已提供。
- [x] v3.5 视频课程未纳入；规划功能未表述为已上线。
- [x] PRD 文档层合同已完成；Owner 尚未批准仅表示状态保持 PENDING_OWNER_REVIEW，不构成文档内容失败，也不授权实施、售卖或上线。

### 13.3 下游最小交接

|下游|必须读取/确认|不可假设|
|-|-|-|
|合规|OD-01～OD-03、数据实体和 API 合同|音频/PDF 权利、支付/退款、未成年规则已批准|
|文案|定位、Free/Pro 矩阵、Non-goals、状态口径|价格、考试结果、AI/发音能力承诺|
|设计|§10 信息架构、§11 状态机和权限矩阵|没有状态设计即可开工；视频课程在范围内|
|开发|§9、§11、§12 的验收与依赖链|Owner Decisions 已通过；可跳过幂等/撤回/异常合同|

### 13.4 交付物

- Canonical PRD：`/root/projects/hskkit/docs/product/HSKKit-PRD-v4.0-owner-review.md`。
- Telegram delivery copy：`/root/.hermes/profiles/dazongguan/cache/documents/HSKKit-PRD-v4.0-owner-review.md`。
- 两份文件必须以 SHA256 与字节数确认完全一致后，才可发送 [DONE]；两者均保持 PENDING_OWNER_REVIEW。

### 13.5 验收清单

|验收项|证据|当前结论|
|-|-|-|
|结构完整性|§1–§13、附录 A；需求、页面、API、数据、状态、追踪、风险均有合同|通过（文档层）|
|需求可追踪|§12.1 映射并逐项回指 §9.1～§9.6 验收|通过（文档层）|
|Backlog 单链|§12.3 单一起点 TSK-P0-01，所有前置均在链内|通过（文档层）|
|范围隔离|§1、§4、§12 明确排除 v3.5 视频课程及未批准能力|通过（文档层）|
|状态口径|全篇为候选/待确认，最终状态 PENDING_OWNER_REVIEW|通过（文档层）|
|Owner 批准状态|OD-01～OD-03 尚未由 Owner 决定|待 Owner Review；文档层通过，但不得实施/售卖/上线|

### 13.6 下游交接摘要

- **输入：** 本 PRD 与项目内 v3.4 基线；原研究附件的已确认结论已吸收，不要求下游重新读取。
- **输出：** 仅用于 Owner 审核的完整候选稿；不是实施指令。
- **下一步：** Owner 确认后，按串行流程进入定价复核；需要返修时只更新 Canonical，再同步交付副本。

---

## 附录 A：依据与引用范围

1. `/root/projects/hskkit/docs/product/HSKKit-PRD-v3.4-executable.md`：当前可验证的项目内基线。
2. 竞品路径、HSK 1–9、HSK 7–9 统一高级考试、音频独立 mastery 与资产 QA 等已确认研究结论已写入本文对应 Requirement；原研究附件不作为下游执行依赖。
3. 本 v4.0 不引用也不吸收 v3.5 视频课程补丁。
