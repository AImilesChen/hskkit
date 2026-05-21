# HSKKit.com 定价与商业化完整报告 v3.3

> PRD 版本: v3.4
> 报告版本: v3.3
> 报告日期: 2026-05-19
> 编制人: 合规财务_小财
> 性质: 定价校准与商业化合规初审，不构成正式法律意见

---

## 一、执行摘要

### 核心结论

| 项目 | 结论 |
|------|------|
| P1 Initial 定价 | 只上线 Pro Monthly $5.99 和 Pro Yearly $49 |
| Free 层 | 中等偏高，建议收紧 Worksheet 和 Reading 限制 |
| AI Credits 成本 | 当前极低（< $0.06/月/用户），需防范 API 涨价和 Lifetime 累积 |
| Lifetime/Beta/Teacher Pack | 全部 postponed，不在 P1 Initial 上线 |
| 支付工具 | 个人 PayPal（USD），开发前需验证 API 能力 |
| 支付合规 | 需补充 10 项核心条款进 Refund Policy / Terms |

### Top 3 风险

1. **Free 层 Worksheet 3 份/日过度慷慨**，削弱 Pro 转化动力
2. **个人 PayPal 技术能力待验证**（subscription/webhook/退款 API）
3. **支付条款（自动续费、退款、credits 规则）尚未写入正式文档**

---

## 二、竞品对标分析

| 产品 | 月付 | 年付 | 备注 |
|------|------|------|------|
| Duolingo Plus | $6.99 | $83.99 | 语言学习头部 |
| ChineseSkill Premium | $8.99 | $59.99 | 中文学习直接竞品 |
| Hack Chinese | $8.00 | $60.00 | HSK 词汇工具 |
| Skritter | $14.99 | $99.99 | 汉字书写工具 |

**对标结论**: HSKKit 当前定价低于竞品 15-30%，适合冷启动获客，但正式版需上调至行业中等水平。

---

## 三、价格体系

### P1 Initial Paid Launch 价格表（首版上线）

| 方案 | 价格 | AI Credits/月 | 状态 |
|------|------|--------------|------|
| Free | $0 | 0 | P0a 可用 |
| **Pro Monthly** | **$5.99/月** | **500** | **P1 Initial 上线** |
| **Pro Yearly** | **$49/年** | **500** | **P1 Initial 上线** |

**Postponed / Future Paid Plans（P1 Initial 不上线）**：
- Beta Lifetime: $49-$59（一次性）— postponed，credits 方案待确认
- Lifetime: $129（限量发售）— postponed，credits 方案待确认
- Teacher Pack Monthly: $19/月（Beta）/ $24.99/月（正式），1000 credits/月 — postponed
- Teacher Pack Yearly: $149/年（Beta）/ $199/年（正式），1000 credits/月 — postponed
- School Pack: $49-$99/月，2000+ credits/月 — 未来计划
- Standalone credits pack — P1 initial not offered

### Post-P1 Price Evaluation Option（非已决策，仅评估）

| 方案 | 价格 | AI Credits/月 | 目标用户 |
|------|------|--------------|---------|
| Free | $0 | 0 | 所有用户 |
| Pro Monthly | $6.99/月 | 500 | 普通学习者 |
| Pro Yearly | $59/年 | 500 | 长期学习者 |
| Lifetime | $129（限量发售） | credits 方案待确认 | 忠实用户 |
| Teacher Pack Monthly | $24.99/月 | 1000 | 个体教师 |
| Teacher Pack Yearly | $199/年 | 1000 | 个体教师 |
| School Pack（未来） | $49-$99/月 | 2000+ | 学校/机构 |

**注意**：以上价格为 Post-P1 评估选项，是否执行取决于 P1 conversion、retention、refund rate、AI cost 和竞品变化。需建哥最终确认。

### 价格变动说明

| 方案 | P1 Initial 价 | Post-P1 评估 | 变动幅度 | 理由 |
|------|---------|--------|---------|------|
| Pro Monthly | $5.99 | $6.99 | +17% | 对标竞品中位数 |
| Pro Yearly | $49 | $59 | +20% | 仍保持低于月付累计价格的明显折扣 |
| Lifetime | $129（ postponed ） | $129 | — | 限量发售，控制长期风险 |
| Teacher Monthly | $19（ postponed ） | $24.99 | +31% | 个体教师支付意愿更强 |
| Teacher Yearly | $149（ postponed ） | $199 | +34% | 匹配月付上调 |

