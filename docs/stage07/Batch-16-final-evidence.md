# Batch 16 — 38 Requirement evidence gate

Status: `IN PROGRESS`

Authority: `docs/stage07/Stage-07-唯一总矩阵-v2.md` (exactly 38 Requirement IDs; priorities unchanged).

Allowed result values: `PASS / FAIL-P0 / FAIL-P1 / FAIL-P2 / BLOCKED`.

This gate reuses frozen production tags and unchanged-code evidence. It does not rerun historical full-site suites. Batch 15 rows remain `BLOCKED` until Stripe Test E2E, production promotion, desktop/390×844 production acceptance and exact QA cleanup are complete.

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
- `REQ-PDF-01` — P2 — `BLOCKED` — focused generator tests and preview real-byte/font/searchability QA pass; production promotion waits on Stripe Test E2E.
- `REQ-PDF-02` — P2 — `BLOCKED` — Queue/R2 ready state, cancel/expiry/retry, owner-only short-lived single-use download preview evidence pass; production promotion waits on Stripe Test E2E.
- `REQ-PAY-01` — P1 — `BLOCKED` — implementation is Test-only and Live fail-closed; no usable `sk_test_` is configured for real Checkout E2E.
- `REQ-PAY-02` — P1 — `BLOCKED` — webhook idempotency, refund and revocation code/contracts exist; real Stripe Test webhook/refund E2E needs Test secret and webhook secret.
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
- `REQ-OFF-01` — P2 — `BLOCKED` — preview real offline ZIP and manifest evidence pass; unauthorized audio is excluded; production promotion waits on Stripe Test E2E.
- `REQ-PDF-03` — P2 — `BLOCKED` — deterministic manifest, generation version, checksum and account-data isolation pass in focused tests/preview; production promotion waits on Stripe Test E2E.
- `REQ-PLAT-01` — P0 — `PASS` — frozen matrix L3; Batch 15 preview adds owner-scoped route denials and cross-user download denial.
- `REQ-PLAT-02` — P0 — `PASS` — frozen matrix L3; Batch 15 preserves authenticated identity, idempotency and audit IDs.
- `REQ-PLAT-03` — P0 — `PASS` — frozen matrix L3 plus Batch 15 pending/failed/cancelled/expired/revoked/unauthorized UI/API states.

## Current denominator

- Evidence rows: `38/38`
- `PASS`: `32`
- `BLOCKED`: `6`
- `FAIL-P0`: `0`
- `FAIL-P1`: `0`
- `FAIL-P2`: `0`

## Final GO rule

Do not mark this file `FINAL GO`, update the frozen matrix, deploy commercial promotion, or create the final rollback tag until:

1. Stripe Test Checkout → signed webhook → one entitlement → export is proven with a real Test transaction.
2. Duplicate webhook is idempotent; refund revokes entitlement, jobs and issued links.
3. Production desktop and exact `390×844` flows pass.
4. Exact D1/R2/Queue/Stripe Test QA cleanup is read back.
5. All six `BLOCKED` rows become `PASS`, yielding `38/38 PASS`.
