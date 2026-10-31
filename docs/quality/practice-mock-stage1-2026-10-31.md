# Practice and mock stage 1 release audit

## Scope and source truth

- Active vocabulary release: `hsk3-hsk123456789-2025-v11`.
- Current vocabulary practice uses words from that release and labels those questions `HSK-EXAM-2025`.
- Grammar, reading and listening are HSKKit-authored practice material. Their older standard reference is retained rather than silently relabelled as official 2025 exam questions.
- Basic Skills Check remains a 15-question, level-specific diagnostic for HSK 1–6. Advanced Skills Check remains a short diagnostic covering the unified HSK 7–9 band. Neither is an official full-length exam.

## Published question inventory

| Level | Vocabulary | Grammar | Reading | Listening | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| HSK 1 | 120 | 24 | 72 | 40 | 256 |
| HSK 2 | 118 | 25 | 72 | 40 | 255 |
| HSK 3 | 119 | 25 | 72 | 54 | 270 |
| HSK 4 | 120 | 25 | 72 | 60 | 277 |
| HSK 5 | 120 | 25 | 72 | 60 | 277 |
| HSK 6 | 120 | 24 | 72 | 56 | 272 |
| Unified HSK 7–9 | 119 | 24 | 108 | 162 | 413 |
| **Total** | **836** | **172** | **540** | **472** | **2,020** |

The former vocabulary practice exposed about 24 questions per level, concentrated at the beginning of the runtime sample. The new pool includes all distinct words in the active runtime sample for each level; it is still a sample of the complete published word list, not a comprehensive test of every syllabus word.

## Release checks

- All current vocabulary source IDs resolve in the active release, and each question has four distinct rendered options.
- Every level and skill has at least eight published questions with a prompt, keyed answer and explanation. Every published listening question references an existing local audio file.
- The quality gate reports zero exact duplicates, near-duplicate source pairs, template-density violations and level-source failures across 2,020 questions.
- Each Basic level and the unified Advanced band have enough distinct grammar, reading and listening source groups for two 15-question attempts without reusing a group.
- The previous 168 vocabulary questions retain their original IDs, set versions, answers and explanations for historical practice sessions.
- Mock result review shows the original passage or offers recording replay, then points to practice for the lowest-scoring skill in that attempt.

## Limits

Automated checks establish structural and source consistency. They do not prove that every authored Chinese passage or explanation has received an independent human language review. The site must continue to describe the timed checks as HSKKit learning diagnostics rather than official 2025 exam papers or proficiency scores.
