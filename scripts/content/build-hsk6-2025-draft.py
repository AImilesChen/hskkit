#!/usr/bin/env python3
"""Build a private HSK 6 editorial draft; this output is not publishable."""

from __future__ import annotations

import argparse
import gzip
import json
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
POS_MAP = {"名": "N", "动": "V", "形": "Adj", "副": "Adv", "代": "Pron", "数": "Num",
           "量": "M", "介": "Prep", "连": "Conj", "助": "Aux", "叹": "Intj",
           "前缀": "Prefix", "后缀": "Suffix", "拟声": "Onomatopoeia"}
# These 19 syllabus rows have no printed POS; the learner-facing labels below
# are independent editorial classifications, not claims about official POS.
POS_OVERRIDES = {
    3667: "Adj", 3763: "Phrase", 3836: "V", 3845: "Phrase",
    3936: "Adj", 4037: "N", 4117: "Phrase", 4128: "Adv",
    4129: "Adv", 4633: "Phrase", 4694: "N", 4697: "Phrase",
    5014: "V", 5139: "N", 5164: "Adj", 5167: "Adj",
    5313: "Adj", 5334: "Adj", 5383: "V",
}
# Separate official homographs by sense/POS. A legacy ID may attach to only
# one current entry, so the second 局 row gets a new identity.
REVIEWED_LINEAGE = {
    4007: "hsk3.word.l6.0290.v1", 4342: None,
    4450: "hsk3.word.l6.0547.v1", 4451: "hsk3.word.l6.0546.v1",
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
        raise ValueError(f"Unreviewed blank part of speech: {number}")
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
        raise ValueError("Complete HSK 6 draft must stay outside the public checkout")
    source = json.loads(args.crosswalk.read_text(encoding="utf-8"))
    if [row["number"] for row in source["rows"]] != list(range(3601, 5401)):
        raise ValueError("Expected the exact 1,800 official HSK 6 rows")
    datasets = [json.loads((ROOT / "src/lib/content" / name).read_text(encoding="utf-8"))
                for name in ("public-catalog-index.json", "legacy-hsk23-words.json",
                             "legacy-hsk4-words.json", "legacy-hsk5-words.json")]
    by_id = {entry[0]: entry for dataset in datasets for entry in dataset["words"]}
    dictionary = dictionary_entries()
    overrides_path = ROOT / "scripts/content/hsk6-2025-gloss-overrides.json"
    gloss_overrides = {int(number): value for number, value in json.loads(
        overrides_path.read_text(encoding="utf-8") if overrides_path.exists() else "{}").items()}
    entries = []
    for row in source["rows"]:
        number = row["number"]
        chosen = REVIEWED_LINEAGE.get(number, row["selected_old_id"])
        if chosen and chosen not in row["candidate_old_ids"]:
            raise ValueError(f"Lineage is not a same-spelling candidate: {number}")
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
        if number in gloss_overrides:
            meaning = gloss_overrides[number]
            meaning_source = "independent-editorial-draft"
        entries.append({"id": f"hsk2025.word.l6.{number:04d}.v1", "level": 6,
                        "officialOrder": number, "hanzi": row["word"],
                        "traditional": traditional, "pinyin": row["pinyin"],
                        "officialPartOfSpeech": row["part_of_speech"],
                        "partOfSpeech": display_pos(row["part_of_speech"], number),
                        "meaning": meaning, "meaningSource": meaning_source,
                        "legacyId": chosen, "matchStatus": row["category"],
                        "meaningQaStatus": "needs-editorial-review", "audioQaStatus": "no-new-audio"})
    lineage = [entry["legacyId"] for entry in entries if entry["legacyId"]]
    if len(lineage) != len(set(lineage)):
        raise ValueError("Two new entries share a legacy ID")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"schemaVersion": 1, "status": "draft-not-for-publication",
                                  "sourceSha256": source["source_sha256"], "entries": entries},
                                 ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"entries": len(entries), "meaningSources": dict(Counter(
        entry["meaningSource"] for entry in entries)),
                      "missingGloss": sum(not entry["meaning"] for entry in entries),
                      "manualLineage": sum(entry["legacyId"] is None for entry in entries)},
                     ensure_ascii=False))


if __name__ == "__main__":
    main()