---

## 四、Free / Pro 功能边界

### Free 层功能限制

| 功能 | 当前限制 | 评估 | 建议 |
|------|---------|------|------|
| HSK Level Test | 完整开放 | 合理，获客漏斗入口 | **维持** |
| HSK 1 Vocabulary | 完整浏览 | 合理，SEO 核心 | **维持** |
| HSK Levels Guide | 完整开放 | 合理 | **维持** |
| HSK 1 Practice Test | 每日 1 套 | 合理，转化钩子 | **维持** |
| Worksheet Generator | 每日 3 份 | 过度慷慨 | **建议降至 1 份/日** [待 PRD/建哥确认] |
| Reading with Pinyin | 仅部分（模糊） | 模糊 | **建议明确仅 2/5 篇** [待 PRD/建哥确认] |
| Flashcards | 仅部分（模糊） | 模糊 | **建议明确仅前 30 词** [待 PRD/建哥确认] |
| PDF Download | 每日 1 页 | 仅适用于 P1 PDF Pack 上线后 | **P0 Full browser-print worksheet 单独限额** [待确认] |
| Mistake Review | 最近 5 题 | 合理 | **维持** |
| Progress Save | 本地 7 天 | 合理 | **维持** |

### P1 Initial Pro 功能（必须锁定，可按开发节奏分批上线）

**P0 优先批次**：
1. **云端进度同步** — 核心卖点，数据价值
2. **完整错题本历史** — 数据价值功能
3. **AI Explanations** — 成本驱动功能
4. **Credits 规则系统** — 计费基础设施

**后续批次**：
5. **AI Study Plan** — 高价值个性化功能
6. **批量 PDF Packs** — 资源消耗型功能
7. **Worksheets（高额度）** — 高额度 worksheet 生成，受 Fair Use Policy 限制
8. **高级 Flashcards (SRS)** — 差异化功能
9. **More HSK practice tests, starting with HSK 2 and HSK 3** — 内容价值功能

**Postponed 功能（不在 P1 Initial Pro）**：
- Teacher Printables — 属于未来 Teacher Pack feature，不包含在 P1 Initial Pro Monthly/Yearly

---

## 五、AI Credits 成本建模

### API 成本假设（GPT-4o-mini 级别）

| 功能 | Input Tokens | Output Tokens | Credits | 成本/Credit |
|------|-------------|---------------|---------|------------|
| AI Explanation | 500 | 300 | 2 | $0.000127 |
| AI Quiz Generation | 800 | 600 | 5 | $0.000096 |
| AI Study Plan | 1000 | 800 | 20 | $0.000031 |

- **加权平均成本**: ~$0.000112 / credit
- **Pro 用户 500 credits/月 API 成本**: ~$0.056
- **Teacher 用户 1000 credits/月 API 成本**: ~$0.112

### 毛利分析

| 方案 | 月收入 | API 成本 | 毛利 | 毛利率 |
|------|--------|---------|------|--------|
| Pro Monthly | $5.99 | $0.056 | $5.93 | 99.1% |
| Pro Yearly（摊月） | $4.08 | $0.056 | $4.03 | 98.6% |
| Teacher Monthly | $19.00 | $0.112 | $18.89 | 99.4% |

**结论**: 当前定价下 API 成本占比 < 2%，毛利空间充足。

**假设边界**: 以上成本基于 GPT-4o-mini 级别价格和估算 token 用量。实际成本会受模型选择、prompt/output 长度、API 调价、滥用行为和未来高成本 AI 功能影响。**本模型仅覆盖 API 使用成本，不包含 PayPal fees、hosting、email、support、tax/VAT、refunds、chargebacks 等其他运营成本。**

### Credits 消耗表

| 功能 | Credits | 预估成本 | Pro 500 月限额 |
|------|---------|---------|---------------|
| AI Explanation | 2 | $0.00025 | ~250 次 |
| AI Quiz Generation | 5 | $0.00048 | ~100 组 |
| AI Study Plan | 20 | $0.00062 | ~25 次 |

