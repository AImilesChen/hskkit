# Chinese name generator customization — local acceptance

Date: 2026-11-06. Status: implemented and verified locally. No deployment, commit or push was performed for this task.

Final production-build preview: http://127.0.0.1:3025/tools/chinese-name-generator

This supersedes the v1 feature counts and customization limitations in `chinese-names-qa-20261105.md`. The older 3024 preview remains separate; use 3025 for this version.

## Delivered behavior

- Three starting modes: an English-name meaning, a supported Chinese character, or meaning traits. English-name matching uses a bounded local origin reference list and explicit meaning confirmation. It does not transliterate the English name.
- Twelve origin/interpretation records with aliases and direct meaning references. Alex, Stella and Rose expose ambiguous origins rather than choosing silently. Unknown names can use an explicitly chosen intended meaning and one of ten naming inspirations. User text is not presented as verified etymology.
- Keep a supported character in the first, second or either given-name position. One-character given names cannot request a second position. Unsupported or multiple characters produce a clear validation message.
- Single- and two-character given names, with eight selectable single-character surnames. The current supported given-name character list contains 85 characters. Compound surnames and arbitrary characters are not yet supported.
- Everyday use offers Modern & natural and Poetic & graceful. Fictional use offers Classical & literary and Wuxia & adventure. Gender association is a separate optional preference. Classical and wuxia explanations use original imagery, without invented literary quotations or historical provenance.
- All filters are hard constraints. Results contain up to three distinct given names. One or two matching names are displayed intentionally; no incompatible names are added to fill empty slots. Saved names remain in the browser even when they no longer match the current filters.
- Result reasons describe the applied preferences, retaining accurate reasons while the next draft is being edited.
- Expanded original data: 89 given-name selections across eight surnames, yielding 712 complete names. There are 21 single-character given-name selections (168 complete names). These counts describe combinations, not 712 independently authored given names.
- Whole-name and self-introduction audio, name-specific pinyin, character definitions, lazy embedded stroke practice, dictionary links and full-name worksheet links. Existing v1 saved IDs and 240 original audio files remain compatible.
- Three mode cards, responsive common settings, optional preferences folded away, warm/lavender/sage results and readable support copy. Six server-rendered teaching sections and ten FAQs explain name order, meanings, length, customization and pronunciation.

## Data, stability and runtime

`src/lib/names/editorial.ts`, `expanded-editorial.ts` and `english-origins.ts` contain the local editorial sources. `scripts/build-name-bank.mts` validates dictionary/stroke coverage and preserves old IDs and matching audio metadata. The data bank is v2 while the browser storage schema/key deliberately remains v1 for compatibility.

All 1,424 MP3 clips are generated ahead of time and served from same-origin static paths. The new clips use the same pinned synthesis toolchain and voice as v1. The builder checkpoints batches and retains completed matching clips. No temporary `.building.mp3` files remain.

Generation/filtering runs in the browser. The name tool adds no runtime AI, remote origin lookup, synthesis API, database, account or payment dependency. Input English names and free-text meanings are not placed in analytics payloads, URLs or saved-name storage. Origin reference links are optional external links. Whole-name recordings load on use, rather than loading the entire audio collection.

No complete native-speaker, professional naming or human listening review is claimed. Audio script hashes and MP3 metadata verify scripts/assets, not independent pronunciation approval. Cloudflare production delivery, cache headers and CPU billing have not been measured in this local task.

## Verification

- 21 relevant tests passed: 11 name tests, six number-tool regressions and four stroke-tool regressions. New cases cover fixed characters and position, exact one-result behavior, length and surname constraints, incompatible styles, confirmed/ambiguous/unknown English meanings, manual fallback, and old saved-name compatibility.
- Scoped ESLint passed with zero warnings. TypeScript `--noEmit` and the final Next production build passed. The first build exposed a redundant TypeScript comparison in the conditional form fieldset; that was corrected before the successful final build.
- Final route is statically rendered; production build reports 291 kB first-load JavaScript. Audio and stroke practice assets are separate from the initial page payload.
- All 712 names have dictionary and stroke-data coverage. Existing 120 IDs and the original audio hashes were checked for preservation.
- HTTP production-preview checks verified all 1,424 audio responses for 200 status, `audio/mpeg` MIME and exact SHA-256. All 1,441 feature source/asset files matched the isolated build copy. Page HTML contains one H1, one canonical, and the teaching/FAQ content.
- Real browser: 宁 + 林 + one-character given name returned only 林宁; two-character given name + second position returned only names ending in 宁. 龘 showed a validation error without substituting another character.
- Sophia required explicit confirmation and returned wisdom-inspired candidates. Editing to Alex reset confirmation and exposed two unselected origins. Stella also exposed two unselected origins. Unknown Maren with explicitly confirmed protection/care returned names containing 守 or 佑.
- Fictional + wuxia + two-character given name returned 许逐风、王星河、李照川 with the correct style reasons. The previously saved 林宁 remained available outside those current results. The temporary test favorite was removed afterward.
- New 林宁 audio played and advanced with duration 1.392 seconds; its self-introduction played. Embedded writing switched from 林 to 宁, and Next stroke displayed `1 / 5`. Its worksheet link carried 林宁, prefilled two characters and generated a printable preview containing both.
- Desktop and temporary 320px/390px viewport checks passed without horizontal overflow. The viewport override was reset. Browser console returned no warnings/errors during the tested flows.

Evidence in `tmp/name-customization-20261106/`: `build-final.log`, `preview-check.json`, `desktop-customization.png`, `mobile-320.png` and `results-customized.png`. The final build source and server are isolated under that directory. Audio generation log: `tmp/name-audio-v2-build.log`.

## Release boundary

The working tree already contains many unrelated changes. This task preserves them. A later release should isolate the name feature/data/audio changes and the existing bounded discovery/SEO integration against the production checkout; do not publish the entire dirty workspace. No new deployment secret or database migration is needed for this feature.
