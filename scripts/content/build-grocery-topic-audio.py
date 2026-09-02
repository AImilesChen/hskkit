#!/usr/bin/env python3
"""Build the frozen Grocery Shopping P1 word-audio set and publish it.

The script is idempotent: it reuses an already-published canonical word audio
asset, generates only missing files, validates every MP3, and updates the
active HSK 3.0 release without creating duplicate audio records.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import re
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "src/lib/content/catalog.json"
OUT = ROOT / "public/audio/formal/topics/grocery-shopping"
VOICE = "zh-CN-XiaoxiaoNeural"
PUBLISHED_AT = "2026-09-02T00:00:00.000Z"
WORD_ASSET_IDS = [
    "hsk3.word.l1.0314.v1", "hsk3.word.l2.0060.v1", "hsk3.word.l4.0283.v1", "hsk3.word.l1.0228.v1", "hsk3.word.l2.0372.v1",
    "hsk3.word.l3.0816.v1", "hsk3.word.l1.0346.v1", "hsk3.word.l5.0707.v1", "hsk3.word.l3.0539.v1", "hsk3.word.l1.0275.v1",
    "hsk3.word.l4.0816.v1", "hsk3.word.l3.0334.v1", "hsk3.word.l3.0335.v1", "hsk3.word.l2.0414.v1", "hsk3.word.l1.0127.v1",
    "hsk3.word.l1.0095.v1", "hsk3.word.l1.0294.v1", "hsk3.word.l2.0190.v1", "hsk3.word.l2.0293.v1", "hsk3.word.l2.0422.v1",
    "hsk3.word.l4.0139.v1", "hsk3.word.l3.0782.v1", "hsk3.word.l2.0621.v1", "hsk3.word.l3.0904.v1", "hsk3.word.l7.3760.v1",
    "hsk3.word.l2.0408.v1", "hsk3.word.l4.0686.v1", "hsk3.word.l4.0220.v1", "hsk3.word.l4.0991.v1", "hsk3.word.l3.0309.v1",
]


def audio_key(asset_id: str) -> tuple[str, str, str]:
    match = re.fullmatch(r"hsk3\.word\.l(\d)\.(\d{4})\.v1", asset_id)
    if not match:
        raise ValueError(f"Unexpected Grocery Shopping word ID: {asset_id}")
    stem = f"l{match.group(1)}-{match.group(2)}"
    return (
        f"hsk3.audio.topic-grocery-shopping.{stem}.v1",
        f"hsk3.audio.topic-grocery-shopping.{stem}",
        f"audio/formal/topics/grocery-shopping/{stem}-v1.mp3",
    )


def probe(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True,
        text=True,
        check=True,
    )
    duration = round(float(result.stdout.strip()), 3)
    if path.stat().st_size < 1000 or duration < 0.5:
        raise RuntimeError(f"Invalid audio file: {path}")
    return duration


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Regenerate Grocery Shopping MP3 files")
    args = parser.parse_args()

    repository = json.loads(CATALOG.read_text(encoding="utf-8"))
    content_by_id = {asset["id"]: asset for asset in repository["contentAssets"]}
    audio_by_content = {asset["contentAssetId"]: asset for asset in repository["audioAssets"]}
    release_id = repository["activeReleaseByStandard"]["hsk3"]
    release = next(item for item in repository["releases"] if item["id"] == release_id and item["status"] == "published")
    active_content = set(release["contentAssetIds"])
    active_audio = set(release["audioAssetIds"])
    OUT.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(6)

    async def publish(asset_id: str) -> dict:
        content = content_by_id.get(asset_id)
        if not content or asset_id not in active_content:
            raise RuntimeError(f"Word is not in the active release: {asset_id}")
        if content.get("qa_status") != "approved" or content.get("publish_status") != "published" or content.get("authorization", {}).get("status") != "authorized":
            raise RuntimeError(f"Word is not publishable: {asset_id}")

        existing = audio_by_content.get(asset_id)
        if existing:
            path = ROOT / "public" / existing["storageKey"]
            duration = probe(path)
            if hashlib.sha256(path.read_bytes()).hexdigest() != existing["checksumSha256"]:
                raise RuntimeError(f"Existing audio checksum mismatch: {asset_id}")
            active_audio.add(existing["id"])
            return {"assetId": asset_id, "audioId": existing["id"], "duration": duration, "reused": True}

        audio_id, logical_id, storage_key = audio_key(asset_id)
        path = ROOT / "public" / storage_key
        async with semaphore:
            if args.force or not path.exists() or path.stat().st_size < 1000:
                await edge_tts.Communicate(content["payload"]["hanzi"], VOICE, rate="-8%").save(str(path))
        duration = probe(path)
        audio = {
            "id": audio_id,
            "logicalId": logical_id,
            "contentAssetId": asset_id,
            "standard": "hsk3",
            "level": content["level"],
            "version": 1,
            "storageKey": storage_key,
            "checksumSha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "locale": "zh-CN",
            "voice": "Microsoft zh-CN-XiaoxiaoNeural",
            "speed": 0.92,
            "audioKind": "word",
            "publishedAt": PUBLISHED_AT,
            "issueReportPath": "/api/v1/content/audio/report",
            "usageRights": {"streaming": True, "caching": True, "offlineRedistribution": False},
            "source": {"name": "HSKKit-authored script synthesized for HSKKit", "url": "https://hskkit.com/content-license"},
            "authorization": {"status": "authorized", "license": "HSKKit streaming audio license v1", "evidenceUrl": "https://hskkit.com/content-license"},
            "qaStatus": "approved",
        }
        repository["audioAssets"].append(audio)
        audio_by_content[asset_id] = audio
        active_audio.add(audio_id)
        return {"assetId": asset_id, "audioId": audio_id, "duration": duration, "reused": False}

    results = await asyncio.gather(*(publish(asset_id) for asset_id in WORD_ASSET_IDS))
    release["audioAssetIds"] = [asset["id"] for asset in repository["audioAssets"] if asset["id"] in active_audio]
    CATALOG.write_text(json.dumps(repository, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps({"words": len(results), "generated": sum(not item["reused"] for item in results), "reused": sum(item["reused"] for item in results), "catalogAudio": len(repository["audioAssets"])}, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