### 典型用户月消耗场景

| 用户类型 | Explanations | Study Plans | Quiz Generations | 总 Credits |
|----------|-------------|-------------|-----------------|------------|
| 轻度用户 | 50 | 5 | 0 | 200 |
| 中度用户 | 100 | 2 | 10 | 340 |
| 重度用户 | 200 | 5 | 20 | 600（超额） |

---

## 六、Lifetime 方案（Postponed）

### 当前方案问题

**历史/PRD 原方案**: Lifetime $99，500 credits/月。

原方案风险（已废弃）:
- Lifetime $99 = 500 credits/月 × 无限期
- 36 个月累计 API 成本: ~$2.00
- 10 年累计 API 成本: ~$6.70
- **风险**: 用户量放大 + API 涨价 + 模型升级 + 未来高成本功能

### 推荐方案（一次性赠送 credits）

| 方案 | 描述 | 推荐度 |
|------|------|--------|
| **一次性赠送** | Lifetime one-time 1,000 credits bonus；Beta Lifetime one-time 500 credits bonus | ⭐⭐⭐ **优先推荐** |
| 限制 300 credits/月 | Lifetime 用户 300/月（Pro 的 60%） | ⭐⭐ 备选，需单独成本测算和建哥确认 |
| 年度一次性发放 | 每年 3600 credits，不累积 | ⭐⭐ 备选 |
| 不含 AI credits | AI 单独按需购买 | ⭐⭐ 保守 |

**注意**：300 credits/月只能作为备选方案，需单独成本测算和建哥确认。优先推荐一次性赠送 credits 方案。

**文案建议（一次性赠送）**:
> "Lifetime members receive a one-time bonus of 1,000 AI credits. Beta Lifetime members receive a one-time bonus of 500 AI credits. Monthly Pro members receive 500 AI credits per month."

---

## 七、Teacher Pack 定价校准（Postponed）

### 当前定位问题

- $19/月 更接近 "Pro Plus" 而非真正的 "Teacher Pack"
- 真正的 B2B（学校/机构）定价应在 $49-$99/月
- 当前方案缺少多席位、管理后台等 B2B 要素

### 建议分层

| 层级 | 价格 | 目标用户 | 功能 |
|------|------|---------|------|
| Teacher Lite（ postponed ） | $19/月 | 个体教师 | 1000 credits, 批量 PDF, 班级资源 |
| School Pack（未来） | $49-$99/月 | 学校/机构 | 多席位, 管理后台, 学生数据, API 接入 |

### 合规提示

若 Teacher Pack 涉及学生数据管理:
- **美国**: 需考虑 FERPA（家庭教育权利和隐私法）
- **EU**: 需明确 GDPR 学校数据处理条款
- **Privacy Policy**: 需增加 "Educational Data" 章节

**儿童数据前置提醒**:
- 推出 Teacher Pack 或儿童/家长功能前，应避免直接收集 13 岁以下儿童个人信息
- 必要时补充监护人同意和儿童数据条款
- 英文: "Before launching Teacher Pack or any kids/parent-focused features, HSKKit should avoid collecting personal information directly from children under 13 and should add age/guardian-related terms if needed."

---

## 八、支付合规条款清单

### 支付工具（PayPal + 技术 caveat）

Payments are processed through PayPal. For the P1 initial paid launch, HSKKit plans to use a personal PayPal account with USD settlement. HSKKit does not store full payment card details or full PayPal account credentials on its own servers. PayPal processes payment, billing, refund, fraud-prevention, and dispute-related information under PayPal's own policies.

**Technical caveat**: before launch, the development team should verify that the selected PayPal account supports subscription creation, recurring billing, webhook events, cancellation handling, and refund processing. If the personal PayPal account does not support the required subscription or API capabilities, HSKKit **cannot hard-launch paid features** and must either upgrade to a PayPal Business account or use an alternative subscription-capable payment solution.

### 必须写入 Terms of Service

1. **订阅周期与自动续费**
   - "Subscriptions automatically renew at the end of each billing period unless cancelled."
   - 明确周期、金额、续费日期

