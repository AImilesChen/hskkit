#!/usr/bin/env python3
"""Build a private, unpublished editorial draft for 2025 HSK 2 and 3."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PHRASE_NUMBERS = {313, 398, 454, 479, 541, 555, 556, 637, 964, 977}
POS_MAP = {"名": "N", "动": "V", "形": "Adj", "副": "Adv", "代": "Pron", "数": "Num",
           "量": "M", "介": "Prep", "连": "Conj", "助": "Aux", "叹": "Intj",
           "前缀": "Prefix", "后缀": "Suffix"}

# An old ID is retained only where its sense is a defensible lineage match.
# None intentionally avoids carrying learning progress across a different sense.
REVIEWED_LINEAGE = {
    311: None, 312: "hsk3.word.l2.0030.v1", 323: "hsk3.word.l1.0053.v1",
    327: "hsk3.word.l1.0056.v1", 336: "hsk3.word.l1.0076.v1",
    347: "hsk3.word.l1.0131.v1", 403: None, 471: "hsk3.word.l2.0649.v1",
    473: "hsk3.word.l1.0438.v1", 491: "hsk3.word.l3.0896.v1",
    506: "hsk3.word.l3.0006.v1", 535: None,
    538: "hsk3.word.l2.0031.v1", 539: "hsk3.word.l6.0058.v1",
    540: "hsk3.word.l1.0033.v1", 544: None, 595: None, 630: None,
    635: "hsk3.word.l2.0172.v1", 652: "hsk3.word.l1.0125.v1",
    670: None, 683: None, 700: None, 708: "hsk3.word.l2.0288.v1",
    735: "hsk3.word.l2.0324.v1", 745: "hsk3.word.l2.0339.v1",
    825: None, 843: None, 858: None, 875: "hsk3.word.l2.0570.v1",
    895: "hsk3.word.l2.0601.v1", 908: "hsk3.word.l1.0416.v1",
    922: "hsk3.word.l2.0647.v1", 923: "hsk3.word.l2.0648.v1",
    924: "hsk3.word.l1.0433.v1", 925: "hsk3.word.l1.0435.v1",
    932: "hsk3.word.l2.0660.v1", 933: "hsk3.word.l1.0436.v1",
    934: "hsk3.word.l2.0663.v1", 956: None,
    966: "hsk3.word.l1.0461.v1", 975: "hsk3.word.l2.0730.v1", 992: None,
    357: None, 358: "hsk3.word.l2.0232.v1",
}

NEW_EDITORIAL = {
    403: ("面", "suffix indicating a side or surface, as in 前面 (in front)"),
    535: ("冰激凌", "ice cream"),
    595: ("電子書", "e-book; electronic book"),
    670: ("紅綠燈", "traffic light"),
    700: ("檢票", "to check tickets"),
    825: ("勺子", "spoon"),
    843: ("數學", "mathematics; math"),
    956: ("員", "suffix for a person with a specified job or role"),
    992: ("子", "noun suffix, as in 桌子 (table)"),
}

GLOSS_OVERRIDES = {
    311: "don't; do not", 312: "not bad; quite good", 323: "time; occasion (classifier)",
    327: "to make; to play; to call (in common verb phrases)",
    336: "to order (food); to point to", 347: "to pass; to cross",
    357: "to spend (time or money)", 358: "flower; blossom",
    471: "a moment; a little while", 473: "together", 491: "just; exactly; in the middle of",
    506: "classifier for handled objects; marks the object before a verb",
    538: "not only", 539: "to disappear; to be missing", 540: "need not; no need to",
    544: "only then; just", 630: "classifier for letters; envelope",
    635: "should; ought to", 652: "to close; to turn off",
    683: "meeting; gathering", 708: "section; period (classifier)",
    735: "quarter of an hour", 745: "old; long-standing; prefix before a surname",
    858: "quite; rather", 875: "for; on behalf of",
    895: "to resemble; to be like", 908: "okay; all right; capable",
    922: "certain; definitely", 923: "altogether; in total",
    924: "together; in the same place", 925: "the same; alike",
    932: "ordinary; generally", 933: "while; at the same time",
    934: "always; continuously", 966: "to stand; to stop",
    975: "only; merely",
}


def display_pos(source: str, number: int) -> str:
    if not source:
        if number not in PHRASE_NUMBERS:
            raise ValueError(f"Unreviewed blank part of speech at {number}")
        return "Phrase"
    if "数量" in source:
        return "Num/M"
    matched = []
    for chinese, english in POS_MAP.items():
        if chinese in source and english not in matched:
            matched.append(english)
    if not matched:
        raise ValueError(f"Unmapped part of speech at {number}: {source}")
    return "/".join(matched)


def first_gloss(value: str) -> str:
    value = re.sub(r"\[[^\]]*\]", "", value)
    value = re.sub(r"\s+", " ", value).strip(" ;|")
    parts = [part.strip() for part in value.split(";") if part.strip()]
    # Legacy CC-CEDICT entries often include specialized, colloquial, or
    # unrelated senses. A single useful primary gloss is a safer default;
    # reviewed pedagogical overrides are applied below where it is wrong.
    return (parts[0] if parts else value)[:100].rstrip(" ;|")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--crosswalk", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    destination = args.output.resolve()
    if destination.is_relative_to(ROOT):
        raise ValueError("Complete official crosswalk and draft must stay outside public Git checkout")
    source = json.loads(args.crosswalk.read_text(encoding="utf-8"))
    editorial_overrides = {int(number): gloss for number, gloss in json.loads(
        (ROOT / "scripts/content/hsk23-2025-gloss-overrides.json").read_text(encoding="utf-8")
    ).items()}
    rows = source["rows"]
    if [row["number"] for row in rows] != list(range(301, 1001)):
        raise ValueError("Expected official rows 301–1000")
    unresolved = {row["number"] for row in rows if row["selected_old_id"] is None}
    if unresolved - set(REVIEWED_LINEAGE):
        raise ValueError(f"Manual lineage review missing: {sorted(unresolved - set(REVIEWED_LINEAGE))}")
    catalog = json.loads((ROOT / "src/lib/content/public-catalog-index.json").read_text(encoding="utf-8"))
    legacy = json.loads((ROOT / "src/lib/content/legacy-hsk1-words.json").read_text(encoding="utf-8"))
    by_id = {item[0]: item for item in catalog["words"] + legacy["words"]}
    entries = []
    for row in rows:
        number = row["number"]
        chosen = REVIEWED_LINEAGE.get(number, row["selected_old_id"])
        if chosen is not None and chosen not in row["candidate_old_ids"]:
            raise ValueError(f"Reviewed lineage is not a same-spelling candidate: {number}")
        old = by_id.get(chosen) if chosen else None
        if chosen and old is None:
            raise ValueError(f"Missing legacy entry: {chosen}")
        if old:
            traditional = old[5].split("|", 1)[0]
            meaning = first_gloss(old[7])
            meaning_source = "licensed-existing-catalog"
        else:
            if number in NEW_EDITORIAL:
                traditional, meaning = NEW_EDITORIAL[number]
            elif number in GLOSS_OVERRIDES:
                traditional = row["word"]
                meaning = GLOSS_OVERRIDES[number]
            else:
                raise ValueError(f"New sense lacks an editorial gloss: {number}")
            meaning_source = "independent-editorial-draft"
        if number in GLOSS_OVERRIDES:
            meaning = GLOSS_OVERRIDES[number]
            meaning_source = "independent-editorial-draft"
        if number in editorial_overrides:
            meaning = editorial_overrides[number]
            meaning_source = "independent-editorial-draft"
        entries.append({
            "id": f"hsk2025.word.l{row['level']}.{number:04d}.v1",
            "level": row["level"], "officialOrder": number,
            "hanzi": row["word"], "traditional": traditional,
            "pinyin": row["pinyin"], "partOfSpeech": display_pos(row["part_of_speech"], number),
            "officialPartOfSpeech": row["part_of_speech"], "meaning": meaning,
            "meaningSource": meaning_source, "legacyId": chosen,
            "matchStatus": row["category"],
            "meaningQaStatus": "needs-editorial-review", "audioQaStatus": "needs-editorial-review",
        })
    lineage = [entry["legacyId"] for entry in entries if entry["legacyId"]]
    if len(lineage) != len(set(lineage)):
        raise ValueError("Two new entries share a legacy ID")
    if len(entries) != 700 or len({entry["id"] for entry in entries}) != 700:
        raise ValueError("Draft count or IDs invalid")
    draft = {"schemaVersion": 1, "status": "draft-not-for-publication", "sourceUrl": "https://www.chinesetest.cn/HSK",
             "sourcePdfSha256": source["source_sha256"], "entries": entries}
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(draft, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"draftEntries": len(entries), "level2": 200, "level3": 500,
                      "lineageMapped": len(lineage), "publishableEntries": 0}, ensure_ascii=False))


if __name__ == "__main__":
    main()
