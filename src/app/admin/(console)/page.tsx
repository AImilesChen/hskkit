import Link from "next/link";
import { requireAdmin } from "@/lib/admin/access";
import { getAdminOverview } from "@/lib/admin/repository";

export default async function AdminOverviewPage() {
  const { env } = await requireAdmin();
  const data = await getAdminOverview(env.LEARNING_DB);
  const cards = [
    { label: "Registrations", value: data.registrations, detail: `${data.registrationsDay} today · ${data.registrationsWeek} in 7 days` },
    { label: "Active welcome trials", value: data.activeTrials, detail: "Automatic 7-day Pro access" },
    { label: "Live subscriptions", value: data.subscriptions.live.monthly + data.subscriptions.live.yearly, detail: `${data.subscriptions.live.monthly} monthly · ${data.subscriptions.live.yearly} yearly` },
    { label: "Test subscriptions", value: data.subscriptions.test.monthly + data.subscriptions.test.yearly, detail: "Excluded from Live reporting" },
    { label: "Unread user feedback", value: data.feedback.unread, detail: "Needs review", href: "/admin/feedback?view=unread" },
    { label: "Resolved feedback", value: data.feedback.resolved, detail: "Audited updates" },
  ];

  return (
    <section>
      <div className="admin-section-heading"><div><h2>Overview</h2><p>Current operational totals from the production ledger.</p></div></div>
      <div className="admin-metrics">
        {cards.map((card) => card.href ? (
          <Link className="admin-metric admin-metric-link" href={card.href} prefetch={false} key={card.label}>
            <span>{card.label}</span><strong>{card.value}</strong><small>{card.detail}</small>
          </Link>
        ) : (
          <article className="admin-metric" key={card.label}>
            <span>{card.label}</span><strong>{card.value}</strong><small>{card.detail}</small>
          </article>
        ))}
      </div>
      <div className="admin-shortcuts"><Link href="/admin/users">Browse users</Link><Link href="/admin/subscriptions">Review subscriptions</Link><Link href="/admin/feedback?view=unread">Open feedback inbox</Link></div>
    </section>
  );
}
