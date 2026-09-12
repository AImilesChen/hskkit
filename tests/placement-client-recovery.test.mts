import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  PlacementClientError,
  cachePlacementOverview,
  loadPlacementSession,
  placementPublicError,
  placementRetakeLocked,
  readCachedPlacementOverview,
} from "../src/app/placement/client-recovery.ts";

const jsonResponse = (status: number, body: unknown, retryAfter?: string) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json",
    ...(retryAfter ? { "retry-after": retryAfter } : {}),
  },
});

test("authoritative cooldown and explicit denial always keep retake locked", () => {
  assert.equal(placementRetakeLocked("cooldown", true), true);
  assert.equal(placementRetakeLocked("cooldown", undefined), true);
  assert.equal(placementRetakeLocked("ready", false), true);
  assert.equal(placementRetakeLocked("ready", true), false);
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
    random: () => 0,
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
    random: () => 0,
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
      random: () => 0,
    wait: async (delayMs) => { waits.push(delayMs); },
    }),
    (error: unknown) => error instanceof PlacementClientError && error.code === "temporarily_unavailable",
  );
  assert.equal(attempts, 4);
  assert.deepEqual(waits, [2_000, 2_000, 4_000]);
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
      random: () => 0,
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
      random: () => 0,
    wait: async (delayMs) => { waits.push(delayMs); },
    }),
    (error: unknown) => error instanceof PlacementClientError && error.code === "temporarily_unavailable",
  );
  assert.equal(attempts, 3);
  assert.deepEqual(waits, [6_000, 6_000]);
});

test("network and rate-limit failures retry with exponential backoff before recovery", async () => {
  const waits: number[] = [];
  let attempts = 0;
  const recovered = await loadPlacementSession({
    request: async () => {
      attempts += 1;
      if (attempts === 1) throw new TypeError("Failed to fetch");
      if (attempts === 2) return jsonResponse(429, { error: "RATE_LIMITED", retryable: true }, "0");
      return jsonResponse(200, { session: { id: "recovered" } });
    },
    random: () => 0,
    wait: async (delayMs) => { waits.push(delayMs); },
  });

  assert.equal(attempts, 3);
  assert.deepEqual(waits, [1_000, 2_000]);
  assert.deepEqual(recovered.session, { id: "recovered" });
});

test("exhausted network recovery reports a network-specific error", async () => {
  let attempts = 0;
  await assert.rejects(
    () => loadPlacementSession({
      maxRetries: 1,
      request: async () => {
        attempts += 1;
        throw new TypeError("Failed to fetch");
      },
      random: () => 0,
      wait: async () => undefined,
    }),
    (error: unknown) => error instanceof PlacementClientError && error.code === "network_unavailable",
  );
  assert.equal(attempts, 2);
});

test("placement page deduplicates concurrent reload requests", () => {
  const client = fs.readFileSync(new URL("../src/app/placement/placement-client.tsx", import.meta.url), "utf8");
  assert.match(client, /inFlightLoadRef\.current/);
  assert.match(client, /if \(inFlightLoadRef\.current\) return inFlightLoadRef\.current/);
});

test("placement load classifies non-transient HTTP failures without retrying", async () => {
  const cases = [
    { status: 401, body: { error: "ACCOUNT_REQUIRED" }, code: "auth_required" },
    { status: 403, body: { error: "ACCOUNT_DELETED" }, code: "account_unavailable" },
    { status: 503, body: { error: "PLACEMENT_NO_QUESTIONS" }, code: "no_questions" },
    { status: 503, body: { error: "PLACEMENT_CONTENT_VERSION_MISMATCH" }, code: "content_incompatible" },
    { status: 500, body: { error: "PLACEMENT_LOAD_FAILED" }, code: "unknown_server_error" },
  ] as const;

  for (const value of cases) {
    let attempts = 0;
    await assert.rejects(
      () => loadPlacementSession({
        request: async () => {
          attempts += 1;
          return jsonResponse(value.status, value.body);
        },
        wait: async () => undefined,
      }),
      (error: unknown) => error instanceof PlacementClientError && error.code === value.code,
    );
    assert.equal(attempts, 1, `${value.status}/${value.code} must not retry`);
  }
});

test("placement errors preserve the server reference for user-visible support", async () => {
  await assert.rejects(
    () => loadPlacementSession({
      request: async () => new Response(JSON.stringify({
        session: null,
        errorCode: "PLACEMENT_LOAD_FAILED",
        referenceId: "PLC-8F31C2AA",
      }), { status: 500 }),
    }),
    (error: unknown) => error instanceof PlacementClientError
      && error.details.referenceId === "PLC-8F31C2AA",
  );
  const client = fs.readFileSync(new URL("../src/app/placement/placement-client.tsx", import.meta.url), "utf8");
  assert.match(client, /Reference:/);
  assert.match(client, /loadReference/);
});

test("placement load failures emit the complete structured diagnostic contract", () => {
  const server = fs.readFileSync(new URL("../src/lib/placement/server.ts", import.meta.url), "utf8");
  assert.match(server, /placement_load_failed/);
  assert.match(server, /errorCode/);
  assert.match(server, /requestId/);
  assert.match(server, /sessionIdHash/);
  assert.match(server, /sessionStatus/);
  assert.match(server, /retryCount/);
  assert.match(server, /cfRayId/);
  assert.match(server, /x-placement-reference/);
});

