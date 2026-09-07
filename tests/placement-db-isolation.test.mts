import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Placement high-frequency state has a dedicated normalized D1 schema", () => {
  const migration = read("migrations-placement/0001_placement_state.sql");
  const fences = read("migrations-placement/0002_owner_fences.sql");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS placement_owner_revisions/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS placement_sessions/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS placement_answers/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS placement_results/);
  assert.match(migration, /UNIQUE\s*\(owner_id,idempotency_key\)/i);
  assert.match(migration, /UNIQUE\s*\(session_id,idempotency_key\)/i);
  assert.doesNotMatch(migration, /state_json/i, "the new store must not copy the monolithic learning state blob");
  assert.match(fences, /placement_owner_fences/);
});

test("Placement runtime is isolated from the legacy monolithic learning state", () => {
  const server = read("src/lib/placement/server.ts");
  const repository = read("src/lib/placement/storage.ts");
  assert.doesNotMatch(server, /from "@\/lib\/learning\/storage"/);
  assert.match(server, /loadPlacementState/);
  assert.match(server, /savePlacementState/);
  assert.match(repository, /env\.PLACEMENT_DB/);
  assert.doesNotMatch(repository, /env\.LEARNING_DB/);
});

test("Placement cutover remains gray, migratable, and fail-closed", () => {
  const repository = read("src/lib/placement/storage.ts");
  const backfill = read("scripts/migrate-placement-db.mjs");
  const config = read("wrangler.jsonc");
  assert.match(repository, /PLACEMENT_DB_MODE/);
  assert.match(repository, /shadow/);
  assert.match(repository, /primary/);
  assert.match(repository, /PLACEMENT_STATE_MISMATCH/);
  assert.match(repository, /STALE_PLACEMENT_IMPORT/);
  assert.match(repository, /placement_owner_fences/);
  assert.match(backfill, /--dry-run/);
  assert.match(backfill, /--apply/);
  assert.match(backfill, /revision/);
  assert.match(config, /"binding": "PLACEMENT_DB"/);
  assert.match(config, /"migrations_dir": "migrations-placement"/);
});

test("Placement writes preserve CAS and idempotency contracts", () => {
  const repository = read("src/lib/placement/storage.ts");
  const server = read("src/lib/placement/server.ts");
  assert.match(repository, /placement_cas_assertions/);
  assert.match(repository, /REVISION_CONFLICT/);
  assert.match(repository, /ON CONFLICT\(session_id,question_id\)/);
  assert.match(repository, /idempotency_key/);
  assert.match(repository, /const \[revisionRows, sessionRows, answerRows, resultRows\] = await db\.batch/);
  assert.match(server, /engagementActivity, action === "submit"/);
  assert.match(repository, /rollback-safe legacy copy[\s\S]*await syncLegacyPlacementProjection[\s\S]*if \(changed\) await saveNormalizedPlacement/);
});

test("Account export, merge and erasure explicitly include isolated Placement data", () => {
  const account = read("src/lib/account/storage.ts");
  assert.match(account, /loadPlacementState/);
  assert.match(account, /mergePlacementOwners/);
  assert.match(account, /deletePlacementOwner/);
  assert.match(account, /placementDbMode/);
  assert.match(account, /await deletePlacementOwner[\s\S]*UPDATE accounts SET status='deleted'[\s\S]*restorePlacementOwnerAfterFailedDeletion/);
});

test("Placement backfill is repeatable without inflating normalized revisions", () => {
  const backfill = read("scripts/migrate-placement-db.mjs");
  assert.match(backfill, /targetRevision >= Number\(row\.revision\)/);
  assert.doesNotMatch(backfill, /revision=placement_owner_revisions\.revision\+1/);
  assert.match(backfill, /revision-regressed/);
});
