import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { adminReferralAction, adminReferralSummary } from "@/lib/commercial/referral-storage";

function authorized(req: NextRequest) {
  const expected = getCloudflareContext().env.ADMIN_REFUND_TOKEN;
  const supplied = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(expected && supplied && supplied === expected);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "ADMIN_AUTH_REQUIRED" }, { status: 401 });
  return NextResponse.json(await adminReferralSummary(), { headers: { "cache-control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "ADMIN_AUTH_REQUIRED" }, { status: 401 });
  try {
    const body = await req.json() as { action?: string; id?: string; reason?: string };
    if (body.action !== "block_referral" && body.action !== "revoke_reward") return NextResponse.json({ error: "INVALID_ADMIN_ACTION" }, { status: 422 });
    if (!body.id || !body.reason) return NextResponse.json({ error: "ID_AND_REASON_REQUIRED" }, { status: 422 });
    return NextResponse.json(await adminReferralAction(body.action, body.id, body.reason));
  } catch (error) {
    const code = error instanceof Error ? error.message : "REFERRAL_ADMIN_FAILED";
    return NextResponse.json({ error: code }, { status: code === "REWARD_NOT_FOUND" ? 404 : 500 });
  }
}
