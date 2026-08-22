"use client";

import { useState } from "react";

export function AudioIssueReporter({ audioAssetId }: { audioAssetId: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  async function report() {
    setStatus("sending");
    try {
      const response = await fetch("/api/v1/content/audio/report", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ audioAssetId, issueType: "playback", details: "Playback failed from the published audio card." }) });
      setStatus(response.ok ? "sent" : "failed");
    } catch { setStatus("failed"); }
  }
  return <div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" onClick={report} disabled={status === "sending" || status === "sent"} className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60">{status === "sending" ? "Sending…" : status === "sent" ? "Reported" : "Report playback issue"}</button>{status === "failed" && <span role="status" className="text-sm text-red-700">Report could not be saved. Email support@hskkit.com.</span>}</div>;
}
