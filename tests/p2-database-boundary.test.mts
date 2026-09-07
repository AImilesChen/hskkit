import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { learningTopics, topicsSourceReleaseId } from "../src/lib/topics/catalog.ts";
import {
  findPublicCatalogWordsByIds,
  publicCatalogReleaseId,
} from "../src/lib/content/public-catalog-index.ts";

const read = async (path: string) => readFile(new URL(path, import.meta.url), "utf8");

const publicContentRuntimeFiles = [
  "../src/lib/content/public-catalog-index.ts",
  "../src/lib/dictionary/runtime-word.ts",
  "../src/lib/dictionary/runtime-character.ts",
  "../src/lib/dictionary/p2-server.ts",
  "../src/lib/topics/server.ts",
  "../src/lib/topics/catalog.ts",
  "../src/lib/learning/step7-content.ts",
  "../src/app/api/v1/catalog/words/route.ts",
  "../src/app/api/v1/dictionary/suggestions/route.ts",
  "../src/app/api/v1/dictionary/characters/route.ts",
  "../src/app/sitemap.ts",
];

test("public content runtime has no user D1 dependency", async () => {
  for (const file of publicContentRuntimeFiles) {
    const source = await read(file);
    assert.doesNotMatch(source, /LEARNING_DB|CatalogSearchDatabase|\.prepare\s*\(/, file);
  }
});

test("topic catalog is verified entirely from the versioned public content release", () => {
  assert.equal(publicCatalogReleaseId, topicsSourceReleaseId);
  const published = learningTopics.filter((topic) => topic.status === "published");
  assert.ok(published.length > 0);
  for (const topic of published) {
    const words = findPublicCatalogWordsByIds(topic.wordAssetIds);
    assert.equal(words.length, topic.wordAssetIds.length, topic.slug);
    assert.ok(words.every((word) => word.release_id === topicsSourceReleaseId), topic.slug);
  }
});

test("user business state remains on the dedicated user database boundary", async () => {
  const files = [
    "../src/lib/account/storage.ts",
    "../src/lib/learning/storage.ts",
    "../src/lib/planner/storage.ts",
    "../src/lib/commercial/storage.ts",
  ];
  for (const file of files) assert.match(await read(file), /LEARNING_DB/, file);
});
