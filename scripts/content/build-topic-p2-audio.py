#!/usr/bin/env python3
"""Publish missing formal word audio required by the frozen Topics P2 expansions.

The source of truth for the selected words is p2-expansions.ts. Existing approved
word audio is reused; only missing assets are synthesized, probed, hashed and
added to the active HSK 3.0 release.
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
EXPANSIONS = ROOT / "src/lib/topics/p2-expansions.ts"
OUT = ROOT / "public/audio/formal/topics/p2-samples"
VOICE = "zh-CN-XiaoxiaoNeural"
PUBLISHED_AT = "2026-09-02T00:00:00.000Z"


def selected_word_ids() -> list[str]:
    ids = re.findall(r'"(hsk3\.word\.l\d\.\d{4}\.v1)"', EXPANSIONS.read_text(encoding="utf-8"))
    return list(dict.fromkeys(ids))


def audio_key(asset_id: str) -> tuple[str, str, str]:
    match = re.fullmatch(r"hsk3\.word\.l(\d)\.(\d{4})\.v1", asset_id)
    if not match:
        raise ValueError(f"Unexpected Topics P2 word ID: {asset_id}")
    stem = f"l{match.group(1)}-{match.group(2)}"
    return (
        f"hsk3.audio.topic-p2.{stem}.v1",
        f"hsk3.audio.topic-p2.{stem}",
        f"audio/formal/topics/p2-samples/{stem}-v1.mp3",
    )


def probe(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    duration = round(float(result.stdout.strip()), 3)
    if path.stat().st_size < 1000 or duration < 0.5:
        raise RuntimeError(f"Invalid audio file: {path}")
    return duration


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    word_ids = selected_word_ids()
    if not word_ids:
        raise RuntimeError("No P2 words found")

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
            "id": audio_id, "logicalId": logical_id, "contentAssetId": asset_id,
            "standard": "hsk3", "level": content["level"], "version": 1,
            "storageKey": storage_key,
            "checksumSha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "locale": "zh-CN", "voice": "Microsoft zh-CN-XiaoxiaoNeural", "speed": 0.92,
            "audioKind": "word", "publishedAt": PUBLISHED_AT,
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

    results = await asyncio.gather(*(publish(asset_id) for asset_id in word_ids))
    release["audioAssetIds"] = [asset["id"] for asset in repository["audioAssets"] if asset["id"] in active_audio]
    CATALOG.write_text(json.dumps(repository, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps({"words": len(results), "generated": sum(not item["reused"] for item in results), "reused": sum(item["reused"] for item in results), "catalogAudio": len(repository["audioAssets"])}, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
