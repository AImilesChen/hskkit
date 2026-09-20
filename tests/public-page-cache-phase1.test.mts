import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFile(new URL(path, root), "utf8");

const STATIC_PUBLIC_PAGES = [
  "src/app/page.tsx",
  "src/app/pricing/page.tsx",
  "src/app/levels/page.tsx",
  "src/app/dictionary/page.tsx",
  "src/app/character/[hanzi]/page.tsx",
] as const;

test("OpenNext persists the incremental cache in the dedicated R2 binding", async () => {
  const [openNext, wrangler, envTypes] = await Promise.all([
    read("open-next.config.ts"),
    read("wrangler.jsonc"),
    read("cloudflare-env.d.ts"),
  ]);

  assert.match(openNext, /import r2IncrementalCache from ["']@opennextjs\/cloudflare\/overrides\/incremental-cache\/r2-incremental-cache["']/);
  assert.match(openNext, /incrementalCache:\s*r2IncrementalCache/);
  assert.match(wrangler, /"binding"\s*:\s*"NEXT_INC_CACHE_R2_BUCKET"/);
  assert.match(wrangler, /"bucket_name"\s*:\s*"hskkit-next-inc-cache"/);
  assert.match(envTypes, /NEXT_INC_CACHE_R2_BUCKET:\s*R2Bucket/);
});

test("only confirmed public shells and content routes opt into static rendering", async () => {
  for (const path of STATIC_PUBLIC_PAGES) {
    const source = await read(path);
    assert.match(source, /export const dynamic = ["']force-static["']/, `${path} must be explicitly static`);
    assert.doesNotMatch(source, /cookies\(|headers\(|requestIdentity\(|getCloudflareContext\(/, `${path} must not read request or private state`);
  }
});

test("query-dependent and oversized routes keep their existing runtime behavior", async () => {
  const [word, vocabulary, blog] = await Promise.all([
    read("src/app/word/[slug]/page.tsx"),
    read("src/app/vocabulary/[level]/page.tsx"),
    read("src/app/blog/page.tsx"),
  ]);

  assert.match(word, /export const dynamic = ["']force-dynamic["']/);
  assert.match(word, /dailySessionId/);
  assert.match(vocabulary, /export const dynamic = ["']force-dynamic["']/);
  assert.match(blog, /export const dynamic = ["']force-dynamic["']/);
});

test("account, dashboard, admin and private account APIs stay outside the public cache", async () => {
  const [accountPage, dashboardPage, adminLayout, accountRoute, wrangler] = await Promise.all([
    read("src/app/account/page.tsx"),
    read("src/app/dashboard/page.tsx"),
    read("src/app/admin/(console)/layout.tsx"),
    read("src/app/api/v1/account/route.ts"),
    read("wrangler.jsonc"),
  ]);

  for (const [path, source] of [
    ["account", accountPage],
    ["dashboard", dashboardPage],
    ["admin", adminLayout],
  ] as const) {
    assert.match(source, /export const dynamic = ["']force-dynamic["']/, `${path} must stay dynamic`);
  }
  assert.match(accountRoute, /cache-control["']?\s*:\s*["']private, no-store/i);
  assert.match(accountRoute, /export const dynamic = ["']force-dynamic["']/);
  assert.doesNotMatch(wrangler, /cacheEverything/i);
});
