import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/admin/access";
import { REPORTING_COOKIE, exchangeReportingCode, openReportingSecret, saveReportingConnection, validReportingState, type ReportingOAuthState } from "@/lib/admin/analytics-connection";
import { readAnalytics, syncAnalytics } from "@/lib/admin/analytics-storage";
import { reportingOAuthDiagnostic, type ReportingOAuthStage } from "@/lib/admin/analytics-oauth-diagnostic";
export const dynamic = "force-dynamic";

function finish(request: Request, status: string, diagnostic?: ReturnType<typeof reportingOAuthDiagnostic>) {
  const target = new URL(`/admin?reporting=${status}`, request.url);
  if (diagnostic) {
    target.searchParams.set("reporting_stage", diagnostic.stage);
    target.searchParams.set("reporting_reason", diagnostic.reason);
  }
  const response = NextResponse.redirect(target, 303);
  response.headers.set("cache-control", "private, no-store");
  response.headers.set("referrer-policy", "no-referrer");
  response.headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  response.cookies.set(REPORTING_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
export async function GET(request: Request) {
  let stage: ReportingOAuthStage = "admin_check";
  try {
    const { env, userId } = await requireAdmin();
    const url = new URL(request.url);
    const cookie = (await cookies()).get(REPORTING_COOKIE)?.value;
    if (!cookie) return finish(request, "invalid_state");
    stage = "state_decrypt";
    const state = JSON.parse(await openReportingSecret(cookie, env.GOOGLE_CLIENT_SECRET || "", "oauth-state")) as ReportingOAuthState;
    if (!validReportingState(state, url.searchParams.get("state") || "", userId)) return finish(request, "invalid_state");
    if (url.searchParams.has("error")) return finish(request, "cancelled");
    stage = "token_exchange";
    const tokens = await exchangeReportingCode(env, url.searchParams.get("code") || "", state.verifier);
    stage = "connection_save";
    await saveReportingConnection(env, tokens.refreshToken, tokens.scopes, userId);
    // First 28-day report is real data, never a seeded dashboard. Other windows
    // are collected daily, or once on their first explicit selection.
    try {
      await syncAnalytics(env, 28, new Date(), true);
      const data = await readAnalytics(env, 28);
      return finish(request, data.sources.every(source => source.report && !source.error) ? "connected" : "partial");
    } catch { return finish(request, "partial"); }
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return finish(request, code === "REPORT_SCOPES_MISSING" ? "scopes_missing" : code === "REPORT_REFRESH_MISSING" ? "refresh_missing" : "failed", reportingOAuthDiagnostic(stage, error));
  }
}
