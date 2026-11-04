# Word detail content and layout

Date: 2026-11-04. Status: local implementation verified, not deployed.
Production baseline: 5e72a3b1c70307d62be5ecfaadbcb65cb32cafd4.

## Scope

Reworked the shared word detail template into an overview with character facts and inline learning actions, followed by examples with related words, character-containing vocabulary, combinations and usage, linked grammar, pronunciation comparisons and grounded reading links. No persistent learning mutations, corpus entries, global fonts, homepage, commercial products or audio assets were changed.

Chinese learning text retains Noto Serif SC. English and pinyin retain Inter. Tone marks and per-syllable colours are retained. Example target emphasis is blue text with transparent background and no box. The independent full-page learning rail was removed. Native disclosure controls handle extra examples, higher-level containing words and pronunciation comparisons.

Containing-word suggestions come from the active catalog character index, ordered by level and length, excluding the current word and visible related recommendations, and deduplicated across character groups. Beginner pages show entries up to HSK 3 first; entries above that level are expandable. At higher levels, the threshold follows the current word. For 三, the catalog's containing words begin at HSK 6, so they are folded and an everyday-combinations link is provided. Multi-character words show up to four character groups; all indexed characters remain accessible in the overview.

## Supplementary teaching content

Added ID-based material for 爱, 三 and 学习, shared by canonical and friendly URLs. Each canonical sample has three distinct examples, three combinations, usage guidance and three related words with explicit relationships. Grammar recommendations point to existing courses and explain an example actually present on the page. Existing source examples take precedence during deduplication. Supplementary teaching content is authored for this change; it does not receive an invented corpus approval status.

Reading recommendations require an exact vocabulary entry or a complete multi-character word in an existing published passage. No single incidental character matching, guessed blog URLs, duplicate marketing content or empty content panels are used. Learning-course levels are displayed even when higher than the word's level.

## Active canonical catalog coverage

Measured against hsk3-hsk123456789-2025-v11; excludes friendly aliases. Full machine-readable evidence is tmp/word-content-20261104/coverage.json.

| Available content | Canonical word pages |
| --- | ---: |
| Shared template and existing example | 11,000 |
| Indexed character facts | 11,000 |
| Other containing-word suggestions | 10,740 |
| Multiple examples | 3 |
| Combinations and supplementary usage | 3 |
| Explicit related-word recommendations | 3 |
| Linked grammar | 3 |
| Grounded reading recommendations | 141 |

These counts distinguish automatic reuse of existing data from newly authored supplements. This is not a claim that all 11,000 words have multiple examples or editorial notes.

## Verification

- Typecheck and scoped ESLint passed. Twenty-two dictionary tests passed, including active-catalog suggestions, self/duplicate exclusions, level ordering, filter URLs, source preservation, canonical/alias consistency, grammar-reference integrity and pinyin rendering.
- Desktop 爱: three examples, related words, containing words, combinations and a grammar association render. No horizontal overflow. Font and transparent target emphasis confirmed in computed styles.
- Browser navigation from 学习 to Browse all words with 学 opened the dictionary with query 学 and All levels selected; actual results rendered. The linked 吗 grammar course loaded successfully.
- 三 and 学习 checked in the browser. 学习 shows separate 学 and 习 vocabulary groups and a real HSK 4 reading link.
- At 390x844, lists become one column and no horizontal overflow was observed. At 320x740, 不好意思 uses a 42px title with four character facts and no horizontal overflow. Narrow character facts were tightened after inspection. Temporary viewport overrides were reset to the normal 1280px view.
- Saved and visually inspected desktop-overview.jpg, desktop-examples-related.jpg, desktop-grammar.jpg, mobile-xuexi-containing.jpg and mobile-long-word.jpg in tmp/word-content-20261104. The final desktop preview is retained in the in-app browser.

Local /api/v1/learning is still unavailable; Save/Today/Review writes were not tested. The action component and its mutation handlers are unchanged. No new sentence audio is claimed or generated. No production build or deployment was performed in this change.
