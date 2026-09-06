import { requireAdmin } from "@/lib/admin/access";
import { parseListQuery } from "@/lib/admin/domain";
import { listAdminSubscriptions } from "@/lib/admin/repository";
import { Badge, DateTime, Pagination } from "../components";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export default async function AdminSubscriptionsPage({ searchParams }: Props) {
  const raw = await searchParams; const q = typeof raw.q === "string" ? raw.q : ""; const status = typeof raw.status === "string" ? raw.status : ""; const plan = typeof raw.plan === "string" ? raw.plan : ""; const mode = typeof raw.mode === "string" ? raw.mode : ""; const page = typeof raw.page === "string" ? raw.page : "1";
  const parsed = parseListQuery(new URLSearchParams({ q, page })); const { env } = await requireAdmin(); const data = await listAdminSubscriptions(env.LEARNING_DB, { ...parsed, status, access: plan, mode });
  return <section><div className="admin-section-heading"><div><h2>Subscriptions</h2><p>Live and Test Stripe records stay visibly separated.</p></div></div>
    <form className="admin-filters"><label><span>Search</span><input name="q" defaultValue={q} placeholder="Email, user or subscription" /></label><label><span>Plan</span><select name="plan" defaultValue={plan}><option value="">All</option><option value="pro_monthly">Pro monthly</option><option value="pro_yearly">Pro yearly</option></select></label><label><span>Stripe mode</span><select name="mode" defaultValue={mode}><option value="">All</option><option value="live">Live</option><option value="test">Test</option></select></label><label><span>Status</span><input name="status" defaultValue={status} placeholder="active" /></label><button>Apply</button></form>
    <div className="admin-table-shell"><table><thead><tr><th>User</th><th>Plan</th><th>Status</th><th>Stripe mode</th><th>Period end</th><th>Subscription</th></tr></thead><tbody>{data.items.map((row) => <tr key={String(row.id)}><td><strong>{String(row.email || "—")}</strong><small>{String(row.user_id)}</small></td><td>{String(row.plan_id)}</td><td>{String(row.status)}{row.cancel_at_period_end ? " · cancels at period end" : ""}</td><td><Badge tone={row.stripe_livemode ? "good" : "warn"}>{row.stripe_livemode ? "Live" : "Test"}</Badge></td><td><DateTime value={row.current_period_end} /></td><td>{String(row.provider_subscription_id || "—")}</td></tr>)}</tbody></table></div>
    <Pagination path="/admin/subscriptions" meta={data.meta} params={{ q, status, plan, mode }} />
  </section>;
}
