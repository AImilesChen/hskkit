CREATE TABLE IF NOT EXISTS audio_issue_reports (
  id TEXT PRIMARY KEY,
  audio_asset_id TEXT NOT NULL,
  issue_type TEXT NOT NULL CHECK(issue_type IN ('playback','wrong_audio','pronunciation','license','other')),
  details TEXT NOT NULL DEFAULT '' CHECK(length(details) <= 500),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewing','resolved','rejected')),
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_audio_issue_reports_asset_status
  ON audio_issue_reports(audio_asset_id, status, created_at);
