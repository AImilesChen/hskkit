import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import type { ContentImportBatch } from "../src/lib/content/importer.ts";
import type { ContentRepository } from "../src/lib/content/repository.ts";

const projectRoot = new URL("..", import.meta.url).pathname;

function emptyRepository(): ContentRepository {
  return {
    schemaVersion: "1.0.0",
    levels: [
      ...Array.from({ length: 6 }, (_, index) => ({ standard: "hsk2" as const, level: index + 1, title: `HSK 2.0 Level ${index + 1}` })),
      ...Array.from({ length: 9 }, (_, index) => ({ standard: "hsk3" as const, level: index + 1, title: `HSK 3.0 Level ${index + 1}` })),
    ],
    contentAssets: [],
    audioAssets: [],
    releases: [],
    releaseEvents: [],
    activeReleaseByStandard: {},
  };
}

function run(script: string, args: string[]) {
  return spawnSync(process.execPath, ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", script, ...args], {
    cwd: projectRoot,
    encoding: "utf8",
  });
}

test("validate-content exits nonzero for an invalid repository", () => {
  const directory = mkdtempSync(join(tmpdir(), "hskkit-content-"));
  const repositoryPath = join(directory, "invalid.json");
  const invalid = emptyRepository();
  invalid.levels.pop();
  writeFileSync(repositoryPath, JSON.stringify(invalid));
  const result = run("scripts/content/validate-content.mts", [repositoryPath]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /levels must be exactly 1 through 9/i);
});

test("import-content writes a validated draft without changing the input file", () => {
  const directory = mkdtempSync(join(tmpdir(), "hskkit-content-"));
  const repositoryPath = join(directory, "repository.json");
  const batchPath = join(directory, "batch.json");
  const outputPath = join(directory, "imported.json");
  const original = emptyRepository();
  const batch: ContentImportBatch = {
    standard: "hsk3",
    contentAssets: [],
    audioAssets: [],
    release: {
      id: "hsk3-v1",
      standard: "hsk3",
      version: 1,
      status: "draft",
      contentAssetIds: [],
      audioAssetIds: [],
    },
  };
  writeFileSync(repositoryPath, JSON.stringify(original));
  writeFileSync(batchPath, JSON.stringify(batch));
  const result = run("scripts/content/import-content.mts", [repositoryPath, batchPath, outputPath]);
  const imported = JSON.parse(readFileSync(outputPath, "utf8")) as ContentRepository;
  assert.equal(result.status, 0, result.stderr);
  assert.equal(imported.releases[0].id, "hsk3-v1");
  assert.equal(imported.releases[0].status, "draft");
  assert.deepEqual(JSON.parse(readFileSync(repositoryPath, "utf8")), original);
});

test("release-content can publish, withdraw and roll back through explicit output files", () => {
  const directory = mkdtempSync(join(tmpdir(), "hskkit-content-"));
  const repositoryPath = join(directory, "repository.json");
  const publishedPath = join(directory, "published.json");
  const v2InputPath = join(directory, "v2-input.json");
  const v2PublishedPath = join(directory, "v2-published.json");
  const rolledBackPath = join(directory, "rolled-back.json");
  const withdrawnPath = join(directory, "withdrawn.json");
  const repository = emptyRepository();
  repository.releases = [
    { id: "hsk3-v1", standard: "hsk3", version: 1, status: "draft", contentAssetIds: [], audioAssetIds: [] },
  ];
  writeFileSync(repositoryPath, JSON.stringify(repository));

  const publishV1 = run("scripts/content/release-content.mts", ["publish", repositoryPath, "hsk3-v1", publishedPath, "2026-08-20T00:00:00.000Z"]);
  assert.equal(publishV1.status, 0, publishV1.stderr);

  const published = JSON.parse(readFileSync(publishedPath, "utf8")) as ContentRepository;
  published.releases.push({ id: "hsk3-v2", standard: "hsk3", version: 2, status: "draft", contentAssetIds: [], audioAssetIds: [] });
  writeFileSync(v2InputPath, JSON.stringify(published));

  const publishV2 = run("scripts/content/release-content.mts", ["publish", v2InputPath, "hsk3-v2", v2PublishedPath, "2026-08-20T00:01:00.000Z"]);
  assert.equal(publishV2.status, 0, publishV2.stderr);

  const rollback = run("scripts/content/release-content.mts", ["rollback", v2PublishedPath, "hsk3-v1", rolledBackPath, "2026-08-20T00:02:00.000Z"]);
  assert.equal(rollback.status, 0, rollback.stderr);
  const rolledBack = JSON.parse(readFileSync(rolledBackPath, "utf8")) as ContentRepository;
  assert.equal(rolledBack.activeReleaseByStandard.hsk3, "hsk3-v1");
  assert.equal(rolledBack.releaseEvents.at(-1)?.action, "rollback");

  const withdraw = run("scripts/content/release-content.mts", ["withdraw", rolledBackPath, "hsk3-v1", withdrawnPath, "2026-08-20T00:03:00.000Z"]);
  assert.equal(withdraw.status, 0, withdraw.stderr);
  const withdrawn = JSON.parse(readFileSync(withdrawnPath, "utf8")) as ContentRepository;
  assert.equal(withdrawn.releases.find((release) => release.id === "hsk3-v1")?.status, "withdrawn");
  assert.equal(withdrawn.activeReleaseByStandard.hsk3, undefined);
});

test("write CLIs reject input overwrite and existing output files", () => {
  const directory = mkdtempSync(join(tmpdir(), "hskkit-content-"));
  const repositoryPath = join(directory, "repository.json");
  const batchPath = join(directory, "batch.json");
  const outputPath = join(directory, "existing.json");
  const repository = emptyRepository();
  const batch: ContentImportBatch = {
    standard: "hsk3",
    contentAssets: [],
    audioAssets: [],
    release: { id: "hsk3-v1", standard: "hsk3", version: 1, status: "draft", contentAssetIds: [], audioAssetIds: [] },
  };
  writeFileSync(repositoryPath, JSON.stringify(repository));
  writeFileSync(batchPath, JSON.stringify(batch));
  writeFileSync(outputPath, "do-not-overwrite");

  const samePath = run("scripts/content/import-content.mts", [repositoryPath, batchPath, repositoryPath]);
  const existingOutput = run("scripts/content/import-content.mts", [repositoryPath, batchPath, outputPath]);

  assert.notEqual(samePath.status, 0);
  assert.match(samePath.stderr, /output.*input/i);
  assert.notEqual(existingOutput.status, 0);
  assert.match(existingOutput.stderr, /already exists/i);
  assert.equal(readFileSync(outputPath, "utf8"), "do-not-overwrite");
});
