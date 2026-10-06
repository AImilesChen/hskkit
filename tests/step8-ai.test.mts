import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";

import {
  AI_DAILY_ALLOWANCE,
  AI_MAX_OUTPUT_TOKENS,
  AI_RATE_LIMIT_PER_MINUTE,
  aiRuntimePolicy,
  buildExplanationPrompt,
  buildStudyPlanPrompt,
  nonAiExplanation,
  nonAiStudyPlan,
  parseAiOutput,
} from "../src/lib/ai/domain.ts";
import { callAiProvider, providerConfig } from "../src/lib/ai/provider.ts";
import { AI_MERGE_BUCKET_SQL } from "../src/lib/ai/merge.ts";
import { grammarBySlug } from "../src/lib/learning/step7-content.ts";
import { buildPlannerDraft } from "../src/lib/planner/domain.ts";
import { emptyLearningState } from "../src/lib/learning/domain.ts";

const now = "2026-08-21T10:00:00.000Z";

test("Step 8 freezes bounded quota, rate and one-call output cost", () => {
  assert.equal(AI_DAILY_ALLOWANCE, 10);
  assert.equal(AI_RATE_LIMIT_PER_MINUTE, 6);
  assert.equal(AI_MAX_OUTPUT_TOKENS, 500);
  assert.deepEqual(aiRuntimePolicy({ AI_DAILY_ALLOWANCE: "7", AI_RATE_LIMIT_PER_MINUTE: "4", AI_MAX_OUTPUT_TOKENS: "320" } as CloudflareEnv), {
    dailyAllowance: 10,
    rateLimitPerMinute: 6,
    maxOutputTokens: 320,
  });
  assert.deepEqual(aiRuntimePolicy({ AI_DAILY_ALLOWANCE: "999", AI_RATE_LIMIT_PER_MINUTE: "0", AI_MAX_OUTPUT_TOKENS: "9999" } as CloudflareEnv), {
    dailyAllowance: 10,
    rateLimitPerMinute: 6,
    maxOutputTokens: 500,
  });
});

test("AI Explanation prompt is grounded in trusted exercise data and forbids exam promises and pronunciation scores", () => {
  const lesson = grammarBySlug("ba-sentence-basics")!;
  const prompt = buildExplanationPrompt(lesson.exercise, "B");
  assert.match(prompt, /Choose the complete 把 sentence/);
  assert.match(prompt, /Correct answer: A/);
  assert.match(prompt, /Learner answer: B/);
  assert.match(prompt, /Never claim official HSK status/i);
  assert.match(prompt, /Never score pronunciation/i);
});

test("AI Study Plan prompt supplements rather than replaces the deterministic plan", () => {
  const draft = buildPlannerDraft({ goalLevel: 3, targetDate: "2026-12-01", weeklyMinutes: 210, preferredDays: [1, 3, 5], weakPoints: ["grammar"], state: emptyLearningState(), now });
  assert.equal(draft.ok, true);
  if (!draft.ok) return;
  const prompt = buildStudyPlanPrompt(draft.plan);
  assert.match(prompt, /supplement/i);
  assert.match(prompt, /210 minutes/);
  assert.match(prompt, /grammar/);
  assert.match(prompt, /Never claim.*guaranteed results/i);
});

test("unsafe provider claims and pronunciation scoring are rejected", () => {
  const unsafePromise = JSON.stringify({ title: "Guaranteed", summary: "This official plan guarantees you will pass HSK 3.", whyCorrect: "A", nextStep: "Study" });
  const unsafeScore = JSON.stringify({ title: "Score", summary: "Your pronunciation score is 92/100.", whyCorrect: "A", nextStep: "Study" });
  assert.throws(() => parseAiOutput("explanation", unsafePromise), /AI_OUTPUT_UNSAFE/);
  assert.throws(() => parseAiOutput("explanation", unsafeScore), /AI_OUTPUT_UNSAFE/);
});

test("provider output is strict JSON with bounded plain-text fields", () => {
  const valid = parseAiOutput("explanation", JSON.stringify({ title: "Why 把 needs a result", summary: "The object is affected by the action.", whyCorrect: "写完 supplies the result.", nextStep: "Try the linked reading." }));
  assert.equal(valid.kind, "explanation");
  assert.equal(valid.title, "Why 把 needs a result");
  assert.throws(() => parseAiOutput("explanation", "```json\n{}\n```"), /AI_OUTPUT_INVALID/);
  assert.throws(() => parseAiOutput("study_plan", JSON.stringify({ title: "Plan", priorities: [], nextActions: [] })), /AI_OUTPUT_INVALID/);
});

test("non-AI alternatives are always usable without a provider", () => {
  const lesson = grammarBySlug("ba-sentence-basics")!;
  const explanation = nonAiExplanation(lesson.exercise);
  assert.equal(explanation.charged, false);
  assert.equal(explanation.summary, lesson.exercise.explanation);
  const plan = nonAiStudyPlan("/planner", "/review");
  assert.equal(plan.charged, false);
  assert.deepEqual(plan.links.map((item) => item.href), ["/planner", "/review"]);
});

