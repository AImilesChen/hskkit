# HSK mock exam subscription value — 2026-11-09

Status: local verification complete; production release authorized on 2026-11-09. Deployment outcome is recorded separately in `output/subscription-exam-value-production-20261109.json`.

## User-facing changes

- Free: six complete A papers, one at every level from HSK 1–6.
- Pro: all eighteen A/B/C papers, including twelve additional B/C papers beyond Free.
- Pricing leads with complete papers, then daily learning, AI allowance, Focused Review, history and devices. Monthly/yearly benefits stay identical. The comparison table and FAQs use the same catalogue.
- The pricing page shows native screenshots of HSK6 A question 1 and its submitted explanation/transcript. A local guest sample was used; no real learner data is shown. Two lazy-loaded JPEG assets total 139,028 bytes.
- Homepage, account membership and test hub show the same exam offer and direct entries. The hub distinguishes complete timed papers from free fifteen-question skills checks, including its metadata and collection schema.
- B/C preflight distinguishes anonymous, Free, valid Pro, trial, expired access and unavailable access. Verification failures expose retry rather than an upgrade prompt. Existing server authorization remains authoritative.
- Results offer the next different paper. Free users see the Pro plans entry; Pro users can open the next included paper. Existing same-paper retakes remain available and retain their original questions.

## Preserved product boundaries

Prices and billing handlers are unchanged: US$5.99 monthly / US$49 yearly. Paid Pro retains 500 monthly AI credits; the eligible welcome trial has 20 credits. Standard review remains unlimited on both plans. Store PDFs remain separate purchases. Writing remains reference-based self-review; no official score, automatic writing assessment or AI exam-grading claim was added.

No paper questions, audio, answer keys, account data, database schema, backend entitlement, Cloudflare configuration or scheduled cleanup rules were changed.

## Verification

Checks run in the isolated production-source preview at `tmp/benefits-20261109/source`, with only the scoped changes overlaid. This avoids old temporary source copies in the main workspace being included in TypeScript checks.

- 62 pricing, entitlement, mock catalogue, formal exam and account tests passed.
- Eight homepage-discovery/navigation tests passed.
- TypeScript check and optimized production build passed.
- Edge checks at 1440, 390 and 375 pixels: pricing counts, screenshots, all six links, monthly/yearly benefit parity, responsive overflow, homepage and account entries.
- Six B-paper UI states checked: anonymous, Free, Pro, trial, expired and unavailable; retry recovery checked.
- Pricing additionally checked with read-only mocked account responses for anonymous, Free, trial, active paid, scheduled cancellation, expired and unavailable states. No payment was initiated.
- Real local API flow: guest A start/submission/result; Free B request rejected by server; Pro B start/submission and direct next-paper C link.
- No real payment or production account modification was performed.

Evidence: `tmp/benefits-20261109/browser-checks.json`, test/build logs, native screenshot provenance in `sample-evidence.json`. Scope is listed in `tmp/benefits-20261109/scope.json`.
