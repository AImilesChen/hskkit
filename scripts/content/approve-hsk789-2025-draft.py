#!/usr/bin/env python3
"""Validate a private advanced vocabulary draft for the 2025 release."""

from __future__ import annotations

import argparse
import json
import re
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
    if draft["status"] != "draft-not-for-publication":
        raise ValueError("Expected an unapproved draft")
    if len(entries) != 5600 or [entry["officialOrder"] for entry in entries] != list(range(5401, 11001)):
        raise ValueError("Missing or duplicate official HSK 7–9 source rows")
    if len({entry["id"] for entry in entries}) != 5600:
        raise ValueError("Duplicate content IDs")
    lineage = [entry["legacyId"] for entry in entries if entry["legacyId"]]
    if len(lineage) != len(set(lineage)) or draft["duplicateLegacyIds"]:
        raise ValueError("Two new senses share a saved-learning lineage")
    edited = Counter(entry["meaningSource"] for entry in entries)["independent-editorial-draft"]
    if edited < 160:
        raise ValueError("The reviewed glossary corrections are missing")
    for entry in entries:
        number = entry["officialOrder"]
        if any(not isinstance(entry[key], str) or not entry[key].strip()
               for key in ("hanzi", "traditional", "pinyin", "meaning", "partOfSpeech")):
            raise ValueError(f"Empty learner-facing value at {number}")
        if len(entry["meaning"]) > 300 or len(entry["traditional"]) > 15:
            raise ValueError(f"Long or malformed learner-facing value at {number}")
        if entry["meaningSource"] == "dictionary-draft" and (
            entry["meaning"].startswith(("see ", "variant of", "surname ", "archaic "))
            or re.match(r"^[A-Z][a-z]", entry["meaning"])
            or "|" in entry["meaning"]
        ):
            raise ValueError(f"Unedited dictionary syntax at {number}")
        if entry["partOfSpeech"] in {"REVIEW", "unspecified"} or "|" in entry["traditional"]:
            raise ValueError(f"Unreviewed POS or traditional form at {number}")
        if entry["matchStatus"] == "new_spelling" and entry["meaningSource"] == "existing-catalog":
            raise ValueError(f"New word incorrectly inherited an old meaning at {number}")
        entry["meaningQaStatus"] = "approved"
        entry["traditionalQaStatus"] = "approved"
    draft["status"] = "editorially-approved-audio-excluded"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(draft, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"entries": len(entries), "editedGlosses": edited,
                      "legacyLinks": len(lineage), "audioPublished": 0}, ensure_ascii=False))


if __name__ == "__main__":
    main()
