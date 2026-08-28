#!/usr/bin/env python3
"""Fail-closed release gate for the HSKKit HSK 1–9 listening library."""
from __future__ import annotations

import hashlib
import json
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BANK = json.loads((ROOT / "src/lib/learning/listening-library.json").read_text(encoding="utf-8"))
MANIFEST = json.loads((ROOT / "src/lib/learning/listening-library-audio.json").read_text(encoding="utf-8"))
TRUTH = json.loads((ROOT / "content/releases/hsk3-content-truth-v5.json").read_text(encoding="utf-8"))
EXPECTED_GROUPS = {1: 40, 2: 40, 3: 30, 4: 30, 5: 30, 6: 30, 7: 24, 8: 24, 9: 24}
EXPECTED_QUESTIONS = {1: 40, 2: 40, 3: 60, 4: 60, 5: 60, 6: 60, 7: 72, 8: 72, 9: 72}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"LISTENING_LIBRARY_INVALID: {message}")


groups = BANK["groups"]
assets = {asset["id"]: asset for asset in MANIFEST["assets"]}
truth = {entry["id"]: entry for entry in TRUTH["entries"]}
require(len(groups) == 272, "group count")
require(len(assets) == 272, "audio manifest count")
require(len({group["id"] for group in groups}) == 272, "duplicate group id")
require(Counter(group["level"] for group in groups) == Counter(EXPECTED_GROUPS), "per-level group counts")
question_counts = Counter()
for group in groups:
    level = group["level"]
    question_counts[level] += len(group["questions"])
    require(group["levelBand"] == ("7-9" if level >= 7 else str(level)), f"level band {group['id']}")
    require(group["authorizationStatus"] == "authorized" and group["qaStatus"] == "approved" and group["lifecycleStatus"] == "published", f"release state {group['id']}")
    source_id = group["sourceRef"].split(":", 1)[1]
    source = truth.get(source_id)
    if source is None:
        raise SystemExit(f"LISTENING_LIBRARY_INVALID: source missing {group['id']}")
    require(source["qa_status"] == "approved" and source["publish_status"] == "published", f"source not released {group['id']}")
    require(source["hanzi"] in group["voiceText"], f"source term absent from transcript {group['id']}")
    require(group["sourceLicense"] == source["license_ref"], f"source license mismatch {group['id']}")
    if level >= 7:
        minimum_discourse = {7: 30, 8: 48, 9: 65}[level]
        require(len(group["voiceText"]) >= minimum_discourse, f"advanced discourse too short {group['id']}")
        require(group["register"] == "formal", f"advanced register {group['id']}")
    for index, question in enumerate(group["questions"], 1):
        options = question["options"]
        require(len(options) == 4 and len(set(options.values())) == 4, f"options {group['id']} q{index}")
        require(question["correctAnswer"] in options, f"answer key {group['id']} q{index}")
        require(len(question["prompt"]) >= 15 and len(question["explanation"]) >= 10, f"question copy {group['id']} q{index}")
    asset = assets.get(group["id"])
    if asset is None:
        raise SystemExit(f"LISTENING_LIBRARY_INVALID: asset missing {group['id']}")
    require(asset["text"] == group["voiceText"], f"audio text mismatch {group['id']}")
    require(asset["authorization"]["status"] == "authorized", f"audio authorization {group['id']}")
    require(asset["contentQaStatus"] == "approved" and asset["technicalQaStatus"] == "approved" and asset["lifecycleStatus"] == "published", f"audio lifecycle {group['id']}")
    path = ROOT / "public" / asset["storageKey"]
    require(path.exists() and path.stat().st_size > 1000, f"audio file {group['id']}")
    require(hashlib.sha256(path.read_bytes()).hexdigest() == asset["checksumSha256"], f"checksum {group['id']}")
    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True)
    require(probe.returncode == 0 and float(probe.stdout.strip()) >= 0.5, f"decoding {group['id']}")
require(question_counts == Counter(EXPECTED_QUESTIONS), "per-level question counts")
first = groups[0]
require(first["level"] == 1 and first["voiceText"] == "买", "HSK 1 first truth")
require(any("mǎi" in question["explanation"] for question in first["questions"]), "mǎi correction")
require("tone pairs" not in first["title"].lower(), "misleading tone-pair label")
print(json.dumps({"status": "GO", "groups": len(groups), "questions": sum(question_counts.values()), "audio": len(assets), "levels": dict(sorted(question_counts.items()))}, ensure_ascii=False))
