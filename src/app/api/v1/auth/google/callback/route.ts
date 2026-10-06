import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { OAUTH_RETURN_COOKIE, OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, SESSION_COOKIE } from "@/lib/account/identity";
import { safeReturnTo } from "@/lib/account/domain";
import { exchangeGoogleCode, googleOAuthConfig, loadGoogleProfile } from "@/lib/account/oauth";
import { createAccountSession, updateTimezone, upsertGoogleAccount, validTimezone } from "@/lib/account/storage";
import { activateWelcomeTrialAndReferral, sha256ReferralDevice } from "@/lib/commercial/referral-storage";
import { OAUTH_REFERRAL_COOKIE, REFERRAL_DEVICE_COOKIE } from "@/lib/commercial/referrals";

const OAUTH_TIMEZONE_COOKIE = "hskkit_oauth_timezone";

function failure(request: Request, code: string, returnTo: string) {
  const response = NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(code)}&returnTo=${encodeURIComponent(returnTo)}`, request.url));
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_VERIFIER_COOKIE);
  response.cookies.delete(OAUTH_RETURN_COOKIE);
  response.cookies.delete(OAUTH_REFERRAL_COOKIE);
  response.cookies.delete(OAUTH_TIMEZONE_COOKIE);
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jar = await cookies();
  const returnTo = safeReturnTo(jar.get(OAUTH_RETURN_COOKIE)?.value);
  if (url.searchParams.get("error")) return failure(request, "google_cancelled", returnTo);
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const expectedState = jar.get(OAUTH_STATE_COOKIE)?.value ?? "";
  const verifier = jar.get(OAUTH_VERIFIER_COOKIE)?.value ?? "";
  if (!code || !state || state !== expectedState || !verifier) return failure(request, "invalid_callback", returnTo);

  try {
    const config = googleOAuthConfig();
    const accessToken = await exchangeGoogleCode(code, verifier, config);
    const profile = await loadGoogleProfile(accessToken);
    const proposedTimezone = jar.get(OAUTH_TIMEZONE_COOKIE)?.value;
    const timezone = proposedTimezone && proposedTimezone.length <= 64 && validTimezone(proposedTimezone) ? proposedTimezone : undefined;
    const account = await upsertGoogleAccount(profile, timezone || "UTC");
    if (timezone && account.timezone !== timezone) await updateTimezone(account.userId, timezone);
    const referralDevice = jar.get(REFERRAL_DEVICE_COOKIE)?.value;
    await activateWelcomeTrialAndReferral({
      userId: account.userId,
      emailVerified: profile.emailVerified,
      referralCode: jar.get(OAUTH_REFERRAL_COOKIE)?.value,
      deviceHash: referralDevice ? await sha256ReferralDevice(referralDevice) : undefined,
    });
    const session = await createAccountSession(account.userId);
    const response = NextResponse.redirect(new URL(returnTo, request.url));
    response.cookies.set(SESSION_COOKIE, session.sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(session.expiresAt),
    });
    response.cookies.delete(OAUTH_STATE_COOKIE);
    response.cookies.delete(OAUTH_VERIFIER_COOKIE);
    response.cookies.delete(OAUTH_RETURN_COOKIE);
    response.cookies.delete(OAUTH_REFERRAL_COOKIE);
    response.cookies.delete(OAUTH_TIMEZONE_COOKIE);
    return response;
  } catch (reason) {
    const code = reason instanceof Error && reason.message === "ACCOUNT_DELETED" ? "account_deleted" : "google_failed";
    return failure(request, code, returnTo);
  }
}
