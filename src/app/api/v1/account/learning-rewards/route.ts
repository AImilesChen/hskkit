import { NextRequest, NextResponse } from "next/server";
import { accountOwnerId, requestIdentity } from "@/lib/account/identity";
import { learningRewardSnapshot, recordForegroundHeartbeat, redeemLearningPoints, startLearningEngagement } from "@/lib/engagement/storage";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

function publicRewardError(error: unknown) {
  if (!(error instanceof Error)) return "LEARNING_REWARDS_FAILED";
  switch (error.message) {
    case "INVALID_TIMEZONE":
    case "INVALID_HEARTBEAT_ID":
    case "INVALID_ENGAGEMENT_SESSION":
    case "INVALID_ACTIVE_SECONDS":
    case "INELIGIBLE_LEARNING_ROUTE":
    case "ENGAGEMENT_SESSION_EXPIRED":
    case "INVALID_IDEMPOTENCY_KEY":
    case "POINTS_MUST_BE_MULTIPLE_OF_10":
    case "INSUFFICIENT_LEARNING_POINTS":
      return error.message;
    default:
      return "LEARNING_REWARDS_FAILED";
  }
}

function verifiedPageRoute(request: NextRequest, claimedRoute: string) {
  try {
    const referrer = new URL(request.headers.get("referer") ?? "");
    return referrer.origin === request.nextUrl.origin && referrer.pathname === claimedRoute ? referrer.pathname : null;
  } catch {
    return null;
  }
}

function verifiedSameOrigin(request: NextRequest) {
  const claimed = request.headers.get("origin") || request.headers.get("referer");
  if (!claimed) return false;
  try {
    return new URL(claimed).origin === request.nextUrl.origin;
  } catch {
    return false;
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
    const code = publicRewardError(error);
    return NextResponse.json({ error: code }, { status: code === "INVALID_TIMEZONE" ? 422 : 500, headers: noStore });
  }
}

export async function POST(request: NextRequest) {
  const identity = await requestIdentity();
  if (!identity.account || identity.account.status !== "active") {
    return NextResponse.json({ error: "ACCOUNT_REQUIRED" }, { status: 401, headers: noStore });
  }
  let body: { action?: string; route?: string; heartbeatId?: string; sessionToken?: string; seconds?: number; idempotencyKey?: string; credits?: number };
  try {
    const text = await request.text();
    if (text.length > 512) return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413, headers: noStore });
    body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400, headers: noStore });
  }
  if (!verifiedSameOrigin(request)) {
    return NextResponse.json({ error: "INVALID_REQUEST_ORIGIN" }, { status: 403, headers: noStore });
  }
  const ownerId = accountOwnerId(identity.account.userId);
  const timezone = identity.account.timezone || "UTC";
  try {
    if (body.action === "redeem") {
      const result = await redeemLearningPoints(ownerId, timezone, {
        idempotencyKey: String(body.idempotencyKey ?? ""),
        credits: Number(body.credits),
      });
      return NextResponse.json(result, { headers: noStore });
    }
    const route = String(body.route ?? "");
    if (!verifiedPageRoute(request, route)) {
      return NextResponse.json({ error: "INVALID_LEARNING_REFERRER" }, { status: 403, headers: noStore });
    }
    const result = body.action === "start"
      ? await startLearningEngagement(ownerId, timezone, route)
      : body.action === "heartbeat"
        ? await recordForegroundHeartbeat(ownerId, timezone, {
            heartbeatId: String(body.heartbeatId ?? ""),
            sessionToken: String(body.sessionToken ?? ""),
            route,
            seconds: Number(body.seconds),
          })
        : null;
    if (!result) return NextResponse.json({ error: "INVALID_ACTION" }, { status: 422, headers: noStore });
    return NextResponse.json(result, { headers: noStore });
  } catch (error) {
    const code = publicRewardError(error);
    const status = code.startsWith("INVALID_") || code === "INELIGIBLE_LEARNING_ROUTE" || code === "POINTS_MUST_BE_MULTIPLE_OF_10"
      ? 422
      : code === "ENGAGEMENT_SESSION_EXPIRED" || code === "INSUFFICIENT_LEARNING_POINTS"
        ? 409
        : 500;
    return NextResponse.json({ error: code }, { status, headers: noStore });
  }
}
