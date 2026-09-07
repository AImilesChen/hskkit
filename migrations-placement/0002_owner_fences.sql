CREATE TABLE IF NOT EXISTS placement_owner_fences (
  owner_id TEXT PRIMARY KEY,
  state TEXT NOT NULL CHECK(state IN ('merged','deleted')),
  target_owner_id TEXT,
  created_at TEXT NOT NULL
);
