# CPU and cache optimization — 2026-11-09

The read-only inventory run 42633030303 used the existing deployment token, without expanding permissions or reading object bodies. Adaptive aggregate CPU from 2026-10-18 00:00 to 2026-11-09 14:16 UTC totals approximately 129.64 million CPU milliseconds: HSKKit 112.10M (86.47%), AI Career Test 5.43M (4.19%), Fitrooted 4.85M (3.74%), AI Editor 4.73M (3.65%). HSKKit contributes about 95.99% in the preceding 24 hours. These are analytics aggregates, not invoice allocations.

## Runtime changes

- Enable the adapter's public SSG/ISR cache interception and keep route preloading disabled. The local before/after workerd exercise showed dictionary, levels, test preparation, pricing and Chinese 1 cached pages bypassing the complete Next server; all six sampled HTML response hashes remained identical. Direct and encoded private media paths remained blocked and unauthorized B/C files remained 401.
- A strictly cookie-free account lookup can return the same anonymous JSON without initializing Next, session storage or learning history. Cookie-free reward requests retain the existing 401 response before body parsing. Every cookie-bearing request, all state-changing account operations, authentication routes and paid resources continue through the original code. Blocked crawler handling remains in the existing middleware. Responses use private/no-store.
- The build patch preserves the existing feedback email injection and middleware-manifest compatibility patch. Production contains no local dispatch-probe headers.
- Add a local workerd build gate for cached HTML, RSC prefetch, private-media guards and stateless/account-cookie fallthrough. Unit tests cover the anonymous response and conservative exclusions.

The adapter 1.19.11 homepage remains on its existing Next path; cache interception is not represented as eliminating every cold start or all memory-limit failures. The baseline default handler is about 43.3 MB before final Wrangler packaging. No production route-level memory profile or same-traffic post-release CPU reduction percentage is claimed. Monitor subsequent version aggregates and memory-limit errors before attributing the residual cost or promising a target.

## Storage and release policy

Complete metadata inventory: page cache 70,208 objects / 11,781,409,240 bytes; commercial exports 42,816 / 5,859,308,086 bytes; unbound legacy cache 7,973 / 1,249,202,022 bytes. The main and export Worker references were checked across the account with no permission errors. Commercial templates (158 objects / 461,232,586 bytes), fonts (2 / 5,052,708 bytes) and all user exports remain protected.

The separate local cleanup proposal targets 35 exact old-cache prefixes (111,567 objects / 16,724,016,237 bytes), retaining the five most recent page-cache prefixes (including the current one) plus any newer deployment. This is a proposed deletion scope, not a claim that objects have been removed or that old historical versions remain rollback-ready. Permanent deletion still requires explicit confirmation before submission.

After a healthy production deployment, the existing CI performs one read-only aggregate CPU/cache inventory and retains a bounded report for seven days. It has no delete operation and does not run on a timer. Page-cache cleanup stays disabled, and the pre-existing commercial export expiry cron remains unchanged. No database migration, pricing/content change, new infrastructure or credential expansion is included.

Production source/deployment identifiers, real URL verification and pending cleanup approval are recorded in the local release evidence after deployment. Restore by reverting this bounded runtime change and rerunning the existing production workflow; business data needs no rollback.
