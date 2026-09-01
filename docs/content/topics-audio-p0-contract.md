# Topics and audio P0 contract — frozen 2026-09-01

## Approved scope

This P0 changes only audio truth, provenance, shared asset resolution, and playback state semantics for Topics, Dictionary, word/topic practice, and Listening. It does **not** add vocabulary, change topic membership, alter answers, SRS, progress, pricing, account, or payment behavior.

## Content boundary

- The nine published Topics and their existing `wordAssetIds`, dialogue text, ordering, routes, progress keys, and practice answers stay unchanged in P0.
- Topic expansion into Core / Everyday / Stretch lessons is explicitly deferred to the separately approved content-expansion phase.
- A published audio asset must resolve from one canonical resolver; consumers may not construct storage URLs or invent source labels.

## Canonical public audio asset

Every playable asset exposed to a client uses this contract:

- `id`: stable versioned asset identifier.
- `src`: same-origin published URL.
- `kind`: `word`, `sentence`, `context`, or `listening`.
- `sourceType`: `synthesized` or `human-recorded`.
- `sourceLabel`: truthful user-facing source label.
- `provider`: source provider when known.
- `voice`: voice identifier when known.
- `authorization`: publisher-declared status, license name, and evidence URL.
- `qa`: lifecycle, content QA, and technical QA status.

The spoken text remains server-trusted when revealing it would disclose a listening answer. Public practice payloads must not expose it.

## Truthful labels

- Microsoft `zh-CN-XiaoxiaoNeural` assets are labelled **Synthesized pronunciation** for a word and **Synthesized listening audio** for listening, sentence, or context playback.
- `Formal audio` is prohibited as a user-facing label for synthesized assets.
- `Native-speaker recording` is reserved for an asset with verified human-recorded provenance.
- Internal authorization metadata is a publisher declaration, not proof of native-speaker recording and not an independent legal opinion.

## Playback states

Every audio control has explicit, observable states:

- `loading`: metadata or playback is being prepared; the action is disabled and announced.
- `ready`: playback is available.
- `playing`: playback has started.
- `error`: loading or playback failed; the user receives a retry action or clear failure message.
- `unavailable`: no published asset exists; the UI says so rather than silently omitting the capability.

Answer submission for listening questions remains locked until successful complete playback. A playback failure must not unlock the answer.

## Canonical resolution

- Published content-release audio resolves by `contentAssetId`.
- Listening Library audio resolves by listening question ID.
- Practice audio resolves by versioned practice asset ID.
- Topics, Dictionary, word/topic practice, and Listening consume these resolved assets rather than maintaining page-specific URL maps.

## Audit gate

The 272-item Listening Library audit is reproducible and fail-closed for:

- manifest, bank, and filesystem inventory parity;
- unique IDs and source references;
- text equality between the question bank and audio manifest;
- SHA-256 checksum and metadata duration;
- MP3 decoding, duration, channel count, sample rate, and non-empty files;
- source, voice, authorization declaration, lifecycle, content-QA, and technical-QA metadata.

Automated checks do not prove pronunciation naturalness or legal sufficiency. Those limitations must be stated in the committed audit report.

## Rollback rule

No rollback tag is created until tests, typecheck, production build, independent review, deployment, and desktop plus 390×844 production QA all pass. The tag must be annotated, pushed, and remotely verified against the production-tested commit.
