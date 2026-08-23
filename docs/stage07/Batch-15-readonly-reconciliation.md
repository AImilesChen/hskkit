# Batch 15 Read-only Reconciliation and Frozen Implementation Breakpoint

Status: FROZEN
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
