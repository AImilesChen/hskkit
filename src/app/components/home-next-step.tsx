"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type NextAction = {
  kind: "placement" | "today" | "review";
  label: "Start placement" | "Continue today" | "Review due";
  href: "/placement" | "/today" | "/review";
  explanation: string;
};

const fallback: NextAction = {
  kind: "placement",
  label: "Start placement",
  href: "/placement",
  explanation: "Find an evidence-based starting level before building today's queue.",
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

  return <div className="mt-7" aria-live="polite">
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link href={unavailable ? "/today" : action.href} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700">
        {unavailable ? "Open Today" : loaded ? action.label : "Start placement"}
      </Link>
      <Link href="/levels" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 font-semibold text-slate-800 hover:border-blue-300 hover:bg-blue-50">Explore HSK 3.0 levels</Link>
    </div>
    <p className="mt-3 text-sm text-slate-600">{unavailable ? "We couldn't check your saved status. Open Today to restore the latest server copy without guessing your next step." : loaded ? action.explanation : fallback.explanation}</p>
  </div>;
}