test("provider adapter makes one bounded DeepSeek request and normalizes failure", async () => {
  const calls: Array<{ url: string; body: any }> = [];
  const request = async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), body: JSON.parse(String(init?.body)) });
    return new Response(JSON.stringify({ id: "provider-1", choices: [{ message: { content: JSON.stringify({ title: "Tip", summary: "Grounded help.", whyCorrect: "Because the result is complete.", nextStep: "Try one more item." }) } }], usage: { prompt_tokens: 100, completion_tokens: 40 } }), { status: 200, headers: { "content-type": "application/json" } });
  };
  const config = providerConfig({ DEEPSEEK_API_KEY: "test-secret", DEEPSEEK_BASE_URL: "https://api.deepseek.com", DEEPSEEK_MODEL: "deepseek-flash" } as CloudflareEnv)!;
  const result = await callAiProvider(config, "trusted prompt", 320, request as typeof fetch);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.deepseek.com/chat/completions");
  assert.equal(calls[0].body.model, "deepseek-flash");
  assert.equal(calls[0].body.max_tokens, 320);
  assert.equal(calls[0].body.stream, false);
  assert.deepEqual(calls[0].body.thinking, { type: "disabled" });
  assert.equal(result.providerRequestId, "provider-1");
  await assert.rejects(() => callAiProvider(config, "trusted prompt", 320, async () => new Response(JSON.stringify({ choices: [{ message: { content: "{}" } }], usage: { completion_tokens: 321 } }), { status: 200 })), /AI_PROVIDER_INVALID_RESPONSE/);
  await assert.rejects(() => callAiProvider(config, "trusted prompt", 320, async () => new Response("unavailable", { status: 503 })), /AI_PROVIDER_UNAVAILABLE/);
  assert.throws(() => providerConfig({ DEEPSEEK_API_KEY: "test-secret", DEEPSEEK_BASE_URL: "https://proxy.example.com", DEEPSEEK_MODEL: "deepseek-flash" } as CloudflareEnv), /AI_PROVIDER_CONFIG_INVALID/);
  assert.throws(() => providerConfig({ DEEPSEEK_API_KEY: "test-secret", DEEPSEEK_BASE_URL: "https://api.deepseek.com", DEEPSEEK_MODEL: "deepseek-chat" } as CloudflareEnv), /AI_PROVIDER_CONFIG_INVALID/);
});

test("guest merge preserves terminal AI history and cannot reset consumed allowance", () => {
  const source = readFileSync(new URL("../src/lib/account/storage.ts", import.meta.url), "utf8");
  assert.match(source, /accountAi[\s\S]*guestAi/);
  assert.match(source, /INSERT INTO ai_operations[\s\S]*AI_MERGED_BEFORE_COMPLETION/);
  assert.match(source, /AI_MERGE_BUCKET_SQL/);
  assert.match(source, /DELETE FROM account_cas_assertions WHERE id IN/);
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../migrations/0005_step8_ai.sql", import.meta.url), "utf8"));
  db.prepare("INSERT INTO ai_quota_buckets(owner_id,period_key,allowance,used,reserved,updated_at) VALUES(?,?,?,?,?,?)").run("guest-old-policy", "2026-08-21", 50, 1, 0, now);
  db.prepare(AI_MERGE_BUCKET_SQL).run("user:new", 10, 10, now, "guest-old-policy");
  const merged = db.prepare("SELECT allowance,used,reserved FROM ai_quota_buckets WHERE owner_id=? AND period_key=?").get("user:new", "2026-08-21") as { allowance: number; used: number; reserved: number };
  assert.equal(merged.allowance, 10);
  assert.equal(merged.used, 1);
  assert.equal(merged.reserved, 0);
});

test("D1 migration enforces one operation per owner/feature/idempotency key and nonnegative quota", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../migrations/0005_step8_ai.sql", import.meta.url), "utf8"));
  db.prepare("INSERT INTO ai_quota_buckets(owner_id,period_key,allowance,used,reserved,updated_at) VALUES(?,?,?,?,?,?)").run("guest-1", "2026-08-21", 10, 0, 1, now);
  db.prepare("INSERT INTO ai_operations(id,owner_id,feature,idempotency_key,request_hash,status,quota_period,cost_units,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)").run("op-1", "guest-1", "explanation", "same-key", "hash", "reserved", "2026-08-21", 1, now, now);
  assert.throws(() => db.prepare("INSERT INTO ai_operations(id,owner_id,feature,idempotency_key,request_hash,status,quota_period,cost_units,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)").run("op-2", "guest-1", "explanation", "same-key", "hash", "reserved", "2026-08-21", 1, now, now));
  assert.throws(() => db.prepare("UPDATE ai_quota_buckets SET reserved=-1 WHERE owner_id='guest-1' AND period_key='2026-08-21'").run());
});
