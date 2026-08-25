"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
  explanation: "Find an evidence-based starting level before building today's queue.",
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

  return <div className="mt-8" aria-live="polite">
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link href={unavailable ? "/today" : action.href} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-6 font-semibold text-white shadow-[0_8px_24px_rgba(29,78,216,.18)] transition hover:-translate-y-0.5 hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 motion-reduce:transform-none">
        {unavailable ? "Continue today’s study" : loaded ? actionLabels[action.kind] : "Find my starting level"}
      </Link>
      <Link href="/levels" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 motion-reduce:transform-none">Browse HSK 3.0 levels</Link>
    </div>
    <p className="mt-3 text-sm leading-6 text-slate-600">{unavailable ? "We couldn't check your saved status. Continue in Today to restore the latest server copy without guessing your next step." : loaded ? action.explanation : fallback.explanation}</p>
  </div>;
}
