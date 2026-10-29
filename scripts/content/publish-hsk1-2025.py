#!/usr/bin/env python3
"""Freeze the independently edited 2025 HSK 1 release from a private audited draft."""

from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RELEASE_ID = "hsk3-hsk1-2025-v6"
PUBLISHED_AT = "2026-10-29T10:00:00.000Z"
CONTENT_VERSION = "2026.10.29-hsk1-2025"
STANDARD_VERSION = "HSK-EXAM-2025"


def sql(value: object) -> str:
    return "'" + str(value).replace("'", "''") + "'"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--draft", required=True, type=Path)
    parser.add_argument("--audio-report", type=Path, default=ROOT / "docs/quality/hsk1-2025-audio-report.json")
    args = parser.parse_args()
    draft = json.loads(args.draft.read_text(encoding="utf-8"))
    audio_report = json.loads(args.audio_report.read_text(encoding="utf-8"))
    if draft["status"] != "draft-not-for-publication" or len(draft["entries"]) != 300:
        raise ValueError("Only the audited 300-row private draft is accepted")
    if [entry["officialOrder"] for entry in draft["entries"]] != list(range(1, 301)):
        raise ValueError("Official sequence has a gap")
    by_number = {item["number"]: item for item in audio_report["reused"] + audio_report["generated"]}
    if len(by_number) != 300:
        raise ValueError("Audio coverage must be 300 / 300")

    catalog_path = ROOT / "src/lib/content/catalog.json"
    repository = json.loads(catalog_path.read_text(encoding="utf-8"))
    if repository["activeReleaseByStandard"]["hsk3"] != "hsk3-content-truth-v5":
        raise ValueError("Unexpected source release")
    old_release = next(item for item in repository["releases"] if item["id"] == "hsk3-content-truth-v5")
    old_by_id = {item["id"]: item for item in repository["contentAssets"]}
    old_audio_by_id = {item["id"]: item for item in repository["audioAssets"]}
    old_hsk1_ids = {item["id"] for item in repository["contentAssets"] if item["id"] in old_release["contentAssetIds"] and item["kind"] == "word" and item["level"] == 1}
    if len(old_hsk1_ids) != 500:
        raise ValueError("Expected 500 legacy level 1 word IDs")
    legacy_words = [old_by_id[item_id] for item_id in old_release["contentAssetIds"] if item_id in old_hsk1_ids]
    legacy_audio = [old_audio_by_id[item_id] for item_id in old_release["audioAssetIds"] if old_audio_by_id[item_id]["contentAssetId"] in old_hsk1_ids]
    (ROOT / "src/lib/content/legacy-hsk1-words.json").write_text(
        json.dumps({"releaseId": old_release["id"], "words": [[item["id"], item["standard_version"], item["content_version"], "1", item["payload"]["hanzi"], item["payload"].get("traditional", ""), item["payload"].get("pinyin", ""), item["payload"].get("meaning", ""), item["payload"].get("partOfSpeech", "")] for item in legacy_words]}, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8"
    )
    (ROOT / "src/lib/content/legacy-hsk1-audio.json").write_text(
        json.dumps({"audio": [[item["contentAssetId"], item["storageKey"], item["logicalId"]] for item in legacy_audio]}, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8"
    )

    new_content_ids = []
    new_audio_ids = []
    for entry in draft["entries"]:
        number = entry["officialOrder"]
        path = ROOT / "public" / by_number[number]["storageKey"]
        if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != by_number[number]["checksumSha256"]:
            raise ValueError(f"Audio checksum mismatch: {number}")
        if not all(str(entry[key]).strip() for key in ("hanzi", "traditional", "pinyin", "meaning", "partOfSpeech")):
            raise ValueError(f"Missing editorial field: {number}")
        if "[" in entry["meaning"] or "|" in entry["meaning"] or len(entry["meaning"]) > 100:
            raise ValueError(f"Unedited English gloss: {number}")
        word_id = entry["id"]
        logical_id = word_id.removesuffix(".v1")
        new_content_ids.append(word_id)
        repository["contentAssets"].append({
            "id": word_id, "logicalId": logical_id, "standard": "hsk3", "level": 1,
            "kind": "word", "version": 1, "standard_version": STANDARD_VERSION,
            "level_band": "1", "content_version": CONTENT_VERSION,
            "source_ref": "chinesetest-hsk-exam-2025+HSKKit-editorial",
            "license_ref": "HSKKit-original+CC-BY-SA-4.0",
            "qa_status": "approved", "publish_status": "published",
            "payload": {"hanzi": entry["hanzi"], "traditional": entry["traditional"], "pinyin": entry["pinyin"], "meaning": entry["meaning"], "partOfSpeech": entry["partOfSpeech"]},
            "source": {"name": "2025 HSK exam syllabus level placement and HSKKit editorial definitions", "url": "https://www.chinesetest.cn/HSK"},
            "authorization": {"status": "authorized", "license": "HSKKit original editorial content; CC BY-SA 4.0 for adapted legacy glosses", "evidenceUrl": "https://hskkit.com/content-license"},
            "qaStatus": "approved",
        })
        audio_id = f"hsk2025.audio.hsk1.l1-{number:04d}.v1"
        new_audio_ids.append(audio_id)
        repository["audioAssets"].append({
            "id": audio_id, "logicalId": audio_id.removesuffix(".v1"), "contentAssetId": word_id,
            "standard": "hsk3", "level": 1, "version": 1,
            "storageKey": by_number[number]["storageKey"], "checksumSha256": by_number[number]["checksumSha256"],
            "locale": "zh-CN", "voice": "Microsoft zh-CN-XiaoxiaoNeural", "speed": 0.92,
            "audioKind": "word", "publishedAt": PUBLISHED_AT,
            "issueReportPath": "/api/v1/content/audio/report",
            "usageRights": {"streaming": True, "caching": True, "offlineRedistribution": False},
            "source": {"name": "HSKKit pronunciation audio", "url": "https://hskkit.com/content-license"},
            "authorization": {"status": "authorized", "license": "HSKKit streaming audio license v1", "evidenceUrl": "https://hskkit.com/content-license"},
            "qaStatus": "approved",
        })
    active_content_ids = [item for item in old_release["contentAssetIds"] if item not in old_hsk1_ids] + new_content_ids
    active_audio_ids = [item for item in old_release["audioAssetIds"] if old_audio_by_id[item]["contentAssetId"] not in old_hsk1_ids] + new_audio_ids
    if len(active_content_ids) != 10907 or len(active_audio_ids) != len(old_release["audioAssetIds"]) - len(legacy_audio) + 300:
        raise ValueError("Release scope changed unexpectedly")
    repository["releases"].append({"id": RELEASE_ID, "standard": "hsk3", "version": 6, "status": "published", "contentAssetIds": active_content_ids, "audioAssetIds": active_audio_ids, "publishedAt": PUBLISHED_AT})
    repository["releaseEvents"].append({"action": "publish", "releaseId": RELEASE_ID, "standard": "hsk3", "at": PUBLISHED_AT, "previousActiveReleaseId": old_release["id"]})
    repository["activeReleaseByStandard"]["hsk3"] = RELEASE_ID
    catalog_path.write_text(json.dumps(repository, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

    # D1 content tables preserve the previous release and add a full immutable v6 snapshot.
    rows = []
    columns = "id,release_id,standard_version,level_band,content_version,source_ref,license_ref,qa_status,publish_status,hanzi,traditional,pinyin,meaning,part_of_speech"
    by_id = {item["id"]: item for item in repository["contentAssets"]}
    for item_id in active_content_ids:
        item = by_id[item_id]
        payload = item["payload"]
        hanzi = str(payload.get("hanzi", payload.get("text", payload.get("title", item["logicalId"]))))
        traditional = str(payload.get("traditional", hanzi))
        values = [item_id, RELEASE_ID, item.get("standard_version", "GF0025-2021"), item["level_band"], item["content_version"], item["source_ref"], item["license_ref"], item["qa_status"], item["publish_status"], hanzi, traditional, str(payload.get("pinyin", "n/a")), str(payload.get("meaning", payload.get("translation", payload.get("explanation", payload.get("title", item["kind"]))))), str(payload.get("partOfSpeech", item["kind"]))]
        rows.append("INSERT INTO content_assets (" + columns + ") VALUES (" + ",".join(sql(value) for value in values) + ");")
    migration = ROOT / "migrations/0045_hsk1_2025_content_release.sql"
    migration.write_text("-- Full v6 snapshot; v5 remains available for rollback.\n" + f"INSERT INTO content_releases (id,standard_version,content_version,status,published_at,entry_count) VALUES ({sql(RELEASE_ID)},'mixed-2025-hsk1-and-2021-other-levels',{sql(CONTENT_VERSION)},'published',{sql(PUBLISHED_AT)},{len(rows)});\n" + "\n".join(rows) + "\n", encoding="utf-8")
    manifest = {"release_id": RELEASE_ID, "release_version": 6, "published_at": PUBLISHED_AT, "hsk1_standard_version": STANDARD_VERSION, "other_levels_standard_version": "GF0025-2021", "hsk1_word_count": 300, "hsk1_audio_count": 300, "entry_count": len(rows), "counts_by_level_band": dict(Counter(by_id[item]["level_band"] for item in active_content_ids)), "source_url": "https://www.chinesetest.cn/HSK", "source_pdf_sha256": draft["sourcePdfSha256"]}
    (ROOT / "content/releases/hsk3-hsk1-2025-v6.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"releaseId": RELEASE_ID, "content": len(rows), "hsk1Words": 300, "hsk1Audio": 300, "legacyWords": len(legacy_words), "legacyAudio": len(legacy_audio)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
