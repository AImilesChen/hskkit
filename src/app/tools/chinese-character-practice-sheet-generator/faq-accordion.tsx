"use client";

import { useState } from "react";

interface FaqItem {
  q: string;
  a: string;
}

export function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden">
      {faqs.map((faq, i) => {
        const isOpen = openIdx === i;
        return (
          <div key={i} className="border-b border-[#E2E8F0] last:border-b-0">
            <button
              className="w-full flex items-center justify-between px-6 py-5 text-left bg-none border-none cursor-pointer transition-colors duration-150 hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
              onClick={() => setOpenIdx(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="text-base font-semibold text-[#0F172A] pr-4">{faq.q}</span>
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                stroke="#64748B"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-300 ease-out flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? "max-h-[300px] pb-5" : "max-h-0"}`}
              aria-hidden={!isOpen}
            >
              <p className="px-6 text-base leading-relaxed text-[#334155]">{faq.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
