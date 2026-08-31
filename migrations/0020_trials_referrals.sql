-- Trial, promotional entitlement, referral and auditable bonus-credit contracts.
CREATE TABLE IF NOT EXISTS promotional_entitlements (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('welcome_trial','referral_pass')),
  status TEXT NOT NULL CHECK(status IN ('active','ended','revoked')),
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  source_reward_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  revoked_at TEXT,
  revocation_reason TEXT,
  UNIQUE(owner_id,kind,source_reward_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS promotional_entitlements_welcome_once ON promotional_entitlements(owner_id) WHERE kind='welcome_trial';
CREATE INDEX IF NOT EXISTS promotional_entitlements_active_idx ON promotional_entitlements(owner_id,status,ends_at);

CREATE TABLE IF NOT EXISTS referral_codes (
  code TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES accounts(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS referral_relationships (
  id TEXT PRIMARY KEY,
  referral_code TEXT NOT NULL,
  referrer_user_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL,
  email_verified INTEGER NOT NULL CHECK(email_verified IN (0,1)),
  risk_status TEXT NOT NULL DEFAULT 'clear' CHECK(risk_status IN ('clear','review','blocked')),
  signup_device_hash TEXT,
  status TEXT NOT NULL DEFAULT 'signed_up' CHECK(status IN ('signed_up','qualified','paid_pending','paid','blocked')),
  created_at TEXT NOT NULL,
  qualified_at TEXT,
  paid_at TEXT,
  paid_charge_id TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(referred_user_id),
  FOREIGN KEY(referral_code) REFERENCES referral_codes(code),
  FOREIGN KEY(referrer_user_id) REFERENCES accounts(user_id) ON DELETE CASCADE,
  FOREIGN KEY(referred_user_id) REFERENCES accounts(user_id) ON DELETE CASCADE,
  CHECK(referrer_user_id <> referred_user_id)
);
CREATE INDEX IF NOT EXISTS referral_relationships_referrer_idx ON referral_relationships(referrer_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS referral_relationships_device_idx ON referral_relationships(signup_device_hash,created_at DESC);

CREATE TABLE IF NOT EXISTS referral_learning_events (
  id TEXT PRIMARY KEY,
  relationship_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL,
  local_day TEXT NOT NULL,
  units INTEGER NOT NULL CHECK(units > 0),
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(referred_user_id,idempotency_key),
  FOREIGN KEY(relationship_id) REFERENCES referral_relationships(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS referral_learning_progress_idx ON referral_learning_events(relationship_id,local_day,created_at);

CREATE TABLE IF NOT EXISTS reward_issuances (
  id TEXT PRIMARY KEY,
  relationship_id TEXT NOT NULL,
  referrer_user_id TEXT NOT NULL,
  stage TEXT NOT NULL CHECK(stage IN ('qualified','paid')),
  promo_days INTEGER NOT NULL DEFAULT 0 CHECK(promo_days BETWEEN 0 AND 14),
  bonus_credits INTEGER NOT NULL CHECK(bonus_credits BETWEEN 0 AND 150),
  status TEXT NOT NULL CHECK(status IN ('issued','revoked')),
  issued_at TEXT NOT NULL,
  revoked_at TEXT,
  revocation_reason TEXT,
  UNIQUE(relationship_id,stage),
  FOREIGN KEY(relationship_id) REFERENCES referral_relationships(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS reward_issuances_referrer_year_idx ON reward_issuances(referrer_user_id,issued_at,status);

-- One row per referrer/year makes annual caps enforceable in the same transaction as issuance.
CREATE TABLE IF NOT EXISTS referral_annual_counters (
  referrer_user_id TEXT NOT NULL,
  reward_year INTEGER NOT NULL,
  bonus_credits INTEGER NOT NULL DEFAULT 0 CHECK(bonus_credits BETWEEN 0 AND 600),
  promo_days INTEGER NOT NULL DEFAULT 0 CHECK(promo_days BETWEEN 0 AND 60),
  updated_at TEXT NOT NULL,
  PRIMARY KEY(referrer_user_id,reward_year)
);
CREATE TABLE IF NOT EXISTS referral_reward_assertions (
  id TEXT PRIMARY KEY,
  ok INTEGER NOT NULL CHECK(ok=1)
);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  units INTEGER NOT NULL CHECK(units <> 0),
  source TEXT NOT NULL CHECK(source IN ('referral_qualified','referral_paid','referral_spend','admin_reversal')),
  reward_id TEXT,
  operation_id TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(reward_id),
  UNIQUE(operation_id)
);
CREATE INDEX IF NOT EXISTS credit_ledger_balance_idx ON credit_ledger(owner_id,expires_at,created_at);

CREATE TABLE IF NOT EXISTS referral_risk_flags (
  id TEXT PRIMARY KEY,
  relationship_id TEXT NOT NULL,
  signal TEXT NOT NULL CHECK(signal IN ('device_velocity','self_referral','manual_review','charge_refund','charge_dispute')),
  status TEXT NOT NULL CHECK(status IN ('open','cleared','confirmed')),
  detail TEXT,
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY(relationship_id) REFERENCES referral_relationships(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS referral_risk_flags_open_idx ON referral_risk_flags(status,created_at DESC);

ALTER TABLE ai_operations ADD COLUMN base_credit_allowance INTEGER NOT NULL DEFAULT 0 CHECK(base_credit_allowance BETWEEN 0 AND 500);

-- Bonus balances can increase a monthly allowance above the paid base of 500.
CREATE TABLE ai_quota_buckets_referral (
  owner_id TEXT NOT NULL,
  period_key TEXT NOT NULL,
  allowance INTEGER NOT NULL CHECK(allowance BETWEEN 0 AND 2000),
  used INTEGER NOT NULL DEFAULT 0 CHECK(used >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK(reserved >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY(owner_id,period_key),
  CHECK(used + reserved <= allowance)
);
INSERT INTO ai_quota_buckets_referral(owner_id,period_key,allowance,used,reserved,updated_at)
  SELECT owner_id,period_key,allowance,used,reserved,updated_at FROM ai_quota_buckets;
DROP TABLE ai_quota_buckets;
ALTER TABLE ai_quota_buckets_referral RENAME TO ai_quota_buckets;
