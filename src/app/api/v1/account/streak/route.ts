import { NextResponse } from "next/server";
import { accountOwnerId, requestIdentity } from "../../../../../lib/account/identity";
import { computeSessionStreak } from "../../../../../lib/account/domain";
import { loadState } from "../../../../../lib/learning/storage";

export async function GET() {
  const identity = await requestIdentity();
  if (!identity.account || identity.account.status !== "active") return NextResponse.json({ error: "ACCOUNT_REQUIRED" }, { status: 401 });
  try {
    const loaded = await loadState(accountOwnerId(identity.account.userId));
    return NextResponse.json(computeSessionStreak(loaded.state.dailySessions, identity.account.timezone, new Date().toISOString()));
  } catch (error) {
    const code = error instanceof Error ? error.message : "STREAK_FAILED";
    return NextResponse.json({ error: code }, { status: code === "INVALID_TIMEZONE" ? 422 : 500 });
  }
}
