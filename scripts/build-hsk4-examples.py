"""Build reviewed HSK 4 examples; optionally supply a local frozen source JSON."""

import hashlib
import json
from pathlib import Path
import sys
import unicodedata
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
SOURCE = "https://gushichinese.com/hsk-3.0/downloads/hsk-3.0-words-4.json"
SHA256 = "12377f65cfaeaf4d951e5b3ec54d483e8900eb10f415478c70851c1e79761186"


def untoned(value):
    return "".join(c for c in unicodedata.normalize("NFD", value.lower()) if "a" <= c <= "z")


def main():
    raw = Path(sys.argv[1]).read_bytes() if len(sys.argv) > 1 else urllib.request.urlopen(SOURCE, timeout=30).read()
    assert hashlib.sha256(raw).hexdigest() == SHA256, "Source changed: review before importing"
    source = json.loads(raw)
    assert source["license"].startswith("CC BY-SA 4.0")
    assert source["count"] == len(source["data"]) == 1000
    catalog = json.loads((ROOT / "src/lib/content/public-catalog-index.json").read_text(encoding="utf8"))["words"]
    rows = [r for r in catalog if r[3] == "4"]
    assert len(rows) == 1000
    overrides = json.loads((ROOT / "scripts/hsk4-example-overrides.json").read_text(encoding="utf8"))
    assert set(overrides) <= {r[0] for r in rows}
    examples = {}
    for row in rows:
        asset_id, hanzi, reading = row[0], row[4], row[6]
        candidates = [e for e in source["data"] if e["hanzi"] == hanzi]
        assert candidates, asset_id
        original = next((e for e in candidates if e["pinyin"] == reading), candidates[0])
        example = overrides.get(asset_id) or [original["exampleChinese"], original["examplePinyin"], original["exampleEnglish"]]
        assert len(example) == 3 and all(v.strip() for v in example), f"{asset_id}: incomplete"
        assert hanzi in example[0], f"{asset_id}: missing headword"
        assert untoned(reading.split("/")[0]) in untoned(example[1]), f"{asset_id}: reading missing"
        # Retain the reviewed headword and reading, so a future catalog change
        # cannot silently attach this sentence to a different lexical entry.
        examples[asset_id] = [hanzi, reading, *example]
    out = ROOT / "src/lib/learning/hsk4-2025-examples.json"
    out.write_text(json.dumps(examples, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print(f"Wrote {len(examples)} reviewed examples ({len(overrides)} editorial replacements)")


if __name__ == "__main__":
    main()
