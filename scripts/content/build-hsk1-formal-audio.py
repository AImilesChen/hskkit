#!/usr/bin/env python3
"""Fill missing HSK 1 formal word audio in the active HSK 3.0 release.

The command is idempotent: existing released audio is verified and reused. New
files are synthesized in bounded parallel batches, parsed as MP3, hashed, added
to the catalog, and recorded in a compact quality report.

Runtime dependencies: edge-tts, mutagen, pypinyin.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

import edge_tts
from mutagen.mp3 import MP3
from pypinyin import Style, lazy_pinyin, pinyin

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "src/lib/content/catalog.json"
OUT = ROOT / "public/audio/formal/hsk1"
REPORT = ROOT / "docs/quality/hsk1-formal-audio-report.json"
VOICE = "zh-CN-XiaoxiaoNeural"
PUBLISHED_AT = "2026-10-25T00:00:00.000Z"
SYNTHESIS_OVERRIDES = {
    # Homophones force the intended isolated syllable for polyphonic entries.
    "hsk3.word.l1.0066.v1": "的",  # 地 de
    "hsk3.word.l1.0111.v1": "甘",  # 干 gān
    "hsk3.word.l1.0113.v1": "赣",  # 干 gàn
    "hsk3.word.l1.0132.v1": "孩",  # 还 hái
    "hsk3.word.l1.0153.v1": "环",  # 还 huán
    "hsk3.word.l1.0175.v1": "椒",  # 教 jiāo
}


def preferred(value: object) -> str:
    selected = str(value or "").split("|", 1)[0].strip()
    return re.sub(r"（[^）]*）|\([^)]*\)", "", selected).strip()


def audio_key(asset_id: str) -> tuple[str, str, str]:
    match = re.fullmatch(r"hsk3\.word\.l1\.(\d{4})\.v1", asset_id)
    if not match:
        raise ValueError(f"Unexpected HSK 1 word ID: {asset_id}")
    stem = f"l1-{match.group(1)}"
    return (
        f"hsk3.audio.hsk1.{stem}.v1",
        f"hsk3.audio.hsk1.{stem}",
        f"audio/formal/hsk1/{stem}-v1.mp3",
    )


def normalized_pinyin(value: str) -> str:
    return re.sub(r"[^a-züǖǘǚǜāáǎàēéěèīíǐìōóǒòūúǔùńňǹḿ]+", "", value.lower())


def pronunciation_risks(hanzi: str, expected: str, had_variant: bool) -> list[str]:
    risks: list[str] = []
    predicted = "".join(lazy_pinyin(hanzi, style=Style.TONE, neutral_tone_with_five=False))
    if normalized_pinyin(predicted) != normalized_pinyin(expected):
        risks.append("catalog-pinyin-differs-from-pypinyin-default")
    if any(len(set(readings)) > 1 for readings in pinyin(hanzi, style=Style.TONE, heteronym=True)):
        risks.append("contains-polyphonic-character")
    if had_variant:
        risks.append("catalog-has-surface-or-pinyin-variant")
    return risks


def inspect_mp3(path: Path) -> dict[str, float | int]:
    if not path.exists() or path.stat().st_size < 1000:
        raise RuntimeError(f"Missing or undersized MP3: {path}")
    parsed = MP3(path)
    duration = round(float(parsed.info.length), 3)
    bitrate = int(parsed.info.bitrate or 0)
    if duration < 0.35 or duration > 8 or bitrate < 16000:
        raise RuntimeError(f"Invalid MP3 metrics: {path} ({duration}s, {bitrate}bps)")
    return {"bytes": path.stat().st_size, "durationSeconds": duration, "bitrate": bitrate}


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--concurrency", type=int, default=6)
    parser.add_argument("--only", action="append", default=[])
    args = parser.parse_args()

    repository = json.loads(CATALOG.read_text(encoding="utf-8"))
    release_id = repository["activeReleaseByStandard"]["hsk3"]
    release = next(item for item in repository["releases"] if item["id"] == release_id and item["status"] == "published")
    active_content = set(release["contentAssetIds"])
    active_audio = set(release["audioAssetIds"])
    hsk1_words = [
        asset for asset in repository["contentAssets"]
        if asset["id"] in active_content
        and asset.get("level") == 1
        and asset.get("kind") == "word"
        and asset.get("qa_status") == "approved"
        and asset.get("publish_status") == "published"
        and asset.get("authorization", {}).get("status") == "authorized"
    ]
    hsk1_words.sort(key=lambda asset: asset["id"])
    only_ids = {item for group in args.only for item in group.split(",") if item}
    if only_ids:
        hsk1_words = [word for word in hsk1_words if word["id"] in only_ids]
        missing_only_ids = only_ids - {word["id"] for word in hsk1_words}
        if missing_only_ids:
            raise RuntimeError(f"Unknown --only HSK 1 IDs: {sorted(missing_only_ids)}")
    audio_by_content = {asset["contentAssetId"]: asset for asset in repository["audioAssets"]}
    OUT.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(max(1, min(args.concurrency, 10)))

    async def build(word: dict) -> dict:
        existing = audio_by_content.get(word["id"])
        raw_hanzi = str(word["payload"].get("hanzi", ""))
        raw_pinyin = str(word["payload"].get("pinyin", ""))
        hanzi = preferred(raw_hanzi)
        expected_pinyin = preferred(raw_pinyin)
        if not hanzi or not expected_pinyin:
            raise RuntimeError(f"Missing pronunciation source fields: {word['id']}")
        risks = pronunciation_risks(hanzi, expected_pinyin, "|" in raw_hanzi or "|" in raw_pinyin or "（" in raw_hanzi or "(" in raw_hanzi)
        if existing:
            path = ROOT / "public" / existing["storageKey"]
            regenerated = args.force and existing["id"].startswith("hsk3.audio.hsk1.")
            if regenerated:
                await edge_tts.Communicate(SYNTHESIS_OVERRIDES.get(word["id"], hanzi), VOICE, rate="-8%").save(str(path))
            metrics = inspect_mp3(path)
            checksum = hashlib.sha256(path.read_bytes()).hexdigest()
            if regenerated:
                existing["checksumSha256"] = checksum
            elif checksum != existing["checksumSha256"]:
                raise RuntimeError(f"Existing checksum mismatch: {word['id']}")
            active_audio.add(existing["id"])
            return {
                "wordId": word["id"], "hanzi": hanzi, "pinyin": expected_pinyin,
                "audioId": existing["id"], "storageKey": existing["storageKey"],
                "checksumSha256": checksum, "reused": not regenerated, **metrics, "risks": risks,
            }

        audio_id, logical_id, storage_key = audio_key(word["id"])
        path = ROOT / "public" / storage_key
        async with semaphore:
            if args.force or not path.exists() or path.stat().st_size < 1000:
                await edge_tts.Communicate(SYNTHESIS_OVERRIDES.get(word["id"], hanzi), VOICE, rate="-8%").save(str(path))
        metrics = inspect_mp3(path)
        checksum = hashlib.sha256(path.read_bytes()).hexdigest()
        audio = {
            "id": audio_id,
            "logicalId": logical_id,
            "contentAssetId": word["id"],
            "standard": "hsk3",
            "level": 1,
            "version": 1,
            "storageKey": storage_key,
            "checksumSha256": checksum,
            "locale": "zh-CN",
            "voice": "Microsoft zh-CN-XiaoxiaoNeural",
            "speed": 0.92,
            "audioKind": "word",
            "publishedAt": PUBLISHED_AT,
            "issueReportPath": "/api/v1/content/audio/report",
            "usageRights": {"streaming": True, "caching": True, "offlineRedistribution": False},
            "source": {"name": "HSKKit HSK 1 vocabulary synthesized for HSKKit", "url": "https://hskkit.com/content-license"},
            "authorization": {"status": "authorized", "license": "HSKKit streaming audio license v1", "evidenceUrl": "https://hskkit.com/content-license"},
            "qaStatus": "approved",
        }
        repository["audioAssets"].append(audio)
        audio_by_content[word["id"]] = audio
        active_audio.add(audio_id)
        return {
            "wordId": word["id"], "hanzi": hanzi, "pinyin": expected_pinyin,
            "audioId": audio_id, "storageKey": storage_key, "checksumSha256": checksum,
            "reused": False, **metrics, "risks": risks,
        }

    results: list[dict] = []
    total = len(hsk1_words)
    for start in range(0, total, 24):
        batch = await asyncio.gather(*(build(word) for word in hsk1_words[start:start + 24]))
        results.extend(batch)
        print(json.dumps({"processed": len(results), "total": total}, ensure_ascii=False), flush=True)

    release["audioAssetIds"] = [asset["id"] for asset in repository["audioAssets"] if asset["id"] in active_audio]
    CATALOG.write_text(json.dumps(repository, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

    generated = [item for item in results if not item["reused"]]
    risk_counts = Counter(risk for item in results for risk in item["risks"])
    hsk1_audio = [item for item in repository["audioAssets"] if item.get("contentAssetId") in {word["id"] for word in hsk1_words}]
    report = {
        "version": "hsk1-formal-audio-2026-10-25",
        "activeReleaseId": release_id,
        "voice": VOICE,
        "rate": "-8%",
        "hsk1Words": total,
        "reusedThisRun": sum(item["reused"] for item in results),
        "generatedThisRun": len(generated),
        "formalCoverage": len(results),
        "hsk1PipelineAssets": sum(item["id"].startswith("hsk3.audio.hsk1.") for item in hsk1_audio),
        "totalBytes": sum(item["bytes"] for item in results),
        "durationRangeSeconds": [min(item["durationSeconds"] for item in results), max(item["durationSeconds"] for item in results)] if results else [],
        "riskCounts": dict(sorted(risk_counts.items())),
        "manualReviewQueue": [item for item in results if item["risks"]],
    }
    if not only_ids:
        REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: report[key] for key in ("hsk1Words", "reusedThisRun", "generatedThisRun", "formalCoverage", "hsk1PipelineAssets", "totalBytes", "riskCounts")}, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
