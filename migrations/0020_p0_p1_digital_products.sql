-- P0/P1 additive digital-product commerce. Legacy PackPurchase rows remain valid.
CREATE TABLE IF NOT EXISTS digital_product_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES accounts(user_id),
  product_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
  currency TEXT NOT NULL CHECK(currency = 'usd'),
  status TEXT NOT NULL CHECK(status IN ('pending','paid','refund_requested','refunded','cancelled','failed')),
  stripe_mode TEXT NOT NULL CHECK(stripe_mode = 'test'),
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT UNIQUE,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  paid_at TEXT,
  refunded_at TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS digital_product_orders_user_created_idx ON digital_product_orders(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS digital_product_orders_product_status_idx ON digital_product_orders(user_id,product_id,status);
CREATE UNIQUE INDEX IF NOT EXISTS digital_product_orders_one_pending_product_idx ON digital_product_orders(user_id,product_id) WHERE status='pending';

CREATE TABLE IF NOT EXISTS digital_product_entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES accounts(user_id),
  order_id TEXT NOT NULL REFERENCES digital_product_orders(id),
  product_id TEXT NOT NULL,
  delivery_key TEXT NOT NULL,
  level INTEGER CHECK(level BETWEEN 1 AND 9),
  artifact_type TEXT NOT NULL,
  format TEXT NOT NULL CHECK(format IN ('pdf','zip')),
  status TEXT NOT NULL CHECK(status IN ('active','refund_pending','refunded','revoked','expired')),
  starts_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  download_limit INTEGER NOT NULL DEFAULT 3 CHECK(download_limit = 3),
  successful_downloads INTEGER NOT NULL DEFAULT 0 CHECK(successful_downloads BETWEEN 0 AND 3),
  version INTEGER NOT NULL DEFAULT 1,
  revoked_reason TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(order_id,delivery_key)
);
CREATE INDEX IF NOT EXISTS digital_product_entitlements_user_status_idx ON digital_product_entitlements(user_id,status,expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS digital_product_entitlements_one_active_delivery_idx ON digital_product_entitlements(user_id,product_id,delivery_key) WHERE status IN ('active','refund_pending');
CREATE INDEX IF NOT EXISTS digital_product_entitlements_order_idx ON digital_product_entitlements(order_id);

CREATE TABLE IF NOT EXISTS digital_product_refund_requests (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES digital_product_orders(id),
  user_id TEXT NOT NULL REFERENCES accounts(user_id),
  status TEXT NOT NULL CHECK(status IN ('pending_review','approved','rejected','refunded')),
  eligibility_code TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  reviewed_at TEXT,
  review_note TEXT
);

ALTER TABLE commercial_export_jobs ADD COLUMN product_entitlement_id TEXT REFERENCES digital_product_entitlements(id);
ALTER TABLE commercial_export_jobs ADD COLUMN product_id TEXT;
ALTER TABLE commercial_export_jobs ADD COLUMN delivery_key TEXT;
ALTER TABLE commercial_download_ledger ADD COLUMN product_entitlement_id TEXT REFERENCES digital_product_entitlements(id);
CREATE INDEX IF NOT EXISTS commercial_export_jobs_product_entitlement_idx ON commercial_export_jobs(product_entitlement_id,created_at DESC);
