"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import HomeIcon from "./home-icon";

type NextAction = {
  kind: "placement" | "today" | "review";
  label: string;
  href: "/placement" | "/today" | "/review";
  explanation: string;
};

const fallback: NextAction = {
  kind: "placement",
  label: "Find my starting level",
  href: "/placement",
  explanation: "Find an evidence-based starting level before building today’s queue.",
};

export default function HomeNextStep() {
  const [action, setAction] = useState<NextAction>(fallback);
  const [scope, setScope] = useState<"account" | "guest" | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/v1/learning?tzOffset=${new Date().getTimezoneOffset()}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("LEARNING_STATUS_UNAVAILABLE");
        const data = await response.json() as { nextAction?: NextAction; scope?: "account" | "guest" };
        if (active) {
          setScope(data.scope ?? null);
          if (data.scope === "account" && data.nextAction) setAction(data.nextAction);
        }
      })
      .catch(() => undefined)
      .finally(() => active && setLoaded(true));
    return () => { active = false; };
  }, []);

  const returningAccount = loaded && scope === "account";
  const href = returningAccount ? action.href : "/placement";

  return <div className="home-cta-stack" aria-live="polite">
    <div className="home-cta-actions">
      <Link href={href} className="home-cta-primary">
        <HomeIcon name="route" className="h-5 w-5" />
        <span>Start learning</span>
        <HomeIcon name="arrow" className="home-cta-arrow h-5 w-5" />
      </Link>
      <a href="#quick-flashcards-demo" className="home-cta-secondary">Preview five flashcards <HomeIcon name="arrow" className="h-4 w-4" /></a>
    </div>
    <p className="home-cta-explanation">Start with published HSK 3.0 vocabulary and build your review plan as you learn.</p>
    <ul className="home-cta-trust" aria-label="Before you start">
      {["7-day Pro trial", "No card required", "Returns to Free automatically"].map((item) => <li key={item}><span className="home-cta-check"><HomeIcon name="check" className="h-3.5 w-3.5" /></span>{item}</li>)}
    </ul>
    <p className="home-cta-free">After the trial: Free includes 10 new items and 20 successful SRS ratings daily.</p>
  </div>;
}
