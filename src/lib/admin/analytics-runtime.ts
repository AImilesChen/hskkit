import { parseReportDays } from "./analytics-model.ts";
import { syncAnalytics, type AnalyticsEnv } from "./analytics-storage.ts";

// Called only via a named Worker service binding, never through public HTTP.
export async function refreshBoundAnalytics(env: AnalyticsEnv, days: number) {
  if (![7, 28, 90].includes(days)) throw new Error("INVALID_REPORT_WINDOW");
  return syncAnalytics(env, parseReportDays(String(days)));
}
