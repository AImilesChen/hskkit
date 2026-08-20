import { NextRequest, NextResponse } from "next/server";
import { ACCOUNT_COOKIE, requestIdentity } from "../../../../lib/account/identity";
import { authenticateAccount, createAccount, updateTimezone } from "../../../../lib/account/storage";
import { loadState } from "../../../../lib/learning/storage";
import { listAllPlans } from "../../../../lib/planner/storage";

const cookie = (response: NextResponse, value: string, maxAge = 31_536_000) => {
  response.cookies.set(ACCOUNT_COOKIE, value, { httpOnly: true, sameSite: "strict", secure: true, maxAge, path: "/" });
  return response;
};
const safeBody = async (req: NextRequest) => {
  const text = await req.text();
  if (text.length > 2048) throw new Error("PAYLOAD_TOO_LARGE");
  return JSON.parse(text);
};
const statusFor = (code: string) => code === "ACCOUNT_REQUIRED" ? 401 : code.startsWith("INVALID") ? 422 : 400;

export async function GET() {
  const identity = await requestIdentity();
  const [guest, guestPlans] = identity.guestId ? await Promise.all([loadState(identity.guestId), listAllPlans(identity.guestId)]) : [undefined, []];
  return NextResponse.json({
    account: identity.account ?? null,
    guest: guest ? { hasData: guest.state.attempts.length > 0 || guest.state.dailySessions.length > 0 || guestPlans.length > 0, attempts: guest.state.attempts.length, plannerVersions: guestPlans.length, revision: guest.revision } : { hasData: false, attempts: 0, plannerVersions: 0, revision: 0 },
  });
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
      return cookie(NextResponse.json({ state: "logged_out" }), "", 0);
    }
    if (body.action === "timezone") {
      const identity = await requestIdentity();
      if (!identity.account || identity.account.status !== "active") throw new Error("ACCOUNT_REQUIRED");
      const account = await updateTimezone(identity.account.userId, String(body.timezone ?? ""));
      return NextResponse.json({ account });
    }
    return NextResponse.json({ error: "INVALID_ACTION" }, { status: 422 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ACCOUNT_FAILED";
    return NextResponse.json({ error: code }, { status: statusFor(code) });
  }
}
