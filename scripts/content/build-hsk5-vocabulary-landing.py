"""Prepare bounded HSK 5 page data without merging homographs or readings."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
catalog = json.loads((ROOT / "src/lib/content/public-catalog-index.json").read_text(encoding="utf-8"))
rows = [row for row in catalog["words"] if row[3] == "5"]
themes = [('analysis', ['分析', '数据', '结论']), ('opinions', ['观点', '证据', '表达']), ('cooperation', ['合作', '方案', '效率']), ('innovation', ['设计', '创新', '实施']), ('change', ['现象', '趋势', '需求']), ('culture', ['传统', '风俗', '价值'])]

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
target = ROOT / "src/lib/content/hsk5-vocabulary-landing.json"
target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
assert target.stat().st_size < 40_000
print("Prepared 50 HSK 5 entries and 18 verified topic words; distinct readings retained")
