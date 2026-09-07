import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  PlacementClientError,
  loadPlacementSession,
  placementPublicError,
} from "../src/app/placement/client-recovery.ts";

const jsonResponse = (status: number, body: unknown, retryAfter?: string) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json",
    ...(retryAfter ? { "retry-after": retryAfter } : {}),
  },
});

test("placement load retries bounded D1 503 responses and preserves the recovered session", async () => {
  let attempts = 0;
  const waits: number[] = [];
  const retryAttempts: number[] = [];
  const session = { id: "placement-recovered" };

  const data = await loadPlacementSession({
    request: async () => {
      attempts += 1;
      return attempts < 3
        ? jsonResponse(503, { error: "D1_TEMPORARILY_UNAVAILABLE", retryable: true }, "1")
        : jsonResponse(200, { session, expired: false });
    },
    wait: async (delayMs) => { waits.push(delayMs); },
    onRetry: (attempt) => { retryAttempts.push(attempt); },
  });

  assert.equal(attempts, 3);
  assert.deepEqual(waits, [1_000, 1_000]);
  assert.deepEqual(retryAttempts, [1, 2]);
  assert.deepEqual(data.session, session);
});

test("placement load stops after bounded D1 retries with a typed temporary failure", async () => {
  let attempts = 0;

  await assert.rejects(
    () => loadPlacementSession({
      request: async () => {
        attempts += 1;
        return jsonResponse(503, { error: "D1_TEMPORARILY_UNAVAILABLE", retryable: true }, "0");
      },
      wait: async () => undefined,
    }),
    (error: unknown) => error instanceof PlacementClientError && error.code === "temporarily_unavailable",
  );
  assert.equal(attempts, 3);
});

test("placement load does not retry non-D1 failures", async () => {
  let attempts = 0;

  await assert.rejects(
    () => loadPlacementSession({
      request: async () => {
        attempts += 1;
        return jsonResponse(500, { error: "PLACEMENT_LOAD_FAILED" });
      },
      wait: async () => undefined,
    }),
    (error: unknown) => error instanceof PlacementClientError && error.code === "unavailable",
  );
  assert.equal(attempts, 1);
});

test("placement UI locks saved answers and never renders internal error codes", () => {
  const client = fs.readFileSync(new URL("../src/app/placement/placement-client.tsx", import.meta.url), "utf8");

  assert.match(client, /disabled=\{saving \|\| Boolean\(selected\)\}/);
  assert.match(client, /Answer saved/);
  assert.match(client, /reconnecting \? "Reconnecting…"/);
  assert.match(client, /placementPublicError\(error\)/);
  assert.doesNotMatch(client, /diagnostic: \{error\}/);
  assert.doesNotMatch(client, /not saved: \{error\}/);

  assert.equal(placementPublicError("PLACEMENT_QUESTION_OUT_OF_SEQUENCE"), "This question is already saved. Continue to the next question.");
  assert.equal(placementPublicError("temporarily_unavailable"), "Placement is temporarily busy. Your saved answers are safe. Please try again.");
});
