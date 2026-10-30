#!/usr/bin/env python3
"""Verify the staged index in SQLite before writing to production D1."""

import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sql = (ROOT / "tmp/hsk789-2025-stage-search-index.sql").read_text(encoding="utf-8")
db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE catalog_search_releases (id TEXT PRIMARY KEY, version INTEGER NOT NULL, published_at TEXT NOT NULL, word_count INTEGER NOT NULL, active INTEGER NOT NULL CHECK(active IN (0,1)))")
db.execute("INSERT INTO catalog_search_releases VALUES ('hsk3-hsk123456-2025-v10',10,'2026-10-29',11036,1)")
db.executescript(sql)
releases = db.execute("SELECT id,active FROM catalog_search_releases ORDER BY version").fetchall()
counts = db.execute("SELECT level_band,COUNT(*) FROM catalog_search_index GROUP BY level_band ORDER BY sort_level").fetchall()
assert releases == [("hsk3-hsk123456-2025-v10", 1), ("hsk3-hsk123456789-2025-v11", 0)], releases
assert counts == [("1", 300), ("2", 200), ("3", 500), ("4", 1000), ("5", 1600), ("6", 1800), ("7-9", 5600)], counts
print("Staged index verified: v10 active, v11 inactive, 11,000 words in expected bands")
