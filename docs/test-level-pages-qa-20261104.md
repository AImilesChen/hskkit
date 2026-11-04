# Test level pages — local QA, 2026-11-04

Status: implemented and verified locally; not deployed.

## Scope

Hub shows HSK 1–6 and one Advanced 7–9 entry. Placement separately explains audience, skills, process and results without folding core content. Seven public introductions live at /hsk-test-prep/hsk-1 through hsk-6 and /hsk-test-prep/hsk-7-9. Each includes distinct published lesson examples, accurate skill descriptions and four real study links. Timed question bank and scoring rules remain unchanged.

Tests navigation separates HSK Practice Tests, Find My HSK Level and HSK 3.0 Exam Guide. Public metadata, self-canonicals and sitemap include all seven introductions. Runners/results retain noindex. Existing analytics carry level/source without answers or attempt IDs.

## Entry and restore

Basic runner accepts explicit level 1–6; Advanced retains its existing band. Per-grade pointers preserve unfinished attempts, including legacy pointers. A saved HSK 2 attempt cannot silently replace requested HSK 3; an explicit link returns to the saved attempt. Selector updates the URL, and refresh after navigation settles retains the grade. Existing start/save/timer/submit/scoring APIs are reused.

## Verification

- Typecheck and scoped ESLint passed.
- 20 tests passed across test-level-pages, test-landing-entry, practice-mock-stage1, batch14-mock-runtime and sitemap-runtime-safety: seven routes, fourteen distinct examples, valid answers/resources, strict query parsing, grade-aware restore, per-grade domain start/save/submit/scoring, durations, answer-key withholding and navigation.
- Two targeted discoverable-navigation tests passed. Full historical suite was not asserted green; unrelated legacy header-source expectations were not expanded into this task.
- All seven HTTP routes returned 200 with examples in initial HTML, correct canonical/indexing and matching runner destinations. All 28 study links returned 200. Sitemap includes seven routes. Evidence: tmp/test-levels-20261104/http-integration.json.
- Actual localhost API: HSK 2 and Advanced 7–9 create/save fifteen answers/fetch restored progress/submit; fifteen correct with all three skill breakdowns. Isolated test cookies used.
- In-app browser: HSK 2 navigation/start/one-answer save/reload restore; HSK 3 preserving HSK 2; explicit return; HSK 6 query/refresh; mobile navigation and sample answer disclosure.
- Seven introductions at 320px without horizontal overflow; hub/Placement at 390px and desktop 1280px. Feedback overlap, skill-panel height and narrow Advanced CTA wrap fixed and recaptured. Current preview console error log empty.

## Local environment and limitations

Empty existing local D1 databases were initialized with existing learning/mock/account/placement migrations using --local only. No new SQL files, remote migrations or production records. No deployment.

Original browser submit confirmation could not be reliably controlled and briefly appeared over desktop. The triggering agent tab was closed; browser-driven manual submit remains a verification gap, while actual API submission/scoring passed. Confirmation behavior is unchanged.

Production build was not run against the active dev output. Root design-qa.md records passed visual comparison. tmp/test-levels-20261104/scope.json records exact intended source/test/doc files against production base 2d0af3f2155c81253d6bef4fbfa9b4194cfbc4fe; unrelated dirty work excluded.

