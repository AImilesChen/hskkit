#!/usr/bin/env python3
"""Freeze commercial HSK 2/3 entries from the approved active content release."""

import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
catalog = json.loads((ROOT / "src/lib/content/catalog.json").read_text(encoding="utf-8"))
release_id = "hsk3-hsk123-2025-v7"
if catalog["activeReleaseByStandard"]["hsk3"] != release_id:
    raise SystemExit("Expected HSK 1–3 2025 release is not active")
release = next(item for item in catalog["releases"] if item["id"] == release_id)
by_id = {item["id"]: item for item in catalog["contentAssets"]}
entries = []
for asset_id in release["contentAssetIds"]:
    asset = by_id[asset_id]
    if not (asset["kind"] == "word" and asset["level"] in (2, 3)):
        continue
    if not (asset["qaStatus"] == "approved" and asset["publish_status"] == "published"
            and asset["authorization"]["status"] == "authorized"
            and asset["standard_version"] == "HSK-EXAM-2025"):
        raise SystemExit(f"Unapproved 2025 word {asset_id}")
    payload = asset["payload"]
    entries.append({
        "id": asset_id, "content_version": asset["content_version"],
        "standard_version": asset["standard_version"], "level_band": asset["level_band"],
        "publish_status": asset["publish_status"], "qa_status": asset["qaStatus"],
        "source_ref": asset["source_ref"], "license_ref": asset["license_ref"],
        "hanzi": payload["hanzi"], "traditional": payload["traditional"],
        "pinyin": payload["pinyin"], "meaning": payload["meaning"],
        "partOfSpeech": payload["partOfSpeech"],
    })
if Counter(item["level_band"] for item in entries) != {"2": 200, "3": 500}:
    raise SystemExit("Expected 200 HSK 2 and 500 HSK 3 approved words")
output = ROOT / "content/releases/hsk23-2025-commercial-v1.json"
output.write_text(json.dumps({"releaseId": release_id, "entries": entries}, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"Wrote {len(entries)} HSK 2/3 commercial words to {output}")
