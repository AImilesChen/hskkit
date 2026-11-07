import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { OAUTH_RETURN_COOKIE, OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, OAUTH_SWITCH_COOKIE, SESSION_COOKIE, requestIdentity } from "@/lib/account/identity";
import { signInReturnTo as safeReturnTo, canReuseGoogleSession } from "@/lib/account/sign-in";
import { googleAuthorizationUrl, googleOAuthConfig, pkceChallenge, randomOAuthValue } from "@/lib/account/oauth";
import { OAUTH_REFERRAL_COOKIE, REFERRAL_DEVICE_COOKIE, safeReferralCode } from "@/lib/commercial/referrals";

function privateRedirect(url: URL) {
  const response = NextResponse.redirect(url);
  response.headers.set("cache-control", "no-store");
  return response;
}

const OAUTH_TIMEZONE_COOKIE = "hskkit_oauth_timezone";

function browserTimezone(value: string | null) {
  if (!value || value.length > 64) return null;
  try { new Intl.DateTimeFormat("en", { timeZone: value }).format(new Date()); return value; }
  catch { return null; }
}

export async function GET(request: Request) {
  const returnTo = safeReturnTo(new URL(request.url).searchParams.get("returnTo"));
  const selectAccount = new URL(request.url).searchParams.get("selectAccount") === "1";
  const referralCode = safeReferralCode(new URL(request.url).searchParams.get("ref"));
  const timezone = browserTimezone(new URL(request.url).searchParams.get("timezone"));
  try {
    const jar = await cookies();
    if (!selectAccount && jar.get(SESSION_COOKIE)?.value) {
      const identity = await requestIdentity().catch(() => undefined);
      if (canReuseGoogleSession(identity, selectAccount)) return privateRedirect(new URL(returnTo, request.url));
    }
    const config = googleOAuthConfig();
    const state = randomOAuthValue();
    const verifier = randomOAuthValue(48);
    const codeChallenge = await pkceChallenge(verifier);
    const response = privateRedirect(googleAuthorizationUrl(config, state, codeChallenge, selectAccount));
    const cookie = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 10 * 60 };
    response.cookies.set(OAUTH_STATE_COOKIE, state, cookie);
    response.cookies.set(OAUTH_VERIFIER_COOKIE, verifier, cookie);
    response.cookies.set(OAUTH_RETURN_COOKIE, returnTo, cookie);
    if (selectAccount) response.cookies.set(OAUTH_SWITCH_COOKIE, "1", cookie);
    else response.cookies.delete(OAUTH_SWITCH_COOKIE);
    if (timezone) response.cookies.set(OAUTH_TIMEZONE_COOKIE, timezone, cookie);
    if (referralCode) response.cookies.set(OAUTH_REFERRAL_COOKIE, referralCode, cookie);
    const existingDevice = request.headers.get("cookie")?.match(/(?:^|;\s*)hskkit_ref_device=([^;]+)/)?.[1];
    response.cookies.set(REFERRAL_DEVICE_COOKIE, existingDevice ?? crypto.randomUUID(), { ...cookie, maxAge: 30 * 24 * 60 * 60 });
    return response;
  } catch {
    return privateRedirect(new URL(`/login?error=oauth_not_configured&returnTo=${encodeURIComponent(returnTo)}${selectAccount ? '&selectAccount=1' : ''}${referralCode ? `&ref=${encodeURIComponent(referralCode)}` : ''}`, request.url));
  }
}
