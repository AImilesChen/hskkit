# HSK 2 complete mock papers

Release route: `/hsk-test-prep/hsk-2/mock`, with A/B/C preparation pages. A is free; B/C use the existing active Pro subscription/trial/pass capability. No price, payment, database migration or schedule changes.

Each accepted paper has 60 scored items and nine unscored examples: listening 25, reading 25 and writing 10. Up to five minutes of preparation precedes a server-timed 55-minute attempt: listening 17, answer transfer 3, reading 25 and writing 10. Section writes are server-enforced; expiry triggers client submission and the server rejects expired answers. Leaving does not extend the original deadline.

The HSK2 API namespace, start keys, history and resume pointers are separate from HSK1. Choice answers and explicit single-Hanzi writing saves support idempotent retry, server persistence and reload. Writing inputs normalize whitespace and NFKC, accept one Hanzi or clearing, and use exact character scoring. Results expose raw 25/25/10 marks and per-item explanations, with listening scripts/audio after submission. No official scaled score or pass prediction is provided.

Runtime data is derived from hash-bound user-accepted A/B/C snapshots; accepted sources and recordings are unchanged. Student projections strip scored answers, scripts, explanations and component source identities. Protected ASSETS media delivery retains the existing direct-static-path middleware fence and performs Pro authorization before conditional/range access. Derivative component artwork includes the Arphic license, modifications and original glyph sources through the same media gate.

Validation before production: HSK1/HSK2 domain and regression checks, navigation contract checks, TypeScript, Next production build, isolated local D1 API/access checks and fresh Edge desktop/mobile review. Browser checks include Pro B playback, choice save/reload, local-only phase changes, component rendering, Hanzi write/reload, failed-save retry and result/script review. Local fixture account tokens and local clock changes never enter the production source or database.

Production publication/version and actual online verification are recorded separately after deployment in the local production report. This source note does not claim those checks have already passed. Existing cache-cleanup protection remains disabled.
