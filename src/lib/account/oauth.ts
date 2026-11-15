import { getCloudflareContext } from "@opennextjs/cloudflare";
import { readGoogleOAuthConfig, type OAuthEnv } from "./oauth-parameters";
export { googleAuthorizationUrl, pkceChallenge, randomOAuthValue } from "./oauth-parameters";
export type { GoogleOAuthConfig } from "./oauth-parameters";
import type { GoogleOAuthConfig } from "./oauth-parameters";

export type GoogleProfile = {
  sub: string;
  name: string;
  email?: string;
  emailVerified: boolean;
};

export function googleOAuthConfig(env?: OAuthEnv): GoogleOAuthConfig {
  return readGoogleOAuthConfig(env ?? (getCloudflareContext().env as OAuthEnv));
}

export async function exchangeGoogleCode(code: string, verifier: string, config: GoogleOAuthConfig, request: typeof fetch = fetch) {
  if (!code || code.length > 2048 || !verifier || verifier.length > 128) throw new Error("GOOGLE_OAUTH_INVALID_CALLBACK");
  const response = await request("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("GOOGLE_OAUTH_TOKEN_FAILED");
  const body = await response.json() as { access_token?: string };
  if (!body.access_token) throw new Error("GOOGLE_OAUTH_TOKEN_FAILED");
  return body.access_token;
}

export async function loadGoogleProfile(accessToken: string, request: typeof fetch = fetch): Promise<GoogleProfile> {
  const response = await request("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("GOOGLE_PROFILE_FAILED");
  const body = await response.json() as { sub?: string; name?: string; email?: string; email_verified?: boolean };
  if (!body.sub || body.sub.length > 255) throw new Error("GOOGLE_PROFILE_INVALID");
  const name = body.name?.trim().slice(0, 60) || "HSKKit learner";
  return {
    sub: body.sub,
    name,
    email: body.email?.trim().toLowerCase().slice(0, 320),
    emailVerified: body.email_verified === true,
  };
}

