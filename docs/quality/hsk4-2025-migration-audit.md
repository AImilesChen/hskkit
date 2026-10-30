# HSK 4 2025 syllabus migration audit (2026-10-30)

## Source and boundary

- Official syllabus PDF SHA-256: `ec74ce0439e837bbb15154be13e747ae798903b2fd3a331629df6c3b45504941`.
- HSK 4 occupies source rows 1001–2000: exactly 1,000 rows, with no missing row numbers or empty spelling/pinyin in the extracted source.
- The current active HSK 4 catalog has 1,000 entries under the separately labelled 2021 study standard. Equal counts do **not** imply matching membership.
- The full official crosswalk is kept outside this public checkout; `scripts/content/audit-hsk4-2025.py` prints only aggregate results.

## Word-level comparison

| Category | Rows |
| --- | ---: |
| Same level, exact spelling and pinyin | 225 |
| Other level, exact spelling and pinyin | 719 |
| Other level, variant or sense review | 11 |
| Ambiguous matches in other levels | 10 |
| Same level, variant or sense review | 1 |
| New spelling | 34 |
| **Total** | **1,000** |

Fifty-six rows require manual lineage or sense review; six official rows have no parsed part-of-speech field. The private draft resolves all six as phrases, leaves 42 rows deliberately without a legacy ID, and adds 215 independently edited teaching glosses. A spelling and pinyin cross-check identifies 65 readings that need human listening, including polyphonic words and neutral-tone forms. Existing HSK 4 audio cannot be treated as complete coverage.

The previous free Edge Read Aloud synthesis path has no explicit public commercial redistribution grant. Microsoft's published Azure product terms grant commercial use of neural TTS output to paid-tier customers only. New audio generated with that path was discarded and is excluded from the HSK 4 release. Source: https://www.microsoft.com/licensing/terms/en-US/product/MicrosoftAzure/all .

## Release gate

Do not relabel the existing 1,000 entries as the 2025 HSK 4 list. Before publication: finish independent gloss and traditional-form review; obtain an explicitly commercial-use-licensed audio source or leave audio unavailable with honest labelling; update all HSK 4 commercial deliverables and dependent bundles; verify the active catalog plus saved-learning compatibility. Keep HSK 5–9 on their current explicitly labelled standard until their own level passes the same gates.
