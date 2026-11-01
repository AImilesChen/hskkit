# Advanced 7–9 example review — batches 5 and 6

Reviewed **07401–08400**, bringing the unified advanced band to **3,000 reviewed
examples and 2,600 pending**. Earlier 2,000 review records remain unchanged.

Batch 5 has 96 editorial replacements/additions, 312 selected Zhongdex sentences
and 92 selected Gushi sentences. Batch 6 has 121 editorial replacements/additions,
280 selected Zhongdex sentences and 99 selected Gushi sentences. Selected source
records remain unchanged; adaptations retain source-provider and upstream-ID
references. All use the existing pinned snapshots and CC BY-SA 4.0 attribution.

The review covered Chinese usage, English correspondence, lexical sense, reading
and part of speech. Missing entries and unsuitable candidates were replaced
explicitly. Alternative source sentences were separately reviewed before being
selected. Character-level pinyin alignment and a contextual polyphone comparison
provided additional checks; differences were inspected rather than automatically
accepting a pronunciation engine's choice. 被公认为 now uses wéi, not wèi.

## Representative distinctions

| Entry | Reviewed sense |
| --- | --- |
| 见外 | Treating a friend like a stranger, rather than 只见外面/听见外头 |
| 焦 | Scorched bread, rather than anxiety in 焦虑 |
| 劲 jìn | Strength, rather than 劲风 jìngfēng |
| 经 | Passing through approval, rather than the substring in 经理 |
| 圈 juān / juàn | Confining sheep versus their pen |
| 空军 | Air force, rather than fishing slang for catching nothing |
| 孔 | A drilled hole, rather than the surname in 孔子 |
| 良 | Literary adverb in 良可欣慰, rather than a personal name |
| 露 (N) | Dew, rather than the verb "to reveal" |
| 落成 | Completion of a library, rather than the boundary in 堕落成 |
| 麻 | Numbing flavor versus hemp material |
| 码 | Yards of fabric versus stacking boxes |
| 马力 | Horsepower, rather than a person's name |
| 美德 | Virtue, rather than 美/德 as abbreviations of countries |
| 民营 / 民用 | Private business / civilian use, rather than 难民营 / 农民用 |
| 命 | Ordering guards, rather than the substring in 维他命 |
| 蘑菇 | Mushrooms, rather than the unrelated colloquial pestering verb |
| 幕 | The act classifier for a play, rather than a screen |
| 内存 | Computer memory, rather than 海内存知己 or 界内存在 |
| 鸟巢 | A bird's nest, rather than the stadium's proper name |
| 拧 níng / nǐng | Wringing a towel versus twisting a cap open |

## Catalog corrections

Six glosses were aligned with their recorded senses and parts of speech:
戒 includes giving up an activity; 精 includes fine/refined/proficient;
精练 includes concise/polished rather than only textile scouring;
码 has separate yard-classifier and stacking-verb definitions; and 拧 nǐng has
verbal twisting/turning meanings rather than leading with the noun "mistake".
The complete pinned CC-CEDICT entries, including the referenced 精炼 variant,
were checked rather than taking only their first sense.

空前 retains its official identity and spelling. HSKKit's learner part-of-speech
label is corrected to **Adj** for "unprecedented". The retained official
crosswalk labels it 动; this difference is explicit in the draft builder's
`REVIEWED_STUDY_POS` override and does not alter `officialPartOfSpeech`.

Additional primary references:
[拧: the two readings and examples](https://dict.revised.moe.edu.tw/dictView.jsp?ID=3119&q=1&word=%E6%93%B0),
[空前未有: unprecedented descriptive usage](https://dict.revised.moe.edu.tw/dictView.jsp?ID=78879).

Source catalog, authoring overrides and public search index are updated together.
Migration 0057 maintains offline legacy-table parity only. Production vocabulary
still uses the static index and needs no remote D1 migration or Token update.

## Validation

32 focused regression tests passed, covering all 3,000 reviewed examples in word
detail and Today, HSK 1–6 examples, all 5,600 valid advanced IDs, flashcard sampling,
corrected public-search data without legacy D1, and idempotent offline migration
parity. The commercial syllabus-membership regression, TypeScript typecheck and
production build also passed (942 static pages). Local production SSR checked
32 advanced word pages and HSK 1/4/5/6 regression pages. Online release acceptance
is recorded separately after deployment.

The paid vocabulary snapshot and generated download artifacts remain a separate
follow-up after the remaining advanced editorial review, so they can receive one
coherent version update rather than changing the frozen artifact version for
each partial example batch.
