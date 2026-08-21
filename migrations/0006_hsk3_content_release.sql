CREATE TABLE IF NOT EXISTS content_releases (
  id TEXT PRIMARY KEY,
  standard_version TEXT NOT NULL,
  content_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','published','withdrawn')),
  published_at TEXT,
  entry_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS content_assets (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL REFERENCES content_releases(id),
  standard_version TEXT NOT NULL,
  level_band TEXT NOT NULL CHECK (level_band IN ('1','2','3','4','5','6','7-9')),
  content_version TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  license_ref TEXT NOT NULL,
  qa_status TEXT NOT NULL CHECK (qa_status IN ('pending','approved','rejected')),
  publish_status TEXT NOT NULL CHECK (publish_status IN ('draft','published','withdrawn')),
  hanzi TEXT NOT NULL,
  traditional TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  meaning TEXT NOT NULL,
  part_of_speech TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_content_assets_release_level_publish
  ON content_assets(release_id, level_band, qa_status, publish_status);
