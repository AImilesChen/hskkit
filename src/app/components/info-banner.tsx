interface InfoBannerProps {
  level: number;
}

export default function InfoBanner({ level }: InfoBannerProps) {
  return (
    <div className="bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border border-[#DBEAFE] rounded-xl px-5 py-4 flex items-start gap-3 mb-6">
      <svg
        className="w-5 h-5 text-[#2563EB] flex-shrink-0 mt-0.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <p className="text-sm leading-relaxed text-[#334155]">
        <strong className="text-[#0F172A] font-semibold">This is a curated starter list</strong> of common HSK {level} words, not a complete exam word bank. Use it to build recognition, then move to sample questions and the next level.
      </p>
    </div>
  );
}
