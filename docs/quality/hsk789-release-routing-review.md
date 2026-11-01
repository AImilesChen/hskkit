# Advanced first-batch release: verified routing dependencies

PR 85 merged the first 500 reviewed examples and the five-digit ID fixes. Its
production build succeeded, but an added D1 migration step failed at the import
API (Cloudflare authentication code 10000), preventing Worker deployment.

The error alone did not establish that the user needed to grant new permissions.
Review of the actual production paths showed that making this migration a release
prerequisite was unnecessary:

- `src/lib/content/catalog-route.ts` calls `searchPublicCatalogWords`; its optional
  legacy database parameter is unused.
- `src/app/api/v1/dictionary/suggestions/route.ts` calls `suggestPublicCatalogWords`.
- `src/lib/dictionary/runtime-word.ts` resolves details through the bounded runtime
  snapshot and `findPublicCatalogWordById`.
- `src/lib/dictionary/p2-server.ts` loads practice/context rows from the public index.
- `src/lib/learning/today-content.ts` and the learning API resolve catalog words
  through that same public index. User learning-state storage still uses D1, but
  this vocabulary release does not change its schema or stored user data.
- The legacy SQL search functions have no production callers outside their own
  definitions. `docs/quality/hsk23-2025-release-audit.md` already documented that a
  production D1 migration is not required to serve migrated vocabulary.

Restore the existing Worker deployment workflow, with no extra D1 operation. The
corrected public search data is deployed with the updated static catalog and
Worker. Migration 0055 and its standalone verifier remain available for separate
legacy-table maintenance; no claim is made that that table was migrated.

This is a correction of the release dependency, not a relaxation of a required
data gate. Validate the actual public API/search suggestions, corrected detail
pages, examples and flashcard ordering after the Worker deploys. Existing
deployment authorization and credentials continue to apply.
