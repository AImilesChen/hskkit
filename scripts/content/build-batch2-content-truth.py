#!/usr/bin/env python3
"""Publish the frozen Batch 2 content truth from the currently approved catalog.

The script is deterministic: it reuses the approved active release assets, adds the
formal v5 release once, and emits its manifest plus the D1 content seed/migration.
"""
from __future__ import annotations

import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "src/lib/content/catalog.json"
RELEASE_ID = "hsk3-content-truth-v5"
RELEASE_VERSION = 5
PUBLISHED_AT = "2026-08-25T03:05:24.000Z"
CONTENT_VERSION = "2026.08.25-batch2"
MANIFEST = ROOT / "content/releases/hsk3-content-truth-v5.json"
SEED = ROOT / "content/releases/hsk3-content-truth-v5.sql"
MIGRATION = ROOT / "migrations/0018_content_truth_release.sql"
QUESTION_FILES = ("hsk1.json", "hsk2.json", "hsk3.json", "hsk4.json", "hsk5.json", "level_test.json")


def sql(value: object) -> str:
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def payload_text(asset: dict, key: str, fallback: str = "") -> str:
    return str(asset.get("payload", {}).get(key, fallback))


def level_band(asset: dict) -> str:
    return str(asset.get("level_band") or ("7-9" if int(asset["level"]) >= 7 else asset["level"]))


def question_banks() -> dict:
    source = ROOT / "src/lib/data"
    docs = ROOT / "docs/content/questions"
    result = {}
    for name in QUESTION_FILES:
        src_bytes = (source / name).read_bytes()
        docs_bytes = (docs / name).read_bytes()
        if src_bytes != docs_bytes:
            raise SystemExit(f"Question source drift: {name}")
        parsed = json.loads(src_bytes)
        questions = parsed["questions"] if isinstance(parsed, dict) and "questions" in parsed else parsed
        result[name] = {
            "count": len(questions),
            "sha256": hashlib.sha256(src_bytes).hexdigest(),
            "status": "approved",
        }
    return result


