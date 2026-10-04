import assert from "node:assert/strict";
import test from "node:test";

import {
  PlaybackVerificationCoordinator,
  playbackVerificationMessage,
  waitForPlaybackWindow,
} from "../src/lib/learning/verified-playback.ts";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test("short audio waits for the server verification window before completion", async () => {
  let now = 1_000;
  const waits: number[] = [];
  const completed: string[] = [];
  await waitForPlaybackWindow("1970-01-01T00:00:01.104Z", {
    now: () => now,
    sleep: async (milliseconds) => { waits.push(milliseconds); now += milliseconds; },
  });
  assert.deepEqual(waits, [104]);

  const coordinator = new PlaybackVerificationCoordinator({
    start: async () => ({ playbackTicket: "ticket-short", notBefore: "1970-01-01T00:00:02.104Z" }),
    complete: async (ticket) => { completed.push(ticket); },
    now: () => now,
    sleep: async (milliseconds) => { waits.push(milliseconds); now += milliseconds; },
  });
  assert.equal(await coordinator.prepare(), true);
  assert.equal(coordinator.snapshot().state, "playing");
  assert.equal(await coordinator.finish(), true);
  assert.deepEqual(completed, ["ticket-short"]);
  assert.equal(coordinator.snapshot().state, "verified");
});

test("playback cannot start before a delayed ticket response arrives", async () => {
  const started = deferred<{ playbackTicket: string; notBefore: string }>();
  const coordinator = new PlaybackVerificationCoordinator({
    start: () => started.promise,
    complete: async () => undefined,
  });
  const preparing = coordinator.prepare();
  assert.equal(coordinator.snapshot().state, "preparing");
  started.resolve({ playbackTicket: "ticket-delayed", notBefore: new Date(0).toISOString() });
  assert.equal(await preparing, true);
  assert.equal(coordinator.snapshot().ticket, "ticket-delayed");
});

test("pause and resume reuse one ticket while replay creates a new ticket", async () => {
  let starts = 0;
  const coordinator = new PlaybackVerificationCoordinator({
    start: async () => ({ playbackTicket: `ticket-${++starts}`, notBefore: new Date(0).toISOString() }),
    complete: async () => undefined,
  });
  assert.equal(await coordinator.prepare(), true);
  const first = coordinator.snapshot().ticket;
  coordinator.pause();
  assert.equal(coordinator.snapshot().state, "paused");
  assert.equal(coordinator.resume(), true);
  assert.equal(coordinator.snapshot().ticket, first);
  assert.equal(starts, 1);
  assert.equal(await coordinator.finish(), true);
  assert.equal(await coordinator.prepare(), true);
  assert.equal(starts, 2);
  assert.notEqual(coordinator.snapshot().ticket, first);
});

test("reset invalidates stale start and completion requests", async () => {
  const firstStart = deferred<{ playbackTicket: string; notBefore: string }>();
  const coordinator = new PlaybackVerificationCoordinator({
    start: () => firstStart.promise,
    complete: async () => undefined,
  });
  const first = coordinator.prepare();
  coordinator.reset();
  firstStart.resolve({ playbackTicket: "stale-ticket", notBefore: new Date(0).toISOString() });
  assert.equal(await first, false);
  assert.equal(coordinator.snapshot().ticket, undefined);
  assert.equal(coordinator.snapshot().state, "idle");
});

test("concurrent prepare calls create only one active ticket", async () => {
  const started = deferred<{ playbackTicket: string; notBefore: string }>();
  let starts = 0;
  const coordinator = new PlaybackVerificationCoordinator({
    start: () => { starts += 1; return started.promise; },
    complete: async () => undefined,
  });
  const first = coordinator.prepare();
  const second = coordinator.prepare();
  assert.equal(await second, false);
  started.resolve({ playbackTicket: "only-ticket", notBefore: new Date(0).toISOString() });
  assert.equal(await first, true);
  assert.equal(starts, 1);
});

test("verification errors are classified into actionable user messages", () => {
  assert.match(playbackVerificationMessage("AUDIO_PLAYBACK_INCOMPLETE", "complete"), /verifying|moment/i);
  assert.match(playbackVerificationMessage("AUDIO_PLAYBACK_TICKET_EXPIRED", "complete"), /Replay/i);
  assert.match(playbackVerificationMessage("AUDIO_PLAYBACK_TICKET_INVALID", "complete"), /Replay/i);
  assert.match(playbackVerificationMessage("AUDIO_ASSET_UNAVAILABLE", "start"), /unavailable/i);
  assert.match(playbackVerificationMessage("NETWORK_ERROR", "complete"), /connection/i);
});
