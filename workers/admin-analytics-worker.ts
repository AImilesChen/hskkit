import { REPORT_DAYS } from "../src/lib/admin/analytics-model.ts";

export function isReportingSyncTime(time: number) {
  const date = new Date(time);
  return date.getUTCHours() === 9 && date.getUTCMinutes() === 15;
}

export default {
  async fetch() { return new Response("Not found", { status: 404 }); },
  async scheduled(event: { scheduledTime: number }, env: { DASHBOARD?: { refresh(days: number): Promise<unknown> } }) {
    // Reuse the existing maintenance cron, but collect reports once daily.
    // No Google credentials are copied to the maintenance Worker.
    if (!isReportingSyncTime(event.scheduledTime) || !env.DASHBOARD) return;
    for (const days of REPORT_DAYS) {
      try { await env.DASHBOARD.refresh(days); } catch { console.error("admin_analytics_sync_failed", days); }
    }
  },
};
