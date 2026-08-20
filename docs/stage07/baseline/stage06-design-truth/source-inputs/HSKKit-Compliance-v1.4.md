# HSKKit PRD v4.0 Compliance Addendum v1.4 — Auditor Closure

> Project: HSKKit (`https://hskkit.com`)  
> Review: Stage04 document-only compliance/financial-controls repair; not formal legal, tax, or payment-provider advice.  
> Scope: report and verification record only. No PRD, pricing, code, configuration, secrets, production legal page, deployment, supplier or payment account was changed.  
> **Auditor conclusion: GO — STAGE04 DOCUMENT ONLY.** Owner explicitly authorized the independent auditor to close the remaining evidence defect. This does not approve implementation, production launch, payment activation, or automatic Stage05 dispatch.
> **Version boundary:** this v1.4 supersedes v1.3 only as the current Stage04 document/audit package. v1.3 remains an immutable historical worker snapshot with report SHA `c2317f468834734164f615a724bf21da535fb3568c6136316e5d084bafea6da1` and manifest SHA `f153eb009df4ebef87a335eec74b61e10217537f5cfd0e2c4772f7234c735350`.

## 1. Authoritative chain and re-collected repository facts

| Authority | Canonical path / role | SHA-256 |
|---|---|---|
| Frozen candidate PRD | `/root/projects/hskkit/docs/product/HSKKit-PRD-v4.0-owner-review.md` | `09b5b7b8a372fedd6f472368381187bf4ed71818a6316200b266640b02f29688` |
| Stage03 GO-reviewed commercial candidate | `/root/projects/hskkit/docs/pricing/hskkit-pricing-report-v40-owner-review.md` | `1cad5f9c79477de89838918a9b3ee45acdf4a24226e6de3c6400624ac782362e` |
| Stage04 v1 historical/superseded repair input | `/root/.hermes/profiles/hegui/cache/documents/HSKKIT_PRD_v4_0_COMPLIANCE_ADDENDUM_v1.md` | `4807fb937bf0ab97198a2cf95a2d016cadcf9aea33ecea8102441f957690b862` |
| Stage04 v1.1 historical/superseded repair input | `/root/.hermes/profiles/hegui/cache/documents/HSKKIT_PRD_v4_0_COMPLIANCE_ADDENDUM_v1_1.md` | `9fca46b1a18a3e48eddf2e44b16b279f1c42017fb500e63527b7b53d200a4837` |
| Stage04 v1.2 historical/superseded repair input | `/root/.hermes/profiles/hegui/cache/documents/HSKKIT_PRD_v4_0_COMPLIANCE_ADDENDUM_v1_2.md` | `1d9ed9beca0264bde69a738d5f14580386f5c1dd57abb8a1fb566c05a10daaa7` |
| P0 Lite read-only baseline | `/root/.hermes/profiles/hegui/workspace/HSKKit_P0_Lite_Compliance_Boundary_v2.md` | `1df510b8b5600aff74cb95485e1594aeee1a5124397b01ac489abfdbe48e8008` |

Re-collected at `2026-08-12T01:20:03Z`: repo `/root/projects/hskkit`; commit `129ec000a74ac26215524adafc766b6d17347304`; branch `main`; **dirty** with untracked pricing/PRD/audit/script artifacts (including the canonical PRD and pricing-report files). The canonical files above match the task-specified hashes and override stale delivery-cache copies. This report does not claim a clean repository.

Frozen scope rule: **P0, P1 and P2 are all required ranges of the PRD; P2 is later implementation only, not cancellation, permanent unavailability, or exemption from final acceptance.** The PRD remains a candidate/PENDING_OWNER_REVIEW product document; this Document GO does not change that fact.

## 2. Frozen cancellation and refund contract (single Stage04 candidate)

This is the single candidate contract for Stage05 copy, not payment authorization. Request channel: `support@hskkit.com`. A request must include account email, plan or PDF Pack order reference, purchase date, request type, and short reason. Receipt confirmation: **2 UTC calendar days**. Manual eligibility review and decision: **5 UTC calendar days** after receipt. If approved, refund initiation to the original payment method: **3 UTC calendar days** after decision; posting time is controlled by the payment institution.

### 2.1 Pro Monthly and Pro Yearly

A subscriber may request cancellation at any time via the support channel. Cancellation stops automatic renewal at the end of the then-current paid billing period; access remains until that end. An approved immediate refund, chargeback outcome, or mandatory law can end access earlier. The confirmation notice states the effective end date.

A refund request is eligible only if received within **7 UTC calendar days after the original successful subscription charge**, no more than **10 AI credits** have been used, and no refund has already been granted for that charge. Failed provider calls that are not debited or are atomically restored are not credit use. A request outside 7 days, after more than 10 credits, or duplicating a prior refund is ineligible, **except where required by applicable law**. Mandatory consumer and lawful payment-dispute rights are preserved. The candidate plans remain Pro Monthly US$5.99/month and Pro Yearly US$49/year; no self-service billing route, processor, webhook, or checkout is represented as live.

### 2.2 PDF Pack (P2 later SKU; separate contract)

For the `HSKKit Advanced Study PDF Pack`, a manual refund request is eligible only when received within **7 UTC calendar days after purchase** and **zero successful downloads** are recorded. At most three successful downloads are allowed and access expires 14 days after first ready. After one successful download, the request is ineligible, **except where required by applicable law**. The receipt, review, decision, and initiation times above apply. These PDF Pack rules do not apply to subscriptions.

### 2.3 Payment and implementation gate

Payment is `UNSELECTED / FEATURE OFF`. A provider, product/endpoint, account mode, cancellation/refund API, webhook/reconciliation, tax and consumer-flow evidence must be recorded and tested before implementation, launch, or collection of funds. A future self-service cancellation page may be described only after it is implemented and tested; it does not change the cancellation right or email channel.

## 3. Canonical-object field coverage and object contracts

**Object-contract index (not the mechanical coverage denominator):** these 21 canonical PRD entities have lifecycle, DSAR, refund/revocation and minimum-audit contracts. Exact field coverage is in §3.1 and Appendix A; no object count is used as a field-coverage claim. `D+30/D+90/D+180` means after terminal event. A lawful hold must have a documented basis and restricted access.

