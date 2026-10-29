# HSK 2–3 vocabulary migration audit (2026-10-29)

## Source and scope

- Official [2025 HSK exam syllabus](https://www.chinesetest.cn/HSK) PDF SHA-256: `ec74ce0439e837bbb15154be13e747ae798903b2fd3a331629df6c3b45504941`.
- HSK 2: source rows 301–500, 200 distinct words. HSK 3: source rows 501–1000, 500 distinct words. HSK 1 retains its 300-word 2025 release.
- English study glosses were independently reviewed and edited. The official PDF and the private full source crosswalk are excluded from the public repository.
- Active release: `hsk3-hsk123-2025-v7`. Previous content IDs remain resolvable for saved learning records, but are not offered as new HSK 2–3 vocabulary.

## Quality gates

- Official row and pinyin audit: 700 rows, no gaps or duplicate source indices.
- Repository content validation, targeted vocabulary and commercial tests, TypeScript typecheck, and production build passed locally.
- Formal audio is available for 696 of the 700 new words. Four polyphonic or neutral-tone pronunciations (source rows 351, 583, 587 and 968) remain deliberately unavailable until listening review. No substitute pronunciation is presented.
- Commercial deliverables: HSK 2 and 3 PDFs, Starter 1–3 ZIP, and Complete Library ZIP plus individual PDF deliveries. PDF cover and interior pages were rendered and visually inspected. Current product prices remain unchanged.
- Runtime catalog and audio indexes are generated at build time; request-time dictionary search uses the static index rather than a new D1 query. No production D1 migration is required to serve the new vocabulary.

## Version boundary

HSK 4–9 still use the separately labelled 2021 study-standard catalog. Existing topic lessons and resource packs are separately versioned products; they are not claimed to have migrated with this vocabulary release. Historical download objects should remain in R2 for links already issued.
