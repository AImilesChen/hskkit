"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AudioPlaybackControl } from "../../../components/audio-playback-control";
import type { PublicTopicPracticeQuestion, TopicPracticeMode } from "@/lib/topics/practice";
import { TopicIcon } from "../../topic-visuals";
import { topicIconFor, topicVisualFor } from "@/lib/topics/visuals";

type Props = { topicSlug: string; topicTitle: string; visualKey: string; categorySlug: string; questions: PublicTopicPracticeQuestion[] };
type Feedback = { correct: boolean; correctAnswerText: string; explanation?: string };
type LearningView = { queueBinding: string; revision: number; feedback?: Feedback; message?: string; playbackTicket?: string };
const labels: Record<TopicPracticeMode, string> = { meaning: "Meaning", pinyin: "Pinyin", listening: "Listening", scene: "Scene" };

export function TopicPracticeClient({ topicSlug, topicTitle, visualKey, categorySlug, questions }: Props) {
  const [view, setView] = useState<LearningView | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);
  const [playbackTicket, setPlaybackTicket] = useState("");
  const [playbackReady, setPlaybackReady] = useState(false);
  const attemptKeys = useRef<Record<string, string>>({});
  const question = questions[index];
  const visual = topicVisualFor(categorySlug);
  const progress = useMemo(() => Math.round(((finished ? questions.length : index) / questions.length) * 100), [finished, index, questions.length]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/v1/learning", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const body = await response.json() as LearningView;
      if (!response.ok) throw new Error(body.message || "Learning state is unavailable.");
      setView(body);
    }).catch((reason) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Learning state is unavailable.");
    });
    return () => controller.abort();
  }, []);

  async function post(action: string, payload: Record<string, unknown>) {
    if (!view) throw new Error("Learning state is still loading.");
    const response = await fetch("/api/v1/learning", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, queueBinding: view.queueBinding, clientRevision: view.revision, payload }),
    });
    const body = await response.json() as LearningView;
    if (!response.ok) throw new Error(body.message || "That action could not be saved.");
    return body;
  }

  async function authorizePlayback() {
    if (question.mode !== "listening" || !question.audioAsset || busy) return false;
    setBusy(true);
    setError("");
    setPlaybackReady(false);
    try {
      const started = await post("topic_practice_playback_start", {
        topicSlug, questionId: question.id, idempotencyKey: `topic-play-start-${crypto.randomUUID()}`,
      });
      if (!started.playbackTicket) throw new Error("Playback could not start.");
      setPlaybackTicket(started.playbackTicket);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Playback could not start.");
      setBusy(false);
      return false;
    }
  }

  async function finishPlayback() {
    if (!playbackTicket) { setBusy(false); return; }
    try {
      await post("topic_practice_playback_complete", {
        topicSlug, questionId: question.id, playbackTicket,
        idempotencyKey: `topic-play-complete-${crypto.randomUUID()}`,
      });
      setPlaybackReady(true);
    } catch (reason) {
      setPlaybackReady(false);
      setError(reason instanceof Error ? reason.message : "Listen to the complete audio before answering.");
    } finally {
      setBusy(false);
    }
  }

  function failPlayback() {
    setPlaybackTicket("");
    setPlaybackReady(false);
    setBusy(false);
    setError("Audio playback failed. Retry the audio before answering.");
  }

  async function submit() {
    if (!question || !selected || busy || feedback) return;
    if (!view) { setError("Learning state is still loading."); return; }
    if (question.mode === "listening" && !playbackReady) { setError("Play the complete synthesized listening audio before answering."); return; }
    setBusy(true);
    setError("");
    try {
      const idempotencyKey = attemptKeys.current[question.id] ?? `topic-practice-${crypto.randomUUID()}`;
      attemptKeys.current[question.id] = idempotencyKey;
      const data = await post("topic_practice_attempt", {
        topicSlug,
        questionId: question.id,
        answer: selected,
        playbackTicket: question.mode === "listening" ? playbackTicket : undefined,
        idempotencyKey,
      });
      if (!data.feedback) throw new Error("ANSWER_SAVE_FAILED");
      setView(data);
      setFeedback(data.feedback);
      if (data.feedback.correct) setCorrectCount((value) => value + 1);
      else setMistakeCount((value) => value + 1);
    } catch {
      setError("Your answer was not saved. Check your connection and try again; the session has not advanced.");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (!feedback) return;
    if (index + 1 >= questions.length) { setFinished(true); return; }
    setIndex((value) => value + 1);
    setSelected(""); setFeedback(null); setError(""); setPlaybackTicket(""); setPlaybackReady(false);
  }

  function restart() {
    attemptKeys.current = {};
    setIndex(0); setSelected(""); setFeedback(null); setCorrectCount(0); setMistakeCount(0); setFinished(false); setPlaybackTicket(""); setPlaybackReady(false); setError("");
  }

  if (finished) return <section className={`mt-6 rounded-3xl border bg-white p-6 shadow-[0_22px_55px_-44px_rgba(15,23,42,0.45)] sm:p-[32px] ${visual.border}`} aria-live="polite">
    <div className="flex items-start gap-4"><span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${visual.iconSurface} ${visual.iconText}`}><TopicIcon name={topicIconFor(visualKey)} className="size-8" title={`${topicTitle} icon`} /></span><div><p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">Session complete</p><h2 className="mt-2 text-3xl font-black text-slate-950">You finished {topicTitle}</h2></div></div>
    <div className="mt-6 grid grid-cols-3 gap-3 text-center"><div className="rounded-2xl bg-slate-100 p-4"><p className="text-2xl font-black text-slate-950">{questions.length}</p><p className="mt-1 text-xs font-bold text-slate-600">Answered</p></div><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-2xl font-black text-emerald-800">{correctCount}</p><p className="mt-1 text-xs font-bold text-emerald-700">Correct</p></div><div className="rounded-2xl bg-rose-50 p-4"><p className="text-2xl font-black text-rose-800">{mistakeCount}</p><p className="mt-1 text-xs font-bold text-rose-700">Review mistakes</p></div></div>
    <p className="mt-5 text-sm leading-6 text-slate-600">Results are already in your existing Attempts, spaced review and Mistakes. Repeated word skills share the same review card rather than creating duplicates.</p>
    <div className="mt-6 grid gap-3 sm:grid-cols-2"><Link href="/review" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700">Open Review</Link><Link href="/mistakes" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-black text-slate-800 hover:border-blue-400">Review mistakes</Link><button type="button" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-black text-slate-800 hover:border-blue-400" onClick={restart}>Practice again</button><Link href={`/topics/${topicSlug}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-black text-slate-800 hover:border-blue-400">Back to topic</Link></div>
  </section>;

  return <section className="mt-4 sm:mt-6" aria-labelledby="topic-practice-question">
    <div className="flex items-center justify-between gap-4"><p className="text-sm font-black text-slate-700">Question {index + 1} of {questions.length}</p><p className="text-sm font-bold text-slate-500">{correctCount} correct</p></div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200" aria-label={`${progress}% complete`}><div className={`h-full rounded-full transition-[width] duration-200 ${visual.line}`} style={{ width: `${progress}%` }} /></div>
    <article className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_22px_55px_-44px_rgba(15,23,42,0.45)] sm:mt-5 sm:rounded-3xl sm:p-[32px]">
      <div className="flex flex-wrap items-center justify-between gap-3"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ${visual.surface} ${visual.mutedText}`}><TopicIcon name={topicIconFor(visualKey)} className="size-4" />{labels[question.mode]}</span><p className="text-sm font-bold text-slate-500">{question.instruction}</p></div>
      {question.context ? <pre className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 font-sans text-base leading-7 text-slate-100" lang="zh-Hans">{question.context}</pre> : null}
      {question.mode === "listening" ? <div className="mt-5"><AudioPlaybackControl asset={question.audioAsset} beforePlay={authorizePlayback} onComplete={() => void finishPlayback()} onFailure={failPlayback} />{playbackReady ? <p className="mt-2 text-sm font-bold text-emerald-800">Listening verified. Choose your answer.</p> : null}</div> : null}
      <h2 id="topic-practice-question" className="mt-4 text-xl font-black leading-tight text-slate-950 sm:mt-[24px] sm:text-3xl">{question.prompt}</h2>
      <div className="mt-4 grid gap-3 sm:mt-[24px] sm:grid-cols-2" role="radiogroup" aria-label="Answer choices">{question.options.map((option) => { const active = selected === option.key; const correctChoice = feedback && option.text === feedback.correctAnswerText; return <button key={option.key} type="button" role="radio" aria-checked={active} disabled={Boolean(feedback) || busy} onClick={() => setSelected(option.key)} className={`min-h-14 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${correctChoice ? "border-emerald-500 bg-emerald-50 text-emerald-950" : active ? "border-blue-600 bg-blue-50 text-blue-950" : "border-slate-200 bg-white text-slate-800 hover:border-blue-300"}`}><span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-black">{option.key}</span>{option.text}</button>; })}</div>
      {error ? <p className="mt-4 rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-800" role="alert">{error}</p> : null}
      {feedback ? <div className={`mt-5 rounded-2xl p-5 ${feedback.correct ? "bg-emerald-50 text-emerald-950" : "bg-amber-50 text-amber-950"}`} aria-live="polite"><p className="font-black">{feedback.correct ? "Correct" : `Correct answer: ${feedback.correctAnswerText}`}</p>{feedback.explanation ? <p className="mt-2 text-sm leading-6">{feedback.explanation}</p> : null}</div> : null}
      <div className="mt-6 flex flex-wrap justify-between gap-3"><Link href={`/topics/${topicSlug}`} className="inline-flex min-h-11 items-center px-2 text-sm font-bold text-slate-600 hover:text-blue-700">Exit session</Link>{feedback ? <button type="button" onClick={next} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-black text-white hover:bg-slate-800">{index + 1 === questions.length ? "Finish session" : "Next question"}</button> : <button type="button" onClick={() => void submit()} disabled={!selected || busy || !view} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">{busy ? "Checking…" : "Check answer"}</button>}</div>
    </article>
  </section>;
}
