import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";

import catalog from "../src/lib/content/catalog.json" with { type: "json" };
import manifest from "../content/releases/hsk3-content-truth-v5.json" with { type: "json" };
import runtimeIndex from "../src/lib/content/runtime-content-index.json" with { type: "json" };
import sourceQuestionIndex from "../src/lib/data/index.json" with { type: "json" };
import docsQuestionIndex from "../docs/content/questions/index.json" with { type: "json" };
import { STEP7_RELEASE_ID } from "../src/lib/learning/step7-release.ts";

const expectedCounts = { "1": 502, "2": 775, "3": 975, "4": 1002, "5": 1073, "6": 1142, "7-9": 5638 };
const questionFiles = ["hsk1.json", "hsk2.json", "hsk3.json", "hsk4.json", "hsk5.json", "level_test.json"] as const;
const text = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const digest = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

test("Batch 2 active release, runtime index, learning manifest and frozen counts share one version", () => {
  assert.equal(catalog.activeReleaseByStandard.hsk3, manifest.release_id);
  assert.equal(manifest.release_id, "hsk3-content-truth-v5");
  assert.equal(manifest.release_version, 5);
  assert.equal(runtimeIndex.releaseId, manifest.release_id);
  assert.equal(runtimeIndex.releaseVersion, manifest.release_version);
  assert.equal(STEP7_RELEASE_ID, manifest.release_id);
  assert.deepEqual(manifest.counts_by_level_band, expectedCounts);
  assert.equal(Object.values(expectedCounts).reduce((sum, count) => sum + count, 0), 11107);
  assert.equal(manifest.entry_count, 11107);
});

test("Levels 8 and 9 map explicitly to the single canonical HSK 7–9 ability band", () => {
  assert.match(manifest.level_scope[7], /single canonical unified HSK 7–9 advanced ability band/);
  assert.match(manifest.level_scope[8], /mapped to the unified HSK 7–9 advanced ability band/);
  assert.match(manifest.level_scope[9], /mapped to the unified HSK 7–9 advanced ability band/);
  assert.equal(manifest.counts_by_level_band["7-9"], 5638);
  for (const level of [8, 9]) {
    const runtimeLevel = runtimeIndex.levels.find((entry) => entry.level === level);
    assert.equal(runtimeLevel?.availability, "ready");
    assert.equal(runtimeLevel?.contentCount, 5638);
    assert.match(runtimeLevel?.message ?? "", /maps to the single canonical unified HSK 7–9 advanced ability band/);
  }
});

test("practice question source, documentation copy, indexes and release metadata are byte-identical", () => {
  assert.deepEqual(sourceQuestionIndex, docsQuestionIndex);
  let total = 0;
  for (const file of questionFiles) {
    const source = text(`src/lib/data/${file}`);
    const docs = text(`docs/content/questions/${file}`);
    assert.equal(source, docs, file);
    const parsed = JSON.parse(source);
    const questions = Array.isArray(parsed) ? parsed : parsed.questions;
    const recorded = sourceQuestionIndex.files[file];
    assert.equal(recorded.count, questions.length, file);
    assert.equal(recorded.sha256, digest(source), file);
    assert.equal(manifest.question_banks[file].count, questions.length, file);
    assert.equal(manifest.question_banks[file].sha256, digest(source), file);
    assert.equal(manifest.question_banks[file].status, "approved", file);
    total += questions.length;
  }
  assert.equal(total, 268);
  assert.equal(sourceQuestionIndex.total_questions, total);
});

test("D1 release migration upgrades the legacy key and preserves both release snapshots", () => {
  const seed = text("content/releases/hsk3-content-truth-v5.sql");
  const contentMigration = text("migrations/0018_content_truth_release.sql");
  const searchMigration = text("migrations/0019_catalog_search_index_v5.sql");
  assert.equal((seed.match(/INSERT INTO content_assets/g) ?? []).length, 11107);
  assert.match(seed, /ON CONFLICT\(release_id,id\)/);
  assert.match(contentMigration, /PRIMARY KEY \(release_id, id\)/);
  assert.equal((searchMigration.match(/INSERT INTO catalog_search_index/g) ?? []).length, 111);
  assert.match(searchMigration, /hsk3-content-truth-v5/);
  assert.match(searchMigration, /11092,1\)/);

  const db = new DatabaseSync(":memory:");
  db.exec(text("migrations/0006_hsk3_content_release.sql"));
  db.exec(text("content/releases/hsk3-gf0025-2021-v2.sql"));
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM content_assets WHERE release_id = ?").get("hsk3-gf0025-2021-v2") as { count: number }).count, 11092);
  db.exec(contentMigration);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM content_assets WHERE release_id = ?").get("hsk3-gf0025-2021-v2") as { count: number }).count, 11092);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM content_assets WHERE release_id = ?").get("hsk3-content-truth-v5") as { count: number }).count, 11107);
  const pk = db.prepare("PRAGMA table_info(content_assets)").all() as Array<{ name: string; pk: number }>;
  assert.deepEqual(pk.filter((column) => column.pk > 0).sort((a, b) => a.pk - b.pk).map((column) => column.name), ["release_id", "id"]);
  db.close();
});
