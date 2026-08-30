"use client";

import { useState } from "react";

export function WordScriptToggle({ simplified, traditional, className = "" }: { simplified: string; traditional?: string; className?: string }) {
  const hasTraditional = Boolean(traditional && traditional !== simplified);
  const [script, setScript] = useState<"simplified" | "traditional">("simplified");
  const display = script === "traditional" && hasTraditional ? traditional : simplified;
  return <div className={className}>
    <div className="flex justify-center gap-1" role="group" aria-label="Chinese script">
      <button type="button" onClick={() => setScript("simplified")} aria-pressed={script === "simplified"} className={`min-h-9 rounded-lg px-3 text-xs font-bold ${script === "simplified" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-200"}`}>Simplified</button>
      <button type="button" onClick={() => setScript("traditional")} aria-pressed={script === "traditional"} disabled={!hasTraditional} title={hasTraditional ? "Show the published traditional form" : "No separate traditional form is published for this word"} className={`min-h-9 rounded-lg px-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-45 ${script === "traditional" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-200"}`}>Traditional</button>
    </div>
    <h1 className="my-5 break-words text-7xl font-extrabold tracking-tight text-white sm:text-8xl" lang={script === "traditional" ? "zh-Hant" : "zh-Hans"}>{display}</h1>
  </div>;
}
