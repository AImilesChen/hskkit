export type PlacementEntryOverview = {
  status?: "active" | "ready" | "expired" | "cooldown";
  session?: { id: string; status: string } | null;
  latestResultId?: string | null;
  canRetake?: boolean;
};

export function placementEntry(overview?: PlacementEntryOverview | null) {
  const resultId = typeof overview?.latestResultId === "string" && overview.latestResultId.length <= 160
    ? overview.latestResultId : undefined;
  const resultHref = resultId ? `/placement/result/${encodeURIComponent(resultId)}` : "/placement";
  const active = overview?.status === "active" || overview?.session?.status === "in_progress";
  if (overview?.status === "cooldown" || overview?.canRetake === false && !active) {
    return { kind: "result" as const, href: resultHref, label: resultId ? "View my latest result" : "Check placement status", note: "Your retake is not available yet. Open placement for the exact availability.", canRetake: false };
  }
  if (active) {
    return { kind: "continue" as const, href: "/placement", label: "Continue my test", note: "Your saved answers are ready to continue.", canRetake: false };
  }
  if (resultId) {
    return { kind: "result" as const, href: resultHref, label: "View my latest result", note: "Review your learning suggestion and recommended next steps.", canRetake: overview?.canRetake === true };
  }
  return { kind: "start" as const, href: "/placement", label: "Start free placement", note: "Progress is saved as you go. You can return in this browser.", canRetake: false };
}

// Called only by an explicit Start click, never while rendering a landing page.
export async function startPlacementFromEntry(request: typeof fetch, idempotencyKey: string) {
  const response = await request("/api/v1/placement/sessions", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ idempotencyKey }),
  });
  const data = await response.json();
  if (!response.ok || typeof data.session?.id !== "string" || !data.session.id) throw new Error("Could not start placement. Open placement to check your saved progress and try again.");
}
