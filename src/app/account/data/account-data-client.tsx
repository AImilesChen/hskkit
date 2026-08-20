"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RequestItem = { id: string; type: "export" | "delete"; state: string; attempt: number; requestedAt: string; updatedAt: string; failureCode?: string };
type View = { accountStatus: "active" | "deleted"; requests: RequestItem[]; audit: Array<{ id: string; action: string; result: string; created_at: string }> };
async function api(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) }, cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "REQUEST_FAILED");
  return data;
}

export default function AccountDataClient() {
  const [view, setView] = useState<View>();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = async () => { try { setView(await api("/api/v1/account/data-requests")); } catch (cause) { setError(cause instanceof Error ? cause.message : "LOAD_FAILED"); } };
  useEffect(() => { void refresh(); }, []);
  const act = async (body: unknown, success: string, method: "POST" | "PATCH" = "PATCH") => {
    setBusy(true); setError(""); setMessage("");
    try { await api("/api/v1/account/data-requests", { method, body: JSON.stringify(body) }); setMessage(success); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "REQUEST_FAILED"); }
    finally { setBusy(false); }
  };
  if (!view) return <div className="state"><h2>Loading account data…</h2><p>Reading recoverable request and audit state.</p>{error && <p role="alert">{error}</p>}</div>;
  return <>
    {error && <div className="account-alert error" role="alert"><strong>Action failed.</strong><span>{error}</span><button onClick={() => void refresh()}>Retry load</button></div>}
    {message && <div className="account-alert success" role="status">{message}</div>}
    <div className="account-grid">
      <section className="card">
        <h2>Export learning data</h2>
        <p>Creates a private JSON snapshot with account, learning, request and audit records. Ready files expire after 24 hours.</p>
        <button className="btn" disabled={busy || view.accountStatus !== "active"} onClick={() => void act({ type: "export", idempotencyKey: crypto.randomUUID() }, "Export requested.", "POST")}>Request export</button>
      </section>
      <section className="card account-form danger-zone">
        <h2>Delete account learning data</h2>
        <p>Deletion is staged: request → confirm → process. You can cancel before processing. Minimal request audit remains.</p>
        <label>Type DELETE to request deletion<input placeholder="DELETE" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" /></label>
        <button className="btn danger" disabled={busy || view.accountStatus !== "active" || confirmation !== "DELETE"} onClick={() => void act({ type: "delete", confirmation, idempotencyKey: crypto.randomUUID() }, "Deletion requested. Confirm or cancel below.", "POST")}>Request deletion</button>
      </section>
    </div>

    <section className="account-list" aria-labelledby="requests-title">
      <h2 id="requests-title">Requests</h2>
      {view.requests.length === 0 ? <div className="state"><h3>No data requests</h3><p>Export and deletion requests will appear here with recoverable status.</p></div> : view.requests.map((item) => <article className="card request-row" key={item.id}>
        <div><span className={`request-state ${item.state}`}>{item.state}</span><h3>{item.type === "export" ? "Account export" : "Account deletion"}</h3><p>Attempt {item.attempt} · Updated {new Date(item.updatedAt).toLocaleString()}</p>{item.failureCode && <p className="request-error">Failure: {item.failureCode}</p>}</div>
        <div className="account-actions">
          {item.type === "export" && item.state === "requested" && <button className="btn" disabled={busy} onClick={() => void act({ requestId: item.id, action: "process" }, "Export is ready.")}>Prepare export</button>}
          {item.type === "export" && item.state === "ready" && <a className="btn" href={`/api/v1/account/data-requests?download=${encodeURIComponent(item.id)}`}>Download JSON</a>}
          {item.type === "delete" && item.state === "requested" && <button className="btn danger" disabled={busy || confirmation !== "DELETE"} onClick={() => void act({ requestId: item.id, action: "confirm", confirmation }, "Deletion confirmed. You can still cancel before processing.")}>Confirm deletion</button>}
          {item.type === "delete" && item.state === "confirmed" && <button className="btn danger" disabled={busy} onClick={() => void act({ requestId: item.id, action: "process" }, "Account learning data deleted.")}>Delete now</button>}
          {["requested", "confirmed", "failed"].includes(item.state) && <button className="btn secondary" disabled={busy} onClick={() => void act({ requestId: item.id, action: "cancel" }, "Request cancelled. No data was deleted or overwritten.")}>Cancel</button>}
          {item.state === "failed" && <button className="btn" disabled={busy} onClick={() => void act({ requestId: item.id, action: "retry" }, "Request reset for retry.")}>Retry</button>}
        </div>
      </article>)}
    </section>

    <section className="account-list" aria-labelledby="audit-title"><h2 id="audit-title">Audit trail</h2><p>Minimal metadata only. Learning answers and sync keys are excluded.</p><div className="audit-list">{view.audit.length === 0 ? <p>No audit events.</p> : view.audit.map((event) => <div key={event.id}><strong>{event.action}</strong><span>{event.result}</span><time>{new Date(event.created_at).toLocaleString()}</time></div>)}</div></section>
    <p className="account-back"><Link href="/account">← Back to account & sync</Link></p>
  </>;
}
