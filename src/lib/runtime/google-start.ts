import { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies/index.js";
import { googleAuthorizationUrl, pkceChallenge, randomOAuthValue, readGoogleOAuthConfig, type OAuthEnv } from "../account/oauth-parameters.ts";
import { signInReturnTo } from "../account/sign-in.ts";
import { OAUTH_REFERRAL_COOKIE, REFERRAL_DEVICE_COOKIE, safeReferralCode } from "../commercial/referrals.ts";
import { shouldBlockCrawler } from "../traffic/bot-guard.ts";

const queryKeys = new Set(["returnTo", "selectAccount", "ref", "timezone"]);

// The pinned adapter reconstructs decoded query values before invoking Next.
// Limit the shortcut to unambiguous values; legacy/raw/duplicate query forms
// retain that adapter and the original route, rather than subtly changing them.
function unambiguousQuery(url: URL) {
  const seen = new Set<string>();
  for (const [key, value] of url.searchParams) {
    if (!queryKeys.has(key) || seen.has(key)) return false;
    seen.add(key);
    if (key === "returnTo" && !/^v1\.[A-Za-z0-9_-]*$/.test(value)) return false;
    if (key === "timezone" && !/^[A-Za-z0-9_\/-]{0,64}$/.test(value)) return false;
    if ((key === "ref" || key === "selectAccount") && !/^[A-Za-z0-9]*$/.test(value)) return false;
  }
  return true;
}

/** Only stateless GETs can skip Next. Never cache state, PKCE or these cookies. */
export async function anonymousGoogleStartResponse(request: Request, env: OAuthEnv): Promise<Response | undefined> {
  if (request.method !== "GET" || request.headers.get("cookie")) return;
  if (["rsc", "next-action", "next-router-prefetch", "next-router-segment-prefetch", "x-prerender-revalidate"]
    .some(header => request.headers.has(header))) return;
  if (shouldBlockCrawler(request.headers.get("user-agent"))) return;
  const url = new URL(request.url);
  if (url.pathname !== "/api/v1/auth/google/start" || !unambiguousQuery(url)) return;
  try {
    const config = readGoogleOAuthConfig(env);
    const returnTo = signInReturnTo(url.searchParams.get("returnTo"));
    const selectAccount = url.searchParams.get("selectAccount") === "1";
    const referralCode = safeReferralCode(url.searchParams.get("ref"));
    const timezone = url.searchParams.get("timezone");
    const state = randomOAuthValue();
    const verifier = randomOAuthValue(48);
    const challenge = await pkceChallenge(verifier);
    const response = new Response(null, { status: 307, headers: {
      location: googleAuthorizationUrl(config, state, challenge, selectAccount).href,
      "cache-control": "no-store",
    } });
    // Use the same pinned cookie serializer as NextResponse, including escaping,
    // expiration, deletion and attributes. Do not import Next's server handler.
    const cookies = new ResponseCookies(response.headers);
    const cookie = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 600 };
    cookies.set("hskkit_oauth_state", state, cookie);
    cookies.set("hskkit_oauth_verifier", verifier, cookie);
    cookies.set("hskkit_oauth_return", returnTo, cookie);
    if (selectAccount) cookies.set("hskkit_oauth_switch", "1", cookie);
    else cookies.delete("hskkit_oauth_switch");
    if (timezone) {
      try {
        new Intl.DateTimeFormat("en", { timeZone: timezone }).format(new Date());
        cookies.set("hskkit_oauth_timezone", timezone, cookie);
      } catch { /* Same optional timezone validation as the original route. */ }
    }
    if (referralCode) cookies.set(OAUTH_REFERRAL_COOKIE, referralCode, cookie);
    cookies.set(REFERRAL_DEVICE_COOKIE, crypto.randomUUID(), { ...cookie, maxAge: 30 * 24 * 60 * 60 });
    return response;
  } catch {
    // Configuration and crypto failures keep the original retry/error response.
    return;
  }
}
