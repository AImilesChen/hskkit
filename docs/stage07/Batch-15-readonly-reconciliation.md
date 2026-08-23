# Batch 15 Read-only Reconciliation and Frozen Implementation Breakpoint

Status: CLOSED — FINAL GO
Baseline branch: `stage07-content-foundation`
Baseline commit: `05a952435f8bb487757104f7a6d73f908e70a910`
Scope authority: PRD v4.0, Pricing v4.0, Compliance v1.4, Copy Freeze v1.3, Stage 06 canonical manifest and FINAL-GATE.

## Existing / partial / absent

- User account data export: PARTIAL. Owner-scoped JSON generation exists in `account_data_requests`; it is synchronous/manual-process and not R2/Queue-backed.
- Commercial configuration and `/pricing`: ABSENT.
- Stripe checkout/webhook/refund/reconciliation: ABSENT.
- Order/payment/entitlement/PackPurchase ledgers: ABSENT.
- `/pdf-packs` and `/exports`: ABSENT.
- ExportJob async lifecycle/cancel/expiry/revocation: ABSENT.
- Private R2 artefact and permission-controlled short-lived signed app download: ABSENT.
- Offline pack and advanced PDF generation: ABSENT.
- Queue and R2 bindings: ABSENT; D1 exists.
- Batch 15 focused tests: ABSENT.

## Rights/content gate

- 11,107 content assets are `published + approved + authorized`, Level 1–7 only.
- Text content carries traceable `source_ref` and `license_ref` (`MIT+CC-BY-SA-4.0`).
- Three audio assets are approved/authorized for streaming/cache but explicitly set `usageRights.offlineRedistribution=false`; all audio must be excluded from offline/PDF artefacts.
- Pack selection is one Level, max 120 eligible word/example rows and max 20 generated exercises. Levels 8–9 fail closed because no released catalog exists.

## Frozen implementation breakpoint

1. Add Batch 15 D1 entities and immutable/idempotent ledgers.
2. Add private R2 and Queue bindings; queue generation accepts an explicit environment and never trusts client asset IDs.
3. Add Stripe Test checkout/webhook/refund path only. Stripe Live remains NO-GO.
4. Add owner-scoped `/pricing`, `/pdf-packs`, `/exports`, checkout return states and short-lived single-use download links.
5. Generate real PDF and offline ZIP from server-selected authorized catalog only; embed fonts, attribution, generation version and manifest checksum.
6. Focused RED/GREEN contracts only, then affected build, real bytes QA, desktop/390x844 production QA and exact QA-data cleanup.

The non-authoritative Batch 15 compliance addendum remains excluded from the authority chain.

## Final implementation and production closeout

- Production source commit: `4ee28d1993447d1a08b7e88d349c7ad915d1a48c`.
- Main Worker production version: `67b795e0-4079-4c89-8c72-3b03b22bc83f`.
- Commercial export Worker version: `de319d7e-c34d-454e-bf30-ff06c9c39279`.
- Focused gates: Batch 15 contracts `9/9 PASS`; post-production availability fix contract `5/5 PASS`; TypeScript and production build `PASS`.
- Real Stripe Test E2E: one US$9.99 Checkout, signed completion webhook, one entitlement, real PDF/ZIP generation/download, one test refund, revocation and old-link invalidation. No payment, refund or export chain was repeated during final cleanup.
- Real artifacts: eight-page searchable PDF (`3,344,911` bytes) and offline ZIP (`3,374,066` bytes; SHA-256 `0b45b03428eafcab744d04a4316dedb847cee3a4715d69adf5e50a8e6ff352b6`).
- Account data: asynchronous private R2 export with `hskkit-account-export-v2`, 24-hour expiry and no commercial entitlement debit.
- Cleanup: scoped D1 QA rows read back as zero; four private R2 QA objects read back missing in an independent request; temporary cleanup Worker removed; `hskkit-commercial-exports` delivery resumed with one producer and one consumer.
- Production UI/API: `/pricing`, `/pdf-packs`, `/exports`, `/account` and commercial config route return successfully; desktop and exact `390×844` mobile geometry/visual acceptance passed. Public purchase remains unavailable and disabled while config reports `enabled=false`; Stripe Live remains `NO-GO`.
