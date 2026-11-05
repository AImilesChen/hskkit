# Header navigation — local QA, 2026-11-05

Status: implemented and verified locally; not deployed. Scope: shared header, navigation data, scoped CSS and navigation contract tests.

## Approved adaptation

Reference: the actual expanded HSK Lord Learn menu captured at tmp/navigation-audit-20261105/competitor-current.jpg, plus the user's approved four-column HSKKit plan. This is an adaptation of the compact, plain-link layout, not a copy of the competitor's branding or feature inventory.

Learn has four labelled columns (HSK & Guides, Language Skills, Learning Tools, Topics) and a separate Your study shortcut row. Existing Today, Planner, levels, vocabulary, flashcards, topics, grammar, reading, listening and tone trainer destinations remain reachable. Added shortcuts point to existing guides, worksheets, topic categories and the travel page. Practice and Tests remain compact. Descriptions are removed from the visible menus. Current-page ownership prevents shared guide links from highlighting two top-level items.

Desktop supports pointer enter/leave with short delays, click toggles, ArrowDown/ArrowUp entry, Escape with focus return, outside click and focus exit. Mobile uses a separate drawer with mutually exclusive root groups and Learn categories, scroll locking, keyboard focus cycling and Escape. Existing account-dependent Dashboard and Account behavior is retained.

## Actual verification

- Scoped ESLint and source typecheck passed. The temporary typecheck config includes repository root declaration files and excludes historical release snapshots under tmp; no production compiler configuration changed.
- 16 targeted tests passed: four navigation contracts plus twelve existing placement/grade-entry tests. The full historical suite was not asserted green.
- All 24 reorganized/local page destinations returned HTTP 200. Evidence: tmp/navigation-20261105/http-links.json. No production data writes or deployment.
- In-app browser: desktop Learn opens with four columns and 19 links including shortcuts; 920px width and 317.5px height at the default desktop viewport, no internal scroll. At 1040px it fits between CSS x=52.5 and x=972.5 without horizontal overflow.
- Actual keyboard: Escape closes and returns focus; ArrowDown opens and focuses HSK Levels. Practice/Tests show their three matching links. Clicking the page outside closes the open menu.
- At 390px, Tools opens as a compact mobile category; Tone Trainer link navigates and closes the drawer, restoring body scrolling. At 320px Topics opens without horizontal overflow. Tab from the last drawer link cycles to the logo; Escape returns focus to Open menu. Temporary viewport override reset.
- Screenshots: desktop-final.jpg, mobile-tools.jpg, mobile-320-topics.jpg and side-by-side design-comparison.jpg in tmp/navigation-20261105/.

## Visual QA

Compared the source and final desktop capture side by side in design-comparison.jpg. Four aligned columns, small uppercase group labels, plain links, light borders and restrained elevation reproduce the selected navigation pattern. Existing Inter/brand typography and blue interaction color are retained. HSKKit-specific destinations and the approved shortcut footer intentionally differ. Reference and implementation are both guest sessions; underlying page and brand are intentionally different.

No new raster assets or icons were needed; the existing logo and navigation indicators are retained. Mobile typography remains readable and link targets are at least 44px. No blocking P0/P1/P2 visual finding remains. Root design-qa.md records the scoped pass; prior root report is backed up under tmp/navigation-20261105/before/.

## Limits

Signed-in header behavior is preserved in source; this pass did not perform a fresh OAuth login. Pointer-hover behavior is implemented; browser interaction verification covered click and keyboard operation. No new page, API, database migration, analytics integration or deployment was included.
