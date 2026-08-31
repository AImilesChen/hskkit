import { NextResponse } from "next/server";
import { requestIdentity } from "@/lib/account/identity";
import { trialAndReferralSummary } from "@/lib/commercial/referral-storage";

export async function GET() {
  const identity = await requestIdentity();
  if (!identity.account || identity.account.status !== "active") return NextResponse.json({ error: "ACCOUNT_REQUIRED" }, { status: 401 });
  const summary = await trialAndReferralSummary(identity.account.userId);
  return NextResponse.json(summary, { headers: { "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow" } });
}
