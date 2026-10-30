#!/usr/bin/env python3
"""Build a private HSK 7–9 editorial draft; never publish this output directly."""

from __future__ import annotations

import argparse
import gzip
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
POS_MAP = {"名": "N", "动": "V", "形": "Adj", "副": "Adv", "代": "Pron", "数": "Num",
           "量": "M", "介": "Prep", "连": "Conj", "助": "Aux", "叹": "Intj",
           "前缀": "Prefix", "后缀": "Suffix", "拟声": "Onomatopoeia"}
REVIEWED_LINEAGE = {
    5894: "hsk3.word.l7.0449.v1", 6569: None,
    8119: "hsk3.word.l7.2762.v1", 8120: "hsk3.word.l7.2761.v1",
    8126: "hsk3.word.l7.2774.v1", 8127: "hsk3.word.l7.2773.v1",
    8670: "hsk3.word.l7.3303.v1", 10523: "hsk3.word.l7.5217.v1",
    10674: "hsk3.word.l7.5339.v1", 10731: None, 10913: None,
}
DIFFERENT_SENSE_VARIANTS = {7058, 7667, 8659}


def dictionary_entries() -> dict[str, list[tuple[str, str, str]]]:
    result: dict[str, list[tuple[str, str, str]]] = {}
    with gzip.open(ROOT / "content/sources/cc-cedict-e0d756cb.txt.gz", "rt", encoding="utf-8") as source:
        for line in source:
            if line.startswith("#"):
                continue
            match = re.match(r"^(\S+) (\S+) \[([^]]+)\] /([^/]+)/", line)
            if match:
                traditional, simplified, pinyin, gloss = match.groups()
                result.setdefault(simplified, []).append((traditional, pinyin, gloss))
    return result


def normalized_pinyin(value: str) -> str:
    value = value.lower().replace("u:", "v")
    value = value.translate(str.maketrans("üǖǘǚǜ", "vvvvv"))
    value = unicodedata.normalize("NFD", value)
    value = "".join(char for char in value if not unicodedata.combining(char))
    return "".join(char for char in value if char.isalpha())


def short_gloss(value: str) -> str:
    value = re.sub(r"\[[^]]*\]", "", value)
    value = re.sub(r"\s+", " ", value).strip(" ;|")
    return next((part.strip() for part in value.split(";") if part.strip()), "")[:100].rstrip(" ;|")


def display_pos(value: str, old: list | None) -> str:
    found = []
    for chinese, english in POS_MAP.items():
        if chinese in value and english not in found:
            found.append(english)
    if found:
        return "/".join(found)
    if old and old[8] and old[8] not in {"REVIEW", "unspecified"}:
        return old[8]
    return "Phrase" if value == "" else "REVIEW"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--crosswalk", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    if output.is_relative_to(ROOT):
        raise ValueError("Complete advanced draft must stay outside the public checkout")
    source = json.loads(args.crosswalk.read_text(encoding="utf-8"))
    if [row["number"] for row in source["rows"]] != list(range(5401, 11001)):
        raise ValueError("Expected the exact 5,600 official advanced rows")
    datasets = [json.loads((ROOT / "src/lib/content" / name).read_text(encoding="utf-8"))
                for name in ("public-catalog-index.json", "legacy-hsk23-words.json",
                             "legacy-hsk4-words.json", "legacy-hsk5-words.json",
                             "legacy-hsk6-words.json")]
    by_id = {entry[0]: entry for dataset in datasets for entry in dataset["words"]}
    dictionary = dictionary_entries()
    overrides = {}
    for filename in ("hsk789-2025-gloss-overrides.json", "hsk789-2025-gloss-overrides-extra.json"):
        for number, gloss in json.loads((ROOT / "scripts/content" / filename).read_text(encoding="utf-8")).items():
            if int(number) in overrides:
                raise ValueError(f"Duplicate glossary override: {number}")
            overrides[int(number)] = gloss
    entries = []
    for row in source["rows"]:
        number = row["number"]
        chosen = REVIEWED_LINEAGE.get(number, row["selected_old_id"])
        if chosen is None and row["category"] == "same_level_variant_or_sense" and number not in DIFFERENT_SENSE_VARIANTS:
            advanced_candidates = [asset_id for asset_id in row["candidate_old_ids"]
                                   if by_id[asset_id][3] == "7-9"]
            if len(advanced_candidates) == 1:
                chosen = advanced_candidates[0]
        if chosen and chosen not in row["candidate_old_ids"]:
            raise ValueError(f"Lineage is not a same-spelling candidate: {number}")
        old = by_id.get(chosen) if chosen else None
        # Reuse a former advanced ID only when its spelling and pronunciation
        # are unambiguous. Lower-level IDs remain owned by their own records.
        legacy_id = chosen if old and old[3] == "7-9" else None
        if not old and len(row["candidate_exact_ids"]) == 1:
            old = by_id[row["candidate_exact_ids"][0]]
        if not old and len(row["candidate_old_ids"]) == 1:
            old = by_id[row["candidate_old_ids"][0]]
        dictionary_candidates = dictionary.get(row["word"], [])
        pinyin_matches = [candidate for candidate in dictionary_candidates
                          if normalized_pinyin(candidate[1]) == normalized_pinyin(row["pinyin"])]
        dictionary_candidate = (pinyin_matches or dictionary_candidates)[:1]
        if old:
            traditional = old[5].split("|", 1)[0]
            # Existing approved entries retain their complete learner glosses;
            # reducing them to the first sense would make the new pack poorer.
            meaning = old[7].strip()
            meaning_source = "existing-catalog"
        elif dictionary_candidate:
            traditional = dictionary_candidate[0][0]
            meaning = short_gloss(dictionary_candidate[0][2])
            meaning_source = "dictionary-draft" if pinyin_matches else "dictionary-pinyin-unmatched"
        else:
            traditional = row["word"]
            meaning = ""
            meaning_source = "needs-independent-editorial"
        if number in overrides:
            meaning = overrides[number]
            meaning_source = "independent-editorial-draft"
        entries.append({
            "id": f"hsk2025.word.l7.{number:05d}.v1", "level": 7,
            "officialOrder": number, "hanzi": row["word"],
            "traditional": traditional, "pinyin": row["pinyin"],
            "officialPartOfSpeech": row["part_of_speech"],
            "partOfSpeech": display_pos(row["part_of_speech"], old),
            "meaning": meaning, "meaningSource": meaning_source,
            "legacyId": legacy_id, "matchStatus": row["category"],
            "meaningQaStatus": "needs-editorial-review",
            "traditionalQaStatus": "needs-editorial-review",
            "audioQaStatus": "no-new-audio",
        })
    lineage = [entry["legacyId"] for entry in entries if entry["legacyId"]]
    duplicates = {item: count for item, count in Counter(lineage).items() if count > 1}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"schemaVersion": 1, "status": "draft-not-for-publication",
                                  "sourceSha256": source["source_sha256"],
                                  "duplicateLegacyIds": duplicates, "entries": entries},
                                 ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"entries": len(entries),
                      "meaningSources": dict(Counter(entry["meaningSource"] for entry in entries)),
                      "missingGloss": sum(not entry["meaning"] for entry in entries),
                      "manualLineage": sum(entry["legacyId"] is None for entry in entries),
                      "duplicateLegacyIds": duplicates,
                      "posReview": sum(entry["partOfSpeech"] == "REVIEW" for entry in entries)},
                     ensure_ascii=False))


if __name__ == "__main__":
    main()
