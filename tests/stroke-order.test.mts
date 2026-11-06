import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { splitCharacters, strokeDataPath, strokeCounts, validStrokeData, starterCharacters } from "../src/lib/strokes/domain.ts";

test("input keeps exact Han forms, deduplicates and bounds sets without interpreting paths", () => {
  assert.deepEqual(splitCharacters("学习学习 你好! abc 123"), ["学", "习", "你", "好"]);
  assert.deepEqual(splitCharacters("學学"), ["學", "学"]);
  assert.deepEqual(splitCharacters("../../script"), []);
  assert.equal(splitCharacters("一二三四五六七八九十百千万亿").length, 12);
  assert.equal(strokeDataPath("../../etc"), undefined);
  assert.equal(strokeDataPath("__proto__"), undefined);
  assert.equal(strokeDataPath("学习"), undefined);
  assert.equal(strokeDataPath("中"), "/stroke-data/v1/4e2d.json");
});

test("every offered file has valid geometry, exact catalog count and original checksum", async () => {
  const base = "public/stroke-data/v1";
  const notice = JSON.parse(await readFile(`${base}/NOTICE.json`, "utf8"));
  const catalog = JSON.parse(await readFile("src/lib/dictionary/character-index.json", "utf8"));
  const indexed = new Map(catalog.characters.map((c: { hanzi: string; strokes: number }) => [c.hanzi, c.strokes]));
  const paths = Object.keys(strokeCounts).map(c => strokeDataPath(c)!.split("/").pop()!);
  assert.deepEqual((await readdir(base)).filter(p => p.endsWith(".json") && p !== "NOTICE.json").sort(), paths.sort());
  assert.equal(Object.keys(notice.files).length, paths.length);
  for (const char of Object.keys(strokeCounts)) {
    const filename = strokeDataPath(char)!.split("/").pop()!;
    const raw = await readFile(`${base}/${filename}`);
    assert.equal(createHash("sha256").update(raw).digest("hex"), notice.files[filename], char);
    if(indexed.has(char))assert.equal(strokeCounts[char], indexed.get(char), char);
    else assert.ok(notice.additionalNameCharacters.includes(char),`Unattributed name-only addition: ${char}`);
    assert.ok(validStrokeData(JSON.parse(raw.toString()), strokeCounts[char]), char);
  }
  for (const c of starterCharacters) assert.ok(strokeDataPath(c));
});

test("unreviewed count differences stay unavailable and corrupted files are rejected", async () => {
  const coverage = JSON.parse(await readFile("src/lib/strokes/coverage.json", "utf8"));
  assert.equal(coverage.supportedCount + coverage.missing.length + coverage.strokeCountMismatch.length, coverage.catalogCount);
  for (const item of coverage.strokeCountMismatch) assert.equal(strokeDataPath(item.character), undefined);
  assert.equal(validStrokeData({ strokes: ["M 0 0"], medians: [] }, 1), false);
  assert.equal(validStrokeData({ strokes: ["bad"], medians: [[[0, 0], [1, 1]]] }, 1), false);
  assert.equal(validStrokeData({ strokes: ["M 0 0"], medians: [[[0, 0], [Infinity, 1]]] }, 1), false);
});

test("pinned runtime keeps a local loader and disposable drawing lifecycle", async () => {
  const player = await readFile("src/app/components/stroke-player.tsx", "utf8");
  const loader = await readFile("src/lib/strokes/load.ts", "utf8");
  const runtime = await readFile("src/lib/strokes/vendor/hanzi-writer.js", "utf8");
  assert.match(player, /charDataLoader: \(\) => loaded/);
  assert.match(player, /instance\?\.destroy\(\)/);
  assert.match(runtime, /document\.removeEventListener\('mouseup', callback\)/);
  assert.match(runtime, /document\.removeEventListener\('touchend', callback\)/);
  assert.doesNotMatch(player + loader, /https:\/\/|\/api\//);
});
