CREATE TABLE IF NOT EXISTS ai_quota_buckets (
  owner_id TEXT NOT NULL,
  period_key TEXT NOT NULL,
  allowance INTEGER NOT NULL CHECK(allowance BETWEEN 1 AND 100),
  used INTEGER NOT NULL DEFAULT 0 CHECK(used >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK(reserved >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY(owner_id, period_key),
  CHECK(used + reserved <= allowance)
);

CREATE TABLE IF NOT EXISTS ai_operations (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  feature TEXT NOT NULL CHECK(feature IN ('explanation','study_plan')),
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('reserved','succeeded','failed')),
  quota_period TEXT NOT NULL,
  cost_units INTEGER NOT NULL CHECK(cost_units = 1),
  response_json TEXT,
  failure_code TEXT,
  provider_request_id TEXT,
  prompt_tokens INTEGER CHECK(prompt_tokens IS NULL OR prompt_tokens >= 0),
  completion_tokens INTEGER CHECK(completion_tokens IS NULL OR completion_tokens BETWEEN 0 AND 500),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(owner_id, feature, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_ai_operations_owner_time ON ai_operations(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_operations_status ON ai_operations(status, updated_at);

CREATE TABLE IF NOT EXISTS ai_quota_assertions (
  id TEXT PRIMARY KEY,
  ok INTEGER NOT NULL CHECK(ok = 1)
);
