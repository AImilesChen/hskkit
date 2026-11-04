"use client";

import { useState } from "react";

export function WordScriptToggle({ simplified, traditional, className = "" }: { simplified: string; traditional?: string; className?: string }) {
  const hasTraditional = Boolean(traditional && traditional !== simplified);
  const [script, setScript] = useState<"simplified" | "traditional">("simplified");
  const display = script === "traditional" && hasTraditional ? traditional! : simplified;
  return <div className={className}>
    <h1 className={`dictionary-word-hanzi ${[...display].length >= 4 ? "dictionary-word-hanzi-long" : ""}`} lang={script === "traditional" ? "zh-Hant" : "zh-Hans"}>{display}</h1>
    <div className="dictionary-script-switch" role="group" aria-label="Chinese script">
      <button type="button" onClick={() => setScript("simplified")} aria-pressed={script === "simplified"}>Simplified</button>
      <button type="button" onClick={() => setScript("traditional")} aria-pressed={script === "traditional"} disabled={!hasTraditional} title={hasTraditional ? "Show the published traditional form" : "No separate traditional form is published for this word"}>Traditional</button>
    </div>
  </div>;
}
