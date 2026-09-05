import { NextRequest, NextResponse } from "next/server";
import { accountOwnerId, requestIdentity } from "@/lib/account/identity";
import { learningRewardSnapshot, recordForegroundHeartbeat, startLearningEngagement } from "@/lib/engagement/storage";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

function verifiedPageRoute(request: NextRequest, claimedRoute: string) {
  try {
    const referrer = new URL(request.headers.get("referer") ?? "");
    return referrer.origin === request.nextUrl.origin && referrer.pathname === claimedRoute ? referrer.pathname : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const identity = await requestIdentity();
  if (!identity.account || identity.account.status !== "active") {
    return NextResponse.json({ error: "ACCOUNT_REQUIRED" }, { status: 401, headers: noStore });
  }
  try {
    const snapshot = await learningRewardSnapshot(accountOwnerId(identity.account.userId), identity.account.timezone || "UTC");
    return NextResponse.json(snapshot, { headers: noStore });
  } catch (error) {
    const code = error instanceof Error ? error.message : "LEARNING_REWARDS_FAILED";
    return NextResponse.json({ error: code }, { status: code === "INVALID_TIMEZONE" ? 422 : 500, headers: noStore });
  }
}

export async function POST(request: NextRequest) {
  const identity = await requestIdentity();
  if (!identity.account || identity.account.status !== "active") {
    return NextResponse.json({ error: "ACCOUNT_REQUIRED" }, { status: 401, headers: noStore });
  }
  let body: { action?: string; route?: string; heartbeatId?: string; sessionToken?: string; seconds?: number };
  try {
    const text = await request.text();
    if (text.length > 512) return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413, headers: noStore });
    body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400, headers: noStore });
  }
  const route = String(body.route ?? "");
  if (!verifiedPageRoute(request, route)) {
    return NextResponse.json({ error: "INVALID_LEARNING_REFERRER" }, { status: 403, headers: noStore });
  }
  const ownerId = accountOwnerId(identity.account.userId);
  const timezone = identity.account.timezone || "UTC";
  try {
    const result = body.action === "start"
      ? await startLearningEngagement(ownerId, timezone, route)
      : await recordForegroundHeartbeat(ownerId, timezone, {
          heartbeatId: String(body.heartbeatId ?? ""),
          sessionToken: String(body.sessionToken ?? ""),
          route,
          seconds: Number(body.seconds),
        });
    return NextResponse.json(result, { headers: noStore });
  } catch (error) {
    const code = error instanceof Error ? error.message : "LEARNING_REWARDS_FAILED";
    const status = code.startsWith("INVALID_") || code === "INELIGIBLE_LEARNING_ROUTE" ? 422 : code === "ENGAGEMENT_SESSION_EXPIRED" ? 409 : 500;
    return NextResponse.json({ error: code }, { status, headers: noStore });
  }
}
