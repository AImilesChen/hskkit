"use client";

import { useState } from "react";

type Summary = { relationships: any[]; riskFlags: any[]; rewards: any[] };

export default function ReferralAdminClient() {
  const [token, setToken] = useState("");
  const [summary, setSummary] = useState<Summary>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const request = async (init?: RequestInit) => {
    const response = await fetch("/api/v1/commercial/admin/referrals", { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${token}`, ...(init?.headers ?? {}) }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "ADMIN_REQUEST_FAILED");
    return data;
  };
  const load = async () => {
    setBusy(true); setError("");
    try { setSummary(await request()); } catch (cause) { setError(cause instanceof Error ? cause.message : "ADMIN_REQUEST_FAILED"); }
    finally { setBusy(false); }
  };
  const act = async (action: "block_referral" | "revoke_reward", id: string) => {
    const reason = window.prompt("Required audit reason");
    if (!reason?.trim()) return;
    setBusy(true); setError("");
    try { await request({ method: "POST", body: JSON.stringify({ action, id, reason: reason.trim() }) }); setSummary(await request()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "ADMIN_REQUEST_FAILED"); }
    finally { setBusy(false); }
  };

  return <div className="mt-8 grid gap-6">
    <section className="rounded-2xl border border-slate-200 bg-white p-5"><label className="grid gap-2 font-bold text-slate-900">Operations token<input className="min-h-12 rounded-xl border border-slate-300 px-4 font-normal" type="password" autoComplete="off" value={token} onChange={event => setToken(event.target.value)} /></label><button className="mt-4 min-h-12 rounded-xl bg-blue-700 px-5 font-bold text-white disabled:opacity-50" disabled={busy || !token} onClick={() => void load()}>Load protected data</button>{error && <p className="mt-4 text-sm font-bold text-red-700" role="alert">{error}</p>}</section>
    {summary && <>
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-bold">Open anti-abuse flags ({summary.riskFlags.length})</h2><div className="mt-4 grid gap-3">{summary.riskFlags.length ? summary.riskFlags.map(flag => <article key={flag.id} className="rounded-xl bg-amber-50 p-4 text-sm"><strong>{flag.signal}</strong><p className="mt-1">{flag.detail}</p><p className="mt-1 text-slate-600">Relationship {flag.relationship_id}</p><button className="mt-3 min-h-11 rounded-lg border border-red-300 bg-white px-4 font-bold text-red-700" disabled={busy} onClick={() => void act("block_referral", flag.relationship_id)}>Block referral</button></article>) : <p className="text-slate-600">No open flags.</p>}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-bold">Recent relationships ({summary.relationships.length})</h2><div className="mt-4 grid gap-3">{summary.relationships.map(item => <article key={item.id} className="rounded-xl border border-slate-200 p-4 text-sm"><strong>{item.status} · {item.risk_status}</strong><p className="mt-1 break-all">Referrer {item.referrer_user_id} → referred {item.referred_user_id}</p>{item.status !== "blocked" && <button className="mt-3 min-h-11 rounded-lg border border-red-300 px-4 font-bold text-red-700" disabled={busy} onClick={() => void act("block_referral", item.id)}>Block</button>}</article>)}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-bold">Reward ledger ({summary.rewards.length})</h2><div className="mt-4 grid gap-3">{summary.rewards.map(reward => <article key={reward.id} className="rounded-xl border border-slate-200 p-4 text-sm"><strong>{reward.stage} · {reward.status}</strong><p className="mt-1">{reward.bonus_credits} credits · {reward.promo_days} Pro days</p>{reward.status === "issued" && <button className="mt-3 min-h-11 rounded-lg border border-red-300 px-4 font-bold text-red-700" disabled={busy} onClick={() => void act("revoke_reward", reward.id)}>Revoke reward</button>}</article>)}</div></section>
    </>}
  </div>;
}
