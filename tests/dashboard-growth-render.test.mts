import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { buildGrowthSnapshot } from "../src/lib/learning/growth.ts";

const source = readFileSync(new URL("../src/app/dashboard/dashboard-growth.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const moduleValue = { exports: {} as { default?: (props: unknown) => unknown } };
new Function("require", "module", "exports", compiled)(createRequire(import.meta.url), moduleValue, moduleValue.exports);
const DashboardGrowth = moduleValue.exports.default;

test("daily dashboard record renders earned points and real submitted-answer totals", () => {
  assert.ok(DashboardGrowth);
  const growth = buildGrowthSnapshot({
    now: new Date("2026-10-06T12:00:00.000Z"),
    timezone: "UTC",
    activity: [
      { action: "attempt", createdAt: "2026-10-06T09:00:00.000Z" },
      { action: "grade", createdAt: "2026-10-06T09:10:00.000Z" },
    ],
    attempts: [
      { contentId: "word:travel", correct: true, observedAt: "2026-10-06T09:00:00.000Z" },
      { contentId: "word:trip", correct: false, observedAt: "2026-10-06T09:05:00.000Z" },
    ],
    cards: [{ dueAt: "2026-10-06T08:00:00.000Z" }],
    levelTotals: [],
  });
  const html = renderToStaticMarkup(createElement(DashboardGrowth!, {
    growth,
    rewardedDays: [{ localDay: "2026-10-06", points: 2 }],
  }));
  assert.match(html, /2 saved actions/);
  assert.match(html, /Submitted answers: 1 correct out of 2/);
  assert.match(html, /Learning points: \+2 earned/);
  assert.match(html, /Scheduled review load/);
  assert.match(html, /Answer accuracy/);
  assert.match(html, /aria-pressed="true"/);
});
