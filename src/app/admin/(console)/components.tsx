import Link from "next/link";

export function Pagination({ path, meta, params }: { path: string; meta: { page: number; pageCount: number; total: number }; params: Record<string, string | undefined> }) {
  const href = (page: number) => { const query = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => { if (value) query.set(key, value); }); query.set("page", String(page)); return `${path}?${query}`; };
  return <div className="admin-pagination"><span>{meta.total} total · Page {meta.page} of {meta.pageCount}</span><div>{meta.page > 1 ? <Link href={href(meta.page - 1)}>Previous</Link> : <span>Previous</span>}{meta.page < meta.pageCount ? <Link href={href(meta.page + 1)}>Next</Link> : <span>Next</span>}</div></div>;
}
export function DateTime({ value }: { value: unknown }) { return <>{typeof value === "string" && value ? new Date(value).toLocaleString("en-US", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" }) + " UTC" : "—"}</>; }
export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" | "info" }) { return <span className={`admin-badge ${tone}`}>{children}</span>; }
