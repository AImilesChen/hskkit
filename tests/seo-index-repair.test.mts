import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path: string) => readFileSync(root + path, "utf8");
const json = (path: string) => JSON.parse(read(path));
const catalog = json("src/lib/content/public-catalog-index.json");
const archive = json("src/lib/content/catalog.json");
const manifest = json("src/lib/content/seo-word-sitemap.json");
const redirects: Record<string, string> = json("src/lib/content/legacy-word-redirects.json");

async function bundle(entry: string, stubUI = false) {
  const result = await build({
    entryPoints: [root + entry], bundle: true, write: false, platform: "node",
    format: "cjs", external: ["react", "next", "next/*"], metafile: true,
    plugins: [{
      name: "server-test",
      setup(builder) {
        builder.onResolve({ filter: /^server-only$/ }, () => ({ path: "empty", namespace: "stub" }));
        if (stubUI) builder.onResolve({ filter: /study-shell|word-practice-client/ }, () => ({ path: "ui", namespace: "stub" }));
        builder.onLoad({ filter: /.*/, namespace: "stub" }, () => ({ contents: "export const StudyPage = () => null; export const WordPracticeClient = () => null;", loader: "js" }));
      },
    }],
  });
  const module = { exports: {} as Record<string, any> };
  new Function("require", "module", "exports", result.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
  return { exports: module.exports, inputs: Object.keys(result.metafile!.inputs), bytes: result.outputFiles[0].contents.length };
}

test("phased sitemap contains exactly the approved active HSK 1–3 words", () => {
  assert.equal(manifest.releaseId, catalog.releaseId);
  assert.deepEqual(manifest.levelBands, ["1", "2", "3"]);
  const expected = catalog.words.filter((row: string[]) => ["1", "2", "3"].includes(row[3])).map((row: string[]) => "/word/" + row[0]).sort();
  assert.equal(expected.length, 1000);
  assert.deepEqual(manifest.paths, expected);
  const assets = new Map(archive.contentAssets.map((asset: any) => [asset.id, asset]));
  for (const path of manifest.paths) {
    const asset: any = assets.get(path.split("/")[2]);
    assert.equal(asset.publish_status, "published");
    assert.equal(asset.qaStatus, "approved");
    assert.equal(asset.authorization.status, "authorized");
  }
});

test("real sitemap includes the new URLs once and excludes noindex level aliases", async () => {
  const { exports } = await bundle("src/app/sitemap.ts");
  const entries = exports.default();
  const urls = entries.map((entry: {url: string}) => entry.url);
  assert.equal(new Set(urls).size, urls.length);
  for (const path of manifest.paths) assert.ok(urls.includes("https://hskkit.com" + path));
  for (const level of [8, 9]) assert.ok(!urls.includes("https://hskkit.com/vocabulary/" + level));
  for (const level of [1, 2, 3, 4, 5, 6, 7]) assert.ok(urls.includes("https://hskkit.com/vocabulary/" + level));
  assert.equal(exports.dynamic, "force-static");
});

test("actual practice metadata declares its own URL for current and curated words", async () => {
  const { exports } = await bundle("src/app/word/[slug]/practice/page.tsx", true);
  for (const slug of ["hsk2025.word.l1.0001.v1", "hsk2025.word.l5.2293.v1", "xue-xi"]) {
    const metadata = await exports.generateMetadata({ params: Promise.resolve({ slug }) });
    assert.equal(metadata.alternates.canonical, "/word/" + slug + "/practice");
    assert.notEqual(metadata.robots?.index, false);
  }
});

test("every redirect has one exact published replacement and keeps the page type", () => {
  const active = new Map(catalog.words.map((row: string[]) => [row[0], row]));
  const old = new Map(archive.contentAssets.map((asset: any) => [asset.id, asset]));
  assert.equal(Object.keys(redirects).length, 129);
  for (const [from, to] of Object.entries(redirects)) {
    const asset: any = old.get(from.split("/")[2]);
    const row: any = active.get(to.split("/")[2]);
    assert.ok(row);
    assert.deepEqual([asset.payload.hanzi, asset.payload.pinyin, asset.payload.meaning], [row[4], row[6], row[7]]);
    assert.equal(from.endsWith("/practice"), to.endsWith("/practice"));
    assert.equal(redirects[to], undefined);
  }
  assert.equal(redirects["/word/hsk3.word.l3.0124.v1/practice"], undefined);
  assert.equal(redirects["/word/withdrawn-sample"], undefined);
});

test("real middleware preserves query parameters and existing pages while redirecting known 404s", async () => {
  const { NextRequest } = createRequire(import.meta.url)("next/server");
  const { exports, inputs, bytes } = await bundle("src/middleware.ts");
  const from = "/word/hsk3.word.l6.0205.v1";
  const response = exports.middleware(new NextRequest("https://hskkit.com" + from + "?from=dictionary"));
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://hskkit.com" + redirects[from] + "?from=dictionary");
  for (const path of ["/word/hsk2025.word.l1.0001.v1", "/word/hsk3.word.l2.0371.v1", "/word/unknown", "/word/hsk3.word.l3.0124.v1/practice"]) {
    assert.equal(exports.middleware(new NextRequest("https://hskkit.com" + path)).headers.get("location"), null);
  }
  assert.equal(exports.middleware(new NextRequest("https://hskkit.com/character/%E6%92%A4")).status, 410);
  assert.ok(inputs.every((path) => !/public-catalog-index|runtime-content-index|\/catalog.json/.test(path)));
  assert.ok(bytes < 40_000, "redirect lookup must stay small and avoid loading the catalog");
});
