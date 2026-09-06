-- Admin query performance and feedback retention controls.
CREATE INDEX IF NOT EXISTS idx_subscriptions_admin_user_state
  ON subscriptions(user_id, stripe_livemode, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_account_oauth_admin_identity
  ON account_oauth_identities(user_id, provider, email_verified, updated_at DESC);

ALTER TABLE feedback_submissions ADD COLUMN retention_status TEXT NOT NULL DEFAULT 'kept'
  CHECK(retention_status IN ('kept','archived'));
ALTER TABLE feedback_submissions ADD COLUMN archived_at TEXT;
ALTER TABLE feedback_submissions ADD COLUMN archived_by TEXT;
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_retention
  ON feedback_submissions(retention_status, created_at DESC);

CREATE TABLE admin_audit_logs_v2 (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('feedback_reviewed','feedback_archived','feedback_restored','feedback_deleted')),
  target_type TEXT NOT NULL CHECK(target_type IN ('feedback')),
  target_id TEXT NOT NULL,
  before_json TEXT NOT NULL,
  after_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
INSERT INTO admin_audit_logs_v2(id,admin_user_id,action,target_type,target_id,before_json,after_json,created_at)
  SELECT id,admin_user_id,action,target_type,target_id,before_json,after_json,created_at FROM admin_audit_logs;
DROP TABLE admin_audit_logs;
ALTER TABLE admin_audit_logs_v2 RENAME TO admin_audit_logs;
CREATE INDEX idx_admin_audit_logs_admin_created ON admin_audit_logs(admin_user_id, created_at DESC);
CREATE INDEX idx_admin_audit_logs_target ON admin_audit_logs(target_type, target_id, created_at DESC);
