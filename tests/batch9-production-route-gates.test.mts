import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../src/app/", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");

test("Practice selector stays static and reads level query in the client", async () => {
  const [page, client] = await Promise.all([source("practice/page.tsx"), source("practice/practice-selector-client.tsx")]);
  assert.match(page, /alternates:\s*\{\s*canonical:\s*["']\/practice["']/);
  assert.doesNotMatch(page, /searchParams/);
  assert.match(client, /useSearchParams\(\)\.get\(["']level["']\)/);
});

test("critical learning routes publish self-referencing canonicals", async () => {
  const expected = [["placement/page.tsx", "/placement"], ["planner/page.tsx", "/planner"], ["listen/page.tsx", "/listen"]] as const;
  for (const [path, canonical] of expected) {
    assert.match(await source(path), new RegExp(`alternates:\\s*\\{\\s*canonical:\\s*["']${canonical.replaceAll("/", "\\/")}["']`));
  }
});
