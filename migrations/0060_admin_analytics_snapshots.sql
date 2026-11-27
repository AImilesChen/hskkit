-- One current snapshot per source/window; no R2 assets or build-version copies.
CREATE TABLE IF NOT EXISTS admin_analytics_snapshots (
  provider TEXT NOT NULL CHECK (provider IN ('gsc','ga4')),
  days INTEGER NOT NULL CHECK (days IN (7,28,90)),
  payload_json TEXT,
  synced_at TEXT,
  attempted_at TEXT NOT NULL,
  last_error TEXT,
  PRIMARY KEY (provider,days)
);
CREATE TABLE IF NOT EXISTS admin_analytics_sync_lock (
  id INTEGER PRIMARY KEY CHECK (id=1),
  token TEXT NOT NULL,
  locked_until TEXT NOT NULL
);
INSERT OR IGNORE INTO admin_analytics_sync_lock(id,token,locked_until) VALUES(1,'','1970-01-01T00:00:00.000Z');
