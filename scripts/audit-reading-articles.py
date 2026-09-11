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
import re
import subprocess
import sys
from collections import Counter
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BANK_PATH = ROOT / "src/lib/learning/reading-articles.json"
MANIFEST_PATH = ROOT / "src/lib/learning/reading-article-audio-manifest.json"
EDITORIAL_MANIFEST_PATH = ROOT / "src/lib/learning/reading-article-editorial-manifest.json"
CONTENT_ONLY = "--content-only" in sys.argv[1:]
BANK = json.loads(BANK_PATH.read_text(encoding="utf-8"))
ARTICLES = BANK["articles"]
ERRORS: list[str] = []
LENGTH_RANGES = {1: (80, 150), 2: (120, 220), 3: (200, 350), 4: (350, 550), 5: (550, 800), 6: (800, 1200), 7: (1200, 1800), 8: (1600, 2400), 9: (2000, 3000)}
MIN_PARAGRAPHS = {1: 2, 2: 3, 3: 4, 4: 4, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5}
MIN_VOCAB = {1: 8, 2: 8, 3: 8, 4: 10, 5: 10, 6: 10, 7: 12, 8: 12, 9: 12}


def require(ok: bool, message: str) -> None:
    if not ok:
        ERRORS.append(message)


def text_hash(article: dict) -> str:
    return hashlib.sha256("\n\n".join(article["paragraphs"]).encode("utf-8")).hexdigest()


def audio_text_hash(article: dict) -> str:
    source = f"{article['title']}。" + "\n".join(article["paragraphs"])
    return hashlib.sha256(source.encode("utf-8")).hexdigest()


require(len(ARTICLES) == 180, f"article count {len(ARTICLES)}")
require(len({article["slug"] for article in ARTICLES}) == len(ARTICLES), "duplicate slugs")
require(len({tuple(article["paragraphs"]) for article in ARTICLES}) == len(ARTICLES), "duplicate article bodies")
require(len({article["title"] for article in ARTICLES}) == len(ARTICLES), "titles must identify 180 independent articles")

sentence_owners: dict[str, set[str]] = {}
for article in ARTICLES:
    for sentence in re.split(r"[。！？!?]", "".join(article.get("paragraphs", []))):
        normalized = re.sub(r"[\s“”‘’《》：，、；]", "", sentence)
        if len(normalized) >= 18:
            sentence_owners.setdefault(normalized, set()).add(article["slug"])
for sentence, owners in sentence_owners.items():
    require(len(owners) <= 3, f"stock sentence reused by {len(owners)} articles: {sentence[:42]}")

SIMILARITY_LIMITS = {1: 0.80, 2: 0.76, 3: 0.72, 4: 0.69, 5: 0.65, 6: 0.62, 7: 0.60, 8: 0.59, 9: 0.58}
for left_index, left in enumerate(ARTICLES):
    left_body = re.sub(r"\s", "", "".join(left.get("paragraphs", [])))
    for right in ARTICLES[left_index + 1:]:
        right_body = re.sub(r"\s", "", "".join(right.get("paragraphs", [])))
        similarity = SequenceMatcher(None, left_body, right_body, autojunk=False).ratio()
        limit = max(SIMILARITY_LIMITS[left["level"]], SIMILARITY_LIMITS[right["level"]])
        require(similarity < limit, f"near-duplicate articles {left['slug']} / {right['slug']}: {similarity:.3f} >= {limit:.2f}")

question_prompts = [question.get("prompt", "") for article in ARTICLES for question in article.get("questions", [])]
require(len(set(question_prompts)) >= 360, f"only {len(set(question_prompts))} unique prompts across {len(question_prompts)} questions")
manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8")) if MANIFEST_PATH.exists() else {}
editorial_manifest = json.loads(EDITORIAL_MANIFEST_PATH.read_text(encoding="utf-8")) if EDITORIAL_MANIFEST_PATH.exists() else {}
editorial_items = {item.get("slug"): item for item in editorial_manifest.get("articles", [])}
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
    editorial_item = editorial_items.get(prefix, {})
    require(editorial_item.get("editorialPass") is True, f"{prefix}: editorial pass missing from frozen manifest")
    require(editorial_item.get("textSha256") == text_hash(article), f"{prefix}: frozen editorial text hash missing or stale")
    require(article.get("contentTextSha256") == text_hash(article), f"{prefix}: article frozen text hash missing or stale")
    require(MIN_PARAGRAPHS[level] <= len(article.get("paragraphs", [])), f"{prefix}: needs at least {MIN_PARAGRAPHS[level]} paragraphs")
    require(minimum <= length <= maximum, f"{prefix}: {length} characters outside HSK {level} range {minimum}-{maximum}")
    require(len(article.get("translation", [])) == len(article.get("paragraphs", [])), f"{prefix}: translation mismatch")
    require(all(not re.search(r"[\u4e00-\u9fff]", text) for text in article.get("translation", [])), f"{prefix}: translation contains untranslated Chinese")
    require(len(article.get("pinyin", [])) == len(article.get("paragraphs", [])), f"{prefix}: pinyin mismatch")
    require(len(article.get("vocabulary", [])) >= MIN_VOCAB[level], f"{prefix}: needs at least {MIN_VOCAB[level]} vocabulary items")
    require(all(word.get("hanzi") in body for word in article.get("vocabulary", [])), f"{prefix}: vocabulary absent from body")
    require(len(article.get("grammar", [])) >= 1, f"{prefix}: missing core grammar")
    require(all(item.get("example") in body for item in article.get("grammar", [])), f"{prefix}: grammar example is not grounded in article")
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
    if not CONTENT_ONLY:
        audio_path = ROOT / "public" / article["audioSrc"].lstrip("/")
        require(audio_path.exists() and audio_path.stat().st_size > 1000, f"{prefix}: missing audio")
        manifest_item = manifest.get(prefix, {})
        require(manifest_item.get("textSha256") == audio_text_hash(article), f"{prefix}: audio source-text hash missing or stale")
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

print(json.dumps({"status": "PASS", "mode": "content-only" if CONTENT_ONLY else "release", "articles": len(ARTICLES), "levels": dict(Counter(article["level"] for article in ARTICLES)), "audioFiles": len(durations), "audioSeconds": round(sum(durations), 1)}, ensure_ascii=False))
