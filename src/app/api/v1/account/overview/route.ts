import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { accountOwnerId, requestIdentity } from "@/lib/account/identity";
import { computeSessionStreak } from "@/lib/account/domain";
import { listSyncConflicts, listSyncDevices } from "@/lib/account/storage";
import { productAiRuntimePolicy } from "@/lib/ai/domain";
import { quotaSnapshot } from "@/lib/ai/storage";
import { trialAndReferralSnapshot, resolveCommercialAccess } from "@/lib/commercial/referral-storage";
import { subscriptionSummaryForOwner } from "@/lib/commercial/storage";
import { d1UnavailableResponse, withUserD1ReadProtection } from "@/lib/d1/user-protection";
import { loadState } from "@/lib/learning/storage";
import { projectLearningHistory } from "@/lib/learning/projection";
import { plannerSignalsFromLearning } from "@/lib/planner/domain";
import { listPlans } from "@/lib/planner/storage";

const publicSubscriptionSummary = (value: Awaited<ReturnType<typeof subscriptionSummaryForOwner>>) => ({
  order: value.latestOrder ? { id: value.latestOrder.id, planId: value.latestOrder.plan_id, amountCents: value.latestOrder.amount_cents, currency: value.latestOrder.currency, status: value.latestOrder.status, createdAt: value.latestOrder.created_at } : null,
  subscription: value.subscription ? { planId: value.subscription.plan_id, status: value.subscription.status, cancelAtPeriodEnd: Boolean(value.subscription.cancel_at_period_end), currentPeriodStart: value.subscription.current_period_start, currentPeriodEnd: value.subscription.current_period_end } : null,
  entitlement: value.entitlement ? { planId: value.entitlement.plan_id, status: value.entitlement.status, startsAt: value.entitlement.starts_at, endsAt: value.entitlement.ends_at } : null,
  latestCharge: value.latestCharge ? { id: value.latestCharge.id, amountCents: value.latestCharge.amount_cents, amountRefundedCents: value.latestCharge.amount_refunded_cents, currency: value.latestCharge.currency, status: value.latestCharge.status, chargedAt: value.latestCharge.charged_at } : null,
});

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
  const userId = account.userId;
  const ownerId = accountOwnerId(userId);
  try {
    return await withUserD1ReadProtection(async () => {
      const env = (await getCloudflareContext({ async: true })).env;
      const livemode = env.COMMERCE_MODE === "live";
      const [loaded, commercial] = await Promise.all([loadState(ownerId), resolveCommercialAccess(ownerId)]);
      const [conflicts, devices] = await Promise.all([listSyncConflicts(userId), listSyncDevices(userId)]);
      const [subscriptionRaw, referrals] = await Promise.all([
        subscriptionSummaryForOwner(ownerId, livemode),
        trialAndReferralSnapshot(userId, new Date(), commercial),
      ]);
      const plans = await listPlans(ownerId, 20);
      const capabilities = commercial.capabilities;
      const quota = await quotaSnapshot(ownerId, productAiRuntimePolicy(env, capabilities, commercial.access.baseAiCredits));
      const subscription = { ...publicSubscriptionSummary(subscriptionRaw), access: commercial.access, capabilities };
      const streak = computeSessionStreak(loaded.state.dailySessions, account.timezone, new Date().toISOString());
      const sync = { state: "synced", revision: loaded.revision, snapshot: projectLearningHistory(loaded.state, capabilities), conflicts, devices, capabilities };
      const planner = { latest: plans[0] ?? null, versions: plans, nextCursor: plans.length === 20 ? plans.at(-1)?.version ?? null : null, realSignals: plannerSignalsFromLearning(loaded.state, new Date().toISOString()), scope: "account" };
      return NextResponse.json({ streak, sync, subscription, ai: { quota, capabilities, scope: "account" }, referrals, planner }, { headers: { "cache-control": "private, no-store" } });
    });
  } catch (error) {
    const unavailable = d1UnavailableResponse(error);
    if (unavailable) return unavailable;
    throw error;
  }
}
