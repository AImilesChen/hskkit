# Batch 13 — frozen release checklist

This is the only Batch 13 release list. Counts are minimum publishable units, not claims of exhaustive official HSK coverage. Levels 7–9 remain one advanced band in the catalog while the listening progression exposes three labelled advanced tasks.

## Grammar — 7 formal lessons

- HSK 1: `basic-shi-negation`
- HSK 2: `comparison-with-bi`
- HSK 3: `ba-sentence-basics`
- HSK 4: `condition-with-zhiyao`
- HSK 5: `contrast-with-jinguan`
- HSK 6: `formal-causation-yu-youyu`
- HSK 7–9 advanced band: `advanced-concession-guran`

Each lesson must be in the active formal release, include pattern/explanation/examples, expose one trusted exercise, and link to a released reading.

## Reading — 7 formal lessons

- HSK 1 / detail / easy: `family-weekend-plan`
- HSK 2 / detail / easy: `weekend-travel-plan`
- HSK 3 / sequence / medium: `morning-study-routine`
- HSK 4 / purpose / medium: `library-evening-hours`
- HSK 5 / inference / medium: `flexible-work-schedule`
- HSK 6 / argument / hard: `community-renewal-debate`
- HSK 7–9 / critical-evaluation / advanced: `evidence-and-policy-evaluation`

Each passage must be in the active formal release, declare question type and difficulty, include vocabulary/translation, expose one trusted exercise, and link to released grammar.

## Listening — 9 formal tasks

- L1 tone: `hsk1-tone-pairs`
- L2 syllable: `hsk2-syllable-discrimination`
- L3 basic dictation: `hsk3-sentence-dictation`
- L4 sentence detail: `hsk4-sentence-detail`
- L5 paragraph inference: `hsk5-paragraph-inference`
- L6 context intent: `hsk6-context-intent`
- L7 longer discourse: `hsk7-longer-discourse`
- L8 formal briefing: `hsk8-formal-briefing`
- L9 formal argument: `hsk9-formal-argument`

Every task must use an authorized, approved, published audio asset from a checked manifest, require verified playback before answer, expose a trusted exercise, and write attempts into the shared Mistakes/SRS/Today learning state.

## AI closure

- Account-only. Guests see a deterministic non-AI path and are not allocated AI quota rows.
- Daily allowance 10, rate 6/minute, one in-flight reservation per account, one use only after a successful validated output.
- Provider timeout is bounded; at most one retry for transient timeout/429/5xx. Invalid/safety failures are not retried.
- Failed requests release reservations and never increment used quota.
- Prompt uses only the trusted exercise plus the relevant saved answer, or deterministic-plan aggregates; no full learning history.
- Strict JSON/plain-text output validation rejects unsafe claims, HTML and Markdown.
- Every AI result/fallback provides a report-problem action and a non-AI continuation.

## Release gate

Batch 13 is NO-GO if the formal lists are below 7 Grammar, 7 Reading or 9 Listening; if any listed item is outside the active release/approved audio manifest; if any module bypasses shared Practice/Mistakes/SRS/Today persistence; or if guest/provider failure can consume AI quota. Only Batch 13 focused contracts, affected type/build checks and exact production flows are run; no full historical test sweep.
