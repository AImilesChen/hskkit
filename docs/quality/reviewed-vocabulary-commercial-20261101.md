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

The production workflow detects only changed product generations. It generates those deliveries, verifies every local checksum and template identity, uploads to new R2 keys, downloads each object again and verifies SHA-256, then builds and deploys the Worker. If any artifact check or upload fails, the new catalog versions are not deployed. Existing D1 privileges are not part of this process.

This document describes the reviewed implementation and local acceptance; the deployment workflow provides the authoritative remote publication and read-back result.
