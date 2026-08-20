# HSKKit Stage05 — Sitewide Copy & SEO-Copy Freeze v1.3

- Status: `READY_FOR_INDEPENDENT_REVIEW`
- Closure authority: Owner-authorized direct auditor repair on 2026-08-12; v1.0 remains an immutable historical baseline and is not a downstream source.
- Scope: copy, route/SEO contracts, user-facing states, field/interaction authority, legal deltas and design handoff. This is a document candidate only: it does not authorize implementation, deployment, provider selection, payment, purchase, or Stage06.
- Sole review source: this exact v1.3 file. v1.1 is historical evidence only. Do not use v1.0 or oral interpretation to fill a missing field/state.

## 1. Authority, evidence and non-negotiable boundary

|Priority|Input|SHA-256|Use|
|-|-|-|-|
|1|`/root/projects/hskkit/docs/product/HSKKit-PRD-v4.0-owner-review.md`|`09b5b7b8a372fedd6f472368381187bf4ed71818a6316200b266640b02f29688`|Target routes, API, entities, states and acceptance|
|2|`/root/projects/hskkit/docs/pricing/hskkit-pricing-report-v40-owner-review.md`|`1cad5f9c79477de89838918a9b3ee45acdf4a24226e6de3c6400624ac782362e`|Candidate commercial caps and feature-off boundary|
|3|`/root/.hermes/profiles/dazongguan/cache/documents/HSKKIT_PRD_v4_0_COMPLIANCE_ADDENDUM_v1_4_AUDITOR_CLOSURE.md`|`b34c9168f1594e8bb057da32190865c65812d098bf9143dbe763388dc83d02be`|Legal routes, lifecycle and provider/payment gates|
|4|Current source and live capture dated 2026-08-12|Current only|Existing pages, sitemap and observed DOM facts; never Target proof|

Shared boundary text for any planned surface: **This option is planned. It is not available until the required product, rights, commercial and technical checks are complete.**

Current facts do not prove Target release. Payment is `not_configured`; checkout creates no order. Account, AI, audio delivery, exports and PDF purchase remain feature-off unless independently implemented and verified. Product direction includes Levels 1–9, but this is not a claim that all training is available.

### 1.1 Skill and review provenance

This repair reads the loaded copywriting skill plus the review references actually available at `/root/.hermes/profiles/dazongguan/skills/shipsolo/site-copywriting-student/references/route-interaction-authority-review.md`, `seo-copy-freeze-independent-review.md`, and `stage-gated-copy-dispatch.md`. Final structural evidence uses the non-backup validator paths under `/root/.hermes/profiles/dazongguan/skills/shipsolo/site-copywriting-student/scripts/`. No claim is made that a script substitutes for the route, field, cross-page or independent-review gate.

## 2. Current → Target evidence and single route authority matrix

### 2.1 Current source inventory

Current source has 22 `page.tsx` routes: `/`, `/contact`, `/disclaimer`, `/hsk-level-test`, `/hsk-levels`, `/new-hsk-3-0`, `/privacy-policy`, `/terms-of-service`, `/worksheet`, `/tools/chinese-character-practice-sheet-generator`, six vocabulary routes, five practice routes, and one reading route. Current sitemap source lists 20 `<loc>` candidates; robots allows `/` and names `https://hskkit.com/sitemap.xml`. This inventory is a baseline, not a Target approval.

|Public candidate / sample|Current HTTP / DOM canonical / robots / sitemap / H1|Target canonical, index and sitemap condition|Search intent and current-to-target action|
|-|-|-|-|
|`/`|200 / `https://hskkit.com` / no explicit robots / yes / Prepare for the HSK…|self / index / include when implemented|Keep intent; rewrite home|
|`/levels (current `/hsk-levels`)`|200 current alias / `https://hskkit.com/hsk-levels` / no explicit robots / current alias yes / HSK levels explained…|`/levels` self / index / include only after route migration|Rewrite; map legacy route deliberately|
|`/hsk-3-0 (current `/new-hsk-3-0`)`|200 current alias / `https://hskkit.com/new-hsk-3-0` / no explicit robots / yes / New HSK 3.0 context…|`/hsk-3-0` self / index / include after migration|Preserve intent; no silent canonical|
|`/hsk-2-0-vs-3-0`|404 template / root canonical / noindex / absent / 404|self / index / include after substantive guide exists|New approved guide; current 404 is template evidence only|
|`/vocabulary/:level (sample `/vocabulary/1`)`|404 template / root canonical / noindex / absent / 404|self / index only with published, minimum-quality content|Map existing level pages after data contract|
|`/word/:slug (sample `/word/sample`)`|404 template / root canonical / noindex / absent / 404|self / index only with verified word fields|New approved detail route|
|`/dictionary`|404 template / root canonical / noindex / absent / 404|self / index / include after real search exists|New approved public search route|
|`/character/:hanzi (sample encoded `/%E4%BD%A0`)`|Current sample not deployed; no Target inference|self / index only with required character fields; true 404 otherwise|New approved detail route|
|`/grammar/:slug (sample `/grammar/sample`)`|404 template / root canonical / noindex / absent / 404|self / index only with task, example and action|New approved content route|
|`/reading/:slug (sample `/reading/sample`)`|404 template / root canonical / noindex / absent / 404|self / index only with full reading task|Map current reading only after contract|
|`/placement (current `/hsk-level-test`)`|404 target sample / root canonical / noindex / absent / 404; current alias 200|self / public entry; index condition is implementation/SEO review; result noindex|Rewrite entry; do not call current check the target contract|
|`/placement/result/:id`|No valid public sample; private result must not be probed as public|self / private noindex / exclude|Authorized private result|
|`/practice/:level/:skill (sample `/practice/1/vocabulary`)`|404 template / root canonical / noindex / absent / 404|public entry self-canonical; index decision follows implementation SEO review; attempt/result private noindex|Public entry and private attempt are distinct|
|`/mock/:band (sample `/mock/1`)`|404 template / root canonical / noindex / absent / 404|public entry self-canonical; attempt/result private noindex|Public entry and private attempt are distinct|
|`/pricing`|404 template / root canonical / noindex / absent / 404|self / public index / include when page is implemented; checkout noindex|New approved public SEO route, never a checkout claim|
|`/checkout/*`|No current route sample|self / noindex / exclude|Private commercial flow only after approval|
|`/today`, `/review`, `/mistakes`, `/listen*`, `/planner`, `/account*`, `/exports`, `/pdf-packs`|No current target routes|self / private or controlled noindex / exclude|Approved task surfaces, not public sitemap pages|
|`/privacy-policy`|200 / self / no explicit robots / yes / Privacy Policy|self / index / include after delta implemented|Keep canonical|
|`/terms-of-service`|200 / self / no explicit robots / yes / Terms of Service|self / index / include after delta implemented|Keep canonical|
|`/disclaimer`|200 / self / no explicit robots / yes / Disclaimer|self / index / include after delta implemented|Keep canonical|
|`/cookie-policy`, `/refund-policy`, `/ai-policy`|404 template / root canonical / noindex / absent / 404|each self / index / include only when implemented|New Stage04 canonical legal routes; aliases only as specified|

The only Target public/index candidates are the substantive guides, qualified content/detail/search pages, public entry pages once implementation quality supports indexation, `/pricing`, and the six legal routes. Private results, attempts, account/learning records, controlled media, exports and checkout are excluded. A 404 page root canonical is recorded only as current template evidence, never as a Target canonical.

## 3. Public SEO-Copy Freeze

