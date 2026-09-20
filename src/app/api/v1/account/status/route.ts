import { NextResponse } from "next/server";
import { requestIdentity } from "@/lib/account/identity";
import { d1UnavailableResponse, withUserD1ReadProtection } from "@/lib/d1/user-protection";

export const dynamic = "force-dynamic";

async function getAccountStatus() {
  const identity = await requestIdentity({ touchSession: true });
  return NextResponse.json(
    { signedIn: Boolean(identity.account) },
    { headers: { "cache-control": "private, no-store" } },
  );
}

export async function GET() {
  try {
    return await withUserD1ReadProtection(getAccountStatus);
  } catch (error) {
    const unavailable = d1UnavailableResponse(error);
    if (unavailable) return unavailable;
    throw error;
  }
}
