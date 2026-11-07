import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {cumulativeWordCounts, homeTools, featuredGuideSlugs} from '../src/lib/home/discovery.ts';

test('cumulative counts include earlier levels without changing input order', () => {
  const levels = [{level:3,wordCount:500},{level:1,wordCount:300},{level:2,wordCount:200}];
  const before = structuredClone(levels);
  assert.deepEqual([...cumulativeWordCounts(levels)], [[1,300],[2,500],[3,1000]]);
  assert.deepEqual(levels,before);
});

test('homepage discovery destinations and featured guide assets exist', () => {
  for (const tool of homeTools) {
    assert.ok(fs.existsSync(new URL(`../src/app${tool.href}/page.tsx`, import.meta.url)), tool.href);
  }
  const manifest = JSON.parse(fs.readFileSync(new URL('../content/blog/manifest.json',import.meta.url),'utf8'));
  for (const slug of featuredGuideSlugs) {
    assert.ok(manifest.articles.some((article:{slug:string})=>article.slug===slug), slug);
    const asset = new URL(`../public/home-guides/${slug}.webp`, import.meta.url);
    assert.ok(fs.statSync(asset).size < 150_000, slug);
  }
});
