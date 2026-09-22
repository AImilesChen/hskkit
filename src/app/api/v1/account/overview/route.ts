import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { accountOwnerId, requestIdentity } from "@/lib/account/identity";
import { computeSessionStreak } from "@/lib/account/domain";
import { listSyncConflicts, listSyncDevices } from "@/lib/account/storage";
import { productAiRuntimePolicy } from "@/lib/ai/domain";
import { quotaSnapshot } from "@/lib/ai/storage";
import { trialAndReferralSnapshot, resolveCommercialAccess } from "@/lib/commercial/referral-storage";
import { subscriptionSummaryForOwner } from "@/lib/commercial/storage";
import { d1UnavailableResponse, isUserD1TemporaryError, UserD1UnavailableError, withUserD1TransientRetry } from "@/lib/d1/user-protection";
import { loadState } from "@/lib/learning/storage";
import { projectLearningHistory } from "@/lib/learning/projection";
import { plannerSignalsFromLearning } from "@/lib/planner/domain";
import { listPlans } from "@/lib/planner/storage";

type AccountOverviewResource = "streak" | "sync" | "subscription" | "ai" | "referrals" | "planner";
type ReadResult<T> = { ok: true; value: T } | { ok: false };
type ResourceEnvelope = { status: "ready"; data: unknown } | { status: "error"; error: "D1_TEMPORARILY_UNAVAILABLE" };

const ALL_RESOURCES: AccountOverviewResource[] = ["streak", "sync", "subscription", "ai", "referrals", "planner"];
const ready = (data: unknown): ResourceEnvelope => ({ status: "ready", data });
const unavailable = (): ResourceEnvelope => ({ status: "error", error: "D1_TEMPORARILY_UNAVAILABLE" });

const publicSubscriptionSummary = (value: Awaited<ReturnType<typeof subscriptionSummaryForOwner>>) => ({
  order: value.latestOrder ? { id: value.latestOrder.id, planId: value.latestOrder.plan_id, amountCents: value.latestOrder.amount_cents, currency: value.latestOrder.currency, status: value.latestOrder.status, createdAt: value.latestOrder.created_at } : null,
  subscription: value.subscription ? { planId: value.subscription.plan_id, status: value.subscription.status, cancelAtPeriodEnd: Boolean(value.subscription.cancel_at_period_end), currentPeriodStart: value.subscription.current_period_start, currentPeriodEnd: value.subscription.current_period_end } : null,
  entitlement: value.entitlement ? { planId: value.entitlement.plan_id, status: value.entitlement.status, startsAt: value.entitlement.starts_at, endsAt: value.entitlement.ends_at } : null,
  latestCharge: value.latestCharge ? { id: value.latestCharge.id, amountCents: value.latestCharge.amount_cents, amountRefundedCents: value.latestCharge.amount_refunded_cents, currency: value.latestCharge.currency, status: value.latestCharge.status, chargedAt: value.latestCharge.charged_at } : null,
});

async function protectedRead<T>(operation: () => Promise<T>): Promise<ReadResult<T>> {
  try {
    return { ok: true, value: await withUserD1TransientRetry(operation) };
  } catch (error) {
    if (error instanceof UserD1UnavailableError || isUserD1TemporaryError(error)) return { ok: false };
    throw error;
  }
}

function settledValue<T>(result: PromiseSettledResult<ReadResult<T>>): ReadResult<T> {
  if (result.status === "rejected") throw result.reason;
  return result.value;
}

function requestedResources(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("resources");
  if (!raw) return ALL_RESOURCES;
  const requested = [...new Set(raw.split(",").filter(Boolean))];
  if (!requested.length || requested.some((resource) => !ALL_RESOURCES.includes(resource as AccountOverviewResource))) return null;
  return requested as AccountOverviewResource[];
}

