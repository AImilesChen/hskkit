#!/usr/bin/env python3
"""Build an unpublished HSK 1 editorial draft from a local audited crosswalk.

The output contains the complete 300-row draft and must stay outside the Git
checkout. No entry is marked publishable by this script.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


# New words use short, independently edited learner glosses. The source PDF
# supplies level/word/pinyin facts but no English translation. These glosses
# still require human content review before any publication.
NEW_WORD_EDITORIAL = {
    31: ("第", "ordinal prefix, as in 第一 (first)"),
    121: ("沒事", "it's okay; no problem"),
    124: ("們", "plural suffix for pronouns and words for people"),
    132: ("哪個", "which one"),
    138: ("那個", "that one"),
    147: ("你好", "hello"),
    214: ("玩", "to play; to have fun"),
    259: ("一下", "briefly; a little, after a verb"),
    265: ("有點兒", "a little; somewhat"),
    266: ("有些", "some; somewhat"),
    281: ("這個", "this one"),
}

# The old dictionary has extra senses and cross references that distract a
# beginner. Keep these learner glosses short and review them with context.
GLOSS_OVERRIDES = {
    1: "to love; to like", 3: "father; dad", 4: "particle for suggestion or request", 6: "one hundred", 7: "half",
    10: "classifier for books and similar items", 13: "not",
    14: "you're welcome; don't mention it", 15: "don't; do not",
    16: "vegetable; dish (of food)", 18: "to sing", 19: "supermarket",
    20: "car; vehicle", 21: "to eat", 22: "taxi", 23: "to wear (clothes)",
    25: "big; large",
    26: "everyone", 29: "to arrive; to reach", 30: "possessive or descriptive particle",
    33: "o'clock; point", 34: "shop; store", 40: "thing; stuff",
    41: "all; both", 42: "to read", 43: "to read; to study",
    44: "correct; toward; to", 45: "sorry; excuse me",
    46: "many; much", 47: "how many; how much", 49: "two", 50: "cooked rice; meal",
    53: "very", 55: "minute; cent; to divide", 58: "song",
    60: "general classifier", 61: "to give; for", 63: "to work; work; job",
    65: "expensive", 66: "country", 67: "still; also", 71: "good",
    73: "good-looking; interesting to watch or read",
    75: "fun; enjoyable", 76: "number; day of the month", 77: "to drink",
    78: "and; with", 79: "very", 80: "behind; after",
    81: "to return; to go back", 82: "can; to know how to",
    85: "how many; several",
    86: "home; family; classifier for businesses", 87: "family member",
    88: "to see; to meet",
    89: "classifier for clothes and other items", 91: "to be called; to call",
    94: "today", 96: "to think; to feel", 97: "to open; to turn on", 98: "to drive a car",
    99: "to look at; to see; to read; to watch",
    100: "to see a doctor", 102: "can; may", 104: "mouth; classifier for people",
    105: "piece; yuan (colloquial)", 106: "to come",
    108: "particle marking completion or a change of state",
    110: "inside; in", 111: "two", 112: "zero", 114: "mother; mom", 117: "to sell", 118: "busy",
    119: "cat", 122: "to not have; there is not", 123: "younger sister",
    127: "noodles", 130: "name", 131: "which", 133: "where",
    134: "where", 135: "which ones", 136: "that", 142: "male",
    144: "sentence-final particle used in questions; what about...?",
    146: "you (informal)",
    150: "you (polite)",
    157: "cheap; inexpensive", 163: "in front; before", 164: "money",
    167: "to go", 169: "hot", 172: "day (of the month)",
    175: "on; above; to go up", 177: "to attend class",
    180: "few; little", 181: "who", 185: "time; moment",
    186: "time", 188: "to be", 190: "book", 192: "water",
    196: "to say; to speak; to talk", 199: "years old (age unit)",
    200: "he; him", 206: "too; very",
    207: "day; sky", 209: "to listen; to hear", 211: "classmate",
    212: "outside", 215: "late; evening", 218: "hello; hey, to get someone's attention",
    221: "I; me", 222: "we; us", 226: "below; next; to go down",
    228: "to finish work", 229: "class is over", 231: "Mr.; sir",
    233: "to want; to think", 235: "child; kid",
    238: "primary school student", 239: "some; a few",
    241: "thank you", 242: "new", 243: "week", 251: "snow",
    252: "to want; to need", 253: "also; too", 254: "one",
    258: "half", 261: "a little; a bit", 262: "some; a few",
    263: "to have; there is", 268: "yuan (currency unit)",
    269: "month; moon", 270: "again", 271: "to be at; in; doing now",
    272: "goodbye", 273: "early; morning", 276: "how",
    277: "how; what ... like", 278: "to look for", 279: "this",
    285: "really", 286: "to be doing (something) now",
    287: "classifier for animals or one of a pair", 288: "to know",
    294: "to live; to stay", 296: "Chinese character",
    298: "to sit; to take (a bus or train)", 299: "to do; to make",
}

PHRASE_WORD_NUMBERS = {14, 24, 120, 147, 227, 300}
POS_MAP = {
    "名": "N", "动": "V", "形": "Adj", "副": "Adv",
    "代": "Pron", "数": "Num", "量": "M", "介": "Prep",
    "连": "Conj", "助": "Aux", "叹": "Intj",
    "前缀": "Prefix", "后缀": "Suffix",
}


def display_pos(official_pos: str, number: int) -> str:
    if not official_pos:
        if number not in PHRASE_WORD_NUMBERS:
            raise ValueError(f"Unreviewed blank official POS at row {number}")
        return "Phrase"
    if "数量" in official_pos:
        return "Num/M"
    mapped = []
    for chinese, english in POS_MAP.items():
        if chinese in official_pos and english not in mapped:
            mapped.append(english)
    if not mapped:
        raise ValueError(f"Unmapped official POS {official_pos!r} at row {number}")
    return "/".join(mapped)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--crosswalk", required=True, type=Path)
    parser.add_argument("--catalog", type=Path, default=Path("src/lib/content/public-catalog-index.json"))
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    output = args.output.resolve()
    if output.is_relative_to(repo_root):
        raise ValueError("The complete editorial draft must be written outside the public Git checkout")

    audited = json.loads(args.crosswalk.read_text(encoding="utf-8"))
    source_rows = audited["rows"]
    if [row["number"] for row in source_rows] != list(range(1, 301)):
        raise ValueError("Crosswalk must contain official HSK 1 rows 1–300 in order")
    if {row["number"] for row in source_rows if not row["part_of_speech"]} != PHRASE_WORD_NUMBERS:
        raise ValueError("Official rows without a POS changed; review the phrase labels")
    if not set(GLOSS_OVERRIDES).issubset({row["number"] for row in source_rows}):
        raise ValueError("A glossary override refers to a missing official row")

    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    old_by_id = {row[0]: row for row in catalog["words"]}
    entries = []
    new_numbers = set()
    for row in source_rows:
        number = row["number"]
        old_id = row["selected_old_id"]
        if old_id:
            old = old_by_id.get(old_id)
            if old is None:
                raise ValueError(f"Missing legacy word {old_id}")
            # Legacy dictionary records may list multiple traditional
            # alternatives separated by a pipe. Display one actual form.
            traditional = old[5].split("|", 1)[0]
            meaning = old[7]
            meaning_source = "existing-hskkit-catalog"
        else:
            if row["status"] != "new_word" or number not in NEW_WORD_EDITORIAL:
                raise ValueError(f"Unreviewed new word at official row {number}")
            traditional, meaning = NEW_WORD_EDITORIAL[number]
            meaning_source = "independent-editorial-draft"
            new_numbers.add(number)

        if number in GLOSS_OVERRIDES:
            meaning = GLOSS_OVERRIDES[number]
            meaning_source = "independent-editorial-draft"

        entries.append(
            {
                "id": f"hsk2025.word.l1.{number:04d}.v1",
                "level": 1,
                "officialOrder": number,
                "hanzi": row["word"],
                "traditional": traditional,
                "pinyin": row["pinyin"],
                "partOfSpeech": display_pos(row["part_of_speech"], number),
                "officialPartOfSpeech": row["part_of_speech"],
                "partOfSpeechSource": "official-syllabus" if row["part_of_speech"] else "independent-editorial",
                "meaning": meaning,
                "meaningSource": meaning_source,
                "legacyId": old_id,
                "matchStatus": row["status"],
                "meaningQaStatus": "needs-editorial-review",
                "audioQaStatus": "needs-editorial-review",
            }
        )

    if new_numbers != set(NEW_WORD_EDITORIAL):
        raise ValueError(f"New word editorial set mismatch: {sorted(new_numbers ^ set(NEW_WORD_EDITORIAL))}")
    if len({entry["id"] for entry in entries}) != 300:
        raise ValueError("Generated IDs are not unique")

    draft = {
        "schemaVersion": 1,
        "status": "draft-not-for-publication",
        "sourceUrl": "https://www.chinesetest.cn/HSK",
        "sourcePdfSha256": audited["source_sha256"],
        "entries": entries,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(draft, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "draftEntries": len(entries), "newEntries": len(new_numbers), "publishableEntries": 0}, ensure_ascii=False))


if __name__ == "__main__":
    main()
