import { NextResponse } from "next/server";
import { accountOwnerId, requestIdentity } from "@/lib/account/identity";
import { learningRewardSnapshot } from "@/lib/engagement/storage";
import { buildGrowthSnapshot } from "@/lib/learning/growth";
import { learningActivitySince, loadState } from "@/lib/learning/storage";
import { releaseVocabularyTotals } from "@/lib/learning/vocabulary-progress";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  const identity = await requestIdentity();
  if (!identity.account || identity.account.status !== "active") {
    return NextResponse.json({ error: "ACCOUNT_REQUIRED" }, { status: 401, headers: noStore });
  }
  try {
    const ownerId = accountOwnerId(identity.account.userId);
    const timezone = identity.account.timezone || "UTC";
    const now = new Date();
    const since = new Date(now.getTime() - 120 * 86_400_000).toISOString();
    const [{ state }, activity, levelTotals, rewards] = await Promise.all([
      loadState(ownerId),
      learningActivitySince(ownerId, since),
      releaseVocabularyTotals(),
      learningRewardSnapshot(ownerId, timezone, now),
    ]);
    return NextResponse.json(buildGrowthSnapshot({
      now,
      timezone,
      activity,
      attempts: state.attempts,
      engagementDays: rewards.activityDays,
      levelTotals,
    }), { headers: noStore });
  } catch {
    return NextResponse.json({ error: "DASHBOARD_GROWTH_FAILED" }, { status: 500, headers: noStore });
  }
}
