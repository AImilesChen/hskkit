#!/usr/bin/env python3
"""Create offline HSK 2/3 word audio while reusing matching existing assets."""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
VOICE = "zh-CN-XiaoxiaoNeural"
# Neutral-tone particles and polyphonic words must be recorded in context and
# checked by a Mandarin speaker before publication. Do not publish guessed audio.
MANUAL_AUDIO = {351, 583, 587, 968}
SPEECH_OVERRIDES: dict[int, str] = {}


async def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--deps", type=Path, required=True)
    parser.add_argument("--draft", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=ROOT / "docs/quality/hsk23-2025-audio-report.json")
    parser.add_argument("--level", type=int, choices=[2, 3], required=True)
    parser.add_argument("--max-generate", type=int, default=None)
    args = parser.parse_args()
    sys.path.insert(0, str(args.deps.resolve()))
    import edge_tts  # type: ignore[import-not-found]
    from mutagen.mp3 import MP3  # type: ignore[import-not-found]

    draft = json.loads(args.draft.read_text(encoding="utf-8"))
    catalog = json.loads((ROOT / "src/lib/content/catalog.json").read_text(encoding="utf-8"))
    by_id = {asset["id"]: asset for asset in catalog["contentAssets"]}
    audio_by_content = {asset["contentAssetId"]: asset for asset in catalog["audioAssets"]}
    selected = [entry for entry in draft["entries"] if entry["level"] == args.level]
    reused: list[dict] = []
    to_generate: list[dict] = []
    manual: list[dict] = []
    for entry in selected:
        number = entry["officialOrder"]
        old = audio_by_content.get(entry["legacyId"])
        old_word = by_id.get(entry["legacyId"])
        if number in MANUAL_AUDIO:
            manual.append({"number": number, "hanzi": entry["hanzi"], "expectedPinyin": entry["pinyin"], "reason": "polyphonic-or-neutral-tone"})
        elif old and old_word and old_word["payload"].get("pinyin", "").casefold() == entry["pinyin"].casefold():
            path = ROOT / "public" / old["storageKey"]
            if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != old["checksumSha256"]:
                raise ValueError(f"Legacy audio checksum mismatch: {number}")
            reused.append({"number": number, "storageKey": old["storageKey"], "checksumSha256": old["checksumSha256"]})
        else:
            to_generate.append(entry)

    out_dir = ROOT / f"public/audio/formal/hsk{args.level}-2025"
    out_dir.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(4)

    async def generate(entry: dict) -> dict:
        number = entry["officialOrder"]
        path = out_dir / f"l{args.level}-{number:04d}-v1.mp3"
        if not path.exists():
            async with semaphore:
                await edge_tts.Communicate(SPEECH_OVERRIDES.get(number, entry["hanzi"]), VOICE, rate="-8%").save(str(path))
        parsed = MP3(path)
        if path.stat().st_size < 1000 or not 0.35 <= parsed.info.length <= 8 or parsed.info.bitrate < 16000:
            raise ValueError(f"Invalid MP3: {path}")
        return {"number": number, "hanzi": entry["hanzi"], "expectedPinyin": entry["pinyin"],
                "speechText": SPEECH_OVERRIDES.get(number, entry["hanzi"]),
                "storageKey": f"audio/formal/hsk{args.level}-2025/{path.name}",
                "checksumSha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                "bytes": path.stat().st_size, "durationSeconds": round(parsed.info.length, 3)}

    pending = to_generate if args.max_generate is None else to_generate[:args.max_generate]
    generated = await asyncio.gather(*(generate(entry) for entry in pending))
    report = {"level": args.level, "voice": VOICE, "reused": reused, "generated": generated,
              "manualReview": manual, "pendingGeneration": [entry["officialOrder"] for entry in to_generate[len(pending):]]}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"level": args.level, "reused": len(reused), "generated": len(generated),
                      "manual": len(manual), "pending": len(to_generate)-len(pending)}, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
