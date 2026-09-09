import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const currentSchema = `
CREATE TABLE ai_operations (
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
  base_credit_allowance INTEGER NOT NULL DEFAULT 0 CHECK(base_credit_allowance BETWEEN 0 AND 500),
  UNIQUE(owner_id, feature, idempotency_key)
);
CREATE INDEX idx_ai_operations_owner_time ON ai_operations(owner_id, created_at DESC);
CREATE INDEX idx_ai_operations_status ON ai_operations(status, updated_at);
`;

const insertOperation = (db: DatabaseSync, id: string, baseAllowance: number) => {
  db.prepare(`INSERT INTO ai_operations(
    id,owner_id,feature,idempotency_key,request_hash,status,quota_period,cost_units,
    response_json,failure_code,provider_request_id,prompt_tokens,completion_tokens,
    created_at,updated_at,credit_units,base_credit_allowance
  ) VALUES(?,?,?,?,?,'succeeded','2026-09',1,NULL,NULL,NULL,10,5,?,?,1,?)`).run(
    id,
    `user:${id}`,
    "explanation",
    `idem-${id}`,
    `hash-${id}`,
    "2026-09-09T00:00:00.000Z",
    "2026-09-09T00:00:01.000Z",
    baseAllowance,
  );
};

test("AI reservations accept promotional base allowances above 500 without losing existing operations", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(currentSchema);
  insertOperation(db, "existing", 500);
  assert.throws(() => insertOperation(db, "before-migration", 550));

  const migration = readFileSync(new URL("../migrations/0041_ai_promotional_base_allowance.sql", import.meta.url), "utf8");
  db.exec(migration);

  insertOperation(db, "promotional-550", 550);
  const rows = db.prepare("SELECT id,base_credit_allowance FROM ai_operations ORDER BY id").all() as Array<{ id: string; base_credit_allowance: number }>;
  assert.deepEqual(rows.map((row) => ({ ...row })), [
    { id: "existing", base_credit_allowance: 500 },
    { id: "promotional-550", base_credit_allowance: 550 },
  ]);
  assert.throws(() => insertOperation(db, "above-supported-limit", 2001));
  assert.throws(() => insertOperation(db, "promotional-550", 550));
  const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name IN ('idx_ai_operations_owner_time','idx_ai_operations_status') ORDER BY name").all() as Array<{ name: string }>;
  assert.deepEqual(indexes.map((row) => ({ ...row })), [
    { name: "idx_ai_operations_owner_time" },
    { name: "idx_ai_operations_status" },
  ]);
});

test("AI credits move from reserved to used only after a successful provider response", () => {
  const storage = readFileSync(new URL("../src/lib/ai/storage.ts", import.meta.url), "utf8");
  const route = readFileSync(new URL("../src/app/api/v1/ai/route.ts", import.meta.url), "utf8");
  const failureStart = storage.indexOf("export async function finalizeFailure");
  assert.ok(failureStart >= 0);
  const failurePath = storage.slice(failureStart);

  assert.match(storage, /UPDATE ai_quota_buckets SET reserved=reserved-\?,used=used\+\?/);
  assert.match(failurePath, /UPDATE ai_quota_buckets SET reserved=reserved-\?/);
  assert.doesNotMatch(failurePath, /used=used\+/);
  assert.match(route, /await finalizeSuccess\(\{ operation, output/);
  assert.match(route, /charged: true/);
  assert.match(route, /await finalizeFailure\(operation, failureCode\)/);
  assert.match(route, /status: "fallback", charged: false/);
});
