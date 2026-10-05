#!/usr/bin/env python3
"""Build the Teacher Pack store hero from actual pages in the generated delivery ZIP."""
from __future__ import annotations

import argparse
import subprocess
import tempfile
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
FONT=ROOT/"assets/fonts/HskKitSansSubset.ttf"


def font(size:int):
    return ImageFont.truetype(str(FONT),size)


def render(pdf:bytes,page:int)->Image.Image:
    with tempfile.TemporaryDirectory() as temporary:
        source=Path(temporary)/"source.pdf"
        output=Path(temporary)/"page"
        source.write_bytes(pdf)
        try:
            subprocess.run(["pdftoppm","-f",str(page),"-l",str(page),"-r","150","-png","-singlefile",str(source),str(output)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            return Image.open(output.with_suffix(".png")).convert("RGB")
        except FileNotFoundError:
            import pypdfium2

            pdf=pypdfium2.PdfDocument(pdf)
            return pdf[page-1].render(scale=150/72).to_pil().convert("RGB")


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("artifact",type=Path)
    parser.add_argument("output",type=Path)
    args=parser.parse_args()
    with zipfile.ZipFile(args.artifact) as archive:
        plans=archive.read("HSKKit-Teacher-Lesson-Plans-A4.pdf")
        tickets=archive.read("HSKKit-Exit-Tickets-A4.pdf")
    pages=[("L1 · 45 MIN",render(plans,1)),("L5 · 60 MIN",render(plans,27)),("L9 · 90 MIN",render(plans,53)),("CUTTABLE",render(tickets,1))]
    canvas=Image.new("RGB",(1600,1000),"#063c34")
    draw=ImageDraw.Draw(canvas)
    for y in range(1000):
        shade=int(62+30*y/1000)
        draw.line((0,y,1600,y),fill=(4,shade,55))
    draw.text((72,54),"HSK 3.0 Teacher Lesson Plan Pack",font=font(53),fill="white")
    draw.text((74,122),"Levels 1–9  ·  Classroom-ready  ·  Real editable DOCX + PPTX",font=font(24),fill="#c9f7e8")
    card_w,card_h=340,720
    for index,(label,page) in enumerate(pages):
        page=page.crop((0,0,page.width,int(page.height*.72)))
        page.thumbnail((card_w-34,card_h-85),Image.Resampling.LANCZOS)
        x=70+index*380;y=205
        draw.rounded_rectangle((x,y,x+card_w,y+card_h),radius=22,fill="white",outline="#84d9bd",width=3)
        draw.rounded_rectangle((x+18,y+18,x+142,y+60),radius=18,fill="#0b6b5d")
        draw.text((x+34,y+28),label,font=font(17),fill="white")
        canvas.paste(page,(x+(card_w-page.width)//2,y+75))
    draw.text((72,948),"Teacher plans · Student handouts · Exit Tickets · Activity Cards · Homework + answers + rubric · A4 + US Letter",font=font(18),fill="white")
    args.output.parent.mkdir(parents=True,exist_ok=True)
    canvas.save(args.output,"WEBP",quality=90,method=6)


if __name__=="__main__":
    main()
