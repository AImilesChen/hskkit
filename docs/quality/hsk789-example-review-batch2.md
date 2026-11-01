# Advanced 7–9 example review — batch 2

Reviewed 500 additional entries, **05901–06400 (成心 through 敦促)**.
The unified advanced band now has **1,000 reviewed examples and 4,600 pending**.
All 500 records from batch 1 remain unchanged.

This batch contains 201 editorial replacements or additions, 220 selected Zhongdex
sentences and 79 selected Gushi sentences. The source snapshots and licenses are
the same pinned sources recorded for batch 1. Selected source sentences remain
unmodified. Replacement records also retain the upstream candidate ID when one
existed; the public attribution output carries that reference alongside the
HSKKit credit. Candidate material outside the reviewed set remains excluded.

Each record was checked for Chinese usage, target sense and part of speech,
tone-marked pinyin and corresponding English. Representative corrections:

| Entry | Rejected candidate | Reviewed usage |
| --- | --- | --- |
| 持平 | 保持平和, an accidental substring | Sales remaining level with last year |
| 穿着 (N) | Wearing a dress, pronounced chuānzhe | Attire, pronounced chuānzhuó |
| 次要 | 每次要, an accidental boundary match | Secondary issues |
| 丛 (M) | 丛林狼, a compound for coyote | A clump of bamboo |
| 打 (Prep) | 打电话 | Since that time |
| 大为 | The personal name 马大为 | Greatly surprised |
| 大意 dàyi / dàyì | A careless/main-idea sense mismatch | Separate careless and main-idea sentences |
| 担 dān / dàn | An unrelated worry example for the carrying verb | Carrying two buckets versus the load classifier |
| 地道 (N) | Authentic cuisine | A tunnel |
| 调 diào (N) | Adjusting an air conditioner, which requires tiáo | A song's tune |
| 丁 | 尼古丁 (nicotine) | The fourth label in 甲乙丙丁 |
| 定做 | 决定做, an accidental boundary match | A custom-made bookcase |
| 动感 / 动员 | 运动感兴趣 / 运动员 | Lively rhythm / mobilizing residents |
| 都会 dūhuì | An ambiguous short sentence | A bustling metropolis |

底蕴 is used in its recorded sense of underlying facts, checked against the
[MOE dictionary](https://dict.revised.moe.edu.tw/dictView.jsp?ID=45086&la=0&powerMode=0).
No catalog gloss changes or new database migrations are part of this batch.

Regression coverage includes the two 大意 readings, both 担 readings, the
prepositional 打, nominal 穿着/地道/调, the classifier 丛, accidental substring
matches, and rejection of mismatched readings. A separate syllable-count audit
flagged no sentence with a discrepancy exceeding one syllable; this heuristic
was used only as an additional check, not as evidence of semantic approval.

Review of production routing confirmed that public vocabulary is served from the
static catalog. The release workflow was restored without the unused legacy D1
migration prerequisite; see hsk789-release-routing-review.md. No new database
permissions are required for publishing this example batch.

The first-batch release was retried after correcting that dependency. Its build,
deployment and online checks are recorded separately; this batch is prepared as
a separate change after the first release.

## Validation

- 30 focused regression tests passed, including all reviewed advanced examples,
  HSK 1–6 examples, catalog membership, flashcards and database boundaries.
- TypeScript typecheck and the production Next.js build passed (942 static pages).
- Local production SSR verified exact Chinese and pinyin for twelve new entries,
  including the two 大意 readings, nominal 地道/调, the prepositional 打 and 都会.
- The public request handler returned the four corrected glosses and a 20-card
  advanced set even when passed a legacy database object that throws on access.
- The Cloudflare route wrapper itself requires Cloudflare's runtime context and
  is verified on the deployed Worker, rather than using local `next start` as an
  equivalent API environment.
