"""Prepare bounded HSK 4 page data without merging homographs or readings."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
catalog = json.loads((ROOT / "src/lib/content/public-catalog-index.json").read_text(encoding="utf-8"))
rows = [row for row in catalog["words"] if row[3] == "4"]
themes = [('plans', ['安排', '计划', '申请']), ('discussion', ['讨论', '意见', '解释']), ('work', ['负责', '任务', '联系']), ('travel', ['出差', '航班', '旅行']), ('environment', ['保护', '垃圾', '污染']), ('experience', ['经验', '仔细', '总结'])]

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
target = ROOT / "src/lib/content/hsk4-vocabulary-landing.json"
target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
assert target.stat().st_size < 40_000
print("Prepared 50 HSK 4 entries and 18 verified topic words; distinct readings retained")
