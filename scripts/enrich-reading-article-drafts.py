#!/usr/bin/env python3
"""Enrich Reading article drafts with derived metadata used by the reading UI.

This script does not grant editorial approval. It deliberately writes
reviewStatus=editorial-draft until a human reviewer signs off each article.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from pypinyin import Style, lazy_pinyin

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "src/lib/learning/reading-articles.json"

GRAMMAR = {
    1: ("在 + place", "Use 在 before a place to say where someone is.", "小林在早饭店。"),
    2: ("因为…所以…", "Connect a simple reason with its result.", "因为他每天都来，所以店主记住了他。"),
    3: ("先…再…", "Show the order of two actions.", "先说明事实，再说自己的想法。"),
    4: ("不但…而且…", "Add a second, stronger point to the first.", "这件事不但解决了问题，而且改变了他的看法。"),
    5: ("与其…不如…", "Compare two choices and recommend one.", "与其只看结果，不如先分析原因。"),
    6: ("尽管…但是…", "Acknowledge one fact before presenting a contrasting point.", "尽管个人感受有价值，但是它不能代替完整分析。"),
    7: ("之所以…是因为…", "Highlight a result first and then explain its cause.", "判断之所以改变，是因为出现了新的证据。"),
    8: ("既…又…", "Present two qualities or effects in parallel.", "这种方法既说明了依据，又保留了修正空间。"),
    9: ("与其说…不如说…", "Refine an interpretation by replacing a weaker claim with a more precise one.", "与其说结论已经确定，不如说证据暂时支持这一判断。"),
}
DIFFICULTY = {1: "foundation", 2: "foundation", 3: "developing", 4: "developing", 5: "independent", 6: "independent", 7: "advanced", 8: "advanced", 9: "advanced"}


def han_count(paragraphs: list[str]) -> int:
    return sum(len(re.findall(r"[\u3400-\u9fff]", paragraph)) for paragraph in paragraphs)


def paragraph_pinyin(text: str) -> str:
    pieces = lazy_pinyin(text, style=Style.TONE, neutral_tone_with_five=False, errors=lambda chars: chars)
    return " ".join(pieces).replace(" ，", "，").replace(" 。", "。").replace(" ：", "：").replace(" ；", "；").replace(" ？", "？").replace(" ！", "！")


def evidence_from(question: dict, paragraphs: list[str]) -> str:
    match = re.search(r"[“\"](.+?)[”\"]", question.get("explanation", ""))
    if match:
        return match.group(1)
    answer = question["options"][question["correctAnswer"]]
    for paragraph in paragraphs:
        if answer in paragraph:
            return paragraph
    return paragraphs[0]


def main() -> None:
    bank = json.loads(PATH.read_text(encoding="utf-8"))
    for article in bank["articles"]:
        level = article["level"]
        article["wordCount"] = han_count(article["paragraphs"])
        article["difficulty"] = DIFFICULTY[level]
        article["pinyin"] = [paragraph_pinyin(paragraph) for paragraph in article["paragraphs"]]
        pattern, explanation, example = GRAMMAR[level]
        article["grammar"] = [{"pattern": pattern, "explanation": explanation, "example": example}]
        for question in article["questions"]:
            question["evidence"] = evidence_from(question, article["paragraphs"])
        article["reviewStatus"] = "editorial-draft"
    bank["version"] = "reading-articles-v2-draft"
    bank["coverageNotice"] = "HSKKit-authored graded-reading drafts based on HSK 3.0 learning goals; not an official exam bank. Publication requires recorded human editorial approval."
    PATH.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"articles": len(bank["articles"]), "status": "editorial-draft", "path": str(PATH)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
