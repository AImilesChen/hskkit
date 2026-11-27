import { NextResponse } from "next/server";
import { adminError, requireAdmin, requireAdminSameOrigin } from "@/lib/admin/access";
import { pkceChallenge, randomOAuthValue } from "@/lib/account/oauth-parameters";
import { REPORTING_COOKIE, REPORTING_STATE_PREFIX, reportingAuthorizationUrl, sealReportingSecret } from "@/lib/admin/analytics-connection";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const { env, userId } = await requireAdmin();
    requireAdminSameOrigin(request);
    const state = REPORTING_STATE_PREFIX + randomOAuthValue();
    const verifier = randomOAuthValue(48);
    const url = reportingAuthorizationUrl(env, state, await pkceChallenge(verifier));
    const sealed = await sealReportingSecret(JSON.stringify({ state, verifier, userId, issuedAt: Date.now() }), env.GOOGLE_CLIENT_SECRET!, "oauth-state");
    const response = NextResponse.redirect(url, 303);
    response.headers.set("cache-control", "private, no-store");
    response.headers.set("referrer-policy", "no-referrer");
    response.cookies.set(REPORTING_COOKIE, sealed, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
    return response;
  } catch (error) { return adminError(error); }
}
