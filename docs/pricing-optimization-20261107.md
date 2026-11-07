# 定价与订阅权益优化 · 2026-11-07

本次完成本地开发与隔离生产构建，尚未提交、部署或修改生产权益。价格继续为 $5.99/月、$49/年。年付赠送 PDF 留在第二阶段，商店产品依旧另购。

## 实现

- Free 每天新增仍为 10 项；普通复习 dailyReviewGrades 改为 null，复用既有无限复习分支。历史展示窗口从 7 天/100 条扩大为 30 天/500 条。Pro 保持原有 500 月度 AI 积分、3 台设备、10,000 条长期记录及 Focused Review 权限。
- 新增共享 plan-presentation.ts，定价页、账号说明引用实际 capabilities；价格引用现有 SUBSCRIPTION_PLANS。AI 成本由 aiCreditCost 派生，包含解析 1、计划建议 5、上传错题分析 5。
- 定价页为 Free/Pro 两张卡片，Pro 切换月付/年付；主价展示实际周期收费，年付补充 $4.08/月及约 32% 节省。两张主价格基线对齐。使用局部作用域 CSS，不修改全站样式。
- 增加量化权益对比与三种已有学习场景示例；示例明确标注 Example。试用说明、计费与取消、积分及并发规则进入 FAQ；邀请奖励移到页尾。
- 购买前识别访客、Free、试用、已付月付、年付、待取消、欠费及接口失败。避免在已存在订阅或待处理订阅时创建重复订阅。月付转年付沿用现有 Stripe portal 确认流程。
- Google 登录回跳保留 plan 参数，返回定价页由用户主动确认购买。修复旧 checkout 使用登录页不识别的 next 参数。试用期间购买保持原有立即计费行为，并明确提示。
- 项目原先将复习卡片按历史窗口投影，旧卡可能随历史窗口消失。新增 projectLearningCheckpoint，历史活动仍按窗口过滤，复习卡、必要来源快照及未解决错题保留；学习 API、同步与账号概览采用此操作快照。历史展示函数独立保留，不删除服务器数据。
- 免费复习页不再在 null 限制时显示“剩余 0 次”，改为说明普通复习不设日常评分上限。

## 验证

- 最终相关检查 55/55 通过：权益、30 天边界/500 条上限、旧复习卡与来源保留、25 次评分、重复评分幂等、过期 revision 拒绝、套餐动作、月付转年付、已有订阅保护、登录选择恢复、AI 计价、账号和已有 Google 流程。
- 更广回归存在 5 项既有音频失败，已在修改前 account-redesign/build-source 重现相同 5 项；未将它们算作通过，也未在本轮改动音频系统。最终 79 项较广检查中 78 通过、1 项既有失败，另一次更广扫描包含上述其余既有失败。日志见 scoped-tests.log、regression-tests.log 和 tmp/account-redesign-20261107/pricing-baseline-learning-tests.log。
- 两次隔离 Next.js 生产构建成功，TypeScript 检查通过，生成 958 个页面。最终产物 build-final.log 对应本轮 16 个范围文件，已用 SHA-256 核对本地源码与构建源码一致。
- 新增及主要变更文件 ESLint 无错误；原有账号/学习 API 文件另按既有 no-explicit-any 技术债边界检查，其余规则无错误。未加入源码规则禁用注释。
- 浏览器：桌面 1265px 有效内宽无溢出，两张价格基线一致；390px、320px 测试得到 iframe 内宽 360px、290px，scrollWidth 等于 clientWidth。320px 表格宽 248px，FAQ 可键盘 Enter 展开。
- 本地示例状态验证：访客月付/年付价与回跳 URL、试用日期及立即计费提示、已付套餐管理、转年付、取消排期、欠费防重复订阅、服务不可用、支付关闭、支付失败提示与恢复重试。成功的模拟月付和模拟年付切换均进入明确标识的 sample billing destination。未请求真实 Stripe、登录真实账号或产生扣款。
- HTTP：/pricing、/today、/review、/account、两张政策页为 200，定价页 H1 唯一、canonical 正确、robots 不禁止且 Sitemap 包含定价页。/store 本地因 Cloudflare 上下文读取隔离环境外 Wrangler registry 被拒而 500；商店源码未修改，不能将此项写成通过。

## 成本与上线边界

普通复习进入既有 unlimited 分支后不再执行 daily_review_grades 的计数器、额度断言、事件写入及对应断言清理。认证、对象归属、revision/CAS、评分幂等及音频凭证验证仍保留。没有新增数据库、表、迁移、R2 对象、AI 请求、定时任务或轮询任务。

扩大历史可见窗口及保留旧复习卡会增加部分响应内容和内存处理；未测量真实 Cloudflare CPU、D1 账单或生产负载，不能承诺成本不变。生产 D1/Stripe 和真实用户数据验收尚未进行。

## 预览与证据

预览：http://127.0.0.1:3038/__preview?state=guest 。顶部明确标注 Local preview / Sample data only，可选 free、trial、monthly、yearly、cancelling、past_due、error、checkout-off、checkout-error 等状态。实际页面来自隔离 Next.js 最终构建；模拟接口、选择器与代理均在 tmp 下，不进入正式应用。预览服务仅监听 127.0.0.1。

- tmp/pricing-optimization-20261107/desktop-plans.png
- tmp/pricing-optimization-20261107/final-tests.log
- tmp/pricing-optimization-20261107/build-final.log
- tmp/pricing-optimization-20261107/http-checks.json
- tmp/pricing-optimization-20261107/sample-checkout-checks.json
- tmp/pricing-optimization-20261107/scope-manifest.json
- tmp/pricing-optimization-20261107/before/（本轮修改前副本）

没有修改部署分支、密钥、生产环境、订阅价格、数据库数据、退款条件或定时任务。发布需使用范围清单并保留当前已上线内容，不能把工作区其他未提交变更一并加入。
