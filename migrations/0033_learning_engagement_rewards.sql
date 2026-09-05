CREATE TABLE IF NOT EXISTS learning_engagement_days (
  owner_id TEXT NOT NULL,
  local_day TEXT NOT NULL CHECK(local_day GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  active_seconds INTEGER NOT NULL DEFAULT 0 CHECK(active_seconds BETWEEN 0 AND 900),
  last_heartbeat_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(owner_id,local_day)
);

CREATE TABLE IF NOT EXISTS learning_reward_profiles (
  owner_id TEXT PRIMARY KEY,
  timezone TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_engagement_sessions (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  local_day TEXT NOT NULL,
  route TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_owner_expiry ON learning_engagement_sessions(owner_id,expires_at);

CREATE TABLE IF NOT EXISTS learning_engagement_heartbeats (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  local_day TEXT NOT NULL,
  credited_seconds INTEGER NOT NULL CHECK(credited_seconds BETWEEN 0 AND 30),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_learning_heartbeats_owner_day ON learning_engagement_heartbeats(owner_id,local_day);

CREATE TABLE IF NOT EXISTS learning_qualifying_tasks (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  local_day TEXT NOT NULL,
  action TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(owner_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_learning_tasks_owner_day ON learning_qualifying_tasks(owner_id,local_day);

CREATE TABLE IF NOT EXISTS learning_point_ledger (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  local_day TEXT NOT NULL,
  period_key TEXT NOT NULL,
  units INTEGER NOT NULL CHECK(units IN (2,4,6,10)),
  source TEXT NOT NULL CHECK(source='monthly_effective_learning_day'),
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(owner_id,local_day),
  UNIQUE(owner_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_learning_points_owner_period ON learning_point_ledger(owner_id,period_key,local_day);

CREATE TABLE IF NOT EXISTS learning_badges (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  badge_key TEXT NOT NULL,
  milestone_days INTEGER NOT NULL CHECK(milestone_days IN (3,7,14,30,60,90)),
  awarded_at TEXT NOT NULL,
  UNIQUE(owner_id,badge_key)
);
