#!/usr/bin/env python3
"""Audit HSK 2 and 3 against the verified 2025 syllabus PDF.

The official rows and detailed crosswalk are private working data. Only
aggregate counts are printed; this script never changes published content.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[2]
OFFICIAL_SHA256 = "ec74ce0439e837bbb15154be13e747ae798903b2fd3a331629df6c3b45504941"
BOUNDS = {2: (301, 500), 3: (501, 1000)}
ROW = re.compile(r"^(\d{1,4})\s+([23](?:（[^）]+）)*)\s+([\u3400-\u9fff]+[0-9]?)\s+(.+)$")


def compact(value: str) -> str:
    value = unicodedata.normalize("NFC", value).lower()
    return "".join(char for char in value if char not in " -'’·")


def forms(value: str) -> list[str]:
    return [part.strip() for part in value.split("|") if part.strip()]


def official_rows(path: Path) -> list[dict[str, object]]:
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != OFFICIAL_SHA256:
        raise ValueError(f"Unexpected official syllabus SHA-256: {digest}")
    pdf = PdfReader(path)
    rows = []
    for page_index in range(86, 104):  # Physical pages 87–104.
        for line in (pdf.pages[page_index].extract_text() or "").splitlines():
            match = ROW.match(line)
            if not match:
                continue
            number_text, level_annotation, spelling, remainder = match.groups()
            number = int(number_text)
            if not 301 <= number <= 1000:
                continue
            level = 2 if number <= 500 else 3
            if not level_annotation.startswith(str(level)):
                raise ValueError(f"Wrong level annotation for row {number}")
            pos_start = re.search(r"[\u3400-\u9fff]", remainder)
            rows.append({
                "number": number,
                "level": level,
                "level_annotation": level_annotation,
                "word": re.sub(r"\d+$", "", spelling),
                "source_spelling": spelling,
                "pinyin": remainder[:pos_start.start()].strip() if pos_start else remainder.strip(),
                "part_of_speech": remainder[pos_start.start():].strip() if pos_start else "",
                "pdf_page": page_index + 1,
            })
    if [row["number"] for row in rows] != list(range(301, 1001)):
        raise ValueError("Official HSK 2–3 rows must be numbered exactly 301–1000")
    if any(not row["word"] or not row["pinyin"] for row in rows):
        raise ValueError("Official syllabus has empty spelling or pinyin")
    return rows


def audit(rows: list[dict[str, object]], catalog: dict[str, object], legacy_hsk1: dict[str, object]):
    existing = catalog["words"] + legacy_hsk1["words"]
    by_word = defaultdict(dict)
    for entry in existing:
        for form in forms(entry[4]):
            by_word[compact(form)][entry[0]] = entry
    details = []
    for source in rows:
        level = source["level"]
        candidates = list(by_word[compact(str(source["word"]))].values())
        exact = [entry for entry in candidates if compact(str(source["pinyin"])) in {compact(part) for part in forms(entry[6])}]
        same_level = [entry for entry in exact if entry[3] == str(level)]
        if len(same_level) == 1:
            category, chosen = "same_level_exact", same_level[0][0]
        elif len(same_level) > 1:
            category, chosen = "ambiguous_same_level", None
        elif any(entry[3] == str(level) for entry in candidates):
            category, chosen = "same_level_variant_or_sense", None
        elif len(exact) == 1:
            category, chosen = "other_level_exact", exact[0][0]
        elif len(exact) > 1:
            category, chosen = "ambiguous_other_level", None
        elif candidates:
            category, chosen = "other_level_variant_or_sense", None
        else:
            category, chosen = "new_spelling", None
        details.append({**source, "category": category, "selected_old_id": chosen,
                        "candidate_old_ids": sorted(entry[0] for entry in candidates),
                        "candidate_exact_ids": sorted(entry[0] for entry in exact)})
    summary = {}
    for level, (first, last) in BOUNDS.items():
        level_rows = [row for row in details if row["level"] == level]
        summary[f"hsk{level}"] = {
            "official_rows": len(level_rows), "official_numbers": [first, last],
            "current_level_rows": sum(entry[3] == str(level) for entry in catalog["words"]),
            "categories": dict(Counter(row["category"] for row in level_rows)),
            "manual_review_required": sum(row["selected_old_id"] is None for row in level_rows),
            "rows_without_parsed_part_of_speech": sum(not row["part_of_speech"] for row in level_rows),
        }
    summary["shared_old_ids"] = {key: count for key, count in Counter(
        row["selected_old_id"] for row in details if row["selected_old_id"]
    ).items() if count > 1}
    return summary, details


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf", required=True, type=Path)
    parser.add_argument("--catalog", type=Path, default=ROOT / "src/lib/content/public-catalog-index.json")
    parser.add_argument("--legacy-hsk1", type=Path, default=ROOT / "src/lib/content/legacy-hsk1-words.json")
    parser.add_argument("--private-crosswalk", type=Path)
    args = parser.parse_args()
    summary, details = audit(official_rows(args.pdf),
                             json.loads(args.catalog.read_text(encoding="utf-8")),
                             json.loads(args.legacy_hsk1.read_text(encoding="utf-8")))
    if args.private_crosswalk:
        destination = args.private_crosswalk.resolve()
        if destination.is_relative_to(ROOT):
            raise ValueError("Detailed official crosswalk must stay outside the public Git checkout")
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(json.dumps({"source_sha256": OFFICIAL_SHA256, "rows": details},
                                          ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
