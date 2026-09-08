#!/usr/bin/env python3
"""Build the deterministic HSKKit HSK 1–9 listening library and formal MP3 assets."""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import re
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[2]
TRUTH = ROOT / "content/releases/hsk3-content-truth-v5.json"
BANK = ROOT / "src/lib/learning/listening-library.json"
MANIFEST = ROOT / "src/lib/learning/listening-library-audio.json"
OUT = ROOT / "public/audio/listening-library"
VOICE = "zh-CN-XiaoxiaoNeural"
VERSION = "hskkit-listening-library-v2"
READING = ROOT / "src/lib/learning/reading-library.json"
AUDIO_COUNTS = {1: 40, 2: 40, 3: 30, 4: 30, 5: 30, 6: 30, 7: 24, 8: 24, 9: 24}
QUESTION_COUNTS = {1: 1, 2: 1, 3: 2, 4: 2, 5: 2, 6: 2, 7: 3, 8: 3, 9: 3}
LETTERS = "ABCD"


def short_meaning(value: str) -> str:
    original = value.strip()
    leading_note = re.match(r"^\(([^)]*)\)", original)
    value = re.sub(r"^\([^)]*\)\s*", "", original)
    value = re.split(r"[;（(]", value)[0].strip()
    if not value and leading_note:
        value = leading_note.group(1).strip()
    if not value:
        raise ValueError(f"empty abbreviated meaning: {original!r}")
    return value[:72].rstrip(" ,")


