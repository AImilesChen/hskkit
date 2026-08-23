# Batch 14 — Mock release contract

This is the only Batch 14 scope. It turns the existing `/mock/basic` and `/mock/advanced` safety pages into bounded, real practice assessments. Results are HSKKit learning feedback, not official HSK certificates or official score predictions.

## Basic Mock

- Eligible bank: exactly 18 approved Batch 13 exercises — one Grammar, one Reading and one Listening item for each HSK 3.0 Level 1–6.
- Timer: 30 minutes, persisted server-side.
- Flow: start → per-answer autosave/idempotent replay → refresh restore → submit/timeout submit → score and explanations → Mistakes/SRS/Planner.
- Scoring: raw correct/18 and percentage only. No official scaled score claim.

## Advanced Mock

- Unified `HSK 7–9 advanced` ability model; never emits a precise single-level official score or a recommended HSK 7, 8 or 9.
- Eligible bank: exactly 5 approved Batch 13 exercises — one advanced reading task, one advanced pragmatic/argument task and three approved listening tasks labelled 7, 8 and 9.
- Timer: 20 minutes, persisted server-side.
- Result: one truthful ability interval (`developing`, `functional`, `strong`) plus dimension evidence and Planner entry.

## Traceability and fail-closed gates

- Question-set version: `hsk3-batch14-mock-v1`.
- Scoring versions: `basic-raw-v1` and `advanced-band-v1`.
- Every issued session locks immutable question snapshots containing question ID, content ID/version, band/dimension, options, answer key, explanation and source release.
- New starts fail closed unless exact counts, approval, authorization, publication, scoring version and required dimension coverage pass.
- Withdrawn questions are excluded from new sessions. Existing submitted attempts/results remain readable from their locked snapshots.
- Attempts preserve owner, session, question-set version, scoring version, timestamps, answers and result.

## Release gate

NO-GO until both production paths pass at desktop and exact `390×844`, QA rows are precisely removed, and the remote rollback tag points to the final production commit:

1. `Basic Mock → submit → result → Mistakes/SRS`
2. `Advanced Mock → submit → unified ability interval → Planner`
