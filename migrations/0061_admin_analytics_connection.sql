-- Credential ciphertext is never included in dashboard report responses.
CREATE TABLE IF NOT EXISTS admin_analytics_connection (
  id INTEGER PRIMARY KEY CHECK(id=1),
  encrypted_refresh_token TEXT NOT NULL,
  granted_scopes TEXT NOT NULL,
  connected_by TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