| # | Canonical object — required PRD fields | Lifecycle / retention and deletion | DSAR, refund/revocation and minimum audit exception |
|---:|---|---|---|
| 1 | **ContentAsset** — `id,type,standard_version,level_band,content_version,source_ref,license_ref,qa_status,publish_status` | `draft→in_qa→published→withdrawn`; historical versions retained for licence term + 6y; withdrawn items removed from future delivery. | Rights/DSAR does not export another user’s data. Withdrawal blocks new use/export; audit keeps ID/version/licence-ref/action/time/reason only. |
| 2 | **AudioAsset** — `id,content_asset_id,transcript,pronunciation,tones,speech_rate,voice_or_engine,source_ref,license_ref,cache_right,offline_right,qa_status,version` | Invalid field set cannot publish; withdrawal stops new controlled URL; retain rights/version for licence term + 6y. | Withdrawal/revocation stops playback/download; audit retains asset/version/licence/refusal reason only. |
| 3 | **Mastery** — `owner_scope,content_asset_id,dimension,score,due_at,algorithm_version,revision` | Active-account record; erase/de-identify at completed deletion; no content text in audit. | Export only requesting owner’s scope; deletion cascades; audit request/object-class/status/time/error-code. |
| 4 | **ReviewSchedule** — `id,mastery_id,grade,interval,due_at,source_attempt_id,idempotency_key` | Created by valid grade; duplicate replay returns prior result; remove with learning-record deletion. | DSAR follows owner via Mastery; audit only schedule ID/state/idempotency outcome. |
| 5 | **Attempt** — `id,owner_scope,mode,skill,standard_version,content_version,state,started_at,ended_at,answers,result,timer_deadline` | `created→in_progress→submitted→scored` or timed out; remove/de-identify at deletion. | Export scoped record; results/answers never enter analytics or broad audit; revocation preserves only required dispute/security metadata. |
| 6 | **DailySession** — `id,owner_scope,local_day,tz,rule_version,queue_snapshot,state,summary` | `created→active→paused→completed/expired/cancelled`; delete with owner record. | Export scoped summary; cancellation before completion stops queue write; audit ID/state/time only. |
| 7 | **MistakeCase** — `id,attempt_id,question_version,status,weakness_tag,resolved_at` | `open→in_review→resolved/retired`; remove with linked learning data. | Export scoped case; withdrawn question prevents future selection, preserves version reference; audit case/status/time only. |
| 8 | **GuestMerge** — `id,guest_scope,user_id,preview,resolution,state,expires_at` | `previewed→confirmed/cancelled/expired`; token expires 24h; abandoned preview deleted D+30. | User can cancel before confirmation; never overwrite without presented choice; audit hash/state/expiry/confirmation-time only. |
| 9 | **SyncState** — `user_id,server_revision,device_id,pending_changes,conflicts,resolution,updated_at` | `local_pending→syncing→synced/retryable_error/conflict`; delete with account. | DSAR export is owner-scoped; unresolved conflict expires D+30 after abandonment; audit revision/state/error only. |
| 10 | **Streak** — `user_id,timezone,current_count,longest_count,last_learning_day,policy_version` | Updated only by defined learning event; delete with account. | Export/delete with account; no payment/refund impact; audit action/time/policy version only. |
| 11 | **AccountDataRequest** — `id,user_id,type,state,confirmation_at,requested_at,completed_at,expires_at,failure_code,retention_exceptions` | Export `requested→processing→ready/failed/cancelled/expired`; delete `requested→confirmed→processing→completed/failed/cancelled`; request record D+30 except lawful exception. | Verify proportionately; cancellation allowed before irreversible delete; completion waits for propagation; audit request/type/state/time/exception-basis only. |
| 12 | **ContentReport** — `id,reporter_scope,asset_id,asset_version,reason,state,resolution,created_at` | `open→reviewing→resolved/rejected`; retain rights/dispute record 6y where needed. | Reporter may request own submission; substantiated withdrawal can remove asset; audit report ID/asset/version/state/time only. |
| 13 | **Entitlement** — `id,user_id,capability,source,starts_at,ends_at,status,config_version` | Separate from payment; active/ended/revoked with versioned config; retain accounting linkage as required. | Refund/cancellation/revocation changes entitlement independently; DSAR exports user entitlement; audit source/status/time/config-version only. |
| 14 | **AssetManifest** — `id,asset_ids,asset_versions,rights_snapshot,state,created_at` | Contains authorized assets only; `active→revoked`; preserve rights snapshot 6y. | Refund/withdrawal blocks new delivery via manifest; audit manifest/version/state/reason/time only. |
| 15 | **Plan** — `id,owner_scope,goal,available_time,target_date,plan_version,items,state,overload_reason` | Versioned create/edit; delete/de-identify at account deletion. | Export scoped plan; cancellation/entitlement end does not prematurely delete a valid plan; audit ID/version/state only. |
| 16 | **AIRequest** — `id,owner_scope,feature,input_scope,quota_cost,status,audit_id` | `requested→allowed→completed` or quota/rate/provider/reported terminal state; product prompt/output D+30; quota aggregate D+90. | Delete/export product copy by owner; provider deletion path must be verified before activation; audit feature/outcome/quota bucket/provider reference, never raw input/output. |
| 17 | **QuotaLedger** — `id,owner_scope,feature,period,limit,used,revision` | UTC calendar-month AI ledger; atomic debit/restore; retain D+90 then delete/de-identify. | Export user ledger; refund does not erase mandatory financial record; audit period/limit/used/revision/result only. |
| 18 | **AccessPolicy** — `id,resource_type,actor_scope,action,effect,revision` | Versioned policy retained while active + 6y security evidence. | DSAR excludes security-rule disclosure that enables abuse; revocation is immediate policy enforcement; audit actor-scope/action/effect/revision/time. |
| 19 | **AuditEvent** — `id,actor_scope,action,resource_type,result,created_at` | Append-only minimal record; retain 1y, then delete unless documented legal/security hold. | Never stores sensitive original, controlled URL, prompt, answer or payment credential; DSAR response describes applicable exception. |
| 20 | **OrderDraft** — `id,owner_scope,plan_ref,status,config_version` | While `not_configured`, no draft may be created; otherwise terminal draft D+30. | Cancelled/failed draft cannot grant entitlement; export scoped non-financial draft only; audit ID/status/config/time. |
| 21 | **ExportJob** — `id,user_id,selection_manifest,asset_versions,state,expires_at,failure_code` | `queued→generating→ready→expired/cancelled/failed/revoked`; generated artefact/link expires 14 days after first ready. | User cancels before terminal generation; deletion/asset withdrawal/refund revokes link and stops new issuance; audit job/manifest/status/expiry/reason only. |

## 3.1 Mechanical field-coverage method and result

The only coverage denominator is **161 `canonical_object.field` entries** extracted from PRD section 11.2 and cross-checked against PRD section 11.1 API, PRD section 11.3 state machine, PRD section 11.4 events, and PRD section 12.1 acceptance mapping. Appendix A lists every exact field, PRD anchor, report location and status. It is separate from the 21-object reading index. **required=161; covered=161; missing=0; duplicate ambiguity=0.** Stage04 controls and processing categories are excluded from this denominator.

## 3.2 Inventory boundaries

Functional narrative source: PRD sections 9–10; route/API: PRD sections 10.2/11.1; fields: PRD section 11.2; state machines: PRD section 11.3; events: PRD section 11.4; acceptance: PRD section 12.1. UsageLedger, DeviceBinding, AudioLicensePool and PackPurchase are independent **Stage04 control** objects in §§4 and 6.1. Browser-local summary, identity/session, AI prompt/output/provider reference, analytics event, consent record, Cloudflare beacon observation, support email/case, PDF/export artefact, signed URL and payment/transaction/entitlement record are independent processing categories in §6.2.

## 4. Independent control objects (not substitutes for the 21 canonical objects)

| Control object | Required fields and lifecycle | Retention / DSAR / refund-revocation / audit exception |
|---|---|---|
| **UsageLedger** | `user_scope,feature,window_key,asset_id,asset_version,effective_at,idempotency_key`; atomically records daily session, grading and effective audio-play window; duplicate key does not double count. | Retain D+90 for quota/dispute support, then delete/de-identify. Export scoped aggregate; asset withdrawal stops new issuance, does not rewrite past ledger. Audit key hash/outcome/time only. |
| **DeviceBinding** | `user_id,device_id,active_at`; maximum 3 active devices; fourth requires prior deactivation. | Delete at account deletion or 90d inactivity. DSAR export scoped identifiers in minimized/pseudonymized form; no refund effect. Audit binding action/time/result only. |
| **AudioLicensePool** | `license_ref,asset_manifest_version,license_term,cost_pool_id,status`; active/suspended/revoked. | Retain licence/allocations for term + 6y. Revoked pool stops controlled delivery; preserves rights/payment dispute record. Audit pool/status/term/reason only. |
| **PackPurchase** | `order_id,pack_version,download_limit=3,successful_downloads,first_ready_at,expires_at,status`; ready/expired/revoked/refunded states. | Retain financial record per applicable accounting/tax/dispute period (recommended 7y); artefact/link follows 14-day rule. Candidate refund checks successful-download count; refund/withdrawal revokes new issuance. Audit order/pack/status/count/time only. |

## 5. Precise lifecycle contracts outside the canonical entity inventory

| Area | Precise recommended lifecycle |
|---|---|
| Browser-local practice summary | Limited score/completion/expiry and up to five wrong-question identifiers remain only in browser local storage for its configured TTL; user clears through browser site-data controls. No server sync is implied. It is not included in server DSAR unless submitted through a future account flow. |
| Identity/session | Account/session exists only after an approved auth implementation. Active while account/session valid; logout/revocation invalidates session immediately; deletion removes identity/session unless documented legal/security exception. Request verification records only result/time. |
| AI input/output | Send minimum feature context only after supplier gate. Product copies D+30, quota aggregate D+90; provider retention/training/ZDR/deletion must be evidenced before enablement. User delete/export is scoped to product copy; no raw input/output in analytics/audit. |
| Analytics/consent/beacon | Initial, Reject and Accept each record performance resources, scripts, runtime object, cookies and localStorage. Plausible-style endpoint and Cloudflare beacon are independently classified. Reject blocks non-essential technology; Accept permits only consent-gated technology where required. GSC/Bing remain webmaster tools, not visitor behavior analytics. |
| Support | `support@hskkit.com` cases resolve then delete at D+180; retain only restricted legal/dispute minimum. Case log stores ID/category/status/closure time, not email body in broad logs. |
| PDF/signed URL | Export/PDF is authorized manifest-only; signed URL expires 14 days after first ready, and immediately revokes on cancellation, account deletion, rights withdrawal, authorized refund under §2 eligibility rules, or entitlement/access revocation. |
| Payment record | Do not create while `not_configured`. After Payment Live only: transaction/entitlement link is retained for applicable tax/accounting/fraud/dispute period, recommended 7y absent a more specific legal requirement. Full card/bank credentials are never stored in this product record. |

## 6. Third-party category matrix

Public URL accessibility is evidence of the page, **not** acceptance/configuration/activation proof. “Default” is the unique recommended default for this stage.

