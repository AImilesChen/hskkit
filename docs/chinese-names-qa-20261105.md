# Chinese name generator — implementation and local acceptance

Date: 2026-11-05. Status: implemented and verified locally; this task did not deploy, commit or push.

Local final production-build preview: http://127.0.0.1:3024/tools/chinese-name-generator

## Delivered scope

- Independent `/tools/chinese-name-generator` route. Meaning-based selection from 120 complete names, using 40 given-name selections and eight surnames. No runtime character recombination or English-name transliteration claim.
- Any, neutral, traditionally masculine and traditionally feminine style choices. The latter two also admit neutral names; this is explained in the FAQ. Up to two meaning filters, applied together without silently relaxing them.
- Up to three distinct given-name candidates, with surname variety where possible. A narrow filter can return one or two names; those results use an intentional centred/two-column layout. An empty exact match has a reset/recovery path.
- Canonical-ID-only browser favourites, deduplication, twelve-name bound and storage failure messages. Saved current candidates survive regeneration when they still match the applied filters. All three saved candidates disable regeneration with an explicit explanation. State updates use an immediate reference so consecutive actions cannot overwrite a pending selection.
- Consistent whole-name and self-introduction playback controls, pause/resume, replay, error/retry and a loading timeout. Starting another clip stops the previous clip. Changing selected names or regenerating also stops playback. Audio is requested on use rather than preloading all 240 recordings.
- Full-name pinyin, name-use character glosses, an editorial whole-name interpretation, a copy action and selectable-text fallback. Surname meanings are not mechanically appended to the interpretation.
- Selected-name character links, lazy-loaded embedded stroke viewing/writing with character selection, a full stroke-tool link and a prefilled worksheet link. All selected characters already belong to the published dictionary index and self-hosted supported stroke subset.
- Six original, server-rendered naming lessons, annotated name-order and pronunciation examples, seven FAQs and existing learning-guide links. Body copy is 16px; support labels are normally 14px; pinyin is 18–20px. The embedded player's smaller legacy text is raised to 14px within this page only.
- Purple actions, teal surname/learning cues, warm/lavender/sage candidate cards, responsive single-column layouts and a mobile feedback trigger in document flow.
- Learning-guide and footer discovery, Learn navigation ownership through its existing guide entry, canonical metadata, Open Graph, WebApplication and breadcrumb JSON-LD, sitemap inclusion, source attribution and a versioned audio cache rule. The existing five-item header tool column was retained.

## Data and audio provenance

`src/lib/names/editorial.ts` contains HSKKit's original selections, name-use glosses and explanations. `scripts/build-name-bank.mts` materialises the explicitly selected complete names and checks dictionary/stroke coverage. It does not import a competitor's name database or generated output. It preserves existing matching audio metadata; an unchanged bank rebuild was verified byte-stable.

`scripts/build-name-audio.py` creates 240 whole-utterance MP3s, one name and one `我叫…` sentence per name. Total asset bytes: 2,571,264. Voice: Microsoft `zh-CN-XiaoxiaoNeural`, rate -10%, using the existing pinned `edge-tts==7.3.1` and `mutagen==1.48.1` requirements. Files have content-hashed names under `public/name-audio/v1/`, transcript hashes, file hashes and checked MP3 duration metadata. The builder checkpoints every successful clip and reused all matching clips on a repeat run.

No runtime AI, synthesis-service, database, account or payment integration was added. The website uses bundled name data and same-origin static audio/stroke assets. Native-speaker recording, full human listening review and professional naming review are not claimed. A transcript hash demonstrates the submitted synthesis script, not independent speech recognition or pronunciation approval.

## Browser acceptance

Used the in-app browser, with the default desktop viewport and temporary 320px/390px responsive overrides. The override was reset afterwards. Final preview was smoke-tested against `next start`, not just a development render.