def normalized_entries() -> dict[int, list[dict]]:
    truth = json.loads(TRUTH.read_text(encoding="utf-8"))
    levels: dict[int, list[dict]] = {}
    for level in range(1, 7):
        levels[level] = [entry for entry in truth["entries"] if entry["level_band"] == str(level) and entry["qa_status"] == "approved" and entry["publish_status"] == "published"]
    advanced = [entry for entry in truth["entries"] if entry["level_band"] == "7-9" and entry["qa_status"] == "approved" and entry["publish_status"] == "published"]
    advanced = [entry for entry in advanced if 1 <= len(entry["hanzi"]) <= 8 and len(short_meaning(entry["meaning"])) >= 3]
    ranked = sorted(advanced, key=lambda entry: (len(entry["hanzi"]) * 9 + len(short_meaning(entry["meaning"])), entry["logical_id"]))
    windows = {7: (0.18, 0.42), 8: (0.48, 0.72), 9: (0.76, 0.98)}
    for level, (start, end) in windows.items():
        candidates = ranked[int(len(ranked) * start):int(len(ranked) * end)]
        step = max(1, len(candidates) // AUDIO_COUNTS[level])
        levels[level] = candidates[::step][:AUDIO_COUNTS[level]]
    # Preserve the corrected HSK 1 tone truth as the first released item.
    buy = next(entry for entry in levels[1] if entry["hanzi"] == "买" and entry["pinyin"] == "mǎi")
    levels[1] = [buy] + [entry for entry in levels[1] if entry["id"] != buy["id"]]
    return levels


def select_entries(levels: dict[int, list[dict]], level: int) -> list[dict]:
    values = levels[level]
    count = AUDIO_COUNTS[level]
    if level <= 6:
        # Spread selection across the canonical list instead of taking an alphabetic prefix.
        step = max(1, len(values) // count)
        selected = values[::step][:count]
        if level == 1:
            buy = values[0]
            selected = [buy] + [entry for entry in selected if entry["id"] != buy["id"]]
            if len(selected) < count:
                selected.append(next(entry for entry in values if entry["id"] not in {item["id"] for item in selected}))
            selected = selected[:count]
        return selected
    return values[:count]


def transcript(level: int, entry: dict, ordinal: int) -> tuple[str, str, str]:
    word = entry["hanzi"]
    if level <= 2:
        return word, "word-tone", "everyday"
    if level == 3:
        return f"今天要学习的关键词是“{word}”。请再听一遍，注意它的读音和意思。", "sentence", "everyday"
    if level == 4:
        return f"老师在材料中强调了“{word}”这个词，并请大家结合上下文理解它。", "sentence", "formal"
    if level == 5:
        return f"这段说明的关键词是“{word}”。发言人提醒听众，理解这个概念时既要注意定义，也要注意使用场景。", "paragraph", "formal"
    if level == 6:
        return f"报告把“{word}”列为需要重点核对的概念。发言人认为，只有明确它的含义，后续分析才不会偏离证据。", "context", "formal"
    modes = ordinal % 4
    if level == 7:
        texts = [
            f"讨论进入关键阶段时，发言人特别提到“{word}”。他建议先澄清这个概念，再比较不同方案。",
            f"有人把“{word}”视为唯一依据，但发言人提醒，单一概念不足以支持完整结论。",
            f"报告使用了“{word}”这个词。为了避免误解，主持人要求作者说明它在本次讨论中的具体含义。",
            f"两种观点都涉及“{word}”，但侧重点不同。发言人建议先确认共同定义，再讨论分歧。",
        ]
        return texts[modes], "longer-discourse", "formal"
    if level == 8:
        texts = [
            f"简报首先肯定现有数据的价值，随后把“{word}”列为仍需解释的关键概念。发言人认为，如果定义不清，表面一致的结果可能无法直接比较。",
            f"部分参与者主张以“{word}”作为主要判断标准。然而报告指出，指标本身也有适用边界，因此还需要结合背景与样本构成。",
            f"评审人注意到材料多次使用“{word}”，却没有给出统一定义。他建议补充操作标准，以便不同团队能够复核同一结论。",
            f"两个方案都谈到“{word}”，但一个强调短期效果，另一个关注长期影响。发言人提醒，比较之前必须先统一时间尺度。",
        ]
        return texts[modes], "formal-briefing", "formal"
    texts = [
        f"论证承认现有研究提供了重要线索，却把“{word}”视为尚未解决的核心概念。由于样本范围与观察周期都有限，发言人反对直接推广结论，并主张公开假设、补充证据后再复核。",
        f"有人建议把“{word}”作为政策成效的决定性指标。反方指出，单一指标可能掩盖影响如何分布，也无法解释长期变化。因此，最终建议是建立多维评估并持续公开数据。",
        f"报告在结论部分引用“{word}”，但没有说明复杂案例是否被排除。评审人认为，这个遗漏会削弱结果的可推广性，要求作者补充案例构成、执行成本与稳定性分析。",
        f"争议双方都接受“{word}”的重要性，却对它应当如何衡量存在分歧。主持人没有草率选择一方，而是要求先形成可复核定义，再用同一组证据比较两种主张。",
    ]
    return texts[modes], "formal-argument", "formal"


def rotated(correct: str, distractors: list[str], key: str) -> tuple[dict[str, str], str]:
    unique = list(dict.fromkeys(value for value in distractors if value != correct))
    values = [correct] + unique[:3]
    if len(values) != 4:
        raise ValueError(f"insufficient unique options: {key}")
    index = hashlib.sha256(key.encode()).digest()[0] % 4
    arranged = values[1:]
    arranged.insert(index, values[0])
    return dict(zip(LETTERS, arranged)), LETTERS[index]


def _sentences(value: str) -> list[str]:
    return [part.strip() + "。" for part in re.split(r"[。！？]", value) if part.strip()]


def _reading_question(source: dict, question_index: int, key: str, kind: str) -> dict:
    raw = source["questions"][question_index % len(source["questions"])]
    correct = raw["options"][raw["correctAnswer"]]
    distractors = [value for code, value in raw["options"].items() if code != raw["correctAnswer"]]
    distractors.append("录音没有提到这项内容")
    options, answer = rotated(correct, distractors, key)
    return {"kind": kind, "prompt": raw["prompt"], "options": options, "correctAnswer": answer, "explanation": raw["explanation"], "weaknessTag": f"listening-{kind}"}


def _title_question(source: dict, alternatives: list[dict], key: str, kind: str = "main-idea") -> dict:
    options, answer = rotated(source["title"], [item["title"] for item in alternatives], key)
    return {"kind": kind, "prompt": "Which title best matches the recording?", "options": options, "correctAnswer": answer, "explanation": f"The recording is about {source['title']}.", "weaknessTag": f"listening-{kind}"}


def build_bank() -> dict:
    levels = normalized_entries()
    reading = json.loads(READING.read_text(encoding="utf-8"))["passages"]
    groups: list[dict] = []
    kind_cycle = ["detail", "place", "time", "reason", "sequence", "purpose", "speaker-intent", "attitude"]
    for level in range(1, 10):
        passages = [item for item in reading if item["level"] == level]
        entries = select_entries(levels, level)
        count = AUDIO_COUNTS[level]
        for ordinal in range(1, count + 1):
            group_id = f"hsk{level}-{ordinal:03d}"
            questions: list[dict] = []
            if level <= 2 and ordinal <= 20:
                entry = entries[ordinal - 1]
                text = entry["hanzi"]
                alternatives = [entries[(ordinal - 1 + offset) % len(entries)] for offset in range(1, 4)]
                if ordinal % 4 == 1:
                    correct, wrong, prompt, kind = entry["pinyin"], [item["pinyin"] for item in alternatives], "Which pinyin matches what you hear?", "tone"
                elif ordinal % 4 == 2:
                    correct, wrong, prompt, kind = short_meaning(entry["meaning"]), [short_meaning(item["meaning"]) for item in alternatives], "What does the word in the recording mean?", "word-meaning"
                elif ordinal % 4 == 3:
                    correct, wrong, prompt, kind = entry["hanzi"], [item["hanzi"] for item in alternatives], "Which written word matches the recording?", "word-recognition"
                else:
                    correct, wrong, prompt, kind = entry["pinyin"], [item["pinyin"] for item in alternatives], "Which pronunciation has the same syllable and tone?", "sound-discrimination"
                options, answer = rotated(correct, wrong, f"{group_id}:{kind}")
                questions.append({"kind": kind, "prompt": prompt, "options": options, "correctAnswer": answer, "explanation": f"The recording says {entry['hanzi']} ({entry['pinyin']}), meaning “{short_meaning(entry['meaning'])}.”", "weaknessTag": f"listening-{kind}"})
                source_ref, source_license, training_type, register = f"hsk3-content-truth-v5:{entry['id']}", entry["license_ref"], "word-recognition", "everyday"
            else:
                source = passages[(ordinal - 1) % len(passages)]
                alternatives = []
                for offset in range(1, len(passages)):
                    candidate = passages[(ordinal - 1 + offset) % len(passages)]
                    if candidate["title"] != source["title"] and candidate["title"] not in {item["title"] for item in alternatives}:
                        alternatives.append(candidate)
                    if len(alternatives) == 3:
                        break
                cycle = (ordinal - 1) // len(passages)
                sentences = _sentences(source["passage"])
                if cycle == 0:
                    text = source["passage"]
                else:
                    text = f"先说：{sentences[-1]}再说：{sentences[0]}" if level <= 2 else f"录音先引用材料末尾的信息：{sentences[-1]}随后回顾开头：{sentences[0]}"
                desired = QUESTION_COUNTS[level]
                kind = kind_cycle[(ordinal - 1) % len(kind_cycle)]
                if cycle == 0:
                    questions.append(_title_question(source, alternatives, f"{group_id}:title", "main-idea" if kind == "detail" else kind))
                    if desired >= 2:
                        questions.append(_reading_question(source, ordinal, f"{group_id}:detail", kind_cycle[(ordinal + 2) % len(kind_cycle)]))
                    if desired >= 3:
                        questions.append(_reading_question(source, ordinal + 1, f"{group_id}:intent", kind_cycle[(ordinal + 5) % len(kind_cycle)]))
                else:
                    first_distractors = []
                    last_distractors = []
                    for item in passages:
                        first_value = _sentences(item["passage"])[-1]
                        last_value = _sentences(item["passage"])[0]
                        if first_value != sentences[-1] and first_value not in first_distractors:
                            first_distractors.append(first_value)
                        if last_value != sentences[0] and last_value not in last_distractors:
                            last_distractors.append(last_value)
                    first_options, first_answer = rotated(sentences[-1], first_distractors, f"{group_id}:first")
                    questions.append({"kind": "sequence", "prompt": "What information is mentioned first in the recording?", "options": first_options, "correctAnswer": first_answer, "explanation": f"The recording begins with: {sentences[-1]}", "weaknessTag": "listening-sequence"})
                    if desired >= 2:
                        last_options, last_answer = rotated(sentences[0], last_distractors, f"{group_id}:last")
                        questions.append({"kind": "detail", "prompt": "What background information follows?", "options": last_options, "correctAnswer": last_answer, "explanation": f"The background information is: {sentences[0]}", "weaknessTag": "listening-detail"})
                    if desired >= 3:
                        questions.append(_title_question(source, alternatives, f"{group_id}:title", "main-idea"))
                source_ref, source_license = source["sourceRef"], source["sourceLicense"]
                training_type = "short-utterance" if level <= 2 else "dialogue-and-notice" if level <= 4 else "contextual-report" if level <= 6 else "extended-discourse"
                register = "everyday" if level <= 3 else "formal"
            assert len(questions) == QUESTION_COUNTS[level]
            groups.append({
                "id": group_id, "level": level, "levelBand": "7-9" if level >= 7 else str(level),
                "title": f"HSK {level} listening set {ordinal}", "trainingType": training_type, "register": register,
                "voiceText": text, "audioSrc": f"/audio/listening-library/v2/{group_id}.mp3",
                "sourceRef": source_ref, "sourceLicense": source_license,
                "audioDisclosure": "AI-synthesized Mandarin audio; not a human or official HSK recording.",
                "authorizationStatus": "authorized", "qaStatus": "approved", "lifecycleStatus": "published",
                "questions": questions,
            })
    return {"version": VERSION, "label": "HSKKit levelled listening practice library", "coverageNotice": "HSKKit-authored practice based on the HSK 3.0 standard; audio is transparently AI-synthesized and is not an official HSK recording.", "groups": groups}


async def generate_audio(groups: list[dict], force: bool) -> list[dict]:
    OUT.mkdir(parents=True, exist_ok=True)
    previous_assets = {}
    if MANIFEST.exists():
        previous_assets = {item["id"]: item for item in json.loads(MANIFEST.read_text(encoding="utf-8")).get("assets", [])}
    semaphore = asyncio.Semaphore(8)
    async def make(group: dict) -> dict:
        path = ROOT / "public" / group["audioSrc"].lstrip("/")
        path.parent.mkdir(parents=True, exist_ok=True)
        storage_key = str(path.relative_to(ROOT / "public"))
        previous = previous_assets.get(group["id"], {})
        async with semaphore:
            reusable = (
                path.exists()
                and path.stat().st_size >= 1000
                and previous.get("text") == group["voiceText"]
                and previous.get("voice") == VOICE
                and previous.get("rate") == "-8%"
                and previous.get("storageKey") == storage_key
                and previous.get("checksumSha256") == hashlib.sha256(path.read_bytes()).hexdigest()
            )
            if force or not reusable:
                await edge_tts.Communicate(group["voiceText"], VOICE, rate="-8%").save(str(path))
        probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True, check=True)
        duration = round(float(probe.stdout.strip()), 3)
        if duration < 0.5 or path.stat().st_size < 1000:
            raise RuntimeError(f"invalid audio: {path}")
        return {"id": group["id"], "storageKey": storage_key, "text": group["voiceText"], "voice": VOICE, "rate": "-8%", "checksumSha256": hashlib.sha256(path.read_bytes()).hexdigest(), "durationSeconds": duration, "authorization": {"status": "authorized", "license": "HSKKit streaming audio license v1", "evidenceUrl": "https://hskkit.com/content-license"}, "contentQaStatus": "approved", "technicalQaStatus": "approved", "lifecycleStatus": "published"}
    return await asyncio.gather(*(make(group) for group in groups))


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", action="store_true")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    bank = build_bank()
    BANK.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    result = {"groups": len(bank["groups"]), "questions": sum(len(group["questions"]) for group in bank["groups"]), "bank": str(BANK)}
    if args.audio:
        assets = await generate_audio(bank["groups"], args.force)
        MANIFEST.write_text(json.dumps({"version": VERSION, "assets": assets}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        result.update({"audio": len(assets), "manifest": str(MANIFEST)})
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
