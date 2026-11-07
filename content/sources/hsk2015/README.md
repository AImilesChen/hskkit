# HSK 2.0 source workbook

`HSK-2015.xlsx` was retrieved from Chinese Testing International on 2026-11-06:
https://www.chinesetest.cn/userfiles/file/HSK/HSK-2015.xlsx

SHA-256: `7e3c8cac7f8c2be9c0f8b48ed155db234d065b1d874bb98bdc8b845e7a70c76c`.
The workbook contains 5,000 source rows, with introduced-level and headword fields.
It does not supply pinyin, English definitions, examples or audio. No licence for
those additional fields is inferred from this workbook. Preserve the original
source labels and row IDs, including grammatical disambiguators in parentheses.

The comparison groups only the explicitly listed grammatical disambiguators for
headword-level counting, retaining every original record. Matching a headword does
not establish mastery of all its readings or meanings. No automatic traditional,
spelling or erhua equivalence is applied.

The new list is the site's reviewed 2025 examination syllabus release, not the
2021 national standard. English and audio retain their existing HSKKit attribution.
Old-only English lookup is derived separately from the pinned CC-CEDICT snapshot
(CC BY-SA 4.0); it is display enrichment and never changes comparison membership.
https://cc-cedict.org/wiki/ · https://creativecommons.org/licenses/by-sa/4.0/

Rebuild deterministically, without network access:
`python scripts/content/build-hsk-vocabulary-comparison.py`.
