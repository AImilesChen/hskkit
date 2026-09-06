import Link from "next/link";
import { requireAdmin } from "@/lib/admin/access";
import { parseListQuery } from "@/lib/admin/domain";
import { listAdminUsers } from "@/lib/admin/repository";
import { Badge, DateTime, Pagination } from "../components";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export default async function AdminUsersPage({ searchParams }: Props) {
  const raw = await searchParams; const q = typeof raw.q === "string" ? raw.q : ""; const status = typeof raw.status === "string" ? raw.status : ""; const access = typeof raw.access === "string" ? raw.access : ""; const page = typeof raw.page === "string" ? raw.page : "1";
  const parsed = parseListQuery(new URLSearchParams({ q, page })); const { env } = await requireAdmin(); const data = await listAdminUsers(env.LEARNING_DB, { ...parsed, status, access });
  return <section><div className="admin-section-heading"><div><h2>Users</h2><p>Registration identity and effective access. Emails are masked.</p></div></div>
    <form className="admin-filters"><label><span>Search users</span><input name="q" defaultValue={q} placeholder="Name, email or user ID" /></label><label><span>Account</span><select name="status" defaultValue={status}><option value="">All</option><option value="active">Active</option><option value="deleted">Deleted</option></select></label><label><span>Access</span><select name="access" defaultValue={access}><option value="">All</option><option value="free">Free</option><option value="trial">Trial</option><option value="pro_monthly">Pro monthly</option><option value="pro_yearly">Pro yearly</option></select></label><button>Apply</button></form>
    <div className="admin-table-shell"><table><thead><tr><th>User</th><th>Email</th><th>Access</th><th>Status</th><th>Registered</th><th></th></tr></thead><tbody>{data.items.map((row) => <tr key={String(row.user_id)}><td><strong>{String(row.display_name)}</strong><small>{String(row.user_id)}</small></td><td>{String(row.email || "—")}</td><td><Badge tone={row.access_state === "free" ? "neutral" : "good"}>{String(row.access_state)}</Badge></td><td>{String(row.status)}</td><td><DateTime value={row.created_at} /></td><td><Link href={`/admin/users/${encodeURIComponent(String(row.user_id))}`} prefetch={false}>Details</Link></td></tr>)}</tbody></table></div>
    <Pagination path="/admin/users" meta={data.meta} params={{ q, status, access }} />
  </section>;
}
