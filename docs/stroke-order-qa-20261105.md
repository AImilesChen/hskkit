# Stroke order and writing — local implementation

Scope: `/tools/chinese-stroke-order`, a shared character-page player, self-hosted character data, existing worksheet prefill, discovery and attribution. No deployment, database migration, new API, account-progress write or payment change.

## Sources and coverage

- Hanzi Writer 3.7.3, MIT. Vendored ESM and declarations, with a documented cleanup patch for animation/renderers and document-level pointer-end listeners. Original licence retained.
- hanzi-writer-data 2.0.1, Arphic Public License. Pinned npm archive checksum and reproducible builder in `scripts/build-stroke-assets.py`.
- 3,084 of 3,088 indexed characters included. Individual JSON bytes remain unchanged; filenames use hexadecimal Unicode codepoints. Four count disagreements (范, 荧, 莹, 骨) withheld pending review. No claim of full human or regional-standard review.
- Data/notice/licences occupy approximately 8.94 MB. Entire local public directory has 4,934 files before framework build assets. Runtime calls provide a custom loader for `/stroke-data/v1/*.json`; no CDN fallback is used. The route itself is statically prerendered. Deployment must preserve assets-first routing; production CPU metrics have not been measured.

## Actual browser checks

Using the in-app browser and local port 3022:

- Loaded 中, switched to slow speed, played, paused at 2/4, continued and completed at 4/4. Inspected actual rendered character.
- Next stroke displays an orange current stroke with previous strokes dark and future strokes pale. Numbered sequence is expandable.
- 学习学习 becomes two distinct selectors, 学 and 习. Selecting 习 changes its count and guide while worksheet prefill retains 学习.
- Practised 三 with real mouse drags: intentionally drew the bottom stroke first, received a miss; drew the three correct strokes in sequence, reached 3/3 with one miss. Start again resets the round. A later page load displays the saved completion record.
- Temporarily moved only 人's local JSON out of public to simulate a failed fetch. UI displayed a connection/loading error and retry. Restored the original file, clicked retry and loaded the guide successfully. All asset checksums passed after restoration.
- 骨 shows unavailable, leaves worksheet/reference links usable and disables animation/practice controls. Switching back to 三 recovers normally.
- Worksheet link prefilled 三; Generate produced an actual practice-sheet preview and enabled Print. Physical printing/PDF output was not repeated.
- 学 character page includes the shared player, with existing meaning/radical/related-word content retained.
- Fixed a real 320px min-content overflow. Final 320px measurement: document width 305px, viewport 320px, no horizontal overflow. This was responsive browser checking, not a physical touch-device test.
- Screenshots: `tmp/stroke-order-20261105/practice-complete.png` and `player-step.png`. The completion screenshot precedes a minor singular/plural wording correction.

## Automated checks

- Scoped ESLint passed.
- Typecheck and Next production build passed; 955 pages generated and tool route statically prerendered.
- Five guide/stroke checks passed, including every data file's hash/geometry/catalog count, supported sets, count mismatches and local loader/lifecycle contract.
- Three relevant navigation checks passed.
- Eight local HTTP targets passed, including tool, character reference, worksheet, static JSON, licences and sitemap. Canonical and sitemap inclusion verified in `tmp/stroke-order-20261105/http.json`.
- Full Cloudflare adapter packaging is checked separately below; it is not implied by the Next build result.

## Cloudflare bundle verification

The final full OpenNext build completed successfully in the isolated workspace copy. The tool is statically prerendered; all 3,084 character files are in `.open-next/assets/stroke-data/v1/`, and each packed file matches its approved checksum. `_headers` includes the versioned long-lived cache rule. The current Wrangler configuration does not enable `run_worker_first`. This verifies the intended static-file packaging, not measured production billing.

The first skip-build attempt lacked standalone output. The full build generated it; Windows then refused Next's node_modules symlink, so a local junction was created for that isolated build. Its tracing root was set to the isolated directory to avoid tracing the parent workspace. These local build accommodations did not modify production configuration. Source/verification hashes and exact results are in `tmp/stroke-order-20261105/verification.json`.

## Limits

No production publication or CPU measurement. No professional handwriting grading, cloud sync or claim that viewing/finishing this exercise masters a vocabulary word. Source forms and complete per-character content have not all been manually reviewed. Existing unrelated workspace edits remain outside this feature.

## Controls and teaching refinement

The follow-up replaces the loose control list with a compact card: one Play/Pause/Continue/Replay button, speed alongside it, a separate previous/current/next row, an outline checkbox and Reset. Worksheet and character-reference links sit in a separate learning card. Practice has its own green panel, live misses and restart; playback controls are absent in that mode. At widths up to 800px the board and controls stack to prevent tablet-width crowding.

The server-rendered teaching area now includes four getting-started steps, eight illustrative stroke cards with starting dots and linked examples, four writing rules, a worked three-stroke box example, four common mistakes, and a suggested five-minute routine. Existing coverage/storage/printing FAQs remain. Teaching illustration and lesson HTML are static; no additional API or external asset dependency was introduced. No claim of increased traffic or rankings has been measured.

Verification for this refinement:

- Scoped ESLint and all four existing stroke tests passed, including checksums for every character asset.
- Next production build and type checking passed in the isolated copy, generating 955 static pages. The tool remains prerendered. The built HTML contains all lesson sections and eight SVG stroke illustrations; all lesson example characters are supported.
- Browser testing confirmed the merged button pauses, continues and replays; returning from step inspection replayed all eight strokes. The outline checkbox and Reset work.
- A real mouse writing round completed three strokes after one intentional miss. The new miss counter updated to one and Start again cleared it to zero.
- A teaching link opened the intended box-character guide, with three strokes.
- Checked 1280px desktop, 660px default/tablet and 320px mobile. At 320px the document measured 305px, without horizontal overflow; tablet uses one workspace column. The viewport override was reset.
- Screenshots: `controls-redesigned.png`, `stroke-lessons.png`, `practice-redesigned.png`, `mobile-controls.png` and `mobile-lessons.png` under `tmp/stroke-order-20261105/`. Results are in `refinement-verification.json` in the same folder.

This follow-up has not been deployed. The full Cloudflare adapter packaging above predates this UI/content refinement; the latest refinement was checked with the Next production build.

### Clarifying character navigation

After the user mistook Next for the next character, the visible step buttons were renamed Previous stroke / Next stroke, including on mobile. Multi-character sets now have a separate character navigator inside the player, with position, adjacent character labels and disabled ends. Single-character sets explain how to enter a word. Worksheet links continue to use the complete selected set.

Scoped ESLint and TypeScript passed. Browser verification used the two-character study example: Next stroke kept the first character and highlighted its stroke; Next character selected the second character, changed the count from eight to three and reset stroke progress; Previous character returned to the first. The worksheet retained both characters. The last character disables Next character. At 320px, the document width was 305px and full stroke labels remained visible. Viewport override was reset. Screenshot: `tmp/stroke-order-20261105/character-navigation.png`. Local only; no deployment requested.
