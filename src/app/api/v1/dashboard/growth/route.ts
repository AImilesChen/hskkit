import { NextResponse } from "next/server";
import { accountOwnerId, requestIdentity } from "@/lib/account/identity";
import { getHsk3LevelStatuses } from "@/lib/content/level-status";
import { buildGrowthSnapshot } from "@/lib/learning/growth";
import { learningActivitySince, loadState } from "@/lib/learning/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await requestIdentity();
  if (!identity.account) {
    return NextResponse.json({ error: "ACCOUNT_REQUIRED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const now = new Date();
  const ownerId = accountOwnerId(identity.account.userId);
  const since = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString();
  const [{ state }, activity] = await Promise.all([
    loadState(ownerId),
    learningActivitySince(ownerId, since),
  ]);
  const statuses = getHsk3LevelStatuses();
  const levelTotals = [
    ...statuses.filter((status) => status.level >= 1 && status.level <= 6).map((status) => ({
      level: status.level,
      label: `HSK ${status.level}`,
      total: status.wordCount,
    })),
    {
      level: 7,
      label: "HSK 7–9",
      total: statuses.find((status) => status.level === 7)?.wordCount ?? 0,
    },
  ];
  const growth = buildGrowthSnapshot({
    now,
    timezone: identity.account.timezone || "UTC",
    activity,
    attempts: state.attempts,
    levelTotals,
  });

  return NextResponse.json(growth, { headers: { "Cache-Control": "no-store" } });
}
