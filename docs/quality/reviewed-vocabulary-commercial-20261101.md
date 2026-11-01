# Reviewed vocabulary commercial refresh

The public review corrected vocabulary fields after the original paid snapshots were frozen. This refresh creates new HSK6 and advanced snapshots rather than overwriting historical v1 files: eight HSK6 fields and 52 advanced fields now match the public catalog. All 11,000 current paid entries are compared against public Hanzi, reading, meaning and learner POS in a regression test.

| Product | New generation |
| --- | --- |
| HSK6 | complete-vocabulary-hsk123456-2025-v2 |
| Progression 4–6 | complete-vocabulary-hsk123456-2025-v2 |
| Advanced 7–9 | complete-vocabulary-hsk123456789-2025-v3 |
| Complete 1–9 | complete-vocabulary-hsk123456789-2025-v3 |

The 30 PDF/ZIP/sidecar delivery objects have approved SHA-256 values in `content/releases/reviewed-vocabulary-artifacts-20261101.json`. PDF metadata uses the frozen content review date, so local and CI generation can be compared byte for byte. ZIP contents also preserve their internal checksums, licences and source manifests. Prices, product IDs and purchase access rules remain the same.

The store's eight previews were rendered from these exact PDFs; provenance records include their current generation and PDF hash. The two opening previews changed visibly; unchanged interior images were still regenerated and rebound to the current files.

Local validation includes full advanced PDF extraction of all 5,600 IDs, readings and glosses, all HSK6 entries, ZIP internal checksums and 5,600/11,000 source-asset counts, plus visual inspection of the cover, interior, corrected 贴切 page and final entries. All 11,000 paid vocabulary fields match the public catalog. Typecheck and the production build pass. A deliberately damaged artifact is rejected by the publisher before remote writes.

## Publication and deployment closeout

PR #92 failed at the R2 management API (403/code 10000). PR #93's temporary Worker approach also failed (403, no access to the new Worker resource). Neither attempt switched the production website. The temporary publisher, cleanup calls and repeat vocabulary generation/upload steps have now been removed.

On 2026-11-01 the authenticated in-app browser uploaded the existing files through the Cloudflare R2 dashboard into the private `hskkit-commercial-exports` bucket: the v3 folder reported 20/20 successful files and the HSK6 v2 folder reported 10/10 successful files. The complete-1-9 folder was observed with all 16 objects. No bucket access permissions were changed.

Remote read-back was sampled, not performed for all 30 objects. The complete-1-9 bundle ZIP was downloaded from the dashboard: 15,523,408 bytes, SHA-256 `1f22af3fb6ae3828eb1fdf076a75a01a0958d7471bd71883ce1d2d3ac0d52431`, exactly matching the approved local file. Its manifest contains 11,000 source assets and its internal ZIP checksums passed.

`content/releases/reviewed-vocabulary-publication-20261101.json` records this evidence and binds it to the frozen 30-file checksum manifest. The deployment gate checks the exact current product generations, all delivery paths, upload batch coverage and sampled read-back checksum. This is a check of recorded publication evidence, not a new remote probe. Future generation changes cannot silently reuse this receipt. CI checks the same gate without regenerating or uploading the vocabulary files. The production workflow then builds and deploys the existing website Worker using the existing credential.

Live deployment and acceptance: pending the closeout deployment; the original paid versions remain active until that deployment succeeds.
