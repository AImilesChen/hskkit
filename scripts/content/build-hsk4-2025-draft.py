#!/usr/bin/env python3
"""Build a private, non-publishable HSK 4 editorial draft from audited rows."""

from __future__ import annotations

import argparse
import gzip
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
POS_MAP = {"名": "N", "动": "V", "形": "Adj", "副": "Adv", "代": "Pron", "数": "Num",
           "量": "M", "介": "Prep", "连": "Conj", "助": "Aux", "叹": "Intj",
           "前缀": "Prefix", "后缀": "Suffix"}
PHRASE_NUMBERS = {1100, 1115, 1419, 1476, 1531, 1665}
TRADITIONAL_OVERRIDES = {1095: "窗", 1220: "乾"}
POS_OVERRIDES = {1466: "Prep", 1508: "Adj/Adv", 1763: "Intj", 1892: "Adj"}
# Ambiguous lineage is retained only for the same reading and teaching sense.
# A missing lineage deliberately leaves an old saved record attached to its old ID.
REVIEWED_LINEAGE = {
    1043: "hsk3.word.l3.0056.v1", 1044: "hsk3.word.l6.0057.v1",
    1045: "hsk3.word.l3.0057.v1", 1046: "hsk3.word.l2.0032.v1",
    1047: "hsk3.word.l2.0033.v1", 1048: "hsk3.word.l3.0058.v1",
    1147: None, 1220: None, 1436: "hsk3.word.l3.0420.v1",
    1473: None, 1543: "hsk3.word.l2.0407.v1",
    1646: "hsk3.word.l2.0477.v1", 1647: None, 1650: None,
    1691: None, 1750: "hsk3.word.l3.0722.v1",
    1754: "hsk3.word.l3.0730.v1", 1771: "hsk3.word.l3.0751.v1",
    1865: "hsk3.word.l3.0835.v1", 1869: "hsk3.word.l2.0662.v1",
    1938: None, 1960: None,
}


def dictionary_entries() -> dict[str, list[tuple[str, str]]]:
    result: dict[str, list[tuple[str, str]]] = {}
    with gzip.open(ROOT / "content/sources/cc-cedict-e0d756cb.txt.gz", "rt", encoding="utf-8") as source:
        for line in source:
            if line.startswith("#"):
                continue
            match = re.match(r"^(\S+) (\S+) \[[^]]+\] /([^/]+)/", line)
            if match:
                traditional, simplified, gloss = match.groups()
                result.setdefault(simplified, []).append((traditional, gloss))
    return result


def short_gloss(value: str) -> str:
    value = re.sub(r"\[[^]]*\]", "", value)
    value = re.sub(r"\s+", " ", value).strip(" ;|")
    return next((part.strip() for part in value.split(";") if part.strip()), "")[:100].rstrip(" ;|")


def display_pos(value: str, number: int) -> str:
    if number in POS_OVERRIDES:
        return POS_OVERRIDES[number]
    if not value:
        if number not in PHRASE_NUMBERS:
            raise ValueError(f"Unreviewed blank part of speech: {number}")
        return "Phrase"
    found = []
    for chinese, english in POS_MAP.items():
        if chinese in value and english not in found:
            found.append(english)
    if not found:
        raise ValueError(f"Unmapped part of speech: {number}: {value}")
    return "/".join(found)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--crosswalk", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    if output.is_relative_to(ROOT):
        raise ValueError("Complete HSK 4 draft must stay outside the public Git checkout")
    source = json.loads(args.crosswalk.read_text(encoding="utf-8"))
    gloss_overrides = {int(number): value for number, value in json.loads(
        (ROOT / "scripts/content/hsk4-2025-gloss-overrides.json").read_text(encoding="utf-8")
    ).items()}
    if [row["number"] for row in source["rows"]] != list(range(1001, 2001)):
        raise ValueError("Expected the exact 1,000 official HSK 4 rows")
    unresolved = {row["number"] for row in source["rows"] if row["candidate_old_ids"] and not row["selected_old_id"]}
    if unresolved != set(REVIEWED_LINEAGE):
        raise ValueError(f"Lineage review differs from audit: missing {sorted(unresolved - set(REVIEWED_LINEAGE))}; extra {sorted(set(REVIEWED_LINEAGE) - unresolved)}")
    catalog = json.loads((ROOT / "src/lib/content/public-catalog-index.json").read_text(encoding="utf-8"))
    legacy = json.loads((ROOT / "src/lib/content/legacy-hsk23-words.json").read_text(encoding="utf-8"))
    by_id = {entry[0]: entry for entry in catalog["words"] + legacy["words"]}
    dictionary = dictionary_entries()
    entries = []
    for row in source["rows"]:
        number = row["number"]
        chosen = REVIEWED_LINEAGE.get(number, row["selected_old_id"])
        if chosen and chosen not in row["candidate_old_ids"]:
            raise ValueError(f"Reviewed lineage is not a same-spelling candidate: {number}")
        old = by_id.get(chosen) if chosen else None
        dictionary_candidate = dictionary.get(row["word"], [])
        if old:
            traditional = old[5].split("|", 1)[0]
            meaning = short_gloss(old[7])
            meaning_source = "licensed-existing-catalog"
        elif dictionary_candidate:
            traditional = dictionary_candidate[0][0]
            meaning = short_gloss(dictionary_candidate[0][1])
            meaning_source = "unreviewed-licensed-dictionary"
        else:
            traditional = row["word"]
            meaning = ""
            meaning_source = "needs-independent-editorial"
        traditional = TRADITIONAL_OVERRIDES.get(number, traditional)
        if number in gloss_overrides:
            meaning = gloss_overrides[number]
            meaning_source = "independent-editorial-draft"
        entries.append({"id": f"hsk2025.word.l4.{row['number']:04d}.v1", "level": 4,
                        "officialOrder": row["number"], "hanzi": row["word"],
                        "traditional": traditional, "pinyin": row["pinyin"],
                        "officialPartOfSpeech": row["part_of_speech"],
                        "partOfSpeech": display_pos(row["part_of_speech"], number),
                        "meaning": meaning, "meaningSource": meaning_source,
                        "legacyId": chosen, "matchStatus": row["category"],
                        "meaningQaStatus": "needs-editorial-review", "audioQaStatus": "needs-audio-audit"})
    lineage = [entry["legacyId"] for entry in entries if entry["legacyId"]]
    if len(lineage) != len(set(lineage)):
        raise ValueError("Two new entries share a legacy ID")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"schemaVersion": 1, "status": "draft-not-for-publication",
                                  "sourceSha256": source["source_sha256"], "entries": entries},
                                 ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"entries": len(entries),
                      "missingGloss": sum(not entry["meaning"] for entry in entries),
                      "unmappedPartOfSpeech": sum(entry["partOfSpeech"] == "REVIEW" for entry in entries),
                      "manualLineage": sum(entry["legacyId"] is None for entry in entries)},
                     ensure_ascii=False))


if __name__ == "__main__":
    main()
