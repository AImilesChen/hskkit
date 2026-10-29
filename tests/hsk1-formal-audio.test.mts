import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, root), "utf8"));

test("every published HSK 1 word has released checksum-verified formal audio", () => {
  const catalog = readJson("src/lib/content/catalog.json");
  const release = catalog.releases.find((item: { id: string }) => item.id === catalog.activeReleaseByStandard.hsk3);
  assert.ok(release);
  const contentIds = new Set<string>(release.contentAssetIds);
  const audioIds = new Set<string>(release.audioAssetIds);
  const words = catalog.contentAssets.filter((item: { id: string; level: number; kind: string; qa_status?: string; publish_status?: string }) =>
    contentIds.has(item.id)
    && item.level === 1
    && item.kind === "word"
    && item.qa_status === "approved"
    && item.publish_status === "published");
  const audioByContent = new Map(catalog.audioAssets
    .filter((item: { id: string; qaStatus: string }) => audioIds.has(item.id) && item.qaStatus === "approved")
    .map((item: { contentAssetId: string }) => [item.contentAssetId, item]));

  assert.equal(words.length, 300);
  assert.equal(new Set([...audioByContent.keys()].filter((id) => words.some((word: { id: string }) => word.id === id))).size, 300);
  const storageKeys = new Set<string>();
  for (const word of words) {
    const audio = audioByContent.get(word.id) as { storageKey: string; checksumSha256: string } | undefined;
    assert.ok(audio, `missing formal audio for ${word.id}`);
    assert.ok(!storageKeys.has(audio.storageKey), `duplicate storage key ${audio.storageKey}`);
    storageKeys.add(audio.storageKey);
    const fileUrl = new URL(`public/${audio.storageKey}`, root);
    assert.ok(existsSync(fileUrl), `missing ${audio.storageKey}`);
    assert.ok(statSync(fileUrl).size >= 1000, `undersized ${audio.storageKey}`);
    assert.equal(createHash("sha256").update(readFileSync(fileUrl)).digest("hex"), audio.checksumSha256);
  }
});

test("new HSK 1 audio report tracks the 265 reused and 35 generated files", () => {
  const report = readJson("docs/quality/hsk1-2025-audio-report.json");
  assert.equal(report.reused.length, 265);
  assert.equal(report.generated.length, 35);
  assert.equal(new Set([...report.reused, ...report.generated].map((item: { number: number }) => item.number)).size, 300);
});

test("polyphonic HSK 1 entries have distinct pronunciations and exceptional prompts are documented", () => {
  const catalog = readJson("src/lib/content/catalog.json");
  const byContent = new Map(catalog.audioAssets.map((item: { contentAssetId: string }) => [item.contentAssetId, item]));
  for (const [left, right] of [
    ["hsk3.word.l1.0066.v1", "hsk3.word.l1.0069.v1"],
    ["hsk3.word.l1.0111.v1", "hsk3.word.l1.0113.v1"],
    ["hsk3.word.l1.0132.v1", "hsk3.word.l1.0153.v1"],
  ]) {
    assert.notEqual((byContent.get(left) as { checksumSha256: string }).checksumSha256, (byContent.get(right) as { checksumSha256: string }).checksumSha256);
  }
  const builder = readFileSync(new URL("scripts/content/build-hsk1-formal-audio.py", root), "utf8");
  assert.match(builder, /SYNTHESIS_OVERRIDES/);
  assert.match(builder, /0066\.v1.*"的"/);
  assert.match(builder, /0111\.v1.*"甘"/);
  assert.match(builder, /0153\.v1.*"环"/);
  assert.match(builder, /（\[\^）\]\*）/);
});

test("the HSK 1 audio quality report records complete formal coverage", () => {
  const report = readJson("docs/quality/hsk1-formal-audio-report.json");
  assert.equal(report.hsk1Words, 500);
  assert.equal(report.formalCoverage, 500);
  assert.equal(report.hsk1PipelineAssets, 426);
  assert.ok(report.totalBytes > 4_000_000);
  assert.ok(report.durationRangeSeconds[0] >= 0.35);
  assert.ok(report.durationRangeSeconds[1] <= 8);
});
