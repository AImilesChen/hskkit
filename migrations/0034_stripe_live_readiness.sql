-- Stripe Live readiness: preserve all Test rows, add explicit mode flags, and isolate Live webhook idempotency.
-- digital_product_orders.stripe_mode is a legacy Test-only compatibility column whose original
-- CHECK constraint cannot be widened additively in D1. stripe_livemode is the canonical mode flag.

ALTER TABLE digital_product_orders ADD COLUMN stripe_livemode INTEGER NOT NULL DEFAULT 0 CHECK(stripe_livemode IN (0,1));
DROP INDEX digital_product_orders_one_pending_product_idx;
CREATE UNIQUE INDEX digital_product_orders_one_pending_product_idx ON digital_product_orders(user_id,product_id,stripe_livemode) WHERE status='pending';

ALTER TABLE digital_product_entitlements ADD COLUMN stripe_livemode INTEGER NOT NULL DEFAULT 0 CHECK(stripe_livemode IN (0,1));
DROP INDEX digital_product_entitlements_one_active_delivery_idx;
CREATE UNIQUE INDEX digital_product_entitlements_one_active_delivery_idx ON digital_product_entitlements(user_id,product_id,delivery_key,stripe_livemode) WHERE status IN ('active','refund_pending');

ALTER TABLE subscription_orders ADD COLUMN stripe_livemode INTEGER NOT NULL DEFAULT 0 CHECK(stripe_livemode IN (0,1));
ALTER TABLE subscriptions ADD COLUMN stripe_livemode INTEGER NOT NULL DEFAULT 0 CHECK(stripe_livemode IN (0,1));

CREATE TABLE subscription_entitlements_live (
  owner_id TEXT NOT NULL,
  subscription_id TEXT NOT NULL,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('pro_monthly','pro_yearly')),
  status TEXT NOT NULL CHECK (status IN ('active','suspended','ended','revoked')),
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  revoked_at TEXT,
  revocation_reason TEXT,
  stripe_livemode INTEGER NOT NULL DEFAULT 0 CHECK(stripe_livemode IN (0,1)),
  updated_at TEXT NOT NULL,
  PRIMARY KEY(owner_id,stripe_livemode)
);
INSERT INTO subscription_entitlements_live(owner_id,subscription_id,plan_id,status,starts_at,ends_at,revoked_at,revocation_reason,stripe_livemode,updated_at)
SELECT owner_id,subscription_id,plan_id,status,starts_at,ends_at,revoked_at,revocation_reason,0,updated_at FROM subscription_entitlements;
DROP TABLE subscription_entitlements;
ALTER TABLE subscription_entitlements_live RENAME TO subscription_entitlements;
CREATE INDEX subscription_entitlements_status_idx ON subscription_entitlements(status,ends_at);

ALTER TABLE subscription_charges ADD COLUMN stripe_livemode INTEGER NOT NULL DEFAULT 0 CHECK(stripe_livemode IN (0,1));

CREATE TABLE IF NOT EXISTS live_payment_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  livemode INTEGER NOT NULL CHECK(livemode = 1),
  payload_sha256 TEXT NOT NULL,
  processed_at TEXT NOT NULL,
  outcome TEXT NOT NULL,
  claim_token TEXT
);
