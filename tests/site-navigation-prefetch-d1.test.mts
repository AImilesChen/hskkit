import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function linkTags(path: string) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  return source.match(/<Link\b[\s\S]*?>/g) ?? [];
}

test("global header links do not prefetch every destination on each page load", async () => {
  const links = await linkTags("../src/app/site-header.tsx");
  assert.ok(links.length > 0);
  for (const link of links) assert.match(link, /prefetch=\{false\}/);
});

test("global footer links do not prefetch every destination on each page load", async () => {
  const links = await linkTags("../src/app/site-footer.tsx");
  assert.ok(links.length > 0);
  for (const link of links) assert.match(link, /prefetch=\{false\}/);
});

test("learning-loop navigation does not prefetch sibling D1-backed pages", async () => {
  const source = await readFile(new URL("../src/app/components/learning-dashboard.tsx", import.meta.url), "utf8");
  const learningLoopLinks = source.match(/links\.map\(\(link\) => <Link[^>]+>/g) ?? [];
  assert.equal(learningLoopLinks.length, 2);
  for (const link of learningLoopLinks) assert.match(link, /prefetch=\{false\}/);
});
