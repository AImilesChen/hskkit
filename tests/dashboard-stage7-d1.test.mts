import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { LEARNING_HEARTBEAT_DAY_SQL, LEARNING_POINT_AWARD_SQL } from "../src/lib/engagement/sql.ts";

const migration = readFileSync(new URL("../migrations/0033_learning_engagement_rewards.sql", import.meta.url), "utf8");
const fresh = () => { const db = new DatabaseSync(":memory:"); db.exec(migration); return db; };

function award(db: DatabaseSync, owner: string, day: string) {
  const period = day.slice(0, 7);
  const timestamp = new Date().toISOString();
  db.prepare("INSERT OR IGNORE INTO learning_engagement_days(owner_id,local_day,active_seconds,last_heartbeat_at,created_at,updated_at) VALUES(?,?,900,?,?,?)").run(owner, day, timestamp, timestamp, timestamp);
  db.prepare("INSERT OR IGNORE INTO learning_qualifying_tasks(id,owner_id,local_day,action,idempotency_key,created_at) VALUES(?,?,?,?,?,?)").run(crypto.randomUUID(), owner, day, "practice_answer", `task:${day}`, timestamp);
  db.prepare(LEARNING_POINT_AWARD_SQL).run(crypto.randomUUID(), owner, day, period, owner, period, owner, period, owner, period, `effective-day:${day}`, timestamp, owner, day, owner, day);
}

