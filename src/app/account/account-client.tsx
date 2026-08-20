"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Account = { userId: string; displayName: string; timezone: string; status: "active" | "deleted" };
type AccountView = { account: Account | null; guest: { hasData: boolean; attempts: number; plannerVersions: number; revision: number } };
type MergePreview = { id: string; mergeKey: string; expiresAt: string; preview: { accountAttempts: number; guestAttempts: number; additions: number; conflicts: number; strategy: string; plannerVersions: number } };

async function json(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) }, cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "REQUEST_FAILED");
  return data;
}

export default function AccountClient() {
  const [view, setView] = useState<AccountView>();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [syncKey, setSyncKey] = useState("");
  const [merge, setMerge] = useState<MergePreview>();
  const [streak, setStreak] = useState<any>();
  const [sync, setSync] = useState<any>();
  const [busy, setBusy] = useState(false);
  const [timezone, setTimezone] = useState("UTC");

  const refresh = async () => {
    try {
      const data = await json("/api/v1/account");
      setView(data);
      if (data.account?.timezone) setTimezone(data.account.timezone);
      if (data.account?.status === "active") {
        const [streakData, syncData] = await Promise.all([json("/api/v1/account/streak"), json("/api/v1/account/sync")]);
        setStreak(streakData);
        setSync(syncData);
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

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await act(() => json("/api/v1/account", { method: "POST", body: JSON.stringify({ action: "create", displayName: form.get("displayName"), timezone }) }), "Sync account created. Save the key before leaving this page.");
    if (result?.syncKey) setSyncKey(result.syncKey);
  };
  const connect = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await act(() => json("/api/v1/account", { method: "POST", body: JSON.stringify({ action: "connect", syncKey: form.get("syncKey") }) }), "This device is connected.");
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
    const deviceId = localStorage.getItem("hskkit_device") ?? crypto.randomUUID();
    localStorage.setItem("hskkit_device", deviceId);
    const result = await act(() => json("/api/v1/account/sync", { method: "POST", body: JSON.stringify({ clientRevision: sync.revision, deviceId }) }), "Device is synced to the current server revision.");
    if (result) setSync({ ...sync, revision: result.serverRevision, state: result.state });
  };

  if (!view) return <div className="state" role="status"><h2>Loading account…</h2><p>Checking your secure server-side account state.</p></div>;

  return <>
    {error && <div className="account-alert error" role="alert"><strong>Could not complete that action.</strong><span>{error}</span><button onClick={() => void refresh()}>Retry</button></div>}
    {message && <div className="account-alert success" role="status">{message}</div>}

    {!view.account ? <div className="account-grid">
      <form className="card account-form" onSubmit={create}>
        <h2>Create a sync account</h2>
        <p>Create a private recovery key. No email or payment details are required.</p>
        <label>Display name<input name="displayName" required maxLength={60} autoComplete="nickname" /></label>
        <label>Learning timezone<input value={timezone} onChange={(event) => setTimezone(event.target.value)} required /></label>
        <button className="btn" disabled={busy}>Create account</button>
      </form>
      <form className="card account-form" onSubmit={connect}>
        <h2>Connect this device</h2>
        <p>Enter the sync key shown when the account was created.</p>
        <label>Sync key<input name="syncKey" required minLength={20} autoComplete="off" /></label>
        <button className="btn secondary" disabled={busy}>Connect device</button>
      </form>
    </div> : view.account.status === "deleted" ? <div className="state"><h2>Account data deleted</h2><p>Learning data is no longer available. The minimal request audit remains visible on the data page.</p><Link className="btn secondary" href="/account/data">View request status</Link></div> : <div className="account-grid">
      <section className="card">
        <h2>{view.account.displayName}</h2>
        <p>Connected account · Server-side sync enabled</p>
        <div className="account-stat"><strong>{streak?.current ?? 0}</strong><span>current streak</span></div>
        <p>Longest: {streak?.longest ?? 0} · Last learning day: {streak?.lastLearningDay ?? "None yet"}</p>
        <p className="account-note">Calculated from completed Daily Sessions in {streak?.timezone ?? view.account.timezone}. Page visits do not count.</p>
      </section>
      <section className="card">
        <h2>Device sync</h2>
        <p>Server revision: <strong>{sync?.revision ?? "—"}</strong></p>
        <p>{sync?.conflicts?.length ? `${sync.conflicts.length} conflict audit record(s). Reload before retrying a stale change.` : "No recorded sync conflicts."}</p>
        <button className="btn" disabled={busy} onClick={checkpoint}>Check sync</button>
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
        <p>{view.guest.attempts} guest attempt(s) and {view.guest.plannerVersions} Planner version(s) are available. Nothing changes until you confirm.</p>
        {!merge ? <button className="btn" disabled={busy} onClick={preview}>Preview merge</button> : <div className="merge-preview">
          <dl><div><dt>Account attempts</dt><dd>{merge.preview.accountAttempts}</dd></div><div><dt>Guest attempts</dt><dd>{merge.preview.guestAttempts}</dd></div><div><dt>Planner versions</dt><dd>{merge.preview.plannerVersions}</dd></div><div><dt>New additions</dt><dd>{merge.preview.additions}</dd></div><div><dt>Conflicts</dt><dd>{merge.preview.conflicts}</dd></div></dl>
          <p>Rule: account records win exact-ID conflicts; unique guest history is added once.</p>
          <div className="account-actions"><button className="btn secondary" disabled={busy} onClick={() => void closeMerge("cancel")}>Cancel merge</button><button className="btn" disabled={busy} onClick={() => void closeMerge("confirm")}>Confirm merge</button></div>
        </div>}
      </section>}
      <section className="card"><h2>Disconnect</h2><p>Signing out leaves server data intact. Use the sync key to reconnect.</p><button className="btn secondary" disabled={busy} onClick={() => void act(() => json("/api/v1/account", { method: "POST", body: JSON.stringify({ action: "logout" }) }), "This device is disconnected.")}>Disconnect device</button></section>
    </div>}

    {syncKey && <div className="account-key" role="status"><h2>Save your sync key now</h2><code>{syncKey}</code><p>This key is shown once. Anyone with it can access the learning account.</p></div>}
  </>;
}
