#!/usr/bin/env python3
"""Build bounded SEO artifacts; never scan the content catalog during a request."""
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def read(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def write(path, value):
    (ROOT / path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    catalog = read("src/lib/content/public-catalog-index.json")
    # This release has already passed authorization, publication and QA filters
    # in build-public-catalog-index.py. Expand only when explicitly approved.
    paths = sorted({
        "/word/" + row[0] for row in catalog["words"]
        if row[3] in {"1", "2", "3"} and all(row[i].strip() for i in (0, 4, 6, 7))
    })
    write("src/lib/content/seo-word-sitemap.json", {
        "releaseId": catalog["releaseId"], "levelBands": ["1", "2", "3"], "paths": paths,
    })

    current = defaultdict(list)
    for row in catalog["words"]:
        # Exact simplified spelling, tone-marked pinyin AND full definition.
        current[(row[4], row[6], row[7])].append(row[0])
    archive = {asset["id"]: asset for asset in read("src/lib/content/catalog.json")["contentAssets"]}
    runtime = read("src/lib/content/runtime-content-index.json")
    readable_ids = {asset["id"] for asset in runtime["dictionaryAssets"]}
    readable_ids.update(asset["id"] for rows in runtime["runtimeWords"].values() for asset in rows)
    for name in ("legacy-hsk1-words", "legacy-hsk23-words", "legacy-hsk4-words", "legacy-hsk5-words"):
        readable_ids.update(row[0] for row in read("src/lib/content/" + name + ".json")["words"])

    redirects = {}
    candidates = read("scripts/content/legacy-word-redirect-candidates.json")["paths"]
    for path in candidates:
        asset_id = path.split("/")[2]
        # Keep existing detail URLs and their saved-learning identities intact.
        if not path.endswith("/practice") and asset_id in readable_ids:
            continue
        asset = archive.get(asset_id)
        if not asset or asset.get("publish_status") != "published" or asset.get("qaStatus") != "approved":
            continue
        payload = asset["payload"]
        matches = current.get(tuple(payload.get(key, "") for key in ("hanzi", "pinyin", "meaning")), [])
        if len(matches) == 1:
            redirects[path] = "/word/" + matches[0] + ("/practice" if path.endswith("/practice") else "")
    write("src/lib/content/legacy-word-redirects.json", redirects)
    print(json.dumps({"sitemapWords": len(paths), "legacyRedirects": len(redirects),
                      "candidatesKeptWithoutRedirect": len(candidates) - len(redirects)}))


if __name__ == "__main__":
    main()
