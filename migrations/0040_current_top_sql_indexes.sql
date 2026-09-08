-- Current D1 Top SQL hardening (2026-09-08).
-- Additive partial indexes only; no application rows are changed.
-- These target the remaining periodic expiry and object-cleanup scans.

CREATE INDEX IF NOT EXISTS idx_commercial_export_jobs_expiry_cleanup
  ON commercial_export_jobs(expires_at)
  WHERE state IN ('queued','generating','ready','failed');

CREATE INDEX IF NOT EXISTS idx_commercial_export_jobs_object_cleanup
  ON commercial_export_jobs(updated_at)
  WHERE state IN ('expired','revoked') AND object_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_digital_product_entitlements_active_expiry
  ON digital_product_entitlements(expires_at)
  WHERE status='active';

CREATE INDEX IF NOT EXISTS idx_pack_purchases_active_expiry
  ON pack_purchases(expires_at)
  WHERE status='active';
