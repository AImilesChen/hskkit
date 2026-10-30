#!/usr/bin/env python3
"""Prepare the v11 search index without switching the production release."""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "migrations/0053_catalog_search_index_hsk123456789_2025.sql"
TARGET = ROOT / "tmp/hsk789-2025-stage-search-index.sql"
source = SOURCE.read_text(encoding="utf-8")
old_update = "UPDATE catalog_search_releases SET active=0;\n"
old_insert = "11000,1) ON CONFLICT(id) DO UPDATE SET version=excluded.version,published_at=excluded.published_at,word_count=excluded.word_count,active=1;"
assert source.count(old_update) == 1
assert source.count(old_insert) == 1
staged = source.replace(old_update, "").replace(old_insert, old_insert.replace("11000,1)", "11000,0)").replace("active=1;", "active=0;"))
assert "UPDATE catalog_search_releases SET active=0;" not in staged
assert "11000,0) ON CONFLICT" in staged
TARGET.parent.mkdir(parents=True, exist_ok=True)
TARGET.write_text(staged, encoding="utf-8")
print(f"Staged {TARGET.stat().st_size:,} bytes at {TARGET}")
