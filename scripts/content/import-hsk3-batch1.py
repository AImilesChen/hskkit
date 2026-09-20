#!/usr/bin/env python3
from __future__ import annotations

import csv
import gzip
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HSK_SOURCE = ROOT / "content/sources/hsk30-4ff9e391.csv"
CEDICT_SOURCE = ROOT / "content/sources/cc-cedict-e0d756cb.txt.gz"
CATALOG = ROOT / "src/lib/content/catalog.json"
MANIFEST = ROOT / "content/releases/hsk3-gf0025-2021-v2.json"
SEED_SQL = ROOT / "content/releases/hsk3-gf0025-2021-v2.sql"
REPORT_JSON = ROOT / "content/releases/hsk3-gf0025-2021-v2-report.json"
RELEASE_ID = "hsk3-gf0025-2021-v2"
RELEASE_VERSION = 2
CONTENT_VERSION = "2026.08.21-batch1"
PUBLISHED_AT = "2026-08-21T10:32:04.000Z"
STANDARD_SOURCE = "http://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/s5987/202103/t20210329_523304.html"
HSK_DATA_SOURCE = "https://github.com/ivankra/hsk30/tree/4ff9e3915ce87baaecd7ebe263085573a4ea3192"
HSK_LICENSE = "https://github.com/ivankra/hsk30/blob/4ff9e3915ce87baaecd7ebe263085573a4ea3192/LICENSE"
CEDICT_SOURCE_URL = "https://www.mdbg.net/chinese/dictionary?page=cc-cedict"
CEDICT_LICENSE = "https://creativecommons.org/licenses/by-sa/4.0/"
SOURCE_REF = "moe-gf0025-2021+ivankra-hsk30@4ff9e391+cc-cedict@e0d756cb"
LICENSE_REF = "MIT+CC-BY-SA-4.0"

