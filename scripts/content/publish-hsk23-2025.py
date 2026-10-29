#!/usr/bin/env python3
"""Publish independently edited HSK 2/3 vocabulary from a private draft."""

from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OLD_RELEASE = "hsk3-hsk1-2025-v6"
NEW_RELEASE = "hsk3-hsk123-2025-v7"
PUBLISHED_AT = "2026-10-29T15:00:00.000Z"
CONTENT_VERSION = "2026.10.29-hsk123-2025"


def compact_word(asset: dict) -> list[str]:
    payload = asset["payload"]
    return [asset["id"], asset["standard_version"], asset["content_version"], str(asset["level"]),
            payload["hanzi"], payload.get("traditional", ""), payload.get("pinyin", ""),
            payload.get("meaning", ""), payload.get("partOfSpeech", "")]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--draft", type=Path, required=True)
    parser.add_argument("--audio2", type=Path, default=ROOT / "docs/quality/hsk2-2025-audio-report.json")
    parser.add_argument("--audio3", type=Path, default=ROOT / "docs/quality/hsk3-2025-audio-report.json")
    args = parser.parse_args()
    draft = json.loads(args.draft.read_text(encoding="utf-8"))
    entries = draft["entries"]
    if len(entries) != 700 or [entry["officialOrder"] for entry in entries] != list(range(301, 1001)):
        raise ValueError("The private HSK 2/3 source must contain exactly official rows 301–1000")
    if Counter(entry["level"] for entry in entries) != {2: 200, 3: 500}:
        raise ValueError("HSK 2/3 levels or counts do not match the 2025 exam syllabus")
    for entry in entries:
        if not all(str(entry[key]).strip() for key in ("hanzi", "traditional", "pinyin", "meaning", "partOfSpeech")):
            raise ValueError(f"Unfinished editorial entry: {entry['officialOrder']}")
        if any(token in entry["meaning"] for token in ("|", "CL:", "variant of", "(slang)", "(coll.)")):
            raise ValueError(f"Unedited teaching gloss: {entry['officialOrder']}")
        if len(entry["meaning"]) > 100:
            raise ValueError(f"Overlong teaching gloss: {entry['officialOrder']}")
        if "|" in entry["traditional"]:
            raise ValueError(f"Unedited traditional variant: {entry['officialOrder']}")
    audio_reports = [json.loads(path.read_text(encoding="utf-8")) for path in (args.audio2, args.audio3)]
    audio_by_number: dict[int, dict] = {}
    manual_audio: list[int] = []
    for report in audio_reports:
        if report["pendingGeneration"]:
            raise ValueError("Audio generation remains incomplete")
        for item in report["reused"] + report["generated"]:
            number = item["number"]
            if number in audio_by_number:
                raise ValueError(f"Duplicate audio for row {number}")
            path = ROOT / "public" / item["storageKey"]
            if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != item["checksumSha256"]:
                raise ValueError(f"Audio checksum mismatch: {number}")
            audio_by_number[number] = item
        manual_audio.extend(item["number"] for item in report["manualReview"])
    if set(audio_by_number) | set(manual_audio) != set(range(301, 1001)) or set(audio_by_number) & set(manual_audio):
        raise ValueError("Every row must have verified audio or a declared manual review gap")

    catalog_path = ROOT / "src/lib/content/catalog.json"
    repository = json.loads(catalog_path.read_text(encoding="utf-8"))
    if repository["activeReleaseByStandard"]["hsk3"] != OLD_RELEASE:
        raise ValueError("The source release has changed; re-audit before publishing")
    previous = next(release for release in repository["releases"] if release["id"] == OLD_RELEASE)
    by_id = {asset["id"]: asset for asset in repository["contentAssets"]}
    audio_by_id = {asset["id"]: asset for asset in repository["audioAssets"]}
    retired_ids = {asset_id for asset_id in previous["contentAssetIds"] if by_id[asset_id]["kind"] == "word" and by_id[asset_id]["level"] in (2, 3)}
    if len(retired_ids) != 1745:
        raise ValueError("Unexpected legacy HSK 2/3 word inventory")
    retired_words = [by_id[asset_id] for asset_id in previous["contentAssetIds"] if asset_id in retired_ids]
    retired_audio = [audio_by_id[asset_id] for asset_id in previous["audioAssetIds"] if audio_by_id[asset_id]["contentAssetId"] in retired_ids]
    (ROOT / "src/lib/content/legacy-hsk23-words.json").write_text(json.dumps({
        "releaseId": OLD_RELEASE, "words": [compact_word(asset) for asset in retired_words],
    }, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    (ROOT / "src/lib/content/legacy-hsk23-audio.json").write_text(json.dumps({
        "audio": [[asset["contentAssetId"], asset["storageKey"], asset["logicalId"]] for asset in retired_audio],
    }, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

    new_content_ids: list[str] = []
    new_audio_ids: list[str] = []
    for entry in entries:
        number, level = entry["officialOrder"], entry["level"]
        asset_id = entry["id"]
        new_content_ids.append(asset_id)
        adapted = entry["meaningSource"] == "licensed-existing-catalog"
        repository["contentAssets"].append({
            "id": asset_id, "logicalId": asset_id.removesuffix(".v1"), "standard": "hsk3", "level": level,
            "kind": "word", "version": 1, "standard_version": "HSK-EXAM-2025", "level_band": str(level),
            "content_version": CONTENT_VERSION, "source_ref": "chinesetest-hsk-exam-2025+HSKKit-editorial",
            "license_ref": "HSKKit-original+CC-BY-SA-4.0" if adapted else "HSKKit-original",
            "qa_status": "approved", "publish_status": "published",
            "payload": {"hanzi": entry["hanzi"], "traditional": entry["traditional"], "pinyin": entry["pinyin"],
                        "meaning": entry["meaning"], "partOfSpeech": entry["partOfSpeech"]},
            "source": {"name": "2025 HSK exam syllabus level placement and HSKKit editorial definitions", "url": "https://www.chinesetest.cn/HSK"},
            "authorization": {"status": "authorized", "license": "HSKKit original editorial content; CC BY-SA 4.0 for adapted legacy glosses", "evidenceUrl": "https://hskkit.com/content-license"},
            "qaStatus": "approved",
        })
        if number not in audio_by_number:
            continue
        audio = audio_by_number[number]
        audio_id = f"hsk2025.audio.hsk{level}.l{level}-{number:04d}.v1"
        new_audio_ids.append(audio_id)
        repository["audioAssets"].append({
            "id": audio_id, "logicalId": audio_id.removesuffix(".v1"), "contentAssetId": asset_id,
            "standard": "hsk3", "level": level, "version": 1,
            "storageKey": audio["storageKey"], "checksumSha256": audio["checksumSha256"],
            "locale": "zh-CN", "voice": "Microsoft zh-CN-XiaoxiaoNeural", "speed": 0.92,
            "audioKind": "word", "publishedAt": PUBLISHED_AT,
            "issueReportPath": "/api/v1/content/audio/report",
            "usageRights": {"streaming": True, "caching": True, "offlineRedistribution": False},
            "source": {"name": "HSKKit pronunciation audio", "url": "https://hskkit.com/content-license"},
            "authorization": {"status": "authorized", "license": "HSKKit streaming audio license v1", "evidenceUrl": "https://hskkit.com/content-license"},
            "qaStatus": "approved",
        })
    active_content = [asset_id for asset_id in previous["contentAssetIds"] if asset_id not in retired_ids] + new_content_ids
    active_audio = [asset_id for asset_id in previous["audioAssetIds"] if audio_by_id[asset_id]["contentAssetId"] not in retired_ids] + new_audio_ids
    if len(active_content) != len(previous["contentAssetIds"]) - len(retired_ids) + 700:
        raise ValueError("Release content count changed unexpectedly")
    repository["releases"].append({"id": NEW_RELEASE, "standard": "hsk3", "version": 7, "status": "published",
                                    "contentAssetIds": active_content, "audioAssetIds": active_audio, "publishedAt": PUBLISHED_AT})
    repository["releaseEvents"].append({"action": "publish", "releaseId": NEW_RELEASE, "standard": "hsk3", "at": PUBLISHED_AT, "previousActiveReleaseId": OLD_RELEASE})
    repository["activeReleaseByStandard"]["hsk3"] = NEW_RELEASE
    catalog_path.write_text(json.dumps(repository, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    manifest = {"release_id": NEW_RELEASE, "release_version": 7, "published_at": PUBLISHED_AT,
                "standard_version_by_level": {"1": "HSK-EXAM-2025", "2": "HSK-EXAM-2025", "3": "HSK-EXAM-2025", "4-9": "GF0025-2021"},
                "word_count_by_level": dict(Counter(str(by_id[asset_id]["level"]) for asset_id in previous["contentAssetIds"] if asset_id not in retired_ids)),
                "hsk2_word_count": 200, "hsk3_word_count": 500, "audio_count": len(audio_by_number),
                "manual_audio_review_numbers": sorted(manual_audio), "source_url": draft["sourceUrl"],
                "source_pdf_sha256": draft["sourcePdfSha256"]}
    (ROOT / "content/releases/hsk3-hsk123-2025-v7.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"releaseId": NEW_RELEASE, "retiredWords": len(retired_ids), "newWords": len(entries),
                      "activeContent": len(active_content), "newAudio": len(new_audio_ids),
                      "manualAudio": sorted(manual_audio)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
