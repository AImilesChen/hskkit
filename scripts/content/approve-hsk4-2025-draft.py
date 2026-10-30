#!/usr/bin/env python3
"""Validate the edited private HSK 4 draft before release authoring."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--draft", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    if output.is_relative_to(ROOT):
        raise ValueError("Approved complete draft must stay outside the public checkout")
    draft = json.loads(args.draft.read_text(encoding="utf-8"))
    entries = draft["entries"]
    if len(entries) != 1000 or [entry["officialOrder"] for entry in entries] != list(range(1001, 2001)):
        raise ValueError("Missing or duplicate HSK 4 source rows")
    if len({entry["id"] for entry in entries}) != 1000:
        raise ValueError("Duplicate content IDs")
    lineage = [entry["legacyId"] for entry in entries if entry["legacyId"]]
    if len(lineage) != len(set(lineage)):
        raise ValueError("Two new senses share one saved-learning lineage")
    if Counter(entry["meaningSource"] for entry in entries)["independent-editorial-draft"] < 200:
        raise ValueError("The reviewed gloss corrections have not been applied")
    for entry in entries:
        number = entry["officialOrder"]
        if any(not isinstance(entry[key], str) or not entry[key].strip()
               for key in ("hanzi", "traditional", "pinyin", "meaning", "partOfSpeech")):
            raise ValueError(f"Empty editorial value at {number}")
        if any(value in entry["meaning"] for value in ("CL:", "variant of", "(coll.)", "(slang)", "|")):
            raise ValueError(f"Unedited dictionary syntax at {number}")
        if len(entry["meaning"]) > 100 or len(entry["traditional"]) > 15:
            raise ValueError(f"Long or malformed editorial value at {number}")
        if entry["partOfSpeech"] == "REVIEW" or "|" in entry["traditional"]:
            raise ValueError(f"Unreviewed POS or traditional form at {number}")
        entry["meaningQaStatus"] = "approved"
        entry["traditionalQaStatus"] = "approved"
    draft["status"] = "editorially-approved-audio-excluded"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(draft, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"entries": len(entries), "editedGlosses": sum(
        entry["meaningSource"] == "independent-editorial-draft" for entry in entries),
                      "legacyLinks": len(lineage), "audioPublished": 0}, ensure_ascii=False))


if __name__ == "__main__":
    main()
