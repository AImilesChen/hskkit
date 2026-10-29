#!/usr/bin/env python3
"""Compare the official 2025 HSK 1 syllabus with the current word index.

The official PDF is supplied locally and is never copied into the repository.
Only aggregate counts are printed. An optional detailed crosswalk must be written
to a private local path; it is not a publishable content release.
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


OFFICIAL_PDF_SHA256 = "ec74ce0439e837bbb15154be13e747ae798903b2fd3a331629df6c3b45504941"

# Reviewed against the official spelling/POS and the old entries' senses.
# These are lineage candidates, not permission to reuse the old audio or the
# full old English definition without editorial review.
REVIEWED_OLD_ID_BY_NUMBER = {
    14: "hsk3.word.l1.0032.v1",   # 不客气: official tone sandhi and neutral tone
    15: "hsk3.word.l2.0035.v1",   # 不要: official tone sandhi
    218: "hsk3.word.l2.0574.v1",  # 喂: interjection, not the L4 verb
    258: "hsk3.word.l1.0431.v1",  # 一半: official tone sandhi
    261: "hsk3.word.l1.0437.v1",  # 一点儿: official tone sandhi
    262: "hsk3.word.l1.0439.v1",  # 一些: official tone sandhi
}


def compact(value: str) -> str:
    text = unicodedata.normalize("NFC", value).lower()
    return "".join(character for character in text if character not in " -'’·")


def forms(value: str) -> list[str]:
    return [part.strip() for part in value.split("|") if part.strip()]


def source_word(value: str) -> str:
    # The official PDF appends a sense number to a few homographs.
    return re.sub(r"\d+$", "", value)


def read_official_hsk1(pdf_path: Path) -> list[dict[str, object]]:
    digest = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
    if digest != OFFICIAL_PDF_SHA256:
        raise ValueError(f"Unexpected official syllabus SHA-256: {digest}")

    pdf = PdfReader(pdf_path)
    rows: list[dict[str, object]] = []
    for page_index in range(79, 87):  # Physical PDF pages 80–87, one-based.
        for line in (pdf.pages[page_index].extract_text() or "").splitlines():
            match = re.match(
                r"^(\d{1,3})\s+(1(?:（[^）]+）)*)\s+([\u3400-\u9fff]+[0-9]?)\s+(.+)$",
                line,
            )
            if not match:
                continue
            number_text, level_annotation, word, remainder = match.groups()
            number = int(number_text)
            if number > 300:
                continue
            pos_start = re.search(r"[\u3400-\u9fff]", remainder)
            rows.append(
                {
                    "number": number,
                    "level_annotation": level_annotation,
                    "word": source_word(word),
                    "source_spelling": word,
                    "pinyin": remainder[: pos_start.start()].strip() if pos_start else remainder.strip(),
                    "part_of_speech": remainder[pos_start.start() :].strip() if pos_start else "",
                    "pdf_page": page_index + 1,
                }
            )

    numbers = [row["number"] for row in rows]
    if numbers != list(range(1, 301)):
        raise ValueError("Official HSK 1 rows must be numbered exactly 1–300")
    if any(not row["word"] or not row["pinyin"] for row in rows):
        raise ValueError("Official HSK 1 has an empty word or pinyin field")
    return rows


def compare(official: list[dict[str, object]], catalog: dict[str, object]) -> tuple[dict[str, object], list[dict[str, object]]]:
    words = catalog["words"]
    old_hsk1 = [row for row in words if row[3] == "1"]
    if len(old_hsk1) != 500:
        raise ValueError(f"Expected 500 current HSK 1 words, got {len(old_hsk1)}")

    by_word: dict[str, list[list[str]]] = defaultdict(list)
    for row in words:
        for form in forms(row[4]):
            by_word[compact(form)].append(row)

    crosswalk: list[dict[str, object]] = []
    for item in official:
        candidates = {row[0]: row for row in by_word[compact(str(item["word"]))]}
        exact = [
            row for row in candidates.values()
            if compact(str(item["pinyin"])) in {compact(pinyin) for pinyin in forms(row[6])}
        ]
        hsk1_exact = [row for row in exact if row[3] == "1"]
        hsk1_same_word = [row for row in candidates.values() if row[3] == "1"]

        if len(hsk1_exact) == 1:
            status = "same_level_exact"
            selected = hsk1_exact[0][0]
        elif len(hsk1_exact) > 1:
            status = "ambiguous_same_level_exact"
            selected = None
        elif hsk1_same_word:
            status = "same_level_review_pinyin_or_sense"
            selected = None
        elif len(exact) == 1:
            status = "other_level_exact"
            selected = exact[0][0]
        elif len(exact) > 1:
            status = "ambiguous_other_level_exact"
            selected = None
        elif candidates:
            status = "other_level_review_pinyin_or_sense"
            selected = None
        else:
            status = "new_word"
            selected = None

        reviewed_id = REVIEWED_OLD_ID_BY_NUMBER.get(int(item["number"]))
        if reviewed_id:
            if reviewed_id not in candidates:
                raise ValueError(f"Reviewed old ID {reviewed_id} is not a same-word candidate")
            if selected and selected != reviewed_id:
                raise ValueError(f"Reviewed old ID {reviewed_id} conflicts with automatic mapping")
            selected = reviewed_id
            status = "reviewed_variant_or_sense"

        crosswalk.append(
            {
                **item,
                "status": status,
                "selected_old_id": selected,
                "candidate_old_ids": sorted(candidates),
                "candidate_exact_ids": sorted(row[0] for row in exact),
            }
        )

    official_forms = {compact(str(row["word"])) for row in official}
    removed_forms = [
        row[0] for row in old_hsk1
        if not any(compact(form) in official_forms for form in forms(row[4]))
    ]
    selected_ids = [row["selected_old_id"] for row in crosswalk if row["selected_old_id"]]
    if len(selected_ids) != len(set(selected_ids)):
        raise ValueError("Two official rows selected the same old word ID")

    summary: dict[str, object] = {
        "official_source_rows": len(official),
        "official_source_pdf_pages": [80, 87],
        "current_hsk1_rows": len(old_hsk1),
        "classification": dict(Counter(row["status"] for row in crosswalk)),
        "old_hsk1_without_new_hsk1_word_match": len(removed_forms),
        "rows_without_parsed_part_of_speech": sum(not row["part_of_speech"] for row in official),
        "official_level_annotations": dict(Counter(row["level_annotation"] for row in official)),
        "manual_review_required": sum(row["selected_old_id"] is None for row in crosswalk),
        "reviewed_variant_or_sense": sum(row["status"] == "reviewed_variant_or_sense" for row in crosswalk),
    }
    return summary, crosswalk


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf", required=True, type=Path, help="Local copy of the official 2025 HSK syllabus")
    parser.add_argument("--catalog", type=Path, default=Path("src/lib/content/public-catalog-index.json"))
    parser.add_argument("--private-crosswalk", type=Path, help="Optional local, unpublished detailed audit JSON")
    args = parser.parse_args()

    official = read_official_hsk1(args.pdf)
    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    summary, crosswalk = compare(official, catalog)
    if args.private_crosswalk:
        repo_root = Path(__file__).resolve().parents[2]
        private_crosswalk = args.private_crosswalk.resolve()
        if private_crosswalk.is_relative_to(repo_root):
            raise ValueError("The detailed official crosswalk must be written outside the public Git checkout")
        private_crosswalk.parent.mkdir(parents=True, exist_ok=True)
        private_crosswalk.write_text(
            json.dumps({"source_sha256": OFFICIAL_PDF_SHA256, "rows": crosswalk}, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
