import { shouldBlockCrawler } from "../traffic/bot-guard.ts";

/** Only a request with no cookies can be proven to have no account/guest state.
 * All cookie-bearing requests retain the original session, guest and D1 path.
 */
export function anonymousAccountResponse(request: Request): Response | undefined {
  if (request.headers.get("cookie") || shouldBlockCrawler(request.headers.get("user-agent"))) return;
  const path = new URL(request.url).pathname;
  if (request.method === "GET" && path === "/api/v1/account") {
    return Response.json({ account: null, connection: null, guest: { hasData: false, attempts: 0, learningSessions: 0, plannerVersions: 0, revision: 0 } }, { headers: { "cache-control": "private, no-store" } });
  }
  if (["GET", "POST"].includes(request.method) && path === "/api/v1/account/learning-rewards") {
    return Response.json({ error: "ACCOUNT_REQUIRED" }, { status: 401, headers: { "cache-control": "private, no-store" } });
  }
}
