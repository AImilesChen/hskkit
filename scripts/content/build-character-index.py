#!/usr/bin/env python3
"""Build the learner-facing HSK character index from frozen, licensed sources."""
from __future__ import annotations

import gzip
import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "src/lib/content/catalog.json"
UNIHAN = ROOT / "content/sources/unihan-17.0-hsk-characters.json"
STRUCTURES = ROOT / "content/sources/makemeahanzi-618dbab8-hsk-structures.json"
CEDICT = ROOT / "content/sources/cc-cedict-e0d756cb.txt.gz"
OUTPUT = ROOT / "src/lib/dictionary/character-index.json"
EXPECTED_CHARACTER_COUNT = 3088
SOURCE_CHARACTER_COUNT = 3119  # Frozen source also contains characters retired from the active list.
EXPECTED_RELEASE_ID = "hsk3-hsk123456789-2025-v11"
HAN = re.compile(r"[\u3400-\u9fff]")
VARIANT = re.compile(r"U\+([0-9A-F]{4,6})")
RADICAL_STROKE = re.compile(r"^(\d+)'?\.(-?\d+)")
PINYIN_READING = re.compile(r"[a-züǖǘǚǜāáǎàēéěèīíǐìōóǒòūúǔù]+", re.IGNORECASE)


def active_words(repository: dict) -> tuple[str, list[dict]]:
    release_id = repository["activeReleaseByStandard"]["hsk3"]
    release = next(item for item in repository["releases"] if item["id"] == release_id)
    active_ids = set(release["contentAssetIds"])
    words = [
        asset for asset in repository["contentAssets"]
        if asset["id"] in active_ids
        and asset["kind"] == "word"
        and asset.get("qa_status") == "approved"
        and asset.get("publish_status") == "published"
        and asset.get("authorization", {}).get("status") == "authorized"
    ]
    return release_id, words


def cedict_single_characters() -> dict[str, dict[str, object]]:
    result: dict[str, dict[str, object]] = {}
    with gzip.open(CEDICT, "rt", encoding="utf-8") as source:
        for line in source:
            if not line or line.startswith("#"):
                continue
            match = re.match(r"(\S+) (\S+) \[([^]]+)] /(.+)/$", line.rstrip())
            if not match:
                continue
            traditional, simplified, pinyin, definitions = match.groups()
            if len(simplified) != 1 or not HAN.fullmatch(simplified):
                continue
            meanings = [value.strip() for value in definitions.split("/") if value.strip() and not value.startswith("variant of ")]
            if meanings and simplified not in result:
                result[simplified] = {
                    "traditional": traditional,
                    "pinyin": pinyin,
                    "meanings": meanings,
                }
    return result


def first_variant(value: str, hanzi: str) -> str | None:
    for codepoint in VARIANT.findall(value):
        candidate = chr(int(codepoint, 16))
        if candidate != hanzi:
            return candidate
    return None


def split_pinyin_readings(value: str) -> list[str]:
    """Return only standalone learner-facing syllables from source variants."""
    readings: list[str] = []
    for raw in re.split(r"[\s/|]+", value.strip().lower()):
        cleaned = raw.strip("()[]{}….,;:!?")
        if cleaned and PINYIN_READING.fullmatch(cleaned) and cleaned not in readings:
            readings.append(cleaned)
    return readings


def kangxi_radical_strokes(number: int) -> int:
    """Return the canonical Kangxi radical stroke group for radical 1–214."""
    upper_bounds = (6, 29, 60, 94, 117, 146, 166, 175, 186, 194, 200, 204, 208, 210, 211, 213, 214)
    for strokes, upper_bound in enumerate(upper_bounds, start=1):
        if number <= upper_bound:
            return strokes
    raise ValueError(f"Invalid Kangxi radical number: {number}")


