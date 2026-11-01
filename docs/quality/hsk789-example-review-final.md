# HSK 7–9 final example review

The final 1,600 records cover official sequence 9401–11000. Batches 9, 10 and 11 contain 500 records each; batch 12 contains 100. Together with the previously published 4,000, all 5,600 words now have reviewed examples. The official syllabus remains one combined 7–9 band.

## Review and source handling

Every candidate's Chinese and English was read against the target word and sense. The initial pass identified 360 unsuitable or questionable candidates; 235 alternative source sentences were then selected after review. Missing or unsuitable examples received editorial replacements. The final pass also corrected contextual readings of 一切, 唯美, 昆虫 and 行为 and replaced the grammatical 之 example with the catalog's pronominal sense.

| Batch | Zhongdex selected | Gushi selected | HSKKit editorial replacement |
| --- | ---: | ---: | ---: |
| 9 | 282 | 124 | 94 |
| 10 | 266 | 123 | 111 |
| 11 | 310 | 101 | 89 |
| 12 | 58 | 21 | 21 |

Selected source records and triples are frozen in the review manifest. Adapted material retains its replaced source ID and CC BY-SA 4.0 attribution. The original source hashes and notices remain unchanged. All prior 4,000 reviewed manifest entries were compared with the previous commit and remain unchanged.

## Corrections

Examples distinguish pedestrian 天桥 from a place name, 峡谷 from fish gills, 香油 from fragrance oil, 心得 from 小心得病, 自行 from 自行车, 总和 from 总和别人, and the noun/verb entries 制服 and 自负. Idioms such as 异口同声 and 有声有色 now use their intended meanings. Generic claims about cancer cures, drug absorption and acupuncture efficacy were replaced by descriptive language examples.

Twenty-four glosses were corrected or expanded, including 贴切, 下场 (noun), 小菜一碟, 卸载, 余 (after a number), 侦查, 支架 and 宗 (classifier). Five learner part-of-speech labels were corrected: 无理, 直至, 终极, 转眼 and 自尊. The draft builder retains the originally parsed official labels while explicitly applying reviewed learner-label overrides.

Reference checks: the pinned CC-CEDICT full entries (including senses previously lost by first-sense extraction), [MOE 贴切](https://dict.concised.moe.edu.tw/dictView.jsp?ID=10861&la=1&powerMode=0), and [MOE 下场](https://pedia.cloud.edu.tw/Entry/Detail/?title=%E4%B8%8B%E5%A0%B4). English wording and replacement examples are editorial rather than copied from those dictionaries.

Character-to-syllable alignment was checked for every final example. Contextual polyphone differences were manually reviewed; the phonetic engine's false positives were not applied automatically. Exact target readings and meaning/POS bindings are enforced by the offline generator. Public routes continue to use the static index; migration 0059 only preserves offline legacy-table parity.

## Release scope

This change completes the public advanced example dataset. The frozen commercial vocabulary snapshot and downloadable artifacts require a coordinated refreshed release after this review, so this document does not claim those older files have already been regenerated or published.