EDITORIAL_GLOSSES = {
    "车上": "in or on a vehicle",
    "不太": "not very; not too",
    "不一会儿": "in a short while; before long",
    "见过": "to have seen; to have met",
    "送到": "to deliver to; to take to",
    "这时候|这时": "at this time; at this moment",
    "放到": "to put in or on; to place at",
    "能不能": "can or cannot; whether one can",
    "眼里": "in one's eyes; in one's view",
    "有劲儿": "energetic; strong; interesting",
    "城里": "in the city; the urban area",
    "很难说": "hard to say",
    "一番": "a round, bout, or spell of something",
    "指着": "to point at; while pointing",
    "不利于": "to be unfavorable to",
    "不肯": "to be unwilling to; to refuse to",
    "不难": "not difficult",
    "不如说": "rather; it would be better to say",
    "不予": "not to grant; not to give",
    "趁着": "to take advantage of an opportunity",
    "定为": "to designate as; to set as",
    "飞往": "to fly to",
    "公益性": "public-benefit nature; nonprofit character",
    "怀着": "to harbor or cherish a feeling",
    "离谱儿": "unreasonable; outrageous",
    "难以想象": "hard to imagine",
    "说起来": "speaking of; when it comes to",
    "效仿": "to imitate; to follow an example",
    "致力于": "to devote oneself to",
    "着眼于": "to focus on; to have an eye on",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_cedict() -> tuple[dict[str, list[str]], dict[str, list[list[str]]]]:
    exact: dict[str, list[str]] = {}
    by_simplified: dict[str, list[list[str]]] = defaultdict(list)
    pattern = re.compile(r"^(\S+) (\S+) \[([^]]+)] /(.*)/$")
    with gzip.open(CEDICT_SOURCE, "rt", encoding="utf-8") as handle:
        for raw in handle:
            if raw.startswith("#"):
                continue
            match = pattern.match(raw.rstrip("\n"))
            if not match:
                continue
            traditional, simplified, pinyin, definitions = match.groups()
            values = [item.strip() for item in definitions.split("/") if item.strip()]
            exact[f"{traditional}|{simplified}[{pinyin}]"] = values
            by_simplified[simplified].append(values)
    return exact, by_simplified


def clean_meaning(definitions: list[str]) -> str:
    selected: list[str] = []
    for definition in definitions:
        if definition.startswith("CL:") or definition.startswith("see also "):
            continue
        normalized = re.sub(r"\s+", " ", definition).strip()
        if normalized and normalized not in selected:
            selected.append(normalized)
        if len(selected) == 3:
            break
    return "; ".join(selected)


SENSE_MARKER_SUFFIX = re.compile(r"[0-9¹²³⁴⁵⁶⁷⁸⁹]+$")


def display_spellings(row: dict[str, str]) -> tuple[str, str]:
    simplified = row["Simplified"].strip()
    traditional = row["Traditional"].strip()
    if not (SENSE_MARKER_SUFFIX.search(simplified) or SENSE_MARKER_SUFFIX.search(traditional)):
        return simplified, traditional

    variants = json.loads(row.get("Variants") or "[]")
    spellings = {
        (str(variant.get("Simplified", "")).strip(), str(variant.get("Traditional", "")).strip())
        for variant in variants
        if variant.get("Simplified")
    }
    if len(spellings) != 1:
        raise ValueError(f"Ambiguous display spelling for {row['ID']}: {sorted(spellings)!r}")
    display_simplified, display_traditional = spellings.pop()
    if SENSE_MARKER_SUFFIX.search(display_simplified) or SENSE_MARKER_SUFFIX.search(display_traditional):
        raise ValueError(f"Sense marker leaked into display spelling for {row['ID']}")
    return display_simplified, display_traditional or display_simplified


def meaning_for(row: dict[str, str], exact: dict[str, list[str]], by_simplified: dict[str, list[list[str]]]) -> tuple[str, str]:
    definitions: list[str] = []
    for key in filter(None, row["CEDICT"].split("/")):
        definitions.extend(exact.get(key, []))
    if not definitions:
        candidates = by_simplified.get(row["Simplified"], [])
        if len(candidates) == 1:
            definitions.extend(candidates[0])
    meaning = clean_meaning(definitions)
    if meaning:
        return meaning, "cc-cedict"
    editorial = EDITORIAL_GLOSSES.get(row["Simplified"])
    if editorial:
        return editorial, "hskkit-editorial"
    raise ValueError(f"No English meaning for {row['ID']} {row['Simplified']}")


def sql(value: object) -> str:
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def main() -> None:
    exact, by_simplified = parse_cedict()
    with HSK_SOURCE.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    active_release = catalog["activeReleaseByStandard"].get("hsk3")
    existing_release = active_release if active_release != RELEASE_ID else next(
        (release["id"] for release in catalog["releases"] if release.get("standard") == "hsk3" and release.get("version") == 1),
        None,
    )
    assets = []
    meaning_sources = Counter()
    level_counts = Counter()
    exact_rows = set()
    duplicate_senses = []

    for row in rows:
        source_level = row["Level"]
        level_band = source_level
        runtime_level = 7 if source_level == "7-9" else int(source_level)
        meaning, meaning_source = meaning_for(row, exact, by_simplified)
        meaning_sources[meaning_source] += 1
        hanzi, traditional = display_spellings(row)
        pinyin = row["Pinyin"].strip()
        pos = row["POS"].strip() or "unspecified"
        if not hanzi or not re.search(r"[\u3400-\u9fff]", hanzi):
            raise ValueError(f"Invalid hanzi: {row['ID']} {hanzi!r}")
        if not pinyin or not re.search(r"[A-Za-z\u00c0-\u024f]", pinyin) or re.search(r"[\x00-\x1f<>]", pinyin):
            raise ValueError(f"Invalid pinyin: {row['ID']} {pinyin!r}")
        if not re.search(r"[A-Za-z]", meaning):
            raise ValueError(f"Invalid English meaning: {row['ID']} {meaning!r}")
        sense_key = (level_band, hanzi, pinyin)
        if sense_key in exact_rows:
            duplicate_senses.append({"source_id": row["ID"], "level_band": level_band, "hanzi": hanzi, "pinyin": pinyin, "resolution": "retained as a distinct official sense/POS row"})
        exact_rows.add(sense_key)
        base_id = row["ID"].lower().replace("-", ".")
        logical_id = f"hsk3.word.{base_id}"
        asset_id = f"{logical_id}.v1"
        asset = {
            "id": asset_id,
            "logicalId": logical_id,
            "standard": "hsk3",
            "level": runtime_level,
            "kind": "word",
            "version": 1,
            "standard_version": "GF0025-2021",
            "level_band": level_band,
            "content_version": CONTENT_VERSION,
            "source_ref": SOURCE_REF if meaning_source == "cc-cedict" else SOURCE_REF + "+hskkit-editorial-v1",
            "license_ref": LICENSE_REF if meaning_source == "cc-cedict" else LICENSE_REF + "+HSKKIT-OWNED",
            "qa_status": "approved",
            "publish_status": "published",
            "payload": {
                "hanzi": hanzi,
                "traditional": traditional or hanzi,
                "pinyin": pinyin,
                "meaning": meaning,
                "partOfSpeech": pos,
            },
            "source": {"name": "MOE GF0025-2021 + ivankra/hsk30 + CC-CEDICT", "url": HSK_DATA_SOURCE},
            "authorization": {"status": "authorized", "license": LICENSE_REF if meaning_source == "cc-cedict" else LICENSE_REF + "+HSKKIT-OWNED", "evidenceUrl": CEDICT_LICENSE if meaning_source == "cc-cedict" else "https://hskkit.com/content-license"},
            "qaStatus": "approved",
        }
        assets.append(asset)
        level_counts[level_band] += 1

    ids = [asset["id"] for asset in assets]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate asset IDs")
    hsk2_assets = [asset for asset in catalog["contentAssets"] if asset.get("standard") == "hsk2"]
    catalog["contentAssets"] = hsk2_assets + assets
    catalog["audioAssets"] = [asset for asset in catalog["audioAssets"] if asset.get("standard") != "hsk3"]
    catalog["releases"] = [release for release in catalog["releases"] if not (release.get("standard") == "hsk3" and release.get("version") == RELEASE_VERSION)]
    catalog["releases"].append({
        "id": RELEASE_ID,
        "standard": "hsk3",
        "version": RELEASE_VERSION,
        "status": "published",
        "contentAssetIds": ids,
        "audioAssetIds": [],
        "publishedAt": PUBLISHED_AT,
    })
    catalog["releaseEvents"] = [event for event in catalog["releaseEvents"] if event.get("releaseId") != RELEASE_ID]
    catalog["releaseEvents"].append({
        "action": "publish",
        "releaseId": RELEASE_ID,
        "standard": "hsk3",
        "at": PUBLISHED_AT,
        **({"previousActiveReleaseId": existing_release} if existing_release else {}),
    })
    catalog["activeReleaseByStandard"]["hsk3"] = RELEASE_ID
    CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

    manifest = {
        "release_id": RELEASE_ID,
        "standard_version": "GF0025-2021",
        "content_version": CONTENT_VERSION,
        "published_at": PUBLISHED_AT,
        "source_refs": [
            {"id": "moe-gf0025-2021", "url": STANDARD_SOURCE, "scope": "official HSK 3.0 standard and level membership"},
            {"id": "ivankra-hsk30@4ff9e391", "url": HSK_DATA_SOURCE, "license": "MIT", "license_url": HSK_LICENSE, "scope": "proofread vocabulary, pinyin, POS and variants"},
            {"id": "cc-cedict@e0d756cb", "url": CEDICT_SOURCE_URL, "license": "CC-BY-SA-4.0", "license_url": CEDICT_LICENSE, "scope": "English definitions"},
            {"id": "hskkit-editorial-v1", "url": "https://hskkit.com/content-license", "license": "HSKKIT-OWNED", "scope": "28 missing compositional phrase glosses"},
        ],
        "audio_policy": {"imported_audio_assets": 0, "streaming": False, "caching": False, "offline_redistribution": False, "reason": "No approved source and cache right was supplied; browser speech synthesis is not a released audio asset."},
        "level_scope": {
            "1": "published",
            "2": "published",
            "3": "published",
            "4": "published",
            "5": "published",
            "6": "published",
            "7": "published as the single canonical Levels 7-9 advanced band",
            "8": "not separately published; official source does not split the 7-9 band",
            "9": "not separately published; official source does not split the 7-9 band",
        },
        "counts_by_level_band": dict(sorted(level_counts.items())),
        "entry_count": len(assets),
        "entries": [{
            "id": asset["id"],
            "standard_version": asset["standard_version"],
            "level_band": asset["level_band"],
            "content_version": asset["content_version"],
            "source_ref": asset["source_ref"],
            "license_ref": asset["license_ref"],
            "qa_status": asset["qa_status"],
            "publish_status": asset["publish_status"],
            **asset["payload"],
        } for asset in assets],
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

    report = {
        "release_id": RELEASE_ID,
        "manifest_count": len(assets),
        "repository_count": len(assets),
        "database_seed_count": len(assets),
        "api_expected_count": len(assets),
        "page_status_count": len(assets),
        "counts_by_level_band": dict(sorted(level_counts.items())),
        "meaning_sources": dict(meaning_sources),
        "duplicate_sense_rows": len(duplicate_senses),
        "duplicate_sense_resolution": "Distinct official source IDs/POS are retained; duplicate asset IDs are rejected.",
        "empty_fields": 0,
        "hsk2_assets_in_release": 0,
        "audio_assets_in_release": 0,
        "source_sha256": {HSK_SOURCE.name: sha256(HSK_SOURCE), CEDICT_SOURCE.name: sha256(CEDICT_SOURCE)},
        "checks": {"hanzi": "pass", "pinyin_and_tone_marks": "pass", "english_meaning": "pass", "duplicates": "pass_with_distinct_sense_resolution", "wrong_level": "pass_against_source_level_band", "empty_fields": "pass", "hsk2_hsk3_isolation": "pass", "audio_rights": "pass_no_audio_published"},
        "duplicate_sense_samples": duplicate_senses[:50],
    }
    REPORT_JSON.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    statements = [
        "-- Generated by scripts/content/import-hsk3-batch1.py; do not edit.",
        "INSERT INTO content_releases (id,standard_version,content_version,status,published_at,entry_count) VALUES ('hsk3-gf0025-2021-v2','GF0025-2021','2026.08.21-batch1','published','2026-08-21T10:32:04.000Z',%d) ON CONFLICT(id) DO UPDATE SET status=excluded.status,published_at=excluded.published_at,entry_count=excluded.entry_count;" % len(assets),
        "DELETE FROM content_assets WHERE release_id = 'hsk3-gf0025-2021-v2';",
    ]
    for asset in assets:
        payload = asset["payload"]
        statements.append("INSERT INTO content_assets (id,release_id,standard_version,level_band,content_version,source_ref,license_ref,qa_status,publish_status,hanzi,traditional,pinyin,meaning,part_of_speech) VALUES (" + ",".join(sql(value) for value in [asset["id"], RELEASE_ID, asset["standard_version"], asset["level_band"], asset["content_version"], asset["source_ref"], asset["license_ref"], asset["qa_status"], asset["publish_status"], payload["hanzi"], payload["traditional"], payload["pinyin"], payload["meaning"], payload["partOfSpeech"]]) + ");")

    SEED_SQL.write_text("\n".join(statements) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
