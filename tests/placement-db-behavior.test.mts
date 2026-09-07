import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const migration = (name: string) => readFileSync(new URL(`../migrations-placement/${name}`, import.meta.url), "utf8");
const fresh = () => {
  const db = new DatabaseSync(":memory:");
  db.exec(migration("0001_placement_state.sql"));
  db.exec(migration("0002_owner_fences.sql"));
  return db;
};

function seed(db: DatabaseSync) {
  db.exec(`
    INSERT INTO placement_owner_revisions(owner_id,revision,updated_at) VALUES('guest:a',2,'2026-01-01');
    INSERT INTO placement_sessions(id,owner_id,idempotency_key,question_version,question_ids_json,status,created_at,expires_at,updated_at)
      VALUES('s-new','guest:a','start-new','v1','["q1"]','in_progress','2026-01-01','2026-01-08','2026-01-01');
  `);
}

test("stale shadow import fails inside the transaction and cannot replace a newer owner snapshot", () => {
  const db = fresh();
  seed(db);
  assert.throws(() => db.exec(`
    BEGIN;
    INSERT INTO placement_owner_revisions(owner_id,revision,migrated_at,updated_at)
      SELECT 'guest:a',1,'2025-01-01','2025-01-01'
      WHERE NOT EXISTS(SELECT 1 FROM placement_owner_fences WHERE owner_id='guest:a')
      ON CONFLICT(owner_id) DO UPDATE SET revision=excluded.revision
      WHERE placement_owner_revisions.revision<=excluded.revision
        AND NOT EXISTS(SELECT 1 FROM placement_owner_fences WHERE owner_id=excluded.owner_id);
    INSERT INTO placement_cas_assertions(id,ok) VALUES('stale',CASE changes() WHEN 1 THEN 1 ELSE 0 END);
    DELETE FROM placement_sessions WHERE owner_id='guest:a';
    COMMIT;
  `), /CHECK constraint/);
  try { db.exec("ROLLBACK"); } catch {}
  assert.equal(db.prepare("SELECT revision FROM placement_owner_revisions WHERE owner_id='guest:a'").get()?.revision, 2);
  assert.equal(db.prepare("SELECT id FROM placement_sessions WHERE owner_id='guest:a'").get()?.id, "s-new");
});

test("a merged-owner fence rejects late Placement writes before guest cleanup", () => {
  const db = fresh();
  seed(db);
  db.exec("INSERT INTO placement_owner_fences(owner_id,state,target_owner_id,created_at) VALUES('guest:a','merged','user:b','2026-01-02')");
  assert.throws(() => db.exec(`
    BEGIN;
    INSERT INTO placement_owner_revisions(owner_id,revision,updated_at)
      SELECT 'guest:a',1,'2026-01-03'
      WHERE NOT EXISTS(SELECT 1 FROM placement_owner_fences WHERE owner_id='guest:a')
      ON CONFLICT(owner_id) DO UPDATE SET revision=placement_owner_revisions.revision+1
      WHERE placement_owner_revisions.revision=2
        AND NOT EXISTS(SELECT 1 FROM placement_owner_fences WHERE owner_id=excluded.owner_id);
    INSERT INTO placement_cas_assertions(id,ok) VALUES('late-write',CASE changes() WHEN 1 THEN 1 ELSE 0 END);
    COMMIT;
  `), /CHECK constraint/);
  try { db.exec("ROLLBACK"); } catch {}
  assert.equal(db.prepare("SELECT revision FROM placement_owner_revisions WHERE owner_id='guest:a'").get()?.revision, 2);
});

test("a deleted-owner fence survives cleanup and rejects a racing save", () => {
  const db = fresh();
  seed(db);
  db.exec(`
    BEGIN;
    INSERT INTO placement_owner_fences(owner_id,state,target_owner_id,created_at)
      VALUES('guest:a','deleted',NULL,'2026-01-02')
      ON CONFLICT(owner_id) DO UPDATE SET state='deleted',target_owner_id=NULL,created_at=excluded.created_at;
    DELETE FROM placement_sessions WHERE owner_id='guest:a';
    DELETE FROM placement_results WHERE owner_id='guest:a';
    DELETE FROM placement_owner_revisions WHERE owner_id='guest:a';
    COMMIT;
  `);
  assert.equal(db.prepare("SELECT state FROM placement_owner_fences WHERE owner_id='guest:a'").get()?.state, "deleted");
  assert.throws(() => db.exec(`
    BEGIN;
    INSERT INTO placement_owner_revisions(owner_id,revision,updated_at)
      SELECT 'guest:a',1,'2026-01-03'
      WHERE NOT EXISTS(SELECT 1 FROM placement_owner_fences WHERE owner_id='guest:a');
    INSERT INTO placement_cas_assertions(id,ok) VALUES('deleted-write',CASE changes() WHEN 1 THEN 1 ELSE 0 END);
    COMMIT;
  `), /CHECK constraint/);
  try { db.exec("ROLLBACK"); } catch {}
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM placement_owner_revisions WHERE owner_id='guest:a'").get()?.count, 0);
});

