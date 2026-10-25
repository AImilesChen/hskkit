"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FeedbackReviewForm({
  id,
  reviewStatus,
  adminNote,
  retentionStatus,
}: {
  id: string;
  reviewStatus: string;
  adminNote: string | null;
  retentionStatus: "kept" | "archived";
}) {
  const router = useRouter();
  const [status, setStatus] = useState(reviewStatus);
  const [note, setNote] = useState(adminNote || "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error" | "deleting">("idle");

  async function mutate(method: "PATCH" | "DELETE", body?: Record<string, unknown>) {
    const response = await fetch(`/api/v1/admin/feedback/${encodeURIComponent(id)}`, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error("feedback_action_failed");
  }

  async function saveReview() {
    setState("saving");
    try {
      await mutate("PATCH", { reviewStatus: status, adminNote: note });
      setState("saved");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  async function setRetention(next: "kept" | "archived") {
    setState("saving");
    try {
      await mutate("PATCH", { retentionStatus: next });
      setState("saved");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  async function deletePermanently() {
    if (!window.confirm("Permanently delete this archived feedback? This cannot be undone.")) return;
    setState("deleting");
    try {
      await mutate("DELETE");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  const busy = state === "saving" || state === "deleting";
  const dirty = status !== reviewStatus || note !== (adminNote || "");
  return (
    <div className="admin-review">
      <div className="admin-review-toolbar">
        <label className="admin-review-status">
          <span>Review status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)} disabled={busy}>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
        <div className="admin-review-actions">
          <button type="button" onClick={saveReview} disabled={busy || !dirty}>{state === "saving" ? "Saving…" : "Save changes"}</button>
          {retentionStatus === "kept" ? (
            <button type="button" className="secondary" onClick={() => setRetention("archived")} disabled={busy}>Archive</button>
          ) : (
            <>
              <button type="button" className="secondary" onClick={() => setRetention("kept")} disabled={busy}>Restore</button>
              <button type="button" className="danger" onClick={deletePermanently} disabled={busy}>{state === "deleting" ? "Deleting…" : "Delete permanently"}</button>
            </>
          )}
        </div>
      </div>
      <details className="admin-note">
        <summary><span>Internal note</span><small>{note ? "Note added" : "Optional"}</small></summary>
        <label>
          <span>Private note for administrators</span>
          <textarea value={note} maxLength={1000} rows={3} onChange={(event) => setNote(event.target.value)} placeholder="Add context only when it will help a later review" disabled={busy} />
        </label>
        <p>Not visible to the user.</p>
      </details>
      <p className="admin-review-feedback" role="status">{state === "saved" ? "Changes saved." : state === "error" ? "Could not complete this action. Try again." : ""}</p>
    </div>
  );
}
