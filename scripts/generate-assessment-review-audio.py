#!/usr/bin/env python3
"""Build review-only Assessment Pack narration from the live TypeScript source.

Run only AFTER mock-assessment-content.ts edits are finalized. Nothing is written to
repository assets: --out-dir is mandatory; approve/copy assets separately.

Prerequisites: Node >=22 with TypeScript type stripping, Piper CLI, ffmpeg,
zh_CN-chaowen-medium.onnx plus its same-name .onnx.json config. Example:
  python3 scripts/generate-assessment-review-audio.py \
    --model /path/to/zh_CN-chaowen-medium.onnx \
    --out-dir /tmp/assessment-review-audio

The form transcript comes directly from assessmentListeningScript(form), never from
old assets/audio/*.txt. Each line is synthesized separately. Exactly five seconds
of PCM silence follows EVERY numbered question; no other artificial silence is
inserted. The level MP3s are optional review aids, not part of the current ZIP.
"""

import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import wave

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/lib/commercial/mock-assessment-content.ts"
START = re.compile(r"^现在开始第([1-9])级听力。$")
QUESTION = re.compile(r"^第([1-5])题。")
END = "本级听力结束。"


def run(args, *, input_text=None):
    result = subprocess.run(args, input=input_text, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(f"{' '.join(map(str, args))} failed:\n{result.stderr[-3000:]}")
    return result.stdout


def source_scripts(node):
    js = ("import {assessmentListeningScript} from './src/lib/commercial/mock-assessment-content.ts';"
          "console.log(JSON.stringify(Object.fromEntries(['A','B','C'].map(f=>[f,assessmentListeningScript(f)]))));")
    scripts = json.loads(run([node, "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--input-type=module", "-e", js]))
    sections = {}
    for form, text in scripts.items():
        lines = text.split("\n")
        if len(lines) != 73 or not lines[0].strip():
            raise ValueError(f"Form {form}: expected intro + nine 8-line levels; got {len(lines)} lines")
        levels = []
        for level in range(1, 10):
            block = lines[1 + (level - 1) * 8:1 + level * 8]
            if not START.fullmatch(block[0]) or int(START.fullmatch(block[0]).group(1)) != level:
                raise ValueError(f"Form {form}: invalid level {level} heading")
            if not block[1].strip() or block[-1] != END:
                raise ValueError(f"Form {form}: invalid level {level} passage/end")
            for number, question in enumerate(block[2:7], 1):
                match = QUESTION.match(question)
                if not match or int(match.group(1)) != number:
                    raise ValueError(f"Form {form} level {level}: expected question {number}")
            levels.append(block)
        sections[form] = (text, lines[0], levels)
    if set(sections) != {"A", "B", "C"}:
        raise ValueError("Expected precisely forms A/B/C")
    return sections


def synthesize(piper, model, text, wav_path):
    run([piper, "--model", str(model), "--output_file", str(wav_path)], input_text=text + "\n")
    with wave.open(str(wav_path), "rb") as wav:
        if wav.getcomptype() != "NONE" or wav.getnframes() == 0:
            raise ValueError(f"Piper returned invalid or empty PCM WAV: {wav_path}")
        params = (wav.getnchannels(), wav.getsampwidth(), wav.getframerate())
        frames = wav.readframes(wav.getnframes())
    return params, frames


def encode(ffmpeg, wav_path, mp3_path):
    run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav_path),
         "-codec:a", "libmp3lame", "-b:a", "96k", str(mp3_path)])
    if mp3_path.stat().st_size < 1000:
        raise RuntimeError(f"MP3 unexpectedly small: {mp3_path}")


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--model", type=Path, required=True, help="Local zh_CN-chaowen-medium.onnx (with adjacent .onnx.json)")
    parser.add_argument("--out-dir", type=Path, required=True, help="Review staging directory outside the repository")
    parser.add_argument("--piper", default="piper")
    parser.add_argument("--ffmpeg", default="ffmpeg")
    parser.add_argument("--node", default="node")
    parser.add_argument("--form", choices=("A", "B", "C"), help="Synthesize one form to a separate empty staging directory; merge only after all three complete")
    parser.add_argument("--no-level-tracks", action="store_true", help="Produce only the three full-form MP3s")
    parser.add_argument("--check", action="store_true", help="Validate inputs and live TS script; do not synthesize or write")
    args = parser.parse_args()
    model = args.model.resolve()
    output = args.out_dir.resolve()
    if not model.is_file() or not Path(str(model) + ".json").is_file():
        parser.error("Piper model and adjacent <model>.json config must both exist")
    if model.name != "zh_CN-chaowen-medium.onnx":
        parser.error("Use zh_CN-chaowen-medium.onnx to match the ZIP's voice provenance notice")
    if output == ROOT or ROOT in output.parents:
        parser.error("--out-dir must be outside the repository (review staging only)")
    for program in (args.piper, args.ffmpeg, args.node):
        if not shutil.which(program):
            parser.error(f"Executable not found: {program}")
    sections = source_scripts(args.node)
    if args.form:
        sections = {args.form: sections[args.form]}
    print(f"Validated {len(sections)} live scripts, 9 levels/form, 5 questions/level; source SHA-256 {digest(SOURCE.read_bytes())}", flush=True)
    if args.check:
        return
    if output.exists() and any(output.iterdir()):
        parser.error("--out-dir must be empty or nonexistent to prevent stale/mixed deliverables")
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="assessment-pcm-") as tmp:
        tmpdir = Path(tmp)
        manifest = {"source": str(SOURCE.relative_to(ROOT)), "sourceSha256": digest(SOURCE.read_bytes()),
                    "model": model.name, "modelSha256": digest(model.read_bytes()),
                    "modelConfigSha256": digest(Path(str(model) + ".json").read_bytes()),
                    "pauseSecondsPerQuestion": 5, "timestampBasis": "PCM sample offsets before MP3 encoding; allow encoder delay/rounding (~0.03 s)",
                    "forms": {}}
        for form, (text, intro, levels) in sections.items():
            (output / f"form-{form}.txt").write_text(text, encoding="utf-8")
            reference = None
            cursor = 0
            clips = []
            level_tracks = []
            index = []
            for level, block in enumerate(levels, 1):
                starts = []
                if level == 1:
                    utterances = [("intro", intro, None)]
                else:
                    utterances = []
                utterances.extend([("heading", block[0], level), ("passage", block[1], level)])
                utterances.extend(("question", q, level) for q in block[2:7])
                utterances.append(("end", block[7], level))
                level_frames = []
                for kind, utterance, _ in utterances:
                    wav_path = tmpdir / f"{form}-{level}-{len(starts)}.wav"
                    params, frames = synthesize(args.piper, model, utterance, wav_path)
                    if reference is None:
                        reference = params
                        silence = bytes(params[0] * params[1] * params[2] * 5)
                    if params != reference:
                        raise ValueError(f"Piper audio format changed within form {form}: {params} != {reference}")
                    start = cursor / reference[2]
                    cursor += len(frames) // (reference[0] * reference[1])
                    clip = {"kind": kind, "startSeconds": round(start, 3),
                            "speechEndSeconds": round(cursor / reference[2], 3), "text": utterance}
                    clips.append(frames)
                    level_frames.append(frames)
                    if kind == "question":
                        clips.append(silence)
                        level_frames.append(silence)
                        cursor += reference[2] * 5
                        clip["pauseEndSeconds"] = round(cursor / reference[2], 3)
                    starts.append(clip)
                level_start = starts[0]["startSeconds"]
                index.append({"level": level, "startSeconds": level_start,
                              "endSeconds": round(cursor / reference[2], 3), "segments": starts})
                if not args.no_level_tracks:
                    wav_path = tmpdir / f"form-{form}-level-{level}.wav"
                    with wave.open(str(wav_path), "wb") as wav:
                        wav.setnchannels(reference[0]); wav.setsampwidth(reference[1]); wav.setframerate(reference[2])
                        wav.writeframes(b"".join(level_frames))
                    mp3 = output / f"form-{form}-level-{level}.mp3"
                    encode(args.ffmpeg, wav_path, mp3)
                    level_tracks.append({"level": level, "file": mp3.name, "sha256": digest(mp3.read_bytes()),
                                         "startsAtSecondsInFullForm": level_start})
            wav_path = tmpdir / f"form-{form}.wav"
            with wave.open(str(wav_path), "wb") as wav:
                wav.setnchannels(reference[0]); wav.setsampwidth(reference[1]); wav.setframerate(reference[2])
                wav.writeframes(b"".join(clips))
            mp3 = output / f"form-{form}.mp3"
            encode(args.ffmpeg, wav_path, mp3)
            manifest["forms"][form] = {"file": mp3.name, "sha256": digest(mp3.read_bytes()),
                                      "transcriptSha256": digest(text.encode("utf-8")),
                                      "durationSecondsPcm": round(cursor / reference[2], 3),
                                      "sampleRate": reference[2], "levels": index, "levelTracks": level_tracks}
            print(f"{form}: {mp3} ({cursor / reference[2]:.3f} s PCM; 45 five-second pauses)", flush=True)
        if digest(SOURCE.read_bytes()) != manifest["sourceSha256"]:
            raise RuntimeError("Source TS changed during synthesis; discard this staging directory and rerun")
        (output / "timing-index.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Review index: {output / 'timing-index.json'}", flush=True)


if __name__ == "__main__":
    main()
