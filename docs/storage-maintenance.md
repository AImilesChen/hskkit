# Storage maintenance

Production releases separate public page caches (`hskkit-page-cache`) from commercial resources (`hskkit-commercial-exports`). Both buckets remain private. Old Worker versions retain their original bindings; no cache or commercial file is copied during cutover.

## Release and rollback protection

The production workflow verifies a single Worker version at 100% traffic and a matching public `BUILD_ID` before writing its release record under `system/cache-releases/` in the dedicated cache bucket. Use this workflow for releases; an unrecorded deployment or manual rollback freezes cache cleanup until the registry is reconciled.

The existing commercial export Worker's 15-minute schedule also performs bounded cache maintenance. It protects the active version and the two most recent distinct rollback builds. An older build becomes eligible only 72 hours after its successor was deployed. Recently written objects remain protected as well. Each run inspects at most 500 cache objects across the dedicated and legacy buckets, plus bounded release-marker listings. Only exact hashed `.cache` and `.fetch` keys beneath `system/opennext-cache/` are accepted. Production identity is rechecked immediately before deletion.

Once three distinct verified releases use the dedicated cache bucket, an immutable cutover timestamp starts a separate 72-hour grace period. Only after that grace expires may the old commercial bucket's cache prefix be cleaned. Formal resources, fonts, blog media, user exports, and every other prefix are excluded from this cache operation.

`STORAGE_CACHE_CLEANUP_MODE=dry-run` disables cache deletion. `apply` enables the guarded rules. A registry mismatch, unknown key shape, public build lookup failure, invalid timestamp or exceeded scan bound stops cache deletion. Aggregate status is written to `system/maintenance/cache-latest.json`; legacy cleanup status is written to `legacy-latest.json`. These objects contain no user names, private filenames or credentials. A blocked status must not be reported as a successful cleanup.

## Existing export expiry

Export expiry remains on its existing schedule and uses the database's existing access-expiry timestamps. Before deleting any object, maintenance rechecks the job's expired/revoked state, exact owner/job path, and R2 ownership metadata. It clears the database object reference only after successful deletion or proof that the object is absent. Individual failures remain retryable and do not prevent processing other expired files. No order, entitlement, download ledger or audit record is deleted by the object cleanup helper.

## Cache reads and validation

OpenNext uses its short-lived regional cache (up to one minute), keeps tag checks enabled, and does not perform an R2 background read on every regional hit. This is separate from retention and does not extend an export's access window. It applies to OpenNext incremental caching, not private account API responses.

Run `node --test tests/storage-maintenance.test.mts`, `npx tsc --project tsconfig.storage.json`, and the scoped lint checks. The check workflow also builds the app and bundles the commercial Worker without deployment. Full local typechecking may exceed the legacy catalog's default Node heap; the clean CI build uses an explicit 6 GB heap.

After deployment, verify the main Worker's cache binding, the commercial Worker's additional cache binding, and the unchanged cron/queue configuration. Rerun only the `runtime` check job after the next scheduled invocation to read its aggregate report. GitHub verification artifacts expire after seven days. Keep raw object inventories and private filenames out of public repository commits and workflow logs.
