import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requestIdentity } from "@/lib/account/identity";
import { isEmailAllowed } from "@/lib/blog/domain";

export const dynamic = "force-dynamic";

export default async function BlogAdminDiagnostics() {
  const identity = await requestIdentity();
  if (!identity.account || identity.connection !== "google") return <p>Google session required.</p>;
  const env = getCloudflareContext().env;
  const row = await env.LEARNING_DB.prepare("SELECT email,email_verified FROM account_oauth_identities WHERE user_id=? AND provider='google' ORDER BY updated_at DESC LIMIT 1")
    .bind(identity.account.userId).first<{ email: string | null; email_verified: number }>();
  const email = row?.email_verified === 1 ? row.email?.trim().toLowerCase() : undefined;
  return <main>
    <h1>Blog access check</h1>
    <p>Google session: yes</p>
    <p>Verified email record: {email ? "yes" : "no"}</p>
    <p>Original list configured: {env.BLOG_ADMIN_EMAILS ? "yes" : "no"}</p>
    <p>Additional list configured: {env.BLOG_ADMIN_EXTRA_EMAILS ? "yes" : "no"}</p>
    <p>Original list match: {isEmailAllowed(email, env.BLOG_ADMIN_EMAILS) ? "yes" : "no"}</p>
    <p>Additional list match: {isEmailAllowed(email, env.BLOG_ADMIN_EXTRA_EMAILS) ? "yes" : "no"}</p>
  </main>;
}
