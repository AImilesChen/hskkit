CREATE TABLE IF NOT EXISTS study_plan_versions (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  parent_version INTEGER,
  status TEXT NOT NULL CHECK(status IN ('active','superseded')),
  goal_level INTEGER NOT NULL CHECK(goal_level BETWEEN 1 AND 9),
  target_date TEXT NOT NULL,
  weekly_minutes INTEGER NOT NULL CHECK(weekly_minutes BETWEEN 15 AND 2100),
  preferred_days_json TEXT NOT NULL,
  weak_points_json TEXT NOT NULL,
  srs_load_json TEXT NOT NULL,
  warnings_json TEXT NOT NULL,
  sessions_json TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(owner_id, version),
  UNIQUE(owner_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_study_plan_versions_owner ON study_plan_versions(owner_id, version DESC);

CREATE TABLE IF NOT EXISTS step7_playback_tickets (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  not_before TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_by_key TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_step7_playback_owner ON step7_playback_tickets(owner_id, exercise_id, expires_at);
