import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import worker from "../scripts/reviewed-vocabulary-publisher-worker.mjs";

const token = "a".repeat(43);
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const key = "system/artifacts/reviewed-v1/advanced-7-9/level-7.pdf";
function fixture() {
  const calls: string[] = [];
  let stored: ArrayBuffer | undefined;
  const env = {
    RUN_TOKEN_SHA256: sha(token), EXPIRES_AT: String(Date.now() + 60000),
    APPROVED_ARTIFACTS: JSON.stringify({ [key]: { sha256: sha("pdf"), bytes: 3, contentType: "application/pdf" } }),
    BUCKET: {
      async put(k: string, bytes: ArrayBuffer) { calls.push(`PUT:${k}`); stored = bytes; },
      async get(k: string) { calls.push(`GET:${k}`); return stored ? { size: stored.byteLength, body: stored } : null; },
    },
  };
  const request = (method: string, path = key, body?: string, auth = token) => new Request(`https://publisher.example/${path}`, { method, headers: { authorization: `Bearer ${auth}`, ...(body ? { "content-length": String(body.length) } : {}) }, body });
  return { env, calls, request };
}

test("temporary publisher denies unauthenticated, expired and out-of-scope requests without accessing R2", async () => {
  const f = fixture();
  assert.equal((await worker.fetch(f.request("GET", key, undefined, "b".repeat(43)), f.env)).status, 403);
  assert.equal((await worker.fetch(f.request("GET", "system/fonts/private.ttf"), f.env)).status, 404);
  assert.equal((await worker.fetch(f.request("DELETE"), f.env)).status, 405);
  assert.equal((await worker.fetch(f.request("GET"), { ...f.env, EXPIRES_AT: "1" })).status, 403);
  assert.deepEqual(f.calls, []);
});

test("temporary publisher accepts only exact approved bytes and supports authenticated read-back", async () => {
  const f = fixture();
  assert.equal((await worker.fetch(f.request("PUT", key, "bad"), f.env)).status, 422);
  assert.equal((await worker.fetch(f.request("PUT", key, "long"), f.env)).status, 413);
  assert.deepEqual(f.calls, []);
  assert.equal((await worker.fetch(f.request("PUT", key, "pdf"), f.env)).status, 200);
  const result = await worker.fetch(f.request("GET"), f.env);
  assert.equal(await result.text(), "pdf");
  assert.equal(result.headers.get("cache-control"), "no-store");
  assert.deepEqual(f.calls, [`PUT:${key}`, `GET:${key}`]);
});
