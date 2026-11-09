"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { googleSignInHref } from "@/lib/account/sign-in";
import { mockAccessState, mockPaperHref, type MockAccess } from "@/lib/formal-exams/offer";

export function FormalPaperAccess({ level, form, busy, onStart }: { level: number; form: "a" | "b" | "c"; busy: boolean; onStart: () => void }) {
  const [state, setState] = useState<ReturnType<typeof mockAccessState> | "loading">("loading");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (form === "a") return;
    let active = true;
    setState("loading");
    void fetch("/api/v1/commercial/subscription", { cache: "no-store" }).then(async r => {
      if (r.status === 401) return "anonymous" as const;
      if (!r.ok) throw new Error("ACCESS_UNAVAILABLE");
      const d = await r.json() as { access?: MockAccess; subscription?: { currentPeriodEnd?: string } | null };
      return mockAccessState({ authenticated: true, available: true, access: d.access, subscriptionEndsAt: d.subscription?.currentPeriodEnd });
    }).then(s => { if (active) setState(s); }).catch(() => { if (active) setState("unavailable"); });
    return () => { active = false; };
  }, [form, retry]);
  if (form === "a") return <button className="test-primary-link" type="button" disabled={busy} onClick={onStart}>{busy ? "Opening paper…" : "Start Paper A →"}</button>;
  if (state === "loading") return <p role="status">Checking your Pro access…</p>;
  if (state === "unavailable") return <div role="status"><p>Your access could not be verified.</p><button type="button" onClick={() => setRetry(n => n + 1)}>Retry access check</button></div>;
  if (state === "pro" || state === "trial") return <><p className="formal-access-included">✓ Included with your {state === "trial" ? "Pro trial" : "Pro access"}</p><button className="test-primary-link" type="button" disabled={busy} onClick={onStart}>{busy ? "Opening paper…" : `Start Paper ${form.toUpperCase()} →`}</button></>;
  return <div className="formal-access-offer"><p>{state === "expired" ? "Your Pro access has ended." : state === "anonymous" ? "Sign in to check your Pro access." : `Paper ${form.toUpperCase()} is included with Pro.`}</p><div className="formal-actions">
    {state === "anonymous" ? <Link className="test-primary-link" href={googleSignInHref(mockPaperHref(level, form))}>Sign in</Link> : <Link className="test-primary-link" href="/pricing#plans">View Pro plans</Link>}
    <Link href={mockPaperHref(level, "a")}>Try free Paper A →</Link>
  </div></div>;
}

export function FormalNextPaper({ level, form }: { level: number; form: "a" | "b" | "c" }) {
  const [pro, setPro] = useState<boolean | null>(null);
  useEffect(() => { let active = true; void fetch("/api/v1/commercial/subscription", { cache: "no-store" }).then(async r => {
    if (r.status === 401) return false;
    if (!r.ok) throw new Error("ACCESS_UNAVAILABLE");
    const d = await r.json();
    return ["pro", "trial"].includes(mockAccessState({ authenticated: true, available: true, access: d.access }));
  }).then(value => { if (active) setPro(value); }).catch(() => {}); return () => { active = false; }; }, []);
  const next = form === "a" ? "b" : form === "b" ? "c" : "a";
  return <section className="formal-next-paper"><p className="test-eyebrow">Your next practice run</p><h2>Try a different HSK {level} paper.</h2><p>{form === "a" ? "Papers B and C give you two fresh sets at this level. Both are included with Pro." : "Use another paper to practise with a different set of questions."}</p><div className="formal-actions">
    <Link className="test-primary-link" prefetch={false} href={pro === false && next !== "a" ? "/pricing#plans" : mockPaperHref(level, next)}>{pro === false && next !== "a" ? "View Pro plans" : `${pro ? "Open" : "Explore"} Paper ${next.toUpperCase()} →`}</Link>
    <Link href={mockPaperHref(level)}>Choose a paper →</Link>
  </div></section>;
}