|Route|Title / meta|H1 / mandatory H2|SEO, schema and CTA contract|
|-|-|-|-|
|`/`|HSK 3.0 Learning Path: Placement, Vocabulary and Practice — HSKKit / Choose a starting point, study by level, and return to the next useful learning task.|Build your HSK 3.0 learning path / Make today’s next step clear; Learn by HSK 3.0 level; Use the tool that matches your task|700–900 words; WebSite; SearchAction only after real dictionary search; CTA Find your starting point or Explore levels|
|`/levels`|HSK 3.0 Levels Explained for Chinese Learners — HSKKit / Understand the HSK 3.0 learning structure and choose a practical starting point.|HSK 3.0 levels, explained for learners / How levels guide study; Choose a starting point; Level 7–9 uses one advanced path|900–1,200; BreadcrumbList; link placement and published vocabulary only|
|`/hsk-3-0`|What Is HSK 3.0? A Learner’s Guide — HSKKit / A plain-language guide to the framework and study routine.|Understand the HSK 3.0 learning framework / Levels and learning tasks; Use one standard at a time|1,000–1,400; Article + BreadcrumbList; no examination-authority claim|
|`/hsk-2-0-vs-3-0`|HSK 2.0 and HSK 3.0: Study Planning Differences — HSKKit / Keep a study plan aligned with one standard at a time.|HSK 2.0 and HSK 3.0: plan with one standard at a time / Why the frameworks should not be mixed|900–1,200; Article; no policy-authority claim|
|`/vocabulary/:level`|HSK [Level] Vocabulary: Published Study Words — HSKKit / Browse published words with meaning, pronunciation and availability.|HSK [Level] vocabulary / Words available for study; Check pronunciation and example; Report a content issue|600+ plus verified data; DefinedTermSet only with data; Add to today only when implemented|
|`/word/:slug`|[Word] Meaning, Pronunciation and HSK Level — HSKKit / [Word] with verified study availability.|[Word] / Meaning and pronunciation; Example in context; Study availability; Related words|350+ plus verified fields; DefinedTerm; audio control must show actual state|
|`/dictionary`|Chinese Dictionary by Hanzi, Pinyin or English — HSKKit / Search published words and characters.|Search Chinese words and characters / Search by Hanzi, Pinyin or English; Browse by level; No matching result|500–700; SearchAction only with real query; CTA Search|
|`/character/:hanzi`|[Character] Meaning, Pinyin and Related Words — HSKKit / Explore published character details.|[Character] / Pronunciation and meaning; Character details; Related published words|300+ verified fields; DefinedTerm; true 404 for missing minimum fields|
|`/grammar/:slug`|[Topic] Chinese Grammar Guide and Practice — HSKKit / Learn with level, examples and a related task.|[Topic] Chinese grammar / When to use it; Examples; Try a related task|700–1,000; Article; never index an empty template|
|`/reading/:slug`|[Title]: Chinese Reading Practice for HSK [Level] — HSKKit / Read with level context and support vocabulary.|[Title] / Read the passage; Words to notice; Check understanding; Continue practice|600–1,000; Article; target vocabulary must occur in the text|
|`/placement`|HSK Placement: Find a Study Starting Point — HSKKit / Use available questions to choose a learning next step.|Find a practical starting point / What this suggestion means; Choose your next learning step|Public entry; no certification schema; CTA Start placement; result private noindex|
|`/practice/:level/:skill`|HSK [Level] [Skill] Practice — HSKKit / Work through available questions and review missed items when available.|[Skill] practice for HSK [Level] / Work through questions; Understand feedback; Continue learning|Public entry; no result schema; CTA Start practice; attempt/result private noindex|
|`/mock/:band`|HSK [Band] Mock Practice — HSKKit / A timed practice path when its required checks are complete.|HSK [Band] mock practice / What is available; When a timed attempt opens|Public entry; noindex only for attempt/result; CTA Use skill practice when unavailable|
|`/pricing`|HSKKit Study Options: Free Learning and Planned Options — HSKKit / Understand the free learning path and the status of planned study options.|Study options / Start with free learning; What remains planned; Questions about availability|650–900; public/index when implemented; no Product/Offer schema before commercial approval; CTA Continue with free learning|
|Legal routes|Route-specific legal titles and supplied Stage04 body|Route-specific legal H1; Effective date placeholder at release|Index when implemented; footer links all six routes; no sales schema|

### 3.1 `/pricing` public copy block

H1: **Study options**

Lead: **Core browsing, basic learning and placement stay on the free learning path. Additional study options are planned and cannot be selected or purchased until the required checks are complete.**

H2: **Start with free learning** — Browse published study material, use available basic learning activities, and use placement as a learning suggestion. CTA: **Continue with free learning**.

H2: **What remains planned** — Candidate monthly and yearly options are planning inputs only. They are not checkout offers. AI assistance, account synchronisation, exports and PDF material remain unavailable until their separate product, rights, commercial and technical checks are complete.

FAQ: **Can I buy a plan today?** No. Checkout is not available and no order is created. **Does a payment confirmation mean access is ready?** No. A future payment status and access status are separate. **Are advanced materials available?** No. They remain unavailable until their stated gates and independent review are complete.

## 4. Homepage, global navigation and required state copy

### 4.1 Home copy

H1: **Build your HSK 3.0 learning path**

Subhead: **Choose a starting point, study by level, and return to the next useful task. HSKKit is for learners who want a clearer way to practise Chinese.**

- Visitor primary CTA: **Find your starting point** (only link when `/placement` exists).
- Secondary CTA: **Explore HSK 3.0 levels** (only link when `/levels` exists).
- Resumable account state: **Continue today’s learning** (only when a real resumable session exists).
- Trust line: **A learning suggestion is not an examination result or a promise of an outcome.**
- Today H2: **Make today’s next step clear.** Visitor: **Try a guided starting point, then choose a level and a task that fits your time.** Signed-in: **Your next session combines due review, new material, and a practice or listening task when available.**
- Levels H2: **Learn by HSK 3.0 level.** Level 1–6 pages show published material. Level 7–9 follows one advanced path, not three separate examination tracks.
- Tools H2: **Use the tool that matches your task.** Vocabulary, listening, practice, reading and grammar must each state the actual task; do not show an empty feature card.
- Availability H2: **What is available, and what is planned.** Do not show a price or purchase CTA on home before commercial configuration is approved.
- Closing H2: **Start with one useful next step.** Primary Find your starting point; secondary Explore levels.

### 4.2 Global navigation, universal recovery and legal footer

|Surface|Frozen label / helper|Condition|
|-|-|-|
|Levels|Understand the HSK 3.0 learning structure.|Link only to deployed route|
|Find your starting point|Use a guided self-assessment to choose a next learning step.|Never call it certification|
|Vocabulary|Browse published words by level.|Only publish ready levels|
|Practice|Work on a skill, then review what needs attention.|Only show deployed routes|
|Study tools|Reading, grammar and character practice where content is available.|No planned link presented as live|
|404|We could not find that page. / Go to home / Browse levels|No thin pseudo-content|
|500|Something did not load. / Try again / Return to home|Do not claim data was saved|
|Footer|Privacy Policy · Terms of Service · Cookie Policy · Refund and Cancellation Policy · Disclaimer · AI Policy|All public and authenticated layouts after implementation|

## 5. Interaction authority matrix — API, enum, state and field contract

### 5.1 API/request state copy

|API / state|Required user copy, validation and safe action|
|-|-|
|Catalog GET|Empty: **No published match found.** 404: **We could not find that study item.** 410: **This study item is no longer available.**|
|Content report POST|Label **Report a content issue**; helper **Tell us what needs review. Submitting does not change the item immediately.** 403 permission denied; 409 **This report is already being reviewed**; 410 withdrawn item.|
|Placement session POST|Inputs: Study standard, intended level band. 409 **You have a placement session in progress**; 422 **Placement is not ready right now. No recommendation has been created.**|
|Practice/Mock session POST/GET|Inputs: level/band and skill. 409 active session; 410 withdrawn question; 422 not ready. Mock timer is shown as **Time remaining**; timer end says **Time is up. Your available answers are being submitted.**|
|Attempt submit POST|Label **Submit answers**; helper **After submission, this attempt cannot be changed.** 409 already submitted; 410 no longer submittable; 422 **Check the selected answers and try again.**|
|Daily session GET/POST|Time budget and time zone are explicit. Empty is not success: **No session is ready yet.** 409 **Your learning record needs a decision.**|
|Review grade POST|Labels / machine enum: `again`→Again, `hard`→Hard, `good`→Good, `easy`→Easy. Helper: **Your choice changes the next review time.** Send observed time and client revision. 409 version conflict; 422 invalid grade.|
|Audio GET/POST|States / machine enum: `idle`, `loading`, `ready`, `playing`, `paused`, `ended`, `error`, `unavailable`. **No listening score has been recorded** on error/unavailable. 403 access, 410 revoked, 503 delivery error are distinct.|
|Guest merge POST|Preview before confirmation. 409 used/conflict; 422 no data. Cancel says **Guest progress was not combined. Your account progress has not changed.**|
|Account sync POST|Inputs: since revision, changes, resolution. `local_pending`, `syncing`, `synced`, `retryable_error`, `conflict`; never overwrite until resolution.|
|Streak GET|Show time zone, current streak, longest streak, last learning day and policy only when configured; no page-view claim. Invalid zone: **Choose a valid time zone.**|
|Data requests POST/GET/PATCH|Type machine enum `export` / `delete`; action enum `cancel` / `retry`. 403 recent verification needed; 409 state conflict; 422 action unavailable. Confirmation precedes irreversible delete.|
|Plans POST/PUT|Fields Goal, Available study time, optional Target date, Areas to work on, Current review load. 422 missing required input; 409 version conflict; overload gives adjustment choices.|
|AI explanation POST|Feature remains off by default. 429 quota/rate message; 503 provider failure says no allowance is used or it is restored. Do not send sensitive full text; offer lesson material.|
|Exports POST/GET/cancel|Selection first; states `queued`, `generating`, `ready`, `expired`, `cancelled`, `failed`, `revoked`. 403 no access; 409 cannot cancel; 410 expired/revoked.|
|Checkout|When `not_configured`: **Checkout is not available. No order has been created.** Later machine statuses are `cancelled`, `processing`, `failed`, `entitlement_pending`; never call payment confirmation access activation.|

### 5.2 Canonical entity field coverage (161/161) — R2 real display contract

**Rule:** `HIDE` never renders the machine value. `CONDITIONAL` renders only with data and an enabled capability. `DISPLAY WHEN FEATURE/DATA EXISTS` uses the exact enum label. All fields have a decision; no generic helper template applies.

