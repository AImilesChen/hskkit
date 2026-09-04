import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requestIdentity } from "@/lib/account/identity";
import { getVerifiedGoogleEmail } from "@/lib/account/storage";
import { isEmailAllowed, isSameOriginRequest } from "./domain";

export class BlogHttpError extends Error {
  constructor(public status: number, code: string) { super(code); }
}

export function requireSameOrigin(request: Request) {
  if (!isSameOriginRequest(request)) {
    throw new BlogHttpError(403, "CROSS_SITE_REQUEST_BLOCKED");
  }
}

export async function requireBlogAdmin() {
  const identity = await requestIdentity();
  if (!identity.account || identity.connection !== "google") throw new BlogHttpError(401, "AUTH_REQUIRED");
  const email = await getVerifiedGoogleEmail(identity.account.userId);
  const env = getCloudflareContext().env;
  if (!isEmailAllowed(email, env.BLOG_ADMIN_EMAILS)) throw new BlogHttpError(403, "BLOG_ADMIN_REQUIRED");
  return { account: identity.account, email: email!, env };
}

export async function readBlogJson(request: Request) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0];
  if (contentType !== "application/json") throw new BlogHttpError(415, "JSON_REQUIRED");
  const body = await request.text();
  if (!body || body.length > 100_000) throw new BlogHttpError(413, "PAYLOAD_TOO_LARGE");
  try { return JSON.parse(body) as Record<string, unknown>; }
  catch { throw new BlogHttpError(400, "INVALID_JSON"); }
}

export function blogError(error: unknown) {
  if (error instanceof BlogHttpError) return Response.json({ error: error.message }, { status: error.status, headers: { "cache-control": "private, no-store" } });
  const code = error instanceof Error ? error.message : "BLOG_REQUEST_FAILED";
  const status = code.startsWith("INVALID_") ? 422 : code === "BLOG_NOT_FOUND" ? 404 : ["SLUG_CONFLICT", "BLOG_EDIT_CONFLICT"].includes(code) ? 409 : 500;
  return Response.json({ error: status === 500 ? "BLOG_REQUEST_FAILED" : code }, { status, headers: { "cache-control": "private, no-store" } });
}
