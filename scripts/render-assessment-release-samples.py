#!/usr/bin/env python3
"""Render watermarked storefront samples from a generated assessment ZIP."""
import io
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SAMPLES = ROOT / "public/store/samples/practice-assessment-pack"
# Page numbers are one-based. Assert the heading so changed pagination cannot
# silently put a different level or form in the storefront preview.
PAGES = {
    "timed-instructions.webp": ("00-START-HERE.pdf", 1, "Choose one level and one form"),
    "listening-simulation.webp": ("HSKKit-Practice-Assessment-A-Student.pdf", 1, "Level 1"),
    "reading-section.webp": ("HSKKit-Practice-Assessment-A-Student.pdf", 15, "Level 4"),
    "writing-section.webp": ("HSKKit-Practice-Assessment-A-Student.pdf", 33, "Level 8"),
    "answers-rubric.webp": ("HSKKit-Practice-Assessment-Answers-Explanations.pdf", 41, "Level 4"),
    "facilitator-script.webp": ("HSKKit-Practice-Assessment-Facilitator-Transcripts.pdf", 1, "Form A"),
}


def watermark(image: Image.Image) -> Image.Image:
    base = image.convert("RGBA")
    overlay = Image.new("RGBA", base.size)
    draw = ImageDraw.Draw(overlay)
    choices = [
        Path("C:/Windows/Fonts/arialbd.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ]
    font_file = next((path for path in choices if path.exists()), None)
    font = ImageFont.truetype(str(font_file), 62) if font_file else ImageFont.load_default()
    label = "SAMPLE PREVIEW"
    box = draw.textbbox((0, 0), label, font=font)
    draw.text(((base.width - box[2] + box[0]) / 2, base.height * .52), label,
              fill=(45, 62, 85, 52), font=font)
    return Image.alpha_composite(base, overlay).convert("RGB")


def main(archive: Path) -> None:
    SAMPLES.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="hskkit-assessment-samples-") as temp_dir:
        temp = Path(temp_dir)
        with zipfile.ZipFile(archive) as bundle:
            assert bundle.testzip() is None
            for sample, (pdf_name, page_number, expected_heading) in PAGES.items():
                pdf_bytes = bundle.read(pdf_name)
                reader = PdfReader(io.BytesIO(pdf_bytes))
                assert expected_heading in reader.pages[page_number - 1].extract_text(), sample
                source = temp / pdf_name
                source.write_bytes(pdf_bytes)
                output = temp / Path(sample).stem
                subprocess.run([
                    "pdftoppm", "-f", str(page_number), "-l", str(page_number),
                    "-r", "180", "-singlefile", "-png", str(source), str(output),
                ], check=True, stderr=subprocess.DEVNULL)
                with Image.open(output.with_suffix(".png")) as image:
                    watermark(image).save(SAMPLES / sample, quality=90, method=6)
    print(f"Rendered {len(PAGES)} samples from {archive}")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
