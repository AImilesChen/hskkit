import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

const home = read("../src/app/page.tsx");
const header = read("../src/app/site-header.tsx");
const footer = read("../src/app/site-footer.tsx");
const studyShell = read("../src/app/components/study-shell.tsx");
const comparison = read("../src/app/hsk-2-0-vs-3-0/page.tsx");
const middleware = read("../src/middleware.ts");
const sitemap = read("../src/app/sitemap.ts");

function expectInOrder(source: string, markers: string[]) {
  let cursor = -1;
  for (const marker of markers) {
    const next = source.indexOf(marker);
    assert.ok(next > cursor, `${marker} must appear after the previous homepage section`);
    cursor = next;
  }
}

test("homepage follows the adopted Stitch HSK 3.0 information order", () => {
  expectInOrder(home, [
    "Build your HSK 3.0 learning path",
    "Make today’s next step clear.",
    "Learn by HSK 3.0 level.",
    "Use the tool that matches your task.",
    "Start with one useful next step.",
  ]);
  for (const href of ["/placement", "/today", "/levels", "/dictionary", "/listen", "/practice", "/vocabulary/1"]) {
    assert.ok(home.includes(`href: "${href}"`) || home.includes(`href="${href}"`), `homepage must link ${href}`);
  }
  assert.doesNotMatch(home, /HSK 1[–-]5 available now|HSK 6 Planned|no QA-approved level assets|not yet published/i);
  assert.match(home, /const catalog=entry\.level>=8\?7:entry\.level/);
});

test("desktop and mobile header expose one shared new-system navigation contract", () => {
  const navigation = read("../src/app/site-navigation.ts");
  for (const href of ["/levels", "/vocabulary/1", "/dictionary", "/today", "/listen", "/account"]) {
    assert.ok(navigation.includes(`href: "${href}"`), `shared navigation must include ${href}`);
  }
  assert.match(header, /siteNavigation\.map/);
  assert.doesNotMatch(navigation, /href:\s*["']\/hsk-levels["']/);
  assert.match(header, /Traditional HSK 2\.0/);
  assert.match(header, /legacyRoutePattern/);
});

test("shared study shell and footer use the same first-layer navigation", () => {
  assert.match(studyShell, /<SiteHeader\s*\/>/);
  assert.match(studyShell, /<SiteFooter\s*\/>/);
  for (const href of ["/levels", "/vocabulary/1", "/dictionary", "/today", "/listen", "/account", "/hsk-3-0", "/hsk-2-0-vs-3-0"]) {
    assert.ok(footer.includes(`href: "${href}"`), `footer must include ${href}`);
  }
  assert.doesNotMatch(footer, /href=["']\/hsk-levels["']/);
});

test("old generic entry routes have explicit 301 consolidation while traditional resources remain labelled", () => {
  for (const [from, to] of [["/hsk-levels", "/levels"], ["/hsk-level-test", "/placement"], ["/new-hsk-3-0", "/hsk-3-0"]]) {
    assert.ok(middleware.includes(`"${from}": "${to}"`), `${from} must consolidate to ${to}`);
  }
  assert.match(middleware, /NextResponse\.redirect\([^\n]+,\s*301\)/);
  assert.match(middleware, /\/hsk-levels/);
  assert.match(middleware, /\/hsk-level-test/);
  assert.match(middleware, /\/new-hsk-3-0/);
  assert.doesNotMatch(sitemap, /["']\/hsk-levels["']/);
  assert.doesNotMatch(sitemap, /["']\/hsk-level-test["']/);
  assert.doesNotMatch(sitemap, /["']\/new-hsk-3-0["']/);
});

test("standards comparison reflects the active formal release", () => {
  assert.match(comparison, /11,107/);
  assert.match(comparison, /Levels 7[–-]9.*unified HSK 7[–-]9 advanced ability band/i);
  assert.doesNotMatch(comparison, /no QA-approved level assets|currently published/i);
});
