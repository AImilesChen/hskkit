import { NextRequest, NextResponse } from "next/server";
import { ACCOUNT_COOKIE, SESSION_COOKIE, requestIdentity } from "../../../../lib/account/identity";
import { authenticateAccount, createAccount, revokeAccountSession, revokeSyncKeys, rotateSyncKey, updateTimezone } from "../../../../lib/account/storage";
import { loadState } from "../../../../lib/learning/storage";
import { countPlans } from "../../../../lib/planner/storage";
import { d1UnavailableResponse, withUserD1ReadProtection } from "@/lib/d1/user-protection";

const cookie = (response: NextResponse, value: string, maxAge = 31_536_000) => {
  response.cookies.set(ACCOUNT_COOKIE, value, { httpOnly: true, sameSite: "strict", secure: true, maxAge, path: "/" });
  response.headers.set("cache-control", "private, no-store");
  return response;
};
const safeBody = async (req: NextRequest) => {
  const text = await req.text();
  if (text.length > 2048) throw new Error("PAYLOAD_TOO_LARGE");
  return JSON.parse(text);
};
const statusFor = (code: string) => code === "ACCOUNT_REQUIRED" ? 401 : code.startsWith("INVALID") ? 422 : 400;

async function getAccount() {
  const identity = await requestIdentity({ touchSession: true });
  const [guest, guestPlanCount] = identity.guestId ? await Promise.all([loadState(identity.guestId), countPlans(identity.guestId)]) : [undefined, 0];
  return NextResponse.json({
    account: identity.account ?? null,
    connection: identity.connection ?? null,
    guest: guest ? {
      hasData: guest.state.attempts.length > 0
        || guest.state.dailySessions.length > 0
        || (guest.state.placementSessions?.length ?? 0) > 0
        || (guest.state.practiceSessions?.length ?? 0) > 0
        || (guest.state.savedWordIds?.length ?? 0) > 0
        || (guest.state.recentDictionarySearches?.length ?? 0) > 0
        || guestPlanCount > 0,
      attempts: guest.state.attempts.length,
      learningSessions: (guest.state.placementSessions?.length ?? 0) + (guest.state.practiceSessions?.length ?? 0),
      plannerVersions: guestPlanCount,
      revision: guest.revision,
    } : { hasData: false, attempts: 0, learningSessions: 0, plannerVersions: 0, revision: 0 },
  });
}

export async function GET() {
  try { return await withUserD1ReadProtection(getAccount); }
  catch (error) { const unavailable = d1UnavailableResponse(error); if (unavailable) return unavailable; throw error; }
}

export async function POST(req: NextRequest) {
  try {
    const body = await safeBody(req);
    if (body.action === "create") {
      const created = await createAccount(String(body.displayName ?? ""), String(body.timezone ?? "UTC"));
      return cookie(NextResponse.json({ account: created.account, syncKey: created.syncKey }, { status: 201 }), created.syncKey);
    }
    if (body.action === "connect") {
      const syncKey = String(body.syncKey ?? "").trim();
      const account = await authenticateAccount(syncKey);
      if (!account) return NextResponse.json({ error: "INVALID_SYNC_KEY" }, { status: 401 });
      return cookie(NextResponse.json({ account }), syncKey);
    }
    if (body.action === "logout") {
      const identity = await requestIdentity();
      await revokeAccountSession(identity.sessionToken);
      const response = NextResponse.json({ state: "logged_out" });
      response.cookies.delete(SESSION_COOKIE);
      response.cookies.delete(ACCOUNT_COOKIE);
      response.headers.set("cache-control", "private, no-store");
      return response;
    }
    if (body.action === "rotate_sync_key") {
      const identity = await requestIdentity();
      if (!identity.account) throw new Error("ACCOUNT_REQUIRED");
      const rotated = await rotateSyncKey(identity.account.userId);
      return cookie(NextResponse.json({ state: "rotated", syncKey: rotated.syncKey }), rotated.syncKey);
    }
    if (body.action === "revoke_sync_keys") {
      const identity = await requestIdentity();
      if (!identity.account) throw new Error("ACCOUNT_REQUIRED");
      const result = await revokeSyncKeys(identity.account.userId);
      const response = NextResponse.json(result);
      response.cookies.delete(ACCOUNT_COOKIE);
      response.headers.set("cache-control", "private, no-store");
      return response;
    }
    if (body.action === "timezone") {
      const identity = await requestIdentity();
      if (!identity.account || identity.account.status !== "active") throw new Error("ACCOUNT_REQUIRED");
      const account = await updateTimezone(identity.account.userId, String(body.timezone ?? ""));
      return NextResponse.json({ account });
    }
    return NextResponse.json({ error: "INVALID_ACTION" }, { status: 422 });
  } catch (error) {
    const unavailable = d1UnavailableResponse(error);
    if (unavailable) return unavailable;
    const code = error instanceof Error ? error.message : "ACCOUNT_FAILED";
    return NextResponse.json({ error: code }, { status: statusFor(code) });
  }
}
