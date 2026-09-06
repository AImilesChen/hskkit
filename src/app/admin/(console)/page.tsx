import Link from "next/link";
import { requireAdmin } from "@/lib/admin/access";
import { getAdminOverview } from "@/lib/admin/repository";

export default async function AdminOverviewPage() {
  const { env } = await requireAdmin();
  const data = await getAdminOverview(env.LEARNING_DB);
  const cards = [
    ["Registrations", data.registrations, `${data.registrationsDay} today · ${data.registrationsWeek} in 7 days`],
    ["Active welcome trials", data.activeTrials, "Automatic 7-day Pro access"],
    ["Live subscriptions", data.subscriptions.live.monthly + data.subscriptions.live.yearly, `${data.subscriptions.live.monthly} monthly · ${data.subscriptions.live.yearly} yearly`],
    ["Test subscriptions", data.subscriptions.test.monthly + data.subscriptions.test.yearly, "Excluded from Live reporting"],
    ["Unread feedback", data.feedback.unread, "Needs review"],
    ["Resolved feedback", data.feedback.resolved, "Audited updates"],
  ] as const;
  return <section><div className="admin-section-heading"><div><h2>Overview</h2><p>Current operational totals from the production ledger.</p></div></div><div className="admin-metrics">{cards.map(([label, value, detail]) => <article className="admin-metric" key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</div><div className="admin-shortcuts"><Link href="/admin/users">Browse users</Link><Link href="/admin/subscriptions">Review subscriptions</Link><Link href="/admin/feedback">Open feedback inbox</Link></div></section>;
}
