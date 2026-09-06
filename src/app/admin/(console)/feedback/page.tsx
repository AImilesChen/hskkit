import { requireAdmin } from "@/lib/admin/access";
import { parseListQuery } from "@/lib/admin/domain";
import { listAdminFeedback } from "@/lib/admin/repository";
import { Badge, DateTime, Pagination } from "../components";
import { FeedbackReviewForm } from "./feedback-review-form";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminFeedbackPage({ searchParams }: Props) {
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q : "";
  const status = typeof raw.status === "string" ? raw.status : "";
  const type = typeof raw.type === "string" ? raw.type : "";
  const retention = typeof raw.retention === "string" ? raw.retention : "kept";
  const page = typeof raw.page === "string" ? raw.page : "1";
  const parsed = parseListQuery(new URLSearchParams({ q, page, pageSize: "10" }));
  const { env } = await requireAdmin();
  const data = await listAdminFeedback(env.LEARNING_DB, { ...parsed, status, type, retention });

  return (
    <section>
      <div className="admin-section-heading">
        <div>
          <h2>Feedback</h2>
          <p>Filter, review and retain useful messages. Archive before permanent deletion.</p>
        </div>
      </div>

      <form className="admin-filters admin-feedback-filters">
        <label><span>Search feedback</span><input name="q" defaultValue={q} placeholder="Message, page or email" /></label>
        <label><span>Review status</span><select name="status" defaultValue={status}><option value="">All</option><option value="unread">Unread</option><option value="read">Read</option><option value="resolved">Resolved</option></select></label>
        <label><span>Feedback type</span><select name="type" defaultValue={type}><option value="">All</option><option value="bug">Bug</option><option value="suggestion">Suggestion</option><option value="other">Other</option></select></label>
        <label><span>Retention</span><select name="retention" defaultValue={retention}><option value="kept">Kept</option><option value="archived">Archived</option><option value="">All</option></select></label>
        <button>Apply</button>
        <a href="/admin/feedback">Clear filters</a>
      </form>

      <div className="admin-feedback-list">
        {data.items.length === 0 ? <p className="admin-empty">No feedback matches these filters.</p> : null}
        {data.items.map((row) => {
          const email = typeof row.email === "string" ? row.email : "";
          const accountUserId = typeof row.account_user_id === "string" ? row.account_user_id : "";
          const reviewStatus = String(row.review_status);
          const retentionStatus = row.retention_status === "archived" ? "archived" : "kept";
          return (
            <article className="admin-feedback" key={String(row.id)}>
              <header>
                <div className="admin-feedback-badges">
                  <Badge tone={reviewStatus === "resolved" ? "good" : reviewStatus === "unread" ? "warn" : "info"}>{reviewStatus}</Badge>
                  <Badge>{String(row.type)}</Badge>
                  <Badge tone={retentionStatus === "archived" ? "warn" : "good"}>{retentionStatus}</Badge>
                </div>
                <DateTime value={row.created_at} />
              </header>
              <p className="admin-feedback-message">{String(row.message)}</p>
              <dl>
                {accountUserId ? <div><dt>Account</dt><dd>{accountUserId}</dd></div> : null}
                <div><dt>Email</dt><dd>{email || "Anonymous"}</dd></div>
                <div><dt>Page</dt><dd>{String(row.page_path || "—")}</dd></div>
                <div><dt>Device</dt><dd>{String(row.device_category || "—")} · {String(row.browser_category || "—")}</dd></div>
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

      <Pagination path="/admin/feedback" meta={data.meta} params={{ q, status, type, retention }} />
    </section>
  );
}
