# Batch 11 scope — Placement and multiskill Practice closure

Frozen: 2026-08-22
Baseline: `4c9fd1e4869b4dd743695e5e58c73affd0a498e6`
Source of truth: `Stage-07-唯一总矩阵-v2.md/json`.

## ONLY
- Placement approved Listening evidence plus the existing honest no-Listening low-confidence fallback.
- Formal Practice for Vocabulary, Grammar, Reading and Listening across HSK 3.0 Levels 1–6 and one unified Advanced 7–9 band.
- Every question: standard/ref, level/band, skill, immutable content version, correct answer/explanation, source, QA and lifecycle status.
- Server-resumable sessions, idempotent answers, Mistakes, SRS, withdrawal fencing and historical version lookup.
- Placement and Practice result links into Practice and Planner.
- Desktop and 390×844 production closure flow.

## KEEP
- Stage 06 canonical design truth.
- Existing server-authoritative LearningState, revision conflict retries and guest/account ownership.
- HSK 1–6 published levels and honest unified Advanced 7–9 band; no fabricated separate HSK 8/9 list.
- Catalog v3 and formal audio source/license gates.

## FORBIDDEN
- Payment, formal advanced mocks, offline packs and PDF/PDF Pack.
- Legacy HSK 2.0 substitution, fake official scoring, fabricated source/license/QA claims.
- Full-suite testing or unrelated refactors.

## Targeted acceptance
`Placement → Result → Practice → immediate feedback → Mistakes → Review/SRS → Planner`, desktop and 390×844. Production QA data must be deleted by exact owner/record identity before the rollback tag is created.
