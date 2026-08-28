# HSKKit Store Frozen Product & Pricing Contract — 2026-08-28

Status: **FROZEN for implementation**

This contract supersedes the earlier flat-price catalog. All amounts below are one-time Stripe **Test** prices in USD. Production copy, checkout metadata, generated files, manifests and QA evidence must use this exact matrix.

## 1. Complete vocabulary products

Canonical release: `content/releases/hsk3-gf0025-2021-v2.json` (`GF0025-2021`, 11,092 entries).

- `level-1` — **HSK 1 Complete Vocabulary** — 500 entries — **US$3.99**
- `level-2` — **HSK 2 Complete Vocabulary** — 772 entries — **US$5.99**
- `level-3` — **HSK 3 Complete Vocabulary** — 973 entries — **US$7.99**
- `level-4` — **HSK 4 Complete Vocabulary** — 1,000 entries — **US$10.99**
- `level-5` — **HSK 5 Complete Vocabulary** — 1,071 entries — **US$13.99**
- `level-6` — **HSK 6 Complete Vocabulary** — 1,140 entries — **US$17.99**
- `starter-1-3` — **HSK 1–3 Starter Complete** — 2,245 entries — **US$9.99**
- `progression-4-6` — **HSK 4–6 Progression** — 3,211 entries — **US$29.99**
- `advanced-7-9` — **HSK 3.0 Advanced 7–9 Complete Vocabulary Pack** — unified 5,636-entry official band — **US$39.99**
- `complete-1-9` — **HSK 1–9 Complete Vocabulary Library** — 11,092 entries — **US$49.99**

Advanced 7–9 must not be described as three official level lists. Its package structure is one complete index plus three clearly labelled HSKKit reading volumes. Volumes are usability divisions, not separate official HSK 7, HSK 8 and HSK 9 vocabularies.

## 2. Practical resources

- `worksheet-pack` — **HSK Worksheet Pack** — **US$12.99**
- `assessment-tracker` — **HSK Assessment Tracker** — **US$4.99**
- `30-day-planner` — **HSK 30-Day Planner** — **US$6.99**
- `practice-assessment-pack` — **HSK Practice Assessment Pack** — **US$16.99**

## 3. Resource bundles

- `learner-practice-toolkit` — **Learner Practice Toolkit** — Worksheet + Tracker + Planner — **US$16.99**
- `exam-preparation-bundle` — **Exam Preparation Bundle** — Worksheet + Practice Assessment + Planner — **US$24.99**

## 4. Teacher product

- `teacher-lesson-plan-pack` — **HSK Teacher Lesson Plan Pack** — **US$19.99**

Licence: single-purchaser classroom use at one teaching site. Editable files may be adapted by that purchaser and handouts shared only with learners they personally teach. No resale, public upload, shared-drive distribution, sublicensing, transfer or use by another teacher.

## 5. Frozen delivery contract

- Every vocabulary PDF is generated from the full canonical release, never from `runtime-content-index.json` and never capped at 120 entries.
- Vocabulary rows include Hanzi, tone-marked pinyin, English meaning, part of speech and source ID.
- All PDFs must be searchable and must wrap English at word boundaries.
- Every ZIP includes the promised PDFs plus README/licence, manifest and checksums.
- Complete Library total must equal exactly 11,092 unique source IDs: 500 + 772 + 973 + 1,000 + 1,071 + 1,140 + 5,636.
- Product bundles must contain the exact component products listed above and must not duplicate, omit or silently replace a component.
- Store cards use `View details` and link to `/store/{productId}`. Every product has a real detail route with exact price, contents, audience, formats, licence, delivery facts and Stripe Test checkout.

## 6. Commercial safeguards

- One-time purchase; no subscription entitlement is implied.
- Stripe Test catalog and checkout amount must exactly equal this contract.
- Delivery access is 14 days; download limit is 3 successful downloads; a failed transfer does not consume a download.
- All learner products use the personal non-transferable study/print licence unless a more restrictive product-specific notice is shown.
- No live Stripe secret, token or credential may appear in source, logs, screenshots or committed files.
