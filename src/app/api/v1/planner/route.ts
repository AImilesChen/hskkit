import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { GUEST_COOKIE, requestIdentity } from "@/lib/account/identity";
import { accessDecision, createAuditEvent, errorContract } from "@/lib/account/access-policy";
import { recordPolicyAudit } from "@/lib/account/audit-storage";
import { loadState } from "@/lib/learning/storage";
import { buildPlannerDraft, plannerInputsFromJson, plannerSignalsFromLearning, type WeakPoint } from "@/lib/planner/domain";
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
const errorResponse = (code: string, identity: Awaited<ReturnType<typeof owner>>, status: number, extra: Record<string, unknown> = {}) => response({ ...errorContract(code), ...extra }, identity, status);
async function requirePlannerAccess(identity: Awaited<ReturnType<typeof owner>>, permission: "planner:read" | "planner:write") {
  const decision = accessDecision({ accountStatus: identity.account?.status ?? "guest", permission });
  if (!decision.allowed) await recordPolicyAudit(createAuditEvent({ subjectId: identity.id, action: permission, resourceType: "planner", resourceId: identity.id, result: "denied", idempotencyKey: `${permission}:${crypto.randomUUID()}` }));
  return decision;
}

export async function GET() {
  const identity = await owner();
  const access = await requirePlannerAccess(identity, "planner:read");
  if (!access.allowed) return errorResponse(access.code, identity, 403);
  const [plans, learning] = await Promise.all([listPlans(identity.id), loadState(identity.id)]);
  const realSignals = plannerSignalsFromLearning(learning.state, new Date().toISOString());
  return response({ latest: plans[0] ?? null, versions: plans, realSignals, scope: identity.account ? "account" : "guest" }, identity);
}

export async function POST(req: NextRequest) {
  const identity = await owner();
  const access = await requirePlannerAccess(identity, "planner:write");
  if (!access.allowed) return errorResponse(access.code, identity, 403);
  let body: any;
  try {
    const raw = await req.text();
    if (raw.length > 4096) return errorResponse("PAYLOAD_TOO_LARGE", identity, 413);
    body = JSON.parse(raw);
  } catch { return errorResponse("INVALID_JSON", identity, 400); }
  const key = text(body?.idempotencyKey, 80);
  if (!key) return errorResponse("INVALID_IDEMPOTENCY_KEY", identity, 422);
  const replay = await findPlanByIdempotency(identity.id, key);
  if (replay) return response({ plan: replay, replayed: true }, identity);

  const action = body?.action;
  if (action !== "generate" && action !== "edit") return errorResponse("INVALID_ACTION", identity, 422);
  for (let turn = 0; turn < 3; turn += 1) {
    const [current, learning] = await Promise.all([latestPlan(identity.id), loadState(identity.id)]);
    if (action === "edit" && (!Number.isInteger(body.baseVersion) || body.baseVersion !== current?.version)) {
      await recordPolicyAudit(createAuditEvent({ subjectId: identity.id, action, resourceType: "planner", resourceId: current?.id ?? identity.id, result: "conflict", idempotencyKey: key, metadata: { expectedVersion: body.baseVersion, currentVersion: current?.version ?? 0 } }));
      return errorResponse("PLAN_REVISION_CONFLICT", identity, 409, { latest: current ?? null });
    }
    const inputs = plannerInputsFromJson(body);
    if (!inputs) return errorResponse("INVALID_PLANNER_INPUTS", identity, 422);
    const { goalLevel, weeklyMinutes, preferredDays, targetDate } = inputs;
    const signals = plannerSignalsFromLearning(learning.state, new Date().toISOString());
    const weakPoints = signals.weakPoints;
    const result = buildPlannerDraft({
      goalLevel, weeklyMinutes, preferredDays, targetDate,
      weakPoints: weakPoints as WeakPoint[], state: learning.state, now: new Date().toISOString(), ownerId: identity.id,
      version: (current?.version ?? 0) + 1,
      placementLevel: signals.placementLevel,
    });
    if (!result.ok) return errorResponse(result.code, identity, 422, { minimumWeeklyMinutes: result.minimumWeeklyMinutes, suggestedTargetDate: result.suggestedTargetDate, warnings: result.warnings, realSignals: { weakPoints, dueCards: learning.state.cards.filter((card: { dueAt: string }) => Date.parse(card.dueAt) <= Date.now()).length } });
    result.plan.parentVersion = current?.version;
    try {
      const saved = await persistPlan(result.plan, key, current?.version ?? 0, createAuditEvent({ subjectId: identity.id, action, resourceType: "planner", resourceId: result.plan.id, result: "success", idempotencyKey: key, metadata: { version: result.plan.version } }));
      return response({ plan: saved, replayed: false, realSignals: { weakPoints, dueCards: result.plan.srsLoad.dueCards } }, identity, 201);
    } catch (error) {
      if (error instanceof Error && error.message === "REVISION_CONFLICT" && turn < 2) continue;
      const code = error instanceof Error ? error.message : "PLAN_SAVE_FAILED";
      if (code === "REVISION_CONFLICT") await recordPolicyAudit(createAuditEvent({ subjectId: identity.id, action, resourceType: "planner", resourceId: identity.id, result: "conflict", idempotencyKey: key }));
      return errorResponse(code, identity, code === "REVISION_CONFLICT" ? 409 : 422);
    }
  }
  return errorResponse("REVISION_CONFLICT", identity, 409);
}
