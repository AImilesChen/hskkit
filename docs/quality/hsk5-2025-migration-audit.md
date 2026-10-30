# HSK 5 2025 syllabus migration audit (2026-10-30)

## Source and scope

- Official syllabus PDF SHA-256: `ec74ce0439e837bbb15154be13e747ae798903b2fd3a331629df6c3b45504941`.
- HSK 5 occupies official rows 2001–3600: 1,600 consecutive rows. The previous HSK 5 release contained 1,071 words. Counts alone do not establish membership.
- The word-level official crosswalk and editorial draft are held outside the public checkout. `scripts/content/audit-hsk5-2025.py` can reproduce the aggregate audit from the verified PDF.

## Comparison and editorial checks

| Initial match category | Rows |
| --- | ---: |
| Exact spelling and pinyin in another level | 1,157 |
| Exact spelling and pinyin in previous HSK 5 | 358 |
| New spelling | 56 |
| Ambiguous match in another level | 14 |
| Same-level pinyin or sense variant | 4 |
| Other-level pinyin or sense variant | 11 |
| **Total** | **1,600** |

The initial crosswalk flagged 85 rows for lineage or sense review and 12 missing part-of-speech values. The staged draft contains 1,600 nonempty Hanzi, pinyin and English gloss records. It links 1,519 entries to previous IDs where the relationship was supportable; the remaining entries receive new IDs without guessing a lineage. Two hundred twenty-four English glosses were edited for learner-facing clarity. Automated checks confirm unique official order and IDs, nonempty fields, and absence of raw dictionary markers. A complete independent human proofread of every gloss remains a separate editorial task.

No new HSK 5 audio is included. Existing recordings remain attached only to previously published IDs when their historical learning record is accessed; the new HSK 5 entries do not claim playable audio. This avoids commercial licensing and polyphonic-reading assumptions.

## Local release evidence

- Active release: `hsk3-hsk12345-2025-v9`, with 1,600 Level 5 words and 10,376 active words overall. The older HSK 5 entries are archived for saved learning links.
- Static catalog, runtime index and character index were regenerated. The character index contains 2,970 active characters; three newly required characters were added to the source index.
- Level 5 PDF: 150 A4 pages, 1,600 entries. The Level 5 product, Progression 4–6 and Complete 1–9 deliveries were generated locally under `complete-vocabulary-hsk12345-2025-v1`. PDF cover and interior pages were visually checked; store samples were rendered from the generated Level 5 PDF.
- Targeted catalog, dictionary, learning and commercial tests: 69 passed. TypeScript typecheck passed. Production build and deployment are separate gates.

## Deployment sequence and cost guard

Keep the release private until its R2 files and D1 migration are ready. Upload the new versioned commercial files, stage the search index, deploy the matching site version, then verify live Level 5 words, word details, bundles, checkout initiation and historical IDs. The migration is an offline, one-time D1 operation; static catalog and PDF delivery do not add per-request vocabulary computation. Check Worker CPU and D1 usage after release before starting HSK 6.
