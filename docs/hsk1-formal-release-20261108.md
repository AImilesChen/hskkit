# HSK 1 complete mock exams · release scope

User requested production publication after accepting Papers A, B and C. This release connects those frozen papers to a dedicated exam flow. Paper A is free; active Pro access, including an existing Pro trial/pass, unlocks B/C. Existing free 15-question skills checks remain available.

Entry: `/hsk-test-prep/hsk-1/mock`, also linked from Tests navigation, the practice-test center and the HSK 1 skills-check page. Pricing benefits/comparison now identify the complete papers. Only the public introduction is added to Sitemap; attempt pages are noindex.

## Implemented

- 40 scored questions per paper, 8 unscored examples; original images, pinyin and accepted audio. Listening 20, reading 20; raw scores only.
- Untimed preparation (allow up to 5 minutes), followed by server-timed 12-minute listening, 3-minute transfer/check and 20-minute reading. Leaving does not pause the deadline.
- Server-owned attempts, answer validation, idempotent saves/submission, revision checks, resume, timeout submission and recent-attempt history. Results include section marks, explanations and listening scripts/recordings.
- Answers/scripts are excluded from pre-submission student projections. B/C data and media require server-side Pro access; the old skills-check API rejects formal attempt IDs.
- Media are bundled static assets. `/formal-media/*` is Worker-first and blocked by middleware; only the authorized media API uses the ASSETS binding to stream it. No R2 upload or public-bucket change is required. The local Next development branch reads the same files from disk because its proxy lacks ASSETS; production uses ASSETS, not the development filesystem branch.
- Reuses existing `mock_sessions` / `mock_attempts`; no production schema migration, credentials, payments, subscription prices or scheduled tasks changed.

## Pre-release evidence

- 29 relevant tests passed: formal papers, scoring, section timing, public projection, access decisions, media references, existing mock runtime, level entries and pricing access.
- Isolated source typecheck passed; Next production build passed. Source is based on production commit `c7c0f78902af2fbb5826a44b9a2d085308df3553`; unrelated working-tree changes are excluded from the explicit publication scope.
- 19 local HTTP checks passed against real local D1: start, retries, save/resume, section locks, ownership, legacy-route isolation, anonymous Pro denial, media-path blocking/range delivery, submit/results/history.
- 9 additional local fixture-account access checks passed: Free denial, Pro access to both B/C data and audio, expired-Pro denial. No real account/payment was modified.
- Fresh headless Edge at 1440px and 390px verified landing, Pro start, actual audio playback, answer persistence after refresh, server phase locks, scoring/explanations/scripts and no horizontal overflow or page errors. Pictures were awaited and visually reviewed. Reading-clock advancement used a local fixture DB update only; no testing endpoint exists in the application.
- All 152 runtime media files were uploaded with Git blob SHA checks; the three complete audio hashes match the accepted recordings. Frozen paper source hashes are retained in runtime provenance.

Local evidence is under `tmp/hsk1-formal-release-20261108`. A Windows OpenNext adapter build encountered local generated-directory locking; its success is not claimed. The existing Linux production workflow performs the authoritative Cloudflare Worker build. Deployment and production smoke-check results are recorded separately after they actually complete.

## Rollback

Previous production source is commit `c7c0f78902af2fbb5826a44b9a2d085308df3553`, tree `ebf99507c773fd3fab0fb870c97ce0fc8455b456`. A rollback can create a new commit with that tree and the release commit as parent, then run the existing deployment pipeline. No database rollback is required. Existing scheduled cleanup remains disabled.
