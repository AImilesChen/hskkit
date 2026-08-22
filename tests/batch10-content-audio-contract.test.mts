import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import catalogJson from "../src/lib/content/catalog.json" with { type: "json" };
import { queryCatalog, validateRepository, withdrawRelease, type ContentRepository } from "../src/lib/content/repository.ts";

const repository = catalogJson as ContentRepository;
const source = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("formal catalog keeps Levels 7–9 as one honest advanced band", () => {
  validateRepository(repository);
  const level7 = queryCatalog(repository, { standard: "hsk3", level: 7 });
  const level8 = queryCatalog(repository, { standard: "hsk3", level: 8 });
  const level9 = queryCatalog(repository, { standard: "hsk3", level: 9 });
  assert.equal(level7.availability, "ready");
  assert.ok(level7.contentAssets.every((asset) => asset.level_band === "7-9"));
  assert.equal(level8.availability, "gap");
  assert.equal(level9.availability, "gap");
});

test("formal AudioAsset release contains word sentence and context assets with lifecycle evidence", () => {
  validateRepository(repository);
  const active = repository.releases.find((release) => release.id === repository.activeReleaseByStandard.hsk3)!;
  const activeAudio = repository.audioAssets.filter((asset) => active.audioAssetIds.includes(asset.id));
  assert.ok(activeAudio.length >= 3);
  assert.deepEqual(new Set(activeAudio.map((asset) => asset.audioKind)), new Set(["word", "sentence", "context"]));
  for (const asset of activeAudio) {
    assert.equal(asset.qaStatus, "approved");
    assert.equal(asset.authorization.status, "authorized");
    assert.ok(asset.usageRights.streaming);
    assert.match(asset.publishedAt, /^2026-/);
    assert.match(asset.issueReportPath, /^\/api\/v1\/content\/audio\/report$/);
    assert.match(asset.storageKey, /^audio\/formal\/.+\.mp3$/);
  }
});

test("Dictionary Word Character Grammar and Reading are gated by the active formal catalog", async () => {
  const dictionary = await source("src/lib/dictionary/catalog.ts");
  const learning = await source("src/lib/learning/step7-content.ts");
  const sitemap = await source("src/app/sitemap.ts");
  assert.match(dictionary, /lib\/content\/catalog\.json|\.\.\/content\/catalog\.json/);
  assert.match(dictionary, /activeReleaseByStandard/);
  assert.match(learning, /content\/published-content/);
  assert.match(sitemap, /publishedGrammarLessons/);
  assert.match(sitemap, /publishedReadingLessons/);
});

test("Level 8 and 9 routes explain their mapping instead of returning a fake list or 404", async () => {
  const page = await source("src/app/vocabulary/[level]/page.tsx");
  assert.match(page, /Levels 7–9 unified advanced band/);
  assert.match(page, /requestedLevel >= 8/);
  assert.match(page, /not a separate Level \{requestedLevel\} official word list/);
  assert.doesNotMatch(page, /Audio assets<\/p><p className="text-2xl font-bold text-green-950">0/);
});

test("Grammar and Reading publish self-canonical metadata and noindex missing content", async () => {
  for (const [path, route] of [["src/app/grammar/[slug]/page.tsx", "grammar"], ["src/app/reading/[slug]/page.tsx", "reading"]] as const) {
    const page = await source(path);
    const expected = "canonical: `/" + route + "/${lesson.slug}`";
    assert.ok(page.includes(expected));
    assert.match(page, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  }
});

test("Privacy describes the real account sync AI and service-provider data flow", async () => {
  const privacy = await source("src/app/privacy-policy/page.tsx");
  assert.doesNotMatch(privacy, /static study guide website/);
  assert.match(privacy, /account/i);
  assert.match(privacy, /learning progress/i);
  assert.match(privacy, /sync/i);
  assert.match(privacy, /AI/i);
  assert.match(privacy, /Cloudflare/i);
  assert.match(privacy, /configured AI service provider/i);
  assert.match(privacy, /Plausible Analytics/i);
});

test("audio issue reporting is persisted and does not mutate learning state", async () => {
  const route = await source("src/app/api/v1/content/audio/report/route.ts");
  const migration = await source("migrations/0007_audio_issue_reports.sql");
  assert.match(route, /audio_issue_reports/);
  assert.match(route, /\.prepare\(/);
  assert.doesNotMatch(route, /learning_states|mastery|attempt/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS audio_issue_reports/);
});

test("sitemap excludes private noindex application routes", async () => {
  const sitemap = await source("src/app/sitemap.ts");
  assert.doesNotMatch(sitemap, /"\/today"/);
  assert.doesNotMatch(sitemap, /"\/mistakes"/);
  assert.doesNotMatch(sitemap, /"\/account"/);
});

test("withdrawing the active release returns an empty public catalog instead of throwing", () => {
  const activeReleaseId = repository.activeReleaseByStandard.hsk3!;
  const withdrawn = withdrawRelease(repository, activeReleaseId, "2026-08-22T08:00:00.000Z");
  const result = queryCatalog(withdrawn, { standard: "hsk3", level: 1 });
  assert.equal(result.releaseId, "unavailable");
  assert.equal(result.releaseVersion, 0);
  assert.equal(result.availability, "gap");
  assert.deepEqual(result.contentAssets, []);
  assert.deepEqual(result.audioAssets, []);
});
