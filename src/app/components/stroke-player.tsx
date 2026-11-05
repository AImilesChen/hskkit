"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type HanziWriter from "@/lib/strokes/vendor/hanzi-writer";
import { loadStrokeData } from "@/lib/strokes/load";
import { strokeCounts, strokeDataPath, type StrokeData } from "@/lib/strokes/domain";
import "./stroke-player.css";

function StrokeDiagram({ data, index }: { data: StrokeData; index: number }) {
  return <svg viewBox="0 0 1024 1024" aria-hidden="true"><g transform="translate(0,900) scale(1,-1)">{data.strokes.map((path, i) => <path key={i} d={path} fill={i === index ? "#c45b37" : i < index ? "#334155" : "#e2e8f0"}/>)}</g></svg>;
}

export default function StrokePlayer({ character, worksheetText = character, embedded = false, characterNavigation }: { character: string; worksheetText?: string; embedded?: boolean; characterNavigation?: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const writer = useRef<HanziWriter | null>(null);
  const operation = useRef(0);
  const [mode, setMode] = useState<"watch" | "practice">("watch");
  const [speed, setSpeed] = useState("1");
  const [retry, setRetry] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "unsupported">("loading");
  const [data, setData] = useState<StrokeData>();
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [misses, setMisses] = useState(0);
  const [step, setStep] = useState(-1);
  const [message, setMessage] = useState("");
  const [outline, setOutline] = useState(true);

  useEffect(() => {
    const abort = new AbortController();
    let instance: HanziWriter | null = null;
    let disposed = false;
    let observer: ResizeObserver | undefined;
    const id = ++operation.current;
    const cancelPendingOperation = () => { operation.current += 1; };
    setRunning(false); setPaused(false); setProgress(0); setMisses(0); setStep(-1); setMessage(""); setData(undefined);
    if (!strokeDataPath(character)) { setStatus("unsupported"); return; }
    setStatus("loading");
    void Promise.all([loadStrokeData(character, abort.signal), import("@/lib/strokes/vendor/hanzi-writer.js")]).then(async ([loaded, library]) => {
      if (disposed || !host.current) return;
      setData(loaded);
      const canvas = document.createElement("div");
      host.current.replaceChildren(canvas);
      instance = library.default.create(canvas, character, {
        width: host.current.clientWidth || 280, height: host.current.clientWidth || 280, padding: 20,
        charDataLoader: () => loaded,
        showCharacter: false, showOutline: true,
        strokeColor: "#334155", highlightColor: "#c45b37", drawingColor: "#247463", outlineColor: "#dce2ea",
        strokeAnimationSpeed: Number(speed), delayBetweenStrokes: 180,
      });
      writer.current = instance;
      observer = new ResizeObserver(entries => {
        const width = entries[0]?.contentRect.width;
        if (width && !disposed) instance?.updateDimensions({ width, height: width, padding: 20 });
      });
      observer.observe(host.current);
      await instance.getCharacterData();
      if (disposed || operation.current !== id) return;
      setStatus("ready"); setOutline(true);
      if (mode === "practice") {
        setMessage("Draw the first stroke. Hints appear after three misses.");
        void instance.quiz({
          showHintAfterMisses: 3, acceptBackwardsStrokes: false,
          onCorrectStroke: result => { if (!disposed) { setProgress(result.strokeNum + 1); setMessage(`${result.strokesRemaining} ${result.strokesRemaining === 1 ? "stroke" : "strokes"} remaining.`); } },
          onMistake: result => { if (!disposed) { setMisses(result.totalMistakes); setMessage(`Try stroke ${result.strokeNum + 1} again, following its direction. ${result.totalMistakes} ${result.totalMistakes === 1 ? "miss" : "misses"} so far.`); } },
          onComplete: result => {
            if (disposed) return;
            setProgress(loaded.strokes.length);
            setMessage(`Completed ${character}: ${loaded.strokes.length} strokes, ${result.totalMistakes} ${result.totalMistakes === 1 ? "miss" : "misses"}. Try again or create a worksheet.`);
            try {
              const raw = JSON.parse(localStorage.getItem("hskkit.stroke-practice.v1") || "[]");
              const previous = Array.isArray(raw) ? raw.slice(0, 19) : [];
              localStorage.setItem("hskkit.stroke-practice.v1", JSON.stringify([{ character, misses: result.totalMistakes, completedAt: new Date().toISOString() }, ...previous]));
              window.dispatchEvent(new Event("hskkit:stroke-completed"));
            } catch { /* Practice works when storage is unavailable. */ }
          },
        });
      }
    }).catch(() => { if (!disposed) { setStatus("error"); setMessage("Could not load the writing guide. Check your connection and try again."); } });
    return () => {
      disposed = true; abort.abort(); cancelPendingOperation();
      observer?.disconnect();
      instance?.destroy();
      if (writer.current === instance) writer.current = null;
    };
  }, [character, speed, retry, mode]);

  async function play() {
    const instance = writer.current;
    if (!instance || !data || status !== "ready") return;
    const id = ++operation.current;
    setStep(-1); setRunning(true); setPaused(false); setProgress(0); setMessage("");
    try {
      await instance.hideCharacter({ duration: 0 });
      for (let i = 0; i < data.strokes.length; i++) {
        if (operation.current !== id) return;
        setProgress(i + 1);
        await instance.animateStroke(i);
      }
      if (operation.current === id) { setRunning(false); setMessage("Animation complete. Replay, explore each stroke or try writing it yourself."); }
    } catch { if (operation.current === id) { setRunning(false); setMessage("Playback stopped. Reset the guide and try again."); } }
  }
  function togglePause() {
    if (paused) void writer.current?.resumeAnimation();
    else void writer.current?.pauseAnimation();
    setPaused(!paused);
  }
  function showStep(index: number) {
    ++operation.current; void writer.current?.pauseAnimation();
    setRunning(false); setPaused(false); setStep(index); setProgress(index + 1); setMessage(`Stroke ${index + 1} is shown in orange.`);
  }
  const available = status === "ready" && Boolean(data);
  return <section className="stroke-player" aria-label={`Stroke order and writing for ${character}`}>
    <div className="stroke-player-top"><div><p className="stroke-kicker">Watch. Trace. Remember.</p><h2>Write {character}, one stroke at a time.</h2></div><span className="stroke-count">{strokeCounts[character] ? `${strokeCounts[character]} strokes` : "Guide unavailable"}</span></div>
    {characterNavigation}
    <div className="stroke-mode" role="group" aria-label="Writing mode"><button type="button" aria-pressed={mode === "watch"} onClick={() => setMode("watch")}>Watch stroke order</button><button type="button" aria-pressed={mode === "practice"} onClick={() => setMode("practice")}>Practise writing</button></div>
    <div className="stroke-workspace"><div>
      <div className={`stroke-board ${mode === "practice" ? "is-practice" : ""}`} role="group" aria-label={mode === "practice" ? `Draw ${character} here with a mouse or finger` : `Stroke animation for ${character}`}>
        <div className={available && step < 0 ? "stroke-canvas" : "stroke-canvas is-hidden"} ref={host}/>
        {available && data && step >= 0 && <div className="stroke-step-diagram"><StrokeDiagram data={data} index={step}/></div>}
        {status === "loading" && <p className="stroke-board-state" role="status">Loading writing guide…</p>}
        {status === "unsupported" && <p className="stroke-board-state">{character}<small>Stroke order is not available for this character in the current release.</small></p>}
        {status === "error" && <div className="stroke-board-state"><p>Writing guide could not load.</p><button type="button" onClick={() => setRetry(n => n + 1)}>Try loading again</button></div>}
      </div>
      <p className="stroke-feedback" role="status" aria-live="polite">{message || (available ? mode === "practice" ? "Draw with a mouse or finger. This is a stroke-path exercise, not a handwriting grade." : "Press Play to see the writing sequence." : "")}</p>
    </div><div className={`stroke-controls ${mode === "practice" ? "is-practice" : ""}`}>
      <div className="stroke-control-card">
        <div className="stroke-control-heading"><h3>{mode === "watch" ? "Animation" : "Writing practice"}</h3><span className="stroke-progress">{progress} / {strokeCounts[character] || 0} strokes</span></div>
        <p className="stroke-control-help">{mode === "watch" ? "Watch the sequence, or inspect one stroke at a time." : "Follow the outline with a mouse or finger, one stroke at a time."}</p>
        {mode === "watch" ? <>
          <div className="stroke-playback-row"><button className="stroke-primary" type="button" disabled={!available} onClick={() => running ? togglePause() : void play()}>{running ? paused ? "Continue" : "Pause" : progress ? "Replay" : "Play"}</button><label className="stroke-speed">Speed<select value={speed} disabled={!available || running} onChange={e => setSpeed(e.target.value)}><option value="0.5">Slow · 0.5×</option><option value="1">Normal · 1×</option><option value="1.5">Fast · 1.5×</option></select></label></div>
          <div className="stroke-step-row" role="group" aria-label="Inspect individual strokes"><button type="button" aria-label="Previous stroke" disabled={!available || step <= 0} onClick={() => showStep(step - 1)}><span aria-hidden="true">←</span><span className="stroke-step-word">Previous stroke</span></button><span>{step < 0 ? "Step by step" : `Stroke ${step + 1}`}</span><button type="button" aria-label="Next stroke" disabled={!available || step >= (data?.strokes.length || 0) - 1} onClick={() => showStep(step + 1)}><span className="stroke-step-word">Next stroke</span><span aria-hidden="true">→</span></button></div>
        </> : <>
          <div className="stroke-practice-stats"><div><strong>{misses}</strong><span>{misses === 1 ? "Miss" : "Misses"} this round</span></div><p>Need a hand? A stroke hint appears after three misses on that stroke.</p></div>
          <button className="stroke-primary stroke-green" type="button" disabled={!available} onClick={() => setRetry(n => n + 1)}>Start again</button>
        </>}
        <div className="stroke-options-row"><label><input type="checkbox" checked={outline} disabled={!available || step >= 0} onChange={e => { const visible = e.target.checked; if (visible) void writer.current?.showOutline(); else void writer.current?.hideOutline(); setOutline(visible); }}/>Show outline</label>{mode === "watch" && <button className="stroke-reset" type="button" disabled={!available} onClick={() => setRetry(n => n + 1)}>Reset</button>}</div>
      </div>
      <div className="stroke-next-links"><p className="stroke-kicker">Keep learning</p><Link className="stroke-worksheet-link" prefetch={false} href={`/tools/chinese-character-practice-sheet-generator?text=${encodeURIComponent(worksheetText)}`}>Create a worksheet for {worksheetText} <span aria-hidden="true">→</span></Link>{embedded ? <Link prefetch={false} href={`/tools/chinese-stroke-order?text=${encodeURIComponent(character)}`}>Open the full stroke-order tool →</Link> : <Link prefetch={false} href={`/character/${encodeURIComponent(character)}`}>Meaning, radical & related words →</Link>}</div>
    </div></div>
    {available && data && mode === "watch" && <details className="stroke-sequence"><summary>Explore all {data.strokes.length} strokes</summary><div>{data.strokes.map((_, i) => <button type="button" key={i} aria-label={`View stroke ${i + 1}`} aria-pressed={step === i} onClick={() => showStep(i)}><StrokeDiagram data={data} index={i}/><span>{i + 1}</span></button>)}</div></details>}
    <p className="stroke-source">Source: Hanzi Writer / Make Me a Hanzi, derived from Arphic fonts. Forms may vary by region. Data is provided without warranty under the <a href="/stroke-data/v1/ARPHICPL.TXT">Arphic Public License</a>; you may redistribute it under that licence. <Link href="/content-license">Sources & coverage</Link>. Completed writing rounds stay in this browser.</p>
  </section>;
}
