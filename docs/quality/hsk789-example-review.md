# Advanced 7–9 example review — batch 1

The advanced syllabus remains one 5,600-entry band. This batch reviews **500 entries,
05401–05900**, from 挨 (āi) through 成天. **5,100 examples remain pending**; this is
not completion of the full advanced optimization and is not a production deployment.

Every sentence in this batch was checked for the entry's sense, pronunciation,
natural Chinese and corresponding English. There are 199 newly written replacements,
one reused HSKKit example (倡导, preserving its existing Today context), 78 selected
Gushi examples and 222 selected Zhongdex examples. Candidate sentences outside this
reviewed set are not imported into the runtime table.

Representative rejected candidates include 挨训 for 挨 āi, 出类拔萃 for 拔,
图标点击 for 标点, 不下雨 for 不下 “at least”, 不容易 for 不容, 神采奕奕 for 采,
and Peugeot for the adjective 标致. Repeated, missing and incorrect pinyin and
inaccurate translations were replaced as part of the same review.

## Reproduction and provenance

Run `python scripts/build-hsk789-examples.py` after regenerating the public catalog.
It is also part of prebuild. The input is `scripts/hsk789-example-review.json`:
only explicitly reviewed records are accepted. It freezes the selected source
sentences, word readings, senses and parts of speech; a changed catalog entry fails
generation and requires another review. Outputs contain runtime tuples, public
per-entry attribution and an exact pending-ID ledger.

Gushi source files 7/8/9 are combined solely as candidate material; their artificial
subdivisions never become HSKKit syllabus levels. Their original URLs and checksums
are recorded in the review input. Zhongdex is pinned to commit
`7526f5a6fbcc0f4298337cce2ed492289b2b0b33`, with the full source checksum and selected
records retained, including original sentence IDs, source metadata and headword
links. Its NOTICE and data license are preserved under `content/sources/zhongdex`.
Selected sentence text is unmodified. HSKKit replacements are original sentences;
the adapted collection is distributed under CC BY-SA 4.0.

## Catalog corrections

Four glosses were inconsistent with the syllabus part of speech or selected sense.
Corrections were made in the source catalog, draft-generation overrides, generated
public/runtime indexes and migration 0055 for existing search databases:

| ID sequence | Word | Previous gloss | Reviewed gloss |
| --- | --- | --- | --- |
| 05448 | 霸道 (Adj) | the Way of the Hegemon | overbearing; domineering |
| 05629 | 辩证 (V/Adj) | to investigate | dialectical; to investigate through reasoning |
| 05631 | 标 (V) | mark; sign; label | to mark; to label; to indicate |
| 05641 | 标致 (Adj) | Peugeot (automobile brand) | beautiful; pretty; good-looking |

References: the pinned CC-CEDICT source `content/sources/cc-cedict-e0d756cb.txt.gz`,
[MOE 霸道](https://dict.revised.moe.edu.tw/dictView.jsp?ID=12660&la=0&powerMode=0),
[MOE 辩证](https://dict.revised.moe.edu.tw/dictView.jsp?ID=19058&la=0&powerMode=0),
and [MOE 标致](https://dict.revised.moe.edu.tw/dictView.jsp?ID=18487&la=0&powerMode=0).
The active catalog's tone-marked headword readings remain unchanged.

## Advanced paths corrected

The old asset-ID validator accepted only four-digit word sequences. Advanced 2025
IDs have five digits, so entries outside the bounded runtime snapshot could return
missing. The validator now accepts the canonical five-digit l7 IDs while retaining
four-digit historical IDs and rejecting invented l8/l9 catalogs.

Catalog fallback now maps the string `7-9` to numeric level 7 before looking up
examples. Static flashcard sorting reads the full sequence, and the equivalent D1
query no longer truncates five-digit IDs. Regression tests cover lookup for all
5,600 active advanced words, static/D1 shuffle parity, every reviewed example in
word detail and Today, and exclusion of all pending IDs from editorial lookup.

## Validation

- TypeScript typecheck passed.
- 25 relevant regression tests passed, including the HSK 1–6 example suites,
  advanced catalog/export membership and quick flashcards.
- Production Next.js build passed and generated 942 static pages.
- Local production SSR returned 200 for eight reviewed advanced words spanning
  runtime and full-catalog paths, with exact Chinese/pinyin examples, and for
  the final advanced word 做主. License-page attribution was checked as well.
- Source-catalog comparison confirmed exactly the four intended gloss changes.

No production deployment or remote database migration was performed. Apply 0055
to the production search database as part of a later authorized release, so D1
search and the static catalog use the same corrected glosses.
