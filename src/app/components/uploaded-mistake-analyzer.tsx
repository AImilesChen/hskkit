"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ImageMistakeOutput } from "@/lib/ai/domain";

type Quota = { remaining: number; allowance: number };
type SavedMistake = Omit<ImageMistakeOutput, "kind"> & { id: string; createdAt: string };
type Crop = { x: number; y: number; width: number; height: number };
const fullCrop: Crop = { x: 0, y: 0, width: 100, height: 100 };

async function croppedFile(source: File, crop: Crop) {
  const bitmap = await createImageBitmap(source);
  try {
    const x = Math.round(bitmap.width * crop.x / 100);
    const y = Math.round(bitmap.height * crop.y / 100);
    const width = Math.max(1, Math.round(bitmap.width * crop.width / 100));
    const height = Math.max(1, Math.round(bitmap.height * crop.height / 100));
    const scale = Math.min(1, 1800 / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    canvas.getContext("2d")?.drawImage(bitmap, x, y, width, height, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.86));
    if (!blob) throw new Error("Image could not be prepared.");
    return new File([blob], "question.jpg", { type: "image/jpeg" });
  } finally { bitmap.close(); }
}

export default function UploadedMistakeAnalyzer() {
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState("");
  const [crop, setCrop] = useState<Crop>(fullCrop);
  const [answer, setAnswer] = useState("");
  const [officialAnswer, setOfficialAnswer] = useState("");
  const [quota, setQuota] = useState<Quota>();
  const [signedIn, setSignedIn] = useState<boolean>();
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [output, setOutput] = useState<ImageMistakeOutput>();
  const [correctedQuestion, setCorrectedQuestion] = useState("");
  const [correctedAnswer, setCorrectedAnswer] = useState("");
  const [correctionUsed, setCorrectionUsed] = useState(false);
  const [operationId, setOperationId] = useState("");
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<SavedMistake[]>([]);
  const key = useRef(crypto.randomUUID());

  useEffect(() => {
    fetch("/api/v1/ai", { cache: "no-store" }).then(async response => {
      setSignedIn(response.status !== 401);
      if (response.ok) setQuota((await response.json()).quota);
    }).catch(() => undefined);
    fetch("/api/v1/external-mistakes", { cache: "no-store" }).then(async response => {
      if (response.ok) setHistory((await response.json()).mistakes ?? []);
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function invalidateAnalysis() {
    setOutput(undefined); setOperationId(""); setSaved(false); setCorrectionUsed(false); setMessage("");
    key.current = crypto.randomUUID();
  }

  function selectFile(next?: File) {
    setMessage(""); setOutput(undefined); setOperationId(""); setSaved(false); setCorrectionUsed(false); setCrop(fullCrop);
    key.current = crypto.randomUUID();
    if (!next) { setFile(undefined); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(next.type) || next.size > 12 * 1024 * 1024) {
      setFile(undefined); setMessage("Choose a JPG, PNG or WebP image under 12 MB. The cropped image sent for analysis must be under 4 MB."); return;
    }
    setFile(next);
  }

  function updateCrop(field: keyof Crop, value: number) {
    invalidateAnalysis();
    setCrop(current => {
      const next = { ...current, [field]: value };
      next.width = Math.min(next.width, 100 - next.x);
      next.height = Math.min(next.height, 100 - next.y);
      return next;
    });
  }

  async function analyze() {
    if (!file || busy) return;
    setBusy(true); setMessage("");
    try {
      const image = await croppedFile(file, crop);
      if (image.size > 4 * 1024 * 1024) throw new Error("Cropped image is still too large. Select a smaller question area.");
      const form = new FormData();
      form.set("image", image); form.set("idempotencyKey", key.current);
      form.set("learnerAnswer", answer.trim()); form.set("officialAnswer", officialAnswer.trim());
      const response = await fetch("/api/v1/ai/image-mistake", { method: "POST", body: form });
      const result = await response.json();
      if (result.quota) setQuota(result.quota);
      if (result.status === "succeeded" && result.output?.kind === "image_mistake") {
        setOutput(result.output); setCorrectedQuestion(result.output.question); setCorrectedAnswer(result.output.answer); setOperationId(result.operationId); setMessage(result.replayed ? "Analysis restored; no duplicate charge." : "Analysis complete. 5 AI credits used.");
      } else {
        setMessage(result.error === "AI_IMAGE_UNREADABLE" ? "The question or answer is not clear enough. Crop to one readable question and try again; no credits were used." : result.error === "AI_QUOTA_EXHAUSTED" ? "At least 5 AI credits are needed. Earn gifted credits or see the plan options." : "Analysis could not be completed. No credits were used; please retry.");
        if (result.status === "failed") key.current = crypto.randomUUID();
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload interrupted. Retry with the same image."); }
    finally { setBusy(false); }
  }

  async function correctRecognition() {
    if (!operationId || correctionUsed || busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/v1/ai/image-mistake/correct", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ operationId, question: correctedQuestion, answer: correctedAnswer }) });
      const result = await response.json();
      if (!response.ok || result.output?.kind !== "image_mistake") throw new Error("Correction could not be completed. No extra credits were used; please retry.");
      setOutput(result.output); setCorrectedQuestion(result.output.question); setCorrectedAnswer(result.output.answer); setCorrectionUsed(true); setMessage("Analysis updated from your correction at no extra credit cost.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Correction failed; no extra credits were used."); }
    finally { setBusy(false); }
  }

  async function save() {
    if (!operationId || saving || saved) return;
    setSaving(true);
    try {
      const response = await fetch("/api/v1/external-mistakes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ operationId }) });
      if (!response.ok) throw new Error("Could not save this analysis. Please try again.");
      setSaved(true); setMessage("Saved to your private uploaded mistakes. The original image was not stored.");
      const list = await fetch("/api/v1/external-mistakes", { cache: "no-store" });
      if (list.ok) setHistory((await list.json()).mistakes ?? []);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save."); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    const response = await fetch(`/api/v1/external-mistakes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) setHistory(current => current.filter(item => item.id !== id));
    else setMessage("Could not remove this record. Please retry.");
  }

  return <section className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 sm:p-6" aria-labelledby="uploaded-mistake-title">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="text-xs font-bold uppercase tracking-widest text-blue-700">Your own question</span><h2 id="uploaded-mistake-title" className="mt-1 text-xl font-bold text-slate-950">Analyze a mistake from a photo</h2><p className="mt-2 max-w-2xl text-sm text-slate-600">Upload one clear Chinese-learning question from a textbook or screenshot. Crop it, add your answer if you know it, and review the explanation before saving.</p></div><span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-blue-800">5 AI credits per successful analysis</span></div>
    {signedIn === undefined ? <p className="mt-5 text-sm text-slate-600">Checking your account and AI credits…</p> : !signedIn ? <p className="mt-5 text-sm"><Link className="font-bold text-blue-700 underline" href="/account">Sign in</Link> to analyze and privately save your own questions.</p> : <>
      <div className="mt-5 grid gap-4 lg:grid-cols-2"><div><label className="block text-sm font-semibold text-slate-800" htmlFor="mistake-image">Question image</label><input id="mistake-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => selectFile(event.target.files?.[0])} className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm"/><p className="mt-1 text-xs text-slate-600">JPG, PNG or WebP. Image bytes are sent for analysis but are not saved to your records.</p></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-800">Your answer (optional)<input value={answer} maxLength={500} onChange={event => { setAnswer(event.target.value); invalidateAnalysis(); }} className="mt-2 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal" placeholder="What did you choose?"/></label><label className="text-sm font-semibold text-slate-800">Answer key (optional)<input value={officialAnswer} maxLength={500} onChange={event => { setOfficialAnswer(event.target.value); invalidateAnalysis(); }} className="mt-2 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal" placeholder="If the book provides one"/></label></div></div>
      {preview && <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]"><div className="max-h-80 overflow-auto rounded-xl border border-slate-200 bg-white"><div className="relative"><img src={preview} alt="Selected question for cropping" className="block h-auto w-full"/><div className="pointer-events-none absolute border-2 border-blue-600 bg-blue-500/10" style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.width}%`, height: `${crop.height}%` }}/></div></div><div className="space-y-2"><p className="text-sm font-bold text-slate-800">Crop to one question</p>{([ ["x", "Left"], ["y", "Top"], ["width", "Width"], ["height", "Height"] ] as const).map(([field, label]) => <label key={field} className="block text-xs font-medium text-slate-700">{label} · {crop[field]}%<input type="range" min={field === "width" || field === "height" ? 20 : 0} max={field === "width" ? 100 - crop.x : field === "height" ? 100 - crop.y : field === "x" ? 100 - crop.width : 100 - crop.height} value={crop[field]} onChange={event => { updateCrop(field, Number(event.target.value)); }} className="block w-full"/></label>)}<button type="button" onClick={() => { setCrop(fullCrop); invalidateAnalysis(); }} className="text-sm font-semibold text-blue-700 underline">Reset crop</button></div></div>}
      <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" onClick={() => void analyze()} disabled={!file || busy || (quota !== undefined && quota.remaining < 5)} className="min-h-11 rounded-lg bg-blue-600 px-5 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Analyzing…" : "Analyze question"}</button><span className="text-sm text-slate-600">{quota ? `${quota.remaining} AI credits available` : "Checking credits…"}</span>{quota && quota.remaining < 5 && <Link className="text-sm font-semibold text-blue-700 underline" href="/pricing">See plans</Link>}</div>
      {message && <p role="status" className="mt-4 rounded-lg bg-white p-3 text-sm text-slate-700">{message}</p>}
      {output && <article className="mt-5 rounded-xl border border-emerald-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-bold text-slate-950">Question analysis</h3><span className="text-xs font-semibold text-slate-500">AI interpretation · check against your source</span></div><dl className="mt-4 space-y-3 text-sm"><div><dt className="font-bold text-slate-800">Recognized question</dt><dd className="mt-1 whitespace-pre-wrap text-slate-700">{output.question}</dd></div><div><dt className="font-bold text-slate-800">Answer</dt><dd className="mt-1 whitespace-pre-wrap text-slate-700">{output.answer}</dd></div><div><dt className="font-bold text-slate-800">Why</dt><dd className="mt-1 whitespace-pre-wrap text-slate-700">{output.explanation}</dd></div><div><dt className="font-bold text-slate-800">Your mistake</dt><dd className="mt-1 whitespace-pre-wrap text-slate-700">{output.learnerMistake}</dd></div><div><dt className="font-bold text-slate-800">Next step</dt><dd className="mt-1 whitespace-pre-wrap text-slate-700">{output.nextStep}</dd></div></dl><p className="mt-4 text-xs text-slate-600">If text recognition is wrong, correct it below once for free. A different image is a new analysis and costs 5 credits when successful.</p><button type="button" onClick={() => void save()} disabled={saving || saved || (!correctionUsed && (correctedQuestion !== output.question || correctedAnswer !== output.answer))} className="mt-4 min-h-11 rounded-lg bg-emerald-700 px-4 font-bold text-white disabled:opacity-50">{saved ? "Saved to my mistakes" : saving ? "Saving…" : "Save to my mistakes"}</button></article>}
      {output && !correctionUsed && !saved && <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-bold text-slate-900">Recognition wrong? One corrected recheck is free.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Corrected question<textarea value={correctedQuestion} maxLength={1000} rows={3} onChange={event => setCorrectedQuestion(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 p-2 font-normal"/></label>
          <label className="text-sm font-semibold text-slate-700">Corrected answer<input value={correctedAnswer} maxLength={500} onChange={event => setCorrectedAnswer(event.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 p-2 font-normal"/></label>
        </div>
        <button type="button" onClick={() => void correctRecognition()} disabled={busy || (correctedQuestion === output.question && correctedAnswer === output.answer)} className="mt-3 min-h-11 rounded-lg border border-blue-600 px-3 text-sm font-bold text-blue-700 disabled:opacity-50">Recheck corrected text · free</button>
      </div>}
    </>}
    {history.length > 0 && <details className="mt-6 border-t border-blue-200 pt-4"><summary className="cursor-pointer font-bold text-slate-900">My uploaded mistakes ({history.length})</summary><ul className="mt-3 space-y-2">{history.map(item => <li key={item.id} className="rounded-lg border border-slate-200 bg-white p-4"><p className="font-semibold text-slate-900">{item.question}</p><p className="mt-2 text-sm text-slate-700">Answer: {item.answer}</p><p className="mt-1 text-sm text-slate-600">{item.explanation}</p><button type="button" onClick={() => void remove(item.id)} className="mt-2 text-sm font-semibold text-red-700 underline">Remove from my mistakes</button></li>)}</ul></details>}
  </section>;
}
