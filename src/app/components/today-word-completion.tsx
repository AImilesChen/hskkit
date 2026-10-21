"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { todayCompletionProofKey } from "../../lib/learning/today-plan";
import type { TodayMeaningCheck } from "../../lib/learning/today-content";

export default function TodayWordCompletion({ assetId, dailySessionId, dailyItemId, meaningCheck, step, total }: { assetId: string; dailySessionId: string; dailyItemId: string; meaningCheck: TodayMeaningCheck; step?: string; total?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [wrong, setWrong] = useState(false);
  const idempotencyKey = useRef<string | null>(null);

  async function finish(answer: string, attemptCount: number) {
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
        payload: { sessionId: dailySessionId, itemId: dailyItemId, assetId, answer, attempts: attemptCount, idempotencyKey: idempotencyKey.current },
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
      setError(cause instanceof Error && cause.message === "FREE_DAILY_NEW_ITEM_LIMIT" ? "Your Free new-item limit is reached; no new completion was recorded." : cause instanceof Error && cause.message === "TODAY_LEARN_WORD_MISMATCH" ? "This is not the word saved in your current Today step. Return to Today to restore the correct word." : cause instanceof Error && cause.message === "TODAY_LEARN_CHECK_REQUIRED" ? "Complete the memory check with the correct answer before continuing." : "We could not confirm whether this step reached the server. Return to Today to restore the authoritative progress before retrying.");
      setBusy(false);
    }
  }

  function checkAnswer() {
    if (!selectedAnswer || busy) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (selectedAnswer !== meaningCheck.correctAnswer) {
      setWrong(true);
      return;
    }
    setWrong(false);
    void finish(selectedAnswer, nextAttempts);
  }

  return <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5" aria-label="Today Session word step">
    <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Today Session{step && total ? ` · Step ${step} of ${total}` : ""}</p>
    <h2 className="mt-2 text-xl font-bold text-slate-950">Check your memory before continuing</h2>
    <p className="mt-2 text-sm leading-6 text-slate-700">Study the word details above, then choose its meaning. The Learn step is saved only after the correct answer.</p>
    <fieldset className="mt-4 grid gap-2 sm:grid-cols-2"><legend className="mb-2 font-bold text-slate-950">{meaningCheck.prompt}</legend>{meaningCheck.options.map((option) => <label key={option.key} className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3 ${selectedAnswer === option.key ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-300"}`}><input type="radio" name="today-word-memory-check" value={option.key} checked={selectedAnswer === option.key} onChange={() => { setSelectedAnswer(option.key); setWrong(false); setError(""); }} /><span><strong className="mr-2">{option.key}.</strong>{option.text}</span></label>)}</fieldset>
    {wrong && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="alert"><p className="font-bold">Not quite. Review the definition above, then try again.</p><p className="mt-1">This Learn step has not been marked complete.</p></div>}
    <button type="button" disabled={busy || !selectedAnswer} onClick={checkAnswer} className="mt-4 min-h-[48px] w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:cursor-wait disabled:opacity-60 sm:w-auto">{busy ? "Saving…" : "Check answer and continue"}</button>
    {error && <div className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert"><p>{error}</p><Link className="mt-2 inline-flex min-h-11 items-center font-bold text-blue-700 underline" href="/today">Back to Today</Link></div>}
  </section>;
}
