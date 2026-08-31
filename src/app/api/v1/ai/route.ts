import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { requestIdentity } from "@/lib/account/identity";
import { productAiRuntimePolicy, buildExplanationPrompt, buildStudyPlanPrompt, nonAiExplanation, nonAiStudyPlan, parseAiOutput, type AiFeature } from "@/lib/ai/domain";
import { callAiProvider, providerConfig } from "@/lib/ai/provider";
import { readBoundedJsonObject } from "@/lib/ai/request";
import { finalizeFailure, finalizeSuccess, quotaView, reserveOperation } from "@/lib/ai/storage";
import { loadState } from "@/lib/learning/storage";
import { trustedStep7Exercise, type Step7Exercise } from "@/lib/learning/step7-content";
import { reviewSnapshotForAttempt } from "@/lib/learning/review-content";
import { latestPlan } from "@/lib/planner/storage";
import { resolveCapabilities } from "@/lib/commercial/storage";

async function owner() {
  const identity = await requestIdentity();
  if (identity.account) return { id: `user:${identity.account.userId}`, account: identity.account, fresh: false };
  return { id: "guest", account: undefined, fresh: false };
}
function response(payload: unknown, identity: Awaited<ReturnType<typeof owner>>, status = 200, extraHeaders: Record<string, string> = {}) {
  const res = NextResponse.json(payload, { status, headers: { "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow", ...extraHeaders } });
  return res;
}
const safeKey = (value: unknown) => typeof value === "string" && /^[A-Za-z0-9_-]{12,80}$/.test(value) ? value : undefined;
const safeId = (value: unknown) => typeof value === "string" && /^[a-z0-9:_-]{3,160}$/i.test(value) ? value : undefined;
async function hash(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
const normalizedFailure = (error: unknown) => {
  const code = error instanceof Error ? error.message : "AI_PROVIDER_UNAVAILABLE";
  return ["AI_PROVIDER_UNAVAILABLE", "AI_PROVIDER_TIMEOUT", "AI_PROVIDER_RATE_LIMITED", "AI_PROVIDER_INVALID_RESPONSE", "AI_OUTPUT_INVALID", "AI_OUTPUT_UNSAFE", "AI_PROVIDER_CONFIG_INVALID"].includes(code) ? code : "AI_PROVIDER_UNAVAILABLE";
};

function trustedReviewExplanation(state: Awaited<ReturnType<typeof loadState>>["state"], reviewCardId: string) {
  const card = state.cards.find((item) => item.id === reviewCardId);
  if (!card) return { error: "REVIEW_CARD_NOT_FOUND" as const };
  if (!card.gradeKeys.length) return { error: "REVIEW_EXPLANATION_REQUIRES_FEEDBACK" as const };
  const attempt = state.attempts.find((item) => item.id === card.sourceAttemptId);
  const snapshot = attempt ? reviewSnapshotForAttempt(attempt) : undefined;
  if (!attempt || !snapshot) return { error: "REVIEW_EXPLANATION_UNAVAILABLE" as const };
  const exercise: Step7Exercise = {
    id: `review:${card.id}`,
    contentId: attempt.contentId,
    contentVersion: attempt.contentVersion,
    kind: snapshot.skillLabel === "Grammar" ? "grammar" : snapshot.skillLabel === "Listening" ? "discrimination" : "reading",
    prompt: snapshot.prompt,
    options: snapshot.options,
    correctAnswer: snapshot.correctAnswer,
    explanation: snapshot.explanation,
  };
  return { exercise, answer: attempt.answer, anchor: `${card.id}:${card.revision}:${attempt.id}` };
}

export async function GET() {
  const identity = await owner();
  if (!identity.account) return response({ error: "AI_ACCOUNT_REQUIRED", charged: false }, identity, 401);
  if (identity.account?.status === "deleted") return response({ error: "ACCOUNT_DELETED" }, identity, 403);
  const env = (await getCloudflareContext({ async: true })).env;
  const capabilities = await resolveCapabilities(identity.id);
  const policy = productAiRuntimePolicy(env, capabilities);
  return response({ quota: await quotaView(identity.id, policy), capabilities, scope: identity.account ? "account" : "guest" }, identity);
}

export async function POST(req: NextRequest) {
  const identity = await owner();
  if (!identity.account) return response({ error: "AI_ACCOUNT_REQUIRED", charged: false }, identity, 401);
  if (identity.account?.status === "deleted") return response({ error: "ACCOUNT_DELETED" }, identity, 403);
  const env = (await getCloudflareContext({ async: true })).env;
  const capabilities = await resolveCapabilities(identity.id);
  const policy = productAiRuntimePolicy(env, capabilities);
  let body: Record<string, unknown>;
  try {
    body = await readBoundedJsonObject(req, 1024);
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_JSON";
    return response({ error: code === "PAYLOAD_TOO_LARGE" ? code : "INVALID_JSON" }, identity, code === "PAYLOAD_TOO_LARGE" ? 413 : 400);
  }
  const feature = body.feature as AiFeature;
  const idempotencyKey = safeKey(body.idempotencyKey);
  if ((feature !== "explanation" && feature !== "study_plan") || !idempotencyKey) return response({ error: "INVALID_AI_REQUEST" }, identity, 422);

  let prompt: string;
  let fallback: ReturnType<typeof nonAiExplanation> | ReturnType<typeof nonAiStudyPlan>;
  let anchor: string;
  if (feature === "explanation") {
    const exerciseId = safeId(body.exerciseId);
    const reviewCardId = safeId(body.reviewCardId);
    const learning = await loadState(identity.id);
    if (reviewCardId) {
      const trusted = trustedReviewExplanation(learning.state, reviewCardId);
      if ("error" in trusted) return response({ error: trusted.error, charged: false }, identity, trusted.error === "REVIEW_CARD_NOT_FOUND" ? 404 : 409);
      prompt = buildExplanationPrompt(trusted.exercise, trusted.answer);
      fallback = nonAiExplanation(trusted.exercise);
      anchor = trusted.anchor;
    } else {
      const exercise = exerciseId ? trustedStep7Exercise(exerciseId) : undefined;
      if (!exercise) return response({ error: "EXERCISE_NOT_FOUND" }, identity, 404);
      const attempt = [...learning.state.attempts].reverse().find((item) => item.contentId === exercise.contentId && item.contentVersion === exercise.contentVersion);
      if (!attempt) return response({ error: "EXPLANATION_REQUIRES_ATTEMPT", fallback: nonAiExplanation(exercise) }, identity, 409);
      prompt = buildExplanationPrompt(exercise, attempt.answer);
      fallback = nonAiExplanation(exercise);
      anchor = `${exercise.id}:${exercise.contentVersion}:${attempt.id}`;
    }
  } else {
    const plan = await latestPlan(identity.id);
    if (!plan) return response({ error: "STUDY_PLAN_REQUIRED", fallback: nonAiStudyPlan() }, identity, 409);
    prompt = buildStudyPlanPrompt(plan);
    fallback = nonAiStudyPlan();
    anchor = `${plan.id}:v${plan.version}`;
  }

  if (capabilities.tier !== "pro") {
    return response({ error: "PRO_AI_REQUIRED", charged: false, fallback, capabilities, upgradeHref: "/pricing", quota: await quotaView(identity.id, policy) }, identity, 403);
  }

  const requestHash = await hash(`${feature}:${anchor}`);
  let reserved: Awaited<ReturnType<typeof reserveOperation>>;
  try {
    reserved = await reserveOperation({ ownerId: identity.id, feature, idempotencyKey, requestHash, policy });
  } catch (error) {
    const code = error instanceof Error ? error.message : "AI_RESERVATION_FAILED";
    const status = code === "ACCOUNT_DELETED" ? 403 : code === "AI_QUOTA_EXHAUSTED" || code === "AI_RATE_LIMITED" ? 429 : code === "AI_IDEMPOTENCY_CONFLICT" || code === "AI_REQUEST_IN_PROGRESS" ? 409 : 503;
    const retryAt = code === "AI_RATE_LIMITED" ? new Date(Date.now() + 3_600_000).toISOString() : undefined;
    return response({ error: code, charged: false, fallback, quota: await quotaView(identity.id, policy), retryAt }, identity, status, retryAt ? { "retry-after": "3600" } : {});
  }
  const operation = reserved.operation;
  if (reserved.replayed) {
    if (operation.status === "succeeded") return response({ status: "succeeded", charged: true, replayed: true, output: operation.response, quota: await quotaView(identity.id, policy) }, identity);
    if (operation.status === "failed") return response({ status: "fallback", charged: false, replayed: true, failureCode: operation.failureCode, fallback, quota: await quotaView(identity.id, policy) }, identity);
    return response({ error: "AI_REQUEST_IN_PROGRESS", charged: false, fallback, quota: await quotaView(identity.id, policy) }, identity, 409);
  }

  try {
    const config = providerConfig(env);
    if (!config) throw new Error("AI_PROVIDER_UNAVAILABLE");
    const provider = await callAiProvider(config, prompt, policy.maxOutputTokens);
    const output = parseAiOutput(feature, provider.content);
    await finalizeSuccess({ operation, output, providerRequestId: provider.providerRequestId, promptTokens: provider.promptTokens, completionTokens: provider.completionTokens });
    return response({ status: "succeeded", charged: true, replayed: false, output, quota: await quotaView(identity.id, policy) }, identity, 201);
  } catch (error) {
    const rawCode = error instanceof Error ? error.message : "AI_PROVIDER_UNAVAILABLE";
    const failureCode = rawCode === "ACCOUNT_DELETED" ? rawCode : normalizedFailure(error);
    try { await finalizeFailure(operation, failureCode); } catch { /* stale reservation cleanup returns it automatically */ }
    if (rawCode === "ACCOUNT_DELETED") return response({ error: "ACCOUNT_DELETED", charged: false, fallback, quota: await quotaView(identity.id, policy) }, identity, 403);
    return response({ status: "fallback", charged: false, replayed: false, failureCode, fallback, quota: await quotaView(identity.id, policy) }, identity);
  }
}
