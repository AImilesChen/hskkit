# Advanced batch 1 — production release attempt, 2026-11-01

The user authorized releasing the reviewed first batch and catalog fixes before
continuing the remaining example review.

- PR: https://github.com/AImilesChen/hskkit/pull/85 — merged.
- Production merge: `199509e8eb05e0a49aa65effa198cf5273e029b4`.
- Run: https://github.com/AImilesChen/hskkit/actions/runs/41282534907.
- Worker/Next.js build: successful.
- D1 migration 0055: failed at the Cloudflare import API with authentication error
  code 10000. Wrangler identified the configured credential as an account API token.
- Worker upload and deployment: not reached. This attempt did not publish the new
  Worker, and production verification remains pending.

Further review found that public vocabulary routes use the build-time static
catalog, not the legacy D1 search table. The import error did not demonstrate a
need for the user to change permissions. The unnecessary D1 prerequisite was
removed in PR 86, merged as `1f20d1ddf4e218bd25ea1b3641c11bb07befe3a0`.
The original Worker deployment workflow and existing credentials were restored.
See hsk789-release-routing-review.md for code-path evidence.

Production deployment and online verification are tracked below; the initial
failed run is retained as evidence and is not reported as a successful release.

## Successful retry and online verification

- PR 86 restored the existing deployment workflow.
- Run https://github.com/AImilesChen/hskkit/actions/runs/41283792772 completed
  successfully using the existing repository credential; no token update was needed.
- Live checks returned 200 with the reviewed examples for eight first-batch entries
  spanning runtime and catalog fallback, plus the final advanced word 做主.
- The public search API returned all four corrected glosses for 霸道, 辩证, 标 and
  标致. The public attribution file contained exactly 500 reviewed entries.
- Advanced flashcards returned 20 unique canonical IDs and different sets for
  different seeds.
- The unused legacy D1 table was not migrated. Actual public search data was updated
  with the deployed static catalog.