def main() -> None:
    repository = json.loads(CATALOG.read_text(encoding="utf-8"))
    existing = next((item for item in repository["releases"] if item["id"] == RELEASE_ID), None)
    if existing is None:
        previous_id = repository["activeReleaseByStandard"]["hsk3"]
        previous = next(item for item in repository["releases"] if item["id"] == previous_id)
        repository["releases"].append({
            "id": RELEASE_ID,
            "standard": "hsk3",
            "version": RELEASE_VERSION,
            "status": "published",
            "contentAssetIds": previous["contentAssetIds"],
            "audioAssetIds": previous["audioAssetIds"],
            "publishedAt": PUBLISHED_AT,
        })
        repository["releaseEvents"].append({
            "action": "publish",
            "releaseId": RELEASE_ID,
            "standard": "hsk3",
            "at": PUBLISHED_AT,
            "previousActiveReleaseId": previous_id,
        })
        repository["activeReleaseByStandard"]["hsk3"] = RELEASE_ID
    else:
        if repository["activeReleaseByStandard"]["hsk3"] != RELEASE_ID:
            raise SystemExit("Batch 2 release exists but is not active")

    release = next(item for item in repository["releases"] if item["id"] == RELEASE_ID)
    assets_by_id = {item["id"]: item for item in repository["contentAssets"]}
    audio_by_id = {item["id"]: item for item in repository["audioAssets"]}
    assets = [assets_by_id[item_id] for item_id in release["contentAssetIds"]]
    audio = [audio_by_id[item_id] for item_id in release["audioAssetIds"]]
    counts = Counter(level_band(item) for item in assets)
    frozen_counts = {band: counts[band] for band in ("1", "2", "3", "4", "5", "6", "7-9")}
    expected = {"1": 502, "2": 775, "3": 975, "4": 1002, "5": 1073, "6": 1142, "7-9": 5638}
    if frozen_counts != expected or len(assets) != 11107:
        raise SystemExit(f"Unapproved catalog count drift: {frozen_counts}, total={len(assets)}")
    if any(item.get("qaStatus") != "approved" or item.get("publish_status") != "published" for item in assets):
        raise SystemExit("Active release contains content outside the approved published set")

    banks = question_banks()
    for index_path in (ROOT / "src/lib/data/index.json", ROOT / "docs/content/questions/index.json"):
        question_index = json.loads(index_path.read_text(encoding="utf-8"))
        question_index["updated_at"] = PUBLISHED_AT
        question_index["total_questions"] = sum(item["count"] for item in banks.values())
        for name, bank in banks.items():
            question_index["files"][name]["count"] = bank["count"]
            question_index["files"][name]["sha256"] = bank["sha256"]
        index_path.write_text(json.dumps(question_index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    manifest_entries = []
    for item in assets:
        payload = item.get("payload", {})
        manifest_entries.append({
            "id": item["id"],
            "logical_id": item["logicalId"],
            "kind": item["kind"],
            "standard_version": item.get("standard_version", "GF0025-2021"),
            "level_band": level_band(item),
            "content_version": item.get("content_version", CONTENT_VERSION),
            "source_ref": item.get("source_ref", item["source"]["name"]),
            "license_ref": item.get("license_ref", item["authorization"]["license"]),
            "qa_status": item.get("qa_status", item["qaStatus"]),
            "publish_status": item["publish_status"],
            "hanzi": str(payload.get("hanzi", payload.get("text", payload.get("title", item["logicalId"])))),
            "traditional": str(payload.get("traditional", payload.get("hanzi", payload.get("text", payload.get("title", item["logicalId"]))))),
            "pinyin": str(payload.get("pinyin", "n/a")),
            "meaning": str(payload.get("meaning", payload.get("translation", payload.get("explanation", payload.get("title", item["kind"]))))),
            "part_of_speech": str(payload.get("partOfSpeech", item["kind"])),
        })
    previous_manifest = json.loads((ROOT / "content/releases/hsk3-gf0025-2021-v2.json").read_text(encoding="utf-8"))
    manifest = {
        "release_id": RELEASE_ID,
        "release_version": RELEASE_VERSION,
        "standard_version": "GF0025-2021",
        "content_version": CONTENT_VERSION,
        "published_at": PUBLISHED_AT,
        "source_refs": previous_manifest["source_refs"],
        "level_scope": {
            "1": "published", "2": "published", "3": "published", "4": "published",
            "5": "published", "6": "published",
            "7": "published as the single canonical unified HSK 7–9 advanced ability band",
            "8": "mapped to the unified HSK 7–9 advanced ability band; not separately published",
            "9": "mapped to the unified HSK 7–9 advanced ability band; not separately published",
        },
        "counts_by_level_band": frozen_counts,
        "entry_count": len(assets),
        "audio_assets": [{"id": item["id"], "kind": item["audioKind"], "checksum_sha256": item["checksumSha256"], "qa_status": item["qaStatus"]} for item in audio],
        "question_banks": banks,
        "entries": manifest_entries,
    }

    header = [
        "-- Generated by scripts/content/build-batch2-content-truth.py; do not edit.",
        f"INSERT INTO content_releases (id,standard_version,content_version,status,published_at,entry_count) VALUES ({sql(RELEASE_ID)},'GF0025-2021',{sql(CONTENT_VERSION)},'published',{sql(PUBLISHED_AT)},{len(assets)}) ON CONFLICT(id) DO UPDATE SET status=excluded.status,published_at=excluded.published_at,entry_count=excluded.entry_count;",
        f"DELETE FROM content_assets WHERE release_id = {sql(RELEASE_ID)};",
    ]
    rows = []
    columns = ("id", "release_id", "standard_version", "level_band", "content_version", "source_ref", "license_ref", "qa_status", "publish_status", "hanzi", "traditional", "pinyin", "meaning", "part_of_speech")
    for entry in manifest_entries:
        values = [entry[key] for key in ("id", "standard_version", "level_band", "content_version", "source_ref", "license_ref", "qa_status", "publish_status", "hanzi", "traditional", "pinyin", "meaning", "part_of_speech")]
        values.insert(1, RELEASE_ID)
        rows.append(
            "INSERT INTO content_assets (" + ",".join(columns) + ") VALUES (" + ",".join(sql(value) for value in values) + ") "
            "ON CONFLICT(release_id,id) DO UPDATE SET " + ",".join(f"{column}=excluded.{column}" for column in columns[2:]) + ";"
        )
    seed_text = "\n".join(header + rows) + "\n"
    schema_upgrade = """-- Upgrade the legacy global asset key so immutable release snapshots may reuse logical asset IDs.
PRAGMA foreign_keys=OFF;
ALTER TABLE content_assets RENAME TO content_assets_legacy;
CREATE TABLE content_assets (
  id TEXT NOT NULL,
  release_id TEXT NOT NULL REFERENCES content_releases(id),
  standard_version TEXT NOT NULL,
  level_band TEXT NOT NULL CHECK (level_band IN ('1','2','3','4','5','6','7-9')),
  content_version TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  license_ref TEXT NOT NULL,
  qa_status TEXT NOT NULL CHECK (qa_status IN ('pending','approved','rejected')),
  publish_status TEXT NOT NULL CHECK (publish_status IN ('draft','published','withdrawn')),
  hanzi TEXT NOT NULL,
  traditional TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  meaning TEXT NOT NULL,
  part_of_speech TEXT NOT NULL,
  PRIMARY KEY (release_id, id)
);
INSERT INTO content_assets SELECT * FROM content_assets_legacy;
DROP TABLE content_assets_legacy;
CREATE INDEX idx_content_assets_release_level_publish ON content_assets(release_id, level_band, qa_status, publish_status);
PRAGMA foreign_keys=ON;
"""

    CATALOG.write_text(json.dumps(repository, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    SEED.write_text(seed_text, encoding="utf-8")
    MIGRATION.write_text(schema_upgrade + seed_text, encoding="utf-8")
    print(json.dumps({"releaseId": RELEASE_ID, "entryCount": len(assets), "counts": frozen_counts, "audioCount": len(audio), "questionCount": sum(item["count"] for item in banks.values())}, ensure_ascii=False))


if __name__ == "__main__":
    main()
