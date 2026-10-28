import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCOUNT_COOKIE, SESSION_COOKIE, requestIdentity } from "@/lib/account/identity";
import { d1UnavailableResponse } from "@/lib/d1/user-protection";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const jar = await cookies();
    if (!jar.has(SESSION_COOKIE) && !jar.has(ACCOUNT_COOKIE)) {
      return NextResponse.json({ account: null }, { headers: { "cache-control": "private, no-store" } });
    }
    const identity = await requestIdentity({ touchSession: false });
    return NextResponse.json({
      account: identity.account ? { userId: identity.account.userId } : null,
    }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    const unavailable = d1UnavailableResponse(error);
    if (unavailable) return unavailable;
    throw error;
  }
}
