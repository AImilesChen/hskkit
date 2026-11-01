# Advanced 7–9 example review — batches 3 and 4

Reviewed 1,000 additional entries: **06401–06900** and **06901–07400**.
The unified advanced band now has **2,000 reviewed examples and 3,600 pending**.
This is a partial release of the official 5,600-word advanced band; the source
files named 7, 8 and 9 do not define separate syllabus levels.

Each new 500-entry batch contains 124 editorial replacements or additions,
283 selected Zhongdex sentences and 93 selected Gushi sentences. The pinned
snapshots and CC BY-SA 4.0 licenses remain those listed in the review manifest.
Selected source records are frozen unchanged; adapted records retain the
upstream candidate's provider and ID in `replaces`, including public credits.

Chinese and English were reviewed for usage, sense, part of speech and alignment.
An additional character-by-character pinyin audit checked the possible readings
against the sentence and flagged repeated, omitted or incorrect syllables. A
contextual reading comparison was then manually inspected for polyphones; it was
not used to accept a dictionary's default reading automatically. This caught
duplicated syllables, 仿佛 pronounced with fó, 应该 pronounced with yìng, and
系好安全带 pronounced with xì. 调配更多人手 uses diàopèi, meaning allocation.

The stronger audit was also run over the previous 1,000 entries. Four earlier
records received limited phonetic/editorial corrections: **05682** 一切 qiè,
**05729** 休息 xiūxi, **05957** 浆糊 jiànghu and **05976** 邻国 línguó. Their
Chinese remains unchanged and their original source references are retained.
The other 996 earlier records remain unchanged.

## Sense and boundary corrections

| Entry | Reviewed distinction |
| --- | --- |
| 鹅 | Geese in a pond, rather than the substring in 企鹅 |
| 法人 | A legal entity, rather than its legal representative |
| 法治 | Rule of law, rather than a boundary match in 方法治疗 |
| 粉丝 | Separate glass-noodle and admirer senses |
| 缝 | Sewing féng versus a crack fèng |
| 杆 gǎn | 一杆秤, rather than 旗杆 gān or the different character 竿 |
| 管家 | A butler, matching the noun part of speech |
| 核 | A fruit stone, matching the noun sense |
| 活该 | Negative "serves him right", rather than praise for an achievement |
| 忌妒 | jìdu, distinct from 嫉妒 jídù |
| 驾 | Driving a horse-drawn cart, rather than a supposed surname |

## Eight catalog gloss corrections

Source catalog, authoring overrides and generated public search index were
updated together. The bounded runtime snapshot is regenerated from the catalog.

| Entry | Corrected coverage |
| --- | --- |
| 敷衍 | Half-hearted or perfunctory handling, preserving literary elaboration |
| 概 | Without exception, as in 概不; preserving general/approximate senses |
| 故 | Therefore/hence, matching the adverb/conjunction part of speech |
| 烘焙 | Baking, alongside drying or curing over a fire |
| 忽悠 | Tricking/duping, alongside rocking, swaying and flickering |
| 荒 | Neglect or leaving uncultivated, matching the verb part of speech |
| 荤 | Meat/non-vegetarian food, preserving the Buddhist vegetable sense |
| 忌 | Avoiding or abstaining, alongside fear and jealousy |

These senses were checked against the repository's pinned
`content/sources/cc-cedict-e0d756cb.txt.gz`, including the complete entries rather
than only the first few senses. Additional primary references:
[敷衍](https://dict.revised.moe.edu.tw/dictView.jsp?ID=37864&la=0&powerMode=0),
[概](https://dict.revised.moe.edu.tw/dictView.jsp?ID=3991),
[故](https://dict.revised.moe.edu.tw/dictView.jsp?ID=4201&la=0&powerMode=0),
[荒](https://dict.revised.moe.edu.tw/dictView.jsp?ID=5233&la=0&powerMode=0),
[荤](https://dict.revised.moe.edu.tw/dictView.jsp?ID=5216).

Migration 0056 preserves offline parity for the legacy search table. It is
idempotent and is tested with earlier migrations. **Public vocabulary release
uses the static catalog and does not require a remote D1 migration.** The
existing deployment workflow and credentials are unchanged.

## Validation

- 31 focused tests passed: all 2,000 advanced examples resolve consistently in
  word detail and Today, HSK 1–6 examples remain available, five-digit IDs and
  flashcard sampling remain valid, and public search works without legacy D1.
- Source selection remains explicit: the generator includes only reviewed
  records and still reports the 3,600 pending entries.
- New regression assertions cover the listed sense and phonetic errors and
  all eight gloss corrections through public search and offline SQL parity.
- Typecheck and the production Next.js build passed (942 static pages).
- Local production SSR verified 27 advanced word pages, including the four
  earlier phonetic corrections, and HSK 1, 4, 5 and 6 regression pages.
- Deployment and online acceptance are recorded separately after completion.
