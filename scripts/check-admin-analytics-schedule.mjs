import assert from "node:assert/strict";
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!account || !token) throw new Error("Cloudflare release credentials unavailable");
async function get(path) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}${path}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Analytics schedule verification HTTP ${response.status}`);
  const result = await response.json();
  if (!result.success) throw new Error("Analytics schedule verification failed");
  return result.result;
}
const [settings, result] = await Promise.all([get("/workers/scripts/hskkit-commercial-export-worker/settings"), get("/workers/scripts/hskkit-commercial-export-worker/schedules")]);
assert.ok(settings.bindings.some(binding => binding.type === "service" && binding.name === "DASHBOARD" && binding.service === "hskkit" && binding.entrypoint === "AdminAnalyticsSync"));
const schedules = Array.isArray(result) ? result : result.schedules;
assert.ok(schedules.some(schedule => schedule.cron === "*/15 * * * *"));
console.log(JSON.stringify({ worker: "hskkit-commercial-export-worker", existingCron: "*/15 * * * *", reportingUtcTime: "09:15", service: "hskkit", entrypoint: "AdminAnalyticsSync", verified: true }));
