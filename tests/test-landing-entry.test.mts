import test from "node:test";
import assert from "node:assert/strict";
import { placementEntry, startPlacementFromEntry } from "../src/lib/tests/placement-entry.ts";
import { siteNavigation, isNavigationItemActive, isNavigationGroup } from "../src/app/site-navigation.ts";

test("placement landing offers a new test without inventing a session", () => {
  assert.equal(placementEntry().kind, "start");
  assert.equal(placementEntry({ status: "ready", session: null }).href, "/placement");
  assert.equal(placementEntry({ status: "expired", session: null }).kind, "start");
});

test("an active session continues while cooldown always prevents a new-test action", () => {
  const active = placementEntry({ status: "active", session: { id: "saved", status: "in_progress" }, canRetake: false });
  assert.equal(active.kind, "continue");
  assert.equal(active.href, "/placement");
  assert.equal(placementEntry({ session: { id: "saved", status: "in_progress" }, canRetake: false }).kind, "continue");
  const cooldown = placementEntry({ status: "cooldown", canRetake: true, latestResultId: "saved-result", session: { id: "saved", status: "in_progress" } });
  assert.equal(cooldown.kind, "result");
  assert.equal(cooldown.canRetake, false);
  assert.equal(cooldown.href, "/placement/result/saved-result");
  assert.equal(placementEntry({ status: "ready", canRetake: false }).kind, "result");
});

test("results use an encoded internal link and retakes require explicit availability", () => {
  const result = placementEntry({ latestResultId: "a/b?c", status: "ready", canRetake: true });
  assert.equal(result.href, "/placement/result/a%2Fb%3Fc");
  assert.equal(result.canRetake, true);
  assert.equal(placementEntry({ latestResultId: "result" }).canRetake, false);
  assert.equal(placementEntry({ latestResultId: "x".repeat(161) }).kind, "start");
});

test("only an explicit start helper call posts to the existing session endpoint", async () => {
  const calls: Array<{ url: string; options?: RequestInit }> = [];
  const request: typeof fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return Response.json({ session: { id: "new-session" } });
  };
  placementEntry({ status: "ready" });
  assert.equal(calls.length, 0);
  await startPlacementFromEntry(request, "placement-start:stable-key");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/v1/placement/sessions");
  assert.equal(calls[0].options?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0].options?.body)), { idempotencyKey: "placement-start:stable-key" });
});

test("start failures cannot be mistaken for a successful test and retries keep the caller's key", async () => {
  const keys: string[] = [];
  const request: typeof fetch = async (_url, options) => {
    keys.push(JSON.parse(String(options?.body)).idempotencyKey);
    return Response.json({ error: "temporarily_unavailable" }, { status: 503 });
  };
  await assert.rejects(startPlacementFromEntry(request, "same-key"), /Could not start/);
  await assert.rejects(startPlacementFromEntry(request, "same-key"), /Could not start/);
  assert.deepEqual(keys, ["same-key", "same-key"]);
  await assert.rejects(startPlacementFromEntry(async () => Response.json({}), "same-key"), /Could not start/);
});

test("Tests navigation reaches the SEO landing and stays active on the runner and private results", () => {
  const group = siteNavigation.find(item => item.label === "Tests");
  assert.ok(group && isNavigationGroup(group));
  const placement = group.items.find(item => item.href === "/hsk-placement-test");
  assert.ok(placement);
  for (const path of ["/hsk-placement-test", "/placement", "/placement/result/example"]) assert.ok(isNavigationItemActive(path, placement), path);
  assert.equal(isNavigationItemActive("/hsk-test-prep", placement), false);
  assert.ok(group.items.some(item => item.href === "/hsk-test-prep"));
});
