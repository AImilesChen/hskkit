#!/usr/bin/env python3
"""Render Store previews directly from the current vocabulary delivery PDFs."""
from __future__ import annotations

from pathlib import Path
import argparse
import runpy

import pypdfium2
from PIL import Image

watermark = runpy.run_path(str(Path(__file__).resolve().parent / "generate-store-samples.py"))["watermark"]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("artifact_root", type=Path)
    parser.add_argument("--generation-version", default="complete-vocabulary-v2")
    parser.add_argument("--hsk1-2025-only", action="store_true")
    args = parser.parse_args()
    root = args.artifact_root / args.generation_version
    destination = Path(__file__).resolve().parents[1] / "public/store/samples/vocabulary"
    destination.mkdir(parents=True, exist_ok=True)

    previews = []
    if args.hsk1_2025_only:
        previews = [
            (root / "level-1/level-1.pdf", 2, "level-1-sample-1.webp"),
            (root / "level-1/level-1.pdf", 18, "level-1-sample-2.webp"),
            (root / "starter-1-3/level-1.pdf", 2, "starter-1-3-sample-1.webp"),
            (root / "starter-1-3/level-3.pdf", 18, "starter-1-3-sample-2.webp"),
            (root / "complete-1-9/level-1.pdf", 2, "complete-1-9-sample-1.webp"),
            (root / "complete-1-9/level-7.pdf", 35, "complete-1-9-sample-2.webp"),
        ]
    else:
        for level in range(1, 7):
            pdf = root / f"level-{level}" / f"level-{level}.pdf"
            previews.extend([(pdf, 2, f"level-{level}-sample-1.webp"), (pdf, 18, f"level-{level}-sample-2.webp")])
        previews.extend([
        (root / "level-1/level-1.pdf", 2, "starter-1-3-sample-1.webp"),
        (root / "level-3/level-3.pdf", 18, "starter-1-3-sample-2.webp"),
        (root / "level-4/level-4.pdf", 2, "progression-4-6-sample-1.webp"),
        (root / "level-6/level-6.pdf", 18, "progression-4-6-sample-2.webp"),
        (root / "advanced-7-9/level-7.pdf", 1, "advanced-7-9-sample-1.webp"),
        (root / "advanced-7-9/level-7.pdf", 35, "advanced-7-9-sample-2.webp"),
        (root / "level-1/level-1.pdf", 2, "complete-1-9-sample-1.webp"),
        (root / "advanced-7-9/level-7.pdf", 35, "complete-1-9-sample-2.webp"),
        ])
    for source, page_number, filename in previews:
        document = pypdfium2.PdfDocument(str(source))
        if page_number > len(document):
            raise ValueError(f"{source} has only {len(document)} pages")
        image = document[page_number - 1].render(scale=1.65).to_pil().convert("RGB")
        watermark(image).save(destination / filename, "WEBP", quality=84, method=6)
        document.close()
        print(filename)

    card_directory = destination.parents[1] / "previews/vocabulary"
    card_directory.mkdir(parents=True, exist_ok=True)
    product_ids = ["level-1", "starter-1-3", "complete-1-9"] if args.hsk1_2025_only else [*(f"level-{level}" for level in range(1, 7)), "starter-1-3", "progression-4-6", "advanced-7-9", "complete-1-9"]
    for product_id in product_ids:
        sample_image = Image.open(destination / f"{product_id}-sample-1.webp").convert("RGB")
        card_image = sample_image.crop((0, 0, sample_image.width, min(sample_image.height, round(sample_image.width * 0.75))))
        card_image.save(card_directory / f"{product_id}.webp", "WEBP", quality=86, method=6)


if __name__ == "__main__":
    main()
