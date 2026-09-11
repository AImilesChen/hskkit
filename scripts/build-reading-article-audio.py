from __future__ import annotations

import asyncio
import hashlib
import json
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
BANK_PATH = ROOT / "src/lib/learning/reading-articles.json"
MANIFEST_PATH = ROOT / "src/lib/learning/reading-article-audio-manifest.json"
OUT = ROOT / "public/audio/reading-articles/v1"
OUT.mkdir(parents=True, exist_ok=True)
BANK = json.loads(BANK_PATH.read_text(encoding="utf-8"))
OLD_MANIFEST = json.loads(MANIFEST_PATH.read_text(encoding="utf-8")) if MANIFEST_PATH.exists() else {}
SEM = asyncio.Semaphore(4)


def text_for(article: dict) -> str:
    return f"{article['title']}。" + "\n".join(article["paragraphs"])


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


async def one(article: dict) -> tuple[str, dict]:
    slug = article["slug"]
    text = text_for(article)
    text_sha = sha("\n\n".join(article["paragraphs"]).encode("utf-8"))
    path = OUT / article["audioSrc"].rsplit("/", 1)[-1]
    old = OLD_MANIFEST.get(slug, {})
    if path.exists() and path.stat().st_size > 1000 and old.get("textSha256") == text_sha:
        audio_sha = sha(path.read_bytes())
        if old.get("audioSha256") == audio_sha:
            return "reused", old
    async with SEM:
        temp = path.with_suffix(".tmp.mp3")
        for attempt in range(4):
            try:
                if temp.exists():
                    temp.unlink()
                await edge_tts.Communicate(text, "zh-CN-XiaoxiaoNeural", rate="-8%").save(str(temp))
                if not temp.exists() or temp.stat().st_size <= 1000:
                    raise RuntimeError("audio too small")
                temp.replace(path)
                item = {
                    "textSha256": text_sha,
                    "audioSha256": sha(path.read_bytes()),
                    "voice": "zh-CN-XiaoxiaoNeural",
                    "rate": "-8%",
                    "engine": "Microsoft Edge TTS",
                    "sourceLicense": "HSKKit original editorial content; synthesized narration",
                    "qaStatus": "generated-for-final-text",
                }
                return "generated", item
            except Exception:
                if attempt == 3:
                    raise
                await asyncio.sleep(2 ** attempt)
    raise AssertionError("unreachable")


async def main() -> None:
    results = await asyncio.gather(*(one(article) for article in BANK["articles"]))
    manifest = {article["slug"]: item for article, (_, item) in zip(BANK["articles"], results)}
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    states = [state for state, _ in results]
    print(json.dumps({"total": len(states), "generated": states.count("generated"), "reused": states.count("reused"), "manifest": str(MANIFEST_PATH)}, ensure_ascii=False))


asyncio.run(main())
