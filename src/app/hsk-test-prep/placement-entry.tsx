"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { placementEntry, startPlacementFromEntry, type PlacementEntryOverview } from "@/lib/tests/placement-entry";

export function PlacementEntry() {
  const router = useRouter();
  const [overview, setOverview] = useState<PlacementEntryOverview>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const requestKey = useRef<string | null>(null);
  const stateRequest = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const entry = placementEntry(overview);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    stateRequest.current = controller;
    void fetch("/api/v1/placement", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) return;
        const data = await response.json();
        if (!controller.signal.aborted) setOverview(data);
      }).catch(() => { /* The explicit Start action and runner remain available. */ });
    return () => { mounted.current = false; controller.abort(); };
  }, []);

  async function start(event: MouseEvent<HTMLAnchorElement>) {
    if (entry.kind !== "start" || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    stateRequest.current?.abort();
    setBusy(true);
    setError("");
    requestKey.current ??= `placement-start:${crypto.randomUUID()}`;
    try {
      await startPlacementFromEntry(fetch, requestKey.current);
      if (!mounted.current) return;
      trackEvent("placement_test_start", { source: "placement_landing" });
      router.push("/placement");
    } catch {
      if (!mounted.current) return;
      setError("Could not start your test. Open placement to check your saved progress and try again.");
      setBusy(false);
      inFlight.current = false;
    }
  }

  return <div className="test-placement-entry">
    <div className="test-start-row"><p className="test-start-facts"><span className="test-clipboard-icon" aria-hidden="true" />18–24 questions <span aria-hidden="true">·</span> Four skills <span aria-hidden="true">·</span> No timer</p>
    <div className="test-entry-actions"><Link href={entry.href} prefetch={false} className="test-primary-link" onClick={start} aria-busy={busy} aria-disabled={busy} data-test-entry="placement-runner">{busy ? "Starting your test…" : entry.kind === "start" ? "Start free test" : entry.label}</Link>
      {entry.canRetake && <Link href="/placement" prefetch={false} className="test-text-link" data-test-entry="placement-retake">Take another placement →</Link>}
    </div></div>
    <p className="test-entry-note" aria-live="polite">{error || (entry.kind === "start" ? "No account needed." : entry.note)}</p>
    {error && <Link href="/placement" prefetch={false} className="test-text-link">Open placement to retry →</Link>}
  </div>;
}
