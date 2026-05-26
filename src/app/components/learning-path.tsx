import Link from "next/link";

interface LearningPathProps {
  level: number;
}

const steps = [
  {
    title: "Start Here",
    desc: "Review the curated word list for this level. Read each word, its pinyin, and meaning. Say it aloud. Write it down if that helps you remember.",
    hasLink: false,
  },
  {
    title: "Practice What You Learned",
    desc: "Try the sample questions for this level. See which words you recognize and which need more review.",
    hasLink: true,
    linkLabel: (level: number) =>
      level <= 4
        ? `Try HSK ${level} Sample Questions`
        : "Review HSK 5 Vocabulary",
    linkHref: (level: number) =>
      level <= 4
        ? `/hsk-${level}-practice-test`
        : `/hsk-5-vocabulary`,
  },
  {
    title: "Ready for More?",
    desc: "When these words feel familiar, move to the next level. Do not wait for perfection.",
    hasLink: true,
    linkLabel: (level: number) =>
      level < 5
        ? `Move to HSK ${level + 1} Vocabulary`
        : null,
    linkHref: (level: number) =>
      level < 5
        ? `/hsk-${level + 1}-vocabulary`
        : null,
  },
  {
    title: "Go Back If Needed",
    desc: "If a word feels hard, return to the previous level. Strong foundations make later levels easier.",
    hasLink: false,
  },
  {
    title: "Not Sure Where You Stand?",
    desc: "Take the quick level check anytime to see if you are ready to move up or need to review.",
    hasLink: true,
    linkLabel: () => "Take the Level Check",
    linkHref: () => "/hsk-level-test",
  },
];

export default function LearningPath({ level }: LearningPathProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-7 mt-12">
      <h2 className="text-lg font-bold text-[#0F172A] mb-5">
        How to Study This Level
      </h2>
      <div className="flex flex-col">
        {steps.map((step, idx) => {
          const label = step.linkLabel?.(level);
          const href = step.linkHref?.(level);
          const isLast = idx === steps.length - 1;

          return (
            <div key={idx} className="flex gap-4 relative pb-6 last:pb-0">
              {!isLast && (
                <div
                  className="absolute left-[19px] top-10 w-0.5 bg-[#DBEAFE]"
                  style={{ height: "calc(100% - 24px)" }}
                />
              )}
              <div className="w-10 h-10 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-sm font-bold flex-shrink-0 z-[1]">
                {idx + 1}
              </div>
              <div className="flex-1 pt-0.5">
                <h3 className="text-[15px] font-semibold text-[#0F172A] mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  {step.desc}
                </p>
                {step.hasLink && label && href && (
                  <Link
                    href={href}
                    className="inline-flex items-center gap-1 mt-2 text-[13px] font-semibold text-[#2563EB] no-underline hover:underline"
                  >
                    {label}
                    <span>→</span>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-5 pt-4 border-t border-[#E2E8F0] text-[13px] text-[#64748B] text-center">
        You can jump between steps anytime.
      </div>
    </div>
  );
}
