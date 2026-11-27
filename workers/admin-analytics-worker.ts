import { syncAnalytics, type AnalyticsEnv } from "../src/lib/admin/analytics-storage";
import { REPORT_DAYS } from "../src/lib/admin/analytics-model";

export default {
  async fetch() { return new Response("Not found", { status: 404 }); },
  async scheduled(_event: unknown, env: AnalyticsEnv) {
    // The scheduler has no public refresh endpoint and never touches learning data.
    for (const days of REPORT_DAYS) {
      try { await syncAnalytics(env, days); } catch { console.error("admin_analytics_sync_failed", days); }
    }
  },
};
