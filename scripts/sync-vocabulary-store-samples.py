#!/usr/bin/env python3
"""Render two watermarked store samples from verified delivery PDFs."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import runpy
import subprocess
import tempfile

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
WATERMARK = runpy.run_path(str(ROOT / "scripts/generate-store-samples.py"))["watermark"]
SAMPLE_DIR = ROOT / "public/store/samples/vocabulary"
SOURCES_FILE = ROOT / "src/lib/commercial/store-sample-sources.json"


def render(pdf: Path, page: int) -> Image.Image:
    with tempfile.TemporaryDirectory() as temporary:
        output = Path(temporary) / "page"
        subprocess.run(
            ["pdftoppm", "-f", str(page), "-l", str(page), "-scale-to", "1200",
             "-singlefile", "-png", str(pdf), str(output)],
            check=True, capture_output=True,
        )
        image_path = output.with_suffix(".png")
        if not image_path.exists():
            raise ValueError(f"{pdf} has no page {page}")
        return Image.open(image_path).convert("RGB")


def verify(pdf: Path, version: str) -> str:
    manifest = pdf.with_suffix(".manifest.json")
    actual = json.loads(manifest.read_text(encoding="utf-8"))["generationVersion"]
    if actual != version:
        raise ValueError(f"{pdf}: expected {version}, found {actual}")
    return hashlib.sha256(pdf.read_bytes()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("product_id")
    parser.add_argument("version")
    parser.add_argument("first_pdf", type=Path)
    parser.add_argument("first_page", type=int)
    parser.add_argument("second_pdf", type=Path)
    parser.add_argument("second_page", type=int)
    parser.add_argument("--card-from", type=int, choices=[1, 2], default=1)
    args = parser.parse_args()
    SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
    sources = json.loads(SOURCES_FILE.read_text(encoding="utf-8")) if SOURCES_FILE.exists() else {}
    samples = []
    for index, (pdf, page) in enumerate(((args.first_pdf, args.first_page), (args.second_pdf, args.second_page)), 1):
        sha = verify(pdf, args.version)
        filename = f"{args.product_id}-sample-{index}.webp"
        WATERMARK(render(pdf, page)).save(SAMPLE_DIR / filename, "WEBP", quality=84, method=6)
        samples.append({"file": filename, "page": page, "sourcePdfSha256": sha})
    # The catalog reuses a complete watermarked sample page; never crop the PDF page for a card.
    sources[args.product_id] = {"generationVersion": args.version, "samples": samples, "cardFrom": args.card_from}
    SOURCES_FILE.write_text(json.dumps(sources, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Rendered {args.product_id} from {args.version}")


if __name__ == "__main__":
    main()
