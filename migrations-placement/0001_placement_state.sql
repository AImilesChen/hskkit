PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS placement_owner_revisions (
  owner_id TEXT PRIMARY KEY,
  revision INTEGER NOT NULL DEFAULT 0 CHECK(revision >= 0),
  migrated_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS placement_sessions (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  question_version TEXT NOT NULL,
  question_ids_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('in_progress','submitted','abandoned')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  submitted_at TEXT,
  result_id TEXT,
  adaptive_complete INTEGER,
  adaptive_min_questions INTEGER,
  adaptive_max_questions INTEGER,
  updated_at TEXT NOT NULL,
  UNIQUE(owner_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS placement_sessions_owner_created ON placement_sessions(owner_id,created_at DESC);
CREATE INDEX IF NOT EXISTS placement_sessions_owner_status ON placement_sessions(owner_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS placement_answers (
  session_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  answered_at TEXT NOT NULL,
  PRIMARY KEY(session_id,question_id),
  UNIQUE(session_id,idempotency_key),
  FOREIGN KEY(session_id) REFERENCES placement_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS placement_results (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  submit_idempotency_key TEXT NOT NULL,
  result_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(owner_id,submit_idempotency_key),
  FOREIGN KEY(session_id) REFERENCES placement_sessions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS placement_results_owner_created ON placement_results(owner_id,created_at DESC);

CREATE TABLE IF NOT EXISTS placement_cas_assertions (
  id TEXT PRIMARY KEY,
  ok INTEGER NOT NULL CHECK(ok = 1)
);