2. **取消规则**
   - Users primarily cancel subscriptions through PayPal subscription management.
   - If users need help canceling, they may contact support@hskkit.com.
   - After cancellation, Pro access remains active until the end of the current billing period.
   - Failed renewals receive a 3–7 day grace period before the account is downgraded to Free.
   - Do not mention an HSKKit Account Settings → Billing cancellation path unless the product has implemented it.

3. **退款政策**
   - Refund window: 7 days from the purchase date.
   - Refunds may be denied or prorated for heavily used AI credits, consumed service quotas, or completed AI-generated services, except where required by applicable law.
   - After 7 days, subscription payments are generally non-refundable, except where required by applicable law. Users may still cancel future renewals.
   - Unused or lightly used purchases may be eligible for refund within the 7-day window, subject to abuse prevention and applicable law.
   - Duplicate charges, obvious billing errors, or technical failures making the service unavailable may be eligible for refund or account credit at our discretion.
   - Approved refunds are processed through PayPal to the original payment method. Actual timing depends on PayPal and the user's payment provider.
   - Users should contact support@hskkit.com for refund support.

4. **Credits 规则**
   - Monthly credits reset at the beginning of each billing cycle and do not roll over.
   - Credits have no cash value and cannot be exchanged, transferred, or redeemed for money.
   - We may apply fair use, rate limits, and abuse prevention measures to protect service stability.
   - 保留调整权

5. **价格调整**
   - 提前 30 天通知现有订阅者
   - Lifetime 价格锁定，但 credits 可调整

6. **Chargeback**
   - 建议先联系支持
   - 禁止写 "chargebacks are forbidden" 或罚款

7. **税费**
   - "Prices do not include applicable taxes."
   - Checkout 时计算
   - 税费/VAT 是否由 PayPal checkout 计算和展示：[待确认]

8. **Beta 特别条款**
   - 限前 100 名
   - 不保证未来价格保护
   - 功能可能变更

9. **Fair Use Policy**
   - 防止 API 滥用和自动化脚本
   - 保留暂停账户权利

10. **Lifetime 特别条款**
    - 一次性付费，服务期限为用户账户存续期
    - 不保证未来所有功能
    - Credits 数量可调整

---

## 九、风险矩阵

| 风险场景 | 概率 | 影响 | 应对策略 |
|----------|------|------|---------|
| API 涨价 2x | 中 | 成本升至 $0.11/月 | 可承受，Terms 保留调整权 |
| API 涨价 10x | 低 | 成本升至 $0.56/月 | 需调整 credits 或定价 |
| 切换到 GPT-4o | 低 | 成本升至 $2-5/月 | 限制高成本功能或单独计费 |
| Lifetime 用户存活 5 年+ | 中 | 累积成本 $3-10 | 一次性赠送 credits，控制长期风险 |
| 用户 credits 使用率 100% | 中 | 成本 $0.06-0.11/月 | 可承受 |
| 个人 PayPal 不支持订阅 API | 中 | 技术阻塞 | 升级 Business PayPal 或换方案 |
| 跨境支付税费合规 | 中 | 法律风险 | PayPal 自动税费或手动配置 |
| FERPA/COPPA（Teacher Pack） | 低 | 法律风险 | 咨询专业律师 |

**总体判断**: 当前定价下毛利空间充足（>95%），风险可控。核心风险是个人 PayPal 技术能力和 Lifetime 长期累积，建议通过一次性赠送 credits、Terms 保留权和 PayPal API 验证应对。

---

## 十、上线前支付合规 Checklist

### P1 Initial 必做项

- [ ] Refund Policy 页面发布
- [ ] Terms of Service 包含订阅/credits/退款条款
- [ ] 定价页明确标注 "Prices do not include tax"
- [ ] Checkout 页显示自动续费提示
- [ ] 支付确认邮件包含详情和取消路径（PayPal + support@hskkit.com）
- [ ] PayPal 订阅/取消/退款 API 能力验证完成
- [ ] Cookie Banner 配置（若使用 GA4/广告像素）
- [ ] Privacy Policy 更新支付数据处理条款（PayPal）
- [ ] Fair Use Policy 发布
- [ ] 税费计算配置（PayPal 自动或手动）
- [ ] Chargeback 处理流程建立
- [ ] 退款申请邮箱配置（support@hskkit.com）
- [ ] Pricing 页面只展示 Pro Monthly/Yearly，不出现 Lifetime/Beta/Teacher Pack
- [ ] 前端不出现 "Subscribe now / Buy credits" 等误导性文案（P0a）

