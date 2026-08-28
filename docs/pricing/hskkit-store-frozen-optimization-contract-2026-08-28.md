# HSKKit Store — frozen optimization contract

Status: FROZEN for implementation and Stripe Test verification
Date: 2026-08-28
Scope: `/store`, reusable practical-resource detail pages, Stripe Test checkout states, digital-product fulfillment, production QA and rollback. Stripe Live remains out of scope.

## 1. Catalog and price freeze

- Individual HSK 3.0 Level 1–9 PDF packs: US$9.99 each.
- Advanced 7–9 Bundle: US$24.99.
- Complete 1–9 Bundle: US$64.99.
- Five practical resources: US$9.99 each.
- These are one-time products, separate from Pro.
- Current deployment remains Stripe Test mode; no live card charge may occur.

## 2. Delivery freeze

- Private access: 14 days after payment confirmation.
- Allowance: 3 successful downloads per delivery.
- Failed or interrupted downloads do not consume allowance.
- Level product: one searchable PDF.
- Bundle: one delivery per included level plus one combined ZIP.
- Practical resources: generated, versioned PDF/ZIP/CSV/XLSX/DOCX/PPTX/MP3 contents exactly as listed by the product contract and verified by artifact tests.
- Levels 7–9 use one canonical advanced source set and may not be presented as three independent corpora.
- Practice assessments are original, unofficial resources and may not claim official exam equivalence.

## 3. Licence freeze

- Learner products: personal, non-transferable study and print use.
- Teacher Lesson Plan Pack: single-purchaser classroom licence. The named purchaser may adapt the editable files and print/share student handouts only with learners they personally teach at one teaching site. No resale, public upload, shared-drive distribution, sublicensing, transfer, or use by another teacher.
- Checkout consent, product facts, Terms, generated README and manifest must use the matching licence for the selected product.

## 4. UX freeze

- Product evidence precedes checkout pressure: real cover/sample, outcomes, exact included files, fit/not-fit, formats and delivery limits.
- Practical-resource cards route to independent detail pages before checkout.
- Level and Bundle products use one explicit selection/confirmation step.
- Desktop and exact 390×844 mobile layouts use the canonical HSKKit Stitch project and design system.
- Mobile has no horizontal overflow and every actionable target is at least 44 CSS pixels.
- Required states: loading, config failure, unavailable, unaccepted consent, opening checkout, login return, duplicate active product, checkout failure, success/cancel return and private fulfillment/download states.

## 5. Explicit exclusions

- No Stripe Live activation, real charge, tax automation change, price increase, subscription change, lifetime access, future-update promise, unlimited downloads or official-endorsement claim.
- No new SKU, bundle or content-production expansion.

## 6. Release gate

- Candidate must pass targeted tests, full project tests, typecheck, lint, production build and OpenNext build.
- Independent desktop/mobile browser QA must verify real content, routing, controls, network/console, Test checkout states and final delivery bytes.
- Only after QA GO may the candidate be committed, pushed, deployed, production-verified and marked with a remote rollback tag.
