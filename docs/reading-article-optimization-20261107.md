# 阅读文章模板优化 · 2026-11-07

完成本地实现与验收，尚未部署生产。

- 菜市场预览：http://127.0.0.1:3031/reading/article/a-market-morning
- 借书证预览：http://127.0.0.1:3031/reading/article/the-library-card

## 实现

阅读页外框最大 1200px，桌面正文区域内部保持最大 800px 行宽；标题区增加学习目标、三个阅读重点，前两篇复用现有相关插图。关键词采用绿色卡片，句型采用紫色，理解练习采用青色及明确文字标签。手机逐段重排，不缩小桌面多列。

删除原词汇/摘要固定两列布局。英文摘要改为正文后独立的全宽、默认折叠区域；词汇桌面三列、平板两列、手机一列，卡片包含拼音、释义、原文例句与段落跳转。菜市场、借书证各补充三个实用词，共六个词；其他篇目按原有难点词处理。

阅读正文提供 Word help 开关、重点词 ruby 拼音、点击词语显示/关闭释义，以及 Standard/Larger 两档字号。拼音仅覆盖重点词，未将其包装为整篇逐字注音。完整英文翻译与音频不在本轮范围；英文摘要继续使用既有已发布文本。

九篇文章各补充两个与原文直接相关的句型/表达讲解。题目保留原选项、答案、即时反馈、分数和整轮重试，追加真实原文引用、段落编号及定位链接；目标段落可键盘定位并用暖色标记。菜市场时间题引用同时包含“星期六”和“早上”，避免依据不完整。换文章时以 slug 重置客户端练习和阅读辅助状态。

现有九篇分属不同级别，没有虚构同级新文章。继续学习区域连接当前等级 10 题练习及真实文章集合。不增加依赖、API、登录限制、数据库、存储写入或定时任务。

## 验证

- 18 项相关测试通过：原文章与阅读库回归、九篇讲解及引用属于其原文、原题选项/答案保留、关键词重复/重叠匹配、文本复原、无匹配与空文本、无来源时明确失败、时间题依据完整。
- 隔离 Next.js 生产构建与类型检查通过，958 页生成成功。范围 ESLint 无错误，有一项针对既有静态 WebP 用法的 img 建议警告。
- 九篇本地 HTTP 页面均为 200；逐段读取服务器 HTML 确认原文未改，H1 唯一、段落/章节 ID 无重复、所有页内锚点有效、canonical 指向正式域名的原路径。
- 浏览器完整操作：菜市场 Word help 开关、关键词释义打开/关闭、字号切换、英文摘要展开、一次错误加两次正确得到 2/3、Try again 清除答案并恢复九个选项、原文链接跳回并高亮；借书证长词“工作人员”在 320px 下可注音、显示释义，三题全对显示 3/3。
- 九篇在 320px 下均无横向溢出；菜市场另核验 390/768/1440px。三种视口下摘要宽度分别为 335/705/1152px，收起高度均为 62px，词汇卡为一/二/三列。借书证在 390px 下也为单列且无溢出。
- 最终浏览器控制台读取无 error。一次自动鼠标勾选受滚动状态影响未生效，按已观察的未选中状态改用键盘 Space 成功，随后完整验证开关；未因此改动业务行为。

## 文件和证据

范围为八个源码/测试文件：src/app/reading/article/[slug]/page.tsx、reading-article-page.module.css；src/app/components/reading-article-check.tsx、reading-article-check.module.css、reading-article-text.tsx、reading-article-text.module.css；src/lib/learning/reading-article-guidance.ts；tests/reading-article-guidance.test.mts。原 src/lib/learning/reading-articles.ts 未修改。

证据目录 tmp/reading-article-optimization-20261107/：before/ 保留旧模板；source-manifest.json 记录工作区与预览目录一致的八个文件 SHA-256；build.log、tests.log、lint.log、http-checks.json、narrow-checks.json、width-checks.json 为核验记录。desktop-vocabulary.png 展示桌面六张词汇卡，desktop-start-final.png 实际捕获词汇/句型/练习衔接，mobile-library-final.png 为最终借书证手机词汇区。早期 desktop-start.png 截图在视口切换时出现黑边，已拒绝作为交付证据。未采用它来声称页面缺失内容。

预览进程号保存在 preview-pid.txt。生产站仍为已上线的首页版本 4540130；后续发布应仅包含本次范围，保留工作区其余改动。没有启用已取消的自动页面缓存清理。
