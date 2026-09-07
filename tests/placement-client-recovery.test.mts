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
      return attempts < 2
        ? jsonResponse(503, { error: "D1_TEMPORARILY_UNAVAILABLE", retryable: true }, "10")
        : jsonResponse(200, { session, expired: false });
    },
    wait: async (delayMs) => { waits.push(delayMs); },
    onRetry: (attempt) => { retryAttempts.push(attempt); },
  });

  assert.equal(attempts, 2);
  assert.deepEqual(waits, [10_000]);
  assert.deepEqual(retryAttempts, [1]);
  assert.deepEqual(data.session, session);
});

test("placement load caps the total circuit recovery wait at fifteen seconds", async () => {
  let attempts = 0;
  const waits: number[] = [];

  const data = await loadPlacementSession({
    request: async () => {
      attempts += 1;
      return attempts < 3
        ? jsonResponse(503, { error: "D1_TEMPORARILY_UNAVAILABLE", retryable: true }, "10")
        : jsonResponse(200, { session: { id: "placement-after-budget" }, expired: false });
    },
    wait: async (delayMs) => { waits.push(delayMs); },
  });

  assert.equal(attempts, 3);
  assert.deepEqual(waits, [10_000, 5_000]);
  assert.deepEqual(data.session, { id: "placement-after-budget" });
});

test("placement load stops after a fifteen-second bounded D1 recovery window", async () => {
  let attempts = 0;
  const waits: number[] = [];

  await assert.rejects(
    () => loadPlacementSession({
      request: async () => {
        attempts += 1;
        return jsonResponse(503, { error: "D1_TEMPORARILY_UNAVAILABLE", retryable: true }, "2");
      },
      wait: async (delayMs) => { waits.push(delayMs); },
    }),
    (error: unknown) => error instanceof PlacementClientError && error.code === "temporarily_unavailable",
  );
  assert.equal(attempts, 4);
  assert.deepEqual(waits, [5_000, 5_000, 5_000]);
});

test("placement load does not issue a zero-delay request after exhausting the wait budget", async () => {
  let attempts = 0;
  const waits: number[] = [];

  await assert.rejects(
    () => loadPlacementSession({
      request: async () => {
        attempts += 1;
        return jsonResponse(503, { error: "D1_TEMPORARILY_UNAVAILABLE", retryable: true }, "10");
      },
      wait: async (delayMs) => { waits.push(delayMs); },
    }),
    (error: unknown) => error instanceof PlacementClientError && error.code === "temporarily_unavailable",
  );
  assert.equal(attempts, 3);
  assert.deepEqual(waits, [10_000, 5_000]);
});

test("placement load never schedules a final retry below the minimum spacing", async () => {
  let attempts = 0;
  const waits: number[] = [];

  await assert.rejects(
    () => loadPlacementSession({
      request: async () => {
        attempts += 1;
        return jsonResponse(503, { error: "D1_TEMPORARILY_UNAVAILABLE", retryable: true }, "6");
      },
      wait: async (delayMs) => { waits.push(delayMs); },
    }),
    (error: unknown) => error instanceof PlacementClientError && error.code === "temporarily_unavailable",
  );
  assert.equal(attempts, 3);
  assert.deepEqual(waits, [6_000, 6_000]);
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

test("placement UI keeps saved answers editable and never renders internal error codes", () => {
  const client = fs.readFileSync(new URL("../src/app/placement/placement-client.tsx", import.meta.url), "utf8");

  assert.match(client, /disabled=\{saving\}/);
  assert.doesNotMatch(client, /disabled=\{saving \|\| Boolean\(selected\)\}/);
  assert.match(client, /Progress saved/);
  assert.doesNotMatch(client, /Answer saved/);
  assert.match(client, /reconnecting \? "Restoring your placement session…"/);
  assert.match(client, /placementPublicError\(error\)/);
  assert.doesNotMatch(client, /diagnostic: \{error\}/);
  assert.doesNotMatch(client, /not saved: \{error\}/);

  assert.equal(placementPublicError("PLACEMENT_QUESTION_OUT_OF_SEQUENCE"), "This question is already saved. Continue to the next question.");
  assert.equal(placementPublicError("temporarily_unavailable"), "Placement is temporarily busy. Your saved answers are safe. Please try again.");
});
