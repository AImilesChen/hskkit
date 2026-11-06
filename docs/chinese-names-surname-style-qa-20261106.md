# Chinese names: searchable surnames and independent preferences

Date: 2026-11-06. Implemented and verified locally. No deployment, commit or push.

Accepted production-build preview: http://127.0.0.1:3026/tools/chinese-name-generator

This supersedes the surname/style limits in the earlier name-generator QA notes.
Use port 3026 for this version; the older 3024/3025 previews are separate snapshots.

## Delivered

- Removed the everyday/fictional purpose gate. Any, Masculine, Feminine and Neutral are always visible. All four styles and Any style are directly selectable. Gender preference is an exact category filter; it does not silently add neutral candidates to masculine/feminine results.
- Searchable 120-surname selection: 100 single-character surnames, 20 compounds, twelve shortcuts and an explicit “Search all 120” affordance. Search supports Han characters, recorded traditional aliases, tone-marked/unmarked pinyin, separated compound syllables and ü/v/u: spellings. Empty results preserve the query and current selection. Escape/outside click close the picker; arrow keys navigate results; Enter chooses a unique match without submitting the name form.
- Expanded original given-name selections from 89 to 161: 45 single-character and 116 two-character names. Style membership and gender tendency are recorded separately. New single-character names have specific style membership rather than every style label being applied indiscriminately.
- Compact surname and given-name data, materialized client-side into 19,313 valid complete-name combinations. Duplicate boundary characters and an explicit small list of unsuitable whole-name combinations are excluded. This is not exhaustive cultural/homophone review or a population ranking.
- Fixed surname, chosen character/position, length, style, gender and meaning constraints stay exact. Empty matches provide explicit one-preference adjustments that retain the chosen surname and character. The collection covers each gender/style/length combination for every offered surname when no additional meaning/character constraint is applied.
- Compound surnames remain one family-name unit in full-name pinyin and explanations. Their individual characters remain separately selectable for writing. Length examples update with the selected surname and count only the given name, allowing two-, three- and four-character full names.
- Cards show concise matching reasons and separate preference/style labels. Applied reasons remain tied to the generated result while the next draft is edited. Existing favorites, whole-name/introduction audio, character references, embedded writing and worksheets are retained.
- Six original server-rendered guide sections and twelve FAQs now explain surname search, compounds, length and free style combinations. Existing canonical route/discovery remains unchanged.

## Name-learning resources and pronunciation

All 224 required surname/given-name characters have self-hosted stroke data. Forty-two additions lie outside the published dictionary index and are documented in the stroke notice. They receive writing links rather than nonexistent dictionary links and are not assigned an HSK level. Individual stroke files remain unmodified from the existing pinned source. Unresolved catalogue/source stroke-count differences remain withheld.

Explicit name-use readings include 任 Rén, 曾 Zēng, 宁 Nìng, 尉迟 Yùchí, 长孙 Zhǎngsūn and 令狐 Línghú. References and the bounded coverage are recorded in `src/lib/names/surname-sources.md`. Some selected polyphonic readings use explicit homophonic synthesis spellings, recorded separately from display text in the offline manifest with hashes for both. No complete native-speaker naming or listening review is claimed.

38,626 complete-name/self-introduction clips were prepared, totaling 408,929,472 bytes. The final resumed audio run produced 24,165 recordings, reused 14,461 and finished with zero failures. No `.building.mp3` files remain. Independent comparison against the prior snapshot verified all 712 previous IDs, full names, pinyin and introductions plus the exact metadata and file hashes of all 1,424 previous recordings.

## Verification

- 27 relevant tests passed: seventeen name-domain/resource tests, six number-tool regressions and four stroke regressions. The expansion test checks every surname × gender × style × given-name-length combination, plus exact compound/fixed-character results, search normalization, recovery, storage and optional static audio origins.
- Scoped ESLint passed. The standalone type check and accepted Next production build passed. The accepted page reports 165 kB route JavaScript / 277 kB first load, compared with 291 kB before this expansion. These are build reports, not field performance measurements.
- `npm run check:chinese-names` passed: every current name/audio pairing, file hash, transcript hash, pronunciation-spelling hash where present and duration metadata checked; a publication inventory was written.
- Accepted HTTP verification passed for all 38,626 audio files: 200 status, audio/mpeg and exact SHA-256. The first bulk verifier exhausted local short-lived socket ports; it was corrected to reuse persistent connections, then passed in full. This was a verifier transport issue, not a name-tool runtime defect.
- 3,164 scoped source/build files matched by SHA-256. Preview HTML contains one H1, one production canonical, the surname/length guides and no removed purpose/More preferences controls. Robots and sitemap returned 200; the sitemap contains the name-generator route.
- Browser: Feminine + Wuxia + 欧阳 + two-character given name returned valid four-character names, including 欧阳听雪、欧阳照影、欧阳清霜. Direct style selection required no purpose switch.
- Browser: pinyin and traditional surname searches, unknown-query empty state, Escape, Enter and directional navigation passed. Enter on an unknown query kept search open and did not generate; Enter on the unique ouyang match selected 欧阳. ArrowDown navigation selected 黄 then 皇甫.
- Browser: an incompatible Feminine + 宁 + one-character given-name choice returned explicit recovery controls. Allow any gender preference retained 欧阳 and 宁 and produced only 欧阳宁. Embedded writing switched from 欧 to 阳, then showed stroke 1 / 6.
- Browser: Sophia still required meaning confirmation; confirmed results used wisdom/learning inspiration. A saved original 林明远 restored after reload and remained in Saved when current style filters changed. The temporary test favorite was removed; final preview has no test favorites.
- Browser: new 林雪 name audio advanced with duration 1.464s; its introduction advanced with duration 1.824s. Four-character 欧阳听雪 audio played at 1.872s; starting its 2.16s introduction paused the name clip, and the introduction reached its end. No browser warnings/errors were recorded in the accepted run.
- Browser: four-character worksheet link prefilled 欧阳听雪 and generated four character groups with Print enabled. No physical printing is claimed.
- Desktop, 390px and 320px layouts were inspected. Narrow-width document/content widths matched, with no horizontal overflow. Temporary viewport overrides were reset.

## Evidence and release boundary

Evidence directory: `tmp/name-expansion-20261106/`. Accepted records include `build-accepted.log`, `lint-final.log`, `surname-keyboard-lint.log`, `tests-accepted.log`, `release-check.log`, `release-assets.json`, `legacy-check.json`, `preview-check.json`, `seo-check.json`, `audio-build-final.log` and the accepted screenshots. Final desktop proof: `desktop-form-accepted.png`.

Generation/filtering is local browser work; synthesis is an offline build step. Clips load on use. The optional build-time `NEXT_PUBLIC_NAME_AUDIO_BASE_URL` connects expanded audio to an HTTPS static origin; same-origin files are used in the local preview. The full audio manifest stays outside the client bundle. See `chinese-name-assets-release.md` for inventory-driven publication and resource-origin setup.

Production resource uploads/domain configuration, Cloudflare cache/CPU/billing behavior and GSC/Bing/GA4 backend receipts were not part of this local optimization. Existing consent-aware tracking is reused without raw English names, free text or surname-search strings. The dirty working tree contains many unrelated edits, all preserved; a later deployment must isolate this feature and its bounded integrations.
