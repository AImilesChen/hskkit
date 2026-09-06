import { requireAdmin } from "@/lib/admin/access";
import { parseListQuery } from "@/lib/admin/domain";
import { listAdminFeedback } from "@/lib/admin/repository";
import { Badge, DateTime, Pagination } from "../components";
import { FeedbackReviewForm } from "./feedback-review-form";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export default async function AdminFeedbackPage({ searchParams }: Props) {
  const raw = await searchParams; const q = typeof raw.q === "string" ? raw.q : ""; const status = typeof raw.status === "string" ? raw.status : ""; const type = typeof raw.type === "string" ? raw.type : ""; const page = typeof raw.page === "string" ? raw.page : "1";
  const parsed = parseListQuery(new URLSearchParams({ q, page, pageSize: "10" })); const { env } = await requireAdmin(); const data = await listAdminFeedback(env.LEARNING_DB, { ...parsed, status, type });
  return <section><div className="admin-section-heading"><div><h2>Feedback</h2><p>Original submissions stay unchanged. Review updates are audited.</p></div></div>
    <form className="admin-filters"><label><span>Search feedback</span><input name="q" defaultValue={q} placeholder="Message, page or email" /></label><label><span>Status</span><select name="status" defaultValue={status}><option value="">All</option><option value="unread">Unread</option><option value="read">Read</option><option value="resolved">Resolved</option></select></label><label><span>Type</span><select name="type" defaultValue={type}><option value="">All</option><option value="bug">Bug</option><option value="suggestion">Suggestion</option><option value="other">Other</option></select></label><button>Apply</button></form>
    <div className="admin-feedback-list">{data.items.map((row) => <article className="admin-feedback" key={String(row.id)}><header><div><Badge tone={row.review_status === "resolved" ? "good" : row.review_status === "unread" ? "warn" : "info"}>{String(row.review_status)}</Badge><Badge>{String(row.type)}</Badge></div><DateTime value={row.created_at} /></header><p className="admin-feedback-message">{String(row.message)}</p><dl><div><dt>Contact</dt><dd>{String(row.email || "Anonymous")}</dd></div><div><dt>Page</dt><dd>{String(row.page_path)}</dd></div><div><dt>Device</dt><dd>{String(row.device_category)} · {String(row.browser_category)}</dd></div></dl><FeedbackReviewForm id={String(row.id)} reviewStatus={String(row.review_status)} adminNote={row.admin_note ? String(row.admin_note) : null} /></article>)}</div>
    <Pagination path="/admin/feedback" meta={data.meta} params={{ q, status, type }} />
  </section>;
}
