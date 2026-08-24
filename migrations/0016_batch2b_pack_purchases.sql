-- Batch 2B: make one-time PackPurchase explicit and separate from subscription entitlements.
CREATE TABLE IF NOT EXISTS pack_purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES accounts(user_id),
  order_id TEXT NOT NULL UNIQUE REFERENCES commerce_orders(id),
  sku TEXT NOT NULL CHECK (sku = 'hskkit_advanced_study_pdf_pack_v1'),
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
CREATE INDEX IF NOT EXISTS pack_purchases_user_status_idx ON pack_purchases(user_id, status, expires_at);

INSERT OR IGNORE INTO pack_purchases
  (id,user_id,order_id,sku,selected_level,status,starts_at,expires_at,download_limit,successful_downloads,version,revoked_reason,updated_at)
SELECT id,user_id,order_id,sku,selected_level,status,starts_at,expires_at,download_limit,successful_downloads,version,revoked_reason,updated_at
FROM commercial_entitlements;

ALTER TABLE commercial_export_jobs ADD COLUMN pack_purchase_id TEXT REFERENCES pack_purchases(id);
ALTER TABLE commercial_download_ledger ADD COLUMN pack_purchase_id TEXT REFERENCES pack_purchases(id);
UPDATE commercial_export_jobs SET pack_purchase_id=entitlement_id WHERE entitlement_id IS NOT NULL;
UPDATE commercial_download_ledger SET pack_purchase_id=entitlement_id WHERE entitlement_id IS NOT NULL;
UPDATE commercial_export_jobs SET expires_at=CASE WHEN kind='account_data' THEN datetime(created_at,'+1 day') ELSE datetime(created_at,'+14 days') END WHERE expires_at IS NULL;
CREATE INDEX IF NOT EXISTS commercial_export_jobs_pack_purchase_idx ON commercial_export_jobs(pack_purchase_id, created_at DESC);
