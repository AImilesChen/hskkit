CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  featured_image_key TEXT,
  featured_image_alt TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','withdrawn')),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision > 0),
  published_version_number INTEGER,
  author_user_id TEXT NOT NULL,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(slug)
);
CREATE INDEX IF NOT EXISTS idx_blog_posts_public ON blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_updated ON blog_posts(updated_at DESC);

CREATE TABLE IF NOT EXISTS blog_post_versions (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  version_number INTEGER NOT NULL CHECK(version_number > 0),
  snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json)),
  created_by_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(post_id, version_number),
  FOREIGN KEY(post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_blog_versions_post ON blog_post_versions(post_id, version_number DESC);

CREATE TABLE IF NOT EXISTS blog_audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('create','edit','publish','withdraw','upload')),
  post_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(metadata_json)),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_blog_audit_created ON blog_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_audit_post ON blog_audit_logs(post_id, created_at DESC);