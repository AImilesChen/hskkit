#!/usr/bin/env python3
"""Freeze approved HSK 4 words for the updated commercial vocabulary packs."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
release_id = "hsk3-hsk1234-2025-v8"
catalog = json.loads((ROOT / "src/lib/content/catalog.json").read_text(encoding="utf-8"))
if catalog["activeReleaseByStandard"]["hsk3"] != release_id:
    raise SystemExit("Expected the HSK 1–4 2025 release to be active")
release = next(item for item in catalog["releases"] if item["id"] == release_id)
by_id = {item["id"]: item for item in catalog["contentAssets"]}
entries = []
for asset_id in release["contentAssetIds"]:
    asset = by_id[asset_id]
    if not (asset["kind"] == "word" and asset["level"] == 4):
        continue
    if not (asset["qaStatus"] == "approved" and asset["publish_status"] == "published"
            and asset["authorization"]["status"] == "authorized"
            and asset["standard_version"] == "HSK-EXAM-2025"):
        raise SystemExit(f"Unapproved HSK 4 word {asset_id}")
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
if len(entries) != 1000:
    raise SystemExit(f"Expected 1,000 approved HSK 4 words, got {len(entries)}")
output = ROOT / "content/releases/hsk4-2025-commercial-v1.json"
output.write_text(json.dumps({"releaseId": release_id, "entries": entries},
                             ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"Wrote {len(entries)} HSK 4 commercial words to {output}")
