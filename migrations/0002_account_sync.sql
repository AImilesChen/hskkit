CREATE TABLE IF NOT EXISTS accounts (
  user_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  timezone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','deleted')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS account_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'sync-key',
  created_at TEXT NOT NULL,
  last_used_at TEXT,
  revoked_at TEXT,
  FOREIGN KEY(user_id) REFERENCES accounts(user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_account_tokens_user ON account_tokens(user_id);

CREATE TABLE IF NOT EXISTS guest_merges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  guest_owner_id TEXT NOT NULL,
  merge_token_hash TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL CHECK(state IN ('previewed','confirmed','cancelled','expired')),
  preview_json TEXT NOT NULL,
  account_revision INTEGER NOT NULL,
  guest_revision INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  UNIQUE(user_id, guest_owner_id),
  FOREIGN KEY(user_id) REFERENCES accounts(user_id)
);

CREATE TABLE IF NOT EXISTS sync_conflicts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  client_revision INTEGER NOT NULL,
  server_revision INTEGER NOT NULL,
  state TEXT NOT NULL DEFAULT 'open' CHECK(state IN ('open','resolved')),
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY(user_id) REFERENCES accounts(user_id)
);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_user ON sync_conflicts(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS account_data_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('export','delete')),
  state TEXT NOT NULL CHECK(state IN ('requested','confirmed','processing','ready','completed','failed','cancelled')),
  attempt INTEGER NOT NULL DEFAULT 1,
  requested_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  confirmed_at TEXT,
  completed_at TEXT,
  expires_at TEXT,
  failure_code TEXT,
  result_json TEXT,
  idempotency_key TEXT NOT NULL,
  UNIQUE(user_id, type, idempotency_key),
  FOREIGN KEY(user_id) REFERENCES accounts(user_id)
);
CREATE INDEX IF NOT EXISTS idx_account_data_requests_user ON account_data_requests(user_id, requested_at DESC);

CREATE TABLE IF NOT EXISTS account_audit (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  result TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, action, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_account_audit_user ON account_audit(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS account_cas_assertions (
  id TEXT PRIMARY KEY,
  ok INTEGER NOT NULL CHECK(ok = 1)
);
