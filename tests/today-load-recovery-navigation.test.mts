import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { LearningLoadError, loadLearningData } from "../src/lib/learning/client-load.ts";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");
const jsonResponse = (status: number, body: unknown) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json" },
});

test("Today client retries one bounded transient D1 response and recovers", async () => {
  let attempts = 0;
  const waits: number[] = [];
  const retryAttempts: number[] = [];
  const result = await loadLearningData<{ ready: boolean }>(async () => {
    attempts += 1;
    return attempts === 1
      ? jsonResponse(503, { error: "D1_TEMPORARILY_UNAVAILABLE", retryable: true })
      : jsonResponse(200, { ready: true });
  }, {
    wait: async (delayMs) => { waits.push(delayMs); },
    isOnline: () => true,
    onTransientRetry: (attempt) => { retryAttempts.push(attempt); },
  });

  assert.deepEqual(result, { ready: true });
  assert.equal(attempts, 2);
  assert.deepEqual(waits, [2000]);
  assert.deepEqual(retryAttempts, [1]);
});

test("Today client exposes a typed service-busy failure after bounded retries", async () => {
  let attempts = 0;
  await assert.rejects(
    () => loadLearningData(async () => {
      attempts += 1;
      return jsonResponse(503, { error: "D1_TEMPORARILY_UNAVAILABLE", retryable: true });
    }, { wait: async () => undefined, isOnline: () => true }),
    (error: unknown) => error instanceof LearningLoadError && error.code === "temporarily_unavailable",
  );
  assert.equal(attempts, 2);
});

test("Today client labels an actual offline fetch failure without retrying", async () => {
  let attempts = 0;
  await assert.rejects(
    () => loadLearningData(async () => {
      attempts += 1;
      throw new TypeError("Failed to fetch");
    }, { wait: async () => undefined, isOnline: () => false }),
    (error: unknown) => error instanceof LearningLoadError && error.code === "offline",
  );
  assert.equal(attempts, 1);
});

test("Today and Listen use one stable learning-loop navigation", async () => {
  const [nav, dashboard, listen] = await Promise.all([
    source("src/app/components/learning-loop-nav.tsx"),
    source("src/app/components/learning-dashboard.tsx"),
    source("src/app/listen/page.tsx"),
  ]);

  for (const item of [
    '{ label: "Today", href: "/today" }',
    '{ label: "Review", href: "/review" }',
    '{ label: "Mistakes", href: "/mistakes" }',
    '{ label: "Listen", href: "/listen" }',
  ]) assert.match(nav, new RegExp(item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(nav, /Planner/);
  assert.match(nav, /aria-current=\{active === link\.label \? "page" : undefined\}/);
  assert.match(dashboard, /<LearningLoopNav active=\{pageTitle\}/);
  assert.match(dashboard, /<LearningLoopNav active=\{props\.active\}/);
  assert.match(listen, /<LearningLoopNav active="Listen"\/>/);
  assert.doesNotMatch(listen, /href="\/planner">Planner<\/Link>/);
});
