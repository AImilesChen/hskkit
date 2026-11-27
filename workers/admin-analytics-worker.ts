import { REPORT_DAYS } from "../src/lib/admin/analytics-model.ts";

export default {
  async fetch() { return new Response("Not found", { status: 404 }); },
  async scheduled(_event: unknown, env: { DASHBOARD: { refresh(days: number): Promise<unknown> } }) {
    // No Google secrets or database access in this scheduler. A service binding
    // can call only the dedicated reporting entrypoint on the main Worker.
    for (const days of REPORT_DAYS) {
      try { await env.DASHBOARD.refresh(days); } catch { console.error("admin_analytics_sync_failed", days); }
    }
  },
};
