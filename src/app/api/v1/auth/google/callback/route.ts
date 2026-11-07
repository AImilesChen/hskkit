import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { OAUTH_RETURN_COOKIE, OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, OAUTH_SWITCH_COOKIE, GUEST_COOKIE, SESSION_COOKIE } from "@/lib/account/identity";
import { signInReturnTo as safeReturnTo, googleReturnDestination, encodeSignInReturnTo } from "@/lib/account/sign-in";
import { exchangeGoogleCode, googleOAuthConfig, loadGoogleProfile } from "@/lib/account/oauth";
import { createAccountSession, updateTimezone, upsertGoogleAccount, validTimezone } from "@/lib/account/storage";
import { activateWelcomeTrialAndReferral, sha256ReferralDevice } from "@/lib/commercial/referral-storage";
import { OAUTH_REFERRAL_COOKIE, REFERRAL_DEVICE_COOKIE } from "@/lib/commercial/referrals";

function privateRedirect(url: URL) {
  const response = NextResponse.redirect(url);
  response.headers.set("cache-control", "no-store");
  return response;
}

const OAUTH_TIMEZONE_COOKIE = "hskkit_oauth_timezone";

function failure(request: Request, code: string, returnTo: string, selectAccount: boolean) {
  const response = privateRedirect(new URL(`/login?error=${encodeURIComponent(code)}&returnTo=${encodeSignInReturnTo(returnTo)}${selectAccount ? '&selectAccount=1' : ''}`, request.url));
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_VERIFIER_COOKIE);
  response.cookies.delete(OAUTH_RETURN_COOKIE);
  response.cookies.delete(OAUTH_REFERRAL_COOKIE);
  response.cookies.delete(OAUTH_TIMEZONE_COOKIE);
  response.cookies.delete(OAUTH_SWITCH_COOKIE);
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jar = await cookies();
  const returnTo = safeReturnTo(jar.get(OAUTH_RETURN_COOKIE)?.value);
  const selectAccount = jar.get(OAUTH_SWITCH_COOKIE)?.value === '1';
  if (url.searchParams.get("error")) return failure(request, "google_cancelled", returnTo, selectAccount);
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const expectedState = jar.get(OAUTH_STATE_COOKIE)?.value ?? "";
  const verifier = jar.get(OAUTH_VERIFIER_COOKIE)?.value ?? "";
  if (!code || !state || state !== expectedState || !verifier) return failure(request, "invalid_callback", returnTo, selectAccount);

  try {
    const config = googleOAuthConfig();
    const accessToken = await exchangeGoogleCode(code, verifier, config);
    const profile = await loadGoogleProfile(accessToken);
    const proposedTimezone = jar.get(OAUTH_TIMEZONE_COOKIE)?.value;
    const timezone = proposedTimezone && proposedTimezone.length <= 64 && validTimezone(proposedTimezone) ? proposedTimezone : undefined;
    const account = await upsertGoogleAccount(profile, timezone || "UTC");
    if (timezone && account.timezone !== timezone) {
      // Timezone is a convenience setting; a failed update must not block sign-in.
      await updateTimezone(account.userId, timezone).catch(() => undefined);
    }
    const referralDevice = jar.get(REFERRAL_DEVICE_COOKIE)?.value;
    await activateWelcomeTrialAndReferral({
      userId: account.userId,
      emailVerified: profile.emailVerified,
      referralCode: jar.get(OAUTH_REFERRAL_COOKIE)?.value,
      deviceHash: referralDevice ? await sha256ReferralDevice(referralDevice) : undefined,
    });
    const session = await createAccountSession(account.userId);
    const response = privateRedirect(new URL(googleReturnDestination(returnTo, Boolean(jar.get(GUEST_COOKIE)?.value)), request.url));
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
    response.cookies.delete(OAUTH_SWITCH_COOKIE);
    return response;
  } catch (reason) {
    const code = reason instanceof Error && reason.message === "ACCOUNT_DELETED" ? "account_deleted" : "google_failed";
    return failure(request, code, returnTo, selectAccount);
  }
}
