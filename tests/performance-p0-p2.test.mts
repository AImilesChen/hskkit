import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path: string) => readFile(path, "utf8");

test("dictionary renders stable initial results and keeps secondary learning state off the critical path", async () => {
  const [page, client, learningRoute] = await Promise.all([
    read("src/app/dictionary/page.tsx"),
    read("src/app/components/dictionary-search.tsx"),
    read("src/app/api/v1/learning/route.ts"),
  ]);
  assert.match(page, /initialWords=/);
  assert.match(page, /getHsk3LevelPreview\(1, 12\)/);
  assert.match(client, /initialWords: CatalogResponse/);
  assert.match(client, /useState<CatalogResponse \| null>\(initialWords\)/);
  assert.match(client, /requestIdleCallback/);
  assert.match(client, /DICTIONARY_REQUEST_TIMEOUT_MS/);
  assert.match(client, /cache: "default"/);
  assert.match(client, /min-h-\[640px\]/);
  assert.match(client, /Try again/);
  assert.match(learningRoute, /"Cache-Control": "private, no-store"/);
});

test("blog cards request responsive thumbnails lazily and public versioned media is CDN-cacheable", async () => {
  const [page, mediaRoute] = await Promise.all([
    read("src/app/blog/page.tsx"),
    read("src/app/api/v1/blog/media/[...key]/route.ts"),
  ]);
  assert.match(page, /srcSet=\{/);
  assert.match(page, /\?w=480&q=75&tv=2 480w/);
  assert.match(page, /sizes="\(max-width: 640px\) 100vw, \(max-width: 900px\) 50vw, 33vw"/);
  assert.match(page, /fetchPriority=\{index < 3 \? "high" : "auto"\}/);
  assert.match(page, /loading=\{index < 3 \? "eager" : "lazy"\}/);
  assert.match(mediaRoute, /env\.IMAGES/);
  assert.match(mediaRoute, /\.transform\(\{ width, fit: "scale-down", dpr: 1 \}\)/);
  assert.match(mediaRoute, /s-maxage=31536000/);
  assert.match(mediaRoute, /immutable/);
});

test("Store reserves the complete async catalog footprint and homepage CSS drops bounded dead rules", async () => {
  const [store, css] = await Promise.all([
    read("src/app/store/store-purchase.tsx"),
    read("src/app/homepage.css"),
  ]);
  assert.match(store, /StoreCatalogSkeleton/);
  assert.match(store, /aria-busy="true"/);
  assert.match(store, /skeletonCategoryCounts/);
  assert.doesNotMatch(css, /\.home-product-task\b/);
  assert.doesNotMatch(css, /\.home-product-instruction\b/);
  assert.doesNotMatch(css, /\.home-product-link\b/);
  assert.doesNotMatch(css, /\.home-main \*[^\n]*box-sizing/);
});
