CREATE TABLE IF NOT EXISTS mock_sessions (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  band TEXT NOT NULL CHECK(band IN ('basic','advanced')),
  status TEXT NOT NULL CHECK(status IN ('in_progress','submitted')),
  start_idempotency_key TEXT NOT NULL,
  question_set_version TEXT NOT NULL,
  scoring_version TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  answers_json TEXT NOT NULL DEFAULT '[]',
  answer_keys_json TEXT NOT NULL DEFAULT '[]',
  result_json TEXT,
  revision INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  deadline_at TEXT NOT NULL,
  submitted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(owner_id, band, start_idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_mock_sessions_owner_updated ON mock_sessions(owner_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS mock_attempts (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  owner_id TEXT NOT NULL,
  band TEXT NOT NULL CHECK(band IN ('basic','advanced')),
  question_set_version TEXT NOT NULL,
  scoring_version TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  result_json TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(session_id) REFERENCES mock_sessions(id)
);
CREATE INDEX IF NOT EXISTS idx_mock_attempts_owner_submitted ON mock_attempts(owner_id, submitted_at DESC);

CREATE TABLE IF NOT EXISTS mock_content_events (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  question_set_version TEXT NOT NULL,
  lifecycle TEXT NOT NULL CHECK(lifecycle IN ('published','withdrawn')),
  reason TEXT NOT NULL,
  effective_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mock_content_events_question ON mock_content_events(question_id, effective_at DESC);
