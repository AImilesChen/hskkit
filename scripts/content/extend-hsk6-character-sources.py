#!/usr/bin/env python3
"""Extend the frozen character subset for HSK 6's nine new characters."""

from __future__ import annotations

import argparse
import hashlib
import json
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
UNIHAN_SHA256 = "f7a48b2b545acfaa77b2d607ae28747404ce02baefee16396c5d2d7a8ef34b5e"
NEW_CHARACTERS = "侄州晾棕椎漱甥蚁蚂"
FIELDS = ("kDefinition", "kMandarin", "kRSUnicode", "kTotalStrokes")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--unihan-zip", type=Path, required=True)
    args = parser.parse_args()
    if hashlib.sha256(args.unihan_zip.read_bytes()).hexdigest() != UNIHAN_SHA256:
        raise ValueError("Official Unicode 17 Unihan archive checksum differs")
    records = {char: {"hanzi": char} for char in NEW_CHARACTERS}
    target_codes = {f"U+{ord(char):04X}": char for char in NEW_CHARACTERS}
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
        raise ValueError("The Unicode source lacks required HSK 6 fields")
    unihan_path = ROOT / "content/sources/unihan-17.0-hsk-characters.json"
    unihan = json.loads(unihan_path.read_text(encoding="utf-8"))
    unihan_by_char = {record["hanzi"]: record for record in unihan["records"]}
    unihan_by_char.update({record["hanzi"]: record for record in records.values()})
    unihan["records"] = sorted(unihan_by_char.values(), key=lambda record: record["hanzi"])
    unihan["characterCount"] = len(unihan["records"])
    unihan_path.write_text(json.dumps(unihan, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

    structures_path = ROOT / "content/sources/makemeahanzi-618dbab8-hsk-structures.json"
    structures = json.loads(structures_path.read_text(encoding="utf-8"))
    structure_by_char = {record["hanzi"]: record for record in structures["records"]}
    for char in NEW_CHARACTERS:
        structure_by_char.setdefault(char, {"hanzi": char, "decomposition": "？"})
    structures["records"] = sorted(structure_by_char.values(), key=lambda record: record["hanzi"])
    structures["characterCount"] = len(structures["records"])
    structures["provenance"]["extraction"] = (
        "Frozen licensed Make Me a Hanzi decompositions; nine HSK 6 characters were added with "
        "explicitly unknown decompositions, without inventing source structure data."
    )
    structures_path.write_text(json.dumps(structures, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps({"newCharacters": NEW_CHARACTERS, "unihanCount": unihan["characterCount"],
                      "structureCount": structures["characterCount"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
