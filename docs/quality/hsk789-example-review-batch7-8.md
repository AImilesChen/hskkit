# Advanced 7–9 example review — batches 7 and 8

Reviewed **08401–09400**. The unified advanced band now contains **4,000 reviewed
examples and 1,600 pending**. All earlier 3,000 review records remain unchanged.

Batch 7 contains 91 editorial additions/adaptations, 301 selected Zhongdex
sentences and 108 selected Gushi sentences. Batch 8 contains 97 editorial
additions/adaptations, 305 selected Zhongdex sentences and 98 selected Gushi
sentences. All selected sources are pinned and CC BY-SA 4.0 licensed. Frozen
source records remain unchanged; editorial adaptations retain replacement IDs
and upstream-provider references in the public attribution file.

Chinese and English were checked for usage and sense. Alternatives were inspected
before selection. Character-level pinyin checks and a separately inspected
contextual reading comparison caught additional pronunciation mistakes, including
空地 kòngdì, 系好安全带 jì, 挑剔 tiāotī and 流露 liúlù. These checks did not automatically
approve a source sentence or treat a pronunciation engine as authoritative.

## Important corrections

| Entry | Reviewed distinction |
| --- | --- |
| 脾 | Spleen, rather than temper in 脾气 |
| 气管 | Windpipe, rather than the boundary in 燃气管道 |
| 器具 | Utensils, rather than the boundary in 电器具备 |
| 亲身 | Personally doing something, rather than 父亲身体 |
| 求学 | Going away to study, rather than 要求学生 |
| 全能 | An all-round athlete, rather than 完全能胜任 |
| 人间 | Human world, rather than 单人间 or 情人间 |
| 人身 | Personal attack, rather than 人身体健康 |
| 人性 / 任性 | Human nature rénxìng versus willful rènxìng |
| 商机 | Business opportunity, rather than 磋商机制 |
| 上报 | Reporting to a supervisor, rather than replying to a letter |
| 上空 / 上行 | Overhead / moving up, rather than topless slang / 马上行动 |
| 折 shé | A branch snapping, rather than 折磨 zhé |
| 生平 / 生前 | A person's life / while alive, rather than 女生平均 / 出生前 |
| 书记 | Secretary, rather than 这本书记录 |
| 率 shuài | Leading a team, rather than frankness in 坦率 |
| 说情 | Pleading for a friend, rather than 说情况 |
| 随机 | Random selection, rather than the different phrase 随机应变 |
| 太平 | Peaceful, rather than the proper name 太平洋 |
| 讨 | Asking for water, rather than the distinct research sense in 讨论 |
| 腾 | Clearing space, rather than the differently read 慢腾腾 |

The public catalog's reading for **任性** is corrected from rénxìng to rènxìng,
supported by the pinned CC-CEDICT entry and the
[MOE dictionary](https://dict.revised.moe.edu.tw/dictView.jsp?ID=136205&la=0&powerMode=0).
The draft builder preserves the parsed source reading in `sourcePinyin` and
applies an explicit reviewed reading override. It also distinguishes the modern
learner noun label for 司法 from the retained source label 动. No word ID or
official sequence is changed.

起码 gains its adjective meaning "minimum/basic" alongside "at least". 腾 gains
its common making-room/clearing-out meanings, verified in the complete pinned
CC-CEDICT entry. Source catalog, authoring overrides and public search output are
updated together. Offline migration 0058 preserves legacy-table parity, including
the corrected reading and POS; production deployment still uses the static index.

Additional primary phonetic references:
[空地](https://dict.revised.moe.edu.tw/dictView.jsp?ID=79075&la=1&powerMode=0),
[挑剔](https://dict.revised.moe.edu.tw/dictView.jsp?ID=52482),
[流露](https://dict.revised.moe.edu.tw/dictView.jsp?ID=63358&q=1&word=%E6%B5%81).

34 targeted tests passed, covering all 4,000 examples in word detail and Today,
HSK 1–6 regressions, commercial syllabus membership, valid advanced IDs, seeded
flashcards, corrected public search without legacy D1 and offline migration
parity. TypeScript typecheck and the production build passed (942 static pages).
Local production SSR checked 34 advanced pages plus HSK 1/4/5/6 regression pages.
Release acceptance is recorded separately after deployment. The generator
continues to exclude the 1,600 pending entries.