def classify_structure(decomposition: str) -> str:
    """Map the root Unicode IDS operator to a stable learner-facing structure."""
    if decomposition == "？":
        return "unknown"
    if decomposition.startswith("⿰"):
        return "left-right"
    if decomposition.startswith("⿱"):
        return "top-bottom"
    if decomposition.startswith(("⿲", "⿳")):
        return "three-part"
    if decomposition.startswith(("⿴", "⿵", "⿶", "⿷", "⿸", "⿹", "⿺")):
        return "enclosure"
    if decomposition.startswith("⿻"):
        return "overlaid"
    return "single-component"


def main() -> None:
    repository = json.loads(CATALOG.read_text(encoding="utf-8"))
    unihan = json.loads(UNIHAN.read_text(encoding="utf-8"))
    structures = json.loads(STRUCTURES.read_text(encoding="utf-8"))
    release_id, words = active_words(repository)
    if release_id != EXPECTED_RELEASE_ID:
        raise SystemExit(f"Unapproved active release drift: {release_id}")

    source_records = unihan.get("records", [])
    structure_records = structures.get("records", [])
    source_by_hanzi = {item["hanzi"]: item for item in source_records}
    structure_by_hanzi = {item["hanzi"]: item for item in structure_records}
    expected_hanzi = sorted({character for word in words for character in str(word["payload"].get("hanzi", "")) if HAN.fullmatch(character)})
    if len(source_records) != len(source_by_hanzi) or len(source_records) != SOURCE_CHARACTER_COUNT or len(expected_hanzi) != EXPECTED_CHARACTER_COUNT or not set(expected_hanzi).issubset(source_by_hanzi):
        raise SystemExit(
            f"Unapproved HSK character count drift: catalog={len(expected_hanzi)}, source={len(source_by_hanzi)}, expected={EXPECTED_CHARACTER_COUNT}"
        )
    if (
        structures.get("characterCount") != SOURCE_CHARACTER_COUNT
        or len(structure_records) != SOURCE_CHARACTER_COUNT
        or len(structure_records) != len(structure_by_hanzi)
        or not set(expected_hanzi).issubset(structure_by_hanzi)
    ):
        raise SystemExit(
            f"Unapproved HSK structure coverage drift: source={len(structure_by_hanzi)}, expected={EXPECTED_CHARACTER_COUNT}"
        )

    levels_by_hanzi: dict[str, set[int]] = defaultdict(set)
    word_count_by_hanzi: dict[str, int] = defaultdict(int)
    readings_by_hanzi: dict[str, set[str]] = defaultdict(set)
    for word in words:
        hanzi = [character for character in str(word["payload"].get("hanzi", "")) if HAN.fullmatch(character)]
        level = int(word["level"])
        visible_levels = {7, 8, 9} if level >= 7 else {level}
        for character in set(hanzi):
            levels_by_hanzi[character].update(visible_levels)
            word_count_by_hanzi[character] += 1
        syllables = [value for value in re.split(r"\s+", str(word["payload"].get("pinyin", "")).strip()) if value]
        if len(syllables) == len(hanzi):
            for character, syllable in zip(hanzi, syllables):
                readings_by_hanzi[character].update(split_pinyin_readings(syllable))

    cedict = cedict_single_characters()
    characters = []
    for hanzi in expected_hanzi:
        source = source_by_hanzi[hanzi]
        structure_source = structure_by_hanzi[hanzi]
        decomposition = str(structure_source.get("decomposition", "")).strip()
        if not decomposition:
            raise SystemExit(f"Missing licensed structure decomposition for {hanzi}")
        radical_match = RADICAL_STROKE.match(str(source["kRSUnicode"]).split()[0])
        if not radical_match:
            raise SystemExit(f"Missing radical/stroke data for {hanzi}")
        radical_number = int(radical_match.group(1))
        radical = unicodedata.normalize("NFKC", chr(0x2F00 + radical_number - 1))
        strokes_match = re.search(r"\d+", str(source["kTotalStrokes"]))
        if not strokes_match:
            raise SystemExit(f"Missing total strokes for {hanzi}")
        primary_readings = split_pinyin_readings(str(source.get("kMandarin") or cedict.get(hanzi, {}).get("pinyin") or ""))
        pinyin = list(dict.fromkeys(primary_readings))
        pinyin.extend(sorted(readings_by_hanzi[hanzi] - set(pinyin)))
        if not pinyin:
            raise SystemExit(f"Missing Mandarin reading for {hanzi}")
        definition = str(source.get("kDefinition") or "").strip()
        fallback_meanings = cedict.get(hanzi, {}).get("meanings", [])
        meanings = [definition] if definition else [str(item) for item in fallback_meanings][:3] if isinstance(fallback_meanings, list) else []
        if not meanings:
            raise SystemExit(f"Missing licensed definition for {hanzi}")
        traditional = first_variant(str(source.get("kTraditionalVariant", "")), hanzi)
        simplified = first_variant(str(source.get("kSimplifiedVariant", "")), hanzi)
        characters.append({
            "hanzi": hanzi,
            "pinyin": pinyin,
            "meanings": meanings,
            "radical": radical,
            "radicalNumber": radical_number,
            "residualStrokes": int(radical_match.group(2)),
            "strokes": int(strokes_match.group()),
            "structure": classify_structure(decomposition),
            "decomposition": decomposition,
            "decompositionStatus": "unknown" if decomposition == "？" else "partial" if "？" in decomposition else "complete",
            "structureSourceId": f"makemeahanzi:{structures['provenance']['commit']}:{ord(hanzi):04X}",
            "levels": sorted(levels_by_hanzi[hanzi]),
            "firstLevel": min(levels_by_hanzi[hanzi]),
            "wordCount": word_count_by_hanzi[hanzi],
            **({"traditional": traditional} if traditional else {}),
            **({"simplified": simplified} if simplified else {}),
        })

    radical_counts: dict[int, int] = defaultdict(int)
    stroke_counts: dict[int, int] = defaultdict(int)
    structure_counts: dict[str, int] = defaultdict(int)
    for character in characters:
        radical_counts[int(character["radicalNumber"])] += 1
        stroke_counts[int(character["strokes"])] += 1
        structure_counts[str(character["structure"])] += 1

    radical_directory = []
    for number in range(1, 215):
        symbol = chr(0x2F00 + number - 1)
        radical_directory.append({
            "number": number,
            "radical": unicodedata.normalize("NFKC", symbol),
            "name": unicodedata.name(symbol).removeprefix("KANGXI RADICAL ").lower().replace("-", " "),
            "strokes": kangxi_radical_strokes(number),
            "characterCount": radical_counts[number],
        })

    payload = {
        "releaseId": release_id,
        "characterCount": len(characters),
        "source": {
            "name": "Unicode Unihan 17.0.0",
            "license": "Unicode License v3",
            "archiveSha256": unihan["provenance"]["archiveSha256"],
            "catalogFallback": "CC-CEDICT · CC BY-SA 4.0",
            "structure": {
                "name": structures["provenance"]["name"],
                "repository": structures["provenance"]["repository"],
                "commit": structures["provenance"]["commit"],
                "sourceSha256": structures["provenance"]["sourceSha256"],
                "license": structures["provenance"]["license"],
                "licenseFile": structures["provenance"]["licenseFile"],
            },
            "radicalDirectory": {
                "characterNames": f"Python unicodedata UCD {unicodedata.unidata_version}; KANGXI RADICAL names normalized to lowercase learner labels",
                "strokeGrouping": "Unicode Kangxi Radicals chart canonical 1–17 stroke boundary table",
            },
        },
        "radicalDirectory": radical_directory,
        "strokeDirectory": [
            {"strokes": strokes, "characterCount": count}
            for strokes, count in sorted(stroke_counts.items())
        ],
        "structureDirectory": [
            {"structure": structure, "characterCount": count}
            for structure, count in sorted(structure_counts.items())
        ],
        "characters": characters,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(OUTPUT), "releaseId": release_id, "characters": len(characters)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
