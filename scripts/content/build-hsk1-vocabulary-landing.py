"""Prepare a bounded HSK 1 landing-page snapshot from the published catalog."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
catalog = json.loads((ROOT / "src/lib/content/public-catalog-index.json").read_text(encoding="utf-8"))
rows = [row for row in catalog["words"] if row[3] == "1"]
by_hanzi = {row[4]: row for row in rows}
themes = [
    ("family", ["爸爸", "妈妈", "弟弟"]),
    ("numbers", ["八", "百", "半"]),
    ("time", ["白天", "今天", "点"]),
    ("food", ["茶", "饭", "包子"]),
    ("study", ["读", "书", "学习"]),
    ("places", ["车", "出租车", "超市"]),
]

def word(row):
    return {"id": row[0], "levelBand": row[3], "payload": {
        "hanzi": row[4], "traditional": row[5], "pinyin": row[6],
        "meaning": row[7], "partOfSpeech": row[8],
    }}

assert len(rows) >= 50 and len(by_hanzi) == len(rows)
result = {"releaseId": catalog["releaseId"], "wordCount": len(rows),
          "firstPage": [word(row) for row in rows[:50]],
          "topics": [{"id": key, "words": [word(by_hanzi[h]) for h in hanzi]} for key, hanzi in themes]}
target = ROOT / "src/lib/content/hsk1-vocabulary-landing.json"
target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
assert target.stat().st_size < 40_000, "Landing snapshot must remain bounded"
print("Prepared 50 initial words and 18 verified topic examples")
