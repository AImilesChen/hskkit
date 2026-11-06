# Storage maintenance

Automatic page-cache cleanup was removed at the user's request on 2026-11-06. The deployed export Worker has no page-cache cleanup handler or PAGE_CACHE_R2 binding. No daily cache-cleanup schedule is installed. Future production deployments keep this disabled state.

Public page caches remain in the private hskkit-page-cache bucket. Commercial resources remain in hskkit-commercial-exports. The completed, explicitly confirmed manual cleanup is retained; no additional object deletion is requested by this change. Regional OpenNext caching remains enabled.

The pre-existing */15 * * * * schedule continues to maintain expired commercial exports. This schedule predates the cache project. The export cleanup validates fresh expired/revoked state, the exact owner/job object path and R2 ownership metadata; failures remain retryable. It does not delete formal products, fonts, orders, entitlements, download ledgers or audit records.

Production publishing no longer registers cache-retention releases. It deploys the export-only Worker and verifies that PAGE_CACHE_R2 is absent, the disabled marker is set and the original export schedule remains. The main app is not rebuilt solely to disable maintenance.

Validation uses the existing behavior tests, targeted TypeScript/lint, actual Worker deployment and read-only settings verification. Diagnostic and cache-retention test utilities may remain in source, but are not called by the deployed scheduled handler.