test("guest merge transfers session, answers and result ownership before guest cleanup", () => {
  const db = fresh();
  db.exec(`
    INSERT INTO placement_owner_revisions(owner_id,revision,updated_at) VALUES('user:b',1,'2026-01-01'),('guest:a',1,'2026-01-01');
    INSERT INTO placement_sessions(id,owner_id,idempotency_key,question_version,question_ids_json,status,created_at,expires_at,updated_at)
      VALUES('s-guest','guest:a','start-guest','v1','["q1"]','submitted','2026-01-01','2026-01-08','2026-01-01');
    INSERT INTO placement_answers(session_id,question_id,answer,idempotency_key,answered_at)
      VALUES('s-guest','q1','A','answer-guest','2026-01-01');
    INSERT INTO placement_results(id,owner_id,session_id,submit_idempotency_key,result_json,created_at)
      VALUES('r-guest','guest:a','s-guest','submit-guest','{}','2026-01-01');
    INSERT INTO placement_sessions(id,owner_id,idempotency_key,question_version,question_ids_json,status,created_at,expires_at,updated_at)
      VALUES('s-guest','user:b','start-guest','v1','["q1"]','submitted','2026-01-01','2026-01-08','2026-01-01')
      ON CONFLICT(id) DO UPDATE SET owner_id=excluded.owner_id;
    INSERT INTO placement_results(id,owner_id,session_id,submit_idempotency_key,result_json,created_at)
      VALUES('r-guest','user:b','s-guest','submit-guest','{}','2026-01-01')
      ON CONFLICT(id) DO UPDATE SET owner_id=excluded.owner_id,session_id=excluded.session_id,submit_idempotency_key=excluded.submit_idempotency_key,result_json=excluded.result_json;
    DELETE FROM placement_sessions WHERE owner_id='guest:a';
    DELETE FROM placement_results WHERE owner_id='guest:a';
    DELETE FROM placement_owner_revisions WHERE owner_id='guest:a';
  `);
  assert.equal(db.prepare("SELECT owner_id FROM placement_sessions WHERE id='s-guest'").get()?.owner_id, "user:b");
  assert.equal(db.prepare("SELECT answer FROM placement_answers WHERE session_id='s-guest' AND question_id='q1'").get()?.answer, "A");
  assert.equal(db.prepare("SELECT owner_id FROM placement_results WHERE id='r-guest'").get()?.owner_id, "user:b");
});

test("answer and submit idempotency keys are enforced by the normalized schema", () => {
  const db = fresh();
  seed(db);
  db.exec("INSERT INTO placement_answers(session_id,question_id,answer,idempotency_key,answered_at) VALUES('s-new','q1','A','answer-1','2026-01-01')");
  assert.throws(() => db.exec("INSERT INTO placement_answers(session_id,question_id,answer,idempotency_key,answered_at) VALUES('s-new','q2','B','answer-1','2026-01-01')"), /UNIQUE constraint/);
  db.exec("INSERT INTO placement_results(id,owner_id,session_id,submit_idempotency_key,result_json,created_at) VALUES('r1','guest:a','s-new','submit-1','{}','2026-01-01')");
  assert.throws(() => db.exec("INSERT INTO placement_results(id,owner_id,session_id,submit_idempotency_key,result_json,created_at) VALUES('r2','guest:a','s-new','submit-2','{}','2026-01-01')"), /UNIQUE constraint/);
});

test("rollback command fails closed without an explicit ref and confirmation token", () => {
  const script = new URL("../scripts/rollback-placement.mjs", import.meta.url);
  const run = spawnSync(process.execPath, [script.pathname], { encoding: "utf8", env: {} });
  assert.notEqual(run.status, 0);
  assert.match(`${run.stdout}${run.stderr}`, /Refusing rollback/);
});
