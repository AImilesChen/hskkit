import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

test("stage 3 dashboard presents calendar, 7/30-day curve, truthful HSK bands and empty states", () => {
  const dashboard = read("../src/app/dashboard/dashboard-core.tsx");
  const growth = read("../src/app/dashboard/dashboard-growth.tsx");
  assert.match(dashboard, /DashboardGrowth/);
  assert.match(growth, /Study calendar/);
  assert.match(growth, /Learning curve/);
  assert.match(growth, /\{days\} days/);
  assert.match(growth, /\(\[7, 30\] as const\)/);
  assert.match(growth, /HSK 1–9 progress/);
  assert.match(growth, /No completed learning activity yet/);
  assert.match(growth, /No tracked vocabulary yet/);
  assert.match(growth, /grid-cols-7/);
  assert.match(growth, /gridTemplateColumns: "repeat\(7, minmax\(0, 1fr\)\)"/);
  assert.doesNotMatch(growth, /sample|placeholder|demo data/i);
});

test("growth endpoint reads only learning state and successful audit activity", () => {
  const route = read("../src/app/api/v1/dashboard/growth/route.ts");
  const storage = read("../src/lib/learning/storage.ts");
  assert.match(route, /buildGrowthSnapshot/);
  assert.match(route, /getHsk3LevelStatuses/);
  assert.match(storage, /learningActivitySince/);
  assert.match(storage, /result='success'/);
  assert.doesNotMatch(route, /stripe|price|entitlement/i);
});
