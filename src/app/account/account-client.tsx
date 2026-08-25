"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Account = { userId: string; displayName: string; timezone: string; status: "active" | "deleted" };
type AccountView = { account: Account | null; connection: "google" | "sync_key" | null; guest: { hasData: boolean; attempts: number; learningSessions: number; plannerVersions: number; revision: number } };
type MergePreview = { id: string; mergeKey: string; expiresAt: string; preview: { accountAttempts: number; guestAttempts: number; accountLearningSessions: number; guestLearningSessions: number; additions: number; sessionAdditions: number; conflicts: number; strategy: string; plannerVersions: number } };

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

export default function AccountClient() {
  const [view, setView] = useState<AccountView>();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [merge, setMerge] = useState<MergePreview>();
  const [streak, setStreak] = useState<any>();
  const [sync, setSync] = useState<any>();
  const [subscription, setSubscription] = useState<any>();
  const [aiQuota, setAiQuota] = useState<any>();
  const [busy, setBusy] = useState(false);
  const [timezone, setTimezone] = useState("UTC");

  const refresh = async () => {
    try {
      const data = await json("/api/v1/account");
      setView(data);
      if (data.account?.timezone) setTimezone(data.account.timezone);
      if (data.account?.status === "active") {
        const [streakData, syncData, subscriptionData, aiData] = await Promise.all([json("/api/v1/account/streak"), json(`/api/v1/account/sync?deviceId=${encodeURIComponent(syncDeviceId())}`), json("/api/v1/commercial/subscription"), json("/api/v1/ai")]);
        setStreak(streakData);
        setSync(syncData);
        setSubscription(subscriptionData);
        setAiQuota(aiData);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "LOAD_FAILED"); }
  };
  useEffect(() => { setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"); void refresh(); }, []);

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
        setMessage(`Another device advanced progress to revision ${result.serverRevision}. This device reloaded the server snapshot and is ready to retry.`);
      } else {
        setSync({ ...sync, revision: result.serverRevision, state: result.state });
        setMessage("Device is synced to the current server revision.");
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

  if (!view) return <div className="state" role="status"><h2>Loading account…</h2><p>Checking your secure server-side account state.</p></div>;

  return <>
    {error && <div className="account-alert error" role="alert"><strong>Could not complete that action.</strong><span>{error}</span><button onClick={() => void refresh()}>Retry</button></div>}
    {message && <div className="account-alert success" role="status">{message}</div>}

    {!view.account ? <div className="mx-auto max-w-2xl">
      <section className="card account-form">
        <h2>Sign in to HSKKit</h2>
        <p>Google sign-in is the main way to save your private learning state and read the same progress on another device.</p>
        <Link className="btn" href="/login?returnTo=%2Faccount">Continue with Google</Link>
        <p className="account-note">Guest Placement, Today, and Planner remain available. After signing in, you can preview and confirm any eligible guest merge.</p>
      </section>
    </div> : view.account.status === "deleted" ? <div className="state"><h2>Account data deleted</h2><p>Learning data is no longer available. The minimal request audit remains visible on the data page.</p><Link className="btn secondary" href="/account/data">View request status</Link></div> : <div className="account-grid">
      <section className="card">
        <h2>{view.account.displayName}</h2>
        <p>{view.connection === "google" ? "Signed in with Google · Private server sync enabled" : "Connected with a Sync Key · Private server sync enabled"}</p>
        <div className="account-stat"><strong>{streak?.current ?? 0}</strong><span>current streak</span></div>
        <p>Longest: {streak?.longest ?? 0} · Last learning day: {streak?.lastLearningDay ?? "None yet"}</p>
        <p className="account-note">Calculated from completed Daily Sessions in {streak?.timezone ?? view.account.timezone}. Page visits do not count.</p>
      </section>
      <section className="card">
        <h2>Device sync</h2>
        <p>Server revision: <strong>{sync?.revision ?? "—"}</strong></p>
        <p><strong>{sync?.devices?.length ?? 0} of {sync?.capabilities?.syncDevices ?? 1}</strong> device slots active.</p>
        <p>{sync?.conflicts?.length ? `${sync.conflicts.length} conflict audit record(s). Reload before retrying a stale change.` : "No recorded sync conflicts."}</p>
        {!!sync?.devices?.length && <ul>{sync.devices.map((device: any) => <li key={device.device_id}>{device.device_id.slice(0, 12)}… <button className="btn secondary" disabled={busy} onClick={() => void removeDevice(device.device_id)}>Remove</button></li>)}</ul>}
        <button className="btn" disabled={busy} onClick={checkpoint}>Check sync</button>
        {sync?.capabilities?.tier === "free" && <p className="account-note">Free includes one device. Pro includes three active devices.</p>}
      </section>
      <section className="card">
        <h2>Learning access</h2>
        <p><strong>{subscription?.capabilities?.tier === "pro" ? "Pro" : "Free"}</strong></p>
        {subscription?.capabilities?.tier === "pro" ? <>
          <p>Study without the Free daily limits · Focused Review enabled · long-term history.</p>
          <p>500 AI credits refresh monthly. <strong>{aiQuota?.quota?.remaining ?? 0}</strong> remaining in this period.</p>
        </> : <>
          <p>Daily limits: {subscription?.capabilities?.dailyNewItems ?? 10} new items and {subscription?.capabilities?.dailyReviewGrades ?? 20} successful SRS ratings.</p>
          <p>Focused Review and AI credits unlock with Pro.</p>
          <Link className="btn" href="/pricing">Compare Pro</Link>
        </>}
      </section>
      <section className="card">
        <h2>Billing</h2>
        {!subscription?.subscription ? <><p>You are on Free. Monthly and yearly Pro use the same account entitlement.</p><Link className="btn" href="/pricing">View Pro pricing</Link></> : <>
          <p><strong>{subscription.subscription.planId === "pro_yearly" ? "Pro Yearly" : "Pro Monthly"}</strong> · {subscription.subscription.status}</p>
          <p>Entitlement: <strong>{subscription.entitlement?.status ?? "pending"}</strong>{subscription.subscription.currentPeriodEnd ? ` · Current period ends ${new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString()}` : ""}</p>
          {subscription.subscription.cancelAtPeriodEnd ? <p className="account-note">Cancellation is scheduled. Pro access remains available through the current period end.</p> : ["active","trialing"].includes(subscription.subscription.status) && <button className="btn secondary" disabled={busy} onClick={() => void manageSubscription("cancel")}>Cancel at period end</button>}
          {subscription.latestCharge?.status === "paid" && <button className="btn secondary" disabled={busy} onClick={() => void manageSubscription("request_refund")}>Request eligible refund</button>}
          <p className="account-note">Refund review: within 7 days of the charge and no more than 10 AI credits used. An approved full refund revokes Pro access through Stripe webhook confirmation.</p>
        </>}
      </section>
      <section className="card account-form">
        <h2>Learning timezone</h2>
        <label>IANA timezone<input value={timezone} onChange={(event) => setTimezone(event.target.value)} /></label>
        <button className="btn secondary" disabled={busy} onClick={() => void act(() => json("/api/v1/account", { method: "POST", body: JSON.stringify({ action: "timezone", timezone }) }), "Timezone updated. Streak recalculated.")}>Save timezone</button>
      </section>
      <section className="card">
        <h2>Account data</h2>
        <p>Request an export, cancel a pending request, retry a failure, or delete account learning data.</p>
        <Link className="btn secondary" href="/account/data">Manage account data</Link>
      </section>
      {view.guest.hasData && <section className="card account-merge">
        <h2>Guest progress found</h2>
        <p>{view.guest.attempts} guest attempt(s), {view.guest.learningSessions} Placement/Practice session(s), and {view.guest.plannerVersions} Planner version(s) are available. Nothing changes until you confirm.</p>
        {!merge ? <button className="btn" disabled={busy} onClick={preview}>Preview merge</button> : <div className="merge-preview">
          <dl><div><dt>Account attempts</dt><dd>{merge.preview.accountAttempts}</dd></div><div><dt>Guest attempts</dt><dd>{merge.preview.guestAttempts}</dd></div><div><dt>Guest learning sessions</dt><dd>{merge.preview.guestLearningSessions}</dd></div><div><dt>Planner versions</dt><dd>{merge.preview.plannerVersions}</dd></div><div><dt>New attempts</dt><dd>{merge.preview.additions}</dd></div><div><dt>New learning sessions</dt><dd>{merge.preview.sessionAdditions}</dd></div><div><dt>Conflicts</dt><dd>{merge.preview.conflicts}</dd></div></dl>
          <p>Rule: account records win exact-ID conflicts; unique guest history is added once.</p>
          <div className="account-actions"><button className="btn secondary" disabled={busy} onClick={() => void closeMerge("cancel")}>Cancel merge</button><button className="btn" disabled={busy} onClick={() => void closeMerge("confirm")}>Confirm merge</button></div>
        </div>}
      </section>}
      <section className="card"><h2>Sign out</h2><p>Signing out hides private account data in this browser. Server data remains available after the next Google sign-in.</p><button className="btn secondary" disabled={busy} onClick={() => void act(() => json("/api/v1/account", { method: "POST", body: JSON.stringify({ action: "logout" }) }), "You are signed out.")}>Sign out</button></section>
    </div>}
  </>;
}
