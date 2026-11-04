# Test center and placement landing: phase 1

Date: 2026-11-04. Status: local pages and SEO wiring verified; not deployed.
Production baseline: e116294bba4f928e05c68a023ac6725fd2762004.

## Delivered scope

- /hsk-test-prep: a public test center with goal-based placement/basic choices, an Advanced 7–9 entry, real question counts and durations, comparison, learning links and FAQ.
- /hsk-placement-test: a public placement introduction with adaptive 18–24-question information, four skill areas, practical result explanation, process and FAQ. Uses the existing guest-capable placement API.
- Both pages render their main content, title, description, canonical and index/follow directive in the initial HTML. CollectionPage/WebPage structured data describes the actual surfaces.
- Tests navigation links to the two public pages and retains basic/advanced runners and the exam guide. Placement stays active on both the landing and private runner/results. Desktop/mobile use the same navigation data.
- /hsk-level-test now 301-redirects to /hsk-placement-test. The old unused source is not revived. Sitemap includes the two public pages and excludes placement runner/results.
- /placement remains noindex with a self-canonical; its outdated nine-question description now reflects 18–24 questions. Test scoring, question selection, retake rules, stored progress and result ownership are untouched.

## Placement entry behavior

The client makes one read-only overview request on mount. A new placement session is requested only by an explicit Start click using the existing POST /api/v1/placement/sessions endpoint. A stable per-click idempotency key and in-flight guard prevent duplicate starts. The pending overview read is aborted before starting, and unmount suppresses late navigation.

An active session offers Continue; a saved result offers its internal result URL; retakes require explicit availability, and cooldown overrides contradictory active hints. Failure shows a readable retry message and a link to the existing runner. Modified/new-tab clicks retain a normal href fallback. No placeholder test result is generated.

Existing analytics tracks landing views/clicks and successful placement starts/completions. No session IDs, result IDs, answers or question text are sent as event properties. No new analytics vendor is installed.

## Verification

- Typecheck, scoped ESLint and whitespace checks passed.
- Thirty-three focused tests passed: entry selection, session creation contract, cooldown, retake behavior, current v4 accuracy, progress persistence, idempotency, answer confidentiality, canonical routing and sitemap runtime safety. The six new entry tests were rerun after the final state-selection adjustment and passed.
- Five targeted navigation/redirect/prefetch checks passed, including shared desktop/mobile destinations and no prefetch of private destinations.
- Real HTTP checks against localhost returned 200 for both public landings with a Googlebot user agent. Main content and FAQ are present in initial HTML; self-canonicals and index/follow were verified. The legacy entry returned 301 to the placement landing. Sitemap included both public pages; the runner remained noindex and excluded. Evidence: tmp/test-landings-20261104/http-check.json.
- Browser verified desktop hub and placement layouts, navigation between them, mobile Tests menu entries, and native FAQ expansion. Both pages had no horizontal overflow at 390px and 320px. Temporary viewport overrides were reset.
- Screenshots were saved and visually inspected in tmp/test-landings-20261104: test-center-desktop.jpg, placement-desktop.jpg, test-center-mobile.jpg and placement-mobile.jpg.

## Limits and existing failures

The local /api/v1/placement endpoint returns HTTP 500 with an empty body; /api/v1/mock returns 200 with availability. A real Start click exercised the new error/retry path, but successful browser-level creation, continuation and result display could not be verified locally. Those entry states and the POST contract are covered by unit tests; the underlying placement engine's focused domain/accuracy tests passed. Do not describe the local start-to-result path as end-to-end verified. No production session was created and no test was submitted during this work.

A broader exploratory run reported six legacy assertion failures concerning old homepage copy, the header's old source iteration expression, comparison-page release markers, v2 placement catalog assumptions, an obsolete exact 18-question expectation and an old dashboard link-source pattern. Those files/behaviors were not changed to make this phase pass. The current v4 placement accuracy suite passed. The 38 scoped checks above do not mean the entire historical repository suite is green.

No HSK-specific SEO subpages, new quick/full modes, new questions, score changes, production build or deployment are included in phase 1.

## Selected option 2 redesign, 2026-11-04

Both landing pages now implement the selected Cornflower and Apricot direction with competitor-informed compact typography, sparse opening content, closed About sections, functional entry states and scoped mobile feedback placement. Product Design and practical-visual-design were both applied. Visual QA passed after correcting the oversized start row and mobile Feedback overlap; evidence and limitations are recorded in tmp/test-redesign-20261104/design-qa.md. Typecheck, scoped ESLint, six entry tests and real HTTP metadata/routing checks passed. Local placement API still returns500; successful start-to-result is not verified. Not deployed.
