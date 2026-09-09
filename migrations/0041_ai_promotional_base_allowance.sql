-- Promotional and manually granted Pro access can legitimately carry more than
-- the standard 500-credit paid base. Keep the operation snapshot compatible
-- with the quota bucket's existing 2,000-credit ceiling.
CREATE TABLE ai_operations_base_allowance_v2 (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  feature TEXT NOT NULL CHECK(feature IN ('explanation','study_plan')),
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('reserved','succeeded','failed')),
  quota_period TEXT NOT NULL,
  cost_units INTEGER NOT NULL CHECK(cost_units = 1),
  response_json TEXT,
  failure_code TEXT,
  provider_request_id TEXT,
  prompt_tokens INTEGER CHECK(prompt_tokens IS NULL OR prompt_tokens >= 0),
  completion_tokens INTEGER CHECK(completion_tokens IS NULL OR completion_tokens BETWEEN 0 AND 500),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  credit_units INTEGER NOT NULL DEFAULT 1 CHECK(credit_units IN (1,5)),
  base_credit_allowance INTEGER NOT NULL DEFAULT 0 CHECK(base_credit_allowance BETWEEN 0 AND 2000),
  UNIQUE(owner_id, feature, idempotency_key)
);

INSERT INTO ai_operations_base_allowance_v2(
  id,owner_id,feature,idempotency_key,request_hash,status,quota_period,cost_units,
  response_json,failure_code,provider_request_id,prompt_tokens,completion_tokens,
  created_at,updated_at,credit_units,base_credit_allowance
)
SELECT
  id,owner_id,feature,idempotency_key,request_hash,status,quota_period,cost_units,
  response_json,failure_code,provider_request_id,prompt_tokens,completion_tokens,
  created_at,updated_at,credit_units,base_credit_allowance
FROM ai_operations;

DROP TABLE ai_operations;
ALTER TABLE ai_operations_base_allowance_v2 RENAME TO ai_operations;
CREATE INDEX idx_ai_operations_owner_time ON ai_operations(owner_id, created_at DESC);
CREATE INDEX idx_ai_operations_status ON ai_operations(status, updated_at);
