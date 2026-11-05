import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("resource footer retains legal destinations and does not offer unavailable apps", async () => {
 const footer = await readFile("src/app/site-footer.tsx", "utf8");
 for (const route of ["/privacy-policy", "/terms-of-service", "/refund-policy", "/disclaimer", "/contact", "/content-license"]) assert.ok(footer.includes(`"${route}"`), route);
 assert.match(footer, /independent study tool/);
 assert.doesNotMatch(footer, /apps\.apple\.com|play\.google\.com/);
});
test("footer offers the unified advanced band and existing training destinations", async () => {
 const footer = await readFile("src/app/site-footer.tsx", "utf8");
 for (const route of ["/vocabulary/7", "/hsk-test-prep", "/hsk-placement-test", "/tools/chinese-tone-trainer"]) assert.ok(footer.includes(`"${route}"`), route);
 assert.doesNotMatch(footer, /"\/vocabulary\/[89]"/);
 assert.match(footer, /prefetch=\{false\}/);
});
