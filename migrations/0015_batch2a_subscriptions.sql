-- Batch 2A: recurring subscription orders, lifecycle, charges, and effective entitlements.
ALTER TABLE payment_events ADD COLUMN claim_token TEXT;

CREATE TABLE IF NOT EXISTS subscription_orders (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('pro_monthly','pro_yearly')),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending','checkout_created','completed','failed','refunded')),
  idempotency_key TEXT NOT NULL,
  provider_checkout_session_id TEXT,
  provider_checkout_url TEXT,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(owner_id,idempotency_key),
  UNIQUE(provider_checkout_session_id)
);
CREATE INDEX IF NOT EXISTS subscription_orders_owner_idx ON subscription_orders(owner_id,created_at DESC);
CREATE INDEX IF NOT EXISTS subscription_orders_provider_subscription_idx ON subscription_orders(provider_subscription_id);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('pro_monthly','pro_yearly')),
  status TEXT NOT NULL,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0 CHECK (cancel_at_period_end IN (0,1)),
  current_period_start TEXT,
  current_period_end TEXT,
  provider_customer_id TEXT NOT NULL,
  provider_subscription_id TEXT NOT NULL UNIQUE,
  source_order_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS subscriptions_owner_idx ON subscriptions(owner_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS subscription_charges (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  provider_invoice_id TEXT NOT NULL UNIQUE,
  provider_payment_intent_id TEXT,
  provider_charge_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL,
  amount_refunded_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('paid','failed','refunded','partially_refunded')),
  charged_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS subscription_charges_subscription_idx ON subscription_charges(subscription_id,created_at DESC);
CREATE INDEX IF NOT EXISTS subscription_charges_owner_idx ON subscription_charges(owner_id,created_at DESC);

CREATE TABLE IF NOT EXISTS subscription_entitlements (
  owner_id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('pro_monthly','pro_yearly')),
  status TEXT NOT NULL CHECK (status IN ('active','suspended','ended','revoked')),
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  revoked_at TEXT,
  revocation_reason TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS subscription_entitlements_status_idx ON subscription_entitlements(status,ends_at);

CREATE TABLE IF NOT EXISTS subscription_refund_requests (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  charge_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  ai_credits_used INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('requested','approved','rejected','processed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(owner_id,charge_id)
);

-- Reuse the existing payment_events idempotency ledger from migration 0012.
