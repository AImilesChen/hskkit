import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, SESSION_COOKIE } from "@/lib/account/identity";
import { exchangeGoogleCode, googleOAuthConfig, loadGoogleProfile } from "@/lib/account/oauth";
import { createAccountSession, upsertGoogleAccount } from "@/lib/account/storage";


function failure(request: Request, code: string) {
  const response = NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(code)}`, request.url));
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_VERIFIER_COOKIE);
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("error")) return failure(request, "google_cancelled");
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const jar = await cookies();
  const expectedState = jar.get(OAUTH_STATE_COOKIE)?.value ?? "";
  const verifier = jar.get(OAUTH_VERIFIER_COOKIE)?.value ?? "";
  if (!code || !state || state !== expectedState || !verifier) return failure(request, "invalid_callback");

  try {
    const config = googleOAuthConfig();
    const accessToken = await exchangeGoogleCode(code, verifier, config);
    const profile = await loadGoogleProfile(accessToken);
    const account = await upsertGoogleAccount(profile);
    const session = await createAccountSession(account.userId);
    const response = NextResponse.redirect(new URL("/account?login=success", request.url));
    response.cookies.set(SESSION_COOKIE, session.sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(session.expiresAt),
    });
    response.cookies.delete(OAUTH_STATE_COOKIE);
    response.cookies.delete(OAUTH_VERIFIER_COOKIE);
    return response;
  } catch (reason) {
    const code = reason instanceof Error && reason.message === "ACCOUNT_DELETED" ? "account_deleted" : "google_failed";
    return failure(request, code);
  }
}