|PRD field|Learner label|Display/hidden/condition|Surface|API/data authority|Enum / exact condition|
|-|-|-|-|-|-|
|`ContentAsset.id`|**Reference**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|catalog/detail|/api/v1/catalog/*|No additional enum; condition above controls rendering.|
|`ContentAsset.type`|**Request type**|DISPLAY WHEN FEATURE/DATA EXISTS — use the exact mapped label; otherwise render the matching unavailable state, not an empty value.|catalog/detail|/api/v1/catalog/*|word=Word; sentence=Sentence; character=Character; reading=Reading; grammar=Grammar; question=Question|
|`ContentAsset.standard_version`|**Study standard**|CONDITIONAL — render on a public catalog/detail page iff the record has `publish_status=published` and this value is non-null; no sign-in requirement; omit when null.|catalog/detail|/api/v1/catalog/*|Display the source value as a plain standard label; never combine two standards.|
|`ContentAsset.level_band`|**Level**|CONDITIONAL — render on a public catalog/detail page iff `publish_status=published` and `level_band` is non-null; no sign-in requirement; omit when null.|catalog/detail|/api/v1/catalog/*|1–6 display `HSK Level N`; 7–9 display `HSK Advanced Level N`; reject values outside 1–9.|
|`ContentAsset.content_version`|**Material version**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|catalog/detail|/api/v1/catalog/*|No additional enum; condition above controls rendering.|
|`ContentAsset.source_ref`|**Source information**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|catalog/detail|/api/v1/catalog/*|No additional enum; condition above controls rendering.|
|`ContentAsset.license_ref`|**Rights information**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|catalog/detail|/api/v1/catalog/*|No additional enum; condition above controls rendering.|
|`ContentAsset.qa_status`|**Content check**|DISPLAY WHEN FEATURE/DATA EXISTS — use the exact mapped label; otherwise render the matching unavailable state, not an empty value.|catalog/detail|/api/v1/catalog/*|draft=Draft; in_qa=Under review; published=Published; withdrawn=Unavailable|
|`ContentAsset.publish_status`|**Availability**|DISPLAY WHEN FEATURE/DATA EXISTS — use the exact mapped label; otherwise render the matching unavailable state, not an empty value.|catalog/detail|/api/v1/catalog/*|draft=Not available; in_qa=Being checked; published=Available; withdrawn=No longer available|
|`AudioAsset.id`|**Reference**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|audio player/detail|/api/v1/audio/:assetId/playback|No additional enum; condition above controls rendering.|
|`AudioAsset.content_asset_id`|**Study item**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|audio player/detail|/api/v1/audio/:assetId/playback|No additional enum; condition above controls rendering.|
|`AudioAsset.transcript`|**Transcript**|CONDITIONAL — render only when the audio asset is `published`, playback is enabled, and this field is non-null; otherwise omit the row and keep the audio unavailable state.|audio player/detail|/api/v1/audio/:assetId/playback|No additional enum; condition above controls rendering.|
|`AudioAsset.pronunciation`|**Pronunciation**|CONDITIONAL — render only when the audio asset is `published`, playback is enabled, and this field is non-null; otherwise omit the row and keep the audio unavailable state.|audio player/detail|/api/v1/audio/:assetId/playback|No additional enum; condition above controls rendering.|
|`AudioAsset.tones`|**Tone pattern**|CONDITIONAL — render only when the audio asset is `published`, playback is enabled, and this field is non-null; otherwise omit the row and keep the audio unavailable state.|audio player/detail|/api/v1/audio/:assetId/playback|No additional enum; condition above controls rendering.|
|`AudioAsset.speech_rate`|**Playback speed**|CONDITIONAL — render only when the audio asset is `published`, playback is enabled, and this field is non-null; otherwise omit the row and keep the audio unavailable state.|audio player/detail|/api/v1/audio/:assetId/playback|No additional enum; condition above controls rendering.|
|`AudioAsset.voice_or_engine`|**Voice information**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|audio player/detail|/api/v1/audio/:assetId/playback|No additional enum; condition above controls rendering.|
|`AudioAsset.source_ref`|**Source information**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|audio player/detail|/api/v1/audio/:assetId/playback|No additional enum; condition above controls rendering.|
|`AudioAsset.license_ref`|**Rights information**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|audio player/detail|/api/v1/audio/:assetId/playback|No additional enum; condition above controls rendering.|
|`AudioAsset.cache_right`|**Save for later**|DISPLAY WHEN FEATURE/DATA EXISTS — use the exact mapped label; otherwise render the matching unavailable state, not an empty value.|audio player/detail|/api/v1/audio/:assetId/playback|allowed=Available; denied=Not available; unknown=Not available until confirmed|
|`AudioAsset.offline_right`|**Offline use**|DISPLAY WHEN FEATURE/DATA EXISTS — use the exact mapped label; otherwise render the matching unavailable state, not an empty value.|audio player/detail|/api/v1/audio/:assetId/playback|allowed=Available; denied=Not available; unknown=Not available until confirmed|
|`AudioAsset.qa_status`|**Content check**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|audio player/detail|/api/v1/audio/:assetId/playback|No additional enum; condition above controls rendering.|
|`AudioAsset.version`|**Version**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|audio player/detail|/api/v1/audio/:assetId/playback|No additional enum; condition above controls rendering.|
|`Mastery.owner_scope`|**Account scope**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|review detail|PRD §11.2|No additional enum; condition above controls rendering.|
|`Mastery.content_asset_id`|**Study item**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|review detail|PRD §11.2|No additional enum; condition above controls rendering.|
|`Mastery.dimension`|**Dimension**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|review detail|PRD §11.2|No additional enum; condition above controls rendering.|
|`Mastery.score`|**Score**|CONDITIONAL — render only after the score exists and the result is authorized; show the numeric value with its scale supplied by the result contract; never infer a percentage; omit before scoring.|review detail|PRD §11.2|No additional enum; condition above controls rendering.|
|`Mastery.due_at`|**Next review**|CONDITIONAL — render only when the API value is non-null and the owning record/state is visible; parse the ISO-8601 UTC value, display it in the learner-selected time zone with an explicit zone label, and omit the row when null.|review detail|PRD §11.2|No additional enum; condition above controls rendering.|
|`Mastery.algorithm_version`|**Algorithm version**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|review detail|PRD §11.2|No additional enum; condition above controls rendering.|
|`Mastery.revision`|**Revision**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|review detail|PRD §11.2|No additional enum; condition above controls rendering.|
|`ReviewSchedule.id`|**Reference**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|review control|/api/v1/reviews/:id/grade|No additional enum; condition above controls rendering.|
|`ReviewSchedule.mastery_id`|**Review item**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|review control|/api/v1/reviews/:id/grade|No additional enum; condition above controls rendering.|
|`ReviewSchedule.grade`|**Grade**|DISPLAY WHEN FEATURE/DATA EXISTS — use the exact mapped label; otherwise render the matching unavailable state, not an empty value.|review control|/api/v1/reviews/:id/grade|again=Again; hard=Hard; good=Good; easy=Easy|
|`ReviewSchedule.interval`|**Interval**|HIDE — scheduling-machine value; the learner sees the localized `due_at` value instead. Never infer or display an unstated unit.|review control|/api/v1/reviews/:id/grade|No user enum; retain internally for scheduling only.|
|`ReviewSchedule.due_at`|**Next review**|CONDITIONAL — render only when the API value is non-null and the owning record/state is visible; parse the ISO-8601 UTC value, display it in the learner-selected time zone with an explicit zone label, and omit the row when null.|review control|/api/v1/reviews/:id/grade|No additional enum; condition above controls rendering.|
|`ReviewSchedule.source_attempt_id`|**Source attempt id**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|review control|/api/v1/reviews/:id/grade|No additional enum; condition above controls rendering.|
|`ReviewSchedule.idempotency_key`|**Idempotency key**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|review control|/api/v1/reviews/:id/grade|No additional enum; condition above controls rendering.|
|`Attempt.id`|**Reference**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|placement/practice/mock|/api/v1/attempts/:id/submit|No additional enum; condition above controls rendering.|
|`Attempt.owner_scope`|**Account scope**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|placement/practice/mock|/api/v1/attempts/:id/submit|No additional enum; condition above controls rendering.|
|`Attempt.mode`|**Activity type**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|placement/practice/mock|/api/v1/attempts/:id/submit|No additional enum; condition above controls rendering.|
|`Attempt.skill`|**Skill**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|placement/practice/mock|/api/v1/attempts/:id/submit|No additional enum; condition above controls rendering.|
|`Attempt.standard_version`|**Study standard**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|placement/practice/mock|/api/v1/attempts/:id/submit|No additional enum; condition above controls rendering.|
|`Attempt.content_version`|**Material version**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|placement/practice/mock|/api/v1/attempts/:id/submit|No additional enum; condition above controls rendering.|
|`Attempt.state`|**Status**|DISPLAY WHEN FEATURE/DATA EXISTS — use the exact mapped label; otherwise render the matching unavailable state, not an empty value.|placement/practice/mock|/api/v1/attempts/:id/submit|created=Not started; in_progress=In progress; submitted=Submitted; scored=Results ready; timed_out=Time ended|
|`Attempt.started_at`|**Started**|CONDITIONAL — render only when the API value is non-null and the owning record/state is visible; parse the ISO-8601 UTC value, display it in the learner-selected time zone with an explicit zone label, and omit the row when null.|placement/practice/mock|/api/v1/attempts/:id/submit|No additional enum; condition above controls rendering.|
|`Attempt.ended_at`|**Completed**|CONDITIONAL — render only when the API value is non-null and the owning record/state is visible; parse the ISO-8601 UTC value, display it in the learner-selected time zone with an explicit zone label, and omit the row when null.|placement/practice/mock|/api/v1/attempts/:id/submit|No additional enum; condition above controls rendering.|
|`Attempt.answers`|**Answers**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|placement/practice/mock|/api/v1/attempts/:id/submit|No additional enum; condition above controls rendering.|
|`Attempt.result`|**Result**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|placement/practice/mock|/api/v1/attempts/:id/submit|No additional enum; condition above controls rendering.|
|`Attempt.timer_deadline`|**Time remaining**|CONDITIONAL — render only when the API value is non-null and the owning record/state is visible; parse the ISO-8601 UTC value, display it in the learner-selected time zone with an explicit zone label, and omit the row when null.|placement/practice/mock|/api/v1/attempts/:id/submit|No additional enum; condition above controls rendering.|
|`DailySession.id`|**Reference**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|Today summary|/api/v1/daily-sessions|No additional enum; condition above controls rendering.|
|`DailySession.owner_scope`|**Account scope**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|Today summary|/api/v1/daily-sessions|No additional enum; condition above controls rendering.|
|`DailySession.local_day`|**Local day**|CONDITIONAL — render iff the authenticated owner receives this DailySession and `local_day` is non-null; format exactly `YYYY-MM-DD` as the calendar date in `DailySession.tz`; do not UTC-convert the date; omit when null.|Today summary|/api/v1/daily-sessions|`tz` must be a valid IANA time-zone ID and is displayed separately as Time zone.|
|`DailySession.tz`|**Time zone**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|Today summary|/api/v1/daily-sessions|No additional enum; condition above controls rendering.|
|`DailySession.rule_version`|**Rule version**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|Today summary|/api/v1/daily-sessions|No additional enum; condition above controls rendering.|
|`DailySession.queue_snapshot`|**Queue snapshot**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|Today summary|/api/v1/daily-sessions|No additional enum; condition above controls rendering.|
|`DailySession.state`|**Status**|DISPLAY WHEN FEATURE/DATA EXISTS — use the exact mapped label; otherwise render the matching unavailable state, not an empty value.|Today summary|/api/v1/daily-sessions|created=Ready; active=In progress; paused=Paused; completed=Completed; expired=Expired; cancelled=Cancelled|
|`DailySession.summary`|**Summary**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|Today summary|/api/v1/daily-sessions|No additional enum; condition above controls rendering.|
|`MistakeCase.id`|**Reference**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|mistake detail|PRD §11.2|No additional enum; condition above controls rendering.|
|`MistakeCase.attempt_id`|**Attempt reference**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|mistake detail|PRD §11.2|No additional enum; condition above controls rendering.|
|`MistakeCase.question_version`|**Question version**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|mistake detail|PRD §11.2|No additional enum; condition above controls rendering.|
|`MistakeCase.status`|**Status**|DISPLAY WHEN FEATURE/DATA EXISTS — show the exact mapped label on an authorized mistake record; no empty value.|mistake detail|PRD §11.2|open=Open; in_review=In review; resolved=Resolved; retired=Retired|
|`MistakeCase.weakness_tag`|**Weakness tag**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|mistake detail|PRD §11.2|No additional enum; condition above controls rendering.|
|`MistakeCase.resolved_at`|**Resolved at**|CONDITIONAL — render only when the API value is non-null and the owning record/state is visible; parse the ISO-8601 UTC value, display it in the learner-selected time zone with an explicit zone label, and omit the row when null.|mistake detail|PRD §11.2|No additional enum; condition above controls rendering.|
|`GuestMerge.id`|**Reference**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|merge preview|/api/v1/guest/merge-*|No additional enum; condition above controls rendering.|
|`GuestMerge.guest_scope`|**Guest session**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|merge preview|/api/v1/guest/merge-*|No additional enum; condition above controls rendering.|
|`GuestMerge.user_id`|**Account**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|merge preview|/api/v1/guest/merge-*|No additional enum; condition above controls rendering.|
|`GuestMerge.preview`|**Changes to merge**|CONDITIONAL — render only in the explicit preview/conflict-resolution state and when the field is non-empty; hide after confirmed, cancelled, expired or resolved.|merge preview|/api/v1/guest/merge-*|No additional enum; condition above controls rendering.|
|`GuestMerge.resolution`|**Resolution**|CONDITIONAL — render only in the explicit preview/conflict-resolution state and when the field is non-empty; hide after confirmed, cancelled, expired or resolved.|merge preview|/api/v1/guest/merge-*|No additional enum; condition above controls rendering.|
|`GuestMerge.state`|**Status**|DISPLAY WHEN FEATURE/DATA EXISTS — use the exact mapped label; otherwise render the matching unavailable state, not an empty value.|merge preview|/api/v1/guest/merge-*|previewed=Ready to review; confirmed=Combined; cancelled=Not combined; expired=Preview expired|
|`GuestMerge.expires_at`|**Available until**|CONDITIONAL — render only when the API value is non-null and the owning record/state is visible; parse the ISO-8601 UTC value, display it in the learner-selected time zone with an explicit zone label, and omit the row when null.|merge preview|/api/v1/guest/merge-*|No additional enum; condition above controls rendering.|
|`SyncState.user_id`|**Account**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|account sync|/api/v1/account/sync|No additional enum; condition above controls rendering.|
|`SyncState.server_revision`|**Server revision**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|account sync|/api/v1/account/sync|No additional enum; condition above controls rendering.|
|`SyncState.device_id`|**Device id**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|account sync|/api/v1/account/sync|No additional enum; condition above controls rendering.|
|`SyncState.pending_changes`|**Pending changes**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|account sync|/api/v1/account/sync|No additional enum; condition above controls rendering.|
|`SyncState.conflicts`|**Conflicts**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|account sync|/api/v1/account/sync|No additional enum; condition above controls rendering.|
|`SyncState.resolution`|**Resolution**|CONDITIONAL — render only in the explicit preview/conflict-resolution state and when the field is non-empty; hide after confirmed, cancelled, expired or resolved.|account sync|/api/v1/account/sync|No additional enum; condition above controls rendering.|
|`SyncState.updated_at`|**Updated at**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|account sync|/api/v1/account/sync|No additional enum; condition above controls rendering.|
|`Streak.user_id`|**Account**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|account progress|/api/v1/account/streak|No additional enum; condition above controls rendering.|
|`Streak.timezone`|**Time zone**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|account progress|/api/v1/account/streak|No additional enum; condition above controls rendering.|
|`Streak.current_count`|**Current streak**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|account progress|/api/v1/account/streak|No additional enum; condition above controls rendering.|
|`Streak.longest_count`|**Longest streak**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|account progress|/api/v1/account/streak|No additional enum; condition above controls rendering.|
|`Streak.last_learning_day`|**Last learning day**|CONDITIONAL — render only when the API value is non-null and the owning record/state is visible; parse the ISO-8601 UTC value, display it in the learner-selected time zone with an explicit zone label, and omit the row when null.|account progress|/api/v1/account/streak|No additional enum; condition above controls rendering.|
|`Streak.policy_version`|**Streak policy**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|account progress|/api/v1/account/streak|No additional enum; condition above controls rendering.|
|`AccountDataRequest.id`|**Reference**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|account data request|/api/v1/account/data-requests|No additional enum; condition above controls rendering.|
|`AccountDataRequest.user_id`|**Account**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|account data request|/api/v1/account/data-requests|No additional enum; condition above controls rendering.|
|`AccountDataRequest.type`|**Request type**|DISPLAY WHEN FEATURE/DATA EXISTS — use the exact mapped label; otherwise render the matching unavailable state, not an empty value.|account data request|/api/v1/account/data-requests|export=Get a copy; delete=Delete account data|
|`AccountDataRequest.state`|**Status**|DISPLAY WHEN FEATURE/DATA EXISTS — use the exact mapped label; otherwise render the matching unavailable state, not an empty value.|account data request|/api/v1/account/data-requests|requested=Requested; confirmed=Confirmed; processing=In progress; ready=Ready; completed=Completed; failed=Needs attention; cancelled=Cancelled; expired=Expired|
|`AccountDataRequest.confirmation_at`|**Confirmation at**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|account data request|/api/v1/account/data-requests|No additional enum; condition above controls rendering.|
|`AccountDataRequest.requested_at`|**Requested at**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|account data request|/api/v1/account/data-requests|No additional enum; condition above controls rendering.|
|`AccountDataRequest.completed_at`|**Completed at**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|account data request|/api/v1/account/data-requests|No additional enum; condition above controls rendering.|
|`AccountDataRequest.expires_at`|**Available until**|CONDITIONAL — render only when the API value is non-null and the owning record/state is visible; parse the ISO-8601 UTC value, display it in the learner-selected time zone with an explicit zone label, and omit the row when null.|account data request|/api/v1/account/data-requests|No additional enum; condition above controls rendering.|
|`AccountDataRequest.failure_code`|**What happened**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|account data request|/api/v1/account/data-requests|No additional enum; condition above controls rendering.|
|`AccountDataRequest.retention_exceptions`|**Retention exceptions**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|account data request|/api/v1/account/data-requests|No additional enum; condition above controls rendering.|
|`ContentReport.id`|**Reference**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|content report dialog|/api/v1/content/:id/reports|No additional enum; condition above controls rendering.|
|`ContentReport.reporter_scope`|**Reporter scope**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|content report dialog|/api/v1/content/:id/reports|No additional enum; condition above controls rendering.|
|`ContentReport.asset_id`|**Study item**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|content report dialog|/api/v1/content/:id/reports|No additional enum; condition above controls rendering.|
|`ContentReport.asset_version`|**Material version**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|content report dialog|/api/v1/content/:id/reports|No additional enum; condition above controls rendering.|
|`ContentReport.reason`|**Reason**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|content report dialog|/api/v1/content/:id/reports|No additional enum; condition above controls rendering.|
|`ContentReport.state`|**Status**|DISPLAY WHEN FEATURE/DATA EXISTS — use the exact mapped label; otherwise render the matching unavailable state, not an empty value.|content report dialog|/api/v1/content/:id/reports|open=Received; reviewing=Under review; resolved=Resolved; rejected=Closed|
|`ContentReport.resolution`|**Resolution**|CONDITIONAL — render iff the authenticated reporter views the report, `state` is `resolved` or `rejected`, and `resolution` is non-null/non-empty; hide for `open` and `reviewing`.|content report dialog|/api/v1/content/:id/reports|resolved=Resolution available; rejected=Closed without a content change.|
|`ContentReport.created_at`|**Created at**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|content report dialog|/api/v1/content/:id/reports|No additional enum; condition above controls rendering.|
|`Entitlement.id`|**Reference**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|access state|PRD §11.2|No additional enum; condition above controls rendering.|
|`Entitlement.user_id`|**Account**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|access state|PRD §11.2|No additional enum; condition above controls rendering.|
|`Entitlement.capability`|**Available feature**|CONDITIONAL — render only in the authenticated owner’s access-status view when an entitlement record exists; show source as a user-safe label and dates as localized ISO-8601 values; omit when no entitlement exists.|access state|PRD §11.2|No additional enum; condition above controls rendering.|
|`Entitlement.source`|**Source**|CONDITIONAL — render only in the authenticated owner’s access-status view when an entitlement record exists; show source as a user-safe label and dates as localized ISO-8601 values; omit when no entitlement exists.|access state|PRD §11.2|No additional enum; condition above controls rendering.|
|`Entitlement.starts_at`|**Available from**|CONDITIONAL — render only when the API value is non-null and the owning record/state is visible; parse the ISO-8601 UTC value, display it in the learner-selected time zone with an explicit zone label, and omit the row when null.|access state|PRD §11.2|No additional enum; condition above controls rendering.|
|`Entitlement.ends_at`|**Available until**|CONDITIONAL — render only when the API value is non-null and the owning record/state is visible; parse the ISO-8601 UTC value, display it in the learner-selected time zone with an explicit zone label, and omit the row when null.|access state|PRD §11.2|No additional enum; condition above controls rendering.|
|`Entitlement.status`|**Status**|DISPLAY WHEN FEATURE/DATA EXISTS — use the exact mapped label; otherwise render the matching unavailable state, not an empty value.|access state|PRD §11.2|active=Available; pending=Being checked; revoked=No longer available; expired=Ended|
|`Entitlement.config_version`|**Configuration version**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|access state|PRD §11.2|No additional enum; condition above controls rendering.|
|`AssetManifest.id`|**Reference**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|export/PDF preflight|PRD §11.2|No additional enum; condition above controls rendering.|
|`AssetManifest.asset_ids`|**Asset ids**|CONDITIONAL — render only during an authorized export/PDF preflight or status view and when the manifest is non-empty; never expose raw IDs outside that owner-scoped view.|export/PDF preflight|PRD §11.2|No additional enum; condition above controls rendering.|
|`AssetManifest.asset_versions`|**Asset versions**|CONDITIONAL — render only during an authorized export/PDF preflight or status view and when the manifest is non-empty; never expose raw IDs outside that owner-scoped view.|export/PDF preflight|PRD §11.2|No additional enum; condition above controls rendering.|
|`AssetManifest.rights_snapshot`|**Rights status**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|export/PDF preflight|PRD §11.2|No additional enum; condition above controls rendering.|
|`AssetManifest.state`|**Status**|DISPLAY WHEN FEATURE/DATA EXISTS — show only in authorized preflight; no empty value.|export/PDF preflight|PRD §11.2|draft=Preparing selection; valid=Ready for generation; invalid=Selection needs attention; revoked=No longer available|
|`AssetManifest.created_at`|**Created at**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|export/PDF preflight|PRD §11.2|No additional enum; condition above controls rendering.|
|`Plan.id`|**Reference**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|planner|/api/v1/plans|No additional enum; condition above controls rendering.|
|`Plan.owner_scope`|**Account scope**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|planner|/api/v1/plans|No additional enum; condition above controls rendering.|
|`Plan.goal`|**Study goal**|CONDITIONAL — render only when Planner is enabled, the authenticated owner can view the plan, and this field is non-null; otherwise show the Planner unavailable state, never an empty row.|planner|/api/v1/plans|No additional enum; condition above controls rendering.|
|`Plan.available_time`|**Study time available**|CONDITIONAL — render only when Planner is enabled, the authenticated owner can view the plan, and this field is non-null; otherwise show the Planner unavailable state, never an empty row.|planner|/api/v1/plans|No additional enum; condition above controls rendering.|
|`Plan.target_date`|**Target date**|CONDITIONAL — render only when the API value is non-null and the owning record/state is visible; parse the ISO-8601 UTC value, display it in the learner-selected time zone with an explicit zone label, and omit the row when null.|planner|/api/v1/plans|No additional enum; condition above controls rendering.|
|`Plan.plan_version`|**Plan version**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|planner|/api/v1/plans|No additional enum; condition above controls rendering.|
|`Plan.items`|**Plan tasks**|CONDITIONAL — render only when Planner is enabled, the authenticated owner can view the plan, and this field is non-null; otherwise show the Planner unavailable state, never an empty row.|planner|/api/v1/plans|No additional enum; condition above controls rendering.|
|`Plan.state`|**Status**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|planner|/api/v1/plans|No additional enum; condition above controls rendering.|
|`Plan.overload_reason`|**Workload adjustment**|CONDITIONAL — render only when Planner is enabled, the authenticated owner can view the plan, and this field is non-null; otherwise show the Planner unavailable state, never an empty row.|planner|/api/v1/plans|No additional enum; condition above controls rendering.|
|`AIRequest.id`|**Reference**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|guided explanation|/api/v1/ai/explanations|No additional enum; condition above controls rendering.|
|`AIRequest.owner_scope`|**Account scope**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|guided explanation|/api/v1/ai/explanations|No additional enum; condition above controls rendering.|
|`AIRequest.feature`|**Feature**|CONDITIONAL — render only when the corresponding AI/allowance capability is enabled for the authenticated owner and the field is non-null; while feature-off, render only the approved unavailable message.|guided explanation|/api/v1/ai/explanations|No additional enum; condition above controls rendering.|
|`AIRequest.input_scope`|**Information sent**|CONDITIONAL — render only when the corresponding AI/allowance capability is enabled for the authenticated owner and the field is non-null; while feature-off, render only the approved unavailable message.|guided explanation|/api/v1/ai/explanations|No additional enum; condition above controls rendering.|
|`AIRequest.quota_cost`|**Allowance used**|CONDITIONAL — render only when the corresponding AI/allowance capability is enabled for the authenticated owner and the field is non-null; while feature-off, render only the approved unavailable message.|guided explanation|/api/v1/ai/explanations|No additional enum; condition above controls rendering.|
|`AIRequest.status`|**Status**|DISPLAY WHEN FEATURE/DATA EXISTS — use the exact mapped label; otherwise render the matching unavailable state, not an empty value.|guided explanation|/api/v1/ai/explanations|requested=Request received; allowed=Preparing; completed=Ready; quota_denied=Limit reached; rate_limited=Try later; provider_failed=Unavailable; reported=Reported|
|`AIRequest.audit_id`|**Audit id**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|guided explanation|/api/v1/ai/explanations|No additional enum; condition above controls rendering.|
|`QuotaLedger.id`|**Reference**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|allowance state|/api/v1/ai/explanations|No additional enum; condition above controls rendering.|
|`QuotaLedger.owner_scope`|**Account scope**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|allowance state|/api/v1/ai/explanations|No additional enum; condition above controls rendering.|
|`QuotaLedger.feature`|**Feature**|CONDITIONAL — render only when the corresponding AI/allowance capability is enabled for the authenticated owner and the field is non-null; while feature-off, render only the approved unavailable message.|allowance state|/api/v1/ai/explanations|No additional enum; condition above controls rendering.|
|`QuotaLedger.period`|**UTC month**|CONDITIONAL — render only when the corresponding AI/allowance capability is enabled for the authenticated owner and the field is non-null; while feature-off, render only the approved unavailable message.|allowance state|/api/v1/ai/explanations|No additional enum; condition above controls rendering.|
|`QuotaLedger.limit`|**Monthly limit**|CONDITIONAL — render only when the corresponding AI/allowance capability is enabled for the authenticated owner and the field is non-null; while feature-off, render only the approved unavailable message.|allowance state|/api/v1/ai/explanations|No additional enum; condition above controls rendering.|
|`QuotaLedger.used`|**Used this month**|CONDITIONAL — render only when the corresponding AI/allowance capability is enabled for the authenticated owner and the field is non-null; while feature-off, render only the approved unavailable message.|allowance state|/api/v1/ai/explanations|No additional enum; condition above controls rendering.|
|`QuotaLedger.revision`|**Revision**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|allowance state|/api/v1/ai/explanations|No additional enum; condition above controls rendering.|
|`AccessPolicy.id`|**Reference**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|permission message|PRD §11.2|No additional enum; condition above controls rendering.|
|`AccessPolicy.resource_type`|**Item type**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|permission message|PRD §11.2|No additional enum; condition above controls rendering.|
|`AccessPolicy.actor_scope`|**Who can act**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|permission message|PRD §11.2|No additional enum; condition above controls rendering.|
|`AccessPolicy.action`|**Requested action**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|permission message|PRD §11.2|No additional enum; condition above controls rendering.|
|`AccessPolicy.effect`|**Access result**|DISPLAY WHEN FEATURE/DATA EXISTS — expose only the mapped user-safe result, never the policy rule itself.|permission message|PRD §11.2|allow=Available; deny=Not available|
|`AccessPolicy.revision`|**Revision**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|permission message|PRD §11.2|No additional enum; condition above controls rendering.|
|`AuditEvent.id`|**Reference**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|support reference|PRD §11.2|No additional enum; condition above controls rendering.|
|`AuditEvent.actor_scope`|**Who can act**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|support reference|PRD §11.2|No additional enum; condition above controls rendering.|
|`AuditEvent.action`|**Requested action**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|support reference|PRD §11.2|No additional enum; condition above controls rendering.|
|`AuditEvent.resource_type`|**Item type**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|support reference|PRD §11.2|No additional enum; condition above controls rendering.|
|`AuditEvent.result`|**Result**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|support reference|PRD §11.2|No additional enum; condition above controls rendering.|
|`AuditEvent.created_at`|**Created at**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|support reference|PRD §11.2|No additional enum; condition above controls rendering.|
|`OrderDraft.id`|**Reference**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|checkout status|/api/v1/checkout/*|No additional enum; condition above controls rendering.|
|`OrderDraft.owner_scope`|**Account scope**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|checkout status|/api/v1/checkout/*|No additional enum; condition above controls rendering.|
|`OrderDraft.plan_ref`|**Study option**|CONDITIONAL — render iff the documented API returns HTTP 200 for the authenticated record owner (equivalent access decision `allow`) and this field is non-null/non-empty; omit it on null/empty, 401/403, or access decision `deny`.|checkout status|/api/v1/checkout/*|No additional enum; condition above controls rendering.|
|`OrderDraft.status`|**Status**|DISPLAY WHEN FEATURE/DATA EXISTS — use the exact mapped label; otherwise render the matching unavailable state, not an empty value.|checkout status|/api/v1/checkout/*|not_configured=Not available; cancelled=Cancelled; processing=Processing; failed=Not completed; entitlement_pending=Access being checked|
|`OrderDraft.config_version`|**Configuration version**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|checkout status|/api/v1/checkout/*|No additional enum; condition above controls rendering.|
|`ExportJob.id`|**Reference**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|export/PDF status|/api/v1/exports|No additional enum; condition above controls rendering.|
|`ExportJob.user_id`|**Account**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|export/PDF status|/api/v1/exports|No additional enum; condition above controls rendering.|
|`ExportJob.selection_manifest`|**Selected material**|CONDITIONAL — render only during an authorized export/PDF preflight or status view and when the manifest is non-empty; never expose raw IDs outside that owner-scoped view.|export/PDF status|/api/v1/exports|No additional enum; condition above controls rendering.|
|`ExportJob.asset_versions`|**Asset versions**|CONDITIONAL — render only during an authorized export/PDF preflight or status view and when the manifest is non-empty; never expose raw IDs outside that owner-scoped view.|export/PDF status|/api/v1/exports|No additional enum; condition above controls rendering.|
|`ExportJob.state`|**Status**|DISPLAY WHEN FEATURE/DATA EXISTS — use the exact mapped label; otherwise render the matching unavailable state, not an empty value.|export/PDF status|/api/v1/exports|queued=Queued; generating=Preparing file; ready=Ready; expired=Expired; cancelled=Cancelled; failed=Could not prepare; revoked=No longer available|
|`ExportJob.expires_at`|**Available until**|CONDITIONAL — render only when the API value is non-null and the owning record/state is visible; parse the ISO-8601 UTC value, display it in the learner-selected time zone with an explicit zone label, and omit the row when null.|export/PDF status|/api/v1/exports|No additional enum; condition above controls rendering.|
|`ExportJob.failure_code`|**What happened**|HIDE — internal machine value; reveal only a shortened Reference after failure where support needs it. Never render token, raw answer, prompt, URL or audit payload.|export/PDF status|/api/v1/exports|No additional enum; condition above controls rendering.|

### 5.3 Additional PRD request fields that require direct UI copy

|Field|Label / helper / validation|Location|
|-|-|-|
|`placement.standard_version`|Study standard — choose one standard; no mixed queue.|Placement start|
|`placement.band`|Suggested starting band — a learning suggestion, not certification.|Placement result|
|`practice.level`, `practice.skill`|HSK [Level] / [Skill] practice.|Practice entry|
|`mock.band`, `mock.timer`|Study band / Time remaining; mock is unavailable until checks complete.|Mock entry/attempt|
|`attempt.answers`, `elapsed`, `content_version`|Answers are reviewed before submit; elapsed time is factual; version is conditional detail.|Submit confirmation|
|`review.observed_at`, `review.client_revision`|Observed time / Your version are internal conflict inputs; on mismatch show Review the versions before saving.|Review submit|
|`plan.weaknesses`, `plan.SRS_load`|Areas to work on / Current review load; these inform workload, not a diagnosis.|Planner|
|`export.selection`|Choose the material to include. Cancellation availability is state-specific.|Export start|

## 6. Closed repair contracts — R3–R8

### 6.0 Frozen commercial and product parameters (KEEP)

These are internal execution parameters, not public purchase claims while Payment remains `not_configured`:

- Free: **US$0**.
- Pro Monthly candidate: **US$5.99/month**; Pro Yearly candidate: **US$49/year**.
- AI/Planner candidate allowance for an eligible Pro account: **500 credits per UTC calendar month**, reset on day 1 at 00:00 UTC, no carry-over, maximum 25 credits per request, 10 requests/hour, concurrency 1. A request consumes only after successful persistence; quota rejection, safety refusal, provider failure, timeout, system error and idempotent replay consume zero or receive an atomic restore.
- P2 Advanced Study PDF Pack candidate: **US$9.99**, exactly one learner-selected Level, at most 120 authorized published vocabulary/example entries, at most 20 exercises, at most three successful downloads, expiry 14 days after first Ready. It remains unavailable and non-purchasable until its separate gates close.

### 6.1 R3 — complete actionable state and recovery contract

|Surface / state|Exact message|Primary action → target|Secondary/cancel|Retry or disabled rule|Result|
|-|-|-|-|-|-|
|Content report 403|You do not have permission to report this item from this session.|Sign in → account sign-in|Back to study item|Retry only after authenticated permission exists.|No report is created.|
|Content report 409|This report is already being reviewed.|View study item → origin|Close|No retry while the existing report is open/reviewing.|No duplicate report.|
|Content report 410|This study item is no longer available, so it cannot be reported.|Browse available material → originating catalog|Close|No retry for the withdrawn version.|No report is created.|
|Placement 409|You already have a placement session in progress.|Resume placement → same private session|Return home|New-session control disabled until terminal/cancelled.|Same session; no new timer or attempt.|
|Placement 422|Placement is not ready right now. No recommendation has been created.|Explore levels → `/levels` when deployed|Return home|Retry only when placement availability changes.|No attempt, result or plan.|
|Practice 409|You already have this practice in progress.|Resume practice → same private attempt|Back to level|Start disabled while active attempt exists.|Same attempt; no duplicate.|
|Practice 410|A question in this practice is no longer available.|Choose available practice → public practice entry|Back to level|No retry of withdrawn version.|No score or review schedule.|
|Practice 422|This practice is not ready right now.|Browse published vocabulary → relevant level|Back to level|Retry when required questions are published.|No attempt.|
|Mock 409|You already have a timed practice in progress.|Resume timed practice → same private attempt|Use skill practice|New mock disabled while active.|Same timer/attempt.|
|Mock 410|This timed practice changed and cannot be submitted as shown.|Use skill practice → public practice|Back to level|No retry of withdrawn version.|No score; retained internal version only.|
|Mock 422|This mock practice is not open yet.|Use skill practice → public practice|Back to level|Disabled until mock gates close.|No attempt or timer.|
|Timer end|Time is up. Your available answers are being submitted.|View result → private result when saved|Wait on current status|Submit is idempotent; disable repeated submit.|One terminal submission or explicit retryable failure.|
|Attempt 422|Choose an available answer before submitting.|Review answers → current attempt|Cancel submit|Retry after valid selection.|Draft remains editable.|
|Attempt 409|This attempt was already submitted.|View result → same private result|Back to practice|Never resubmit terminal attempt.|Original result only; no second score/schedule.|
|Review 422|Choose Again, Hard, Good, or Easy.|Choose a review option → current card|Skip for now|Retry after valid grade.|No due-date change.|
|Review 409|This review changed before your choice was saved.|Review versions → conflict comparison|Keep current version|Save enabled only after explicit resolution.|One selected revision saves once.|
|Sync 422|This device cannot sync with that saved version.|Refresh saved progress → account sync|Keep local copy|Retry after refresh.|No server overwrite.|
|Sync 409|Your changes need a choice before they can sync.|Review changes → resolution|Cancel and remain local|Read-only until choice.|One selected version becomes current.|
|Sync network error|Your changes are saved on this device but are not synced yet.|Try syncing again → same screen|Continue offline|Retry is idempotent.|No second write.|
|Data export failed|We could not prepare your account-data copy.|Try again → same request|Cancel request if allowed|Retry only while type=`export`, state=`failed` and verification remains valid.|One new processing attempt and audit record; no duplicate ready file.|
|Account deletion failed|We could not complete every required deletion step. Your request remains recorded.|Retry deletion → same verified request|Contact support / view retained exceptions|Retry only while type=`delete`, state=`failed`, recent verification is valid, and processing is not marked irreversible-complete; otherwise support review is required.|Retry continues the idempotent purge, creates a new audit event, and never restores data already deleted; terminal completion records only the minimum lawful receipt/exceptions.|
|Data request cancelled|This request was cancelled.|Start a new request → account data requests|Back to account|New request requires current verification.|No export or deletion continues.|
|Data request irreversible delete|Deletion is being processed and can no longer be cancelled.|View status → account data requests|None|Cancel/retry disabled.|Completion receipt only; purge continues.|
|Data request expired|This download is no longer available.|Create a new export request → account data requests|Back to account|Old URL cannot be retried.|No old URL reissue.|
|Plan 422|Add a study goal and available study time to continue.|Edit plan details → Planner|Cancel|Retry after required input.|No plan version.|
|Plan 409|This plan changed before your update was saved.|Review latest plan → comparison|Keep latest|Save after explicit resolution.|One new version.|
|AI quota denied|You have reached this month’s assistance allowance.|Use lesson material → origin|Close|Disabled until next UTC-month reset.|No provider call or debit.|
|AI rate limited|Please wait before requesting another explanation.|Use lesson material → origin|Close|Retry only after the displayed reset time.|No provider call or debit.|
|AI provider failed|This explanation could not be completed.|Try again → same supported surface|Use lesson material|Retry enabled when service is available.|No debit, or atomic restore.|
|Export failed|We could not prepare this file.|Regenerate → new idempotent export operation|Cancel/Back to material|Only owner with valid rights may retry.|One new job; old failed job remains terminal.|
|Export cancelled|This file request was cancelled.|Prepare a new file → export selection|Back to material|Old job cannot resume.|No file or URL.|
|Export revoked|This file is no longer available.|Back to study material → origin|Contact support|No regenerate until entitlement/rights restored.|URL and cached delivery revoked.|
|PDF expired|This PDF access period has ended.|Back to PDF Pack status → `/pdf-packs` controlled state|Contact support|No old URL reissue.|No download count change.|
|Checkout not configured|Checkout is not available. No order has been created.|Continue with free learning → public free path|Back to pricing|Purchase controls disabled.|No order/payment/entitlement.|
|Checkout cancelled|Checkout was cancelled. No access change was made.|Return to study options → `/pricing`|Continue free learning|New checkout only after Payment Live.|No duplicate order.|
|Checkout processing|Payment is still processing. Access has not been activated yet.|Check status → same private checkout status|Continue free learning|Purchase button disabled; poll idempotently.|No entitlement until separate active event.|
|Checkout failed|Payment was not completed. No access change was made.|Try again → checkout only after failure is terminal|Return to pricing|One new order draft per retry.|No entitlement.|
|Entitlement pending|Payment status is recorded, but access is still being checked.|Refresh access status → account entitlement|Contact support|Do not repurchase while pending.|No duplicate charge/order; access waits for entitlement active.|

### 6.2 R4 — visible FAQ and identical JSON-LD source

**Schema rule:** when a route below says FAQPage=YES, the JSON-LD `Question.name` and `acceptedAnswer.text` must copy the visible question and answer below byte-for-byte after implementation review. Otherwise emit no FAQPage.

|Route|Visible Q&A source|FAQPage|
|-|-|-|
|`/`|**What does the placement suggestion mean?** It suggests a practical study starting point. It is not an examination result or a promise of an outcome. **Can I study without buying a plan?** Yes. Use the published free learning material and available basic activities. **Can I buy a plan today?** No. Checkout is unavailable and no order can be created.|YES only when all three are visibly rendered on the indexable page.|
|`/levels`|**How should I choose a level?** Use published level guidance and placement as a learning suggestion, then choose material you can complete comfortably. **Are Levels 7–9 separate examination tracks?** No. HSKKit presents one advanced learning path for Levels 7–9.|YES only with substantive visible page.|
|`/hsk-3-0`|**What is HSK 3.0 used for here?** It organizes HSKKit learning material and tasks by one study framework. **Can I mix standards in one study queue?** No. Choose one study standard at a time.|YES only with substantive visible page.|
|`/hsk-2-0-vs-3-0`|**Should I mix HSK 2.0 and HSK 3.0 in one plan?** No. Keep one active standard so levels and tasks stay understandable. **Does this guide replace an examination authority?** No. It is learning guidance only.|YES only with substantive visible page.|
|`/vocabulary/:level`|**Which words appear here?** Only published words for this level with the required verified fields. **Can I add every word to review?** Only an available published item can be added when Review is enabled for your account.|YES only with published dataset.|
|`/word/:slug`|No FAQ block; use the verified word fields and approved DefinedTerm data only.|NO.|
|`/dictionary`|**What can I search?** Search published Hanzi, pinyin, or English entries. **Why is there no result?** No published item matched the query; try another spelling or browse by level.|YES only after real visible search exists.|
|`/character/:hanzi`|**What information is shown?** Only published pronunciation, meaning, and related-word fields available for this character. **Can I add it to review?** Only when Review is enabled and the item is available.|YES only with substantive published content.|
|`/grammar/:slug`|**What will I practise?** Use the visible explanation and examples, then start the related task when it is available. **Can I save this topic for review?** Yes only when Review is enabled and this published item supports it.|YES only with substantive published content.|
|`/reading/:slug`|**How should I use this reading?** Read the passage, inspect the target words, and complete the available understanding task. **Can I continue to practice or review?** Yes only when the related task or Review action is enabled.|YES only with substantive published content.|
|`/placement`|**Is this an examination result?** No. It is a learning starting-point suggestion. **What happens after I finish?** Your private result can suggest a level and, when Planner is enabled, offer a study-plan action.|YES only on visible public entry; never on result.|
|`/practice/:level/:skill`|**Can I resume an unfinished activity?** Yes, when a real active attempt exists for your session or account. **Where are my results?** Results are private and excluded from public indexing.|YES only on public entry; never attempt/result.|
|`/mock/:band`|**Is timed mock practice available now?** Only when the page shows it as open after all required checks. **What can I do while it is unavailable?** Use an available skill-practice activity.|YES only on public entry after implementation review.|
|`/pricing`|**Can I buy a plan today?** No. Checkout is unavailable and no order can be created. **Does a payment status mean access is active?** No. Payment and entitlement are separate states. **What remains planned?** Pro options, AI assistance, account sync, exports and the PDF Pack remain unavailable until their separate product, rights, commercial, security and technical gates close.|YES only when all three are visibly rendered; no Product/Offer schema before approval.|
|Six legal routes|No marketing FAQ.|NO.|

### 6.3 R5 — complete existing CTA journeys

|Journey|Primary CTA → target/operation|Condition|Secondary/cancel and data result|Success result|Feature-off|
|-|-|-|-|-|-|
|Placement result → Planner|Create a study plan / Update my study plan → Planner create/update|Private result exists; account + Planner enabled.|Not now; no plan created/changed.|Prefilled band/weakness/SRS load is reviewed before one save.|Study planning is not available yet.|
|Dictionary result → Review|Add to review → idempotent ReviewSchedule create|Published item; account and Review enabled.|Keep searching; no schedule.|One schedule; duplicate returns existing schedule.|Review is not available for this item yet.|
|Character → Review|Add to review → idempotent ReviewSchedule create|Published character item supports Review.|Back to related words; no schedule.|One schedule.|Review is not available for this item yet.|
|Grammar → Practice|Start practice → related public practice entry/private attempt|Related deployed questions exist.|Keep reading; no attempt.|One attempt or resume same active attempt.|Related practice is not available yet.|
|Grammar → Review|Add to review → idempotent schedule create|Published topic supports Review.|Keep reading; no schedule.|One schedule.|Review is not available for this topic yet.|
|Reading → Practice|Start practice → related task|Published task exists.|Continue reading; no attempt.|One attempt or same active attempt.|Related practice is not available yet.|
|Reading → Review|Add to review → idempotent schedule create|Published target item + Review enabled.|Continue reading; no schedule.|One schedule.|Review is not available for this reading yet.|
|Practice|Start practice → session create|Entry/questions deployed.|Back to level; no attempt.|Private attempt; Resume reopens same.|Practice is not available yet.|
|Mock|Start mock practice → timed session create|All mock gates closed.|Use skill practice; no mock attempt.|One private timed attempt.|This mock is not open yet.|
|AI|Get a guided explanation → AI request|Supported surface + provider/data/allowance gates.|Use lesson material; no request/debit.|One bounded response with ledger result.|Guided explanation is not available yet.|
|Export/PDF prepare|Prepare my file → export create|Owner, entitlement, rights and export gates valid.|Cancel; no job before submission.|One queued job.|File export / PDF Pack is not available yet.|
|Export/PDF cancel|Cancel request → cancel operation|Only queued/generating and cancellable.|Keep request; no state change.|One cancelled terminal job; no file.|Control disabled outside cancellable states.|
|Export/PDF regenerate|Regenerate file → new idempotent export operation|Prior job=`failed`; rights/entitlement still valid; not expired/revoked.|Back to material; no new job.|One new job linked to failed predecessor; predecessor unchanged.|Disabled until gates/rights return.|

### 6.4 R6 — binding lifecycle clocks

**Global clock rule:** every server retention clock uses UTC. `local_day` and `tz` are used only for DailySession and Streak product semantics.

|Object|Start → end|Readonly|Delete/revoke result and exception|
|-|-|-|-|
|GuestMerge|Token/preview starts at preview creation and expires 24 hours later.|None.|Delete preview, token, Queue and cache at expiry, no later than 24h. Retain only an anti-abuse hash for 30d with weekly purge.|
|Attempt|Recoverable from `started_at` through D+30; terminal clock begins at submitted/scored/timed_out.|Readonly through terminal D+90.|Delete/de-identify D+120 after terminal or account-deletion completion, whichever is later; security-event minimum only under Stage04 exception.|
|DailySession|Active through learner local-day end.|Readonly 30d after terminal.|Delete D+60 after terminal.|
|ReviewSchedule|Active until terminal review event.|Readonly 30d after terminal.|Delete D+60 after terminal.|
|SyncState|Active with account; conflict snapshot begins at unresolved conflict.|Readonly conflict snapshot 30d.|Delete 30d after account-deletion completion; no overwrite before resolution.|
|AIRequest|Product prompt/output copy clock starts at completed/failed request.|No learning-history display after D+30.|Delete/de-identify product copy D+30; Queue/cache within 24h.|
|QuotaLedger|Period starts day 1 00:00 UTC and ends at UTC calendar-month end.|Aggregate ledger readonly for 90d after period end.|Delete/de-identify D+90 after UTC period end; no carry-over.|
|AccountDataRequest|Active at verified request; completion receipt clock begins at `completed_at`.|Receipt readonly 30d.|Delete receipt D+30; verified cancellation allowed only before irreversible delete; D1/R2/Queue/cache purge completes within 30d; legal-hold decision fields follow Stage04 exception only.|
|Export/PDF job and URL|Normal availability begins at first `ready_at` and ends 14d later.|Financial order/entitlement link may remain readonly up to 7y after Payment Live only.|Delete PDF/URL/cache at normal D+14. Cancellation, account deletion, rights withdrawal, approved refund or access revocation stops issuance and revokes URL/R2/cache/Queue within 24h; statutory financial link is not downloadable content.|

### 6.5 R7 — six-page legal source manifest

**Sole legal body source:** `/root/.hermes/profiles/dazongguan/cache/documents/HSKKIT_PRD_v4_0_COMPLIANCE_ADDENDUM_v1_4_AUDITOR_CLOSURE.md`, exact SHA-256 `b34c9168f1594e8bb057da32190865c65812d098bf9143dbe763388dc83d02be`. Downstream must copy the full blockquote body from the exact section below without abbreviation or paraphrase. This v1.3 does not duplicate legal body text.

|Canonical route|Footer label|Exact source anchor|Application rule|
|-|-|-|-|
|`/privacy-policy`|Privacy Policy|`### 9.1 Privacy Policy — canonical /privacy-policy`|Existing canonical, no alias; insert the full blockquote after the opening summary.|
|`/terms-of-service`|Terms of Service|`### 9.2 Terms of Service — canonical /terms-of-service`|Existing canonical, no alias; insert the full blockquote after service/access terms.|
|`/cookie-policy`|Cookie Policy|`### 9.3 Cookie Policy — canonical /cookie-policy`|Create the page with the full blockquote; optional `/cookies` is a 308 alias only after implementation.|
|`/refund-policy`|Refund and Cancellation Policy|`### 9.4 Refund and Cancellation Policy — canonical /refund-policy`|Create the page with the full blockquote; optional `/refunds` is a 308 alias only after implementation.|
|`/disclaimer`|Disclaimer|`### 9.5 Disclaimer — canonical /disclaimer`|Existing canonical, no alias; replace/add the body with the full blockquote.|
|`/ai-policy`|AI Policy|`### 9.6 AI Policy — canonical /ai-policy`|Create the page with the full blockquote; optional `/ai` is a 308 alias only after implementation.|

For all six pages, apply Stage04 §9’s shared rule exactly: show `Effective date: [insert actual publication date at release]` only at publication, never predate it; support is `support@hskkit.com`; footer links appear on all public and authenticated layouts only after implementation review.

### 6.6 R8 — per-surface design, implementation and release authority

|Surface|Current classification|Design now|Implementation gate|Release gate|
|-|-|-|-|-|
|Public static/SEO pages|DESIGN_NOW; RELEASE_BLOCKED|Frozen hierarchy, copy, visible FAQ and honest unavailable states.|Approved route/data/content plus implementation QA.|Owner + SEO review of canonical/index/sitemap/schema and production QA.|
|Legal pages/footer|DESIGN_NOW; IMPLEMENTATION_BLOCKED; RELEASE_BLOCKED|Layouts and full Stage04 source text only.|Legal source manifest consumed exactly; effective date/footer behavior implemented.|Compliance recheck + Owner publication approval.|
|Auth/account|DESIGN_DISABLED_STATE_ONLY; IMPLEMENTATION_BLOCKED; RELEASE_BLOCKED|Signed-out, verification, owner-only, conflict, export/delete disabled states.|Auth/session/data contract, security and deletion tests.|Owner + privacy/security + production E2E.|
|Planner|DESIGN_DISABLED_STATE_ONLY; IMPLEMENTATION_BLOCKED; RELEASE_BLOCKED|Inputs, overload, conflict and unavailable states.|Planner API/versioning/lifecycle acceptance.|Owner + production QA.|
|AI|DESIGN_DISABLED_STATE_ONLY; IMPLEMENTATION_BLOCKED; RELEASE_BLOCKED|Unavailable, quota, rate and provider-failure states.|Provider/model/endpoint, data terms, retention, safety, ledger and cost evidence.|Owner + AI/compliance/security E2E.|
|Audio|DESIGN_DISABLED_STATE_ONLY; IMPLEMENTATION_BLOCKED; RELEASE_BLOCKED|Player states including unavailable/revoked/error.|Asset licence manifest, playback/cache rights and delivery tests.|Owner + rights/compliance + production QA.|
|Export|DESIGN_DISABLED_STATE_ONLY; IMPLEMENTATION_BLOCKED; RELEASE_BLOCKED|Selection, queued/generating/ready/failed/cancelled/expired/revoked states.|Rights manifest, signed URL, cancellation/expiry/deletion controls.|Owner + privacy/rights + production E2E.|
|PDF Pack|DESIGN_DISABLED_STATE_ONLY; IMPLEMENTATION_BLOCKED; RELEASE_BLOCKED|P2 unavailable card/status; no active purchase/download control.|P2 rights, content caps, export, entitlement, refund and cost gates.|Open-purchase acceptance + Owner; three-download/14d/revocation E2E.|
|Pricing|DESIGN_NOW; RELEASE_BLOCKED|Free and candidate-plan information with explicit planned status.|No checkout wiring while Payment=`not_configured`.|Owner commercial approval + compliance/SEO/QA.|
|Payment/checkout|DESIGN_DISABLED_STATE_ONLY; IMPLEMENTATION_BLOCKED; RELEASE_BLOCKED|Not-configured/cancelled/processing/failed/entitlement-pending states only.|Processor, order/webhook/idempotency/refund/tax/reconciliation and entitlement separation.|Payment Live approval + real/sandbox E2E as authorized by Owner.|
|Practice/mock/review private states|DESIGN_DISABLED_STATE_ONLY where feature absent; IMPLEMENTATION_BLOCKED until data exists; RELEASE_BLOCKED|Approved public entry and exact private-state designs.|Question/content/version/timer/SRS APIs and lifecycle tests.|Owner + private-route/noindex + production QA.|

This table is a handoff boundary, not authorization to start Stage06 or implementation.

## 7. 交付物、验收清单与下游交接
### 7.1 交付物
- v1.3 workspace: `/root/.hermes/profiles/dazongguan/workspace/HSKKit-Stage05-Copy-Freeze-v1.3-Auditor-Closure.md`.
- v1.3 cache: `/root/.hermes/profiles/dazongguan/cache/documents/HSKKit-Stage05-Copy-Freeze-v1.3-Auditor-Closure.md`.
- v1.1 is preserved as historical evidence and must not be used as a downstream copy source.
### 7.2 验收清单
- [x] R1 clean Markdown, R2 exact 161 fields, R3 recovery, R4 FAQ/schema, R5 CTA, R6 clocks, R7 legal sources, R8 layered handoff are present.
- [x] KEEP boundaries remain carried forward from hash-bound §§1–4; no scope expansion is authorized.
- [ ] Auditor closure validates final bytes and authority correspondence. This file grants no implementation, deployment, SEO publication, payment activation, or automatic Stage06 authority.
### 7.3 风险
- P0: provider/payment/rights/account/AI/export/PDF implementation evidence is absent; capabilities remain off.
- P1: target routes, schema, canonicals, sitemap, legal routes, field handling and CTA wiring require implementation plus QA.
- P2: advanced mock and PDF opening retain separate rights/commercial/open-purchase gates.
### 7.4 下游交接
- Independent review only: read v1.3 with the three hash-bound authority sources.
- Design only receives Design can draw and Disabled-only state; engineering/release remain blocked.
- SEO must not emit schema, index, sitemap or canonical changes from this candidate.
- Stage06 remains blocked pending separate Owner decision after independent review.

[NEEDS_REVIEW]