| Category | Official evidence | Default | Alternative risk | Gate |
|---|---|---|---|---|
| Cloudflare delivery/security/Web Analytics | [Customer DPA](https://www.cloudflare.com/cloudflare-customer-dpa/); [Trust Hub GDPR](https://www.cloudflare.com/trust-hub/gdpr/); [Web Analytics](https://www.cloudflare.com/web-analytics/) | Retain delivery/security only; independently classify Web Analytics before launch. | Treating a beacon as essential without evidence creates consent/disclosure risk. | Production NO-GO |
| Plausible-style endpoint | [Plausible Data Policy](https://plausible.io/data-policy) | Keep endpoint schema minimized and obtain tenant/DPA/retention/deletion evidence before use expansion. | Public policy does not identify `plausible.shipsolo.io` controller, geography or configuration. | Production NO-GO |
| Google Search Console | [GSC Help](https://support.google.com/webmasters/) | Webmaster/search-performance only; no visitor behavioral analytics claim. | Conflating it with analytics corrupts consent notice. | Production NO-GO for any visitor script claim |
| Bing Webmaster Tools | [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a) | Webmaster/search-performance only; no visitor behavioral analytics claim. | Same classification error. | Production NO-GO for any visitor script claim |
| Auth | No selected provider evidence | Keep accounts disabled until provider/DPA/region/deletion evidence exists. | Naming an unselected provider makes legal disclosure false. | Implementation NO-GO |
| D1 | [Cloudflare D1](https://developers.cloudflare.com/d1/) | Do not use until exact account/region/retention/deletion controls are approved. | Product page does not prove tenant configuration or transfer posture. | Implementation NO-GO |
| R2 | [Cloudflare R2](https://developers.cloudflare.com/r2/) | Do not use for personal/PDF storage until signed-URL, deletion and region controls are proven. | Uncontrolled object retention/link exposure. | Implementation NO-GO |
| Email | No selected provider evidence | Support only at current address; do not activate transactional/marketing provider. | Unverified provider disclosure/retention. | Implementation NO-GO |
| AI | [OpenAI API pricing](https://openai.com/api/pricing/) is Stage03 cost evidence, not provider selection | No AI calls until provider/model/endpoint/DPA/training/retention/ZDR/transfer/deletion facts are recorded. | Cost page cannot establish data-use safeguards. | Implementation NO-GO |
| Audio | No licensor evidence | Publish/deliver only manifest-authorized assets. | Copyright, cache/offline and withdrawal exposure. | Implementation NO-GO; P2 Payment NO-GO |
| Payment | No selected processor evidence | Keep `not_configured`; select only after subscription/webhook/cancel/refund/reconciliation proof. | Processor may lack required API or consumer flow capability. | Payment NO-GO |
| Export | No selected provider evidence | Do not generate/export until signed URL, cancellation, expiry and deletion controls are tested. | Data disclosure and revoked-rights delivery. | Implementation NO-GO; P2 Payment NO-GO |

## 6.1 Binding precision schedule (overrides §§3–6 where more specific)

**Applies to every canonical row in §3.** Purpose/access: process only for the documented learning, rights, account, export or security purpose; access is owner-scoped, with least-privilege support/security access only. **Clock:** all server retention clocks use UTC; `local_day/tz` remains only DailySession/Streak product semantics. **Copies:** D1 primary row and indexed/derived records are deleted or de-identified at the same terminal deletion job; R2 object, signed URL metadata, Queue payload and edge/application cache are purged within 24h; logs retain only the expressly listed minimal audit fields. No object is an archive substitute for another object.

| Object | Active / readonly-archive / final deletion | DSAR, refund/chargeback/account deletion/revocation; exception |
|---|---|---|
| ContentAsset | Active while published; withdrawn is readonly rights history; delete primary content + derived cache 30d after licence expiry/withdrawal unless public-record preservation is approved. | Export does not apply to others' public assets; licence withdrawal revokes R2/cache/manifest within 24h. Rights/dispute metadata only: 6y, rights lead approval every 180d, then delete. |
| AudioAsset | Active while authorised; revoked readonly rights history; delete R2/cache/Queue derivatives 30d after licence expiry. | Asset withdrawal, refund/revocation revoke URL in 24h. Licence/dispute fields only: 6y, rights lead 180d review then delete. |
| Mastery | Active account; no archive; delete/de-identify 30d after completed account deletion. | DSAR export through AccountDataRequest; cancellation has no effect; security event minimum only: 1y, security lead quarterly review then delete. |
| ReviewSchedule | Active until fulfilled/obsolete; readonly 30d; delete 60d after terminal event. | Account deletion cascades; DSAR includes schedule; idempotency/security event: 1y, quarterly review/delete. |
| Attempt | Active/recoverable 30d after start; readonly 90d after terminal; delete/de-identify 120d after terminal or account deletion completion, whichever later. | DSAR export; account deletion queues all D1/Queue/cache copies; chargeback does not preserve answers. Fraud/security event only: 1y, quarterly review/delete. |
| DailySession | Active to local-day end; readonly 30d; delete 60d after terminal. | DSAR export; deletion cascade; no refund retention. Security event only 1y / quarterly review/delete. |
| MistakeCase | Active while open; readonly 30d after resolved; delete 60d after terminal. | DSAR/cascade; withdrawn content is unselectable. Security event only 1y / quarterly review/delete. |
| GuestMerge | Active token 24h; readonly none; delete preview/token/Queue/cache at expiry, no later than 24h. | Guest may cancel pre-confirmation; DSAR after verified account ownership. Anti-abuse hash only: 30d, weekly purge. |
| SyncState | Active account; readonly conflict snapshot 30d; delete 30d after account deletion completion. | DSAR export; account deletion purges D1/Queue/cache; no payment exception. Security event only 1y / quarterly review/delete. |
| Streak | Active account; readonly none; delete/de-identify 30d after account deletion. | DSAR/cascade; no commercial exception; minimal security event 1y / quarterly review/delete. |
| AccountDataRequest | Active request; readonly completion receipt 30d; delete receipt D+30. | Verified user may cancel before irreversible deletion; D1/R2/Queue/cache purge job completes within 30d. Legal-hold decision fields only: 1y, legal lead quarterly review/delete. |
| ContentReport | Active review; readonly 180d after resolution; delete D+180. | Reporter export only; asset revocation follows rights process. Rights/dispute minimum 6y, rights lead 180d review/delete. |
| Entitlement | Active during granted term; readonly 7y after payment terminal event; delete after 7y. | Cancellation/refund/chargeback revokes capability immediately per provider event; DSAR exports entitlement. Accounting/dispute link 7y, finance lead annual review/delete. |
| AssetManifest | Active while authorised; readonly 6y after revoke; delete after 6y. | Withdrawal/refund revokes issuance/R2/cache in 24h; export not applicable except own ExportJob. Rights evidence 6y / 180d review/delete. |
| Plan | Active account; readonly 30d; delete/de-identify 30d after account deletion. | DSAR/cascade; no payment exception; security event only 1y / quarterly review/delete. |
| AIRequest | Active request; readonly product copy 30d after completion; delete prompt/output/provider reference D+30 and Queue/cache within 24h. | DSAR export/delete; account deletion triggers same. Minimal provider outcome/quota audit 90d; security lead quarterly review/delete. |
| QuotaLedger | Active UTC month; readonly 90d after month end; delete/de-identify D+90. | DSAR export; refund cannot rewrite an accounting record but can revoke entitlement; minimal quota outcome 90d then delete. |
| AccessPolicy | Active version; readonly 6y after supersede; delete after 6y. | DSAR excludes rules whose disclosure creates a security risk; revocation immediate. Security exception 6y, security lead annual review/delete. |
| AuditEvent | Active append-only; readonly through 1y; delete at 1y. | DSAR supplies applicable description, not protected detection logic; no raw personal content. Security lead quarterly review; hold is 90d renewable in writing, then delete. |
| OrderDraft | Cannot exist while payment not configured; otherwise active 30d; delete terminal draft D+30. | Cancel/failure grants no entitlement; DSAR; fraud event only 1y / quarterly review/delete. |
| ExportJob | Active until ready/cancelled; readonly to 14d post-ready; delete job/R2/PDF/URL/cache 14d after first ready or within 24h of revocation. | DSAR/cancel/account deletion/refund/withdrawal revoke URL within 24h. Fraud/security event only 1y / quarterly review/delete. |

**F3 schema control:** UsageLedger, DeviceBinding, AudioLicensePool and PackPurchase are separate Stage04 processing categories and **must not overload** QuotaLedger, SyncState, AssetManifest or Entitlement. Their versioned PRD/API schema patch and D1/R2/Queue deletion jobs are Implementation P0; they are not asserted as existing schema.

| Category | Fields; purpose/access/storage | Clock/lifecycle/deletion; DSAR/revocation; exception |
|---|---|---|
| UsageLedger | `user_scope,feature,window_key,asset_id,asset_version,effective_at,idempotency_key`; quota/use integrity; owner and finance/security-only; D1, derived aggregate, Queue retry. | UTC monthly window; active in-window, readonly D+90, D1/Queue/cache/aggregate delete D+90. DSAR aggregate export; refund does not erase audit; outcome hash D+90 then delete. |
| DeviceBinding | `user_id,device_id,active_at`; max three active devices; owner/security-only; D1/cache. | Active until deactivation; readonly 30d; delete D+90 inactivity/account deletion. DSAR minimized identifier; no refund effect; anti-abuse hash D+90 then delete. |
| AudioLicensePool | `license_ref,asset_manifest_version,license_term,cost_pool_id,status`; rights control; rights/finance-only; D1/R2 manifest cache. | Active licence term; readonly 6y; delete D1/R2/cache D+6y. No user DSAR except own receipt linkage; withdrawal revokes delivery 24h; rights dispute 6y/180d review/delete. |
| PackPurchase | `order_id,pack_version,download_limit,successful_downloads,first_ready_at,expires_at,status`; purchase/download enforcement; owner/finance-only; D1/R2/Queue. | Active through 14d after first ready; readonly financial 7y; PDF/URL/cache delete after 14d; account deletion removes access not statutory record. Refund/chargeback/revocation stops issuance 24h; finance annual review/delete at 7y. |

## 6.2 Other processing categories: exact contracts

| Category | Exact lifecycle, copies, rights and exception |
|---|---|
| Browser-local summary | Summary only: score, completion/expiry and ≤5 wrong-question IDs; localStorage only, no server copy unless a separate account action submits it. TTL 30d after local completion; browser clear removes it. No server DSAR; no payment/refund exception. |
| Identity/session | Identifier/auth state; D1 session plus edge cache; active session, revoked on logout/password/account deletion immediately, cache purge 24h; session record delete 30d after invalidation. DSAR export; security login outcome 1y, quarterly review/delete. |
| AI prompt/output/provider reference | D1 transient + Queue + provider request; D+30 product copies, Queue/cache 24h, provider deletion request at same event. No training/retention/ZDR evidence means feature stays disabled. DSAR/export/delete applies; minimal outcome D+90, quarterly review/delete. |
| Analytics event | Initial/reject/accept consent state is separately recorded; reject deletes/purges non-essential event/cookie/localStorage immediately; accepted event D+13 months then delete. Opt-out is immediate; no refund effect; security-only delivery telemetry 30d, weekly review/delete. |
| Consent record | `consent version,state,timestamp,region`; D1, no R2; active until change, readonly 13 months, delete D+13 months; DSAR export; withdrawal stops non-essential collection immediately; legal proof 13 months then delete. |
| Cloudflare beacon observation | Capture inventory metadata only (domain/script/time/consent-state), not user payload; D+30, cache 24h; opt-out blocks non-essential beacon; no refund exception; security telemetry 30d then delete. |
| Support email/case | Email body/case D1/provider mailbox; active to closure, readonly 180d, delete body/attachments D+180 and cache/Queue 24h. DSAR/export/delete; refund case may retain transaction reference 7y; legal dispute metadata 7y, finance/legal annual review/delete. |
| PDF/export artefact | R2 PDF/manifest; ready 14d from first ready, then R2/URL/cache delete; Queue 24h. DSAR/cancel/account delete/refund/withdrawal revoke 24h; financial link only 7y. |
| Signed URL | URL token metadata, no content; valid 14d from first ready, immediate revoke on listed events; delete metadata at terminal/14d, cache 24h. DSAR description only; security misuse event 1y/quarterly review/delete. |
| Payment/transaction/entitlement record | Disabled while `not_configured`; once live D1 processor reference only, never credentials; terminal financial record 7y, cache/Queue 24h. DSAR; refund/chargeback changes entitlement immediately but not statutory record; finance/legal annual review/delete at 7y. |

## 6.3 Provider evidence and deployment defaults (accessed 2026-08-12 UTC)

`HTTP evidence status` means public-page availability only; it is not account acceptance. Current code/network fact: this review did **not** rerun a three-state browser capture; historical observation may not be treated as current activation. Before Production Launch, new-visitor Initial/Reject/Accept capture must inventory `document.scripts`, performance domains, cookies, localStorage and runtime objects; actual domains include/shall separately classify Cloudflare beacon and `plausible.shipsolo.io` if observed. GSC/Bing are webmaster tools, not visitor analytics.

| Provider/category | Official URL; HTTP/public evidence | Unique default; DPA/training/retention/ZDR/cross-border/deletion status | Alternative risk; product/account setting; gate |
|---|---|---|---|
| Cloudflare CDN/security | https://www.cloudflare.com/cloudflare-customer-dpa/ ; HTTP public page accessed 2026-08-12 | Use CDN/security only. DPA public; no-training N/A; retention/ZDR/transfer/deletion tenant settings unverified. | Web Analytics beacon is not silently essential; delivery account/endpoint setting must be verified. Production NO-GO. |
| Cloudflare Web Analytics | https://www.cloudflare.com/web-analytics/ ; HTTP public page accessed 2026-08-12 | Default off until three-state evidence and consent classification. DPA public; training N/A; retention/ZDR/transfer/deletion unverified for tenant. | Treating beacon as essential risks invalid consent. Production NO-GO. |
| Plausible endpoint/operator | https://plausible.io/data-policy ; HTTP public page accessed 2026-08-12 | Default off; `plausible.shipsolo.io` only after operator/controller/DPA/retention/deletion/transfer record. Training N/A; ZDR unverified. | Public policy does not prove custom endpoint configuration. Production NO-GO. |
| GSC | https://support.google.com/webmasters/ ; HTTP public page accessed 2026-08-12 | Webmaster-console only; no visitor script. DPA/training/ZDR N/A to user analytics; account retention/transfer/deletion unverified. | Calling it behavioral analytics misstates consent. Production NO-GO for visitor script. |
| Bing | https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a ; HTTP public page accessed 2026-08-12 | Webmaster-console only; no visitor script; same evidence limits. | Same classification error. Production NO-GO for visitor script. |
| Auth | No provider selected; no official provider evidence | Default: account feature off. DPA/no-training/retention/ZDR/transfer/deletion all unknown because no account/endpoint. | Naming a provider without selection falsifies notice. Implementation NO-GO. |
| Cloudflare D1/database | https://developers.cloudflare.com/d1/ ; HTTP public docs accessed 2026-08-12 | Default: do not create personal-data D1 until account region/DPA/retention/deletion/transfer settings recorded; training N/A; ZDR unverified. | Docs do not prove tenant controls. Implementation NO-GO. |
| Cloudflare R2/storage/export | https://developers.cloudflare.com/r2/ ; HTTP public docs accessed 2026-08-12 | Default: R2 personal/PDF storage off until signed-URL/deletion/region controls recorded; training N/A; ZDR unverified. | Link/object exposure. Implementation NO-GO. |
| Email | No provider selected; no official provider evidence | Default: no transactional/marketing provider; support mailbox only. DPA/training/retention/ZDR/transfer/deletion unknown. | Unverified processor notice. Implementation NO-GO. |
| AI | https://openai.com/api/pricing/ ; HTTP public cost evidence accessed 2026-08-12 | Default AI off. It is cost evidence only; DPA/no-training/retention/ZDR/transfer/deletion/provider endpoint/account setting unverified. | Cost page cannot prove safeguards. Implementation NO-GO. |
| Audio licensor | No selected licensor/official evidence | Default no audio delivery except manifest-authorised right. DPA/training/ZDR N/A; licence retention/transfer/deletion unverified. | Copyright/cache/offline withdrawal risk. Implementation and P2 Payment NO-GO. |
| Payment | No processor selected/official evidence | Default `not_configured`; no checkout. DPA/training/ZDR N/A; processor retention/transfer/deletion unknown. | Capability may not support subscription/webhook/cancel/refund/reconciliation. Payment NO-GO. |
| PDF/export processing | No processor selected/official evidence | Default export generation off until product/endpoint, DPA/training/retention/ZDR/transfer/deletion and URL revocation test recorded. | Export disclosure/revoked rights risk. Implementation and P2 Payment NO-GO. |

## 7. Four-layer decision

| Layer | Decision | Meaning |
|---|---|---|
| Document | **GO — STAGE04 DOCUMENT ONLY** | F1–F10 documentary controls and validation are closed. |
| Implementation | **NO-GO** | No implementation evidence for the required controls. |
| Production Launch | **NO-GO** | No production legal/provider/analytics/rights acceptance evidence. |
| Payment Live | **NO-GO** | No processor, commercial activation, checkout, tax, cancellation/refund or reconciliation proof. |

P2 rule: when all relevant hard controls are closed, perform open-purchase acceptance (order/payment/entitlement separation; success/cancel/processing/failure; 3 downloads/14 days; expiry/revocation; candidate refund eligibility; reconciliation and price display) before opening purchase. This does not make P2 a P1 entitlement.

## 8. Owner decisions — single confirmation or veto per item

Confirmed inputs and observed facts in §§1–2 are not repeated here.

| ID | Single decision | Unique recommended default and reason | Owner operation / alternative risk |
|---|---|---|---|
| O1 | Operator legal identity | Do not publish or activate account/payment until legal operator identity is supplied; no fact was found in canonical PRD/pricing/current report. | **确认该默认 / 否决并提供替代。** Inventing identity makes notice false. |
| O2 | Trading name | Use only the confirmed product name `HSKKit`; do not represent it as a registered trade name without evidence. | **确认该默认 / 否决并提供替代。** Unsupported trade-name claim risks consumer confusion. |
| O3 | Service-address display | Do not publish an address until operator’s legally required service address is supplied. | **确认该默认 / 否决并提供替代。** A fabricated or incomplete address invalidates contact disclosure. |
| O4 | Governing law/jurisdiction | Do not select a law/forum in public terms until operator jurisdiction is supplied; preserve mandatory consumer law. | **确认该默认 / 否决并提供替代。** Premature choice can be unenforceable. |
| O5 | Audience boundary | Adult/general learner only; exclude child and teacher/school-managed accounts pending specialist review. | **确认该默认 / 否决并提供替代。** Inclusion expands child/education compliance risk. |
| O6 | Cloudflare CDN/security | Confirm §6.3 default: CDN/security only, with tenant controls recorded before production. | **确认该默认 / 否决并提供替代。** Other deployment creates unverified transfer/retention risk. |
| O7 | Cloudflare Web Analytics | Confirm §6.3 default: off until three-state consent evidence. | **确认该默认 / 否决并提供替代。** Pre-consent beacon can invalidate consent. |
| O8 | Plausible endpoint/operator | Confirm §6.3 default: off until the named operator and controls are evidenced. | **确认该默认 / 否决并提供替代。** Custom endpoint policy may not cover tenant handling. |
| O9 | GSC | Confirm §6.3 default: webmaster console only, no visitor script. | **确认该默认 / 否决并提供替代。** Behavioral-analytics classification would be false. |
| O10 | Bing | Confirm §6.3 default: webmaster console only, no visitor script. | **确认该默认 / 否决并提供替代。** Behavioral-analytics classification would be false. |
| O11 | Auth | Confirm §6.3 default: account feature off. | **确认该默认 / 否决并提供替代。** Naming an unselected provider falsifies legal notice. |
| O12 | D1/database | Confirm §6.3 default: no personal-data D1 until tenant controls are recorded. | **确认该默认 / 否决并提供替代。** Docs do not prove tenant safeguards. |
| O13 | R2/storage/export | Confirm §6.3 default: personal/PDF R2 storage off. | **确认该默认 / 否决并提供替代。** Object/link exposure risk. |
| O14 | Email | Confirm §6.3 default: no transactional/marketing provider. | **确认该默认 / 否决并提供替代。** Unverified processor disclosure risk. |
| O15 | AI | Confirm §6.3 default: AI off. | **确认该默认 / 否决并提供替代。** Cost evidence does not prove data safeguards. |
| O16 | Audio licensor | Confirm §6.3 default: no delivery beyond manifest-authorised rights. | **确认该默认 / 否决并提供替代。** Copyright/cache/withdrawal risk. |
| O17 | Payment | Confirm §6.3 default: `not_configured`, no checkout. | **确认该默认 / 否决并提供替代。** Capability may not support required consumer controls. |
| O18 | PDF/export processing | Confirm §6.3 default: export generation off. | **确认该默认 / 否决并提供替代。** Revoked-rights/data disclosure risk. |
| O19 | P2 rights release | No audio/PDF/offline delivery without asset licence manifest and open-purchase acceptance. | **确认该默认 / 否决并提供替代。** Affected asset remains blocked, not removed from PRD scope. |

## 9. Six-page user-visible legal-page deltas and route contract

**Effective-date rule for all six pages:** display `Effective date: [insert actual publication date at release]` at publication; do not predate it. This is an implementation instruction, not released user text. Footer links must appear on every public route and authenticated layout after implemented. Support: `support@hskkit.com`.

### 9.1 Privacy Policy — canonical `/privacy-policy`

Existing `/privacy-policy` remains canonical; no alias. Insert after its opening summary:

> We process learning, account and session information if enabled, export/deletion requests, support messages, and limited operational records only for the learning, rights, security, support, export, or payment purpose described here. Account provider, AI, transactional email, payment, and PDF/export features remain off until their provider and safeguards are documented and enabled. Exported PDF files and signed URLs expire 14 days after first ready and are revoked within 24 hours after cancellation, account deletion, rights withdrawal, approved refund, or access revocation. AI product copies are deleted after 30 days; support bodies and attachments after 180 days; minimum transaction or entitlement records for accounting, tax, fraud, or disputes after up to 7 years. We do not store card or bank credentials. Request access, export, correction where available, deletion, or assistance at support@hskkit.com. Minimum records may be retained only for legal, security, accounting, tax, or dispute obligations and are deleted at the end of the stated period.

### 9.2 Terms of Service — canonical `/terms-of-service`

Existing `/terms-of-service` remains canonical; no alias. Insert after service/access terms:

> HSKKit is a learning tool. Content availability, scores, plans, and AI explanations are not official examination results, professional advice, or a promise of an outcome. Do not bypass access controls, use another account, redistribute controlled content, submit unlawful material, or infringe rights. Paid features are unavailable until payment is enabled. A subscriber may request cancellation at any time at support@hskkit.com. Cancellation stops automatic renewal at the end of the current paid billing period unless an approved immediate refund, chargeback outcome, or mandatory law creates an earlier end. Entitlement can be revoked after refund, chargeback, rights withdrawal, account deletion, or security action. Mandatory consumer rights remain unaffected.

### 9.3 Cookie Policy — canonical `/cookie-policy`

New canonical route. If `/cookies` is implemented, redirect it to `/cookie-policy` with HTTP **308**. Create page:

> HSKKit uses strictly necessary delivery and security technology. Non-essential analytics is off unless the required consent configuration and evidence are in place. Cloudflare delivery/security telemetry is distinct from visitor analytics. Google Search Console and Bing Webmaster Tools are webmaster-console services, not visitor behavior analytics. Before non-essential analytics is enabled, the site presents the applicable consent choice and records it. Rejecting non-essential technology stops it immediately. Consent records and accepted analytics events are deleted after 13 months. This page identifies deployed technology before activation.

### 9.4 Refund and Cancellation Policy — canonical `/refund-policy`

New canonical route. If `/refunds` is implemented, redirect it to `/refund-policy` with HTTP **308**. Create page:

> Email support@hskkit.com with account email, plan or order reference, purchase date, request type, and short reason. We confirm receipt within 2 UTC calendar days, complete manual review within 5 UTC calendar days after receipt, and send a decision. If approved, we initiate the refund to the original payment method within 3 UTC calendar days; posting time is controlled by the payment institution. Pro cancellation is available at any time and stops automatic renewal at the end of the current paid billing period. A Pro refund request must arrive within 7 UTC calendar days after charge, use no more than 10 AI credits, and not duplicate a prior refund for that charge. For a PDF Pack, the request must arrive within 7 UTC calendar days after purchase and show zero successful downloads. A PDF Pack permits at most three successful downloads and expires 14 days after first ready. Requests outside these rules are ineligible, except where required by applicable law.

### 9.5 Disclaimer — canonical `/disclaimer`

Existing `/disclaimer` remains canonical; no alias. Replace/add body:

> HSKKit provides educational practice materials and learning tools. It is not affiliated with, endorsed by, or an official service of an examination authority unless a verified written statement identifies that relationship. Content, practice results, and AI output can contain errors or vary. Verify information against authoritative sources before relying on it for examination, education, employment, legal, medical, or financial decisions. A withdrawn asset, revoked right, unavailable provider, or disabled feature can be removed from access without a promise of a substitute.

### 9.6 AI Policy — canonical `/ai-policy`

New canonical route. If `/ai` is implemented, redirect it to `/ai-policy` with HTTP **308**. Create page:

> AI features are off until provider, model or endpoint, data-use terms, retention, deletion, cross-border safeguards, and account settings are verified. When enabled, only minimum feature context is sent. AI prompt and output product copies are deleted after 30 days; quota records after 90 days. Raw prompts and outputs are excluded from broad analytics and audit logs. AI output is generated assistance, not verified advice. Do not submit unnecessary personal data, confidential third-party information, unlawful material, or infringing material. AI output may vary and should be checked. A provider failure or timeout does not debit credits, or the debit is atomically restored.

## 10. Final audit matrix (A1–A15)

| Check | Evidence location | Result |
|---|---|---|
| A1 | §1; manifest authority/repo | PASS |
| A2 | §1, §2.2, §7 | PASS |
| A3 | §§3.1–3.2, §4, §6.1–6.2, Appendix A | PASS |
| A4 | §§6.1–6.2 | PASS |
| A5 | §§6.3, 8 | PASS |
| A6 | §§6.2–6.3, §7 | PASS |
| A7 | §2 and §9.4 | PASS |
| A8 | §9.1–§9.6 | PASS |
| A9 | §8 | PASS |
| A10 | §7 and terminal status | PASS |
| A11 | §§1, 3.1, 9; manifest | PASS |
| A12 | manifest scans | PASS |
| A13 | §11 and v1.4 auditor manifest: all three active-auditor validators rerun after final edit, exit 0 | PASS |
| A14 | §11 and v1.4 auditor manifest: workspace/cache byte identity plus delayed re-sample; artifact hashes are sealed externally in Kanban to avoid self-reference | PASS |
| A15 | §11 and v1.4 auditor manifest: ACK `10726`, PROGRESS `10729`, historical worker FINAL `10731`, and auditor closure protocol | PASS |

## Internal validator checklist (not user-visible copy)

- 必须声明非法律意见：satisfied by the scope statement and downstream handoff.
- 必须列第三方服务：satisfied by §6.3 provider evidence matrix.
- 必须有联系方式占位：satisfied by support@hskkit.com.
- 不得承诺未实现能力：satisfied by four-layer gates and UNSELECTED / FEATURE OFF controls.

## 11. Verification and delivery protocol

### 11.1 Non-circular auditor closure protocol

The v1.3 task incorrectly required an immutable FINAL message to contain its own future Telegram message ID while also predeclaring the hash of a manifest updated after that ID existed. That is a self-reference loop, not a substantive compliance defect. Owner authorized the independent auditor to repair it. The closure rule is therefore:

1. Preserve worker evidence as immutable history: ACK `10726`, PROGRESS `10729`, and worker review message `10731`.
2. Treat `10731` as the worker review handoff, not as the cryptographic seal of v1.4.
3. Store final v1.4 report and manifest hashes in the Kanban final result/comment after both files are immutable. The manifest intentionally does not contain its own SHA.
4. The auditor-delivered message may attach the sealed files or the requested downstream report; it need not contain its own future message ID.
5. Any later edit creates a new version and invalidates this seal.

This removes the impossible recursion while preserving sender, topic, message IDs, artifact identity, and an independently auditable chain. R4 and A15 are PASS under this correction protocol.

### 11.2 Skill and validator provenance

Current active Skill root actually loaded: `/root/.hermes/skills/shipsolo/.backup/2026.05.23.1-20260526194559/student-site-compliance-pipeline`. Loaded precision reference: `/root/.hermes/skills/shipsolo/.backup/2026.05.23.1-20260526194559/student-site-compliance-pipeline/references/document-go-precision-repair.md`. Task-required audit reference actually read: `/root/.hermes/profiles/dazongguan/skills/shipsolo/student-site-compliance-pipeline/references/incremental-compliance-document-go-audit.md`; this is reference-only, not this profile's active Skill. Validator paths: `/root/.hermes/skills/shipsolo/.backup/2026.05.23.1-20260526194559/student-site-compliance-pipeline/scripts/validate_compliance_docs.py`; `/root/.hermes/skills/shipsolo/.backup/2026.05.23.1-20260526194559/student-site-compliance-pipeline/scripts/validate_handoff.py`; `/root/.hermes/profiles/dazongguan/skills/shipsolo/student-site-compliance-pipeline/scripts/check_final_markdown_artifact.py`.

Appendix A is human-readable. The separate JSON manifest is machine-readable. Final SHA/bytes are deliberately excluded from this Markdown to avoid self-reference.

## Appendix A — canonical-field coverage mapping

| canonical_object.field | PRD source | v1.3 report location | status |
|---|---|---|---|
| `ContentAsset（word/sentence/character/reading/grammar/question）.id` | PRD section 11.2 core data entities | §3 object-contract row ContentAsset（word/sentence/character/reading/grammar/question）; §6.1 lifecycle row ContentAsset（word/sentence/character/reading/grammar/question） | covered |
| `ContentAsset（word/sentence/character/reading/grammar/question）.type` | PRD section 11.2 core data entities | §3 object-contract row ContentAsset（word/sentence/character/reading/grammar/question）; §6.1 lifecycle row ContentAsset（word/sentence/character/reading/grammar/question） | covered |
| `ContentAsset（word/sentence/character/reading/grammar/question）.standard_version` | PRD section 11.2 core data entities | §3 object-contract row ContentAsset（word/sentence/character/reading/grammar/question）; §6.1 lifecycle row ContentAsset（word/sentence/character/reading/grammar/question） | covered |
| `ContentAsset（word/sentence/character/reading/grammar/question）.level_band` | PRD section 11.2 core data entities | §3 object-contract row ContentAsset（word/sentence/character/reading/grammar/question）; §6.1 lifecycle row ContentAsset（word/sentence/character/reading/grammar/question） | covered |
| `ContentAsset（word/sentence/character/reading/grammar/question）.content_version` | PRD section 11.2 core data entities | §3 object-contract row ContentAsset（word/sentence/character/reading/grammar/question）; §6.1 lifecycle row ContentAsset（word/sentence/character/reading/grammar/question） | covered |
| `ContentAsset（word/sentence/character/reading/grammar/question）.source_ref` | PRD section 11.2 core data entities | §3 object-contract row ContentAsset（word/sentence/character/reading/grammar/question）; §6.1 lifecycle row ContentAsset（word/sentence/character/reading/grammar/question） | covered |
| `ContentAsset（word/sentence/character/reading/grammar/question）.license_ref` | PRD section 11.2 core data entities | §3 object-contract row ContentAsset（word/sentence/character/reading/grammar/question）; §6.1 lifecycle row ContentAsset（word/sentence/character/reading/grammar/question） | covered |
| `ContentAsset（word/sentence/character/reading/grammar/question）.qa_status` | PRD section 11.2 core data entities | §3 object-contract row ContentAsset（word/sentence/character/reading/grammar/question）; §6.1 lifecycle row ContentAsset（word/sentence/character/reading/grammar/question） | covered |
| `ContentAsset（word/sentence/character/reading/grammar/question）.publish_status` | PRD section 11.2 core data entities | §3 object-contract row ContentAsset（word/sentence/character/reading/grammar/question）; §6.1 lifecycle row ContentAsset（word/sentence/character/reading/grammar/question） | covered |
| `AudioAsset.id` | PRD section 11.2 core data entities | §3 object-contract row AudioAsset; §6.1 lifecycle row AudioAsset | covered |
| `AudioAsset.content_asset_id` | PRD section 11.2 core data entities | §3 object-contract row AudioAsset; §6.1 lifecycle row AudioAsset | covered |
| `AudioAsset.transcript` | PRD section 11.2 core data entities | §3 object-contract row AudioAsset; §6.1 lifecycle row AudioAsset | covered |
| `AudioAsset.pronunciation` | PRD section 11.2 core data entities | §3 object-contract row AudioAsset; §6.1 lifecycle row AudioAsset | covered |
| `AudioAsset.tones` | PRD section 11.2 core data entities | §3 object-contract row AudioAsset; §6.1 lifecycle row AudioAsset | covered |
| `AudioAsset.speech_rate` | PRD section 11.2 core data entities | §3 object-contract row AudioAsset; §6.1 lifecycle row AudioAsset | covered |
| `AudioAsset.voice_or_engine` | PRD section 11.2 core data entities | §3 object-contract row AudioAsset; §6.1 lifecycle row AudioAsset | covered |
| `AudioAsset.source_ref` | PRD section 11.2 core data entities | §3 object-contract row AudioAsset; §6.1 lifecycle row AudioAsset | covered |
| `AudioAsset.license_ref` | PRD section 11.2 core data entities | §3 object-contract row AudioAsset; §6.1 lifecycle row AudioAsset | covered |
| `AudioAsset.cache_right` | PRD section 11.2 core data entities | §3 object-contract row AudioAsset; §6.1 lifecycle row AudioAsset | covered |
| `AudioAsset.offline_right` | PRD section 11.2 core data entities | §3 object-contract row AudioAsset; §6.1 lifecycle row AudioAsset | covered |
| `AudioAsset.qa_status` | PRD section 11.2 core data entities | §3 object-contract row AudioAsset; §6.1 lifecycle row AudioAsset | covered |
| `AudioAsset.version` | PRD section 11.2 core data entities | §3 object-contract row AudioAsset; §6.1 lifecycle row AudioAsset | covered |
| `Mastery.owner_scope` | PRD section 11.2 core data entities | §3 object-contract row Mastery; §6.1 lifecycle row Mastery | covered |
| `Mastery.content_asset_id` | PRD section 11.2 core data entities | §3 object-contract row Mastery; §6.1 lifecycle row Mastery | covered |
| `Mastery.dimension` | PRD section 11.2 core data entities | §3 object-contract row Mastery; §6.1 lifecycle row Mastery | covered |
| `Mastery.score` | PRD section 11.2 core data entities | §3 object-contract row Mastery; §6.1 lifecycle row Mastery | covered |
| `Mastery.due_at` | PRD section 11.2 core data entities | §3 object-contract row Mastery; §6.1 lifecycle row Mastery | covered |
| `Mastery.algorithm_version` | PRD section 11.2 core data entities | §3 object-contract row Mastery; §6.1 lifecycle row Mastery | covered |
| `Mastery.revision` | PRD section 11.2 core data entities | §3 object-contract row Mastery; §6.1 lifecycle row Mastery | covered |
| `ReviewSchedule.id` | PRD section 11.2 core data entities | §3 object-contract row ReviewSchedule; §6.1 lifecycle row ReviewSchedule | covered |
| `ReviewSchedule.mastery_id` | PRD section 11.2 core data entities | §3 object-contract row ReviewSchedule; §6.1 lifecycle row ReviewSchedule | covered |
| `ReviewSchedule.grade` | PRD section 11.2 core data entities | §3 object-contract row ReviewSchedule; §6.1 lifecycle row ReviewSchedule | covered |
| `ReviewSchedule.interval` | PRD section 11.2 core data entities | §3 object-contract row ReviewSchedule; §6.1 lifecycle row ReviewSchedule | covered |
| `ReviewSchedule.due_at` | PRD section 11.2 core data entities | §3 object-contract row ReviewSchedule; §6.1 lifecycle row ReviewSchedule | covered |
| `ReviewSchedule.source_attempt_id` | PRD section 11.2 core data entities | §3 object-contract row ReviewSchedule; §6.1 lifecycle row ReviewSchedule | covered |
| `ReviewSchedule.idempotency_key` | PRD section 11.2 core data entities | §3 object-contract row ReviewSchedule; §6.1 lifecycle row ReviewSchedule | covered |
| `Attempt.id` | PRD section 11.2 core data entities | §3 object-contract row Attempt; §6.1 lifecycle row Attempt | covered |
| `Attempt.owner_scope` | PRD section 11.2 core data entities | §3 object-contract row Attempt; §6.1 lifecycle row Attempt | covered |
| `Attempt.mode` | PRD section 11.2 core data entities | §3 object-contract row Attempt; §6.1 lifecycle row Attempt | covered |
| `Attempt.skill` | PRD section 11.2 core data entities | §3 object-contract row Attempt; §6.1 lifecycle row Attempt | covered |
| `Attempt.standard_version` | PRD section 11.2 core data entities | §3 object-contract row Attempt; §6.1 lifecycle row Attempt | covered |
| `Attempt.content_version` | PRD section 11.2 core data entities | §3 object-contract row Attempt; §6.1 lifecycle row Attempt | covered |
| `Attempt.state` | PRD section 11.2 core data entities | §3 object-contract row Attempt; §6.1 lifecycle row Attempt | covered |
| `Attempt.started_at` | PRD section 11.2 core data entities | §3 object-contract row Attempt; §6.1 lifecycle row Attempt | covered |
| `Attempt.ended_at` | PRD section 11.2 core data entities | §3 object-contract row Attempt; §6.1 lifecycle row Attempt | covered |
| `Attempt.answers` | PRD section 11.2 core data entities | §3 object-contract row Attempt; §6.1 lifecycle row Attempt | covered |
| `Attempt.result` | PRD section 11.2 core data entities | §3 object-contract row Attempt; §6.1 lifecycle row Attempt | covered |
| `Attempt.timer_deadline` | PRD section 11.2 core data entities | §3 object-contract row Attempt; §6.1 lifecycle row Attempt | covered |
| `DailySession.id` | PRD section 11.2 core data entities | §3 object-contract row DailySession; §6.1 lifecycle row DailySession | covered |
| `DailySession.owner_scope` | PRD section 11.2 core data entities | §3 object-contract row DailySession; §6.1 lifecycle row DailySession | covered |
| `DailySession.local_day` | PRD section 11.2 core data entities | §3 object-contract row DailySession; §6.1 lifecycle row DailySession | covered |
| `DailySession.tz` | PRD section 11.2 core data entities | §3 object-contract row DailySession; §6.1 lifecycle row DailySession | covered |
| `DailySession.rule_version` | PRD section 11.2 core data entities | §3 object-contract row DailySession; §6.1 lifecycle row DailySession | covered |
| `DailySession.queue_snapshot` | PRD section 11.2 core data entities | §3 object-contract row DailySession; §6.1 lifecycle row DailySession | covered |
| `DailySession.state` | PRD section 11.2 core data entities | §3 object-contract row DailySession; §6.1 lifecycle row DailySession | covered |
| `DailySession.summary` | PRD section 11.2 core data entities | §3 object-contract row DailySession; §6.1 lifecycle row DailySession | covered |
| `MistakeCase.id` | PRD section 11.2 core data entities | §3 object-contract row MistakeCase; §6.1 lifecycle row MistakeCase | covered |
| `MistakeCase.attempt_id` | PRD section 11.2 core data entities | §3 object-contract row MistakeCase; §6.1 lifecycle row MistakeCase | covered |
| `MistakeCase.question_version` | PRD section 11.2 core data entities | §3 object-contract row MistakeCase; §6.1 lifecycle row MistakeCase | covered |
| `MistakeCase.status` | PRD section 11.2 core data entities | §3 object-contract row MistakeCase; §6.1 lifecycle row MistakeCase | covered |
| `MistakeCase.weakness_tag` | PRD section 11.2 core data entities | §3 object-contract row MistakeCase; §6.1 lifecycle row MistakeCase | covered |
| `MistakeCase.resolved_at` | PRD section 11.2 core data entities | §3 object-contract row MistakeCase; §6.1 lifecycle row MistakeCase | covered |
| `GuestMerge.id` | PRD section 11.2 core data entities | §3 object-contract row GuestMerge; §6.1 lifecycle row GuestMerge | covered |
| `GuestMerge.guest_scope` | PRD section 11.2 core data entities | §3 object-contract row GuestMerge; §6.1 lifecycle row GuestMerge | covered |
| `GuestMerge.user_id` | PRD section 11.2 core data entities | §3 object-contract row GuestMerge; §6.1 lifecycle row GuestMerge | covered |
| `GuestMerge.preview` | PRD section 11.2 core data entities | §3 object-contract row GuestMerge; §6.1 lifecycle row GuestMerge | covered |
| `GuestMerge.resolution` | PRD section 11.2 core data entities | §3 object-contract row GuestMerge; §6.1 lifecycle row GuestMerge | covered |
| `GuestMerge.state` | PRD section 11.2 core data entities | §3 object-contract row GuestMerge; §6.1 lifecycle row GuestMerge | covered |
| `GuestMerge.expires_at` | PRD section 11.2 core data entities | §3 object-contract row GuestMerge; §6.1 lifecycle row GuestMerge | covered |
| `SyncState.user_id` | PRD section 11.2 core data entities | §3 object-contract row SyncState; §6.1 lifecycle row SyncState | covered |
| `SyncState.server_revision` | PRD section 11.2 core data entities | §3 object-contract row SyncState; §6.1 lifecycle row SyncState | covered |
| `SyncState.device_id` | PRD section 11.2 core data entities | §3 object-contract row SyncState; §6.1 lifecycle row SyncState | covered |
| `SyncState.pending_changes` | PRD section 11.2 core data entities | §3 object-contract row SyncState; §6.1 lifecycle row SyncState | covered |
| `SyncState.conflicts` | PRD section 11.2 core data entities | §3 object-contract row SyncState; §6.1 lifecycle row SyncState | covered |
| `SyncState.resolution` | PRD section 11.2 core data entities | §3 object-contract row SyncState; §6.1 lifecycle row SyncState | covered |
| `SyncState.updated_at` | PRD section 11.2 core data entities | §3 object-contract row SyncState; §6.1 lifecycle row SyncState | covered |
| `Streak.user_id` | PRD section 11.2 core data entities | §3 object-contract row Streak; §6.1 lifecycle row Streak | covered |
| `Streak.timezone` | PRD section 11.2 core data entities | §3 object-contract row Streak; §6.1 lifecycle row Streak | covered |
| `Streak.current_count` | PRD section 11.2 core data entities | §3 object-contract row Streak; §6.1 lifecycle row Streak | covered |
| `Streak.longest_count` | PRD section 11.2 core data entities | §3 object-contract row Streak; §6.1 lifecycle row Streak | covered |
| `Streak.last_learning_day` | PRD section 11.2 core data entities | §3 object-contract row Streak; §6.1 lifecycle row Streak | covered |
| `Streak.policy_version` | PRD section 11.2 core data entities | §3 object-contract row Streak; §6.1 lifecycle row Streak | covered |
| `AccountDataRequest.id` | PRD section 11.2 core data entities | §3 object-contract row AccountDataRequest; §6.1 lifecycle row AccountDataRequest | covered |
| `AccountDataRequest.user_id` | PRD section 11.2 core data entities | §3 object-contract row AccountDataRequest; §6.1 lifecycle row AccountDataRequest | covered |
| `AccountDataRequest.type` | PRD section 11.2 core data entities | §3 object-contract row AccountDataRequest; §6.1 lifecycle row AccountDataRequest | covered |
| `AccountDataRequest.state` | PRD section 11.2 core data entities | §3 object-contract row AccountDataRequest; §6.1 lifecycle row AccountDataRequest | covered |
| `AccountDataRequest.confirmation_at` | PRD section 11.2 core data entities | §3 object-contract row AccountDataRequest; §6.1 lifecycle row AccountDataRequest | covered |
| `AccountDataRequest.requested_at` | PRD section 11.2 core data entities | §3 object-contract row AccountDataRequest; §6.1 lifecycle row AccountDataRequest | covered |
| `AccountDataRequest.completed_at` | PRD section 11.2 core data entities | §3 object-contract row AccountDataRequest; §6.1 lifecycle row AccountDataRequest | covered |
| `AccountDataRequest.expires_at` | PRD section 11.2 core data entities | §3 object-contract row AccountDataRequest; §6.1 lifecycle row AccountDataRequest | covered |
| `AccountDataRequest.failure_code` | PRD section 11.2 core data entities | §3 object-contract row AccountDataRequest; §6.1 lifecycle row AccountDataRequest | covered |
| `AccountDataRequest.retention_exceptions` | PRD section 11.2 core data entities | §3 object-contract row AccountDataRequest; §6.1 lifecycle row AccountDataRequest | covered |
| `ContentReport.id` | PRD section 11.2 core data entities | §3 object-contract row ContentReport; §6.1 lifecycle row ContentReport | covered |
| `ContentReport.reporter_scope` | PRD section 11.2 core data entities | §3 object-contract row ContentReport; §6.1 lifecycle row ContentReport | covered |
| `ContentReport.asset_id` | PRD section 11.2 core data entities | §3 object-contract row ContentReport; §6.1 lifecycle row ContentReport | covered |
| `ContentReport.asset_version` | PRD section 11.2 core data entities | §3 object-contract row ContentReport; §6.1 lifecycle row ContentReport | covered |
| `ContentReport.reason` | PRD section 11.2 core data entities | §3 object-contract row ContentReport; §6.1 lifecycle row ContentReport | covered |
| `ContentReport.state` | PRD section 11.2 core data entities | §3 object-contract row ContentReport; §6.1 lifecycle row ContentReport | covered |
| `ContentReport.resolution` | PRD section 11.2 core data entities | §3 object-contract row ContentReport; §6.1 lifecycle row ContentReport | covered |
| `ContentReport.created_at` | PRD section 11.2 core data entities | §3 object-contract row ContentReport; §6.1 lifecycle row ContentReport | covered |
| `Entitlement.id` | PRD section 11.2 core data entities | §3 object-contract row Entitlement; §6.1 lifecycle row Entitlement | covered |
| `Entitlement.user_id` | PRD section 11.2 core data entities | §3 object-contract row Entitlement; §6.1 lifecycle row Entitlement | covered |
| `Entitlement.capability` | PRD section 11.2 core data entities | §3 object-contract row Entitlement; §6.1 lifecycle row Entitlement | covered |
| `Entitlement.source` | PRD section 11.2 core data entities | §3 object-contract row Entitlement; §6.1 lifecycle row Entitlement | covered |
| `Entitlement.starts_at` | PRD section 11.2 core data entities | §3 object-contract row Entitlement; §6.1 lifecycle row Entitlement | covered |
| `Entitlement.ends_at` | PRD section 11.2 core data entities | §3 object-contract row Entitlement; §6.1 lifecycle row Entitlement | covered |
| `Entitlement.status` | PRD section 11.2 core data entities | §3 object-contract row Entitlement; §6.1 lifecycle row Entitlement | covered |
| `Entitlement.config_version` | PRD section 11.2 core data entities | §3 object-contract row Entitlement; §6.1 lifecycle row Entitlement | covered |
| `AssetManifest.id` | PRD section 11.2 core data entities | §3 object-contract row AssetManifest; §6.1 lifecycle row AssetManifest | covered |
| `AssetManifest.asset_ids` | PRD section 11.2 core data entities | §3 object-contract row AssetManifest; §6.1 lifecycle row AssetManifest | covered |
| `AssetManifest.asset_versions` | PRD section 11.2 core data entities | §3 object-contract row AssetManifest; §6.1 lifecycle row AssetManifest | covered |
| `AssetManifest.rights_snapshot` | PRD section 11.2 core data entities | §3 object-contract row AssetManifest; §6.1 lifecycle row AssetManifest | covered |
| `AssetManifest.state` | PRD section 11.2 core data entities | §3 object-contract row AssetManifest; §6.1 lifecycle row AssetManifest | covered |
| `AssetManifest.created_at` | PRD section 11.2 core data entities | §3 object-contract row AssetManifest; §6.1 lifecycle row AssetManifest | covered |
| `Plan.id` | PRD section 11.2 core data entities | §3 object-contract row Plan; §6.1 lifecycle row Plan | covered |
| `Plan.owner_scope` | PRD section 11.2 core data entities | §3 object-contract row Plan; §6.1 lifecycle row Plan | covered |
| `Plan.goal` | PRD section 11.2 core data entities | §3 object-contract row Plan; §6.1 lifecycle row Plan | covered |
| `Plan.available_time` | PRD section 11.2 core data entities | §3 object-contract row Plan; §6.1 lifecycle row Plan | covered |
| `Plan.target_date` | PRD section 11.2 core data entities | §3 object-contract row Plan; §6.1 lifecycle row Plan | covered |
| `Plan.plan_version` | PRD section 11.2 core data entities | §3 object-contract row Plan; §6.1 lifecycle row Plan | covered |
| `Plan.items` | PRD section 11.2 core data entities | §3 object-contract row Plan; §6.1 lifecycle row Plan | covered |
| `Plan.state` | PRD section 11.2 core data entities | §3 object-contract row Plan; §6.1 lifecycle row Plan | covered |
| `Plan.overload_reason` | PRD section 11.2 core data entities | §3 object-contract row Plan; §6.1 lifecycle row Plan | covered |
| `AIRequest.id` | PRD section 11.2 core data entities | §3 object-contract row AIRequest; §6.1 lifecycle row AIRequest | covered |
| `AIRequest.owner_scope` | PRD section 11.2 core data entities | §3 object-contract row AIRequest; §6.1 lifecycle row AIRequest | covered |
| `AIRequest.feature` | PRD section 11.2 core data entities | §3 object-contract row AIRequest; §6.1 lifecycle row AIRequest | covered |
| `AIRequest.input_scope` | PRD section 11.2 core data entities | §3 object-contract row AIRequest; §6.1 lifecycle row AIRequest | covered |
| `AIRequest.quota_cost` | PRD section 11.2 core data entities | §3 object-contract row AIRequest; §6.1 lifecycle row AIRequest | covered |
| `AIRequest.status` | PRD section 11.2 core data entities | §3 object-contract row AIRequest; §6.1 lifecycle row AIRequest | covered |
| `AIRequest.audit_id` | PRD section 11.2 core data entities | §3 object-contract row AIRequest; §6.1 lifecycle row AIRequest | covered |
| `QuotaLedger.id` | PRD section 11.2 core data entities | §3 object-contract row QuotaLedger; §6.1 lifecycle row QuotaLedger | covered |
| `QuotaLedger.owner_scope` | PRD section 11.2 core data entities | §3 object-contract row QuotaLedger; §6.1 lifecycle row QuotaLedger | covered |
| `QuotaLedger.feature` | PRD section 11.2 core data entities | §3 object-contract row QuotaLedger; §6.1 lifecycle row QuotaLedger | covered |
| `QuotaLedger.period` | PRD section 11.2 core data entities | §3 object-contract row QuotaLedger; §6.1 lifecycle row QuotaLedger | covered |
| `QuotaLedger.limit` | PRD section 11.2 core data entities | §3 object-contract row QuotaLedger; §6.1 lifecycle row QuotaLedger | covered |
| `QuotaLedger.used` | PRD section 11.2 core data entities | §3 object-contract row QuotaLedger; §6.1 lifecycle row QuotaLedger | covered |
| `QuotaLedger.revision` | PRD section 11.2 core data entities | §3 object-contract row QuotaLedger; §6.1 lifecycle row QuotaLedger | covered |
| `AccessPolicy.id` | PRD section 11.2 core data entities | §3 object-contract row AccessPolicy; §6.1 lifecycle row AccessPolicy | covered |
| `AccessPolicy.resource_type` | PRD section 11.2 core data entities | §3 object-contract row AccessPolicy; §6.1 lifecycle row AccessPolicy | covered |
| `AccessPolicy.actor_scope` | PRD section 11.2 core data entities | §3 object-contract row AccessPolicy; §6.1 lifecycle row AccessPolicy | covered |
| `AccessPolicy.action` | PRD section 11.2 core data entities | §3 object-contract row AccessPolicy; §6.1 lifecycle row AccessPolicy | covered |
| `AccessPolicy.effect` | PRD section 11.2 core data entities | §3 object-contract row AccessPolicy; §6.1 lifecycle row AccessPolicy | covered |
| `AccessPolicy.revision` | PRD section 11.2 core data entities | §3 object-contract row AccessPolicy; §6.1 lifecycle row AccessPolicy | covered |
| `AuditEvent.id` | PRD section 11.2 core data entities | §3 object-contract row AuditEvent; §6.1 lifecycle row AuditEvent | covered |
| `AuditEvent.actor_scope` | PRD section 11.2 core data entities | §3 object-contract row AuditEvent; §6.1 lifecycle row AuditEvent | covered |
| `AuditEvent.action` | PRD section 11.2 core data entities | §3 object-contract row AuditEvent; §6.1 lifecycle row AuditEvent | covered |
| `AuditEvent.resource_type` | PRD section 11.2 core data entities | §3 object-contract row AuditEvent; §6.1 lifecycle row AuditEvent | covered |
| `AuditEvent.result` | PRD section 11.2 core data entities | §3 object-contract row AuditEvent; §6.1 lifecycle row AuditEvent | covered |
| `AuditEvent.created_at` | PRD section 11.2 core data entities | §3 object-contract row AuditEvent; §6.1 lifecycle row AuditEvent | covered |
| `OrderDraft.id` | PRD section 11.2 core data entities | §3 object-contract row OrderDraft; §6.1 lifecycle row OrderDraft | covered |
| `OrderDraft.owner_scope` | PRD section 11.2 core data entities | §3 object-contract row OrderDraft; §6.1 lifecycle row OrderDraft | covered |
| `OrderDraft.plan_ref` | PRD section 11.2 core data entities | §3 object-contract row OrderDraft; §6.1 lifecycle row OrderDraft | covered |
| `OrderDraft.status` | PRD section 11.2 core data entities | §3 object-contract row OrderDraft; §6.1 lifecycle row OrderDraft | covered |
| `OrderDraft.config_version` | PRD section 11.2 core data entities | §3 object-contract row OrderDraft; §6.1 lifecycle row OrderDraft | covered |
| `ExportJob.id` | PRD section 11.2 core data entities | §3 object-contract row ExportJob; §6.1 lifecycle row ExportJob | covered |
| `ExportJob.user_id` | PRD section 11.2 core data entities | §3 object-contract row ExportJob; §6.1 lifecycle row ExportJob | covered |
| `ExportJob.selection_manifest` | PRD section 11.2 core data entities | §3 object-contract row ExportJob; §6.1 lifecycle row ExportJob | covered |
| `ExportJob.asset_versions` | PRD section 11.2 core data entities | §3 object-contract row ExportJob; §6.1 lifecycle row ExportJob | covered |
| `ExportJob.state` | PRD section 11.2 core data entities | §3 object-contract row ExportJob; §6.1 lifecycle row ExportJob | covered |
| `ExportJob.expires_at` | PRD section 11.2 core data entities | §3 object-contract row ExportJob; §6.1 lifecycle row ExportJob | covered |
| `ExportJob.failure_code` | PRD section 11.2 core data entities | §3 object-contract row ExportJob; §6.1 lifecycle row ExportJob | covered |

## 交付物

- Report workspace/cache: `/root/.hermes/profiles/hegui/workspace/HSKKIT_PRD_v4_0_COMPLIANCE_ADDENDUM_v1_3.md` and `/root/.hermes/profiles/hegui/cache/documents/HSKKIT_PRD_v4_0_COMPLIANCE_ADDENDUM_v1_3.md`.
- Manifest workspace/cache: corresponding `_VERIFICATION.json` paths.

## 验收清单

- [x] R1: 161-field machine-recomputable inventory; missing=0; duplicate ambiguity=0.
- [x] R2: fixed cancellation/refund and separate PDF Pack contract.
- [x] R3: six self-contained legal-page deltas and route contract.
- [x] R4: non-circular auditor closure preserves ACK/PROGRESS/review message IDs and seals final hashes in Kanban after artifact finalization.

## 下游交接

This is compliance/financial-controls drafting evidence, not formal legal, tax, or provider advice. Stage04 Document is independently approved. Implementation, Production Launch and Payment Live remain NO-GO. Stage05 may begin only after Owner explicitly confirms progression; this document does not dispatch it.

[DONE]
