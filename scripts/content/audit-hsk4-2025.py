#!/usr/bin/env python3
"""Audit 2025 HSK 4 syllabus rows without publishing or copying the source list."""

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
ROW = re.compile(r"^(\d{4})\s+(4(?:（[^）]+）)*)\s+([\u3400-\u9fff]+[0-9]?)\s+(.+)$")


def compact(value: str) -> str:
    value = unicodedata.normalize("NFC", value).lower()
    return "".join(char for char in value if char not in " -'’·")


def rows_from_pdf(path: Path) -> list[dict]:
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != OFFICIAL_SHA256:
        raise ValueError(f"Unexpected official syllabus SHA-256: {digest}")
    pdf = PdfReader(path)
    rows: list[dict] = []
    for page_index in range(104, 129):  # Physical pages 105–129.
        for line in (pdf.pages[page_index].extract_text() or "").splitlines():
            match = ROW.match(line)
            if not match:
                continue
            number_text, annotation, spelling, remainder = match.groups()
            number = int(number_text)
            if not 1001 <= number <= 2000:
                continue
            pos_start = re.search(r"[\u3400-\u9fff]", remainder)
            rows.append({"number": number, "level": 4, "level_annotation": annotation,
                         "word": re.sub(r"\d+$", "", spelling), "source_spelling": spelling,
                         "pinyin": remainder[:pos_start.start()].strip() if pos_start else remainder.strip(),
                         "part_of_speech": remainder[pos_start.start():].strip() if pos_start else "",
                         "pdf_page": page_index + 1})
    if [row["number"] for row in rows] != list(range(1001, 2001)):
        present = {row["number"] for row in rows}
        raise ValueError(f"Official HSK 4 rows incomplete: {sorted(set(range(1001, 2001)) - present)[:20]}")
    if any(not row["word"] or not row["pinyin"] for row in rows):
        raise ValueError("Official HSK 4 rows contain empty spelling or pinyin")
    return rows


def audit(rows: list[dict], catalog: dict, legacy_hsk23: dict) -> tuple[dict, list[dict]]:
    all_words = catalog["words"] + legacy_hsk23["words"]
    by_word: dict[str, dict[str, list]] = defaultdict(dict)
    for entry in all_words:
        for form in entry[4].split("|"):
            by_word[compact(form)][entry[0]] = entry
    details = []
    for source in rows:
        candidates = list(by_word[compact(source["word"])].values())
        exact = [entry for entry in candidates if compact(source["pinyin"]) in {
            compact(part) for part in entry[6].split("|")}]
        same_level = [entry for entry in exact if entry[3] == "4"]
        if len(same_level) == 1:
            category, chosen = "same_level_exact", same_level[0][0]
        elif len(same_level) > 1:
            category, chosen = "ambiguous_same_level", None
        elif any(entry[3] == "4" for entry in candidates):
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
    return {"official_rows": len(details), "official_numbers": [1001, 2000],
            "current_level_rows": sum(entry[3] == "4" for entry in catalog["words"]),
            "categories": dict(Counter(row["category"] for row in details)),
            "manual_review_required": sum(row["selected_old_id"] is None for row in details),
            "blank_part_of_speech": sum(not row["part_of_speech"] for row in details),
            "shared_old_ids": sum(count > 1 for count in Counter(
                row["selected_old_id"] for row in details if row["selected_old_id"]).values())}, details


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf", type=Path, required=True)
    parser.add_argument("--catalog", type=Path, default=ROOT / "src/lib/content/public-catalog-index.json")
    parser.add_argument("--legacy-hsk23", type=Path, default=ROOT / "src/lib/content/legacy-hsk23-words.json")
    parser.add_argument("--private-crosswalk", type=Path)
    args = parser.parse_args()
    summary, details = audit(rows_from_pdf(args.pdf),
                             json.loads(args.catalog.read_text(encoding="utf-8")),
                             json.loads(args.legacy_hsk23.read_text(encoding="utf-8")))
    if args.private_crosswalk:
        destination = args.private_crosswalk.resolve()
        if destination.is_relative_to(ROOT):
            raise ValueError("Detailed crosswalk must stay outside the public checkout")
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(json.dumps({"source_sha256": OFFICIAL_SHA256, "rows": details},
                                          ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
