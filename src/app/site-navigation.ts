export type NavigationItem = {
  href: string;
  label: string;
  description: string;
  match?: string;
};

export type NavigationEntry =
  | { label: string; items: NavigationItem[] }
  | NavigationItem;

export const siteNavigation: NavigationEntry[] = [
  {
    label: "Learn",
    items: [
      { href: "/today", label: "Today", description: "Open due reviews and the next learning task." },
      { href: "/planner", label: "Planner", description: "Build a feasible plan from your goal and progress." },
      { href: "/levels", label: "Levels", description: "Browse the HSK 3.0 Levels 1-9 learning path." },
      { href: "/vocabulary/1", label: "Vocabulary", description: "Browse the published catalog by level.", match: "/vocabulary" },
      { href: "/vocabulary/1?mode=flashcards#vocabulary-activities", label: "Flashcards", description: "Review a short HSK word set and repeat the words you missed." },
      { href: "/topics", label: "Topics", description: "Learn published HSK 3.0 vocabulary through practical themes." },
      { href: "/grammar", label: "Grammar", description: "Study published grammar patterns and exercises." },
      { href: "/reading", label: "Reading", description: "Open levelled reading passages and exercises." },
      { href: "/listen", label: "Listening library", description: "Build listening momentum with level sessions and continuous topic audio." },
    ],
  },
  {
    label: "Practice",
    items: [
      { href: "/practice", label: "Practice", description: "Choose a level and skill, then save the attempt." },
      { href: "/review", label: "Review", description: "Review due SRS cards from your learning record." },
      { href: "/mistakes", label: "Mistakes", description: "Revisit saved mistakes and send them to review." },
    ],
  },
  {
    label: "Tests",
    items: [
      { href: "/hsk-test-prep", label: "HSK Practice Tests", description: "Choose HSK 1–6 or Advanced 7–9 and preview the test.", match: "/mock" },
      { href: "/hsk-placement-test", label: "Find My HSK Level", description: "Not sure of your level? Get an adaptive starting suggestion.", match: "/placement" },
      { href: "/hsk-3-0", label: "HSK 3.0 Exam Guide", description: "Check exam dates, the official syllabus and word counts by level." },
    ],
  },
  { href: "/dictionary", label: "Dictionary", description: "Search the published HSK 3.0 catalog." },
  { href: "/blog", label: "Blog", description: "Read practical HSK 3.0 study guides and learning tips." },
  { href: "/pricing", label: "Pricing", description: "Compare Free and Pro subscription billing." },
  { href: "/store", label: "Store", description: "Buy complete HSK learning resources through secure Stripe checkout." },
  { href: "/account", label: "Sign in", description: "Sign in with Google or manage your synced account and private exports." },
];

export function isNavigationGroup(entry: NavigationEntry): entry is { label: string; items: NavigationItem[] } {
  return "items" in entry;
}

export function flattenNavigation(): NavigationItem[] {
  return siteNavigation.flatMap((entry) => isNavigationGroup(entry) ? entry.items : [entry]);
}

export function isNavigationItemActive(pathname: string, item: NavigationItem): boolean {
  return [item.href, item.match].some(match => Boolean(match) && (pathname === match || pathname.startsWith(`${match}/`)));
}

export function isNavigationEntryActive(pathname: string, entry: NavigationEntry): boolean {
  return isNavigationGroup(entry)
    ? entry.items.some((item) => isNavigationItemActive(pathname, item))
    : isNavigationItemActive(pathname, entry);
}
