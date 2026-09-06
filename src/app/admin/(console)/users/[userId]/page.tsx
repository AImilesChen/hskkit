import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/access";
import { getAdminUser } from "@/lib/admin/repository";
import { Badge, DateTime } from "../../components";

export default async function AdminUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { env } = await requireAdmin(); const { userId } = await params; const data = await getAdminUser(env.LEARNING_DB, userId); if (!data) notFound(); const account = data.account;
  return <section><div className="admin-section-heading"><div><h2>{String(account.display_name)}</h2><p>{String(account.email || "No verified email")} · {String(account.user_id)}</p></div><Badge tone={account.access_state === "free" ? "neutral" : "good"}>{String(account.access_state)}</Badge></div>
    <dl className="admin-detail-grid"><div><dt>Account status</dt><dd>{String(account.status)}</dd></div><div><dt>Timezone</dt><dd>{String(account.timezone)}</dd></div><div><dt>Registered</dt><dd><DateTime value={account.created_at} /></dd></div><div><dt>Trial ends</dt><dd><DateTime value={account.trial_ends_at} /></dd></div></dl>
    <h3>Subscriptions</h3><div className="admin-table-shell"><table><thead><tr><th>Plan</th><th>Status</th><th>Stripe mode</th><th>Period end</th><th>Subscription</th></tr></thead><tbody>{data.subscriptions.length ? data.subscriptions.map((row) => <tr key={String(row.id)}><td>{String(row.plan_id)}</td><td>{String(row.status)}{row.cancel_at_period_end ? " · cancels at period end" : ""}</td><td><Badge tone={row.stripe_livemode ? "good" : "warn"}>{row.stripe_livemode ? "Live" : "Test"}</Badge></td><td><DateTime value={row.current_period_end} /></td><td>{String(row.provider_subscription_id || "—")}</td></tr>) : <tr><td colSpan={5}>No subscriptions.</td></tr>}</tbody></table></div>
    <h3>Recent charges</h3><div className="admin-table-shell"><table><thead><tr><th>Status</th><th>Amount</th><th>Stripe mode</th><th>Charged</th><th>Invoice</th></tr></thead><tbody>{data.charges.length ? data.charges.map((row) => <tr key={String(row.id)}><td>{String(row.status)}</td><td>{(Number(row.amount_cents) / 100).toFixed(2)} {String(row.currency).toUpperCase()}</td><td>{row.stripe_livemode ? "Live" : "Test"}</td><td><DateTime value={row.charged_at} /></td><td>{String(row.provider_invoice_id || "—")}</td></tr>) : <tr><td colSpan={5}>No charges.</td></tr>}</tbody></table></div>
  </section>;
}
