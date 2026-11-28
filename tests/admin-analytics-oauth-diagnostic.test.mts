import assert from "node:assert/strict";
import test from "node:test";
import { reportingOAuthDiagnostic } from "../src/lib/admin/analytics-oauth-diagnostic.ts";
import { exchangeReportingCode } from "../src/lib/admin/analytics-connection.ts";

test("reporting diagnostic identifies failure stage and expected error without disclosing data", () => {
  assert.deepEqual(reportingOAuthDiagnostic("token_exchange", new Error("REPORT_ACCESS_DENIED")), { stage: "token_exchange", reason: "token_rejected" });
  assert.deepEqual(reportingOAuthDiagnostic("token_exchange", new DOMException("private data", "TimeoutError")), { stage: "token_exchange", reason: "timeout" });
  for (const stage of ["admin_check", "state_decrypt", "token_exchange", "connection_save"] as const) {
    const diagnostic = reportingOAuthDiagnostic(stage, new Error("fixture-private-token cookie=fixture-secret"));
    assert.deepEqual(diagnostic, { stage, reason: "unexpected" });
    assert.doesNotMatch(JSON.stringify(diagnostic), /fixture|cookie|secret/);
  }
});

test("Google token failures retain only allowlisted categories", async () => {
  const config = { GOOGLE_CLIENT_ID: "fixture", GOOGLE_CLIENT_SECRET: "fixture", GOOGLE_REDIRECT_URI: "https://hskkit.com/api/v1/auth/google/callback" };
  for (const category of ["invalid_client", "invalid_grant", "invalid_request", "toString", "private-fixture-data"]) {
    try {
      await exchangeReportingCode(config, "fixture-code", "v".repeat(64), async () => Response.json({ error: category, error_description: "private-fixture-data" }, { status: 400 }));
      assert.fail("must reject token failure");
    } catch (error) {
      const diagnostic = reportingOAuthDiagnostic("token_exchange", error);
      assert.equal(diagnostic.reason, category.startsWith("invalid_") ? category : "token_rejected");
      assert.doesNotMatch(JSON.stringify(diagnostic), /fixture|toString/);
    }
  }
});
