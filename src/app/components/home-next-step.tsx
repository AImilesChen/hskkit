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

const actionLabels: Record<NextAction["kind"], string> = {
  placement: "Find my starting level",
  today: "Continue today’s study",
  review: "Review due items",
};

export default function HomeNextStep() {
  const [action, setAction] = useState<NextAction>(fallback);
  const [loaded, setLoaded] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/v1/learning?tzOffset=${new Date().getTimezoneOffset()}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("LEARNING_STATUS_UNAVAILABLE");
        const data = await response.json() as { nextAction?: NextAction };
        if (active && data.nextAction) setAction(data.nextAction);
      })
      .catch(() => active && setUnavailable(true))
      .finally(() => active && setLoaded(true));
    return () => { active = false; };
  }, []);

  const href = unavailable ? "/today" : action.href;
  const label = unavailable ? "Continue today’s study" : loaded ? actionLabels[action.kind] : "Find my starting level";
  const explanation = unavailable
    ? "We couldn’t check saved status. Continue in Today to restore the latest server copy without guessing your next step."
    : loaded ? action.explanation : fallback.explanation;

  return <div className="home-cta-stack" aria-live="polite">
    <div className="home-cta-actions">
      <Link href={href} className="home-cta-primary">
        <HomeIcon name="route" className="h-5 w-5" />
        <span>{label}</span>
        <HomeIcon name="arrow" className="home-cta-arrow h-5 w-5" />
      </Link>
      <Link href="/levels" className="home-cta-secondary">Browse HSK 3.0 levels <HomeIcon name="arrow" className="h-4 w-4" /></Link>
    </div>
    <p className="home-cta-explanation">{explanation}</p>
    <ul className="home-cta-trust" aria-label="Before you start">
      {["Start as a guest", "Placement is a learning suggestion", "Sign in later to sync"].map((item) => <li key={item}><span className="home-cta-check"><HomeIcon name="check" className="h-3.5 w-3.5" /></span>{item}</li>)}
    </ul>
  </div>;
}
