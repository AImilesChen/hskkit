# HSK 7–9 2025 vocabulary migration audit

## Source and scope

- Official 2025 HSK examination syllabus PDF, local SHA-256 `ec74ce0439e837bbb15154be13e747ae798903b2fd3a331629df6c3b45504941`.
- The source numbers the Advanced 7–9 vocabulary rows 5,401–11,000. This is one unified 5,600-entry band, not three separate level lists.
- HSK 1–6 retain their already published 5,400 distinct entries. The new active catalog has 11,000 vocabulary entries, plus 15 other content items.
- Historical Advanced assets (5,636 words and 12 audio references) are retained in `src/lib/content/legacy-hsk789-words.json` and `legacy-hsk789-audio.json` for traceability. They are excluded from the new active release.

## Mapping and editorial status

- Crosswalk: 4,151 same-band exact matches; 376 exact matches from another level; 987 newly encountered spellings; 68 same-band and 5 cross-band variant or sense matches; 13 ambiguous matches resolved in the draft.
- The official table omits part of speech for 442 rows. HSKKit supplies study labels; they are not official part-of-speech classifications.
- Meanings: 4,533 inherited/adapted from existing HSKKit catalog entries, 898 adapted from attributed CC-CEDICT definitions, and 169 independently edited overrides. No entry has a blank meaning, spelling, pinyin, or study part-of-speech label.
- The draft received automated crosswalk and completeness checks and targeted editorial corrections. **This is not a claim that every English gloss was independently proofread by a human.** Additional learner-reported corrections should be evaluated against the source PDF and the retained crosswalk.
- No new Advanced audio is published. A word page must show audio as unavailable unless an approved recording exists.

## Search, pages, and products

- New content release: `hsk3-hsk123456789-2025-v11`.
- Search migration: `migrations/0053_catalog_search_index_hsk123456789_2025.sql`, 11,000 rows; its staged variant keeps production v10 active until the site is deployed and verified.
- Public and runtime catalog indices contain 11,000 active words. Character index includes 134 additional verified characters, with unknown decompositions marked unknown.
- The Advanced 7–9 and Complete 1–9 products use `complete-vocabulary-hsk123456789-2025-v1` and retain their current prices.
- Generated delivery set: 20 PDF/ZIP/manifest files, 42,624,657 bytes in total. Both ZIPs pass CRC checks. Samples and product previews were regenerated from the new PDFs.
- Cloudflare R2 target: `hskkit-commercial-exports/system/artifacts/complete-vocabulary-hsk123456789-2025-v1/`. The `advanced-7-9` folder has four files; `complete-1-9` has sixteen files. Both folder listings were checked after upload.

## Verification and release gate

- `npm run content:validate`, targeted content/commercial tests, `npm run typecheck`, and `npm run build` passed locally.
- An in-memory SQLite rehearsal of the staged search migration confirmed v10 remains active, v11 remains inactive, and v11 contains 300/200/500/1,000/1,600/1,800/5,600 words by band.
- Production D1 staging, production branch merge, deployment, and live checks remain required. Do not switch the site before v11 search rows exist in D1.
- The older assessment tracker is a separate product generation and still contains its historical Advanced count. It is not part of this vocabulary migration; its next regeneration needs a separate content/version review.
