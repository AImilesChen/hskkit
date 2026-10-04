#!/usr/bin/env python3
"""Render storefront assessment sample pages from frozen release archive."""
import io
import zipfile
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SAMPLES = ROOT / 'public/store/samples/practice-assessment-pack'
MAP = {
    'timed-instructions.webp': ('HSKKit-Practice-Assessment-A-Student.pdf', 0),
    'listening-simulation.webp': ('HSKKit-Practice-Assessment-B-Student.pdf', 0),
    'reading-section.webp': ('HSKKit-Practice-Assessment-A-Student.pdf', 1),
    'writing-section.webp': ('HSKKit-Practice-Assessment-A-Student.pdf', 2),
    'answers-rubric.webp': ('HSKKit-Practice-Assessment-Answers-Explanations.pdf', 0),
    'facilitator-script.webp': ('HSKKit-Practice-Assessment-Facilitator-Transcripts.pdf', 0),
}


def render(doc, index):
    pix = doc[index].get_pixmap(matrix=fitz.Matrix(2.5, 2.5), alpha=False)
    im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples).convert('RGBA')
    overlay = Image.new('RGBA', im.size)
    d = ImageDraw.Draw(overlay)
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 65)
    text = 'SAMPLE PREVIEW'
    box = d.textbbox((0, 0), text, font=font)
    d.text(((im.width - (box[2] - box[0])) / 2, im.height * .52), text, fill=(45, 62, 85, 50), font=font)
    return Image.alpha_composite(im, overlay).convert('RGB')


def main():
    import sys
    archive = Path(sys.argv[1])
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        for name, (pdf, index) in MAP.items():
            doc = fitz.open(stream=z.read(pdf), filetype='pdf')
            assert str(doc[index].get_text('text')).strip()
            render(doc, index).save(SAMPLES / name, quality=90, method=6)
    print('Rendered', len(MAP), 'samples from', archive)


if __name__ == '__main__':
    main()
