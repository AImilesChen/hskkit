#!/usr/bin/env python3
"""Build a private HSK 5 editorial draft; this output is not publishable."""

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
           "前缀": "Prefix", "后缀": "Suffix"}
# Rows with no POS in the syllabus are checked separately; do not silently infer them.
POS_OVERRIDES = {
    2200: "Adv", 2358: "Adj", 2399: "Phrase", 2617: "Adv",
    2880: "N", 3087: "N", 3214: "Adj", 3358: "Phrase",
    3402: "Adv", 3409: "Adj", 3430: "Adj", 3521: "N",
}
# Tone sandhi is represented differently in the old catalog. Preserve only
# same-level, same-spelling lineage; other ambiguous senses remain separate.
REVIEWED_LINEAGE = {
    2073: "hsk3.word.l5.0052.v1", 2074: "hsk3.word.l5.0054.v1",
    3354: "hsk3.word.l5.0890.v1", 3357: "hsk3.word.l5.0892.v1",
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
        raise ValueError("Complete HSK 5 draft must stay outside the public checkout")
    source = json.loads(args.crosswalk.read_text(encoding="utf-8"))
    if [row["number"] for row in source["rows"]] != list(range(2001, 3601)):
        raise ValueError("Expected the exact 1,600 official HSK 5 rows")
    catalog = json.loads((ROOT / "src/lib/content/public-catalog-index.json").read_text(encoding="utf-8"))
    legacy23 = json.loads((ROOT / "src/lib/content/legacy-hsk23-words.json").read_text(encoding="utf-8"))
    legacy4 = json.loads((ROOT / "src/lib/content/legacy-hsk4-words.json").read_text(encoding="utf-8"))
    by_id = {entry[0]: entry for entry in catalog["words"] + legacy23["words"] + legacy4["words"]}
    dictionary = dictionary_entries()
    overrides_path = ROOT / "scripts/content/hsk5-2025-gloss-overrides.json"
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
        entries.append({"id": f"hsk2025.word.l5.{number:04d}.v1", "level": 5,
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
