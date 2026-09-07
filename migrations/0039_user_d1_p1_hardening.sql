-- P1: keep user-data reads on exact owner/business keys without duplicating existing indexes.
CREATE INDEX IF NOT EXISTS idx_study_plan_owner_status_version
  ON study_plan_versions(owner_id,status,version DESC);
CREATE INDEX IF NOT EXISTS idx_policy_audit_learning_activity
  ON policy_audit_events(subject_id,resource_type,result,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_orders_owner_mode_created
  ON subscription_orders(owner_id,stripe_livemode,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_owner_mode_updated
  ON subscriptions(owner_id,stripe_livemode,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_promo_owner_kind_created
  ON promotional_entitlements(owner_id,kind,created_at DESC);
