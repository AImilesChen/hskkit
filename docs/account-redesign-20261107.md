# 账户页重排与本地验收 · 2026-11-07

已按确认方案完成本地实现，尚未提交或部署本次账户页调整。

预览：http://127.0.0.1:3036/__preview?state=free 。顶部明确标注 Sample data only，可切换 free、pro、trial、merge、guest、error、long-name。该测试壳与模拟 API 仅在本机运行，不进入应用发布；真实 Google 登录、D1、Stripe 与账户数据未接入此预览。

## 实现

- 标题缩短为 Account，一行说明。账号概览只保留头像、姓名、连接状态、套餐和设置定位入口，移除首屏四个并排操作及重复身份说明。
- 原深蓝学习大卡改为轻量快捷行，保留 Dashboard 和按原计划逻辑计算的 Continue learning 链接，移除任务明细的重复展示。
- 套餐/账单与 AI credits 分为两张状态卡，金色、紫色分别标记。套餐按 Free、Pro trial、月付、年付与促销 access 区分；余额使用原接口值。计费取消/退款控件整体移入套餐卡 Manage billing，费用说明与明细按需展开。
- 资料、设备、邀请奖励、隐私归为一组设置行。注册日期与登录方式移入资料详情，Switch Google account 留在资料内；Sign out 独立置于设置末尾。
- 设备、奖励、隐私面板与已有资料/账单面板一样保留展开状态，操作刷新后不丢失用户所在位置。无重置日期时不显示占位警告。额度进度条的无障碍最大值兼容奖励余额超过周期额度的情况。
- 新样式全部限定在 account-overview-page，账户数据页保留其原有 account-page 样式。全局样式未修改，不影响阅读页、账户数据页或全站导航。
- 未登录卡片收短说明，保留 Continue with Google。现有 Google 入口与版本化回跳值保持不变。

## 保留的逻辑

修改前后，从 loadAuxiliary 到 manageSubscription 的现有请求处理代码逐字相同：账户读取、聚合概览、自动时区、合并预览/确认/取消、设备同步/移除、退出、订阅取消和退款请求未改动。保持原本的加载、错误、辅助资源验证、请求幂等键及刷新代次保护。

没有改动 API、权限、Google 配置、支付政策、真实用户数据、数据库、依赖、部署配置或定时任务。发布基线已核对为 85b95678c2cb2554d0a65efc7aeccd525ec52c4e，四个修改前文件的 Git blob 与该生产树一致，新 CSS 在生产树中尚不存在。

## 验证

- 35 项相关现有检查通过：账户 UI、真实合并领域逻辑、统一账户契约及 Google 登录路由行为。最终样式隔离后再次运行六项受影响的账户 UI 检查，全部通过。
- 更新原有文案/布局检查，仍验证 Google 登录入口、时区、合并确认、设备槽、奖励与原 API 路径，没有为布局添加镜像业务测试。
- 最终隔离 Next.js 生产构建、TypeScript 检查和 958 页生成成功。范围 ESLint 通过；account-client 沿用既有 no-explicit-any 技术债，单独关闭该既有规则检查，其余无错误，未新增源码禁用注释。
- 五个交付源码/测试文件与最终构建源码完全一致。清单与哈希：tmp/account-redesign-20261107/scope-manifest.json；修改前备份：同目录 before/。
- HTTP 检查 /account、/account/data 和阅读文章均为 200、H1 唯一；两张账户页维持 noindex,nofollow；新作用域 class 仅在 /account 出现。

## 浏览器实际检查

使用真实 Next 页面和客户端组件，通过本地代理提供明确标记的示例 JSON：

- Free：身份简洁、套餐与额度分别展示；1280px 桌面两张卡片等宽 526px、高 260px，对齐且无横向溢出。
- Profile：键盘展开资料后看到注册日期和登录方式，Switch Google account href 保留 selectAccount=1 与版本化 returnTo。
- Pro：展开套餐中的账单管理，在本地模拟接口提交取消续费及退款后，出现原有成功反馈和取消排期提示，没有访问 Stripe。
- Devices：免费槽位已满时 Connect 禁用；移除旧示例设备后显示 0/1，连接可用。最终版本确认面板刷新后仍展开，连接后显示 Check sync。
- Guest merge：预览后可取消并保留原账户数据提示；再次预览并确认后显示合并成功，待合并提示移除。底层真实合并领域测试同时通过。
- Trial：正确显示 Pro trial，权益来自示例的试用数据。
- Error：显示明确不可用与重试，套餐为 Unavailable，未显示虚假的 Free 或 0 额度。
- Sign out：本地退出后回到简化的未登录卡片；Continue with Google 仍直接指向已发布的 OAuth 入口。
- 320px 长姓名实际换行；有效内嵌视口 290/305px 时无横向溢出，卡片上下排列。390px 批量检查受浏览器调试同步中断影响，未列为完整验收。浏览器恢复后保留最终桌面预览并重置视口。
- 最终预览控制台 error 列表为空。

一处初版设备测试在刷新尚未完成、面板已收起时查找旧按钮失败，读取实际状态后重新展开并完成操作；随后改进了面板状态保留，并在最终版本重新验证。多次浏览器同步超时按指导新建同一浏览器的预览标签恢复，未将工具失败当作功能通过。通过 iframe.contentDocument 读取测量不受支持，改用支持的 frameLocator 元素测量。加载中或被 Cookie 面板挡住的画面未作交付截图。

## 证据与边界

交付截图：tmp/account-redesign-20261107/desktop-free.png、delivery-preview.png。mobile-long-name.png 为初版预览壳中的窄屏检查画面，不作为最终展示图；预览壳随后改为自适应工具栏与剩余高度 iframe，避免其双滚动条干扰。

界面交互测试使用本地示例数据，不能证明真实账单取消、退款、真实 Google 账号切换或生产合并成功。本次没有执行任何生产账户操作；上线后需用授权测试账号验收这些真实流程。

本轮应用与测试变更：src/app/account/page.tsx、account-client.tsx、account-page.css，tests/account-overview-ui.test.mts、p0-3-unified-account-contract.test.mts。测试壳、脚本、截图与本地报告均在 tmp/，不得作为应用 API 或正式账户数据发布。
