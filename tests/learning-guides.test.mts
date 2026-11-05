import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { guideSections, guideNextSteps } from "../src/lib/guides/catalog.ts";
test("curated guides have unique published sources and contextual next steps", async () => {
 const manifest = JSON.parse(await readFile("content/blog/manifest.json", "utf8"));
 const slugs = guideSections.flatMap(s => s.slugs);
 assert.equal(new Set(slugs).size, slugs.length);
 for (const slug of slugs) {
  assert.ok(manifest.articles.some((p: {slug:string;publishedAt:string}) => p.slug === slug && Date.parse(p.publishedAt) <= Date.now()), slug);
  assert.ok(guideNextSteps[slug], slug);
  for (const related of guideNextSteps[slug].related) assert.ok(slugs.includes(related));
 }
 assert.equal(guideNextSteps["chinese-tones-guide"].href, "/tools/chinese-tone-trainer");
 assert.equal(guideNextSteps["how-to-prepare-for-the-hsk"].href, "/hsk-test-prep");
});
