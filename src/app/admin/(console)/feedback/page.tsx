import { requireAdmin } from "@/lib/admin/access";
import { parseListQuery } from "@/lib/admin/domain";
import { listAdminFeedback } from "@/lib/admin/repository";
import { DateTime, Pagination } from "../components";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminFeedbackPage({ searchParams }: Props) {
  const raw = await searchParams;
  const page = typeof raw.page === "string" ? raw.page : "1";
  const parsed = parseListQuery(new URLSearchParams({ page, pageSize: "10" }));
  const { env } = await requireAdmin();
  const data = await listAdminFeedback(env.LEARNING_DB, parsed);

  return (
    <section>
      <div className="admin-section-heading">
        <div>
          <h2>Feedback</h2>
          <p>User messages and contact details.</p>
        </div>
      </div>

      <div className="admin-feedback-list">
        {data.items.map((row) => {
          const email = typeof row.email === "string" ? row.email : "";
          const accountUserId = typeof row.account_user_id === "string" ? row.account_user_id : "";
          return (
            <article className="admin-feedback" key={String(row.id)}>
              <header>
                <DateTime value={row.created_at} />
              </header>
              <p className="admin-feedback-message">{String(row.message)}</p>
              {email && (
                <dl>
                  {accountUserId && (
                    <div>
                      <dt>Account</dt>
                      <dd>{accountUserId}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Email</dt>
                    <dd>{email}</dd>
                  </div>
                </dl>
              )}
            </article>
          );
        })}
      </div>

      <Pagination path="/admin/feedback" meta={data.meta} params={{}} />
    </section>
  );
}