function heartbeat(db: DatabaseSync, owner: string, id: string, timestamp: string, seconds = 30) {
  db.exec("BEGIN");
  try {
    db.prepare("INSERT INTO learning_engagement_heartbeats(id,owner_id,local_day,credited_seconds,created_at) VALUES(?,?,?,?,?)").run(id, owner, "2026-09-05", seconds, timestamp);
    db.prepare(LEARNING_HEARTBEAT_DAY_SQL).run(owner, "2026-09-05", seconds, timestamp, timestamp, timestamp);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function qualifyingTaskBatch(db: DatabaseSync, owner: string, day: string, timestamp: string) {
  const period = day.slice(0, 7);
  db.exec("BEGIN");
  try {
    db.prepare("INSERT OR IGNORE INTO learning_qualifying_tasks(id,owner_id,local_day,action,idempotency_key,created_at) VALUES(?,?,?,?,?,?)").run(crypto.randomUUID(), owner, day, "practice_answer", `task-batch:${day}`, timestamp);
    db.prepare("INSERT INTO learning_engagement_days(owner_id,local_day,active_seconds,last_heartbeat_at,created_at,updated_at) VALUES(?,?,0,?,?,?) ON CONFLICT(owner_id,local_day) DO UPDATE SET updated_at=excluded.updated_at").run(owner, day, timestamp, timestamp, timestamp);
    db.prepare(LEARNING_POINT_AWARD_SQL).run(crypto.randomUUID(), owner, day, period, owner, period, owner, period, owner, period, `effective-day:${day}`, timestamp, owner, day, owner, day);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

test("real SQLite migration enforces one daily award and computes monthly tiers atomically", () => {
  const db = fresh();
  for (let day = 1; day <= 22; day += 1) award(db, "user:1", `2026-09-${String(day).padStart(2, "0")}`);
  const units = db.prepare("SELECT units FROM learning_point_ledger ORDER BY local_day").all().map((row) => Number(row.units));
  assert.deepEqual(units, [...Array(7).fill(2), ...Array(7).fill(4), ...Array(7).fill(6), 10]);
  assert.throws(() => award(db, "user:1", "2026-09-22"));
  assert.equal(db.prepare("SELECT SUM(units) total FROM learning_point_ledger").get()!.total, 94);
});

test("reward timezone is frozen on first use so profile edits cannot mint a second local day", () => {
  const db = fresh();
  db.prepare("INSERT OR IGNORE INTO learning_reward_profiles(owner_id,timezone,created_at) VALUES(?,?,?)").run("user:1", "UTC", "2026-09-05T00:00:00.000Z");
  db.prepare("INSERT OR IGNORE INTO learning_reward_profiles(owner_id,timezone,created_at) VALUES(?,?,?)").run("user:1", "Pacific/Kiritimati", "2026-09-05T00:01:00.000Z");
  assert.equal(db.prepare("SELECT timezone FROM learning_reward_profiles WHERE owner_id=?").get("user:1")!.timezone, "UTC");
});

test("a qualifying task completed after 900 seconds awards immediately without another heartbeat", () => {
  const db = fresh();
  const timestamp = "2026-09-05T12:00:00.000Z";
  db.prepare("INSERT INTO learning_engagement_days(owner_id,local_day,active_seconds,last_heartbeat_at,created_at,updated_at) VALUES(?,?,900,?,?,?)").run("user:1", "2026-09-05", timestamp, timestamp, timestamp);
  qualifyingTaskBatch(db, "user:1", "2026-09-05", timestamp);
  assert.equal(db.prepare("SELECT units FROM learning_point_ledger WHERE owner_id=? AND local_day=?").get("user:1", "2026-09-05")!.units, 2);
});

test("a qualifying task can initialize a new day without violating heartbeat constraints", () => {
  const db = fresh();
  assert.doesNotThrow(() => qualifyingTaskBatch(db, "user:1", "2026-09-05", "2026-09-05T12:00:00.000Z"));
  assert.equal(db.prepare("SELECT active_seconds FROM learning_engagement_days WHERE owner_id=?").get("user:1")!.active_seconds, 0);
  assert.equal(db.prepare("SELECT COUNT(*) count FROM learning_point_ledger WHERE owner_id=?").get("user:1")!.count, 0);
});

test("Stage 7 export queries and deletion statements match the migrated schema", () => {
  const db = fresh();
  const owner = "user:1";
  db.prepare("INSERT INTO learning_reward_profiles(owner_id,timezone,created_at) VALUES(?,?,?)").run(owner, "UTC", "2026-09-05T00:00:00.000Z");
  award(db, owner, "2026-09-05");
  db.prepare("INSERT INTO learning_badges(id,owner_id,badge_key,milestone_days,awarded_at) VALUES(?,?,?,?,?)").run(crypto.randomUUID(), owner, "streak-3", 3, "2026-09-05T00:00:00.000Z");
  assert.doesNotThrow(() => {
    db.prepare("SELECT local_day,active_seconds,last_heartbeat_at,created_at,updated_at FROM learning_engagement_days WHERE owner_id=? ORDER BY local_day").all(owner);
    db.prepare("SELECT local_day,action,created_at FROM learning_qualifying_tasks WHERE owner_id=? ORDER BY created_at").all(owner);
    db.prepare("SELECT badge_key,awarded_at FROM learning_badges WHERE owner_id=? ORDER BY awarded_at").all(owner);
  });
  for (const table of ["learning_engagement_sessions", "learning_engagement_heartbeats", "learning_qualifying_tasks", "learning_badges", "learning_point_ledger", "learning_engagement_days", "learning_reward_profiles"]) {
    db.prepare(`DELETE FROM ${table} WHERE owner_id=?`).run(owner);
  }
  assert.equal(db.prepare("SELECT COUNT(*) count FROM learning_reward_profiles WHERE owner_id=?").get(owner)!.count, 0);
});

test("real SQLite heartbeat batch is replay-safe and concurrent tabs cannot multiply wall time", () => {
  const db = fresh();
  heartbeat(db, "user:1", "heartbeat_00000001", "2026-09-05T10:00:00.000Z");
  heartbeat(db, "user:1", "heartbeat_00000002", "2026-09-05T10:00:00.000Z");
  assert.equal(db.prepare("SELECT active_seconds FROM learning_engagement_days").get()!.active_seconds, 30);
  heartbeat(db, "user:1", "heartbeat_00000003", "2026-09-05T10:00:30.000Z");
  assert.equal(db.prepare("SELECT active_seconds FROM learning_engagement_days").get()!.active_seconds, 60);
  assert.throws(() => heartbeat(db, "user:1", "heartbeat_00000003", "2026-09-05T10:01:00.000Z"));
  assert.equal(db.prepare("SELECT active_seconds FROM learning_engagement_days").get()!.active_seconds, 60);
});
