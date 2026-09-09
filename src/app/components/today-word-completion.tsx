"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { todayCompletionProofKey } from "../../lib/learning/today-plan";

export default function TodayWordCompletion({ assetId, dailySessionId, dailyItemId, step, total }: { assetId: string; dailySessionId: string; dailyItemId: string; step?: string; total?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKey = useRef<string | null>(null);

  async function finish() {
    setBusy(true);
    setError("");
    try {
      const stateResponse = await fetch(`/api/v1/learning?tzOffset=${new Date().getTimezoneOffset()}`, { cache: "no-store" });
      const state = await stateResponse.json() as { revision?: number; queueBinding?: string; error?: string; session?: { id: string; items: Array<{ id: string; kind?: string; status: string }> } };
      if (!stateResponse.ok) throw new Error(state.error ?? "LEARNING_LOAD_FAILED");
      const restoredItem = state.session?.id === dailySessionId ? state.session.items.find((item) => item.id === dailyItemId) : undefined;
      if (restoredItem?.status === "completed") {
        sessionStorage.setItem(todayCompletionProofKey(dailySessionId, dailyItemId), JSON.stringify({
          dailySessionId,
          dailyItemId,
          revision: state.revision ?? 0,
          summaryComplete: state.session?.items.some((item) => item.kind === "summary" && item.status === "completed") ?? false,
        }));
        sessionStorage.removeItem(`today-learn:${dailySessionId}:${dailyItemId}`);
        window.location.assign(`/today?resume=1&completed=learn&completedSession=${encodeURIComponent(dailySessionId)}&completedItem=${encodeURIComponent(dailyItemId)}`);
        return;
      }
      const storageKey = `today-learn:${dailySessionId}:${dailyItemId}`;
      idempotencyKey.current ??= sessionStorage.getItem(storageKey) ?? crypto.randomUUID();
      sessionStorage.setItem(storageKey, idempotencyKey.current);
      const body = JSON.stringify({
        action: "complete_item",
        payload: { sessionId: dailySessionId, itemId: dailyItemId, assetId, idempotencyKey: idempotencyKey.current },
        clientRevision: state.revision,
        queueBinding: state.queueBinding,
        tzOffset: new Date().getTimezoneOffset(),
      });
      let response: Response | undefined;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          response = await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body });
          if (response.ok || response.status < 500) break;
        } catch { /* retry with the same idempotency key */ }
      }
      if (!response) throw new Error("LEARN_COMPLETION_UNCONFIRMED");
      const result = await response.json() as { error?: string; revision?: number; session?: { id: string; items: Array<{ id: string; kind?: string; status: string }> } };
      if (!response.ok) throw new Error(result.error ?? "LEARN_COMPLETION_FAILED");
      sessionStorage.removeItem(storageKey);
      sessionStorage.setItem(todayCompletionProofKey(dailySessionId, dailyItemId), JSON.stringify({
        dailySessionId,
        dailyItemId,
        revision: result.revision ?? state.revision ?? 0,
        summaryComplete: result.session?.items.some((item) => item.kind === "summary" && item.status === "completed") ?? false,
      }));
      window.location.assign(`/today?resume=1&completed=learn&completedSession=${encodeURIComponent(dailySessionId)}&completedItem=${encodeURIComponent(dailyItemId)}`);
    } catch (cause) {
      setError(cause instanceof Error && cause.message === "FREE_DAILY_NEW_ITEM_LIMIT" ? "Your Free new-item limit is reached; no new completion was recorded." : cause instanceof Error && cause.message === "TODAY_LEARN_WORD_MISMATCH" ? "This is not the word saved in your current Today step. Return to Today to restore the correct word." : "We could not confirm whether this step reached the server. Return to Today to restore the authoritative progress before retrying.");
      setBusy(false);
    }
  }

  return <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5" aria-label="Today Session word step">
    <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Today Session{step && total ? ` · Step ${step} of ${total}` : ""}</p>
    <h2 className="mt-2 text-xl font-bold text-slate-950">Finish this exact word before continuing</h2>
    <p className="mt-2 text-sm leading-6 text-slate-700">Read the definition, pronunciation and examples above. Confirm only when you have actually studied them; the server will save this Learn step once.</p>
    <button type="button" disabled={busy} onClick={() => void finish()} className="mt-4 min-h-[48px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:cursor-wait disabled:opacity-60 sm:w-auto">{busy ? "Saving…" : "I studied this word · Continue"}</button>
    {error && <div className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert"><p>{error}</p><Link className="mt-2 inline-flex min-h-11 items-center font-bold text-blue-700 underline" href="/today">Back to Today</Link></div>}
  </section>;
}
