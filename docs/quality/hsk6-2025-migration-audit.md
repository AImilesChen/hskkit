# HSK 6 2025 syllabus migration audit (2026-10-30)

## Source and scope

- Verified official syllabus PDF SHA-256: `ec74ce0439e837bbb15154be13e747ae798903b2fd3a331629df6c3b45504941`.
- HSK 6 comprises official rows 3601–5400, 1,800 consecutive entries. The previous published HSK 6 contained 1,140 words.
- The row-level crosswalk and editorial draft are kept outside the public repository. The aggregate audit can be reproduced with `scripts/content/audit-hsk6-2025.py` from the verified PDF.

## Comparison and editorial checks

| Initial match category | Rows |
| --- | ---: |
| Exact spelling and pinyin in another level | 1,162 |
| Exact spelling and pinyin in previous HSK 6 | 478 |
| New spelling | 126 |
| Pinyin or sense variant in another level | 17 |
| Pinyin or sense variant in previous HSK 6 | 8 |
| Ambiguous match in another level | 6 |
| Ambiguous match in previous HSK 6 | 3 |
| **Total** | **1,800** |

The crosswalk flagged 160 rows for review, including 19 missing part-of-speech values. The approved draft has 1,800 unique official orders and IDs with nonempty Hanzi, traditional form, pinyin, learner gloss and part of speech. It records 1,642 supported legacy links. One hundred thirty-four glosses received editorial overrides; the remaining definitions were checked for empty or raw dictionary markers. A full independent human proofread of all 1,800 glosses remains an editorial follow-up.

No new HSK 6 audio is published. The new entries do not claim playable pronunciation; old recordings remain available only through their archived historical records. The team has not identified a free audio source with confirmed redistribution rights for a commercial site.

## Local release evidence

- The new release is `hsk3-hsk123456-2025-v10`: 1,800 Level 6 words and 11,036 active words overall. The other 9,236 search records are byte-for-byte equal to v9 apart from their release ID. Old HSK 6 entries are archived for historical learning links.
- The catalog, public search index, runtime index and character index were regenerated. Nine newly needed Chinese characters were added to the source index.
- The Level 6 PDF has 168 A4 pages and 1,800 entries. The `level-6`, `progression-4-6` and `complete-1-9` deliveries produced 26 files in the versioned generation. Both ZIPs passed CRC checks. Store samples were rendered from the generated PDFs, and the Level 6 interior page was visually checked.
- Targeted catalog, dictionary, Store and commercial tests passed (18/18), as did TypeScript typecheck, content validation and the production build. Live deployment and D1 activation are separate gates.

## Deployment and CPU guard

Upload only the new versioned commercial files, stage the D1 search index while v9 remains active, deploy the matching site, then activate v10 and verify live Level 6, dictionary and Store routes. The migration work is offline and the D1 insert is one-time; it does not add per-request vocabulary processing. Compare Cloudflare Worker CPU and D1 metrics after release before changing further levels.
