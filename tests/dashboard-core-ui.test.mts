import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("../src/app/dashboard/page.tsx");
const dashboard = read("../src/app/dashboard/dashboard-core.tsx");
const start = read("../src/app/start/page.tsx");
const learningRoute = read("../src/app/api/v1/learning/route.ts");
const login = read("../src/app/login/page.tsx");

test("server dispatcher and dashboard protect the approved new-versus-established flow", () => {
  assert.match(start, /learningEntryDestination/);
  assert.match(start, /accountOwnerId/);
  assert.match(page, /hasEstablishedLearning/);
  assert.match(page, /\/placement\?onboarding=1/);
  assert.match(page, /\/login\?returnTo=%2Fdashboard/);
  assert.match(login, /params\.returnTo === "\/start" \? "\/placement\?onboarding=1" : "\/today"/);
});

test("dashboard core contains only the approved stage-two learning signals", () => {
  for (const label of ["Today’s learning", "Today’s focus", "Due reviews", "Current level", "New words today", "Learning streak"]) {
    assert.match(dashboard, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(dashboard, /id="today-focus-title" className="[^"]*text-white/);
  assert.match(dashboard, /dashboardPrimaryAction/);
  assert.match(dashboard, /data\.currentLevel/);
  assert.match(learningRoute, /currentLevel: data\.currentLevel/);
  assert.match(learningRoute, /dueCount: data\.dueCount/);
  assert.doesNotMatch(dashboard, /learning curve|30 days|calendar|AI credits|subscription/i);
});
