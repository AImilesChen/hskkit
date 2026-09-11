#!/usr/bin/env python3
"""Release gate for the HSK 1–9 Reading article library.

A PASS is a publication claim. Drafts, missing executor-review evidence,
mechanically imbalanced questions, or audio without source-text provenance
must fail. The owner explicitly assigned the editorial first pass to the named
executor; this gate does not claim independent human approval.
"""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BANK_PATH = ROOT / "src/lib/learning/reading-articles.json"
MANIFEST_PATH = ROOT / "src/lib/learning/reading-article-audio-manifest.json"
BANK = json.loads(BANK_PATH.read_text(encoding="utf-8"))
ARTICLES = BANK["articles"]
ERRORS: list[str] = []
LENGTH_RANGES = {1: (80, 150), 2: (150, 250), 3: (250, 400), 4: (400, 650), 5: (650, 900), 6: (900, 1200), 7: (1200, 2000), 8: (1200, 2000), 9: (1200, 2000)}
MIN_PARAGRAPHS = {1: 2, 2: 3, 3: 4, 4: 4, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5}
MIN_VOCAB = {1: 8, 2: 8, 3: 8, 4: 10, 5: 10, 6: 10, 7: 12, 8: 12, 9: 12}


def require(ok: bool, message: str) -> None:
    if not ok:
        ERRORS.append(message)


def text_hash(article: dict) -> str:
    return hashlib.sha256("\n\n".join(article["paragraphs"]).encode("utf-8")).hexdigest()


require(len(ARTICLES) == 180, f"article count {len(ARTICLES)}")
require(len({article["slug"] for article in ARTICLES}) == len(ARTICLES), "duplicate slugs")
require(len({tuple(article["paragraphs"]) for article in ARTICLES}) == len(ARTICLES), "duplicate article bodies")
manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8")) if MANIFEST_PATH.exists() else {}
durations: list[float] = []

for level in range(1, 10):
    group = [article for article in ARTICLES if article["level"] == level]
    require(len(group) == 20, f"HSK {level}: {len(group)} articles")
    require(len({article["title"] for article in group}) == len(group), f"HSK {level}: duplicate titles")
    answer_distribution = Counter(question.get("correctAnswer") for article in group for question in article.get("questions", []))
    require(len(answer_distribution) >= 3, f"HSK {level}: correct answers use fewer than 3 option positions ({dict(answer_distribution)})")

for article in ARTICLES:
    prefix = article["slug"]
    level = article["level"]
    body = "".join(article.get("paragraphs", []))
    length = article.get("wordCount", len(body))
    minimum, maximum = LENGTH_RANGES[level]
    require(article.get("reviewStatus") == "first-pass-reviewed", f"{prefix}: no recorded executor editorial first pass")
    require(MIN_PARAGRAPHS[level] <= len(article.get("paragraphs", [])), f"{prefix}: needs at least {MIN_PARAGRAPHS[level]} paragraphs")
    require(minimum <= length <= maximum, f"{prefix}: {length} characters outside HSK {level} range {minimum}-{maximum}")
    require(len(article.get("translation", [])) == len(article.get("paragraphs", [])), f"{prefix}: translation mismatch")
    require(len(article.get("pinyin", [])) == len(article.get("paragraphs", [])), f"{prefix}: pinyin mismatch")
    require(len(article.get("vocabulary", [])) >= MIN_VOCAB[level], f"{prefix}: needs at least {MIN_VOCAB[level]} vocabulary items")
    require(all(word.get("hanzi") in body for word in article.get("vocabulary", [])), f"{prefix}: vocabulary absent from body")
    require(len(article.get("grammar", [])) >= 1, f"{prefix}: missing core grammar")
    require(len(article.get("questions", [])) == 3, f"{prefix}: question count")
    for question in article.get("questions", []):
        qid = question.get("id", "?")
        options = question.get("options", [])
        answer = question.get("correctAnswer")
        require(len(options) == 4 and len(set(options)) == 4, f"{prefix}/{qid}: invalid options")
        require(isinstance(answer, int) and 0 <= answer < 4, f"{prefix}/{qid}: answer index")
        evidence = question.get("evidence", "")
        require(bool(evidence) and evidence in body, f"{prefix}/{qid}: evidence is not in article")
        require(len(question.get("explanation", "")) >= 12, f"{prefix}/{qid}: explanation too short")
    audio_path = ROOT / "public" / article["audioSrc"].lstrip("/")
    require(audio_path.exists() and audio_path.stat().st_size > 1000, f"{prefix}: missing audio")
    manifest_item = manifest.get(prefix, {})
    require(manifest_item.get("textSha256") == text_hash(article), f"{prefix}: audio source-text hash missing or stale")
    if audio_path.exists():
        audio_hash = hashlib.sha256(audio_path.read_bytes()).hexdigest()
        require(manifest_item.get("audioSha256") == audio_hash, f"{prefix}: audio hash missing or stale")
        probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(audio_path)], capture_output=True, text=True)
        try:
            duration = float(probe.stdout.strip())
            durations.append(duration)
            require(duration > 2, f"{prefix}: short audio")
        except ValueError:
            ERRORS.append(f"{prefix}: invalid audio")

if ERRORS:
    print("\n".join(ERRORS[:160]), file=sys.stderr)
    print(json.dumps({"status": "FAIL", "errors": len(ERRORS), "articles": len(ARTICLES), "firstPassReviewed": sum(article.get("reviewStatus") == "first-pass-reviewed" for article in ARTICLES)}, ensure_ascii=False))
    raise SystemExit(1)

print(json.dumps({"status": "PASS", "articles": len(ARTICLES), "levels": dict(Counter(article["level"] for article in ARTICLES)), "audioFiles": len(durations), "audioSeconds": round(sum(durations), 1)}, ensure_ascii=False))
