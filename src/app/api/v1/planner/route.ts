import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { GUEST_COOKIE, requestIdentity } from "@/lib/account/identity";
import { loadState } from "@/lib/learning/storage";
import { buildPlannerDraft, plannerInputsFromJson, weakPointsFromLearning, type WeakPoint } from "@/lib/planner/domain";
import { findPlanByIdempotency, latestPlan, listPlans, persistPlan } from "@/lib/planner/storage";

async function owner() {
  const identity = await requestIdentity();
  if (identity.account) return { id: `user:${identity.account.userId}`, account: identity.account, fresh: false };
  const jar = await cookies();
  const current = jar.get(GUEST_COOKIE)?.value;
  return { id: current ?? crypto.randomUUID(), account: undefined, fresh: !current };
}
function response(payload: unknown, identity: Awaited<ReturnType<typeof owner>>, status = 200) {
  const res = NextResponse.json(payload, { status });
  if (identity.fresh) res.cookies.set(GUEST_COOKIE, identity.id, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 31_536_000, path: "/" });
  return res;
}
const text = (value: unknown, max: number) => typeof value === "string" && value.length > 0 && value.length <= max ? value : undefined;

export async function GET() {
  const identity = await owner();
  if (identity.account?.status === "deleted") return response({ error: "ACCOUNT_DELETED" }, identity, 403);
  const [plans, learning] = await Promise.all([listPlans(identity.id), loadState(identity.id)]);
  const weakPoints = weakPointsFromLearning(learning.state);
  const dueCards = learning.state.cards.filter((card: { dueAt: string }) => Date.parse(card.dueAt) <= Date.now()).length;
  return response({ latest: plans[0] ?? null, versions: plans, realSignals: { weakPoints, dueCards }, scope: identity.account ? "account" : "guest" }, identity);
}

export async function POST(req: NextRequest) {
  const identity = await owner();
  if (identity.account?.status === "deleted") return response({ error: "ACCOUNT_DELETED" }, identity, 403);
  let body: any;
  try {
    const raw = await req.text();
    if (raw.length > 4096) return response({ error: "PAYLOAD_TOO_LARGE" }, identity, 413);
    body = JSON.parse(raw);
  } catch { return response({ error: "INVALID_JSON" }, identity, 400); }
  const key = text(body?.idempotencyKey, 80);
  if (!key) return response({ error: "INVALID_IDEMPOTENCY_KEY" }, identity, 422);
  const replay = await findPlanByIdempotency(identity.id, key);
  if (replay) return response({ plan: replay, replayed: true }, identity);

  const action = body?.action;
  if (action !== "generate" && action !== "edit") return response({ error: "INVALID_ACTION" }, identity, 422);
  for (let turn = 0; turn < 3; turn += 1) {
    const [current, learning] = await Promise.all([latestPlan(identity.id), loadState(identity.id)]);
    if (action === "edit" && (!Number.isInteger(body.baseVersion) || body.baseVersion !== current?.version)) {
      return response({ error: "PLAN_REVISION_CONFLICT", latest: current ?? null }, identity, 409);
    }
    const inputs = plannerInputsFromJson(body);
    if (!inputs) return response({ error: "INVALID_PLANNER_INPUTS" }, identity, 422);
    const { goalLevel, weeklyMinutes, preferredDays, targetDate } = inputs;
    const weakPoints = weakPointsFromLearning(learning.state);
    const result = buildPlannerDraft({
      goalLevel, weeklyMinutes, preferredDays, targetDate,
      weakPoints: weakPoints as WeakPoint[], state: learning.state, now: new Date().toISOString(), ownerId: identity.id,
      version: (current?.version ?? 0) + 1,
    });
    if (!result.ok) return response({ error: result.code, minimumWeeklyMinutes: result.minimumWeeklyMinutes, suggestedTargetDate: result.suggestedTargetDate, warnings: result.warnings, realSignals: { weakPoints, dueCards: learning.state.cards.filter((card: { dueAt: string }) => Date.parse(card.dueAt) <= Date.now()).length } }, identity, 422);
    result.plan.parentVersion = current?.version;
    try {
      const saved = await persistPlan(result.plan, key, current?.version ?? 0);
      return response({ plan: saved, replayed: false, realSignals: { weakPoints, dueCards: result.plan.srsLoad.dueCards } }, identity, 201);
    } catch (error) {
      if (error instanceof Error && error.message === "REVISION_CONFLICT" && turn < 2) continue;
      return response({ error: error instanceof Error ? error.message : "PLAN_SAVE_FAILED" }, identity, error instanceof Error && error.message === "REVISION_CONFLICT" ? 409 : 422);
    }
  }
  return response({ error: "REVISION_CONFLICT" }, identity, 409);
}
