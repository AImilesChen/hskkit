#!/usr/bin/env python3
"""Publish edited unified HSK 7–9 words without adding unlicensed audio."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OLD_RELEASE = "hsk3-hsk123456-2025-v10"
NEW_RELEASE = "hsk3-hsk123456789-2025-v11"
CONTENT_VERSION = "2026.10.30-hsk123456789-2025"


def compact_word(asset: dict) -> list[str]:
    payload = asset["payload"]
    return [asset["id"], asset["standard_version"], asset["content_version"], str(asset["level"]),
            payload["hanzi"], payload.get("traditional", ""), payload.get("pinyin", ""),
            payload.get("meaning", ""), payload.get("partOfSpeech", "")]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--draft", type=Path, required=True)
    args = parser.parse_args()
    draft = json.loads(args.draft.read_text(encoding="utf-8"))
    entries = draft["entries"]
    if draft["status"] != "editorially-approved-audio-excluded":
        raise ValueError("Expected the privately approved draft")
    if len(entries) != 5600 or [entry["officialOrder"] for entry in entries] != list(range(5401, 11001)):
        raise ValueError("Expected all 5,600 HSK 7–9 source rows")
    for entry in entries:
        if not all(str(entry[key]).strip() for key in ("hanzi", "traditional", "pinyin", "meaning", "partOfSpeech")):
            raise ValueError(f"Unfinished editorial entry: {entry['officialOrder']}")
        if entry["meaningQaStatus"] != "approved" or entry["traditionalQaStatus"] != "approved":
            raise ValueError(f"Editorial review has not passed: {entry['officialOrder']}")

    catalog_path = ROOT / "src/lib/content/catalog.json"
    repository = json.loads(catalog_path.read_text(encoding="utf-8"))
    if repository["activeReleaseByStandard"]["hsk3"] != OLD_RELEASE:
        raise ValueError("The source release changed; re-audit before publishing")
    previous = next(release for release in repository["releases"] if release["id"] == OLD_RELEASE)
    by_id = {asset["id"]: asset for asset in repository["contentAssets"]}
    audio_by_id = {asset["id"]: asset for asset in repository["audioAssets"]}
    retired_ids = {asset_id for asset_id in previous["contentAssetIds"]
                   if by_id[asset_id]["kind"] == "word" and by_id[asset_id]["level"] == 7}
    if len(retired_ids) != 5636:
        raise ValueError(f"Unexpected legacy HSK 7–9 word inventory: {len(retired_ids)}")
    retired_words = [by_id[asset_id] for asset_id in previous["contentAssetIds"] if asset_id in retired_ids]
    retired_audio = [audio_by_id[asset_id] for asset_id in previous["audioAssetIds"]
                     if audio_by_id[asset_id]["contentAssetId"] in retired_ids]
    (ROOT / "src/lib/content/legacy-hsk789-words.json").write_text(json.dumps({
        "releaseId": OLD_RELEASE, "words": [compact_word(asset) for asset in retired_words],
    }, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    (ROOT / "src/lib/content/legacy-hsk789-audio.json").write_text(json.dumps({
        "audio": [[asset["contentAssetId"], asset["storageKey"], asset["logicalId"]] for asset in retired_audio],
    }, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

    new_content_ids = []
    for entry in entries:
        asset_id = entry["id"]
        new_content_ids.append(asset_id)
        adapted = entry["meaningSource"] != "independent-editorial-draft"
        repository["contentAssets"].append({
            "id": asset_id, "logicalId": asset_id.removesuffix(".v1"), "standard": "hsk3", "level": 7,
            "kind": "word", "version": 1, "standard_version": "HSK-EXAM-2025", "level_band": "7-9",
            "content_version": CONTENT_VERSION, "source_ref": "chinesetest-hsk-exam-2025+HSKKit-editorial",
            "license_ref": "HSKKit-original+CC-BY-SA-4.0" if adapted else "HSKKit-original",
            "qa_status": "approved", "publish_status": "published",
            "payload": {"hanzi": entry["hanzi"], "traditional": entry["traditional"],
                        "pinyin": entry["pinyin"], "meaning": entry["meaning"],
                        "partOfSpeech": entry["partOfSpeech"]},
            "source": {"name": "2025 HSK exam syllabus Advanced 7–9 placement and HSKKit editorial definitions",
                       "url": "https://www.chinesetest.cn/HSK"},
            "authorization": {"status": "authorized",
                              "license": "HSKKit original editorial content; CC BY-SA 4.0 for adapted legacy glosses",
                              "evidenceUrl": "https://hskkit.com/content-license"},
            "qaStatus": "approved",
        })
    active_content = [asset_id for asset_id in previous["contentAssetIds"] if asset_id not in retired_ids] + new_content_ids
    active_audio = [asset_id for asset_id in previous["audioAssetIds"]
                    if audio_by_id[asset_id]["contentAssetId"] not in retired_ids]
    if len(active_content) != len(previous["contentAssetIds"]) - 36:
        raise ValueError("Active release count changed unexpectedly")
    published_at = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    repository["releases"].append({"id": NEW_RELEASE, "standard": "hsk3", "version": 11,
                                   "status": "published", "contentAssetIds": active_content,
                                   "audioAssetIds": active_audio, "publishedAt": published_at})
    repository["releaseEvents"].append({"action": "publish", "releaseId": NEW_RELEASE,
                                          "standard": "hsk3", "at": published_at,
                                          "previousActiveReleaseId": OLD_RELEASE})
    repository["activeReleaseByStandard"]["hsk3"] = NEW_RELEASE
    catalog_path.write_text(json.dumps(repository, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    counts = Counter(str(by_id[asset_id]["level"]) for asset_id in previous["contentAssetIds"]
                     if asset_id not in retired_ids and by_id[asset_id]["kind"] == "word")
    counts["7"] = 5600
    manifest = {"release_id": NEW_RELEASE, "release_version": 11, "published_at": published_at,
                "standard_version_by_level": {"1-6": "HSK-EXAM-2025", "7-9": "HSK-EXAM-2025"},
                "word_count_by_level": dict(counts),
                "advanced_word_count": 5600, "advanced_new_audio_count": 0,
                "new_audio_reason": "no free audio source with confirmed public-commercial redistribution rights",
                "source_url": "https://www.chinesetest.cn/HSK", "source_pdf_sha256": draft["sourceSha256"]}
    (ROOT / "content/releases/hsk3-hsk123456789-2025-v11.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"releaseId": NEW_RELEASE, "retiredWords": len(retired_ids),
                      "newWords": len(entries), "activeContent": len(active_content),
                      "retiredAudio": len(retired_audio), "newAudio": 0}, ensure_ascii=False))


if __name__ == "__main__":
    main()
