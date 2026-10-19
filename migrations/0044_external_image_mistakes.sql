-- D1 CHECK constraints require rebuilding the operation table for the new AI feature.
CREATE TABLE ai_operations_image_mistake_v3 (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  feature TEXT NOT NULL CHECK(feature IN ('explanation','study_plan','image_mistake')),
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
  UNIQUE(owner_id,feature,idempotency_key)
);
INSERT INTO ai_operations_image_mistake_v3 SELECT * FROM ai_operations;
DROP TABLE ai_operations;
ALTER TABLE ai_operations_image_mistake_v3 RENAME TO ai_operations;
CREATE INDEX idx_ai_operations_owner_time ON ai_operations(owner_id,created_at DESC);
CREATE INDEX idx_ai_operations_status ON ai_operations(status,updated_at);

-- Save only the confirmed text/result. Uploaded image bytes never enter D1 or R2.
CREATE TABLE external_image_mistakes (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  operation_id TEXT NOT NULL UNIQUE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  learner_mistake TEXT NOT NULL,
  next_step TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK(confidence IN ('high','medium')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(operation_id) REFERENCES ai_operations(id) ON DELETE CASCADE
);
CREATE INDEX external_image_mistakes_owner_time ON external_image_mistakes(owner_id,created_at DESC);

CREATE TABLE image_mistake_corrections (
  operation_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('reserved','failed','succeeded')),
  attempts INTEGER NOT NULL DEFAULT 1 CHECK(attempts BETWEEN 1 AND 3),
  corrected_question TEXT NOT NULL,
  corrected_answer TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(operation_id) REFERENCES ai_operations(id) ON DELETE CASCADE
);

-- Two image analyses gifted once the seven-day trial has ended. The gift is
-- account-bound and remains usable without a Pro subscription.
CREATE TABLE post_trial_ai_credits (
  owner_id TEXT PRIMARY KEY,
  trial_id TEXT NOT NULL UNIQUE,
  granted_units INTEGER NOT NULL CHECK(granted_units = 10),
  remaining_units INTEGER NOT NULL CHECK(remaining_units BETWEEN 0 AND 10),
  created_at TEXT NOT NULL
);
