-- Admin console phase 1/2: review workflow and immutable audit trail.
ALTER TABLE feedback_submissions ADD COLUMN review_status TEXT NOT NULL DEFAULT 'unread' CHECK(review_status IN ('unread','read','resolved'));
ALTER TABLE feedback_submissions ADD COLUMN reviewed_at TEXT;
ALTER TABLE feedback_submissions ADD COLUMN reviewed_by TEXT;
ALTER TABLE feedback_submissions ADD COLUMN admin_note TEXT CHECK(admin_note IS NULL OR length(admin_note) <= 1000);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_review_status ON feedback_submissions(review_status, created_at DESC);

CREATE TABLE admin_audit_logs (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('feedback_reviewed')),
  target_type TEXT NOT NULL CHECK(target_type IN ('feedback')),
  target_id TEXT NOT NULL,
  before_json TEXT NOT NULL,
  after_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_created ON admin_audit_logs(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON admin_audit_logs(target_type, target_id, created_at DESC);