1. Generated three candidates and saved the first. Regeneration kept that candidate and replaced the remaining two. The final production run retained `zhou-yuqing-rain` while the other candidate IDs changed.
2. Reload restored the saved choice. Saving all three showed `3/12`, disabled Generate and explained how to change the set. Test favourites were removed; the final preview has `0/12` saved.
3. Strength + Creativity returned no exact match and a recovery prompt. Neutral + Nature + Strength returned one distinct given name with the narrow-filter explanation. Its 560px card was centred in a 1200px results region.
4. Whole-name audio advanced in the browser media element. The final production self-introduction had duration 1.968s and advanced while playing. Ended/replay states were observed. Starting the name clip paused the introduction at approximately 0.914s.
5. Temporarily withheld only the unplayed `chen-jianing` name clip in the isolated preview copy. The control showed Retry audio and an error message. Restored that fixture and retried; playback advanced with duration 1.632s. Original project assets were not moved.
6. Copy reported success. Exact copyable name, pinyin and introduction text is covered by the domain test. The browser clipboard connector did not provide a useful readback, so independent OS clipboard contents are not claimed.
7. Opened embedded writing, switched from 林 to 明 and selected Next stroke. The panel displayed Stroke 1 and `1 / 8`, retaining the whole name in its worksheet action.
8. Followed the worksheet link. The existing textarea contained 林明远, and Generate produced a preview for 林、明、远. No physical printing claim is made.
9. At 320px, document client/scroll widths were both 305px including inline writing. At 390px they were both 375px. A DOM/computed-style check of visible paragraph/label/summary/button text and player spans found no text below 14px after the scoped fixes. Feedback was `position: static` on mobile.
10. Inspected desktop candidates, mobile details, writing and teaching diagrams. Final production browser error logs after the final reload contained no error entries.

Evidence: `tmp/name-development-20261105/browser-checks.json`, `desktop-final.png`, `mobile-detail.png`, `mobile-writing.png`, `mobile-lessons.png`, `worksheet-prefill.png` and `audio-failure.png`.

## Automated and HTTP verification

- 23 scoped tests passed: six name tests, six existing number tests, four existing stroke tests, and seven relevant navigation/footer/guide cases.
- Name tests cover all 120 records and their dictionary/stroke data, every style and zero/one/two-meaning combination, narrow/empty matching, candidate uniqueness, retained selections, changed preferences, malformed saved values, storage bounds, full-name learning links, copy text and all 240 audio checksums/transcript hashes.
- Scoped ESLint passed with zero warnings for the feature, builder, tests and touched integration files.
- Final Next production build and independent `tsc --noEmit` passed. The build generated 957 static pages and classified the name tool as static.
- HTTP 200 and exact byte hashes/MIME types verified for all 240 MP3 files served by the final local production build.
- HTTP checks passed for the tool and a parameterised tool URL, the prefilled worksheet and stroke routes, 林/明/远 character routes, attribution, robots and sitemap. The page has one H1, the correct `https://hskkit.com/tools/chinese-name-generator` canonical and server-rendered teaching text. Sitemap contains the canonical route.
- 257 feature/integration source and asset files were hash-compared against the isolated build copy with no mismatches. The file hashes are in `tmp/name-development-20261105/source-sha256.json`.

Logs: `domain-tests-final.log`, `navigation-tests-final.log`, `lint-final.log`, `production-build-final.log` and `http-verification.json` in that same temporary evidence folder.

## Existing limitations and release boundary

- An unrelated legacy pricing assertion in `p0-2-discoverable-navigation.test.mts` expects Stripe Test mode, while the existing pricing page describes live checkout. Pricing was not changed. Relevant navigation cases were rerun separately and passed; a repository-wide green suite is not claimed.
- Development mode exposed the pre-existing duplicate public/app favicon warning. The final production preview serves `/favicon.ico` with HTTP 200.
- The earlier isolated preview convention is reused: a separate build copy, existing dependency junction, tracing root restricted to that copy and one build CPU. These local build accommodations were not added to the project's production config. Unrelated dirty workspace changes were preserved.
- Technical SEO code/local HTTP results are verified. No new GSC/Bing property, submission or GA4 backend receipt is claimed. Existing consent-aware tracking is reused with public canonical name IDs and filter tags, not private input names or birthdates.
- Cloudflare deployment, deployed cache headers and CPU/billing measurements remain outside this local development task. `/name-audio/v1/*` has an immutable cache rule prepared in `public/_headers`.
- There was no model/voice-vendor request from the running name tool. Synthesis is an offline build step; there is no new secret or database migration required.
- A later release must isolate these new feature/data/audio files and the bounded integration edits against the current production checkout. Do not deploy the entire unrelated dirty workspace.
