import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as plannerDomain from "../src/lib/planner/domain.ts";
import type { PlannerCapacityEstimate, PlannerCapacityInput } from "../src/lib/planner/domain.ts";

const source = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("planner capacity preview uses real inputs before saving", () => {
  const estimate = (plannerDomain as typeof plannerDomain & {
    estimatePlannerCapacity?: (input: {
      goalLevel: number;
      targetDate: string;
      weeklyMinutes: number;
      preferredDays: number[];
      placementLevel?: number;
      dueCards: number;
      weakPointCount: number;
      now: string;
    }) => {
      status: string;
      weeks: number;
      minutesPerStudyDay: number;
      minimumWeeklyMinutes: number;
      allocation: { srs: number; weakPoints: number; goal: number; open: number };
    };
  }).estimatePlannerCapacity;
  assert.equal(typeof estimate, "function");
  if (!estimate) return;
  const preview = estimate({
    goalLevel: 3,
    targetDate: "2026-11-27",
    weeklyMinutes: 210,
    preferredDays: [1, 3, 5],
    dueCards: 0,
    weakPointCount: 0,
    now: "2026-08-29T00:00:00.000Z",
  });
  assert.equal(preview.status, "feasible");
  assert.ok(preview.weeks > 0);
  assert.ok(preview.minutesPerStudyDay > 0);
  assert.equal(preview.allocation.srs + preview.allocation.weakPoints + preview.allocation.goal + preview.allocation.open, 210);
});

test("planner capacity preview exposes tight and infeasible recovery states", () => {
  const estimate = (plannerDomain as typeof plannerDomain & { estimatePlannerCapacity?: (input: PlannerCapacityInput) => PlannerCapacityEstimate }).estimatePlannerCapacity;
  assert.equal(typeof estimate, "function");
  if (!estimate) return;
  const common = { goalLevel: 6, targetDate: "2026-10-01", preferredDays: [1, 3], placementLevel: 1, dueCards: 40, weakPointCount: 3, now: "2026-08-29T00:00:00.000Z" };
  const infeasible = estimate({ ...common, weeklyMinutes: 30 });
  assert.equal(infeasible.status, "infeasible");
  assert.ok(infeasible.minimumWeeklyMinutes > 30);
  const tight = estimate({ ...common, weeklyMinutes: infeasible.minimumWeeklyMinutes });
  assert.ok(["tight", "feasible"].includes(tight.status));
});

test("planner workspace has task-first copy, preview, icons and actionable placement", async () => {
  const [page, client] = await Promise.all([
    source("src/app/planner/page.tsx"),
    source("src/app/planner/planner-client.tsx"),
  ]);
  assert.match(page, /Build your HSK study plan/);
  assert.doesNotMatch(page, /Deterministic plan/);
  assert.doesNotMatch(client, /saved scope/i);
  for (const token of ["Plan preview", "Plan feasibility", "Weekly allocation", "This week", "Start level check", "HomeIcon"]) assert.match(client, new RegExp(token));
  assert.match(client, /href="\/placement"/);
});

