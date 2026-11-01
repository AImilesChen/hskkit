"""Build only explicitly reviewed examples for the unified HSK 7–9 band.

The review file freezes the selected source records and their attribution.
No download, generated candidate or substring match can approve a new record.
"""

import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def reading(value):
    return re.sub(r"[^a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]", "", value.lower())


def main():
    review = json.loads((ROOT / "scripts/hsk789-example-review.json").read_text(encoding="utf8"))
    catalog = json.loads((ROOT / "src/lib/content/public-catalog-index.json").read_text(encoding="utf8"))
    rows = {r[0]: r for r in catalog["words"] if r[3] == "7-9"}
    assert len(rows) == 5600 and review["band"] == "7-9"
    assert set(review["entries"]) <= set(rows), "Unknown or historical word ID"
    examples, attribution = {}, {}
    for asset_id, entry in review["entries"].items():
        assert entry["status"] == "reviewed", f"{asset_id}: unreviewed record"
        row = rows[asset_id]
        assert [entry["hanzi"], entry["pinyin"], entry["meaningReviewed"], entry["partOfSpeechReviewed"]] == [row[4], row[6], row[7], row[8]], f"{asset_id}: catalog changed; review again"
        example = entry["example"]
        assert len(example) == 3 and all(isinstance(v, str) and v.strip() for v in example)
        assert row[4] in example[0], f"{asset_id}: headword absent"
        assert reading(row[6]) in reading(example[1]), f"{asset_id}: tone-marked reading absent"
        source = entry["source"]
        assert source["license"] == "CC-BY-SA-4.0"
        assert source["provider"] in {"HSKKit", "gushi", "zhongdex"}
        if source["provider"] == "zhongdex":
            record = source["record"]
            assert record["id"] == source["upstreamId"]
            assert [record["hanzi"], record["pinyin"], record["english"]] == example
        elif source["provider"] == "gushi":
            assert source["upstreamExample"] == example
        examples[asset_id] = [row[4], row[6], *example]
        attribution[asset_id] = {"provider": source["provider"], "license": source["license"], "upstreamId": source.get("upstreamId")}
        if source.get("replaces"):
            attribution[asset_id]["replaces"] = source["replaces"]
    output = ROOT / "src/lib/learning/hsk789-2025-examples.json"
    output.write_text(json.dumps(examples, ensure_ascii=False, indent=2) + "\n", encoding="utf8", newline="\n")
    public = ROOT / "public/content/hsk789-example-attribution.json"
    public.parent.mkdir(parents=True, exist_ok=True)
    public.write_text(json.dumps({"license": review["license"], "sources": review["sources"], "entries": attribution}, ensure_ascii=False, indent=2) + "\n", encoding="utf8", newline="\n")
    report = {
        "band": "7-9", "totalWords": len(rows), "reviewedExamples": len(examples),
        "pendingExamples": len(rows) - len(examples),
        "fullBandReviewComplete": len(rows) == len(examples),
        "pendingIds": sorted(set(rows) - set(examples)),
    }
    (ROOT / "docs/quality/hsk789-example-progress.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf8", newline="\n")
    print(f"Advanced examples: {len(examples)} reviewed / {len(rows)}; {report['pendingExamples']} pending")


if __name__ == "__main__":
    main()
