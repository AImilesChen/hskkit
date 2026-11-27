import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";

test("daily reporting preserves export cleanup and queue processing and isolates their failures", async () => {
  const calls: unknown[] = [];
  const fixture = { calls, failCleanup: false };
  (globalThis as any).__adminMaintenanceFixture = fixture;
  const result = await build({
    entryPoints: ["workers/commercial-export-worker.ts"], bundle: true, write: false,
    format: "cjs", platform: "node",
    plugins: [{ name: "isolated-business-dependencies", setup(builder) {
      builder.onResolve({ filter: /src\/lib\/(commercial\/|storage\/export-cleanup)/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: `
        const fixture=globalThis.__adminMaintenanceFixture;
        export async function processCommercialExport(body){fixture.calls.push(['queue',body.jobId]);return {};}
        export function retryDelaySeconds(){return 1;}
        export function commerceDb(){return {};}
        export async function expireReadyExports(){fixture.calls.push('expire');if(fixture.failCleanup)throw Error('cleanup unavailable');return [];}
        export async function cleanupExpiredExportObjects(){fixture.calls.push('cleanup');return {};}
        export async function clearExportObjectKey(){}
        export async function getExportJob(){return null;}
      `, loader: "js" }));
    } }],
  });
  const moduleValue = { exports: {} as any };
  new Function("module", "exports", result.outputFiles[0].text)(moduleValue, moduleValue.exports);
  const worker = moduleValue.exports.default;
  const env = { DASHBOARD: { async refresh(days: number) { calls.push(["report", days]); if (days === 28) throw Error("report provider unavailable"); } } };
  const originalLog = console.log;
  const originalError = console.error;
  console.log = () => {};
  console.error = () => {};
  try {
    await worker.scheduled({ scheduledTime: Date.parse("2026-11-27T09:00:00Z") }, env);
    assert.deepEqual(calls.splice(0), ["expire", "cleanup"]);
    await worker.scheduled({ scheduledTime: Date.parse("2026-11-27T09:15:00Z") }, env);
    assert.deepEqual(calls.splice(0), ["expire", "cleanup", ["report", 7], ["report", 28], ["report", 90]]);
    fixture.failCleanup = true;
    await worker.scheduled({ scheduledTime: Date.parse("2026-11-28T09:15:00Z") }, env);
    assert.deepEqual(calls.splice(0), ["expire", ["report", 7], ["report", 28], ["report", 90]]);
    await worker.queue({ messages: [{ body: { jobId: "existing-export" }, ack() { calls.push("ack"); }, retry() { calls.push("retry"); } }] }, env);
    assert.deepEqual(calls, [["queue", "existing-export"], "ack"]);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    delete (globalThis as any).__adminMaintenanceFixture;
  }
});
