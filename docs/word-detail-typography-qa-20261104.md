# Word detail typography: unified Noto Serif SC

Date: 2026-11-04. Final state: local preview verified; not deployed.
Preview: http://127.0.0.1:3020/word/hsk2025.word.l1.0001.v1

The user selected the existing travel-card Noto Serif SC appearance in place of the earlier WenKai direction. Word titles, Chinese examples, collocations, comparison words, character links and next-word Chinese now use the shared --font-chinese stack (Noto Serif SC first). English, pinyin and navigation retain Inter. Existing light word layout, compact metadata, audio icon, example highlighting and learning controls remain. No site-wide font variables or root font configuration were changed.

The WenKai font import was removed. The unshipped web shards, generated CSS, generation script and asset-specific tests were moved into ignored tmp/word-refresh-20261104/retired-wenkai for reversible archival. They are excluded from the final release scope; no extra font payload or runtime dependency is needed.

Validation:
- Typecheck passed; scoped ESLint passed without warnings; whitespace check passed.
- 14 existing dictionary audio-layout and learning-loop tests passed.
- Browser computed styles confirm Noto Serif SC for the main title and example, Inter for pinyin, and the existing Inter/Noto Sans UI stack for navigation. Browser font readiness check returned true for the title.
- 爱 -> 愛 -> 爱 switching passed. Desktop title is 88px regular; complete example ends at 699.97px in the 1280x720 viewport.
- Checked 谢谢 at 390x844 and 不好意思 at 320x740. The four-character title scales to 42px. The word content fits; the shared shell still has its previously observed 1px document/client rounding difference at 320px. No new component overflow was introduced.
- Saved and opened current screenshots: tmp/word-serif-20261104/desktop-ai.jpg, mobile-xiexie.jpg, mobile-long.jpg. The mobile 谢谢 capture includes initial audio metadata loading; it is typography evidence, not playback verification.
- Normal viewport restored and the local 爱 page retained for review.

The local learning API remains temporarily unavailable, as before this correction. Save/Today/Review writes were not tested or modified. No production build, deployment, account write or new audio claim is part of this handoff.

Current release scope: tmp/word-serif-20261104/scope.json. This supersedes the earlier WenKai scope and report.

## Latest correction: text emphasis and pinyin tones

The user rejected the example target background. Replaced mark with semantic strong text, blue foreground, transparent background and no border. Chinese learning typography remains Noto Serif SC; pinyin/UI remain Inter.

Revisited HSKLord 谢谢 in the in-app browser. Current computed tone colors: first #b42318, second #15803d, third #1d4ed8, fourth #6d28d9, neutral gray. Used the same semantic distinction in a component scoped to word detail pages. It renders the main pronunciation, examples, collocations, comparison entries, related words and next-word pinyin. Tone marks, punctuation, casing and original pinyin text are retained. A native collapsible Tone colours guide explains the mapping.

A small syllable lexicon was derived from the current character index (398 bases). The renderer segments concatenated pinyin such as bāngzhù into separate syllables; ambiguous spellings stay uncoloured instead of receiving a guessed boundary. No third-tone sandhi or underlying pronunciation data is rewritten. Forced-colors mode keeps text readable without background rectangles.

Typecheck, scoped ESLint and 18 tests passed (dictionary-pinyin-display, dictionary-word-audio-layout, dictionary-p2-learning-loop). Tests cover per-syllable tones, neutral tones, ü, erhua, casing, punctuation, ambiguous spellings and preservation of every active word's original pinyin. Browser verified transparent/0px-border target emphasis, ài fourth-tone coloring, sentence tones, expandable guide and separate xiè/xie colors. 390x844 screenshot has zero horizontal overflow. Main 爱 example still ends at 699.97px in 1280x720.

Current evidence: tmp/word-tone-20261104/desktop-ai.jpg and mobile-xiexie.jpg, both saved, opened and inspected. The normal viewport was restored and the local 爱 page retained. Existing local learning API limits remain. This change is not deployed.

Final release scope: tmp/word-tone-20261104/scope.json (supersedes earlier scope manifests).
