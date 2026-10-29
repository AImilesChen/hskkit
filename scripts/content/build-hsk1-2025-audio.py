#!/usr/bin/env python3
"""Generate only new HSK 1 pronunciation files; reuse matching approved audio."""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if "--deps" not in sys.argv:
    raise SystemExit("--deps is required")
sys.path.insert(0, str(Path(sys.argv[sys.argv.index("--deps") + 1]).resolve()))
import edge_tts  # type: ignore[import-not-found]
from mutagen.mp3 import MP3  # type: ignore[import-not-found]

VOICE = "zh-CN-XiaoxiaoNeural"
REMAKE_NUMBERS = {14, 15, 218, 258, 261, 262}
SPEECH_OVERRIDES = {
    287: "知",  # 只 zhī, rather than the default zhǐ.
}


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--deps", type=Path, required=True)
    parser.add_argument("--draft", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=ROOT / "docs/quality/hsk1-2025-audio-report.json")
    args = parser.parse_args()
    sys.path.insert(0, str(args.deps.resolve()))
    draft = json.loads(args.draft.read_text(encoding="utf-8"))
    catalog = json.loads((ROOT / "src/lib/content/catalog.json").read_text(encoding="utf-8"))
    audio_by_content = {item["contentAssetId"]: item for item in catalog["audioAssets"]}
    targets = []
    reused = []
    for entry in draft["entries"]:
        old = audio_by_content.get(entry["legacyId"])
        if old and entry["officialOrder"] not in REMAKE_NUMBERS:
            old_path = ROOT / "public" / old["storageKey"]
            if not old_path.is_file() or hashlib.sha256(old_path.read_bytes()).hexdigest() != old["checksumSha256"]:
                raise RuntimeError(f"Old audio checksum mismatch: {old_path}")
            reused.append({"number": entry["officialOrder"], "storageKey": old["storageKey"], "checksumSha256": old["checksumSha256"]})
        else:
            targets.append(entry)
    if len(reused) + len(targets) != 300:
        raise RuntimeError("HSK 1 audio inventory incomplete")
    out_dir = ROOT / "public/audio/formal/hsk1-2025"
    out_dir.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(4)

    async def generate(entry: dict) -> dict:
        number = entry["officialOrder"]
        path = out_dir / f"l1-{number:04d}-v1.mp3"
        if not path.exists():
            async with semaphore:
                await edge_tts.Communicate(SPEECH_OVERRIDES.get(number, entry["hanzi"]), VOICE, rate="-8%").save(str(path))
        parsed = MP3(path)
        duration = float(parsed.info.length)
        if path.stat().st_size < 1000 or not 0.35 <= duration <= 8 or parsed.info.bitrate < 16000:
            raise RuntimeError(f"Invalid MP3: {path}")
        return {
            "number": number,
            "hanzi": entry["hanzi"],
            "expectedPinyin": entry["pinyin"],
            "speechText": SPEECH_OVERRIDES.get(number, entry["hanzi"]),
            "storageKey": f"audio/formal/hsk1-2025/{path.name}",
            "checksumSha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "bytes": path.stat().st_size,
            "durationSeconds": round(duration, 3),
        }

    generated = await asyncio.gather(*(generate(entry) for entry in targets))
    report = {"version": "hsk1-2025", "voice": VOICE, "reused": reused, "generated": generated}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"reused": len(reused), "generated": len(generated), "output": str(args.output)}, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