test("placement UI keeps saved answers editable and never renders internal error codes", () => {
  const client = fs.readFileSync(new URL("../src/app/placement/placement-client.tsx", import.meta.url), "utf8");

  assert.match(client, /disabled=\{saving\}/);
  assert.doesNotMatch(client, /disabled=\{saving \|\| Boolean\(selected\)\}/);
  assert.match(client, /Progress saved/);
  assert.doesNotMatch(client, /Answer saved/);
  assert.match(client, /reconnecting \? "Restoring your placement session…"/);
  assert.match(client, /placementPublicError\(loadError\)/);
  assert.match(client, /placementPublicError\(startError\)/);
  assert.match(client, /placementPublicError\(answerError\)/);
  assert.doesNotMatch(client, /diagnostic: \{error\}/);
  assert.doesNotMatch(client, /not saved: \{error\}/);

  assert.equal(placementPublicError("PLACEMENT_QUESTION_OUT_OF_SEQUENCE"), "This question is already saved. Continue to the next question.");
  assert.equal(placementPublicError("temporarily_unavailable"), "Placement is temporarily busy. Your saved answers are safe. Please try again.");
  assert.equal(placementPublicError("auth_required"), "Your sign-in expired. Sign in again to restore this placement.");
  assert.equal(placementPublicError("account_unavailable"), "This account cannot load Placement right now. Visit Account for details.");
  assert.equal(placementPublicError("network_unavailable"), "We could not reach HSKKit. Check your connection and try again.");
  assert.equal(placementPublicError("content_incompatible"), "This saved session uses an older question set. Your answers are safe; start a new placement.");
  assert.equal(placementPublicError("unknown_server_error"), "Placement hit an unexpected error. Retry once or use the reference below for support.");
});

test("a failed reload can reuse the last safe overview without storing answers", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
  cachePlacementOverview(storage, {
    session: { id: "must-not-be-cached", answers: [{ questionId: "q1", answer: "A" }] },
    expired: true,
    status: "ready",
    latestResultId: "result-safe",
    latestRecommendedLevel: 4,
    canRetake: true,
    serverNow: "2026-09-12T10:00:00.000Z",
  });

  assert.deepEqual(readCachedPlacementOverview(storage), {
    session: null,
    expired: true,
    status: "ready",
    latestResultId: "result-safe",
    latestRecommendedLevel: 4,
    canRetake: true,
    serverNow: "2026-09-12T10:00:00.000Z",
  });
  assert.equal([...values.values()][0].includes("must-not-be-cached"), false);
  assert.equal([...values.values()][0].includes("questionId"), false);

  const client = fs.readFileSync(new URL("../src/app/placement/placement-client.tsx", import.meta.url), "utf8");
  assert.match(client, /cachePlacementOverview\(window\.sessionStorage, data\)/);
  assert.match(client, /readCachedPlacementOverview\(window\.sessionStorage\)/);
  assert.match(client, /Latest saved result: HSK \{latestRecommendedLevel\}/);
  assert.match(client, /View latest result/);
});

test("expired placement degrades to a recoverable entry while preserving the latest result", () => {
  const server = fs.readFileSync(new URL("../src/lib/placement/server.ts", import.meta.url), "utf8");
  const client = fs.readFileSync(new URL("../src/app/placement/placement-client.tsx", import.meta.url), "utf8");

  assert.match(server, /expiredPlacement\(loaded\.state, identity\.id, now\)/);
  assert.match(server, /expired:\s*Boolean\(expiredSession\)/);
  assert.match(client, /expired \? "Your saved placement session expired"[\s\S]*?latestReady \? "Your latest placement is ready"/);
  assert.match(client, /latestResultId[\s\S]*?View my result/);
  assert.match(client, /expired \? "Start a new placement"/);
});

test("non-retryable load failures render corrective actions instead of another blind retry", () => {
  const client = fs.readFileSync(new URL("../src/app/placement/placement-client.tsx", import.meta.url), "utf8");
  assert.match(client, /loadError === "auth_required"[\s\S]*?Sign in again/);
  assert.match(client, /loadError === "account_unavailable"[\s\S]*?Open account/);
  assert.match(client, /loadError === "content_incompatible"[\s\S]*?Start a new placement/);
});

test("content-incompatible sessions expose an owner-scoped restart handle without exposing it in logs", () => {
  const server = fs.readFileSync(new URL("../src/lib/placement/server.ts", import.meta.url), "utf8");
  const route = fs.readFileSync(new URL("../src/app/api/v1/placement/sessions/route.ts", import.meta.url), "utf8");
  const client = fs.readFileSync(new URL("../src/app/placement/placement-client.tsx", import.meta.url), "utf8");
  assert.match(server, /recoverableSessionId/);
  assert.match(route, /previousSessionId[\s\S]*?runPlacementAction\(req, "restart"/);
  assert.match(client, /previousSessionId:\s*loadRecoverySessionId/);
  assert.doesNotMatch(server, /console\.error\([\s\S]*?sessionId:\s*diagnostic\.sessionId/);
});
