ALTER TABLE study_plan_versions ADD COLUMN signals_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE study_plan_versions ADD COLUMN adjustment_reasons_json TEXT NOT NULL DEFAULT '[]';

CREATE TABLE policy_audit_events (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  policy TEXT NOT NULL CHECK(policy='hskkit-access-v1'),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK(resource_type IN ('learning','planner','account')),
  resource_id TEXT NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('allowed','denied','success','conflict','failed')),
  idempotency_key TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  UNIQUE(subject_id,action,idempotency_key,result)
);
CREATE INDEX policy_audit_subject_created_idx ON policy_audit_events(subject_id,created_at DESC);
