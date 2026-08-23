# Batch 16 — 38 Requirement evidence gate

Status: `FINAL GO`

Authority: `docs/stage07/Stage-07-唯一总矩阵-v2.md` (exactly 38 Requirement IDs; priorities unchanged).

Allowed result values: `PASS / FAIL-P0 / FAIL-P1 / FAIL-P2 / BLOCKED`.

This gate reuses frozen production tags and unchanged-code evidence. It does not rerun historical full-site suites. Batch 15 closure was promoted from commit `4ee28d1993447d1a08b7e88d349c7ad915d1a48c` to production Worker version `67b795e0-4079-4c89-8c72-3b03b22bc83f`; Stripe remains Test-only and Live remains `NO-GO`.

## Requirement evidence

- `REQ-LVL-01` — P0 — `PASS` — frozen matrix L3; production lineage through Batch 10–14; Batch 15 diff does not modify the version/standard gate.
- `REQ-LVL-02` — P0 — `PASS` — `tests/batch10-content-audio-contract.test.mts`; Batch 10 production tag; released Level 1–7 and explicit Level 8–9 gap remain unchanged.
- `REQ-LVL-03` — P1 — `PASS` — `tests/batch14-mock.test.mts`, `tests/batch14-mock-runtime.test.mts`; `/mock/advanced`; `rollback-batch14-mocks-20260823-2662519`.
- `REQ-LVL-04` — P0 — `PASS` — frozen matrix L2 plus Batch 14 immutable question snapshot/version contract.
- `REQ-AUD-01` — P0 — `PASS` — `tests/batch10-content-audio-contract.test.mts`; Batch 10 production tag.
- `REQ-AUD-02` — P0 — `PASS` — frozen matrix L2; mastery model unchanged by Batch 15.
- `REQ-AUD-03` — P0 — `PASS` — Batch 12 production tag and `tests/batch12-learning-system-contract.test.mts`.
- `REQ-AUD-04` — P0 — `PASS` — Batch 12 production tag and affected learning contracts; Batch 15 does not modify audio mastery.
- `REQ-AUD-05` — P1 — `PASS` — Batch 13 production tag and `tests/batch13-content-ai-contract.test.mts`; no pseudo speaking score.
- `REQ-LEARN-01` — P0 — `PASS` — Batch 12 production tag; `tests/batch12-learning-system-contract.test.mts`.
- `REQ-LEARN-02` — P0 — `PASS` — Batch 12 production tag; SRS/grade/idempotency contracts unchanged.
- `REQ-LEARN-03` — P0 — `PASS` — Batch 12 production tag; Practice→Mistakes/Review contract unchanged.
- `REQ-LEARN-04` — P1 — `PASS` — Batch 12 production tag; timezone/streak contract unchanged.
- `REQ-LEARN-05` — P0 — `PASS` — Batch 12 production tag; provider/guest merge contract unchanged.
- `REQ-LEARN-06` — P1 — `PASS` — Batch 12 production tag; Batch 15 adds owner-scoped asynchronous account export without weakening sync/data-request ownership.
- `REQ-LEARN-07` — P1 — `PASS` — Batch 12 production tag; offline recovery and conflict contract unchanged.
- `REQ-AI-01` — P1 — `PASS` — Batch 13 production tag; `tests/batch13-content-ai-contract.test.mts`.
- `REQ-AI-02` — P1 — `PASS` — Batch 13 production tag; provider failure/retry/safety contract unchanged.
- `REQ-PDF-01` — P2 — `PASS` — real `3,344,911`-byte, eight-page A4 PDF rendered without clipping/garbling, embeds Chinese/English/symbol fonts and retains searchable text; focused commercial gates and production promotion passed.
- `REQ-PDF-02` — P2 — `PASS` — Queue/R2 job reached `ready`; private owner-scoped short-lived single-use download returned `200` once and replay returned `409 DOWNLOAD_TOKEN_CONSUMED`; refund revoked ready jobs and the prior link returned `409 EXPORT_NOT_READY`.
- `REQ-PAY-01` — P1 — `PASS` — one real US$9.99 Stripe Test Checkout completed; signed `checkout.session.completed` produced one active entitlement with `0/3` downloads. Public production config is fail-closed (`enabled=false`, `stripeLive=NO-GO`) and the purchase CTA stays disabled even after disclosure acceptance.
- `REQ-PAY-02` — P1 — `PASS` — duplicate/event idempotency contracts passed; a real Stripe Test refund emitted `charge.refunded`, changed order/entitlement to refunded, revoked ready PDF/ZIP jobs and invalidated the pre-refund link without a second entitlement or debit.
- `REQ-TEST-01` — P0 — `PASS` — Batch 11 production tag; placement version/skill/degraded-listening contracts unchanged.
- `REQ-TEST-02` — P0 — `PASS` — Batch 11 production tag; non-official recommendation and retest evidence unchanged.
- `REQ-TEST-03` — P0 — `PASS` — Batch 11 production tag; Practice session/attempt/restore/idempotency unchanged.
- `REQ-TEST-04` — P0 — `PASS` — Batch 11 production tag; report/withdraw/version history contract unchanged.
- `REQ-TEST-05` — P2 — `PASS` — bounded official-content-safe advanced mock via `tests/batch14-mock.test.mts`, `tests/batch14-mock-runtime.test.mts`; Batch 14 production tag.
- `REQ-TEST-06` — P1 — `PASS` — Batch 11/12 planner handoff plus Batch 14 result→Planner production contract.
- `REQ-KNOW-01` — P0 — `PASS` — frozen matrix L2 and Batch 10 catalog production tag; unchanged.
- `REQ-KNOW-02` — P0 — `PASS` — frozen matrix L2; character 404/noindex boundary unchanged.
- `REQ-KNOW-03` — P1 — `PASS` — Batch 13 formal Grammar/Reading release and production tag.
- `REQ-KNOW-04` — P0 — `PASS` — Batch 10 production tag; sitemap/released-content gate unchanged.
- `REQ-PLAN-01` — P1 — `PASS` — Batch 12 and Batch 14 planner contracts and production tags.
- `REQ-OFF-01` — P2 — `PASS` — real `3,374,066`-byte offline ZIP (`SHA-256 0b45b03428eafcab744d04a4316dedb847cee3a4715d69adf5e50a8e6ff352b6`) contains PDF, `manifest.json` and `README.txt`; all 120 assets carry version/source/license references and unauthorized audio is excluded.
- `REQ-PDF-03` — P2 — `PASS` — deterministic manifest/generation version/checksum passed focused contracts and real-byte inspection; account-data export used its own private R2 object, `hskkit-account-export-v2` schema and 24-hour expiry without consuming commercial download entitlement.
- `REQ-PLAT-01` — P0 — `PASS` — frozen matrix L3; Batch 15 preview adds owner-scoped route denials and cross-user download denial.
- `REQ-PLAT-02` — P0 — `PASS` — frozen matrix L3; Batch 15 preserves authenticated identity, idempotency and audit IDs.
- `REQ-PLAT-03` — P0 — `PASS` — frozen matrix L3 plus Batch 15 pending/failed/cancelled/expired/revoked/unauthorized UI/API states.

## Current denominator

- Evidence rows: `38/38`
- `PASS`: `38`
- `BLOCKED`: `0`
- `FAIL-P0`: `0`
- `FAIL-P1`: `0`
- `FAIL-P2`: `0`

## Final GO rule

The final GO conditions are closed as follows:

1. Stripe Test Checkout → signed webhook → one entitlement → export: `PASS`.
2. Duplicate webhook idempotency and refund revocation of entitlement/jobs/issued link: `PASS`.
3. Production desktop (`1280px`) and exact CDP-emulated `390×844` acceptance: `PASS`; both production routes have no horizontal overflow, clipping or overlap.
4. Exact QA cleanup: D1 QA rows read back as zero; all four private R2 QA objects read back missing in a separate post-delete request; temporary cleanup Worker was deleted (`404`); Queue delivery was resumed with one producer and one consumer.
5. Final denominator: `38/38 PASS`, `P0=0`, `P1=0`, `P2 failures=0`, `BLOCKED=0`.
