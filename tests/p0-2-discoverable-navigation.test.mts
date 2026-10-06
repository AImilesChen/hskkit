import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const header = read("../src/app/site-header.tsx");
const home = read("../src/app/page.tsx");
const pricing = read("../src/app/pricing/page.tsx");

test("P0-2 exposes one frozen information architecture on desktop and mobile", async () => {
  const { siteNavigation, flattenNavigation } = await import("../src/app/site-navigation.ts");
  assert.deepEqual(siteNavigation.map((entry) => entry.label), ["Learn", "Practice", "Tests", "Dictionary", "Blog", "Pricing", "Store", "Sign in"]);
  assert.deepEqual(siteNavigation[0].items?.map((item) => item.label), ["Today", "Planner", "Levels", "Vocabulary", "Flashcards", "Topics", "Grammar", "Reading", "Listening library"]);
  assert.deepEqual(siteNavigation[1].items?.map((item) => item.label), ["Practice", "Review", "Mistakes"]);
  assert.deepEqual(siteNavigation[2].items?.map((item) => item.label), ["Placement", "Basic Mock", "Advanced Mock"]);
  assert.deepEqual(flattenNavigation().map((item) => item.href), [
    "/today", "/planner", "/levels", "/vocabulary/1", "/vocabulary/1?mode=flashcards#vocabulary-activities", "/topics", "/grammar", "/reading", "/listen",
    "/practice", "/review", "/mistakes", "/placement", "/mock/basic", "/mock/advanced",
    "/dictionary", "/blog", "/pricing", "/store", "/account",
  ]);
  const hrefs = flattenNavigation().map((item) => item.href);
  assert.equal(new Set(hrefs).size, hrefs.length, "the shared navigation must not contain duplicate destinations");
  assert.match(header, /navigation\.map/g);
  assert.equal((header.match(/navigation\.map/g) ?? []).length, 2, "desktop and mobile must render the same shared navigation data");
  assert.doesNotMatch(header, /href="\/hsk-(?:3-0|2-0-vs-3-0)"/, "mobile must not add a second navigation-only route set");
});

test("P0-2 grouped navigation keeps accessible responsive behavior", () => {
  assert.match(header, /aria-expanded=/);
  assert.match(header, /aria-controls=/);
  assert.match(header, /event\.key === "Escape"/);
  assert.match(header, /pointerdown/);
  assert.match(header, /matchMedia\("\(min-width: 1040px\)"\)/);
  assert.match(header, /<\/header>\s*\{mobileOpen && \(/, "the fixed mobile drawer must sit outside the backdrop-filter header containing block");
  assert.match(header, /focus\(\)/);
  assert.match(header, /overflow-y-auto/);
});

test("P0-2 homepage and pricing expose truthful entry boundaries", () => {
  assert.match(home, /href="\/(?:placement|today)"/);
  assert.match(pricing, /href="\/store"/);
  assert.match(pricing, /Stripe Test mode/i);
  assert.match(pricing, /account-based Pro entitlement/i);
  assert.match(pricing, /no live card charge is enabled/i);
  assert.match(pricing, /Complete vocabulary PDFs/i);
  assert.match(pricing, /one-time/i);
});

test("P0-2 every frozen destination has a real route", async () => {
  const { flattenNavigation } = await import("../src/app/site-navigation.ts");
  const routeOverrides: Record<string, string> = {
    "/vocabulary/1": "../src/app/vocabulary/[level]/page.tsx",
    "/vocabulary/1?mode=flashcards#vocabulary-activities": "../src/app/vocabulary/[level]/page.tsx",
    "/mock/basic": "../src/app/mock/[band]/page.tsx",
    "/mock/advanced": "../src/app/mock/[band]/page.tsx",
  };
  for (const item of flattenNavigation()) {
    const route = routeOverrides[item.href] ?? `../src/app${item.href}/page.tsx`;
    assert.equal(fs.existsSync(new URL(route, import.meta.url)), true, `${item.label} must resolve to ${item.href}`);
  }
});
