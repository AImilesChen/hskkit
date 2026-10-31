"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AudioButton } from "../../components/audio-button";
import { flashcardReviewIds, flashcardSummary, splitFlashcardForms, type FlashcardRating } from "@/lib/learning/flashcards";

const sessionSizes = [10, 20, 50] as const;
type SessionSize = typeof sessionSizes[number];

type FlashcardWord = {
  id: string;
  formalAudioUrl: string | null;
  payload: {
    hanzi: string;
    traditional: string;
    pinyin: string;
    meaning: string;
    partOfSpeech: string;
  };
};

type FlashcardResponse = {
  contentAssets: FlashcardWord[];
  pagination: { total: number };
};

type LearningView = { scope: "guest" | "account"; queueBinding: string; revision: number; flashcardReview?: { added: number; already: number }; message?: string };

function randomSeed() {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    return (crypto.getRandomValues(new Uint32Array(1))[0] & 0x7fffffff) || 1;
  }
  return Date.now() & 0x7fffffff;
}

export function QuickFlashcards({ level, levelLabel, publishedCount }: { level: number; levelLabel: string; publishedCount: number }) {
  const [sessionSize, setSessionSize] = useState<SessionSize>(20);
  const [seed, setSeed] = useState(0);
  const [words, setWords] = useState<FlashcardWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [complete, setComplete] = useState(false);
  const [ratings, setRatings] = useState<Record<string, FlashcardRating>>({});
  const [initialSetCount, setInitialSetCount] = useState(0);
  const [round, setRound] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [learningView, setLearningView] = useState<LearningView | null>(null);
  const [learningStatus, setLearningStatus] = useState<"idle" | "loading" | "ready" | "failed" | "saving" | "saved">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => setSeed(randomSeed()), []);

  useEffect(() => {
    if (!seed) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      level: String(level),
      mode: "flashcards",
      seed: String(seed),
      pageSize: String(sessionSize),
    });
    setLoading(true);
    setError("");
    setWords([]);
    setCurrentIndex(0);
    setRevealed(false);
    setComplete(false);
    setRatings({});
    setRound(1);
    setLearningView(null);
    setLearningStatus("idle");
    setSaveMessage("");
    void fetch(`/api/v1/catalog/words?${params.toString()}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as FlashcardResponse & { message?: string };
        if (!response.ok) throw new Error(body.message || "Flashcards are temporarily unavailable.");
        const uniqueWords = [...new Map(body.contentAssets.map((word) => [word.id, word])).values()].slice(0, sessionSize);
        setWords(uniqueWords);
        setInitialSetCount(uniqueWords.length);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Flashcards are temporarily unavailable.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [level, seed, sessionSize]);

  const currentWord = words[currentIndex];
  const progress = words.length ? ((currentIndex + 1) / words.length) * 100 : 0;
  const levelNumber = level >= 7 ? "7–9" : String(level);
  const hanziForms = splitFlashcardForms(currentWord?.payload.hanzi ?? "");
  const primaryHanzi = hanziForms[0] ?? "";
  const otherHanzi = hanziForms.slice(1).join(" · ");
  const pinyin = splitFlashcardForms(currentWord?.payload.pinyin ?? "").join(" · ");
  const { known: knownCount, markedForPractice, retryWords } = flashcardSummary(words, ratings);
  const reviewAssetIds = flashcardReviewIds(words, ratings);

  useEffect(() => {
    if (!complete || markedForPractice === 0) return;
    const controller = new AbortController();
    setLearningStatus("loading");
    void fetch("/api/v1/learning", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as LearningView;
        if (!response.ok) throw new Error(body.message || "Learning status is unavailable.");
        setLearningView(body);
        setLearningStatus("ready");
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) setLearningStatus("failed");
      });
    return () => controller.abort();
  }, [complete, markedForPractice]);
  const partOfSpeech = useMemo(() => currentWord?.payload.partOfSpeech || "Part of speech not specified", [currentWord]);
  const traditional = useMemo(() => currentWord?.payload.traditional
    .split("|")
    .map((form) => form.trim())
    .filter((form, index, forms) => form && !splitFlashcardForms(currentWord.payload.hanzi).includes(form) && forms.indexOf(form) === index)
    .join(" · ") ?? "", [currentWord]);

  function newRandomSet(size: SessionSize = sessionSize) {
    setSessionSize(size);
    setSeed(randomSeed());
  }

  function previous() {
    if (currentIndex === 0) return;
    setCurrentIndex((index) => index - 1);
    setRevealed(false);
  }

  function next() {
    if (currentIndex >= words.length - 1) {
      setComplete(true);
      return;
    }
    setCurrentIndex((index) => index + 1);
    setRevealed(false);
  }

  function rate(rating: FlashcardRating) {
    if (!revealed || !currentWord) return;
    setRatings((previous) => ({ ...previous, [currentWord.id]: rating }));
    next();
  }

  function reviewUncertain() {
    if (!retryWords.length) return;
    setWords(retryWords);
    setCurrentIndex(0);
    setRevealed(false);
    setComplete(false);
    setRatings({});
    setRound((value) => value + 1);
    setSaveMessage("");
  }

  async function saveMarkedWords() {
    if (learningView?.scope !== "account" || !reviewAssetIds.length || learningStatus === "saving") return;
    setLearningStatus("saving");
    setSaveMessage("");
    try {
      const response = await fetch("/api/v1/learning", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "flashcard_batch_review", queueBinding: learningView.queueBinding, clientRevision: learningView.revision, payload: { assetIds: reviewAssetIds, idempotencyKey: crypto.randomUUID() } }),
      });
      const body = await response.json() as LearningView;
      if (!response.ok) throw new Error(body.message || "Could not save these words.");
      setLearningView(body);
      setLearningStatus("saved");
      setSaveMessage(`${body.flashcardReview?.added ?? 0} added to Review${body.flashcardReview?.already ? ` · ${body.flashcardReview.already} already scheduled` : ""}.`);
    } catch (reason) {
      setLearningStatus("failed");
      setSaveMessage(reason instanceof Error ? reason.message : "Could not save these words. Try again.");
    }
  }

  return <section className="overflow-hidden rounded-[28px] border border-blue-200 bg-blue-50/60 shadow-[0_24px_70px_-48px_rgba(30,64,175,.65)]" aria-labelledby="quick-flashcards-heading">
    <header className="bg-slate-950 px-5 py-5 text-white sm:px-7 sm:py-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-300">Fast recognition practice</p>
          <h2 id="quick-flashcards-heading" className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Quick Flashcards · {levelLabel}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Review a random set of unique words from {publishedCount.toLocaleString()} published HSK 3.0 words. After revealing each answer, mark what needs more practice. No sign-in required.</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.12em] text-slate-400">Cards per set</p>
          <div className="flex gap-2" aria-label="Cards per flashcard set">
            {sessionSizes.map((size) => <button key={size} type="button" aria-pressed={sessionSize === size} disabled={loading && sessionSize === size} onClick={() => newRandomSet(size)} className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border px-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blue-400/30 ${sessionSize === size ? "border-blue-400 bg-blue-500 text-white" : "border-slate-600 bg-slate-900 text-slate-200 hover:border-blue-400"}`}>{size}</button>)}
          </div>
        </div>
      </div>
    </header>

    <div className="px-4 py-5 sm:px-7 sm:py-7">
      {loading ? <div className="mx-auto max-w-[720px] rounded-2xl border border-blue-100 bg-white p-10 text-center" aria-live="polite"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" aria-hidden="true" /><p className="mt-4 font-semibold text-slate-800">Building a fresh {levelLabel} set…</p></div>
        : error ? <div className="mx-auto max-w-[720px] rounded-2xl border border-red-200 bg-white p-8 text-center" role="alert"><h3 className="text-xl font-bold text-red-950">Flashcards unavailable</h3><p className="mt-2 text-red-800">{error}</p><button type="button" onClick={() => newRandomSet()} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-red-700 px-5 font-bold text-white">Try again</button></div>
        : complete ? <div className="mx-auto max-w-[720px] rounded-3xl border border-emerald-200 bg-white p-7 text-center sm:p-10" aria-live="polite">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-800" aria-hidden="true">✓</div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[.14em] text-emerald-700">Round {round} complete</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-950">{knownCount} of {words.length} marked as remembered</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{retryWords.length ? `${retryWords.length} ${retryWords.length === 1 ? "word needs" : "words need"} another look (${markedForPractice} marked for practice, ${retryWords.length - markedForPractice} skipped).` : `You finished this round of your ${initialSetCount}-word set. Start another random set when ready.`}</p>
          {reviewAssetIds.length > 0 && <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-left">
            <p className="font-bold text-slate-950">Keep practising these {reviewAssetIds.length} words</p>
            {learningStatus === "loading" ? <p className="mt-1 text-sm text-slate-600">Checking your learning account…</p>
              : learningView?.scope === "account" ? <><p className="mt-1 text-sm text-slate-600">Save only words you marked “Practice again” to your Review queue. Existing review dates will stay unchanged.</p><button type="button" disabled={learningStatus === "saving" || learningStatus === "saved"} onClick={() => void saveMarkedWords()} className="mt-3 min-h-11 rounded-xl bg-blue-600 px-4 font-bold text-white disabled:opacity-50">{learningStatus === "saving" ? "Saving…" : learningStatus === "saved" ? "Saved to Review" : `Add ${reviewAssetIds.length} to Review`}</button></>
                : learningStatus === "failed" ? <p className="mt-1 text-sm text-red-700">Learning status could not be checked. Your flashcard choices are still temporary. Reload to try again.</p>
                  : <p className="mt-1 text-sm text-slate-600">Flashcard choices are temporary for guests. <Link href="/account" className="font-bold text-blue-700 underline">Sign in</Link> to save marked words to Review.</p>}
            {saveMessage && <p className="mt-2 text-sm font-semibold text-blue-900" role="status">{saveMessage} {learningStatus === "saved" && <Link href="/review" className="underline">Open Review</Link>}</p>}
          </div>}
          <div className="mt-6 flex flex-wrap justify-center gap-3">{retryWords.length ? <button type="button" onClick={reviewUncertain} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700">Review {retryWords.length} {retryWords.length === 1 ? "word" : "words"} again</button> : null}<button type="button" onClick={() => newRandomSet()} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-300 bg-white px-6 font-bold text-blue-700 hover:bg-blue-50">Start another set</button></div>
        </div>
        : currentWord ? <div className="mx-auto max-w-[720px]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-600" aria-live="polite"><span>Card {currentIndex + 1} of {words.length}{round > 1 ? ` · Practice round ${round}` : ""}</span><span>{knownCount} remembered · {markedForPractice} to practice</span></div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-blue-100" aria-hidden="true"><div className="h-full rounded-full bg-blue-600 transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>

          <button type="button" onClick={() => setRevealed((value) => !value)} aria-label={revealed ? `Hide answer for ${currentWord.payload.hanzi}` : `Show answer for ${currentWord.payload.hanzi}`} aria-pressed={revealed} className={`flex min-h-[300px] w-full flex-col items-center justify-center rounded-3xl border px-5 py-8 text-center transition focus:outline-none focus:ring-4 focus:ring-blue-200 sm:min-h-[340px] sm:px-10 ${revealed ? "border-blue-200 bg-white shadow-[0_24px_55px_-38px_rgba(15,23,42,.55)]" : "border-slate-800 bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 text-white shadow-[0_28px_65px_-38px_rgba(30,64,175,.9)]"}`}>
            {!revealed ? <>
              <span className="text-xs font-bold uppercase tracking-[.16em] text-blue-300">Recognize the word</span>
              <strong className={`mt-6 max-w-full break-words font-black leading-tight ${primaryHanzi.length > 4 ? "text-3xl sm:text-5xl" : "text-5xl sm:text-7xl"}`}>{primaryHanzi}</strong>
              {otherHanzi ? <span className="mt-2 text-lg font-semibold text-blue-100">Also: {otherHanzi}</span> : null}
              {traditional ? <span className="mt-3 text-lg text-blue-200">Traditional: {traditional}</span> : null}
              <span className="mt-7 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-100">Tap to show the answer</span>
            </> : <>
              <span className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Answer</span>
              <strong className="mt-4 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">{primaryHanzi}</strong>
              {otherHanzi ? <span className="mt-1 text-base font-semibold text-slate-600">Also: {otherHanzi}</span> : null}
              <span className="mt-3 break-words text-xl font-bold text-blue-700 sm:text-2xl">{pinyin}</span>
              <span className="mt-4 max-w-xl text-lg font-semibold leading-7 text-slate-800 sm:text-xl">{currentWord.payload.meaning}</span>
              <span className="mt-4 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">{partOfSpeech}</span>
            </>}
          </button>

          {revealed ? <div className="mt-4 flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 sm:px-4">
            <div className="flex items-center gap-3">{currentWord.formalAudioUrl ? <><AudioButton text={currentWord.payload.hanzi} src={currentWord.formalAudioUrl} variant="icon" /><span className="text-sm text-slate-600">Published pronunciation</span></> : <span className="text-sm text-slate-500">Pronunciation is not published for this word.</span>}</div>
            <Link href={`/word/${encodeURIComponent(currentWord.id)}`} className="inline-flex min-h-11 items-center px-2 text-sm font-bold text-blue-700 hover:underline">View word details</Link>
          </div> : null}

          <p className="mt-4 text-center text-sm leading-6 text-slate-600">{revealed ? "Did you recall the meaning before flipping? Choose one to continue." : "Try to recall the meaning, then reveal the answer."}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
            <button type="button" onClick={previous} disabled={currentIndex === 0} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-2 text-sm font-bold text-slate-700 hover:border-blue-500 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4">Previous</button>
            {revealed ? <><button type="button" onClick={() => rate("retry")} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-amber-400 bg-amber-100 px-2 text-sm font-extrabold text-amber-950 hover:bg-amber-200 sm:px-4">Practice again</button><button type="button" onClick={() => rate("known")} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-blue-600 px-2 text-sm font-bold text-white hover:bg-blue-700 sm:px-4">Remembered</button></> : <><button type="button" onClick={() => setRevealed(true)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-amber-400 bg-amber-300 px-2 text-sm font-extrabold text-slate-950 hover:bg-amber-200 sm:px-4">Show answer</button><button type="button" onClick={next} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-blue-600 px-2 text-sm font-bold text-white hover:bg-blue-700 sm:px-4">{currentIndex === words.length - 1 ? "Finish" : "Skip"}</button></>}
          </div>
          <div className="mt-4 flex justify-center"><button type="button" onClick={() => newRandomSet()} className="inline-flex min-h-11 items-center justify-center px-4 text-sm font-bold text-blue-700 hover:underline">New random set</button></div>
        </div>
        : <div className="mx-auto max-w-[720px] rounded-2xl border border-slate-200 bg-white p-8 text-center" aria-live="polite"><h3 className="text-xl font-bold text-slate-950">No cards available</h3><p className="mt-2 text-slate-600">The published vocabulary table remains available in Browse vocabulary.</p></div>}
      <p className="mx-auto mt-5 max-w-[720px] text-center text-xs leading-5 text-slate-500">Quick Flashcards is a lightweight self-check. Choices stay on this page unless you sign in and explicitly add marked words to Review.</p>
    </div>
  </section>;
}
