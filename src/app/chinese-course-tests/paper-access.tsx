"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { googleSignInHref } from "@/lib/account/sign-in";
import { mockAccessState, type MockAccess } from "@/lib/formal-exams/offer";
import { coursePaperHref, coursePracticeHref, type CourseForm, type CourseLevel } from "@/lib/course-exams/catalog";
export function CoursePaperAccess({ form, level = 1 }: { form: CourseForm; level?: CourseLevel }) {
  const [state, setState] = useState<ReturnType<typeof mockAccessState> | "loading">("loading");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (form === "a") return;
    let active = true; setState("loading");
    void fetch("/api/v1/commercial/subscription", { cache: "no-store" }).then(async r => {
      if (r.status === 401) return "anonymous" as const;
      if (!r.ok) throw Error("ACCESS_UNAVAILABLE");
      const d = await r.json() as { access?: MockAccess; subscription?: { currentPeriodEnd?: string } | null };
      return mockAccessState({ authenticated: true, available: true, access: d.access, subscriptionEndsAt: d.subscription?.currentPeriodEnd });
    }).then(s => { if (active) setState(s); }).catch(() => { if (active) setState("unavailable"); });
    return () => { active = false; };
  }, [form, retry]);
  if (form === "a") return <a className="ap-button" href={coursePracticeHref(form, level)}>Open free Paper A →</a>;
  if (state === "loading") return <p role="status">Checking your Pro access…</p>;
  if (state === "unavailable") return <div role="status"><p>Your access could not be checked.</p><button className="ap-button" onClick={() => setRetry(n => n + 1)}>Retry access check</button></div>;
  if (state === "pro" || state === "trial") return <div><p>✓ Included with your {state === "trial" ? "Pro trial" : "Pro access"}</p><a className="ap-button" href={coursePracticeHref(form, level)}>Open Paper {form.toUpperCase()} →</a></div>;
  return <div><p>{state === "anonymous" ? "Sign in to check your Pro access." : state === "expired" ? "Your Pro access has ended. Paper A remains free." : "Unlock this complete paper with Pro."}</p><div className="ap-actions">{state === "anonymous" ? <Link className="ap-button" href={googleSignInHref(coursePaperHref(form, level))}>Sign in</Link> : <Link className="ap-button" href="/pricing#plans">View Pro plans</Link>}<Link href={coursePaperHref("a", level)}>Try free Paper A →</Link></div></div>;
}
