"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { settleInBatches } from "@/lib/account/auxiliary";
import { clearAccountSnapshot, loadAccountSnapshot } from "@/lib/account/browser";
import { normalizePlannerCompletions } from "@/lib/planner/domain";

type Account = { userId: string; displayName: string; timezone: string; status: "active" | "deleted"; createdAt: string };
type AccountView = { account: Account | null; connection: "google" | "sync_key" | null; guest: { hasData: boolean; attempts: number; learningSessions: number; plannerVersions: number; revision: number } };
type MergePreview = { id: string; mergeKey: string; expiresAt: string; preview: { accountAttempts: number; guestAttempts: number; accountLearningSessions: number; guestLearningSessions: number; additions: number; sessionAdditions: number; conflicts: number; strategy: string; plannerVersions: number } };
type IconName = "learn" | "spark" | "profile" | "devices" | "billing" | "gift" | "privacy" | "clock" | "arrow";
type AuxiliaryResource = "streak" | "sync" | "subscription" | "ai" | "referrals" | "planner";
type AuxiliaryState = Record<AuxiliaryResource, "loading" | "ready" | "error">;
const loadingAuxiliaryState = (): AuxiliaryState => ({ streak: "loading", sync: "loading", subscription: "loading", ai: "loading", referrals: "loading", planner: "loading" });

async function json(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) }, cache: "no-store" });
  const data = await response.json();
  if (!response.ok && !(response.status === 409 && data.state === "conflict")) throw new Error(data.error ?? "REQUEST_FAILED");
  return data;
}

function syncDeviceId() {
  const current = localStorage.getItem("hskkit_device");
  if (current) return current;
  const created = crypto.randomUUID();
  localStorage.setItem("hskkit_device", created);
  return created;
}

function referralProgress(item: any) {
  if (item.status === "blocked") return "Not eligible";
  if (item.risk_status !== "clear") return "Under review";
  if (item.status === "paid") return "Reward issued";
  if (item.status === "paid_pending") {
    const availableAt = item.paid_at ? new Date(Date.parse(item.paid_at) + 7 * 86_400_000).toLocaleDateString() : "after the 7-day refund-risk window";
    return `Paid reward pending · available ${availableAt}`;
  }
  if (item.status === "qualified") return "Reward issued · first paid reward not started";
  return `${Math.min(Number(item.learning_days ?? 0), 3)}/3 learning days · ${Math.min(Number(item.learning_units ?? 0), 30)}/30 learning actions`;
}

function formatDateTime(value?: string) {
  if (!value) return "Not synced yet";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Recently" : parsed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function memberSince(value?: string) {
  if (!value) return "Recently joined";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently joined" : date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function plannerCompletions(plan: any) {
  if (!plan || typeof window === "undefined") return {} as Record<string, string | null>;
  try {
    return normalizePlannerCompletions(JSON.parse(localStorage.getItem(`planner-task-completion:${plan.id}`) ?? "{}"));
  } catch { return {}; }
}

function AccountIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    learn: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v15h4.5a2.5 2.5 0 0 1 2.5 2.5z"/></>,
    spark: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2z"/><path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7z"/></>,
    profile: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6"/></>,
    devices: <><rect x="3" y="5" width="13" height="10" rx="2"/><path d="M8 19h8M12 15v4"/><rect x="17" y="9" width="4" height="9" rx="1"/></>,
    billing: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></>,
    gift: <><path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13"/><path d="M12 7H8.5a2 2 0 1 1 2-2c0 1.2 1.5 2 1.5 2Zm0 0h3.5a2 2 0 1 0-2-2c0 1.2-1.5 2-1.5 2Z"/></>,
    privacy: <><path d="M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
  };
  return <svg className="account-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function AccountClient() {
  const [view, setView] = useState<AccountView>();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [merge, setMerge] = useState<MergePreview>();
  const [streak, setStreak] = useState<any>();
  const [sync, setSync] = useState<any>();
  const [subscription, setSubscription] = useState<any>();
  const [aiQuota, setAiQuota] = useState<any>();
  const [referrals, setReferrals] = useState<any>();
  const [planner, setPlanner] = useState<any>();
  const [blogAdmin, setBlogAdmin] = useState(false);
  const [auxiliary, setAuxiliary] = useState<AuxiliaryState>(loadingAuxiliaryState);
  const [profileOpen, setProfileOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [referralsOpen, setReferralsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [timezone, setTimezone] = useState("UTC");
  const [detectedTimezone, setDetectedTimezone] = useState("UTC");
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const refreshGeneration = useRef(0);

  const loadAuxiliary = async (generation: number) => {
    const deviceId = syncDeviceId();
    const results = await settleInBatches([
      () => json("/api/v1/account/streak"),
      () => json(`/api/v1/account/sync?deviceId=${encodeURIComponent(deviceId)}`),
      () => json("/api/v1/commercial/subscription"),
      () => json("/api/v1/ai"),
      () => json("/api/v1/commercial/referrals"),
      () => json("/api/v1/planner"),
    ], 3);
    if (generation !== refreshGeneration.current) return;
    const keys: AuxiliaryResource[] = ["streak", "sync", "subscription", "ai", "referrals", "planner"];
    const setters = [setStreak, setSync, setSubscription, setAiQuota, setReferrals, setPlanner];
    results.forEach((result, index) => {
      setAuxiliary(current => ({ ...current, [keys[index]]: result.status === "fulfilled" ? "ready" : "error" }));
      if (result.status === "fulfilled") setters[index](result.value);
      else setError(current => current || (result.reason instanceof Error ? result.reason.message : "LOAD_FAILED"));
    });
  };

  const refresh = async (force = false) => {
    const generation = ++refreshGeneration.current;
    setError("");
    setView(undefined);
    setAuxiliary(loadingAuxiliaryState());
    [setStreak, setSync, setSubscription, setAiQuota, setReferrals, setPlanner].forEach(setter => setter(undefined));
    try {
      const data = await loadAccountSnapshot<AccountView>({ force });
      if (generation !== refreshGeneration.current) return;
      setView(data);
      if (data.account?.timezone) setTimezone(data.account.timezone);
      if (data.account?.status === "active") {
        void loadAuxiliary(generation).catch(cause => {
          if (generation !== refreshGeneration.current) return;
          setAuxiliary({ streak: "error", sync: "error", subscription: "error", ai: "error", referrals: "error", planner: "error" });
          setError(cause instanceof Error ? cause.message : "LOAD_FAILED");
        });
        void fetch("/api/v1/admin/blog/access", { cache: "no-store" })
          .then(response => { if (generation === refreshGeneration.current) setBlogAdmin(response.ok); })
          .catch(() => { if (generation === refreshGeneration.current) setBlogAdmin(false); });
      } else setBlogAdmin(false);
    } catch (cause) {
      if (generation === refreshGeneration.current) setError(cause instanceof Error ? cause.message : "LOAD_FAILED");
    }
  };

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setDetectedTimezone(detected);
    setTimezone(detected);
    const checkoutQuery = new URLSearchParams(window.location.search);
    setCheckoutSuccess(checkoutQuery.toString().includes("checkout=success") && checkoutQuery.get("checkout") === "success");
    void refresh();
  }, []);

  const act = async (run: () => Promise<any>, success: string) => {
    setBusy(true); setError(""); setMessage("");
    try { const result = await run(); setMessage(success); clearAccountSnapshot(); await refresh(); return result; }
    catch (cause) { setError(cause instanceof Error ? cause.message : "REQUEST_FAILED"); }
    finally { setBusy(false); }
  };
  const signOut = async () => {
    const result = await act(() => json("/api/v1/account", { method: "POST", body: JSON.stringify({ action: "logout" }) }), "You are signed out.");
    if (result?.state === "logged_out") window.dispatchEvent(new Event("hskkit:auth-changed"));
  };

  const preview = async () => {
    const result = await act(() => json("/api/v1/account/merge", { method: "POST", body: JSON.stringify({ action: "preview" }) }), "Review the merge before confirming.");
    if (result?.mergeKey) setMerge(result);
  };
  const closeMerge = async (action: "confirm" | "cancel") => {
    if (!merge) return;
    await act(() => json("/api/v1/account/merge", { method: "POST", body: JSON.stringify({ action, mergeId: merge.id, mergeKey: merge.mergeKey }) }), action === "confirm" ? "Guest progress merged once." : "Merge cancelled. Account data was not changed.");
    setMerge(undefined);
  };
  const checkpoint = async () => {
    if (!sync) return;
    const deviceId = syncDeviceId();
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await json("/api/v1/account/sync", { method: "POST", body: JSON.stringify({ clientRevision: sync.revision, deviceId }) });
      if (result.state === "conflict") {
        const latest = await json(`/api/v1/account/sync?deviceId=${encodeURIComponent(deviceId)}`);
        setSync(latest);
        setMessage("Progress changed on another device. This device has loaded the latest version and is ready to continue.");
      } else {
        setSync({ ...sync, revision: result.serverRevision, state: result.state });
        setMessage("Your learning progress is up to date.");
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "REQUEST_FAILED"); }
    finally { setBusy(false); }
  };
  const removeDevice = async (deviceId: string) => {
    await act(() => json("/api/v1/account/sync", { method: "DELETE", body: JSON.stringify({ deviceId }) }), "Device access removed.");
  };
  const manageSubscription = async (action: "cancel" | "request_refund") => {
    const success = action === "cancel" ? "Subscription will end at the current period end." : "Refund request submitted for review.";
    await act(() => json("/api/v1/commercial/subscription", { method: "POST", body: JSON.stringify({ action, idempotencyKey: crypto.randomUUID(), reason: "Requested from Account billing" }) }), success);
  };

  if (!view) return error ? <div className="state account-loading" role="alert"><h2>Account details unavailable</h2><p>{error === "ACCOUNT_STATUS_TIMEOUT" ? "The account service took too long to respond. Your data is safe." : error}</p><button className="btn" onClick={() => void refresh(true)}>Retry account details</button></div> : <div className="state account-loading" role="status"><span className="account-loader"/><h2>Loading your account…</h2><p>Bringing your learning progress and access together.</p></div>;

  const tier = auxiliary.subscription === "ready" ? subscription?.capabilities?.tier === "pro" ? "Pro" : "Free" : undefined;
  const currentDeviceId = typeof window === "undefined" ? "" : localStorage.getItem("hskkit_device") ?? "";
  const currentDevice = sync?.devices?.find((device: any) => device.device_id === currentDeviceId);
  const remainingCredits = auxiliary.ai === "ready" ? aiQuota?.quota?.remaining ?? 0 : 0;
  const creditAllowance = auxiliary.ai === "ready" ? aiQuota?.quota?.allowance ?? 0 : 0;
  const creditPercent = creditAllowance > 0 ? Math.min(100, Math.max(0, Math.round(remainingCredits / creditAllowance * 100))) : 0;
  const plan = auxiliary.planner === "ready" ? planner?.latest : undefined;
  const planTasks = plan?.sessions?.flatMap((session: any) => session.tasks ?? []) ?? [];
  const completedTasks = plannerCompletions(plan);
  const completedCount = planTasks.filter((task: any) => Object.prototype.hasOwnProperty.call(completedTasks, task.id)).length;
  const weeklyProgress = planTasks.length ? Math.round(completedCount / planTasks.length * 100) : 0;
  const nextPlanTask = planTasks.find((task: any) => !Object.prototype.hasOwnProperty.call(completedTasks, task.id));
  const dueReviews = auxiliary.planner === "ready" ? planner?.realSignals?.dueCards ?? 0 : null;
  const nextHref = nextPlanTask?.href ?? (dueReviews !== null && dueReviews > 0 ? "/review" : "/today");
  const nextTitle = nextPlanTask?.title ?? (dueReviews !== null && dueReviews > 0 ? `Review ${dueReviews} due item${dueReviews === 1 ? "" : "s"}` : "Start today’s learning");
  const referralItems: any[] | null = auxiliary.referrals === "ready" ? referrals?.referrals ?? [] : null;
  const referralCount = referralItems?.length ?? null;
  const qualifiedReferrals = referralItems?.filter((item: any) => ["qualified", "paid_pending", "paid"].includes(item.status)).length ?? null;
  const nextReward = !referralItems ? null : referralItems.some((item: any) => item.status === "paid_pending" && item.risk_status === "clear")
    ? "Paid reward pending after the refund-risk window"
    : referralItems.some((item: any) => item.risk_status !== "clear" && item.status !== "blocked")
      ? "Eligibility review in progress"
      : referralItems.some((item: any) => item.status === "qualified")
        ? "First paid subscription: +150 credits"
        : referralItems.some((item: any) => item.status === "signed_up" && item.risk_status === "clear") || referralItems.length === 0
          ? "3 learning days + 30 actions: +50 credits"
          : referralItems.every((item: any) => item.status === "paid")
            ? "All recorded rewards issued"
            : "No eligible reward pending";

  return <div className="account-overview-shell">
    {error && <div className="account-alert error" role="alert"><strong>Could not complete that action.</strong><span>{error}</span><button onClick={() => void refresh()}>Retry</button></div>}
    {message && <div className="account-alert success" role="status">{message}</div>}

    {checkoutSuccess && view.account?.status === "active" && <section className="account-banner success" role="status">
      <div><p className="account-kicker">Checkout complete</p><h2>{tier === "Pro" ? "Pro is ready" : "Activating Pro…"}</h2><p>{tier === "Pro" ? "Focused Review, AI credits and expanded sync are active." : "Stripe accepted the checkout. Refresh shortly while the signed webhook activates access."}</p></div>
      {tier === "Pro" && <Link className="btn" href="/review">Start Focused Review</Link>}
    </section>}

    {!view.account ? <section className="card account-signin">
      <span className="account-icon-tile"><AccountIcon name="profile"/></span>
      <p className="account-kicker">One secure account</p>
      <h2>Keep your HSK progress with you</h2>
      <p>Sign in with Google to continue learning across devices and manage your access in one place.</p>
      <Link className="btn account-primary-action" href="/login?returnTo=%2Faccount">Continue with Google</Link>
      <p className="account-note">You can keep using Placement, Today and Planner as a guest. Any eligible guest progress can be reviewed before it is merged.</p>
    </section> : view.account.status === "deleted" ? <div className="state"><h2>Account data deleted</h2><p>Learning data is no longer available. The minimal request status remains on the data page.</p><Link className="btn secondary" href="/account/data">View request status</Link></div> : <>
      <section className="account-profile-overview">
        <div className="account-identity-card">
          <div className="account-identity-top">
            <span className="account-avatar" aria-hidden="true">{view.account.displayName.trim().charAt(0).toUpperCase() || "H"}</span>
            <div className="account-identity-copy">
              <p className="account-kicker">Your learning account</p>
              <h2>{view.account.displayName}</h2>
              <p><span className="account-status-dot"/>{view.connection === "google" ? "Google connected" : "Private sync connected"}</p>
            </div>
            <span className={`account-plan-badge ${tier?.toLowerCase() ?? "pending"}`}>{tier ?? (auxiliary.subscription === "error" ? "Unavailable" : "Loading")}</span>
          </div>
          <dl className="account-identity-meta">
            <div><dt>Member since</dt><dd>{memberSince(view.account.createdAt)}</dd></div>
            <div><dt>Learning timezone</dt><dd>{view.account.timezone || detectedTimezone}</dd></div>
          </dl>
          <div className="account-identity-actions"><Link className="account-text-link" href="#profile" onClick={() => setProfileOpen(true)}>Edit profile</Link><Link className="account-text-link" href="#billing" onClick={() => setBillingOpen(true)}>Manage membership</Link></div>
        </div>

        <div className="account-study-focus">
          <div className="account-section-label"><AccountIcon name="learn"/><span>Your next study action</span></div>
          {auxiliary.planner !== "ready" ? <>
            <h2>{auxiliary.planner === "error" ? "Study plan unavailable" : "Loading your study plan…"}</h2>
            <p>{auxiliary.planner === "error" ? "We could not verify your current plan or due reviews. Retry before relying on these signals." : "Checking your saved plan and due reviews."}</p>
            {auxiliary.planner === "error" && <button className="btn account-primary-action" onClick={() => void refresh()}>Retry account details</button>}
          </> : <>
            <h2>{nextTitle}</h2>
            <p>{plan ? `HSK ${plan.inputs.goalLevel} plan · ${completedCount} of ${planTasks.length} weekly tasks complete` : dueReviews! > 0 ? "Clear due reviews first to keep your memory schedule current." : "No saved weekly plan yet. Start today or build one in Planner."}</p>
            <Link className="btn account-primary-action" href={nextHref}>Continue learning <AccountIcon name="arrow"/></Link>
            <div className="account-weekly-progress">
              <div><span>Weekly progress</span><strong>{planTasks.length ? `${weeklyProgress}%` : "Not created"}</strong></div>
              <div className="account-progress-track" aria-hidden="true"><span style={{ width: `${weeklyProgress}%` }}/></div>
            </div>
          </>}
        </div>
      </section>

      {auxiliary.referrals === "ready" && auxiliary.ai === "ready" && referrals?.access?.source === "trial" && <section className="account-banner trial" role="status">
        <div><p className="account-kicker">Welcome trial active</p><h2>Your 7-day Pro trial is active</h2><p>Pro study and review access is enabled until {new Date(referrals.access.endsAt).toLocaleDateString()} · {referrals.access.baseAiCredits} trial AI credits granted · {aiQuota.quota.remaining} total AI credits available. No card stored · no automatic charge.</p></div>
        <Link className="btn secondary" href="/pricing#ai-value">See what AI credits can do</Link>
      </section>}

      <section className="account-momentum-section" aria-labelledby="account-momentum-title">
        <div className="account-section-heading"><div><p className="account-kicker">Learning momentum</p><h2 id="account-momentum-title">Your real learning signals</h2></div><p>Only completed sessions and your saved plan are counted.</p></div>
        <div className="account-momentum-grid">
          <article><span className="account-metric-icon blue"><AccountIcon name="learn"/></span><strong>{auxiliary.planner === "ready" ? dueReviews : "—"}</strong><span>Due reviews</span><small>{auxiliary.planner === "ready" ? dueReviews! > 0 ? "Ready in Review" : "Nothing due now" : auxiliary.planner === "error" ? "Unavailable" : "Loading"}</small></article>
          <article><span className="account-metric-icon teal"><AccountIcon name="clock"/></span><strong>{auxiliary.streak === "ready" ? streak?.current ?? 0 : "—"}</strong><span>Current streak</span><small>{auxiliary.streak === "ready" ? "Completed learning days" : auxiliary.streak === "error" ? "Unavailable" : "Loading"}</small></article>
          <article><span className="account-metric-icon gold"><AccountIcon name="spark"/></span><strong>{auxiliary.streak === "ready" ? streak?.longest ?? 0 : "—"}</strong><span>Best streak</span><small>{auxiliary.streak === "ready" ? "Longest run of days" : auxiliary.streak === "error" ? "Unavailable" : "Loading"}</small></article>
          <article><span className="account-metric-icon slate"><AccountIcon name="profile"/></span><strong>{auxiliary.planner === "ready" && plan ? `${completedCount}/${planTasks.length}` : "—"}</strong><span>Weekly tasks</span><small>{auxiliary.streak === "ready" ? streak?.lastLearningDay ? `Last learned ${streak.lastLearningDay}` : "No completed session yet" : auxiliary.streak === "error" ? "Unavailable" : "Loading"}</small></article>
        </div>
      </section>

      <div className="account-benefits-grid">
        <section className="account-membership-card">
          <div className="account-card-heading"><span className="account-icon-tile gold"><AccountIcon name="spark"/></span><div><p className="account-kicker">Membership & AI</p><h2>{tier ? `${tier} learning access` : "Learning access"}</h2></div><span className={`account-plan-badge ${tier?.toLowerCase() ?? "pending"}`}>{tier ?? (auxiliary.subscription === "error" ? "Unavailable" : "Loading")}</span></div>
          {auxiliary.subscription !== "ready" || auxiliary.ai !== "ready" || auxiliary.referrals !== "ready" ? <div className="account-data-unavailable" role="status">
            <p>{[auxiliary.subscription, auxiliary.ai, auxiliary.referrals].includes("error") ? "Membership or AI details are unavailable. No plan or credit values are shown until they can be verified." : "Loading verified membership and AI details…"}</p>
            {[auxiliary.subscription, auxiliary.ai, auxiliary.referrals].includes("error") && <button className="btn secondary" onClick={() => void refresh()}>Retry account details</button>}
          </div> : <>
            <p>{tier === "Pro" ? referrals?.access?.source === "paid" ? "Unlimited regular study and review, Focused Review, expanded history and 500 AI credits each month are active." : referrals?.access?.source === "trial" ? `Unlimited regular study and review and Focused Review are active during your trial, with ${referrals.access.baseAiCredits} trial AI credits granted.` : "Unlimited regular study and review and Focused Review are active through your promotional Pro access. Your available AI credits are shown below." : "Keep learning free with daily study and review allowances, or compare Pro when you need more."}</p>
            <div className="account-credit-balance">
              <div className="account-credit-heading"><span>AI credit balance</span><strong>{remainingCredits}{creditAllowance > 0 ? <small> / {creditAllowance}</small> : null}</strong></div>
              {creditAllowance > 0 ? <div className="account-credit-track" role="progressbar" aria-label="AI credits remaining" aria-valuemin={0} aria-valuemax={creditAllowance} aria-valuenow={remainingCredits}><span style={{ width: `${creditPercent}%` }}/></div> : <div className="account-credit-track" aria-hidden="true"><span style={{ width: "0%" }}/></div>}
              <div className="account-credit-meta"><span>{aiQuota?.quota?.resetAt ? `Next reset ${new Date(aiQuota.quota.resetAt).toLocaleDateString()}` : "Next reset follows your billing period"} · {aiQuota?.quota?.used ?? 0} credits used</span><Link href="/pricing#ai-value">How credits work</Link></div>
            </div>
            <ul className="account-benefit-list"><li>Regular study and review never spend AI credits.</li><li>AI explanations use 1 credit after success.</li><li>AI plan suggestions use 5 credits after success.</li></ul>
            <div className="account-actions">{tier === "Pro" ? <><Link className="btn secondary" href="/mistakes">Open AI Explanation</Link><Link className="btn secondary" href="/planner">Open Planner AI tips</Link></> : <Link className="btn" href="/pricing">Compare Pro</Link>}</div>
          </>}
        </section>

        <aside className="account-reward-card">
          <div className="account-card-heading"><span className="account-icon-tile reward"><AccountIcon name="gift"/></span><div><p className="account-kicker">Invite & earn</p><h2>Referral rewards</h2></div></div>
          {auxiliary.referrals !== "ready" ? <div className="account-data-unavailable" role="status">
            <p>{auxiliary.referrals === "error" ? "Referral progress is unavailable. No reward totals are shown until they can be verified." : "Loading verified referral progress…"}</p>
            {auxiliary.referrals === "error" && <button className="btn secondary" onClick={() => void refresh()}>Retry account details</button>}
          </div> : <>
            <div className="account-reward-stats"><div><strong>{referralCount}</strong><span>Invited</span></div><div><strong>{qualifiedReferrals}</strong><span>Qualified</span></div><div><strong>{referrals?.bonusCredits ?? 0}</strong><span>Credits available</span></div></div>
            <div className="account-next-reward"><span>Next reward</span><strong>{nextReward}</strong><small>Rewards require real learning activity and pass eligibility checks.</small></div>
            <button className="btn" disabled={busy || !referrals?.sharePath} onClick={() => void act(async () => { await navigator.clipboard.writeText(`${window.location.origin}${referrals.sharePath}`); return {}; }, "Referral link copied.")}>Copy referral link</button>
            <Link className="account-text-link" href="#referrals" onClick={() => setReferralsOpen(true)}>View reward rules</Link>
          </>}
        </aside>
      </div>

      <section className="account-settings-section">
        <div className="account-section-heading"><div><p className="account-kicker">Account controls</p><h2>Manage your account</h2></div><p>Settings are grouped by task so you can scan and open only what you need.</p></div>

        <div className="account-settings-group">
          <div className="account-group-heading"><span className="account-icon-tile"><AccountIcon name="devices"/></span><div><h3>Learning & devices</h3><p>Profile, timezone and progress sync</p></div></div>
          <div className="account-settings-list">
            <details className="account-setting" id="profile" open={profileOpen} onToggle={(event) => setProfileOpen(event.currentTarget.open)}>
              <summary><span className="account-icon-tile"><AccountIcon name="profile"/></span><span><strong>Profile & sign-in</strong><small>{view.connection === "google" ? "Google connected" : "Private sign-in connected"} · Learning timezone</small></span><span className="account-setting-action">Manage</span></summary>
              <div className="account-setting-content account-form">
                <div className="account-field-summary"><span>Display name</span><strong>{view.account.displayName}</strong></div>
                <label>Learning timezone<input value={timezone} onChange={(event) => setTimezone(event.target.value)} /><small>Automatically detected as {detectedTimezone}. This controls learning-day and streak boundaries.</small></label>
                <button className="btn secondary" disabled={busy || timezone === view.account.timezone} onClick={() => void act(() => json("/api/v1/account", { method: "POST", body: JSON.stringify({ action: "timezone", timezone }) }), "Timezone updated. Streak recalculated.")}>Save timezone</button>
              </div>
            </details>
            <details className="account-setting" id="devices">
              <summary><span className="account-icon-tile"><AccountIcon name="devices"/></span><span><strong>Devices & sync</strong><small>{auxiliary.sync === "ready" ? `${sync?.devices?.length ?? 0} of ${sync?.capabilities?.syncDevices ?? 1} device slots in use` : auxiliary.sync === "error" ? "Sync details unavailable" : "Loading sync details"}</small></span><span className="account-setting-action">Manage</span></summary>
              <div className="account-setting-content">
                {auxiliary.sync !== "ready" ? <p>{auxiliary.sync === "error" ? "Sync details could not be verified. Retry account details before managing devices." : "Loading verified sync details…"}</p> : <><div className="account-sync-summary"><div><span className="account-status-dot"/><div><strong>Current device</strong><small>Last synced {formatDateTime(currentDevice?.last_seen_at)}</small></div></div><button className="btn secondary" disabled={busy} onClick={checkpoint}>Check sync</button></div>
                {!!sync?.devices?.length && <ul className="account-device-list">{sync.devices.map((device: any) => <li key={device.device_id}><div><strong>{device.device_id === currentDeviceId ? "Current device" : "Connected device"}</strong><small>Last synced {formatDateTime(device.last_seen_at)}</small></div>{device.device_id !== currentDeviceId && <button className="account-remove-action" disabled={busy} onClick={() => void removeDevice(device.device_id)}>Remove</button>}</li>)}</ul>}
                {sync?.capabilities?.tier === "free" && <p className="account-note">Free includes one device. Pro includes three active devices.</p>}</>}
              </div>
            </details>
          </div>
        </div>

        <div className="account-settings-group">
          <div className="account-group-heading"><span className="account-icon-tile gold"><AccountIcon name="billing"/></span><div><h3>Membership & rewards</h3><p>Subscription, billing and referral status</p></div></div>
          <div className="account-settings-list">
            <details className="account-setting" id="billing" open={billingOpen} onToggle={(event) => setBillingOpen(event.currentTarget.open)}>
              <summary><span className="account-icon-tile gold"><AccountIcon name="billing"/></span><span><strong>Membership & billing</strong><small>{auxiliary.subscription === "ready" ? `${tier} plan · ${subscription?.subscription?.status ?? "No active subscription"}` : auxiliary.subscription === "error" ? "Membership details unavailable" : "Loading membership details"}</small></span><span className="account-setting-action">Billing</span></summary>
              <div className="account-setting-content">
                {auxiliary.subscription !== "ready" ? <p>{auxiliary.subscription === "error" ? "Membership details could not be verified. Retry account details before managing billing." : "Loading verified membership details…"}</p> : !subscription?.subscription ? <><p>You are on Free. Monthly and yearly Pro use the same account access.</p><Link className="btn" href="/pricing">View Pro pricing</Link></> : <>
                  <p><strong>{subscription.subscription.planId === "pro_yearly" ? "Pro Yearly" : "Pro Monthly"}</strong> · {subscription.subscription.status}</p>
                  <p>Access status: <strong>{subscription.entitlement?.status ?? "pending"}</strong>{subscription.subscription.currentPeriodEnd ? ` · Current period ends ${new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString()}` : ""}</p>
                  <div className="account-actions">{subscription.subscription.cancelAtPeriodEnd ? <p className="account-note">Cancellation is scheduled. Pro remains available through the current period end.</p> : ["active","trialing"].includes(subscription.subscription.status) && <button className="btn secondary" disabled={busy} onClick={() => void manageSubscription("cancel")}>Cancel at period end</button>}{subscription.latestCharge?.status === "paid" && <button className="btn secondary" disabled={busy} onClick={() => void manageSubscription("request_refund")}>Request eligible refund</button>}</div>
                  <p className="account-note">Refund review: within 7 days of the charge and no more than 10 AI credits used.</p>
                </>}
              </div>
            </details>
            <details className="account-setting" id="referrals" open={referralsOpen} onToggle={(event) => setReferralsOpen(event.currentTarget.open)}>
              <summary><span className="account-icon-tile reward"><AccountIcon name="gift"/></span><span><strong>Referral rewards</strong><small>{auxiliary.referrals === "ready" ? `${referrals?.bonusCredits ?? 0} bonus AI credits available` : auxiliary.referrals === "error" ? "Reward details unavailable" : "Loading reward details"}</small></span><span className="account-setting-action">View</span></summary>
              <div className="account-setting-content">
                {auxiliary.referrals !== "ready" ? <p>{auxiliary.referrals === "error" ? "Referral details could not be verified. Retry account details before relying on reward totals." : "Loading verified referral details…"}</p> : <><p>Invite friends to learn for 3 different days and complete 30 real learning actions.</p>
                <div className="account-actions"><button className="btn" disabled={busy || !referrals?.sharePath} onClick={() => void act(async () => { await navigator.clipboard.writeText(`${window.location.origin}${referrals.sharePath}`); return {}; }, "Referral link copied.")}>Copy referral link</button></div>
                <p className="account-note">{referrals?.bonusCredits ?? 0} bonus AI credits are available until {referrals?.bonusExpiresAt ? new Date(referrals.bonusExpiresAt).toLocaleDateString() : "the displayed reward expiry"}. Qualified learning reward: 50 bonus credits plus 3 Pro days when you do not already have paid Pro. First paid subscription reward: another 150 credits plus 14 Pro days after the 7-day refund-risk window. Paid subscribers receive credits only; Stripe billing dates never change. Annual caps: 600 credits and 60 promotional Pro days.</p>
                {!!referrals?.referrals?.length && <ul className="account-referral-list">{referrals.referrals.map((item: any) => <li key={item.id}><strong>{item.referred_name ?? "Friend"}</strong><span>{referralProgress(item)}</span></li>)}</ul>}</>}
              </div>
            </details>
          </div>
        </div>

        {blogAdmin && <div className="account-settings-group">
          <div className="account-group-heading"><span className="account-icon-tile"><AccountIcon name="learn"/></span><div><h3>Blog publishing</h3><p>Private versioned publishing studio</p></div></div>
          <div className="account-settings-list"><div className="account-setting-content"><p>Create, preview, schedule, publish, restore and withdraw HSKKit articles.</p><Link className="btn secondary" href="/admin/blog">Open Blog studio</Link></div></div>
        </div>}

        <div className="account-settings-group">
          <div className="account-group-heading"><span className="account-icon-tile privacy"><AccountIcon name="privacy"/></span><div><h3>Privacy & account</h3><p>Export, deletion and sign-out controls</p></div></div>
          <div className="account-settings-list">
            <details className="account-setting" id="privacy">
              <summary><span className="account-icon-tile privacy"><AccountIcon name="privacy"/></span><span><strong>Privacy & data</strong><small>Export, deletion and account access</small></span><span className="account-setting-action">Manage</span></summary>
              <div className="account-setting-content">
                <p>Download your account data, check request status or start account deletion from the dedicated data page.</p>
                <div className="account-actions"><Link className="btn secondary" href="/account/data">Manage account data</Link><button className="btn secondary" disabled={busy} onClick={() => void signOut()}>Sign out</button></div>
                <div className="account-danger-zone"><strong>Need to delete your account?</strong><span>The confirmation and request history live on the data page so this action cannot be triggered accidentally.</span><Link href="/account/data">Review deletion options</Link></div>
              </div>
            </details>
          </div>
        </div>
      </section>

      {view.guest.hasData && <section className="card account-merge">
        <div className="account-card-heading"><span className="account-icon-tile"><AccountIcon name="clock"/></span><div><p className="account-kicker">Before you continue</p><h2>Guest progress found</h2></div></div>
        <p>{view.guest.attempts} guest attempt(s), {view.guest.learningSessions} Placement/Practice session(s), and {view.guest.plannerVersions} Planner version(s) are available. Nothing changes until you confirm.</p>
        {!merge ? <button className="btn" disabled={busy} onClick={preview}>Preview merge</button> : <div className="merge-preview">
          <dl><div><dt>Account attempts</dt><dd>{merge.preview.accountAttempts}</dd></div><div><dt>Guest attempts</dt><dd>{merge.preview.guestAttempts}</dd></div><div><dt>Guest learning sessions</dt><dd>{merge.preview.guestLearningSessions}</dd></div><div><dt>Planner versions</dt><dd>{merge.preview.plannerVersions}</dd></div><div><dt>New attempts</dt><dd>{merge.preview.additions}</dd></div><div><dt>New learning sessions</dt><dd>{merge.preview.sessionAdditions}</dd></div><div><dt>Conflicts</dt><dd>{merge.preview.conflicts}</dd></div></dl>
          <p>Rule: account records win exact-ID conflicts; unique guest history is added once.</p>
          <div className="account-actions"><button className="btn secondary" disabled={busy} onClick={() => void closeMerge("cancel")}>Cancel merge</button><button className="btn" disabled={busy} onClick={() => void closeMerge("confirm")}>Confirm merge</button></div>
        </div>}
      </section>}
    </>}
  </div>;
}
