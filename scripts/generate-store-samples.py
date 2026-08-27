#!/usr/bin/env python3
"""Render watermarked, readable Store sample pages from the generated delivery files."""
from __future__ import annotations

import argparse
import csv
import io
from pathlib import Path
import subprocess
import tempfile
import zipfile

from PIL import Image, ImageDraw, ImageFont

PDF_SAMPLES = {
    "worksheet-pack": [
        ("HSKKit-Worksheet-Quick-Start.pdf", 1, "quick-start"),
        ("HSKKit-Worksheets-Student-A4.pdf", 1, "level-1-student-meaning-match"),
        ("HSKKit-Worksheets-Student-A4.pdf", 37, "level-4-student-reading"),
        ("HSKKit-Worksheets-Student-A4.pdf", 78, "level-8-student-information-match"),
        ("HSKKit-Worksheets-Answer-Key.pdf", 37, "level-4-answer-reading"),
        ("HSKKit-Worksheets-Answer-Key.pdf", 90, "level-9-answer-review-test"),
    ],
    "assessment-tracker": [
        ("HSKKit-Assessment-Dashboard-Guide.pdf", 1, "scoring-guide"),
        ("HSKKit-Assessment-Dashboard-Guide.pdf", 2, "dashboard-method"),
        ("HSKKit-Printable-Assessment-Record.pdf", 2, "level-3-review-record"),
    ],
    "30-day-planner": [
        ("HSKKit-30-Day-Planner-Quick-Start.pdf", 1, "quick-start"),
        ("HSKKit-30-Day-Planner-Printable-A4.pdf", 1, "setup-diagnosis"),
        ("HSKKit-30-Day-Planner-Printable-A4.pdf", 2, "assessment-mapping"),
        ("HSKKit-30-Day-Planner-Printable-A4.pdf", 11, "day-8-routes"),
        ("HSKKit-30-Day-Planner-Fillable-A4.pdf", 18, "weekly-review"),
        ("HSKKit-30-Day-Planner-Fillable-A4.pdf", 37, "recovery-worksheet"),
    ],
    "mock-exam-pack": [
        ("HSKKit-Practice-Assessment-A-Student.pdf", 2, "timed-instructions"),
        ("HSKKit-Practice-Assessment-A-Student.pdf", 8, "listening-simulation"),
        ("HSKKit-Practice-Assessment-B-Student.pdf", 15, "reading-section"),
        ("HSKKit-Practice-Assessment-B-Student.pdf", 19, "writing-section"),
        ("HSKKit-Practice-Assessment-Answers-Explanations.pdf", 13, "answers-rubric"),
        ("HSKKit-Practice-Assessment-Facilitator-Transcripts.pdf", 1, "facilitator-script"),
    ],
    "teacher-lesson-plan-pack": [
        ("HSKKit-Teacher-Pack-Quick-Start.pdf", 1, "teacher-quick-start"),
        ("HSKKit-Teacher-Lesson-Plans-A4.pdf", 1, "teacher-modelling"),
        ("HSKKit-Teacher-Lesson-Plans-A4.pdf", 2, "guided-practice"),
        ("HSKKit-Teacher-Lesson-Plans-A4.pdf", 3, "independent-check"),
        ("HSKKit-Exit-Tickets-A4.pdf", 1, "exit-ticket-homework"),
    ],
}
CSV_SAMPLES = {
    "assessment-tracker": [
        ("HSKKit-Assessment-Tracker.csv", "vocabulary-tracker"),
        ("HSKKit-Weekly-Review.csv", "weekly-review-log"),
    ]
}


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        Path(__file__).resolve().parents[1] / "assets/fonts/HskKitSansSubset.ttf",
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def watermark(image: Image.Image) -> Image.Image:
    overlay = Image.new("RGBA", image.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)
    mark_font = font(max(28, image.width // 23))
    text = "SAMPLE PREVIEW"
    box = draw.textbbox((0, 0), text, font=mark_font)
    text_width = box[2] - box[0]
    x = max(24, (image.width - text_width) // 2)
    for ratio in (0.28, 0.55, 0.82):
        draw.text((x, int(image.height * ratio)), text, font=mark_font, fill=(5, 110, 85, 32), stroke_width=1, stroke_fill=(255, 255, 255, 24))
    return Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")


def render_pdf(pdf_bytes: bytes, page_number: int, destination: Path) -> None:
    with tempfile.TemporaryDirectory() as temp_directory:
        pdf_path = Path(temp_directory) / "source.pdf"
        output_prefix = Path(temp_directory) / "page"
        pdf_path.write_bytes(pdf_bytes)
        subprocess.run(
            ["pdftoppm", "-f", str(page_number), "-l", str(page_number), "-r", "180", "-png", "-singlefile", str(pdf_path), str(output_prefix)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        image = Image.open(output_prefix.with_suffix(".png")).convert("RGB")
        watermark(image).save(destination, "WEBP", quality=88, method=6)


def render_csv(csv_bytes: bytes, title: str, destination: Path) -> None:
    rows = list(csv.reader(io.StringIO(csv_bytes.decode("utf-8-sig"))))
    headers = rows[0]
    body = rows[1:15]
    width, height = 1600, 1120
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)
    title_font, header_font, body_font = font(38), font(22), font(19)
    draw.rectangle((0, 0, width, 120), fill="#064e3b")
    draw.text((50, 32), title, font=title_font, fill="white")
    draw.text((50, 84), "Actual UTF-8 CSV columns and sample rows from the delivery", font=body_font, fill="#d1fae5")
    visible_columns = min(7, len(headers))
    column_width = (width - 80) // visible_columns
    top, row_height = 155, 58
    for column, value in enumerate(headers[:visible_columns]):
        x = 40 + column * column_width
        draw.rectangle((x, top, x + column_width, top + row_height), fill="#d1fae5", outline="#94a3b8")
        draw.text((x + 10, top + 16), value[:18], font=header_font, fill="#064e3b")
    for row_index, row in enumerate(body):
        y = top + (row_index + 1) * row_height
        fill = "#f8fafc" if row_index % 2 == 0 else "white"
        for column in range(visible_columns):
            x = 40 + column * column_width
            value = row[column] if column < len(row) else ""
            draw.rectangle((x, y, x + column_width, y + row_height), fill=fill, outline="#cbd5e1")
            draw.text((x + 10, y + 17), value[:22], font=body_font, fill="#334155")
    watermark(image).save(destination, "WEBP", quality=88, method=6)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_root", type=Path, help="p0-p1-v2 artifact directory")
    parser.add_argument("output_root", type=Path)
    parser.add_argument("--product", choices=sorted(PDF_SAMPLES), help="Render only one product")
    args = parser.parse_args()
    args.output_root.mkdir(parents=True, exist_ok=True)
    selected = {args.product: PDF_SAMPLES[args.product]} if args.product else PDF_SAMPLES
    for product, samples in selected.items():
        product_output = args.output_root / product
        product_output.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(args.source_root / product / "product.zip") as archive:
            sources = {name: archive.read(name) for name, _, _ in samples}
        for name, page, slug in samples:
            render_pdf(sources[name], page, product_output / f"{slug}.webp")
        if product in CSV_SAMPLES:
            with zipfile.ZipFile(args.source_root / product / "product.zip") as archive:
                for name, slug in CSV_SAMPLES[product]:
                    render_csv(archive.read(name), name.removesuffix(".csv").replace("HSKKit-", "").replace("-", " "), product_output / f"{slug}.webp")
    print(sum(1 for _ in args.output_root.rglob("*.webp")))


if __name__ == "__main__":
    main()
