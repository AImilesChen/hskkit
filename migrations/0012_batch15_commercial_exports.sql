-- Batch 15 commercial exports, Stripe Test payment, entitlement and immutable usage ledgers.
CREATE TABLE IF NOT EXISTS commerce_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES accounts(user_id),
  sku TEXT NOT NULL CHECK (sku = 'hskkit_advanced_study_pdf_pack_v1'),
  amount_cents INTEGER NOT NULL CHECK (amount_cents = 999),
  currency TEXT NOT NULL CHECK (currency = 'usd'),
  selected_level INTEGER NOT NULL CHECK (selected_level BETWEEN 1 AND 7),
  status TEXT NOT NULL CHECK (status IN ('pending','paid','refund_requested','refunded','cancelled','failed')),
  stripe_mode TEXT NOT NULL CHECK (stripe_mode = 'test'),
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT UNIQUE,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  paid_at TEXT,
  refunded_at TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS commerce_orders_user_created_idx ON commerce_orders(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  livemode INTEGER NOT NULL CHECK (livemode = 0),
  payload_sha256 TEXT NOT NULL,
  processed_at TEXT NOT NULL,
  outcome TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS commercial_entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES accounts(user_id),
  order_id TEXT NOT NULL UNIQUE REFERENCES commerce_orders(id),
  sku TEXT NOT NULL,
  selected_level INTEGER NOT NULL CHECK (selected_level BETWEEN 1 AND 7),
  status TEXT NOT NULL CHECK (status IN ('active','refunded','revoked','expired')),
  starts_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  download_limit INTEGER NOT NULL DEFAULT 3 CHECK (download_limit = 3),
  successful_downloads INTEGER NOT NULL DEFAULT 0 CHECK (successful_downloads BETWEEN 0 AND 3),
  version INTEGER NOT NULL DEFAULT 1,
  revoked_reason TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS commercial_entitlements_user_status_idx ON commercial_entitlements(user_id, status, expires_at);

CREATE TABLE IF NOT EXISTS commercial_export_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES accounts(user_id),
  entitlement_id TEXT REFERENCES commercial_entitlements(id),
  kind TEXT NOT NULL CHECK (kind IN ('pdf_pack','offline_pack','account_data')),
  format TEXT NOT NULL CHECK (format IN ('pdf','zip','json')),
  level INTEGER CHECK (level BETWEEN 1 AND 9),
  state TEXT NOT NULL CHECK (state IN ('queued','generating','ready','failed','cancelled','expired','revoked')),
  idempotency_key TEXT NOT NULL,
  object_key TEXT UNIQUE,
  manifest_json TEXT,
  checksum_sha256 TEXT,
  byte_size INTEGER,
  generation_version TEXT NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 0,
  lease_owner TEXT,
  lease_expires_at TEXT,
  error_code TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS commercial_export_jobs_user_created_idx ON commercial_export_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS commercial_export_jobs_state_idx ON commercial_export_jobs(state, created_at);

CREATE TABLE IF NOT EXISTS commercial_download_tokens (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES commercial_export_jobs(id),
  user_id TEXT NOT NULL REFERENCES accounts(user_id),
  token_sha256 TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS commercial_download_tokens_job_idx ON commercial_download_tokens(job_id, created_at DESC);

CREATE TABLE IF NOT EXISTS commercial_download_ledger (
  id TEXT PRIMARY KEY,
  token_id TEXT NOT NULL UNIQUE REFERENCES commercial_download_tokens(id),
  job_id TEXT NOT NULL REFERENCES commercial_export_jobs(id),
  entitlement_id TEXT REFERENCES commercial_entitlements(id),
  user_id TEXT NOT NULL REFERENCES accounts(user_id),
  byte_size INTEGER NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  succeeded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS commercial_refund_requests (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES commerce_orders(id),
  user_id TEXT NOT NULL REFERENCES accounts(user_id),
  status TEXT NOT NULL CHECK (status IN ('pending_review','approved','rejected','refunded')),
  eligibility_code TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  reviewed_at TEXT,
  review_note TEXT
);

CREATE TABLE IF NOT EXISTS commercial_audit_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS commercial_audit_events_entity_idx ON commercial_audit_events(entity_type, entity_id, created_at);
