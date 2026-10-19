"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AiFeature, AiOutput } from "@/lib/ai/domain";

type Quota = { allowance: number; used: number; reserved: number; remaining: number; resetAt: string };
type Fallback = { charged: false; title: string; summary: string; links: Array<{ label: string; href: string }> };
type Props = { feature: Exclude<AiFeature, "image_mistake">; exerciseId?: string; reviewCardId?: string };

export default function AiAssist({ feature, exerciseId, reviewCardId }: Props) {
  const [quota, setQuota] = useState<Quota>();
  const [output, setOutput] = useState<AiOutput>();
  const [fallback, setFallback] = useState<Fallback>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [accountRequired, setAccountRequired] = useState(false);
  const [proRequired, setProRequired] = useState(false);
  const key = useRef<string | undefined>(undefined);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/ai", { cache: "no-store" }).then(async (response) => ({ status: response.status, value: await response.json().catch(() => undefined) })).then(({ status, value }) => { if (!active) return; if (status === 401 && value?.error === "AI_ACCOUNT_REQUIRED") setAccountRequired(true); else { if (!value?.capabilities?.aiMonthlyCredits) setProRequired(true); if (value?.quota) setQuota(value.quota); } }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function generate() {
    if (busy) return;
    setBusy(true); setMessage(""); setFallback(undefined);
    const idempotencyKey = key.current ?? crypto.randomUUID(); key.current = idempotencyKey;
    try {
      const response = await fetch("/api/v1/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ feature, exerciseId, reviewCardId, idempotencyKey }) });
      const payload = await response.json();
      if (response.status === 401 && payload.error === "AI_ACCOUNT_REQUIRED") {
        setAccountRequired(true); setMessage("Sign in to use bounded AI help. The standard learning path remains available and no quota was created."); return;
      }
      if (response.status === 403 && payload.error === "PRO_AI_REQUIRED") {
        setProRequired(true); setFallback(payload.fallback); setMessage("No AI credits are available right now. The non-AI learning path remains available and nothing was charged."); return;
      }
      if (payload.quota) setQuota(payload.quota);
      if (payload.status === "succeeded" && payload.output) {
        setOutput(payload.output); setMessage(payload.replayed ? "AI help restored. No duplicate credit charge." : `AI help generated. ${feature === "explanation" ? 1 : 5} credit${feature === "explanation" ? "" : "s"} charged.`); key.current = undefined;
      } else if (payload.fallback) {
        const quotaReset = payload.quota?.resetAt ? new Date(payload.quota.resetAt).toLocaleString() : "the next monthly window";
        const retryAt = payload.retryAt ? new Date(payload.retryAt).toLocaleTimeString() : "about one hour";
        setFallback(payload.fallback);
        setMessage(payload.error === "AI_RATE_LIMITED" ? `Too many AI requests in a short period. Retry after ${retryAt}; nothing was charged.` : payload.error === "AI_QUOTA_EXHAUSTED" ? `This month's AI credits are used. They reset ${quotaReset}; nothing was charged.` : "AI is unavailable right now. Nothing was charged; use the non-AI path below.");
        if (payload.status === "fallback") key.current = undefined;
      } else {
        setMessage("AI help could not start. Nothing was charged; keep using the standard learning flow.");
      }
    } catch {
      setMessage("Network interrupted. Nothing was charged yet. Retry uses the same request key.");
    } finally { setBusy(false); }
  }

  const label = feature === "explanation" ? "Ask AI to explain" : "Ask AI for plan tips";
  return <section className="ai-assist" aria-labelledby={`ai-${feature}-title`}>
    <div className="ai-assist-heading"><div><span className="eyebrow">Optional AI · AI credits</span><h3 id={`ai-${feature}-title`}>{feature === "explanation" ? "AI Explanation" : "AI Study Plan assistant"}</h3></div>{quota && !proRequired && <span className="ai-quota">{quota.remaining}/{quota.allowance} this month · resets {new Date(quota.resetAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}</div>
    <p>{feature === "explanation" ? "Get a grounded explanation for this completed exercise." : "Add concise priorities to the deterministic plan already saved above."}</p>
    <p className="ai-policy">{feature === "explanation" ? "One" : "Five"} AI credit{feature === "explanation" ? "" : "s"} per successful response. Gifted credits also work after the trial. Provider failures never charge. AI guidance is not official HSK advice and does not score pronunciation.</p>
    <div className="step7-actions">{accountRequired ? <Link className="btn" href="/account">Sign in for AI help</Link> : proRequired ? <Link className="btn" href="/pricing">Compare Pro</Link> : <button className="btn" disabled={busy || quota?.remaining === 0} onClick={() => void generate()}>{busy ? "Generating…" : label}</button>}<Link className="btn secondary" href={feature === "explanation" ? "/review" : "/planner"}>{feature === "explanation" ? "Use Review without AI" : "Keep deterministic plan"}</Link></div>
    {message && <p className="step7-alert" role="status">{message}</p>}
    {output?.kind === "explanation" && <article className="ai-output"><h4>{output.title}</h4><p>{output.summary}</p><p><strong>Why it works:</strong> {output.whyCorrect}</p><p><strong>Next step:</strong> {output.nextStep}</p></article>}
    {output?.kind === "study_plan" && <article className="ai-output"><h4>{output.title}</h4><div className="ai-output-grid"><div><strong>Priorities</strong><ul>{output.priorities.map((item) => <li key={item}>{item}</li>)}</ul></div><div><strong>Next actions</strong><ul>{output.nextActions.map((item) => <li key={item}>{item}</li>)}</ul></div></div></article>}
    {(output || fallback) && <p className="ai-policy"><a href="mailto:support@hskkit.com?subject=Report%20an%20AI%20response">Report an AI response</a></p>}
    {fallback && <article className="ai-output fallback"><h4>{fallback.title}</h4><p>{fallback.summary}</p><div className="step7-actions">{fallback.links.map((item) => <Link className="step7-related" href={item.href} key={item.href}>{item.label} →</Link>)}</div></article>}
  </section>;
}
