export type BlogLearningAction = {
  id: "vocabulary" | "practice" | "review" | "store";
  label: string;
  description: string;
  href: string;
  emphasis: "primary" | "secondary";
};

export function blogLearningActions(hskLevel?: number): BlogLearningAction[] {
  const requestedLevel = hskLevel && hskLevel >= 1 && hskLevel <= 9 ? hskLevel : 1;
  const routeLevel = requestedLevel >= 7 ? 7 : requestedLevel;
  const levelLabel = requestedLevel >= 7 ? "HSK 7–9" : `HSK ${requestedLevel}`;
  return [
    { id: "vocabulary", label: `Open ${levelLabel} vocabulary`, description: "Browse the published word catalog for this level.", href: `/vocabulary/${routeLevel}`, emphasis: "secondary" },
    { id: "practice", label: `Practise ${levelLabel} vocabulary`, description: "Use an eight-question levelled practice session.", href: `/practice/${routeLevel}/vocabulary`, emphasis: "secondary" },
    { id: "review", label: "Start due Review", description: "Continue the memory queue already due in your learning record.", href: "/review", emphasis: "primary" },
    { id: "store", label: "Browse study resources", description: "Compare one-time HSK 3.0 PDFs and practical study packs.", href: "/store", emphasis: "secondary" },
  ];
}

export function recommendedBlogLearningAction(hskLevel?: number) {
  return blogLearningActions(hskLevel).find((action) => action.id === "review")!;
}
