# HSKKit Store Stitch truth source — 2026-08-28

Status: `ADOPTED / FROZEN FOR IMPLEMENTATION`

Canonical Stitch project: `projects/5509035292021811601`
Design system: `assets/85f3c5b1e8e5465c86bfd3745bfe751c` (`HSKKit Blue Learning v1.1`)

## Adopted screens

- Desktop Store `/store`
  - Screen: `projects/5509035292021811601/screens/2d056b23a3f74539a3b42d038ca431c7`
  - Title: `ROUTE · /store · DESKTOP · ADOPTED · Stage06`
- Mobile Store `/store`
  - Screen: `projects/5509035292021811601/screens/56e5c2d9ba384f1086c56b89c54290f2`
  - Final Stitch audit: HSKKit branding only; frozen 16-product catalog and prices; direct Stripe Test checkout; no cart or shipping.
- Desktop Worksheet detail `/store/worksheet-pack`
  - Screen: `projects/5509035292021811601/screens/503793da2ba04df190c86d424340793d`
  - Final Stitch audit: HSKKit branding; US$9.99; samples before purchase; direct Stripe Test checkout; 14-day access; 3 successful downloads; personal non-transferable licence.
- Mobile Worksheet detail `/store/worksheet-pack`
  - Screen: `projects/5509035292021811601/screens/32dfa342d2b4488b99d28ad67806e0ef`
  - Final Stitch audit: HSKKit branding; `Sample pages you can read`; US$9.99; direct Stripe Test checkout; 14-day access; 3 successful downloads; personal non-transferable licence.

## Frozen implementation contract

The exact commercial and licence contract is authoritative in:

- `docs/pricing/hskkit-store-frozen-optimization-contract-2026-08-28.md`

Screens must not override that contract. In particular:

- Catalog: exactly 16 products.
- Prices: Level 1–9 and all five practical resources US$9.99 each; Advanced 7–9 Bundle US$24.99; Complete 1–9 Bundle US$64.99.
- Checkout: direct single-product Stripe Test checkout; no cart, shipping, or live charge.
- Delivery: 14-day access and 3 successful downloads per delivery; failed or interrupted downloads do not consume allowance.
- Learner products: personal, non-transferable study and print licence.
- Teacher Lesson Plan Pack: single-purchaser classroom licence for learners personally taught by the purchaser at one teaching site; no resale, public upload, shared-drive distribution, sublicensing, transfer, or use by another teacher.

## Implementation alignment

The current implementation uses the Store catalog as the discovery and comparison page, resource detail routes as sample-first decision pages, and a final consent step before Stripe Test checkout. Runtime facts remain sourced from `/api/v1/commercial/config`; the UI fails closed if commercial configuration is unavailable.

Discarded generation attempts and raw model responses are intentionally not committed because they contained superseded cart, pricing, branding, and catalog suggestions.
