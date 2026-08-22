import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";

export const metadata: Metadata = {
  title: "Privacy Policy | HSKKit",
  description: "How HSKKit handles account, learning-progress, AI and service data.",
  alternates: { canonical: "https://hskkit.com/privacy-policy" },
  openGraph: { title: "Privacy Policy | HSKKit", description: "How HSKKit handles account, learning-progress, AI and service data.", url: "https://hskkit.com/privacy-policy", siteName: "HSKKit", type: "website" },
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="mb-8"><h2 className="text-h3 mb-4">{title}</h2><div className="space-y-4 text-body text-ink-secondary">{children}</div></section>;

export default function PrivacyPolicyPage() {
  return <><SiteHeader/><main className="section pt-20"><div className="max-w-[800px] mx-auto"><h1 className="text-h1 max-sm:text-[32px] mb-4">Privacy Policy</h1><p className="text-small text-ink-muted mb-8">Last updated: 2026-08-22</p>
    <Section title="What HSKKit stores"><p>HSKKit supports guest use and optional pseudonymous accounts. An account stores a display name, timezone, status and a secret sync key. The server stores learning progress needed for Today, practice, placement, mistakes, SRS, listening and planner features, including attempts, answers, results, review state and plan versions.</p><p>We also process security and service logs such as IP address, browser information, request time and error details. Audio issue reports contain the selected audio asset, issue type, optional details and report status.</p></Section>
    <Section title="Guest and account sync"><p>A secure cookie identifies a guest or signed-in account. If you choose to merge guest work into an account, HSKKit copies eligible learning state to the account and records the merge so the same guest state is not merged twice. The sync key is an authentication secret: keep it private.</p></Section>
    <Section title="AI features"><p>When you request an AI explanation or study-plan help, HSKKit sends a bounded prompt to the configured AI service provider. The prompt can include the relevant exercise, your answer, or plan inputs; it does not include the account sync key. We store operation status, quota usage, a request hash, provider request identifier, token counts and the validated response or failure code so retries and quota charging remain consistent.</p><p>AI is optional. If the provider is unavailable or output fails validation, HSKKit returns a non-AI fallback and does not charge AI quota for that failed operation.</p></Section>
    <Section title="Service providers and analytics"><p>Cloudflare provides hosting, network security and server-side data storage. The configured AI provider processes only requests you initiate. Plausible Analytics is the primary aggregated analytics service; Google Analytics may be enabled as a configured fallback. These service providers process data to deliver, secure or measure HSKKit and not for HSKKit to sell personal data.</p></Section>
    <Section title="Retention and your choices"><p>Learning and account records are retained while the account is active and as needed for security, integrity and legal obligations. You can use core study pages as a guest, avoid optional AI requests, clear local browser data, or request account deletion. Deleting an account disables further authenticated sync and removes or de-identifies associated records according to the deletion workflow and applicable retention duties.</p></Section>
    <Section title="Contact"><p>To access, correct or delete account data, or ask a privacy question, email <a href="mailto:support@hskkit.com" className="text-primary hover:underline">support@hskkit.com</a>. Never send your sync key by email.</p></Section>
  </div></main><SiteFooter/></>;
}
