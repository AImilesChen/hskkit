export const REPORT_DAYS = [7, 28, 90] as const;
export type ReportDays = typeof REPORT_DAYS[number];
export type Provider = "gsc" | "ga4";
export type Totals = Record<string, number | null>;
export type ReportRow = { label: string; value: number; secondary?: number };
export type Report = {
  provider: Provider; days: ReportDays;
  start: string; end: string; previousStart: string; previousEnd: string;
  timezone: string; totals: Totals; previous: Totals;
  trend: { date: string; value: number }[];
  keywords: ReportRow[]; pages: ReportRow[];
};
export type SourceState = {
  provider: Provider; configured: boolean;
  report: Report | null; syncedAt: string | null; attemptedAt: string | null;
  error: string | null; stale: boolean;
};
export type DashboardAnalytics = { days: ReportDays; storageReady: boolean; sources: SourceState[] };

export function parseReportDays(value: string | null): ReportDays {
  return REPORT_DAYS.find(day => String(day) === value) ?? 28;
}

// Leave three days for Search Console finalization. Exclude partial GA4 days.
export function reportWindow(days: ReportDays, now = new Date(), lag = 3) {
  const calendarDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
  const date = new Date(`${calendarDay}T12:00:00Z`);
  const day = (offset: number) => new Date(date.getTime() - offset * 86_400_000).toISOString().slice(0, 10);
  return { start: day(lag + days - 1), end: day(lag), previousStart: day(lag + 2 * days - 1), previousEnd: day(lag + days) };
}

export function percentChange(current: number | null | undefined, previous: number | null | undefined) {
  if (current == null || previous == null || previous === 0) return null;
  return (current - previous) / previous * 100;
}

export function numberValue(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error("INVALID_REPORT_DATA");
  return number;
}
