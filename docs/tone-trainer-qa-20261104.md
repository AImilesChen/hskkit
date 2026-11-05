# Chinese tone trainer — local delivery, 2026-11-04

Status: implemented and verified locally. Not deployed. Production baseline for a future isolated release: 1375f202f31d34ad8abefd5148ccdc8279b6db4f. Unrelated existing dirty work is excluded by tmp/tone-trainer-20261104/scope.json.

## Delivered behavior

- Public canonical route /tools/chinese-tone-trainer, index/follow metadata, WebApplication schema and sitemap entry. Three modes: guided four-tone examples (unscored), single-syllable recognition and two-syllable recognition; 10/20-question rounds.
- Learning-menu, listening-page, legacy single-task and two existing guide-article links. Tests navigation unchanged. Desktop dropdown height is bounded and scrollable so its new final entry stays reachable.
- Fixed audio must finish before choices unlock. Hanzi, marked pinyin and meaning appear only after Check. Audio failure does not advance a round. Repeated checks cannot double-count an answer.
- Result includes first-pass word score, per-tone syllable counts, double-word position breakdown and directional confusion suggestions. Mistake retries are separate sessions; focused pair rounds use the relevant existing single-syllable pool.
- Browser history retains the latest 20 valid rounds and can resume after reload. Separate signed-in storage keys and account-bound sync use the existing learning-state JSON and authentication. Guest import is explicit. No SRS mastery, entitlement usage or streak is awarded.
- Server merge is append-only and revision-protected; stale tabs cannot replace longer saved progress. Switching accounts cannot upload the previous profile's state. Account export/deletion continue to operate on the existing learning-state object. No new database table or production migration.

## Audio and content

96 curated items reuse existing published QA-approved HSKKit synthesized word recordings: 48 single syllables (12 per tone), 48 double words covering 15 non-3+3 combinations. The small foundation set deliberately excludes neutral tones, 一/不 and 3+3. Third-tone category is described as low/dipping, not a claim that every token has a full dipping contour.

scripts/build-tone-trainer-bank.mts resolves each item against the current runtime index and published audio assets, validates pinyin segmentation and requires local asset presence. The bank includes source asset IDs and links back to original word pages. No new audio generation, browser TTS, new speaker recordings or new human phonetic-review certification is claimed. Existing content approval is reused; selection and technical checks were performed in this task.

All 96 MP3 files decoded successfully with the installed FFmpeg runtime and all 96 localhost asset HEAD requests returned 200. Evidence: tmp/tone-trainer-20261104/audio-technical.json and http-integration.json.

## Verification

- Typecheck and scoped ESLint passed for the final implementation.
- 25 tests passed across tone-trainer, account-sync, sitemap-runtime-safety and test-level-pages. One additional targeted navigation-contract test passed. Coverage includes balanced/nonrepeating selection, valid bank assets, played-answer gating, immutable first-pass score, retry selection, per-position analysis, malformed/stale persistence, monotonic merging and existing account merge behavior. Full historical suite is not claimed green.
- Actual localhost API: guest GET, denied guest writes, denied foreign Origin, invalid payloads, authenticated save/restore, second-account isolation, account-switch write rejection, stale write preservation and extension of saved answers. Tested with two isolated local fixture accounts, not browser/user production accounts.
- Actual HTTP: indexable initial HTML, self-canonical, sitemap, all four listening/guide entry links and all 96 audio URLs. The old local blog database was uninitialized; existing 0023/0026/0027 SQL was applied with --local only to enable those two article-link checks. No repository SQL changes or remote migration.
- In-app browser only: actual complete audio playback and ten-question first pass; refresh after four answers restored question five with choices locked; result and eight-item mistake retry; first-pass score unchanged; double-syllable selection and feedback; guided examples; Learn link and scrollable dropdown.
- Desktop 1280x720, mobile 390x844 and narrow 320x740 reviewed. No horizontal overflow. Mobile first-screen action originally fell below the viewport; repeated helper copy was compacted and the final Start row ends at CSS y=799 in a 844px viewport. Double-word card at 390px is about 716px tall and contains the core controls. Temporary viewport override reset.

## Screenshots and corrections

Evidence under tmp/tone-trainer-20261104/: setup-desktop.jpg, setup-mobile.jpg, double-mobile.jpg, guided-320.jpg, result-desktop.jpg. Earlier setup-mobile-before-compact.jpg records the below-fold Start issue, now fixed. Feedback transitions now use immediate section positioning rather than capturing a mid-scroll state; reference cards use the existing compact audio icon so they fit at 320px.

Two development-only dependency-array warnings occurred during Fast Refresh while editing hooks; final clean-page console was checked separately. No native confirmation dialog or external desktop browser was used. No production answer/session was created.

## Limits

No production build/deploy in this iteration; active local preview is retained. Account synchronization was verified through real local APIs, not a production OAuth login. Network-failure UI is implemented, but an actual offline browser run and every supported browser/device were not exercised. Pronunciation recording/scoring, additional speakers, neutral tones and contextual sandhi remain outside this approved first release.
