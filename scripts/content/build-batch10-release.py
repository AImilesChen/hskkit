#!/usr/bin/env python3
import json
from pathlib import Path

path = Path("src/lib/content/catalog.json")
repo = json.loads(path.read_text())
if any(r["id"] == "hsk3-batch10-content-audio-v3" for r in repo["releases"]):
    raise SystemExit("batch10 release already exists")

def editorial(asset_id, logical_id, level, kind, payload):
    return {
        "id": asset_id,
        "logicalId": logical_id,
        "standard": "hsk3",
        "level": level,
        "kind": kind,
        "version": 1,
        "standard_version": "GF0025-2021",
        "level_band": "7-9" if level >= 7 else str(level),
        "content_version": "2026.08.22-batch10",
        "source_ref": "hskkit-editorial-batch10",
        "license_ref": "HSKKit-original-editorial-v1",
        "qa_status": "approved",
        "publish_status": "published",
        "payload": payload,
        "source": {"name": "HSKKit original editorial content", "url": "https://hskkit.com/content-license"},
        "authorization": {"status": "authorized", "license": "HSKKit original editorial license v1", "evidenceUrl": "https://hskkit.com/content-license"},
        "qaStatus": "approved",
    }

new_content = [
    editorial("hsk3.grammar.ba-sentence-basics.v1", "hsk3.grammar.ba-sentence-basics", 3, "grammar", {"title": "The 把 sentence: object before the action", "explanation": "Use 把 when a known object is changed, moved or otherwise affected.", "pattern": "Subject + 把 + object + verb + result"}),
    editorial("hsk3.grammar.comparison-with-bi.v1", "hsk3.grammar.comparison-with-bi", 2, "grammar", {"title": "Comparing with 比", "explanation": "Place 比 between the two things being compared.", "pattern": "A + 比 + B + adjective"}),
    editorial("hsk3.reading.morning-study-routine.v1", "hsk3.reading.morning-study-routine", 3, "reading", {"title": "A focused morning routine", "text": "每天早上，林月先复习十个生词，再听十五分钟中文。她把不懂的句子写在本子上，晚上再看一遍。", "translation": "Every morning, Lin Yue reviews ten new words and listens to Chinese. She writes unfamiliar sentences down and reviews them at night."}),
    editorial("hsk3.reading.weekend-travel-plan.v1", "hsk3.reading.weekend-travel-plan", 2, "reading", {"title": "Choosing a weekend trip", "text": "王明周末想去杭州。火车比汽车快，也更准时。他决定星期六早上坐火车去，星期天下午回来。", "translation": "Wang Ming chooses the train for a weekend trip because it is faster and more punctual."}),
    editorial("hsk3.sentence.pronunciation-practice.v1", "hsk3.sentence.pronunciation-practice", 2, "sentence", {"text": "老师让我们练习发音。", "pinyin": "Lǎoshī ràng wǒmen liànxí fāyīn.", "translation": "The teacher asks us to practise pronunciation."}),
]
repo["contentAssets"].extend(new_content)

word = next(a for a in repo["contentAssets"] if a["kind"] == "word" and a["standard"] == "hsk3" and a["payload"].get("hanzi") == "买")

def audio(asset_id, logical_id, content_asset_id, level, kind, storage_key, checksum, speed):
    return {
        "id": asset_id,
        "logicalId": logical_id,
        "contentAssetId": content_asset_id,
        "standard": "hsk3",
        "level": level,
        "version": 1,
        "storageKey": storage_key,
        "checksumSha256": checksum,
        "locale": "zh-CN",
        "voice": "Microsoft zh-CN-XiaoxiaoNeural",
        "speed": speed,
        "audioKind": kind,
        "publishedAt": "2026-08-22T06:30:00.000Z",
        "issueReportPath": "/api/v1/content/audio/report",
        "usageRights": {"streaming": True, "caching": True, "offlineRedistribution": False},
        "source": {"name": "HSKKit-authored script synthesized for HSKKit", "url": "https://hskkit.com/content-license"},
        "authorization": {"status": "authorized", "license": "HSKKit streaming audio license v1", "evidenceUrl": "https://hskkit.com/content-license"},
        "qaStatus": "approved",
    }

new_audio = [
    audio("hsk3.audio.word-mai.v1", "hsk3.audio.word-mai", word["id"], 1, "word", "audio/formal/word-mai-v1.mp3", "70d49b4ef938ada84c861ea52247275b7b5e1a0213a6f829b3ac82ea18e0a6a6", 0.88),
    audio("hsk3.audio.sentence-pronunciation.v1", "hsk3.audio.sentence-pronunciation", "hsk3.sentence.pronunciation-practice.v1", 2, "sentence", "audio/formal/sentence-pronunciation-v1.mp3", "6f3fe57ba083310807d56d2b6b7af1b8d6b76adaadb5dba849a8fdd1b8366f88", 0.90),
    audio("hsk3.audio.context-morning-study.v1", "hsk3.audio.context-morning-study", "hsk3.reading.morning-study-routine.v1", 3, "context", "audio/formal/context-morning-study-v1.mp3", "8b53e6661bc7cdabd6050d5fbe00f0407708b314e8371ad0797431ca99c90290", 0.92),
]
repo["audioAssets"].extend(new_audio)
previous = repo["activeReleaseByStandard"]["hsk3"]
previous_release = next(r for r in repo["releases"] if r["id"] == previous)
repo["releases"].append({
    "id": "hsk3-batch10-content-audio-v3",
    "standard": "hsk3",
    "version": 3,
    "status": "published",
    "contentAssetIds": previous_release["contentAssetIds"] + [a["id"] for a in new_content],
    "audioAssetIds": [a["id"] for a in new_audio],
    "publishedAt": "2026-08-22T06:30:00.000Z",
})
repo["releaseEvents"].append({
    "action": "publish",
    "releaseId": "hsk3-batch10-content-audio-v3",
    "standard": "hsk3",
    "at": "2026-08-22T06:30:00.000Z",
    "previousActiveReleaseId": previous,
})
repo["activeReleaseByStandard"]["hsk3"] = "hsk3-batch10-content-audio-v3"
path.write_text(json.dumps(repo, ensure_ascii=False, separators=(",", ":")) + "\n")
print(json.dumps({"release": repo["activeReleaseByStandard"]["hsk3"], "content": len(repo["contentAssets"]), "audio": len(repo["audioAssets"])}))
