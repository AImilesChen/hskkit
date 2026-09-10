-- Daily online learning rewards: cumulative 10/30/60 minute tiers and 10:1 AI credit exchange.

CREATE TABLE learning_engagement_days_daily_online (
  owner_id TEXT NOT NULL,
  local_day TEXT NOT NULL,
  active_seconds INTEGER NOT NULL DEFAULT 0 CHECK(active_seconds BETWEEN 0 AND 3600),
  last_heartbeat_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(owner_id, local_day)
);
INSERT INTO learning_engagement_days_daily_online
SELECT owner_id,local_day,MIN(3600,MAX(0,active_seconds)),last_heartbeat_at,created_at,updated_at
FROM learning_engagement_days;
DROP TABLE learning_engagement_days;
ALTER TABLE learning_engagement_days_daily_online RENAME TO learning_engagement_days;

CREATE TABLE learning_engagement_heartbeats_daily_online (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  local_day TEXT NOT NULL,
  credited_seconds INTEGER NOT NULL CHECK(credited_seconds BETWEEN 0 AND 60),
  created_at TEXT NOT NULL
);
INSERT INTO learning_engagement_heartbeats_daily_online
SELECT id,owner_id,local_day,MIN(60,MAX(0,credited_seconds)),created_at
FROM learning_engagement_heartbeats;
DROP TABLE learning_engagement_heartbeats;
ALTER TABLE learning_engagement_heartbeats_daily_online RENAME TO learning_engagement_heartbeats;
CREATE INDEX idx_learning_engagement_heartbeats_owner_day ON learning_engagement_heartbeats(owner_id, local_day);

CREATE TABLE learning_point_ledger_daily_online (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  local_day TEXT NOT NULL,
  period_key TEXT NOT NULL,
  units INTEGER NOT NULL CHECK(units BETWEEN 1 AND 10),
  source TEXT NOT NULL CHECK(source IN ('daily_learning_reward','daily_online_learning')),
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(owner_id, local_day),
  UNIQUE(owner_id, idempotency_key)
);
INSERT INTO learning_point_ledger_daily_online
SELECT id,owner_id,local_day,period_key,MIN(10,MAX(1,units)),source,idempotency_key,created_at
FROM learning_point_ledger;
DROP TABLE learning_point_ledger;
ALTER TABLE learning_point_ledger_daily_online RENAME TO learning_point_ledger;
CREATE INDEX idx_learning_point_ledger_owner_period ON learning_point_ledger(owner_id, period_key);

CREATE TABLE learning_point_redemptions (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  points_spent INTEGER NOT NULL CHECK(points_spent > 0 AND points_spent % 10 = 0),
  credits_granted INTEGER NOT NULL CHECK(credits_granted > 0 AND credits_granted * 10 = points_spent),
  created_at TEXT NOT NULL,
  UNIQUE(owner_id, idempotency_key)
);
CREATE INDEX idx_learning_point_redemptions_owner_created ON learning_point_redemptions(owner_id, created_at DESC);

CREATE TABLE learning_reward_assertions (
  id TEXT PRIMARY KEY,
  ok INTEGER NOT NULL CHECK(ok = 1)
);

CREATE TABLE credit_ledger_learning_points (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  units INTEGER NOT NULL CHECK(units <> 0),
  source TEXT NOT NULL CHECK(source IN ('referral_qualified','referral_paid','referral_spend','admin_reversal','learning_points_exchange')),
  reward_id TEXT,
  operation_id TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(reward_id),
  UNIQUE(operation_id)
);
INSERT INTO credit_ledger_learning_points(id,owner_id,units,source,reward_id,operation_id,expires_at,created_at)
SELECT id,owner_id,units,source,reward_id,operation_id,expires_at,created_at FROM credit_ledger;
DROP TABLE credit_ledger;
ALTER TABLE credit_ledger_learning_points RENAME TO credit_ledger;
CREATE INDEX idx_credit_ledger_owner_expiry ON credit_ledger(owner_id, expires_at);
