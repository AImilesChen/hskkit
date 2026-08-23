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

export default function AccountClient() {
  const [view, setView] = useState<AccountView>();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await json("/api/v1/account/sync", { method: "POST", body: JSON.stringify({ clientRevision: sync.revision, deviceId }) });
      if (result.state === "conflict") {
        const latest = await json("/api/v1/account/sync");
        setSync(latest);
        setMessage(`Another device advanced progress to revision ${result.serverRevision}. This device reloaded the server snapshot and is ready to retry.`);
      } else {
        setSync({ ...sync, revision: result.serverRevision, state: result.state });
        setMessage("Device is synced to the current server revision.");
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "REQUEST_FAILED"); }
    finally { setBusy(false); }
  };

  if (!view) return <div className="state" role="status"><h2>Loading account…</h2><p>Checking your secure server-side account state.</p></div>;

  return <>
    {error && <div className="account-alert error" role="alert"><strong>Could not complete that action.</strong><span>{error}</span><button onClick={() => void refresh()}>Retry</button></div>}
    {message && <div className="account-alert success" role="status">{message}</div>}

    {!view.account ? <div className="mx-auto max-w-2xl">
      <section className="card account-form">
        <h2>Sign in to HSKKit</h2>
        <p>Google sign-in is the main way to save your private learning state and read the same progress on another device.</p>
        <Link className="btn" href="/login">Continue with Google</Link>
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
