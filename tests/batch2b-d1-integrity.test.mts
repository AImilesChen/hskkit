import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

async function migratedDb() {
  const db = new DatabaseSync(":memory:");
  const files = (await readdir("migrations")).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
  for (const file of files) db.exec(await readFile(path.join("migrations", file), "utf8"));
  return db;
}

test("admin PackPurchase revocation matches the migrated D1 schema and preserves consumed audit tokens", async () => {
  const db = await migratedDb();
  const at = "2026-08-24T12:00:00.000Z";
  db.exec("PRAGMA foreign_keys=OFF");
  db.prepare("INSERT INTO commerce_orders(id,user_id,sku,amount_cents,currency,selected_level,status,stripe_mode,idempotency_key,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)")
    .run("ord_1", "usr_1", "hskkit_advanced_study_pdf_pack_v1", 999, "usd", 3, "paid", "test", "idem_1", at, at);
  db.prepare("INSERT INTO pack_purchases(id,user_id,order_id,sku,selected_level,status,starts_at,expires_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)")
    .run("pack_1", "usr_1", "ord_1", "hskkit_advanced_study_pdf_pack_v1", 3, "active", at, "2026-11-22T12:00:00.000Z", at);
  db.prepare("INSERT INTO commercial_export_jobs(id,user_id,pack_purchase_id,kind,format,level,state,idempotency_key,generation_version,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)")
    .run("exp_1", "usr_1", "pack_1", "pdf_pack", "pdf", 3, "ready", "job_1", "v1", "2026-09-07T12:00:00.000Z", at, at);
  db.prepare("INSERT INTO commercial_download_tokens(id,job_id,user_id,token_sha256,expires_at,consumed_at,created_at) VALUES(?,?,?,?,?,?,?)")
    .run("tok_used", "exp_1", "usr_1", "hash_used", "2026-08-25T12:00:00.000Z", at, at);
  db.prepare("INSERT INTO commercial_download_tokens(id,job_id,user_id,token_sha256,expires_at,created_at) VALUES(?,?,?,?,?,?)")
    .run("tok_open", "exp_1", "usr_1", "hash_open", "2026-08-25T12:00:00.000Z", at);
  db.prepare("INSERT INTO commercial_download_ledger(id,token_id,job_id,pack_purchase_id,user_id,byte_size,checksum_sha256,succeeded_at) VALUES(?,?,?,?,?,?,?,?)")
    .run("dl_1", "tok_used", "exp_1", "pack_1", "usr_1", 100, "checksum", at);
  db.exec("PRAGMA foreign_keys=ON");

  db.exec("BEGIN");
  db.prepare("UPDATE pack_purchases SET status='revoked',revoked_reason=?,version=version+1,updated_at=? WHERE id=? AND status='active'").run("manual_review", at, "pack_1");
  db.prepare("UPDATE commercial_export_jobs SET state='revoked',error_code='PACK_PURCHASE_REVOKED',lease_owner=NULL,lease_expires_at=NULL,updated_at=? WHERE pack_purchase_id=? AND state!='revoked'").run(at, "pack_1");
  db.prepare("DELETE FROM commercial_download_tokens WHERE consumed_at IS NULL AND job_id IN (SELECT id FROM commercial_export_jobs WHERE pack_purchase_id=?)").run("pack_1");
  db.prepare("INSERT INTO commercial_audit_events(id,user_id,event_type,entity_type,entity_id,details_json,created_at) SELECT ?,user_id,'pack_purchase_revoked','pack_purchase',?,json_object('reason',?),? FROM pack_purchases WHERE id=?")
    .run("audit_1", "pack_1", "manual_review", at, "pack_1");
  db.exec("COMMIT");

  assert.equal(db.prepare("SELECT status FROM pack_purchases WHERE id='pack_1'").get()?.status, "revoked");
  assert.equal(db.prepare("SELECT state FROM commercial_export_jobs WHERE id='exp_1'").get()?.state, "revoked");
  assert.equal(db.prepare("SELECT count(*) count FROM commercial_download_tokens WHERE id='tok_open'").get()?.count, 0);
  assert.equal(db.prepare("SELECT count(*) count FROM commercial_download_tokens WHERE id='tok_used'").get()?.count, 1);
  assert.equal(db.prepare("SELECT details_json FROM commercial_audit_events WHERE id='audit_1'").get()?.details_json, '{"reason":"manual_review"}');
});

test("delayed PackPurchase grant cannot reactivate a concurrently refunded order", async () => {
  const db = await migratedDb();
  const at = "2026-08-24T12:00:00.000Z";
  const storage = await readFile("src/lib/commercial/storage.ts", "utf8");
  const sql = storage.match(/export const packPurchaseGrantInsertSql = `([^`]+)`;/)?.[1];
  assert.ok(sql, "grant SQL must be present in storage");
  db.exec("PRAGMA foreign_keys=OFF");
  db.prepare("INSERT INTO commerce_orders(id,user_id,sku,amount_cents,currency,selected_level,status,stripe_mode,idempotency_key,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)")
    .run("ord_race", "usr_race", "hskkit_advanced_study_pdf_pack_v1", 999, "usd", 3, "refunded", "test", "idem_race", at, at);

  db.prepare(sql).run("pack_after_refund", at, "2026-09-07T12:00:00.000Z", 3, at, "ord_race", "hskkit_advanced_study_pdf_pack_v1");
  assert.equal(db.prepare("SELECT count(*) count FROM pack_purchases WHERE order_id='ord_race'").get()?.count, 0);

  db.prepare("UPDATE commerce_orders SET status='paid' WHERE id='ord_race'").run();
  db.prepare(sql).run("pack_after_paid", at, "2026-09-07T12:00:00.000Z", 3, at, "ord_race", "hskkit_advanced_study_pdf_pack_v1");
  const granted = db.prepare("SELECT id,status FROM pack_purchases WHERE order_id='ord_race'").get();
  assert.equal(granted?.id, "pack_after_paid");
  assert.equal(granted?.status, "active");
});

test("migration backfills export expiry and runtime creation persists an expiry", async () => {
  const migration = await readFile("migrations/0016_batch2b_pack_purchases.sql", "utf8");
  const storage = await readFile("src/lib/commercial/storage.ts", "utf8");
  assert.match(migration, /UPDATE commercial_export_jobs SET expires_at=.*WHERE expires_at IS NULL/);
  assert.match(storage, /const expiresAt=/);
  assert.match(storage, /generation_version,expires_at,created_at,updated_at/);
});
