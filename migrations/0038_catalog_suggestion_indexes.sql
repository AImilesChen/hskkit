-- Bound public dictionary spelling suggestions to release-scoped prefix indexes.
-- Additive only: existing catalog rows and release metadata are unchanged.

CREATE INDEX IF NOT EXISTS idx_catalog_search_release_english_sort
  ON catalog_search_index(release_id, search_english, sort_level, id);

CREATE INDEX IF NOT EXISTS idx_catalog_search_release_hanzi_sort
  ON catalog_search_index(release_id, search_hanzi, sort_level, id);
