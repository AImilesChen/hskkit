import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { loadLearningData } from "../src/lib/learning/client-load.ts";
import { readTodaySnapshot, writeTodaySnapshot } from "../src/lib/learning/today-snapshot.ts";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");
const jsonResponse = (status: number, body: unknown, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", ...headers },
});

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
    removeItem(key: string) { values.delete(key); },
  };
}

test("learning route keeps GET initialization separate from mutation-only modules", async () => {
  const [route, readHandler] = await Promise.all([
    source("src/app/api/v1/learning/route.ts"),
    source("src/app/api/v1/learning/read.ts"),
  ]);
  assert.match(route, /import\("\.\/read"\)/);
  assert.match(route, /import\("\.\/write"\)/);
  assert.doesNotMatch(route, /step7|questions|commercial\/referral-storage/);
  assert.doesNotMatch(readHandler, /step7-content|step7-playback|trustedQuestion|reconcileReferralLearningMilestone|answerTopicPracticeQuestion/);
});

test("learning GET protects only independent D1 stages and records their timing", async () => {
  const readHandler = await source("src/app/api/v1/learning/read.ts");
  assert.doesNotMatch(readHandler, /withUserD1ReadProtection\(\(\) => getLearning/);
  assert.match(readHandler, /Promise\.all\(\[/);
  for (const stage of ["learning_state", "capabilities", "usage"]) {
    assert.match(readHandler, new RegExp(`protectedStage\\(timer, "${stage}"`));
  }
  assert.match(readHandler, /Server-Timing/);
  assert.match(readHandler, /\[learning-get-timing\]/);
});

test("Today retry follows Retry-After once instead of stacking three fixed attempts", async () => {
  let attempts = 0;
  const waits: number[] = [];
  const result = await loadLearningData<{ ready: boolean }>(async () => {
    attempts += 1;
    return attempts === 1
      ? jsonResponse(503, { error: "D1_TEMPORARILY_UNAVAILABLE", retryable: true }, { "retry-after": "5" })
      : jsonResponse(200, { ready: true });
  }, {
    wait: async (delayMs) => { waits.push(delayMs); },
    isOnline: () => true,
  });
  assert.deepEqual(result, { ready: true });
  assert.equal(attempts, 2);
  assert.deepEqual(waits, [5_000]);
});

test("Today restores a recent tab-local snapshot and expires stale progress", () => {
  const storage = memoryStorage();
  const snapshot = { revision: 7, session: { id: "today-1" } };
  writeTodaySnapshot(storage, snapshot, 1_000);
  assert.deepEqual(readTodaySnapshot(storage, 1_500, 1_000), snapshot);
  assert.equal(readTodaySnapshot(storage, 2_001, 1_000), null);
});

test("Today dashboard renders saved progress while background refresh recovers", async () => {
  const dashboard = await source("src/app/components/learning-dashboard.tsx");
  assert.match(dashboard, /readTodaySnapshot(?:<Data>)?\(sessionStorage/);
  assert.match(dashboard, /writeTodaySnapshot\(sessionStorage/);
  assert.match(dashboard, /Showing your saved plan while we refresh/);
  assert.match(dashboard, /dataRef\.current[\s\S]*setRefreshNotice/);
});
