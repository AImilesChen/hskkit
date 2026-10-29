#!/usr/bin/env python3
"""Build the commercial HSK 1 input from the approved active content release."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
catalog = json.loads((ROOT / "src/lib/content/catalog.json").read_text(encoding="utf-8"))
release_id = "hsk3-hsk1-2025-v6"
if catalog["activeReleaseByStandard"]["hsk3"] != release_id:
    raise SystemExit("The expected HSK 1 release is not active")
release = next(item for item in catalog["releases"] if item["id"] == release_id)
by_id = {item["id"]: item for item in catalog["contentAssets"]}
entries = []
for asset_id in release["contentAssetIds"]:
    asset = by_id[asset_id]
    if not (asset["kind"] == "word" and asset["level"] == 1):
        continue
    if not (asset["qaStatus"] == "approved" and asset["publish_status"] == "published" and asset["authorization"]["status"] == "authorized"):
        raise SystemExit(f"Unapproved word {asset_id}")
    payload = asset["payload"]
    entries.append({
        "id": asset_id,
        "content_version": asset["content_version"],
        "standard_version": asset["standard_version"],
        "level_band": "1",
        "publish_status": asset["publish_status"],
        "qa_status": asset["qaStatus"],
        "source_ref": asset["source_ref"],
        "license_ref": asset["license_ref"],
        "hanzi": payload["hanzi"],
        "traditional": payload["traditional"],
        "pinyin": payload["pinyin"],
        "meaning": payload["meaning"],
        "partOfSpeech": payload["partOfSpeech"],
    })
if len(entries) != 300 or any(item["standard_version"] != "HSK-EXAM-2025" for item in entries):
    raise SystemExit("Expected exactly 300 approved 2025 HSK 1 words")
output = ROOT / "content/releases/hsk1-2025-commercial-v1.json"
output.write_text(json.dumps({"releaseId": release_id, "entries": entries}, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"Wrote {len(entries)} commercial HSK 1 words to {output}")