test("planner generation provides visible async, retry and recovery states", async () => {
  const client = await source("src/app/planner/planner-client.tsx");
  assert.match(client, /try\s*\{/);
  assert.match(client, /catch\s*\(/);
  assert.match(client, /finally\s*\{/);
  assert.match(client, /role="status"/);
  assert.match(client, /aria-live="polite"/);
  assert.match(client, /Retry/);
  assert.match(client, /Checking capacity/);
});

test("planner execution loop tracks weekly task completion and exposes the next real task", async () => {
  const client = await source("src/app/planner/planner-client.tsx");
  assert.match(client, /localStorage/);
  assert.match(client, /planner-task-completion/);
  assert.match(client, /type="checkbox"/);
  assert.match(client, /aria-label=.*complete/i);
  assert.match(client, /Next task/);
  assert.match(client, /Weekly progress/);
  assert.match(client, /planner-task-link/);
  assert.ok(client.indexOf('className="planner-next"') < client.indexOf('className="planner-progress-track"'), "next task must appear before the progress bar in the compact desktop hierarchy");
});

test("planner provides truthful start, midpoint and target milestones", async () => {
  const client = await source("src/app/planner/planner-client.tsx");
  for (const token of ["Plan milestones", "Start this week", "Midpoint review", "Target date"]) assert.match(client, new RegExp(token));
});

test("planner save is bounded and separates save retry from refresh retry", async () => {
  const client = await source("src/app/planner/planner-client.tsx");
  assert.match(client, /method:\s*"POST"[\s\S]*signal:\s*AbortSignal\.timeout/);
  assert.match(client, /errorSource === "load"/);
  assert.match(client, /saved, but the latest version could not be loaded/);
  assert.match(client, /finally\s*\{/);
  assert.match(client, /Retry/);
});

test("planner responsive workspace protects density, collapsed settings, whole-row tasks and reduced motion", async () => {
  const [client, css] = await Promise.all([
    source("src/app/planner/planner-client.tsx"),
    source("src/app/globals.css"),
  ]);
  assert.match(client, /<details className="planner-settings" open=\{settingsOpen \|\| !plan\}/);
  assert.match(css, /\.planner-workspace/);
  assert.match(css, /\.planner-allocation/);
  assert.match(css, /\.planner-task-link::before/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /\.planner-settings:not\(\[open\]\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.planner-page\s*\{[^}]*padding-top:\s*8px/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.planner-hero\s*\{[^}]*margin-bottom:\s*8px/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.planner-hero\s+h1\s*\{[^}]*font-size:\s*30px[^}]*line-height:\s*1\.15/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.planner-hero\s*>\s*p\s*\{[^}]*font-size:\s*15px[^}]*line-height:\s*1\.5/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.planner-result\s*\{[^}]*gap:\s*8px/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.planner-preview\s*\{[^}]*padding:\s*16px/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.planner-preview-metrics\s*\{[^}]*margin:\s*13px\s+0/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.planner-progress\s*\{[^}]*padding:\s*14px\s+20px/);
  assert.match(css, /@media\s*\(min-width:\s*761px\)[\s\S]*\.planner-page\s*\{[^}]*padding-top:\s*24px/);
  assert.match(css, /@media\s*\(min-width:\s*761px\)[\s\S]*\.planner-result\s*\{[^}]*gap:\s*8px/);
  assert.match(css, /@media\s*\(min-width:\s*761px\)[\s\S]*\.planner-fields\s*\{[^}]*repeat\(2,/);
  assert.match(css, /@media\s*\(min-width:\s*761px\)[\s\S]*\.planner-preview\s*\{[^}]*grid-template-columns/);
});

test("planner completion records preserve real activity dates and calculate consecutive study days", () => {
  const normalize = (plannerDomain as typeof plannerDomain & {
    normalizePlannerCompletions?: (value: unknown) => Record<string, string | null>;
  }).normalizePlannerCompletions;
  const streak = (plannerDomain as typeof plannerDomain & {
    calculatePlannerStreak?: (dates: Array<string | null>, today: string) => { current: number; best: number; activeDays: number };
  }).calculatePlannerStreak;
  assert.equal(typeof normalize, "function");
  assert.equal(typeof streak, "function");
  if (!normalize || !streak) return;
  assert.deepEqual(normalize(["task-1", "task-2", 9]), { "task-1": null, "task-2": null });
  assert.deepEqual(normalize({ "task-1": "2026-08-27", "task-2": "bad", "task-3": null, "impossible": "2026-02-30" }), { "task-1": "2026-08-27", "task-3": null });
  assert.deepEqual(streak(["2026-08-25", "2026-08-27", "2026-08-28", "2026-08-29", "2026-08-29", null, "2026-08-30", "2026-02-30"], "2026-08-29"), { current: 3, best: 3, activeDays: 4 });
  assert.deepEqual(streak(["2026-08-25", "2026-08-26"], "2026-08-29"), { current: 0, best: 2, activeDays: 2 });
});

test("planner distinguishes preview, unsaved changes, saved plan and update actions", async () => {
  const client = await source("src/app/planner/planner-client.tsx");
  for (const token of ["Preview only", "Unsaved changes", "Plan is up to date", "Update weekly plan", "saved to your account", "saved on this device"]) {
    assert.match(client, new RegExp(token, "i"));
  }
  assert.match(client, /const\s+isDirty\s*=/);
  assert.match(client, /disabled=\{[\s\S]*plan\s*&&\s*!isDirty/);
  assert.doesNotMatch(client, /<p className="planner-save-note">\{data\.scope === "account" \? "Saved to your account\."/);
});

test("generated planner becomes an execution-first workspace with durable how-to guidance", async () => {
  const client = await source("src/app/planner/planner-client.tsx");
  for (const token of ["Your plan is ready", "Start next task", "Mark tasks complete", "Return to see progress", "How to use this plan"]) {
    assert.match(client, new RegExp(token));
  }
  assert.ok(client.indexOf('className="card planner-progress"') < client.indexOf("planner-preview card"), "generated execution summary must be authored before the plan preview");
  assert.match(client, /setSettingsOpen\(false\)/);
});

test("planner rewards verified task activity without a manual check-in control", async () => {
  const [client, css] = await Promise.all([
    source("src/app/planner/planner-client.tsx"),
    source("src/app/globals.css"),
  ]);
  for (const token of ["Learning streak", "Study days", "Weekly goal complete", "You reached your HSK", "role=\"dialog\"", "aria-modal=\"true\""]) {
    assert.match(client, new RegExp(token));
  }
  assert.doesNotMatch(client, /<button[^>]*>[\s\S]{0,80}check[ -]?in/i);
  assert.match(client, /!Object\.values\(next\)\.includes\(removedDate\)/);
  assert.match(client, /activityDates\.filter\(\(date\) => date !== removedDate\)/);
  assert.match(client, /planner-celebration/);
  assert.match(css, /\.planner-celebration/);
  assert.match(css, /@keyframes\s+planner-confetti/);
  assert.match(css, /prefers-reduced-motion[\s\S]*planner-confetti/);
});

test("planner typography and generated settings prioritize readable execution on desktop and mobile", async () => {
  const [client, css] = await Promise.all([
    source("src/app/planner/planner-client.tsx"),
    source("src/app/globals.css"),
  ]);
  assert.match(css, /\.planner-save-note\s*\{[^}]*font-size:\s*14px/);
  assert.match(css, /\.planner-allocation-legend span\s*\{[^}]*font-size:\s*14px/);
  assert.match(css, /\.planner-task small\s*\{[^}]*font-size:\s*13px/);
  assert.match(css, /\.planner-layout\.has-plan \.planner-settings > summary\s*\{[^}]*display:\s*grid/);
  assert.match(css, /\.planner-layout\.has-plan \.planner-settings:not\(\[open\]\) \.planner-settings-content\s*\{[^}]*display:\s*none/);
  assert.match(client, /const scheduledMinutes = tasks\.reduce/);
  assert.match(client, /of \{scheduledMinutes\} scheduled/);
  assert.doesNotMatch(client, /of \{plan\.inputs\.weeklyMinutes\} planned/);
  assert.equal((client.match(/href=\{nextTask\.href\}/g) ?? []).length, 1);
  assert.ok(client.indexOf('className="planner-week"') < client.indexOf('className={`planner-preview'));
  assert.match(css, /\.planner-layout\.has-plan\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.planner-celebration-panel/);
});
