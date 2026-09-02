#!/usr/bin/env python3
"""Build the bounded content snapshot used by request-time Worker modules.

The complete catalog remains the authoring/validation source of truth. Runtime
routes receive only level summaries, the first 120 eligible words per level,
the small curated dictionary set and the active audio manifest. This keeps the
11K-asset repository out of the OpenNext Worker while preserving current route
outputs and pack/practice limits.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

CURATED_HANZI = {
    "学习", "旅行", "习惯", "环境", "经验", "交流", "责任", "改善",
    "趋势", "贡献", "资源", "倡导",
    # Grocery Shopping is the frozen P1 sample. Keep all 30 verified words in
    # the bounded runtime snapshot so Topics, Dictionary, Today and Review use
    # the same released content records.
    "商店", "超市", "购物", "买", "卖", "需要", "水果", "蔬菜", "苹果", "牛奶",
    "新鲜", "价格", "价钱", "便宜", "贵", "多少", "钱", "公斤", "斤", "瓶",
    "打折", "现金", "信用卡", "支付", "收据", "排队", "塑料袋", "发票", "总共", "会员",
}


def runtime_word(asset: dict) -> dict:
    payload = asset["payload"]
    return {
        "id": asset["id"],
        "logicalId": asset["logicalId"],
        "version": asset["version"],
        "contentVersion": asset.get("content_version") or f"asset-v{asset['version']}",
        "standardVersion": asset.get("standard_version") or "GF0025-2021",
        "level": asset["level"],
        "hanzi": str(payload.get("hanzi", "")),
        "pinyin": str(payload.get("pinyin", "")),
        "meaning": str(payload.get("meaning", "")),
        "partOfSpeech": str(payload.get("partOfSpeech", "")),
        "levelBand": str(asset.get("level_band") or asset["level"]),
        "sourceRef": str(asset.get("source_ref") or ""),
        "licenseRef": str(asset.get("license_ref") or ""),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", default="src/lib/content/catalog.json")
    parser.add_argument("--output", default="src/lib/content/runtime-content-index.json")
    parser.add_argument("--runtime-word-limit", type=int, default=120)
    args = parser.parse_args()

    catalog_path = Path(args.catalog)
    output_path = Path(args.output)
    repository = json.loads(catalog_path.read_text(encoding="utf-8"))
    release_id = repository["activeReleaseByStandard"]["hsk3"]
    release = next(
        item for item in repository["releases"]
        if item["id"] == release_id and item["standard"] == "hsk3" and item["status"] == "published"
    )
    active_content_ids = set(release["contentAssetIds"])
    active_audio_ids = set(release["audioAssetIds"])
    published = [
        asset for asset in repository["contentAssets"]
        if asset["id"] in active_content_ids
        and asset["standard"] == "hsk3"
        and asset.get("standard_version") == "GF0025-2021"
        and asset.get("qa_status") == "approved"
        and asset.get("publish_status") == "published"
        and asset.get("authorization", {}).get("status") == "authorized"
    ]
    published_audio = [
        asset for asset in repository["audioAssets"]
        if asset["id"] in active_audio_ids
        and asset["standard"] == "hsk3"
        and asset.get("qaStatus") == "approved"
        and asset.get("authorization", {}).get("status") == "authorized"
        and asset.get("usageRights", {}).get("streaming") is True
        and not asset.get("withdrawnAt")
    ]
    audio_by_content: dict[str, list[dict]] = {}
    for asset in published_audio:
        audio_by_content.setdefault(asset["contentAssetId"], []).append(asset)

    definitions = {
        item["level"]: item for item in repository["levels"] if item["standard"] == "hsk3"
    }
    levels = []
    runtime_words: dict[str, list[dict]] = {}
    unified_advanced_assets = [asset for asset in published if asset["level"] == 7]
    for level in range(1, 10):
        direct_assets = [asset for asset in published if asset["level"] == level]
        assets = unified_advanced_assets if level in (8, 9) else direct_assets
        word_assets = [asset for asset in assets if asset["kind"] == "word"]
        audio_count = sum(1 for asset in published_audio if asset["level"] == (7 if level in (8, 9) else level))
        availability = "ready" if assets or audio_count else "gap"
        levels.append({
            "standard": "hsk3",
            "level": level,
            "title": definitions[level]["title"],
            "releaseId": release_id,
            "releaseVersion": release["version"],
            "availability": availability,
            "contentCount": len(assets),
            "wordCount": len(word_assets),
            "audioCount": audio_count,
            "isAdvancedPath": level >= 7,
            "message": "This level maps to the single canonical unified HSK 7–9 advanced ability band."
                if level in (8, 9)
                else "QA-approved study content is available in the active release."
                if availability == "ready"
                else "QA-approved study content is not yet available for this level.",
        })
        runtime_words[str(level)] = [
            runtime_word(asset) for asset in word_assets[: args.runtime_word_limit]
        ]

    dictionary_assets = []
    for asset in published:
        payload = asset["payload"]
        if payload.get("hanzi") not in CURATED_HANZI:
            continue
        audio = (audio_by_content.get(asset["id"]) or [None])[0]
        item = runtime_word(asset)
        item["audioSrc"] = f"/{audio['storageKey']}" if audio else None
        dictionary_assets.append(item)

    snapshot = {
        "releaseId": release_id,
        "releaseVersion": release["version"],
        "releasePublishedAt": release.get("publishedAt"),
        "formalAudioAssetCount": len(published_audio),
        "levels": levels,
        "runtimeWords": runtime_words,
        "dictionaryAssets": dictionary_assets,
        "publishedAudioAssets": published_audio,
    }
    generated = json.dumps(snapshot, ensure_ascii=False, separators=(",", ":")) + "\n"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(generated, encoding="utf-8")
    print(json.dumps({
        "source": str(catalog_path),
        "output": str(output_path),
        "bytes": len(generated.encode("utf-8")),
        "levels": len(levels),
        "runtimeWords": sum(map(len, runtime_words.values())),
        "dictionaryEntries": len(dictionary_assets),
        "audioEntries": len(published_audio),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