export async function GET(req: NextRequest) {
  let identity: Awaited<ReturnType<typeof requestIdentity>>;
  try {
    identity = await requestIdentity({ touchSession: true });
  } catch (error) {
    return d1UnavailableResponse(error);
  }
  if (!identity.account || identity.account.status !== "active") return NextResponse.json({ error: "ACCOUNT_REQUIRED" }, { status: 401 });

  const account = identity.account;
  const deviceId = String(req.nextUrl.searchParams.get("deviceId") ?? "");
  if (!deviceId || deviceId.length > 80) return NextResponse.json({ error: "INVALID_DEVICE_ID" }, { status: 422 });
  const selected = requestedResources(req);
  if (!selected) return NextResponse.json({ error: "INVALID_RESOURCES" }, { status: 422 });

  const wants = (resource: AccountOverviewResource) => selected.includes(resource);
  const needsLearning = wants("streak") || wants("sync") || wants("planner");
  const needsCommercial = wants("sync") || wants("subscription") || wants("ai") || wants("referrals");
  const userId = account.userId;
  const ownerId = accountOwnerId(userId);
  const env = (await getCloudflareContext({ async: true })).env;
  const livemode = env.COMMERCE_MODE === "live";
  const now = new Date();

  const baseReads = await Promise.allSettled([
    needsLearning ? protectedRead(() => loadState(ownerId)) : Promise.resolve<ReadResult<never>>({ ok: false }),
    needsCommercial ? protectedRead(() => resolveCommercialAccess(ownerId)) : Promise.resolve<ReadResult<never>>({ ok: false }),
    wants("sync") ? protectedRead(() => Promise.all([listSyncConflicts(userId), listSyncDevices(userId)])) : Promise.resolve<ReadResult<never>>({ ok: false }),
    wants("subscription") ? protectedRead(() => subscriptionSummaryForOwner(ownerId, livemode)) : Promise.resolve<ReadResult<never>>({ ok: false }),
    wants("planner") ? protectedRead(() => listPlans(ownerId, 20)) : Promise.resolve<ReadResult<never>>({ ok: false }),
  ]);

  const loaded = settledValue(baseReads[0]);
  const commercial = settledValue(baseReads[1]);
  const syncDetails = settledValue(baseReads[2]);
  const subscriptionRaw = settledValue(baseReads[3]);
  const plans = settledValue(baseReads[4]);

  const dependentReads = await Promise.allSettled([
    wants("ai") && commercial.ok
      ? protectedRead(() => quotaSnapshot(ownerId, productAiRuntimePolicy(env, commercial.value.capabilities, commercial.value.access.baseAiCredits)))
      : Promise.resolve<ReadResult<never>>({ ok: false }),
    wants("referrals") && commercial.ok
      ? protectedRead(() => trialAndReferralSnapshot(userId, now, commercial.value))
      : Promise.resolve<ReadResult<never>>({ ok: false }),
  ]);
  const quota = settledValue(dependentReads[0]);
  const referrals = settledValue(dependentReads[1]);

  const responseResources: Partial<Record<AccountOverviewResource, ResourceEnvelope>> = {};
  const capabilities = commercial.ok ? commercial.value.capabilities : null;

  if (wants("streak")) {
    responseResources.streak = loaded.ok
      ? ready(computeSessionStreak(loaded.value.state.dailySessions, account.timezone, now.toISOString()))
      : unavailable();
  }
  if (wants("sync")) {
    responseResources.sync = loaded.ok && commercial.ok && syncDetails.ok
      ? ready({ state: "synced", revision: loaded.value.revision, snapshot: projectLearningHistory(loaded.value.state, commercial.value.capabilities), conflicts: syncDetails.value[0], devices: syncDetails.value[1], capabilities: commercial.value.capabilities })
      : unavailable();
  }
  if (wants("subscription")) {
    responseResources.subscription = commercial.ok && subscriptionRaw.ok
      ? ready({ ...publicSubscriptionSummary(subscriptionRaw.value), access: commercial.value.access, capabilities: commercial.value.capabilities })
      : unavailable();
  }
  if (wants("ai")) {
    responseResources.ai = commercial.ok && quota.ok && capabilities
      ? ready({ quota: quota.value, capabilities, scope: "account" })
      : unavailable();
  }
  if (wants("referrals")) responseResources.referrals = referrals.ok ? ready(referrals.value) : unavailable();
  if (wants("planner")) {
    responseResources.planner = loaded.ok && plans.ok
      ? ready({ latest: plans.value[0] ?? null, versions: plans.value, nextCursor: plans.value.length === 20 ? plans.value.at(-1)?.version ?? null : null, realSignals: plannerSignalsFromLearning(loaded.value.state, now.toISOString()), scope: "account" })
      : unavailable();
  }

  return NextResponse.json({ resources: responseResources }, { headers: { "cache-control": "private, no-store" } });
}
