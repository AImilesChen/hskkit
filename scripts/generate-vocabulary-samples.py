#!/usr/bin/env python3
"""Render Store previews directly from the current vocabulary delivery PDFs."""
from __future__ import annotations

from pathlib import Path
import argparse
import runpy
import subprocess
import tempfile

from PIL import Image
try:
    import pypdfium2
except ImportError:
    pypdfium2 = None

watermark = runpy.run_path(str(Path(__file__).resolve().parent / "generate-store-samples.py"))["watermark"]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("artifact_root", type=Path)
    parser.add_argument("--generation-version", default="complete-vocabulary-v2")
    parser.add_argument("--hsk1-2025-only", action="store_true")
    parser.add_argument("--hsk6-2025-only", action="store_true")
    parser.add_argument("--hsk789-2025-only", action="store_true")
    args = parser.parse_args()
    root = args.artifact_root / args.generation_version
    destination = Path(__file__).resolve().parents[1] / "public/store/samples/vocabulary"
    destination.mkdir(parents=True, exist_ok=True)

    previews = []
    if args.hsk789_2025_only:
        previews = [
            (root / "advanced-7-9/level-7.pdf", 1, "advanced-7-9-sample-1.webp"),
            (root / "advanced-7-9/level-7.pdf", 35, "advanced-7-9-sample-2.webp"),
            (root / "complete-1-9/level-1.pdf", 2, "complete-1-9-sample-1.webp"),
            (root / "complete-1-9/level-7.pdf", 35, "complete-1-9-sample-2.webp"),
        ]
    elif args.hsk6_2025_only:
        previews = [
            (root / "level-6/level-6.pdf", 2, "level-6-sample-1.webp"),
            (root / "level-6/level-6.pdf", 18, "level-6-sample-2.webp"),
            (root / "progression-4-6/level-4.pdf", 2, "progression-4-6-sample-1.webp"),
            (root / "progression-4-6/level-6.pdf", 18, "progression-4-6-sample-2.webp"),
            (root / "complete-1-9/level-1.pdf", 2, "complete-1-9-sample-1.webp"),
            (root / "complete-1-9/level-7.pdf", 35, "complete-1-9-sample-2.webp"),
        ]
    elif args.hsk1_2025_only:
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
        if pypdfium2 is None:
            with tempfile.TemporaryDirectory() as temporary:
                output = Path(temporary) / "page"
                subprocess.run(["pdftoppm", "-f", str(page_number), "-l", str(page_number),
                                "-scale-to", "1200", "-singlefile", "-png", str(source), str(output)],
                               check=True, capture_output=True)
                if not output.with_suffix(".png").exists():
                    raise ValueError(f"{source} has no page {page_number}")
                image = Image.open(output.with_suffix(".png")).convert("RGB")
        else:
            document = pypdfium2.PdfDocument(str(source))
            if page_number > len(document):
                raise ValueError(f"{source} has only {len(document)} pages")
            image = document[page_number - 1].render(scale=1.65).to_pil().convert("RGB")
            document.close()
        watermark(image).save(destination / filename, "WEBP", quality=84, method=6)
        print(filename)

    # Catalog cards reuse these complete watermarked pages directly.


if __name__ == "__main__":
    main()
