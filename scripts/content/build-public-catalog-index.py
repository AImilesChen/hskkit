#!/usr/bin/env python3
"""Generate the compact static public HSK 3.0 word index used by Worker routes.

The source catalog remains the content truth. This artifact contains only approved,
published fields required for public search/detail pages and normalized lookup keys.
"""
from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path


def normalize(value: object) -> str:
    text = unicodedata.normalize("NFD", str(value or "")).lower()
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    return re.sub(r"[\s'’\-]+", "", text)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", default="src/lib/content/catalog.json")
    parser.add_argument("--output", default="src/lib/content/public-catalog-index.json")
    args = parser.parse_args()

    repository = json.loads(Path(args.catalog).read_text(encoding="utf-8"))
    release_id = repository["activeReleaseByStandard"]["hsk3"]
    release = next(item for item in repository["releases"] if item["id"] == release_id)
    active_ids = set(release["contentAssetIds"])
    rows = []
    for asset in repository["contentAssets"]:
        if not (
            asset["id"] in active_ids
            and asset["kind"] == "word"
            and asset["standard"] == "hsk3"
            and asset["authorization"]["status"] == "authorized"
            and asset["qaStatus"] == "approved"
            and asset.get("publish_status") == "published"
        ):
            continue
        payload = asset["payload"]
        hanzi = str(payload.get("hanzi", ""))
        traditional = str(payload.get("traditional", ""))
        pinyin = str(payload.get("pinyin", ""))
        meaning = str(payload.get("meaning", ""))
        part_of_speech = str(payload.get("partOfSpeech", "unspecified"))
        level_band = str(asset.get("level_band") or ("7-9" if int(asset["level"]) >= 7 else asset["level"]))
        rows.append([
            asset["id"],
            asset.get("standard_version", "GF0025-2021"),
            asset.get("content_version", ""),
            level_band,
            hanzi,
            traditional,
            pinyin,
            meaning,
            part_of_speech,
            normalize(hanzi + traditional),
            normalize(pinyin),
            normalize(meaning),
        ])

    rows.sort(key=lambda row: ((7 if row[3] == "7-9" else int(row[3])), row[0]))

    def append_index(index: dict[str, list[int]], key: str, position: int) -> None:
        if key:
            index.setdefault(key, []).append(position)

    level_positions: dict[str, list[int]] = {}
    search_indexes: dict[str, dict[str, list[int]]] = {
        "hanzi": {},
        "pinyin": {},
        "english": {},
    }
    character_associations: dict[str, list[int]] = {}

    for position, row in enumerate(rows):
        level_band = row[3]
        append_index(level_positions, level_band, position)

        for field, value in (("hanzi", row[9]), ("pinyin", row[10]), ("english", row[11])):
            for character in sorted(set(value)):
                append_index(search_indexes[field], character, position)

        for character in sorted(set(row[4])):
            append_index(character_associations, character, position)

    level_shards = {
        level: [positions[0], len(positions)]
        for level, positions in level_positions.items()
    }
    artifact = {
        "indexVersion": 1,
        "releaseId": release_id,
        "releaseVersion": int(release["version"]),
        "publishedAt": release["publishedAt"],
        "wordCount": len(rows),
        "words": rows,
        "levelShards": level_shards,
        "searchIndexes": search_indexes,
        "characterAssociations": character_associations,
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(artifact, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "releaseId": release_id, "indexedWords": len(rows)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