### Future Plans 后续项

- [ ] Beta 用户明确知晓 Beta 特殊条款（Beta 上线时）
- [ ] Lifetime 特别条款明确（Lifetime 上线时）
- [ ] Teacher Pack 定价和功能确认（Teacher Pack 上线时）
- [ ] Standalone credits pack 规则和退款政策（credits pack 上线时）
- [ ] FERPA/COPPA 合规审查（Teacher Pack/School Pack 上线时）
- [ ] Lifetime/Beta Lifetime credits 方案最终确认（建哥决策）

---

## 十一、PRD v3.4 商业化备注

P1 Initial Paid Launch 以本定价报告为准：
- P1 Initial 只上线 Pro Monthly $5.99/月 和 Pro Yearly $49/年
- Lifetime、Beta Lifetime、Teacher Pack、standalone credits packs 全部 postponed
- Post-P1 价格评估选项：Pro $6.99/月、$59/年（是否执行取决于 P1 conversion、retention、refund rate、AI cost 和竞品变化）
- Lifetime credits 优先推荐一次性赠送方案，300/月作为备选需单独成本测算和建哥确认
- Free Worksheet 建议降至 1 份/日、Reading 明确 2/5 篇、Flashcards 明确前 30 词（转化优化建议，待 PRD/建哥确认）

---

## 十二、最终决策建议

### 定价决策

| 决策项 | 结论 |
|--------|------|
| P1 Initial 价格 | **只上线**: Pro $5.99/月, Yearly $49 |
| Postponed 计划 | Lifetime $129, Beta Lifetime $49-$59, Teacher $19/月, School Pack |
| Post-P1 评估选项 | Pro $6.99/月, Yearly $59（取决于 P1 数据） |
| Lifetime credits | **优先一次性赠送**: Lifetime 1,000 credits, Beta Lifetime 500 credits |
| Lifetime credits 备选 | 300/月（需单独成本测算和建哥确认） |
| Free Worksheet | **建议降至 1 份/日** [待 PRD/建哥确认] |
| Free Reading | **建议明确仅 2/5 篇** [待 PRD/建哥确认] |
| Free Flashcards | **建议明确仅前 30 词** [待 PRD/建哥确认] |

### P1 Initial 必须锁 Pro 的功能

**优先批次**：
1. 云端进度同步
2. 完整错题本历史
3. AI Explanations
4. Credits 规则系统

**后续批次**：
5. AI Study Plan
6. 批量 PDF Packs
7. Worksheets（高额度）
8. 高级 Flashcards (SRS)
9. More HSK practice tests, starting with HSK 2 and HSK 3

**不在 P1 Initial Pro**：
- Teacher Printables — 属于未来 Teacher Pack feature

### 必须写入的 10 项条款

1. 7 天退款窗口 + except where required by applicable law
2. 自动续费披露
3. 取消规则（PayPal 为主 + support@hskkit.com 兜底）
4. Credits 不累积/无现金价值/不可转让
5. 已消耗 credits 可拒绝或按比例退款
6. Beta/Lifetime 特殊条款（ postponed ）
7. 价格调整提前 30 天通知
8. Chargeback 建议先联系支持
9. 税费 checkout 计算
10. Fair Use Policy

### 结论

**Conclusion**: HSKKit P1 initial paid launch is scoped to two PayPal-based USD subscriptions only: Pro Monthly ($5.99/month) and Pro Yearly ($49/year). Lifetime, Beta Lifetime, Teacher Pack, and standalone credits packs are postponed. The product must consistently disclose auto-renewal, cancellation through PayPal, support fallback, 7-day refund window, credits reset/no-rollover/no-cash-value rules, end-of-period access after cancellation, and 3–7 day grace period for failed renewals. Personal PayPal subscription/API capabilities must be verified before launch; if unsupported, HSKKit cannot hard-launch paid features and must upgrade to PayPal Business or use an alternative solution.

---

> 本报告为定价与商业化合规初审，不构成正式法律意见。高风险条款（如跨境支付税费、FERPA/COPPA 合规、PayPal API 能力验证）建议咨询专业律师或技术团队复核。
