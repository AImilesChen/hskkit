import Link from "next/link";
import { requireAdmin } from "@/lib/admin/access";
import { parseListQuery } from "@/lib/admin/domain";
import { getAdminFeedbackCounts, listAdminFeedback } from "@/lib/admin/repository";
import { Badge, DateTime, Pagination } from "../components";
import { FeedbackReviewForm } from "./feedback-review-form";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
type FeedbackView = "unread" | "read" | "resolved" | "archived";

const viewLabels: Record<FeedbackView, string> = {
  unread: "Unread",
  read: "Read",
  resolved: "Resolved",
  archived: "Archived",
};

export default async function AdminFeedbackPage({ searchParams }: Props) {
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q : "";
  const type = typeof raw.type === "string" ? raw.type : "";
  const page = typeof raw.page === "string" ? raw.page : "1";
  const view = raw.view === "read" || raw.view === "resolved" || raw.view === "archived" ? raw.view : "unread";
  const parsed = parseListQuery(new URLSearchParams({ q, page, pageSize: "10" }));
  const { env } = await requireAdmin();
  const status = view === "archived" ? "" : view;
  const retention = view === "archived" ? "archived" : "kept";
  const [data, counts] = await Promise.all([
    listAdminFeedback(env.LEARNING_DB, { ...parsed, status, type, retention }),
    getAdminFeedbackCounts(env.LEARNING_DB),
  ]);
  const totalFeedback = counts.unread + counts.read + counts.resolved + counts.archived;
  const hasFilters = Boolean(q || type);
  const viewEntries = (Object.keys(viewLabels) as FeedbackView[]).map((key) => ({
    key,
    label: viewLabels[key],
    count: counts[key],
  }));

  return (
    <section>
      <div className="admin-section-heading">
        <div>
          <h2>User feedback</h2>
          <p>Review feedback submitted by users. Admin actions are recorded.</p>
        </div>
      </div>

      <nav className="admin-feedback-views" aria-label="Feedback status">
        {viewEntries.map((item) => (
          <Link
            key={item.key}
            href={`/admin/feedback?view=${item.key}`}
            prefetch={false}
            aria-current={view === item.key ? "page" : undefined}
          >
            <span>{item.label}</span>
            <strong>{item.count}</strong>
          </Link>
        ))}
      </nav>

      <details className="admin-feedback-filters" open={hasFilters}>
        <summary>Filters{hasFilters ? " · Active" : ""}</summary>
        <form className="admin-filters">
          <input type="hidden" name="view" value={view} />
          <label><span>Search feedback</span><input name="q" defaultValue={q} placeholder="Message, page or email" /></label>
          <label><span>Feedback type</span><select name="type" defaultValue={type}><option value="">All types</option><option value="bug">Bug</option><option value="suggestion">Suggestion</option><option value="other">Other</option></select></label>
          <button>Apply filters</button>
          {hasFilters ? <Link href={`/admin/feedback?view=${view}`} prefetch={false}>Clear filters</Link> : null}
        </form>
      </details>

      <div className="admin-feedback-list">
        {data.items.length === 0 && totalFeedback === 0 ? (
          <div className="admin-empty"><strong>No user feedback yet</strong><p>Feedback submitted through the website will appear here.</p></div>
        ) : null}
        {data.items.length === 0 && totalFeedback > 0 && hasFilters ? (
          <div className="admin-empty"><strong>No feedback matches these filters</strong><p><Link href={`/admin/feedback?view=${view}`} prefetch={false}>Clear filters</Link></p></div>
        ) : null}
        {data.items.length === 0 && totalFeedback > 0 && !hasFilters ? (
          <div className="admin-empty"><strong>No {viewLabels[view].toLowerCase()} feedback</strong><p>Choose another inbox view to see other messages.</p></div>
        ) : null}
        {data.items.map((row) => {
          const email = typeof row.email === "string" ? row.email : "";
          const accountUserId = typeof row.account_user_id === "string" ? row.account_user_id : "";
          const pagePath = typeof row.page_path === "string" ? row.page_path : "";
          const reviewStatus = String(row.review_status);
          const retentionStatus = row.retention_status === "archived" ? "archived" : "kept";
          return (
            <article className="admin-feedback" key={String(row.id)}>
              <header>
                <div className="admin-feedback-badges">
                  <Badge tone={reviewStatus === "resolved" ? "good" : reviewStatus === "unread" ? "warn" : "info"}>{reviewStatus}</Badge>
                  <Badge>{String(row.type)}</Badge>
                  {retentionStatus === "archived" ? <Badge tone="warn">archived</Badge> : null}
                </div>
                <DateTime value={row.created_at} />
              </header>
              <p className="admin-feedback-message">{String(row.message)}</p>
              <dl>
                <div><dt>Source page</dt><dd>{pagePath || "Unknown"}</dd></div>
                <div><dt>Email</dt><dd>{email || "Anonymous"}</dd></div>
                {accountUserId ? <div><dt>Account</dt><dd>{accountUserId}</dd></div> : null}
              </dl>
              <FeedbackReviewForm
                id={String(row.id)}
                reviewStatus={reviewStatus}
                adminNote={row.admin_note ? String(row.admin_note) : null}
                retentionStatus={retentionStatus}
              />
            </article>
          );
        })}
      </div>

      <Pagination path="/admin/feedback" meta={data.meta} params={{ q, type, view }} />
    </section>
  );
}
