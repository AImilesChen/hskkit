ALTER TABLE blog_posts ADD COLUMN published_version_number INTEGER;
CREATE INDEX IF NOT EXISTS idx_blog_posts_public_version ON blog_posts(status, published_at, published_version_number);

CREATE TABLE blog_audit_logs_v2 (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('create','edit','autosave','publish','schedule','withdraw','restore','upload')),
  post_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(metadata_json)),
  created_at TEXT NOT NULL
);
INSERT INTO blog_audit_logs_v2(id,actor_user_id,actor_email,action,post_id,metadata_json,created_at)
SELECT id,actor_user_id,actor_email,action,post_id,metadata_json,created_at FROM blog_audit_logs;
DROP TABLE blog_audit_logs;
ALTER TABLE blog_audit_logs_v2 RENAME TO blog_audit_logs;
CREATE INDEX IF NOT EXISTS idx_blog_audit_created ON blog_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_audit_post ON blog_audit_logs(post_id, created_at DESC);