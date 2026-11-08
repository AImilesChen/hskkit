"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ExamOption, FormalView, Form, RubyToken, StudentItem, StudentPart } from "@/lib/formal-exams/hsk4/types";
import { examPhase } from "@/lib/formal-exams/hsk4/domain";
import { googleSignInHref } from "@/lib/account/sign-in";

function Ruby({ tokens, text }: { tokens?: RubyToken[]; text?: string }) {
  return <span lang="zh-Hans" className="formal-ruby">{tokens?.length ? tokens.map((t, i) => t.pinyin ? <ruby key={i}>{t.text}<rt>{t.pinyin}</rt></ruby> : <span key={i}>{t.text}</span>) : text}</span>;
}
const messages: Record<string, string> = {
  SIGN_IN_REQUIRED: "Sign in to open this Pro paper.", PRO_REQUIRED: "Paper B and Paper C are included with Pro.",
  ACCOUNT_UNAVAILABLE: "This account cannot access the exam right now.", EXAM_NOT_FOUND: "This attempt is not available in this browser or account.",
  REVISION_CONFLICT: "This attempt changed in another tab. Reload the saved attempt, then try again.",
  SECTION_LOCKED: "That section is closed. Reload to continue with the current section.",
  EXAM_TIME_EXPIRED: "Time is up. Submit your saved answers to see the result.",
};
const formatTime = (n: number) => `${Math.floor(Math.max(0, n) / 60)}:${String(Math.max(0, n) % 60).padStart(2, "0")}`;
export function FormalRunner({ form }: { form: Form }) {
  const [session, setSession] = useState<FormalView>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState<Record<string, unknown>>();
  const [partIndex, setPartIndex] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [clockOffset, setClockOffset] = useState(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmRetake, setConfirmRetake] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [startKey, setStartKey] = useState("");
  const autoSubmitted = useRef(false);
  const audio = useRef<HTMLAudioElement>(null);
  const storageKey = `hskkit_formal_hsk4_${form}`;
  const path = `/hsk-test-prep/hsk-4/mock/${form}`;
  function accept(value: FormalView) {
    setSession(value); setClockOffset(Date.parse(value.serverNow) - Date.now());
    try { localStorage.setItem(storageKey, value.id); } catch { /* Server saves remain usable. */ }
  }
  async function restore(id: string) {
    setLoading(true); setError("");
    try { const r = await fetch(`/api/v1/formal-exams/hsk4?sessionId=${encodeURIComponent(id)}`, { cache: "no-store" }); const d = await r.json(); if (!r.ok) throw new Error(d.error); if (d.session.form !== form) throw new Error("EXAM_NOT_FOUND"); accept(d.session); }
    catch (e) { setError(e instanceof Error ? e.message : "EXAM_UNAVAILABLE"); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    setStartKey(crypto.randomUUID());
    let id = new URLSearchParams(location.search).get("session");
    try { id ??= localStorage.getItem(storageKey); } catch { /* Optional local resume pointer. */ }
    if (id) void restore(id); else setLoading(false);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
    // Each form has its own mounted runner and resume pointer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);
  const phase = session ? examPhase(session.startedAt, new Date(now + clockOffset).toISOString()) : "listening";
  const remaining = session ? Math.ceil((Date.parse(session.deadlineAt) - now - clockOffset) / 1000) : 4800;
  useEffect(() => {
    if (session?.status === "in_progress" && phase === "reading") setPartIndex(i => Math.max(2, i));
  }, [phase, session?.status]);
  useEffect(() => { if (session?.status === "in_progress" && phase === "writing") setPartIndex(i => Math.max(7, i)); }, [phase, session?.status]);
  useEffect(() => {
    if (phase !== "listening") audio.current?.pause();
  }, [phase]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    if (session?.status === "in_progress") window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [session?.status]);
  async function action(payload: Record<string, unknown>) {
    setBusy(true); setError(""); setRetry(undefined);
    try {
      const r = await fetch("/api/v1/formal-exams/hsk4", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (d.session) accept(d.session);
      setConfirmSubmit(false);
      return true;
    } catch (e) {
      const code = e instanceof Error ? e.message : "EXAM_UNAVAILABLE";
      setError(code);
      if (!["SIGN_IN_REQUIRED", "PRO_REQUIRED", "ACCOUNT_UNAVAILABLE", "EXAM_NOT_FOUND", "REVISION_CONFLICT", "SECTION_LOCKED", "EXAM_TIME_EXPIRED"].includes(code)) setRetry(payload);
      return false;
    } finally { setBusy(false); }
  }
  useEffect(() => {
    if (session?.status === "in_progress" && phase === "expired" && !busy && !autoSubmitted.current) {
      autoSubmitted.current = true;
      void action({ action: "submit", sessionId: session.id, key: crypto.randomUUID() });
    }
    // Submission failures expose a deliberate retry; never loop requests at the deadline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, session?.id, session?.status, busy]);
  const result = session?.result;
  const paper = session?.paper;
  const part = paper?.parts[partIndex];
  const saved = Object.fromEntries(session?.answers.map(a => [a.questionId, a.answer]) ?? []);
  const answered = Object.values(saved).filter(Boolean).length;
  const editable = (section: string) => section === phase || (section === "listening" && phase === "transfer");
  const choose = (q: StudentItem, answer: string) => void action({ action: "answer", sessionId: session!.id, questionId: q.id, answer, key: crypto.randomUUID() });
  function option(opt: ExamOption, label: string) {
    return opt.imageId && paper ? <img src={paper.images[opt.imageId]} alt={`Picture ${label}`} width={240} height={160} /> : <Ruby tokens={opt.ruby} text={opt.text} />;
  }
  function displayStem(q: StudentItem) { return q.passageId ? (q.stem.includes("\n★ ") ? q.stem.split("\n★ ").slice(1).join("\n★ ") : `请选择第${q.number}空的句子。`) : q.stem; }
  function question(q: StudentItem, p: StudentPart, example = false) {
    const opts = q.options ?? p.sharedOptions ?? {};
    const feedback = result?.items.find(i => i.questionId === q.id);
    return <article className="formal-question" key={q.id} id={`q-${q.number ?? p.id}`}>
      <div className="formal-question-top"><strong>{example ? "Example · not scored" : `Question ${q.number}`}</strong>{feedback && <span className={`formal-badge ${feedback.manual ? "" : feedback.correct ? "formal-correct" : "formal-wrong"}`}>{feedback.manual ? "Self-review" : feedback.correct ? "Correct" : feedback.answer ? "Incorrect" : "Unanswered"}</span>}</div>
      {displayStem(q) && <p className="formal-stem"><Ruby tokens={q.stemRuby} text={displayStem(q)} /></p>}
      {example && p.section === "listening" && <p>The example is included in the full recording.</p>}
      {!example && !q.stem && !q.component && <p className="formal-listen-cue">Listen to question {q.number} in the recording.</p>}
      {q.writing && paper && <img className="formal-component-image" src={paper.images[q.writing.imageId]} alt="Sentence writing prompt" width={320} height={240} />}
      {q.component && paper && <img className="formal-component-image" src={paper.images[q.component.imageId]} alt="Complete the missing component" width={320} height={240} />}
      {p.section === "writing" && !p.sharedOptions ? <WritingAnswer question={q} value={example ? p.example!.answer : saved[q.id] ?? ""} disabled={example || busy || !!result || !editable("writing")} save={answer => choose(q, answer)} /> : p.sharedOptions ? <div className="formal-letter-choices" role="group" aria-label={`Answer for ${example ? "example" : `question ${q.number}`}`}>
        {Object.keys(opts).map(label => <button type="button" key={label} aria-pressed={example ? label === p.example!.answer : saved[q.id] === label} disabled={example || busy || !!result || phase === "expired" || !editable(p.section)}
          onClick={() => choose(q, label)}>{label}{example && label === p.example!.answer ? " ✓" : ""}</button>)}
      </div> : <div className={`formal-options ${Object.values(opts).some(o => o.imageId) ? "formal-image-options" : ""}`}>
        {Object.entries(opts).map(([label, opt]) => <button type="button" key={label} aria-pressed={example ? label === p.example!.answer : saved[q.id] === label} disabled={example || busy || !!result || phase === "expired" || !editable(p.section)}
          onClick={() => choose(q, label)}><span className="formal-option-label">{label}</span>{option(opt, label)}{example && label === p.example!.answer && <span>✓</span>}</button>)}
      </div>}
      {example && <p className="formal-example-answer">Example answer: <strong>{p.example!.answer}</strong>{p.sharedOptions ? " · Use the other five options for the five questions." : ""}</p>}
      {feedback && <div className="formal-explanation"><p><strong>Your answer: {feedback.answer ?? "—"} · {feedback.manual ? "Reference response" : "Correct answer"}: {feedback.correctAnswer}</strong></p><p>{feedback.explanation}</p>
        {feedback.audioSrc && <audio controls preload="none" src={feedback.audioSrc} aria-label={`Recording for question ${q.number}`} />}
        {feedback.script.length > 0 && <details><summary>Listening transcript</summary>{feedback.script.map((s, i) => <p key={i}><Ruby tokens={s.ruby} text={s.text} /></p>)}</details>}
      </div>}
    </article>;
  }
  return <>
    <nav className="test-breadcrumb" aria-label="Breadcrumb"><Link href="/hsk-test-prep/hsk-4/mock">HSK 4 mock exams</Link><span>/</span><span>Paper {form.toUpperCase()}</span></nav>
    <header className="formal-runner-heading"><div><p className="test-eyebrow">{form === "a" ? "Free complete paper" : "Pro complete paper"}</p><h1>HSK 4 · Paper {form.toUpperCase()}</h1></div>{session && <span className="formal-badge">{result ? "Completed" : "Timed practice"}</span>}</header>
    {error && <div className="formal-error" role="alert"><p>{messages[error] ?? "We couldn’t save or load this step. Your previously saved answers are safe. Try again."}</p>
      {retry && <button disabled={busy} onClick={() => void action(retry)}>Retry {retry.action === "answer" ? "saving answer" : "request"}</button>}
      {session && <button disabled={busy} onClick={() => void restore(session.id)}>Reload saved attempt</button>}
      {["SIGN_IN_REQUIRED", "PRO_REQUIRED"].includes(error) && <div className="formal-actions"><Link href={googleSignInHref(path)}>Sign in</Link><Link href="/pricing">See Pro plans →</Link><Link href="/hsk-test-prep/hsk-4/mock/a">Try free Paper A</Link></div>}
    </div>}
    {loading ? <p role="status">Loading your saved attempt…</p> : !session ? <section className="formal-preparation">
      <div><h2>Get ready for your complete paper.</h2><p>70 questions · Listening 32, reading 32, writing 6 · 80 timed minutes.</p><ol><li>Find a quiet place and check your device volume.</li><li>Each dialogue or passage is read once. Listening lasts 20 minutes; questions 22–29 share passages in pairs and 30–32 share one passage.</li><li>You then have 5 minutes to check listening answers, 30 minutes for reading and 25 minutes for writing.</li><li>Choices save as you select them. For writing, complete five picture sentences (65–69) and a short passage of at least 80 Chinese characters (70), then select Save answer for each response. The timer keeps running if you leave.</li></ol><p>Allow up to 5 minutes to get ready before you start. This is independent practice, scored out of 64 objective marks; all six writing tasks need self-review.</p></div>
      <div className="formal-ready-card"><p className="formal-badge">{form === "a" ? "Free · no account needed" : "Pro access required"}</p><h3>Ready when you are.</h3><p>Test your sound with the first dialogue. This is question 1, not an extra example.</p><audio controls preload="none" src={`/api/v1/formal-exams/hsk4/media/${form}/hsk4-${form}-v1-q01.mp3`} aria-label="Sound check" /><button className="test-primary-link" type="button" disabled={busy || !startKey} onClick={() => void action({ action: "start", form, key: startKey })}>{busy ? "Opening paper…" : `Start Paper ${form.toUpperCase()} →`}</button>
      {error === "EXAM_NOT_FOUND" && <p>You can start a fresh attempt above.</p>}</div>
    </section> : <>
      {result ? <section className="formal-result"><div><p className="test-eyebrow">Your result</p><h2>{result.correct}<span> / 64 objective marks</span></h2><p>Raw marks · Independent practice</p></div><div className="formal-score-grid"><p><strong>{result.listening} / 32</strong><span>Listening</span></p><p><strong>{result.reading} / 32</strong><span>Reading</span></p><p><strong>6 tasks</strong><span>Writing · self-review</span></p><p><strong>{answered} / 70</strong><span>Answered</span></p></div><p>Writing is not automatically graded. Review the five picture sentences separately: 1 for a complete, grammatical sentence fitting the picture and using the keyword, 0.5 for an understandable response with minor errors, otherwise 0. Review the short passage out of 10 separately: content 4, organisation 2, language 4; check the 80-Chinese-character minimum. Reference responses are examples, not unique answers. Writing marks are not combined with the 64 objective marks. No official scaled score or pass prediction.</p></section> : <section className="formal-session-bar" aria-label="Exam progress"><div><strong>{phase === "listening" ? "Listening" : phase === "transfer" ? "Check listening answers" : phase === "reading" ? "Reading" : phase === "writing" ? "Writing" : "Time is up"}</strong><span>{answered} / 70 answers saved</span></div><div className="formal-time"><strong>{formatTime(remaining)}</strong><span>remaining</span></div><button type="button" disabled={busy} onClick={() => setConfirmSubmit(true)}>Submit paper</button></section>}
      {!result && phase === "listening" && <section className="formal-audio"><div><h2>Listening recording</h2><p>Keep the full recording playing as you answer the listening parts.</p></div><audio ref={audio} controls preload="metadata" src={paper!.fullAudio} aria-label="Full listening recording"
        onLoadedMetadata={() => { const elapsed = (Date.now() + clockOffset - Date.parse(session.startedAt)) / 1000; if (audio.current && elapsed > 5 && elapsed < 1200) audio.current.currentTime = elapsed; }}
        onError={() => setAudioError(true)} />{audioError && <p role="alert">The recording could not load. <button onClick={() => { setAudioError(false); audio.current?.load(); }}>Reload recording</button> The exam clock continues.</p>}</section>}
      {!result && phase === "transfer" && <p className="formal-phase-note">Check your listening answers. Reading opens in {formatTime(Math.ceil(1500 - (now + clockOffset - Date.parse(session.startedAt)) / 1000))}.</p>}
      {confirmSubmit && <section className="formal-confirm" role="region" aria-label="Confirm submission"><h2>Submit this paper?</h2><p>{70 - answered} questions are unanswered. You can’t change answers after submitting.</p><div className="formal-actions"><button className="test-primary-link" disabled={busy} onClick={() => void action({ action: "submit", sessionId: session.id, key: crypto.randomUUID() })}>Submit &amp; see results</button><button disabled={busy} onClick={() => setConfirmSubmit(false)}>Keep working</button></div></section>}
      <div className="formal-workspace"><nav className="formal-part-nav" aria-label="Exam parts">{paper!.parts.map((p, i) => <button type="button" key={p.id} disabled={!result && !editable(p.section)}
        aria-current={partIndex === i ? "step" : undefined} onClick={() => setPartIndex(i)}><span>{p.id} · {p.section === "listening" ? "Listening" : p.section === "writing" ? "Writing" : "Reading"}</span><small>{p.questions.filter(q => saved[q.id]).length} / {p.questions.length} answered</small></button>)}</nav>
      {part && <section className="formal-part" aria-labelledby="formal-part-title"><header><p className="test-eyebrow">{part.id} · Questions {part.questions[0].number}–{part.questions.at(-1)!.number}</p><h2 id="formal-part-title">{part.title}</h2><p lang="zh-Hans">{part.instruction}</p></header>
        {part.sharedOptions && <section className="formal-shared" aria-label="Shared options"><h3>Options {Object.keys(part.sharedOptions).join(" · ")}</h3><div className={`formal-shared-grid ${Object.values(part.sharedOptions).some(o => o.imageId) ? "formal-shared-images" : ""}`}>{Object.entries(part.sharedOptions).map(([label, opt]) => <div key={label}><strong>{label}</strong>{option(opt, label)}</div>)}</div></section>}
        {part.example && <details className="formal-example"><summary>View worked example</summary>{question(part.example, part, true)}</details>}
        {!result && !editable(part.section) ? <p className="formal-phase-note">This section is closed.</p> : part.questions.map((q, i) => <div key={q.id}>{q.passageId && part.questions[i - 1]?.passageId !== q.passageId && <section className="formal-reading-passage" aria-label={`Passage for question ${q.number}`} lang="zh-Hans">{q.stem.split("\n★ ")[0]}</section>}{question(q, part)}</div>)}
        <div className="formal-actions"><button disabled={partIndex === 0} onClick={() => setPartIndex(i => i - 1)}>← Previous part</button><button disabled={partIndex === 8 || (!result && !editable(paper!.parts[partIndex + 1]?.section ?? ""))} onClick={() => { setPartIndex(i => i + 1); document.getElementById("formal-part-title")?.scrollIntoView({ block: "start" }); }}>Next part →</button></div>
      </section>}</div>
      <div className="formal-end-actions">{result ? <><button onClick={() => setConfirmRetake(true)}>Take this paper again</button><Link href="/hsk-test-prep/hsk-4/mock">Choose another paper →</Link></> : <p aria-live="polite">{busy ? "Saving…" : "Answers saved on the server. Leaving does not pause the timer."}</p>}</div>
      {confirmRetake && <section className="formal-confirm"><h2>Start a new attempt?</h2><p>Your completed result stays in recent attempts.</p><button onClick={() => { setSession(undefined); setStartKey(crypto.randomUUID()); setConfirmRetake(false); setPartIndex(0); autoSubmitted.current = false; try { localStorage.removeItem(storageKey); } catch {} history.replaceState(null, "", path); }}>Prepare a new attempt</button><button onClick={() => setConfirmRetake(false)}>Cancel</button></section>}
    </>}
  </>;
}

function WritingAnswer({ question, value, disabled, save }: { question: StudentItem; value: string; disabled: boolean; save: (value: string) => void }) {
 const [draft, setDraft] = useState(value);
 useEffect(() => setDraft(value), [value]);
 const essay = !!question.essay;
 const count = Array.from(draft).filter(c => /\p{Script=Han}/u.test(c)).length;
 return <div className="formal-writing-answer"><label>{essay ? "Write your short passage" : "Write one complete sentence"}<textarea lang="zh-Hans" aria-label={`Answer for question ${question.number}`} value={draft} disabled={disabled} maxLength={essay ? 2000 : 200} rows={essay ? 10 : 3} onChange={e => setDraft(e.target.value)} /></label>
 {essay && <p className="formal-writing-count" role="status">{count} Chinese characters · at least {question.essay!.minimumChineseCharacters} required{count < question.essay!.minimumChineseCharacters ? " · You can save your draft below the minimum." : " · Minimum reached"}</p>}
 <button type="button" disabled={disabled || draft === value} onClick={() => save(draft)}>Save answer</button><span>{draft === value ? "Saved" : "Unsaved - select Save answer"}</span></div>;
}
