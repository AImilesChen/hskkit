"""Check the four production search rows returned by Wrangler after migration 0055."""

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
IDS = {f"hsk2025.word.l7.{n:05d}.v1" for n in (5448, 5629, 5631, 5641)}


def verify(results):
    assert isinstance(results, list) and results, "Missing D1 result bundles"
    assert all(bundle.get("success") is True for bundle in results), "D1 query failed"
    rows = [row for bundle in results for row in bundle["results"]]
    assert len(rows) == 4 and {row["id"] for row in rows} == IDS, "Expected exactly the four reviewed advanced IDs"
    catalog = json.loads((ROOT / "src/lib/content/public-catalog-index.json").read_text(encoding="utf8"))
    expected = {r[0]: r for r in catalog["words"] if r[0] in IDS}
    for row in rows:
        entry = expected[row["id"]]
        assert row["meaning"] == entry[7], f"{row['id']}: meaning mismatch"
        assert row["search_english"] == entry[11], f"{row['id']}: normalized meaning mismatch"
        assert row["search_text"] == f"{entry[9]} {entry[10]} {entry[11]}", f"{row['id']}: search text mismatch"


if __name__ == "__main__":
    verify(json.loads(Path(sys.argv[1]).read_text(encoding="utf8")))
    print("Verified all four reviewed advanced search glosses in D1")
