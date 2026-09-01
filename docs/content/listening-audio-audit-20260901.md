# Listening Library audio audit — 2026-09-01

## Result

- Automated result: **PASS**
- Question-bank groups: **272**
- Manifest assets: **272**
- Files decoded and checked: **272**
- HSK level distribution: HSK 1: 40, HSK 2: 40, HSK 3: 30, HSK 4: 30, HSK 5: 30, HSK 6: 30, HSK 7: 24, HSK 8: 24, HSK 9: 24
- Duration range: 1.776–18.672 seconds
- Total duration: 2129.856 seconds
- Source type: **Synthesized**
- Provider / voice: **Microsoft Azure AI Speech / zh-CN-XiaoxiaoNeural**
- Failure count: **0**

## Source and text

Every bank item was checked against its manifest entry, exact spoken-text field, source reference, source text-license declaration, storage URL, and active runtime content ID. The scripts are HSKKit-curated derivatives referenced to the frozen content release; the files are Microsoft neural-voice synthesis, not human recordings.

## Authorization

Every item declares an authorized streaming status and points to the HSKKit content-license page. This verifies internal metadata consistency only. The evidence is a publisher declaration, not an independent legal opinion or provider-side entitlement archive. No audit result may describe these files as native-speaker recordings.

## Technical and quality checks

Each file was SHA-256 checked, probed, fully decoded with FFmpeg, matched to the recorded duration, and required to be mono 24 kHz MP3 with a non-empty, bounded duration. These automated checks passed only when the result above is PASS.

## Limitations and required presentation

- Automated inspection does not prove pronunciation naturalness, prosody, or pedagogical appropriateness.
- The manifests do not identify a named human pronunciation reviewer per asset.
- User-facing labels must therefore say **Synthesized listening audio** or **Synthesized pronunciation**, never **Formal audio** or **Native-speaker recording**.
- A later human-audio phase must add reviewer evidence and verified human provenance before changing that label.

## Reproduction

Run: `node scripts/audit-listening-audio.mjs --write`

Machine-readable details: `docs/content/listening-audio-audit-20260901.json`.
