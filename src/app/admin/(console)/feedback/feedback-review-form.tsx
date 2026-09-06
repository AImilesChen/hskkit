"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function FeedbackReviewForm({ id, reviewStatus, adminNote }: { id: string; reviewStatus: string; adminNote: string | null }) {
  const router = useRouter(); const [status, setStatus] = useState(reviewStatus); const [note, setNote] = useState(adminNote || ""); const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  async function save() { setState("saving"); try { const response = await fetch(`/api/v1/admin/feedback/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ reviewStatus: status, adminNote: note }) }); if (!response.ok) throw new Error("save_failed"); setState("saved"); router.refresh(); } catch { setState("error"); } }
  return <div className="admin-review"><label><span>Review status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="unread">Unread</option><option value="read">Read</option><option value="resolved">Resolved</option></select></label><label><span>Internal note</span><textarea value={note} maxLength={1000} rows={3} onChange={(event) => setNote(event.target.value)} placeholder="Optional internal note" /></label><div><button type="button" onClick={save} disabled={state === "saving"}>{state === "saving" ? "Saving…" : "Save review"}</button><span role="status">{state === "saved" ? "Saved" : state === "error" ? "Could not save. Try again." : ""}</span></div></div>;
}
