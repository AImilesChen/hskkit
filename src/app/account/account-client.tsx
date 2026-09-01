"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Account = { userId: string; displayName: string; timezone: string; status: "active" | "deleted" };
type AccountView = { account: Account | null; connection: "google" | "sync_key" | null; guest: { hasData: boolean; attempts: number; learningSessions: number; plannerVersions: number; revision: number } };
type MergePreview = { id: string; mergeKey: string; expiresAt: string; preview: { accountAttempts: number; guestAttempts: number; accountLearningSessions: number; guestLearningSessions: number; additions: number; sessionAdditions: number; conflicts: number; strategy: string; plannerVersions: number } };
type IconName = "learn" | "spark" | "profile" | "devices" | "billing" | "gift" | "privacy" | "clock" | "arrow";

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
  const [busy, setBusy] = useState(false);
  const [timezone, setTimezone] = useState("UTC");
  const [detectedTimezone, setDetectedTimezone] = useState("UTC");
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const refresh = async () => {
    try {
      const data = await json("/api/v1/account");
      setView(data);
      if (data.account?.timezone) setTimezone(data.account.timezone);
      if (data.account?.status === "active") {
        const results = await Promise.allSettled([
          json("/api/v1/account/streak"),
          json(`/api/v1/account/sync?deviceId=${encodeURIComponent(syncDeviceId())}`),
          json("/api/v1/commercial/subscription"),
          json("/api/v1/ai"),
          json("/api/v1/commercial/referrals"),
        ]);
        const setters = [setStreak, setSync, setSubscription, setAiQuota, setReferrals];
        results.forEach((result, index) => {
          if (result.status === "fulfilled") setters[index](result.value);
          else setError(current => current || (result.reason instanceof Error ? result.reason.message : "LOAD_FAILED"));
        });
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "LOAD_FAILED"); }
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
    try { const result = await run(); setMessage(success); await refresh(); return result; }
    catch (cause) { setError(cause instanceof Error ? cause.message : "REQUEST_FAILED"); }
    finally { setBusy(false); }
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

  if (!view) return <div className="state account-loading" role="status"><span className="account-loader"/><h2>Loading your account…</h2><p>Bringing your learning progress and access together.</p></div>;

  const tier = subscription?.capabilities?.tier === "pro" ? "Pro" : "Free";
  const currentDeviceId = typeof window === "undefined" ? "" : localStorage.getItem("hskkit_device") ?? "";
  const currentDevice = sync?.devices?.find((device: any) => device.device_id === currentDeviceId);
  const remainingCredits = aiQuota?.quota?.remaining ?? 0;

  return <div className="account-overview-shell">
    {error && <div className="account-alert error" role="alert"><strong>Could not complete that action.</strong><span>{error}</span><button onClick={() => void refresh()}>Retry</button></div>}
    {message && <div className="account-alert success" role="status">{message}</div>}

    {checkoutSuccess && view.account?.status === "active" && <section className="account-banner success" role="status">
      <div><p className="account-kicker">Checkout complete</p><h2>{tier === "Pro" ? "Pro is ready" : "Activating Pro…"}</h2><p>{tier === "Pro" ? "Focused Review, AI credits and expanded sync are active." : "Stripe accepted the test checkout. Refresh shortly while the signed webhook activates access."}</p></div>
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
      <section className="account-hero">
        <div className="account-hero-copy">
          <p className="account-kicker">Welcome back</p>
          <h2>{view.account.displayName}</h2>
          <p>{view.connection === "google" ? "Signed in with Google" : "Private account sync enabled"} · {tier} plan</p>
          <div className="account-hero-actions"><Link className="btn account-primary-action" href="/today">Continue today’s learning <AccountIcon name="arrow"/></Link><Link className="account-text-link" href="/review">Open Review</Link></div>
        </div>
        <div className="account-learning-snapshot" aria-label="Learning snapshot">
          <div className="account-section-label"><AccountIcon name="learn"/><span>Learning snapshot</span></div>
          <strong>{streak?.current ?? 0}</strong>
          <span>day current streak</span>
          <small>Longest {streak?.longest ?? 0} days · Last activity {streak?.lastLearningDay ?? "not yet"}</small>
        </div>
      </section>

      {referrals?.access?.source === "trial" && <section className="account-banner trial" role="status">
        <div><p className="account-kicker">Welcome trial active</p><h2>Your 7-day Pro trial is active</h2><p>Pro study and review access is enabled until {new Date(referrals.access.endsAt).toLocaleDateString()} · {aiQuota?.quota?.remaining ?? 0} trial AI credits available. No card stored · no automatic charge.</p></div>
        <Link className="btn secondary" href="/pricing#ai-value">See what AI credits can do</Link>
      </section>}

      <div className="account-main-grid">
        <section className="card account-access-card">
          <div className="account-card-heading"><span className="account-icon-tile"><AccountIcon name="spark"/></span><div><p className="account-kicker">Learning access</p><h2>{tier} plan</h2></div><span className={`account-plan-badge ${tier.toLowerCase()}`}>{tier}</span></div>
          {tier === "Pro" ? <p>Regular study and review are not limited by Free daily quotas. Focused Review, long-term history and 500 AI credits each month are included.</p> : <p>Continue with 10 new items and 20 review ratings each day. Upgrade for unlimited regular study and review.</p>}
          <div className="account-credit-panel">
            <div><span>AI credits</span><strong>{remainingCredits}</strong><small>available this period</small></div>
            <p>Credits are only for AI explanations and saved-plan suggestions—not regular review. Explanations use 1 credit; plan suggestions use 5 after a successful response.</p>
          </div>
          <div className="account-actions">{tier === "Pro" ? <><Link className="btn secondary" href="/mistakes">Open AI Explanation</Link><Link className="btn secondary" href="/planner">Open Planner AI tips</Link></> : <Link className="btn" href="/pricing">Compare Pro</Link>}<Link className="account-text-link" href="/pricing#ai-value">See what credits do</Link></div>
        </section>

        <aside className="card account-status-card">
          <p className="account-kicker">At a glance</p>
          <dl><div><dt>Plan</dt><dd>{tier}</dd></div><div><dt>AI credits</dt><dd>{remainingCredits}</dd></div><div><dt>Devices</dt><dd>{sync?.devices?.length ?? 0} / {sync?.capabilities?.syncDevices ?? 1}</dd></div><div><dt>Timezone</dt><dd>{view.account.timezone || detectedTimezone}</dd></div></dl>
        </aside>
      </div>

      <section className="account-settings-section">
        <div className="account-section-heading"><div><p className="account-kicker">Manage your account</p><h2>Quick settings</h2></div><p>Open only what you need. Your learning actions stay at the top.</p></div>
        <div className="account-settings-list">
          <details className="account-setting" id="profile">
            <summary><span className="account-icon-tile"><AccountIcon name="profile"/></span><span><strong>Profile & sign-in</strong><small>{view.connection === "google" ? "Google connected" : "Private sign-in connected"} · Learning timezone</small></span><span className="account-setting-action">Manage</span></summary>
            <div className="account-setting-content account-form">
              <div className="account-field-summary"><span>Display name</span><strong>{view.account.displayName}</strong></div>
              <label>Learning timezone<input value={timezone} onChange={(event) => setTimezone(event.target.value)} /><small>Automatically detected as {detectedTimezone}. This controls learning-day and streak boundaries.</small></label>
              <button className="btn secondary" disabled={busy || timezone === view.account.timezone} onClick={() => void act(() => json("/api/v1/account", { method: "POST", body: JSON.stringify({ action: "timezone", timezone }) }), "Timezone updated. Streak recalculated.")}>Save timezone</button>
            </div>
          </details>

          <details className="account-setting" id="devices">
            <summary><span className="account-icon-tile"><AccountIcon name="devices"/></span><span><strong>Devices & sync</strong><small>{sync?.devices?.length ?? 0} of {sync?.capabilities?.syncDevices ?? 1} device slots in use</small></span><span className="account-setting-action">Manage</span></summary>
            <div className="account-setting-content">
              <div className="account-sync-summary"><div><span className="account-status-dot"/><div><strong>Current device</strong><small>Last synced {formatDateTime(currentDevice?.last_seen_at)}</small></div></div><button className="btn secondary" disabled={busy} onClick={checkpoint}>Check sync</button></div>
              {!!sync?.devices?.length && <ul className="account-device-list">{sync.devices.map((device: any) => <li key={device.device_id}><div><strong>{device.device_id === currentDeviceId ? "Current device" : "Connected device"}</strong><small>Last synced {formatDateTime(device.last_seen_at)}</small></div>{device.device_id !== currentDeviceId && <button className="account-remove-action" disabled={busy} onClick={() => void removeDevice(device.device_id)}>Remove</button>}</li>)}</ul>}
              {sync?.capabilities?.tier === "free" && <p className="account-note">Free includes one device. Pro includes three active devices.</p>}
            </div>
          </details>

          <details className="account-setting" id="billing">
            <summary><span className="account-icon-tile"><AccountIcon name="billing"/></span><span><strong>Membership & billing</strong><small>{tier} plan · {subscription?.subscription?.status ?? "No active subscription"}</small></span><span className="account-setting-action">Billing</span></summary>
            <div className="account-setting-content">
              {!subscription?.subscription ? <><p>You are on Free. Monthly and yearly Pro use the same account access.</p><Link className="btn" href="/pricing">View Pro pricing</Link></> : <>
                <p><strong>{subscription.subscription.planId === "pro_yearly" ? "Pro Yearly" : "Pro Monthly"}</strong> · {subscription.subscription.status}</p>
                <p>Access status: <strong>{subscription.entitlement?.status ?? "pending"}</strong>{subscription.subscription.currentPeriodEnd ? ` · Current period ends ${new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString()}` : ""}</p>
                <div className="account-actions">{subscription.subscription.cancelAtPeriodEnd ? <p className="account-note">Cancellation is scheduled. Pro remains available through the current period end.</p> : ["active","trialing"].includes(subscription.subscription.status) && <button className="btn secondary" disabled={busy} onClick={() => void manageSubscription("cancel")}>Cancel at period end</button>}{subscription.latestCharge?.status === "paid" && <button className="btn secondary" disabled={busy} onClick={() => void manageSubscription("request_refund")}>Request eligible refund</button>}</div>
                <p className="account-note">Refund review: within 7 days of the charge and no more than 10 AI credits used.</p>
              </>}
            </div>
          </details>

          <details className="account-setting" id="referrals">
            <summary><span className="account-icon-tile"><AccountIcon name="gift"/></span><span><strong>Referral rewards</strong><small>{referrals?.bonusCredits ?? 0} bonus AI credits available</small></span><span className="account-setting-action">View</span></summary>
            <div className="account-setting-content">
              <p>Invite friends to learn for 3 different days and complete 30 real learning actions.</p>
              <div className="account-actions"><button className="btn" disabled={busy || !referrals?.sharePath} onClick={() => void act(async () => { await navigator.clipboard.writeText(`${window.location.origin}${referrals.sharePath}`); return {}; }, "Referral link copied.")}>Copy referral link</button></div>
              <p className="account-note">{referrals?.bonusCredits ?? 0} bonus AI credits are available until the next reset on {referrals?.creditResetAt ? new Date(referrals.creditResetAt).toLocaleDateString() : "your account cycle"}. Qualified learning reward: 50 bonus credits plus 3 Pro days when you do not already have paid Pro. First paid subscription reward: another 150 credits plus 14 Pro days after the 7-day refund-risk window. Paid subscribers receive credits only; Stripe billing dates never change. Annual caps: 600 credits and 60 promotional Pro days.</p>
              {!!referrals?.referrals?.length && <ul className="account-referral-list">{referrals.referrals.map((item: any) => <li key={item.id}><strong>{item.referred_name ?? "Friend"}</strong><span>{referralProgress(item)}</span></li>)}</ul>}
            </div>
          </details>

          <details className="account-setting" id="privacy">
            <summary><span className="account-icon-tile"><AccountIcon name="privacy"/></span><span><strong>Privacy & data</strong><small>Export, deletion and account access</small></span><span className="account-setting-action">Manage</span></summary>
            <div className="account-setting-content">
              <p>Download your account data, check request status or start account deletion from the dedicated data page.</p>
              <div className="account-actions"><Link className="btn secondary" href="/account/data">Manage account data</Link><button className="btn secondary" disabled={busy} onClick={() => void act(() => json("/api/v1/account", { method: "POST", body: JSON.stringify({ action: "logout" }) }), "You are signed out.")}>Sign out</button></div>
              <div className="account-danger-zone"><strong>Need to delete your account?</strong><span>The confirmation and request history live on the data page so this action cannot be triggered accidentally.</span><Link href="/account/data">Review deletion options</Link></div>
            </div>
          </details>
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
