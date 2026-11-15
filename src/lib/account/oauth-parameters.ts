// Web-platform-only OAuth primitives shared by Next and the small Worker entry.
// Keep platform context, account reads and application content out of this module.
export type OAuthEnv = {
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
  .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");

export function randomOAuthValue(bytes = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function pkceChallenge(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return b64url(new Uint8Array(digest));
}

export function readGoogleOAuthConfig(source: OAuthEnv): GoogleOAuthConfig {
  const clientId = source.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = source.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = source.GOOGLE_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) throw new Error("GOOGLE_OAUTH_NOT_CONFIGURED");
  if (!redirectUri.startsWith("https://") && !redirectUri.startsWith("http://localhost:")) throw new Error("GOOGLE_OAUTH_REDIRECT_INVALID");
  return { clientId, clientSecret, redirectUri };
}

export function googleAuthorizationUrl(config: GoogleOAuthConfig, state: string, codeChallenge: string, selectAccount = false) {
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
  }).toString();
  if (selectAccount) url.searchParams.set("prompt", "select_account");
  return url;
}
