import assert from "node:assert/strict";
import test from "node:test";

import {
  getHsk3LevelStatus,
  getHsk3LevelStatuses,
} from "../src/lib/content/level-status.ts";

test("formal HSK 3.0 level status exposes exactly levels 1 through 9", () => {
  const statuses = getHsk3LevelStatuses();
  assert.deepEqual(statuses.map((entry) => entry.level), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(statuses.every((entry) => entry.standard === "hsk3"), true);
});

test("an empty active release is reported as an explicit content gap", () => {
  const status = getHsk3LevelStatus(1);
  assert.equal(status.availability, "gap");
  assert.equal(status.contentCount, 0);
  assert.equal(status.audioCount, 0);
  assert.equal(status.releaseId, "hsk3-foundation-v1");
  assert.equal(status.releaseVersion, 1);
  assert.match(status.message, /not yet available/i);
});

test("levels 7 through 9 identify the unified advanced path", () => {
  assert.equal(getHsk3LevelStatus(6).isAdvancedPath, false);
  assert.equal(getHsk3LevelStatus(7).isAdvancedPath, true);
  assert.equal(getHsk3LevelStatus(8).isAdvancedPath, true);
  assert.equal(getHsk3LevelStatus(9).isAdvancedPath, true);
});

test("formal status rejects levels outside HSK 3.0", () => {
  assert.throws(() => getHsk3LevelStatus(0), /level/i);
  assert.throws(() => getHsk3LevelStatus(10), /level/i);
});
