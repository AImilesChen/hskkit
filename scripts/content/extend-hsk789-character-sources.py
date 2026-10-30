#!/usr/bin/env python3
"""Extend frozen Unicode character facts for new HSK 7–9 vocabulary."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
UNIHAN_SHA256 = "f7a48b2b545acfaa77b2d607ae28747404ce02baefee16396c5d2d7a8ef34b5e"
FIELDS = ("kDefinition", "kMandarin", "kRSUnicode", "kTotalStrokes")
HAN = re.compile(r"[\u3400-\u9fff]")
RELEASE_ID = "hsk3-hsk123456789-2025-v11"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--unihan-zip", type=Path, required=True)
    args = parser.parse_args()
    if hashlib.sha256(args.unihan_zip.read_bytes()).hexdigest() != UNIHAN_SHA256:
        raise ValueError("Official Unicode 17 Unihan archive checksum differs")
    catalog = json.loads((ROOT / "src/lib/content/catalog.json").read_text(encoding="utf-8"))
    if catalog["activeReleaseByStandard"]["hsk3"] != RELEASE_ID:
        raise ValueError("Unexpected active content release")
    release = next(item for item in catalog["releases"] if item["id"] == RELEASE_ID)
    active_ids = set(release["contentAssetIds"])
    active_characters = {char for asset in catalog["contentAssets"]
                         if asset["id"] in active_ids and asset["kind"] == "word"
                         for char in asset["payload"]["hanzi"] if HAN.fullmatch(char)}
    unihan_path = ROOT / "content/sources/unihan-17.0-hsk-characters.json"
    unihan = json.loads(unihan_path.read_text(encoding="utf-8"))
    unihan_by_char = {record["hanzi"]: record for record in unihan["records"]}
    new_characters = active_characters - set(unihan_by_char)
    if len(new_characters) != 134:
        raise ValueError(f"Expected 134 new characters; found {len(new_characters)}")
    records = {char: {"hanzi": char} for char in new_characters}
    target_codes = {f"U+{ord(char):04X}": char for char in new_characters}
    with zipfile.ZipFile(args.unihan_zip) as archive:
        for name in archive.namelist():
            if not name.endswith(".txt"):
                continue
            for line in archive.read(name).decode("utf-8").splitlines():
                parts = line.split("\t", 2)
                if len(parts) != 3 or parts[0] not in target_codes or parts[1] not in FIELDS:
                    continue
                records[target_codes[parts[0]]][parts[1]] = parts[2]
    if any(set(record) != {"hanzi", *FIELDS} for record in records.values()):
        raise ValueError("The Unicode source lacks required advanced character fields")
    unihan_by_char.update({record["hanzi"]: record for record in records.values()})
    unihan["records"] = sorted(unihan_by_char.values(), key=lambda record: record["hanzi"])
    unihan["characterCount"] = len(unihan["records"])
    unihan_path.write_text(json.dumps(unihan, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

    structures_path = ROOT / "content/sources/makemeahanzi-618dbab8-hsk-structures.json"
    structures = json.loads(structures_path.read_text(encoding="utf-8"))
    structure_by_char = {record["hanzi"]: record for record in structures["records"]}
    for char in new_characters:
        structure_by_char.setdefault(char, {"hanzi": char, "decomposition": "？"})
    structures["records"] = sorted(structure_by_char.values(), key=lambda record: record["hanzi"])
    structures["characterCount"] = len(structures["records"])
    structures["provenance"]["extraction"] = (
        "Frozen licensed Make Me a Hanzi decompositions; 134 additional 2025 HSK Advanced "
        "characters have explicitly unknown decompositions, without invented source structure data."
    )
    structures_path.write_text(json.dumps(structures, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps({"newCharacters": len(new_characters), "activeCharacters": len(active_characters),
                      "unihanCount": unihan["characterCount"],
                      "structureCount": structures["characterCount"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
