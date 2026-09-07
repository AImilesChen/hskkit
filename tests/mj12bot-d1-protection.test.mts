import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { shouldBlockCrawler } from "../src/lib/traffic/bot-guard.ts";

test("MJ12bot is identified case-insensitively", () => {
  assert.equal(shouldBlockCrawler("Mozilla/5.0 (compatible; MJ12bot/v1.4.8; http://mj12bot.com/)"), true);
  assert.equal(shouldBlockCrawler("mj12BOT/1.4.8"), true);
});

test("normal learners and approved search engines are not blocked", () => {
  assert.equal(shouldBlockCrawler("Mozilla/5.0 Chrome/140.0"), false);
  assert.equal(shouldBlockCrawler("Googlebot/2.1 (+http://www.google.com/bot.html)"), false);
  assert.equal(shouldBlockCrawler(""), false);
});

test("middleware rejects MJ12bot before page or API rendering and leaves robots.txt reachable", async () => {
  const source = await readFile(new URL("../src/middleware.ts", import.meta.url), "utf8");
  assert.match(source, /shouldBlockCrawler\(request\.headers\.get\("user-agent"\)\)/);
  assert.match(source, /path !== "\/robots\.txt"/);
  assert.match(source, /status:\s*403/);
  assert.match(source, /"x-robots-tag":\s*"noindex, nofollow"/);
  assert.match(source, /"cache-control":\s*"public, max-age=86400"/);
  assert.match(source, /\/\(\(\?!_next\/static\|_next\/image\|favicon\.ico\)\.\*\)/);
  assert.doesNotMatch(source, /\(\?!api\|/);
});

test("robots policy tells MJ12bot to stop crawling without weakening normal indexing", async () => {
  const source = await readFile(new URL("../src/app/robots.ts", import.meta.url), "utf8");
  assert.match(source, /userAgent:\s*"MJ12bot"[\s\S]*disallow:\s*"\/"/);
  assert.match(source, /userAgent:\s*"\*"[\s\S]*allow:\s*"\/"/);
});
