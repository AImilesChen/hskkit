import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("planner does not expose JSON parser errors when an overloaded API returns an empty body", async () => {
  const source = await readFile(new URL("../src/app/planner/planner-client.tsx", import.meta.url), "utf8");
  assert.match(source, /readJsonResponse/);
  assert.doesNotMatch(source, /await response\.json\(\)/);
  assert.match(source, /Planner is temporarily unavailable\. Please retry\./);
});