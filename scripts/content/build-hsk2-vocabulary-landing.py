"""Prepare bounded HSK 2 page data without merging homographs or readings."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
catalog = json.loads((ROOT / "src/lib/content/public-catalog-index.json").read_text(encoding="utf-8"))
rows = [row for row in catalog["words"] if row[3] == "2"]
themes = [
    ("transport", ["车站", "地铁", "公交车"]),
    ("ordering", ["饭馆", "点", "咖啡"]),
    ("learning", ["教室", "考试", "记得"]),
    ("interests", ["爱好", "篮球", "游泳"]),
    ("directions", ["前面", "里面", "右边"]),
    ("comparisons", ["比", "近", "远"]),
]

def word(row):
    return {"id": row[0], "levelBand": row[3], "payload": {
        "hanzi": row[4], "traditional": row[5], "pinyin": row[6],
        "meaning": row[7], "partOfSpeech": row[8],
    }}

def select(hanzi):
    matches = [row for row in rows if row[4] == hanzi]
    assert len(matches) == 1, f"Select an explicit reading or ID for ambiguous word: {hanzi}"
    return word(matches[0])

assert len(rows) >= 50 and len({row[0] for row in rows}) == len(rows)
result = {"releaseId": catalog["releaseId"], "wordCount": len(rows),
          "firstPage": [word(row) for row in rows[:50]],
          "topics": [{"id": key, "words": [select(hanzi) for hanzi in words]} for key, words in themes]}
target = ROOT / "src/lib/content/hsk2-vocabulary-landing.json"
target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
assert target.stat().st_size < 40_000
print("Prepared 50 HSK 2 entries and 18 verified topic words; distinct readings retained")
