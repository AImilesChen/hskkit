import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requestIdentity } from "@/lib/account/identity";
import { AdminDomainError, AdminStorageUnavailableError, authorizeAdminIdentity, withAdminD1Retry } from "./domain.ts";

export const ADMIN_PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "frame-ancestors 'none'",
} as const;

export async function requireAdmin() {
  const identity = await withAdminD1Retry(() => requestIdentity({ touchSession: false }));
  const env = getCloudflareContext().env;
  const admin = authorizeAdminIdentity(identity.account ? { userId: identity.account.userId, connection: identity.connection } : undefined, env.ADMIN_USER_IDS);
  return { ...admin, env };
}

export function requireAdminSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) throw new AdminDomainError(403, "ORIGIN_REQUIRED");
  let source: URL;
  try { source = new URL(origin); } catch { throw new AdminDomainError(403, "CROSS_SITE_REQUEST_BLOCKED"); }
  if (source.origin !== new URL(request.url).origin) throw new AdminDomainError(403, "CROSS_SITE_REQUEST_BLOCKED");
}

export async function readAdminJson(request: Request) {
  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") throw new AdminDomainError(415, "JSON_REQUIRED");
  const text = await request.text();
  if (!text || text.length > 4_000) throw new AdminDomainError(413, "INVALID_PAYLOAD_SIZE");
  try { return JSON.parse(text) as unknown; } catch { throw new AdminDomainError(400, "INVALID_JSON"); }
}

export function adminJson(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, { ...init, headers: { ...ADMIN_PRIVATE_HEADERS, ...init.headers } });
}

export function adminError(error: unknown) {
  if (error instanceof AdminDomainError) return adminJson({ error: error.message }, { status: error.status });
  if (error instanceof AdminStorageUnavailableError) return adminJson({ error: error.message }, { status: 503, headers: { "Retry-After": "1" } });
  if (error instanceof Error && error.message === "FEEDBACK_NOT_FOUND") return adminJson({ error: error.message }, { status: 404 });
  console.error("admin_request_failed", error instanceof Error ? error.message : "unknown");
  return adminJson({ error: "ADMIN_REQUEST_FAILED" }, { status: 500 });
}
