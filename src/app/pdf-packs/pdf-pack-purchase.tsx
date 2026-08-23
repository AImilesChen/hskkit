"use client";

import { useState } from "react";
import { PURCHASING_UNAVAILABLE } from "@/lib/public-copy";

export default function PdfPackPurchase() {
  const [level, setLevel] = useState(1);

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <label htmlFor="pack-level" className="block font-semibold text-slate-950">Preview one planned HSK 3.0 level</label>
      <select id="pack-level" value={level} onChange={(event) => setLevel(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 sm:max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7].map((value) => <option key={value} value={value}>Level {value}</option>)}
      </select>
      <p className="mt-5 text-sm leading-6 text-slate-600">Selected preview: Level {level}. This does not reserve, order or generate a pack.</p>
      <button type="button" disabled className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-300 px-6 font-bold text-slate-700 disabled:cursor-not-allowed">
        {PURCHASING_UNAVAILABLE}
      </button>
      <p className="mt-4 text-xs leading-5 text-slate-500">Coming later. No checkout or live payment collection is open.</p>
    </div>
  );
}
