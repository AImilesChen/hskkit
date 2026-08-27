# Planner v3 release and rollback

## Forward release order

1. Generate only `30-day-planner` without overriding `GENERATION_VERSION`; it must resolve to `p0-p1-v3`.
2. Upload `product.zip` and `product.manifest.json` to `system/artifacts/p0-p1-v3/30-day-planner/` and verify both objects plus the sidecar checksum.
3. Deploy the application and commercial export worker. The export API resolves the current catalog delivery, so legacy PDF entitlement rows request the v3 ZIP during this transition window.
4. Apply `migrations/0021_planner_zip_entitlements.sql` and verify no active or refund-pending planner entitlement remains `pdf`.
5. Request and download one authorized planner export; verify ZIP identity, checksum, file list, and that exactly one successful download is debited.

Do not overwrite or delete the `p0-p1-v2` planner PDF artifact. It is the rollback artifact.

## Rollback order

1. Before changing application code, run `scripts/rollback-planner-v3.sql` against production D1 and verify active/refund-pending planner entitlements are `pdf` and no unfinished planner ZIP job remains.
2. Roll back the application and commercial export worker to the approved pre-v3 tag. The old application will request the preserved `p0-p1-v2` PDF.
3. Verify an authorized existing buyer can request and download the PDF. Previously ready v3 ZIP jobs remain downloadable.

If v3 is released again after a rollback, re-run `migrations/0021_planner_zip_entitlements.sql` explicitly after the v3 application and worker are deployed; D1 may already record migration 0021 as applied.