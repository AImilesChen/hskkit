PRAGMA foreign_keys = ON;

CREATE TABLE feedback_submissions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('bug', 'suggestion', 'other')),
  message TEXT NOT NULL CHECK(length(trim(message)) BETWEEN 1 AND 2000),
  email TEXT CHECK(email IS NULL OR length(email) BETWEEN 3 AND 254),
  page_path TEXT NOT NULL CHECK(length(page_path) BETWEEN 1 AND 500),
  browser_category TEXT NOT NULL CHECK(length(browser_category) BETWEEN 1 AND 40),
  device_category TEXT NOT NULL CHECK(device_category IN ('desktop', 'mobile', 'tablet', 'unknown')),
  idempotency_key TEXT NOT NULL UNIQUE CHECK(length(idempotency_key) BETWEEN 16 AND 128),
  notification_status TEXT NOT NULL CHECK(notification_status IN ('pending', 'sent', 'failed')),
  notification_provider_id TEXT,
  notification_error_code TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_feedback_submissions_created_at
  ON feedback_submissions(created_at DESC);
CREATE INDEX idx_feedback_submissions_notification_status
  ON feedback_submissions(notification_status, created_at);

CREATE TABLE feedback_rate_limits (
  key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL CHECK(count >= 1),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(key, window_start)
);

CREATE INDEX idx_feedback_rate_limits_updated_at
  ON feedback_rate_limits(updated_at);
