CREATE TABLE IF NOT EXISTS entitlement_usage_counters (
  owner_id TEXT NOT NULL,
  metric TEXT NOT NULL CHECK(metric IN ('daily_new_items','daily_review_grades')),
  period_key TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0 CHECK(used >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY(owner_id, metric, period_key)
);

CREATE TABLE IF NOT EXISTS entitlement_usage_events (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  metric TEXT NOT NULL CHECK(metric IN ('daily_new_items','daily_review_grades')),
  period_key TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  units INTEGER NOT NULL CHECK(units > 0),
  created_at TEXT NOT NULL,
  UNIQUE(owner_id, metric, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_entitlement_usage_events_period
  ON entitlement_usage_events(owner_id, metric, period_key, created_at);

CREATE TABLE IF NOT EXISTS entitlement_limit_assertions (
  id TEXT PRIMARY KEY,
  ok INTEGER NOT NULL CHECK(ok = 1)
);

CREATE TABLE IF NOT EXISTS account_devices (
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  revoked_at TEXT,
  PRIMARY KEY(user_id, device_id),
  FOREIGN KEY(user_id) REFERENCES accounts(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_account_devices_active
  ON account_devices(user_id, revoked_at, last_seen_at DESC);

CREATE TABLE ai_quota_buckets_p0 (
  owner_id TEXT NOT NULL,
  period_key TEXT NOT NULL,
  allowance INTEGER NOT NULL CHECK(allowance BETWEEN 0 AND 500),
  used INTEGER NOT NULL DEFAULT 0 CHECK(used >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK(reserved >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY(owner_id, period_key),
  CHECK(used + reserved <= allowance)
);
INSERT INTO ai_quota_buckets_p0(owner_id,period_key,allowance,used,reserved,updated_at)
  SELECT owner_id,period_key,allowance,used,reserved,updated_at FROM ai_quota_buckets;
DROP TABLE ai_quota_buckets;
ALTER TABLE ai_quota_buckets_p0 RENAME TO ai_quota_buckets;

ALTER TABLE ai_operations ADD COLUMN credit_units INTEGER NOT NULL DEFAULT 1 CHECK(credit_units IN (1,5));
