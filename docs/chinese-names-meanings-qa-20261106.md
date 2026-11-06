# Twelve meaning preferences — local acceptance

Date: 2026-11-06. Implemented and verified locally; no deployment, commit or push.

Preview: http://127.0.0.1:3026/tools/chinese-name-generator

This updates the six meaning presets and name counts recorded in the preceding surname/style QA note. The existing preview URL is retained.

## Delivered behavior

- Replaced six ambiguous representative-character chips with twelve explicit meaning choices: wisdom/learning, peace/calm, joy/happiness, courage/resolve, nature/landscapes, poetry/creativity, freedom/ambition, kindness/care, light/hope, poise/confidence, beauty/grace and good fortune. All twelve are visible. Their labels describe ideas, not characters that must appear in the output.
- Added original category descriptions and explicit whole-given-name category associations. The original six category IDs and existing tags remain compatible. New categories have different candidate pools rather than reusing one generic list.
- Added fifteen original given-name selections to support underserved categories: 惠宁、怀仁、仁雅、怀慈、嘉瑞、嘉悦、明曦、自若、瑾明、玉衡、瑾安、瑞安、嘉佑、舒云、思遥. The collection now has 176 given names and 21,113 valid complete-name combinations across the existing 120 surnames.
- Single meaning filters have at least three distinct candidates for each masculine/feminine/neutral preference when style/length are unrestricted and the surname is 林. Additional constraints can still narrow or empty the result; none are silently relaxed. Tests check these baseline pools and all twelve pools are distinct.
- Both selected meanings must match. The picker shows a selected count, checkmarks, selected descriptions and Clear meanings. Attempting a third selection gives an inline message without replacing either existing choice. Applied result reasons state the matched meanings.
- Desktop uses four columns, tablet three and mobile two, with 15px button labels and 56–64px minimum targets. Soft color accents, readable wrapping and explicit selected states replace the old Han glyph marks. Auxiliary copy remains at least 14px. The main surname/gender/style/length controls remain visible and independent.
- Added a server-rendered FAQ distinguishing meaning preferences from the separate exact-character mode. English-name fortune inspiration now uses the shared fortune category, including new 瑞安. Existing pronunciation, favorites, learning links and worksheet flow are retained.

## Resource checks

- Added 3,600 full-name/introduction recordings; the existing 38,626 recordings were independently hash-compared and unchanged. The current manifest contains 42,226 recordings totaling 448,087,680 bytes. Recording integrity, scripts, optional pronunciation spellings and duration metadata passed the release gate.
- All 232 required name characters have stroke coverage. Two unmodified source files were added in this task, bringing documented name-only additions to 44. These additions do not acquire an HSK level or nonexistent dictionary entry.
- No runtime AI, remote naming lookup or synthesis endpoint was introduced. Preset selection and generation remain browser work; clips are prepared ahead of time and load on use. Existing optional static-origin delivery applies to the new clips too.
- Complete native-speaker naming/pronunciation review is not claimed. Category associations are editorial interpretations, not predictions about an owner.

## Verification and evidence

- 31 relevant tests passed across name generation/resources, meaning behavior and number/stroke regressions. Nine focused name/meaning tests also passed after aligning English-name fortune matching. Cases cover twelve distinct pools, masculine/feminine/neutral candidates, meaning versus literal glyph behavior, two-filter intersection, invalid/third/duplicate inputs, exact-character recovery, original IDs and audio.
- Scoped ESLint and the accepted Next production build passed. Build report: 168 kB route JavaScript, 280 kB first load. These are local build figures, not field measurements.
- HTTP verification passed for all 3,600 new MP3s: 200 status, audio/mpeg and exact SHA-256. All 42,226 current files passed the offline asset gate. The prior 38,626 clips were verified unchanged against the preceding inventory.
- 3,162 scoped source/build files matched by hash. Preview HTML contains twelve meaning buttons without representative Han glyphs, the clarifying FAQ, one H1 and one production canonical URL.
- Browser: Kindness & care + Good fortune remained selected when Light & hope was attempted as a third choice; the inline limit message appeared. Generating returned 嘉宁、嘉佑、佳怡 combinations, all matching both categories.
- Browser: Clear meanings reset the choices. Masculine + 林 + Good fortune returned 林瑞安、林嘉佑、林嘉瑞. Matched meaning text appeared on the cards, using the applied selections.
- Browser: 林嘉瑞 name playback advanced with duration 1.608s; its complete 我叫林嘉瑞 introduction advanced with duration 1.896s. The worksheet link preserved the exact full name. The accepted browser console had no warnings/errors.
- Desktop, 320px and 390px layouts were checked. At 320px all twelve button scroll widths equaled their client widths; document/content widths matched. Viewport overrides were reset. The final marked preview remains open.

Evidence is in `tmp/name-meanings-20261106/`: `tests.log`, `meaning-tests-final.log`, `lint-final.log`, `build-accepted.log`, `release-check.log`, `release-assets.json`, `legacy-audio-check.json`, `http-check-accepted.log`, `preview-check.json`, the audio build logs, `desktop-meanings-accepted.png` and `mobile-meanings-320.png`. The bounded build source remains `tmp/name-expansion-20261106/build-source`.

The many unrelated working-tree edits are preserved. Production asset upload/origin configuration, production cache/CPU/billing and search/analytics backend receipts are outside this local optimization. See `chinese-name-assets-release.md` for publication preparation; the asset checker accepts `--output` to retain a separate release inventory for this change.
