import { NextResponse } from "next/server";
import { OAUTH_RETURN_COOKIE, OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE } from "@/lib/account/identity";
import { safeReturnTo } from "@/lib/account/domain";
import { googleAuthorizationUrl, googleOAuthConfig, pkceChallenge, randomOAuthValue } from "@/lib/account/oauth";

export async function GET(request: Request) {
  const returnTo = safeReturnTo(new URL(request.url).searchParams.get("returnTo"));
  try {
    const config = googleOAuthConfig();
    const state = randomOAuthValue();
    const verifier = randomOAuthValue(48);
    const codeChallenge = await pkceChallenge(verifier);
    const response = NextResponse.redirect(googleAuthorizationUrl(config, state, codeChallenge));
    const cookie = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 10 * 60 };
    response.cookies.set(OAUTH_STATE_COOKIE, state, cookie);
    response.cookies.set(OAUTH_VERIFIER_COOKIE, verifier, cookie);
    response.cookies.set(OAUTH_RETURN_COOKIE, returnTo, cookie);
    return response;
  } catch {
    return NextResponse.redirect(new URL(`/login?error=oauth_not_configured&returnTo=${encodeURIComponent(returnTo)}`, request.url));
  }
}
