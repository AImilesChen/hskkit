export type ReportingOAuthStage = "admin_check" | "state_decrypt" | "token_exchange" | "connection_save";

// Only predefined labels may reach the redirect. Never serialize provider
// responses, authorization codes, cookies, credentials or arbitrary errors.
export function reportingOAuthDiagnostic(stage: ReportingOAuthStage, error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const known: Record<string, string> = {
    REPORT_ACCESS_DENIED: "token_rejected",
    REPORT_TOKEN_INVALID_CLIENT: "invalid_client",
    REPORT_TOKEN_INVALID_GRANT: "invalid_grant",
    REPORT_TOKEN_INVALID_REQUEST: "invalid_request",
    REPORT_CREDENTIALS_INVALID: "config_invalid",
    REPORT_REFRESH_MISSING: "refresh_missing",
    REPORT_SCOPES_MISSING: "scopes_missing",
    AUTHENTICATION_REQUIRED: "authentication_required",
    ADMIN_FORBIDDEN: "admin_forbidden",
    ADMIN_TEMPORARILY_UNAVAILABLE: "admin_unavailable",
  };
  const timeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
  return { stage, reason: timeout ? "timeout" : Object.hasOwn(known, message) ? known[message] : "unexpected" };
}
