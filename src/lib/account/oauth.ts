import { getCloudflareContext } from "@opennextjs/cloudflare";

export type GoogleProfile = {
  sub: string;
  name: string;
  email?: string;
  emailVerified: boolean;
};

type OAuthEnv = {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
};

export type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
  .replaceAll("+", "-")
  .replaceAll("/", "_")
  .replaceAll("=", "");

export function randomOAuthValue(bytes = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function pkceChallenge(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return b64url(new Uint8Array(digest));
}

export function googleOAuthConfig(env?: OAuthEnv): GoogleOAuthConfig {
  const source = env ?? (getCloudflareContext().env as OAuthEnv);
  const clientId = source.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = source.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = source.GOOGLE_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) throw new Error("GOOGLE_OAUTH_NOT_CONFIGURED");
  if (!redirectUri.startsWith("https://") && !redirectUri.startsWith("http://localhost:")) throw new Error("GOOGLE_OAUTH_REDIRECT_INVALID");
  return { clientId, clientSecret, redirectUri };
}

export function googleAuthorizationUrl(config: GoogleOAuthConfig, state: string, codeChallenge: string) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    access_type: "online",
    include_granted_scopes: "true",
    prompt: "select_account",
  }).toString();
  return url;
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
