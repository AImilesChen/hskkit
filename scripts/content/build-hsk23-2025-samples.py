#!/usr/bin/env python3
"""Create watermarked store previews from the actual HSK 2/3 PDF pages."""

import argparse
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
GENERATION = "complete-vocabulary-hsk123-2025-v1"
MAPPINGS = [
    (2, 1, "level-2-sample-1.webp"),
    (2, 3, "level-2-sample-2.webp"),
    (3, 1, "level-3-sample-1.webp"),
    (3, 3, "level-3-sample-2.webp"),
    (3, 3, "starter-1-3-sample-2.webp"),
]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--artifacts", type=Path, required=True)
    args = parser.parse_args()
    destination = ROOT / "public/store/samples/vocabulary"
    destination.mkdir(parents=True, exist_ok=True)
    font_path = ROOT / "assets/fonts/HskKitSansSubset.ttf"
    font = ImageFont.truetype(str(font_path), 32)
    with tempfile.TemporaryDirectory() as folder:
        for level, page, filename in MAPPINGS:
            pdf = args.artifacts / GENERATION / f"level-{level}" / f"level-{level}.pdf"
            prefix = Path(folder) / f"level-{level}-page-{page}"
            subprocess.run(["pdftoppm", "-f", str(page), "-l", str(page), "-singlefile",
                            "-r", "110", "-png", str(pdf), str(prefix)], check=True)
            image = Image.open(prefix.with_suffix(".png")).convert("RGBA")
            overlay = Image.new("RGBA", image.size)
            draw = ImageDraw.Draw(overlay)
            text = "SAMPLE PREVIEW"
            bounds = draw.textbbox((0, 0), text, font=font)
            x = (image.width - (bounds[2] - bounds[0])) // 2
            for y in (image.height // 3, image.height * 2 // 3):
                draw.text((x, y), text, font=font, fill=(20, 100, 90, 48))
            Image.alpha_composite(image, overlay).convert("RGB").save(destination / filename, "WEBP", quality=82)
            print(f"{filename}: {(destination / filename).stat().st_size} bytes")


if __name__ == "__main__":
    main()
