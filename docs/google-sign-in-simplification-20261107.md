# Google 登录流程简化 · 2026-11-07

本地实现、构建与有边界的验收完成，尚未部署。预览：http://127.0.0.1:3033/ 。

## 最终行为

- 未登录时，桌面和手机导航显示 Sign in，直接通过普通锚点进入 OAuth start；不经过账户页、登录说明页两次确认，也不由 Next Link 预取 OAuth 接口。
- 账户页未登录卡片直接发起 OAuth。原 /login 保留为独立登录、取消与错误恢复入口。
- 返回原页面的路径、查询条件和 hash；过滤外站地址、登录/退出及 API 路径，避免回跳循环。登录页顶部按钮读取原 returnTo。
- 对有效、active 的 Google 会话直接回到目标页面；过期、删除、Sync Key 身份及身份读取失败仍走 Google 授权，不以 cookie 存在代替验证。
- 普通 Google 授权不强制 prompt=select_account；账户页与登录页另设切换账号入口，明确要求选账号。失败重试保留切换模式。Google 自身仍可能要求选择账号或授权。
- 有游客 cookie 时，成功回到学习页后通过一次有超时的既有账户查询判断是否显示可关闭的进度提示。用户可继续学习或到账户页查看；合并仍由既有预览、确认流程完成。
- 保留 state、PKCE、Google token/profile 校验、原试用/推荐逻辑、Secure/HttpOnly/SameSite cookie 属性和原会话有效期。认证重定向统一 no-store。

## 验证与边界

- 新增 8 项行为测试，执行真实 start/callback 与 OAuth 代码，仅替换平台 cookie、测试凭据、持久层和 Google 网络响应。覆盖直接授权、PKCE 参数和 cookie 属性、有效会话复用、无效会话、显式切换、配置失败、state 不匹配、缺少 code/verifier、用户取消、服务方失败、成功回跳和游客数据不自动合并。
- 登录行为、账户合并、账户 UI、统一认证契约和品牌导航共 36 项通过；另有 4 项导航回归通过。
- 范围 ESLint 通过。既有 account-client 的 21 项 no-explicit-any 错误在修改前版本已存在；该文件禁用这一既有规则后其余检查通过，未给生产代码新增禁用注释。
- 扩展检查中，两条旧源码正则测试失败：账户身份函数早已改为缓存委托，学习仪表盘链接早已改为其他写法。已在修改前的阅读页构建源码中复现相同失败，未改动其业务代码或放宽这些测试。
- 隔离 Next.js 15.5.18 完整生产构建、TypeScript 检查与 958 页生成通过。构建保留现有仓库 lint 配置；范围 lint 另行执行。
- 浏览器验证：文章页按钮直达 OAuth start，原 view=pinyin 与 hash 保留到配置错误页；切换账号模式和重试参数保留；手机菜单按钮直接发起登录。1040px 桌面导航不重叠；390px 菜单、320px 重试页无横向溢出；最终首页控制台无 error。
- 本地 Next 预览没有生产 Cloudflare 绑定、D1 和 Google 凭据，因此 start 显示可恢复的未配置提示；账户数据查询在该预览中也不可用。账户页 CTA 改动已通过代码与回归检查，真实 Google 账号选择、授权、生产会话和游客合并需发布后再验收，未声称已完成真实账号端到端登录。

## 交付范围

应用与测试共 13 个文件，清单在 tmp/google-login-simplification-20261107/scope.txt。八个原文件的修改前备份位于同目录 before/，与既有生产阅读页发布源码核对一致。本轮没有更改页面教学内容、数据库结构、权限、部署配置或定时任务。

截图：tmp/google-login-simplification-20261107/login-entry-desktop.png。

## 用户反馈后的核查

用户指出顶部 Google sign-in 占空间，点击仍回到站内登录页。已将桌面、手机可见文案统一改为 Sign in；保留无障碍标签 Sign in with Google。按钮仍直接指向 OAuth start。

复查本地日志，实际错误为普通 Next start 中未初始化 Cloudflare context。当前机器和预览也没有 GOOGLE_CLIENT_ID、GOOGLE_CLIENT_SECRET、GOOGLE_REDIRECT_URI。认证 start 捕获错误后回跳 /login?error=oauth_not_configured，因此截图确实是失败恢复页，不能视为完成真实登录。未伪造凭据或用测试登录替代真实登录。

通过浏览器访问正式站既有 /api/v1/auth/google/start?returnTo=%2F，确认最终域名 accounts.google.com，页面标题为 Google 账号登录，主标题为“选择账号”。仅检查到此，未选择个人账号、创建会话或完成授权。这证明正式站既有登录入口可到达 Google；本轮简化代码尚未发布，不能据此声称新代码已通过生产端到端登录。

文案修正后，11 项相关登录及导航测试、范围 ESLint 与完整构建通过。更新后的本地预览仍仅用于查看页面及检查错误分支，缺少真实登录配置的边界保持不变。

## 生产适配补充修复

首轮发布后专项 HTTP 检查发现，固定版本的 OpenNext 生产适配器重建查询字符串时会展开嵌套参数中的分隔符，导致 returnTo 的后续查询条件和 hash 丢失。返回地址改为带 v1 前缀的 UTF-8 base64url 传输值，服务端解码后继续执行原来的同源、登录循环和 API 路径过滤；该编码不承担身份认证作用。旧的普通路径参数仍可读取。顶部动态入口、登录重试、配置失败及回调失败统一使用这一传输方式。

新增两项回归测试，覆盖固定适配器的解码后查询重建、多个查询条件、hash、中文、字面编码分隔符、错误编码和外部地址。合计 38 项认证与账户相关测试通过，修复范围 ESLint 通过；后续以生产专项检查确认完整地址实际写入临时 cookie。没有改动 Google 凭据、授权范围、state/PKCE、会话有效期或合并权限。
