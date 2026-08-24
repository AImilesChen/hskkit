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
      { href: "/levels", label: "Levels", description: "Browse the HSK 3.0 Levels 1–9 learning path." },
      { href: "/vocabulary/1", label: "Vocabulary", description: "Browse the published catalog by level.", match: "/vocabulary" },
      { href: "/grammar", label: "Grammar", description: "Study published grammar patterns and exercises." },
      { href: "/reading", label: "Reading", description: "Open levelled reading passages and exercises." },
      { href: "/listen", label: "Listening", description: "Practise published word and context audio." },
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
      { href: "/placement", label: "Placement", description: "Find a suggested starting point, not an official score." },
      { href: "/mock/basic", label: "Basic Mock", description: "Take the published HSK 1–6 timed mock." },
      { href: "/mock/advanced", label: "Advanced Mock", description: "Assess the unified HSK 7–9 advanced ability band." },
    ],
  },
  { href: "/dictionary", label: "Dictionary", description: "Search the published HSK 3.0 catalog." },
  { href: "/pricing", label: "Pricing", description: "Compare Free and Pro subscription billing." },
  { href: "/store", label: "Store", description: "Buy one selected-level PDF Pack through Stripe Test checkout." },
  { href: "/account", label: "Sign in", description: "Sign in with Google or manage your synced account and private exports." },
];

export function isNavigationGroup(entry: NavigationEntry): entry is { label: string; items: NavigationItem[] } {
  return "items" in entry;
}

export function flattenNavigation(): NavigationItem[] {
  return siteNavigation.flatMap((entry) => isNavigationGroup(entry) ? entry.items : [entry]);
}

export function isNavigationItemActive(pathname: string, item: NavigationItem): boolean {
  const match = item.match ?? item.href;
  return pathname === match || pathname.startsWith(`${match}/`);
}

export function isNavigationEntryActive(pathname: string, entry: NavigationEntry): boolean {
  return isNavigationGroup(entry)
    ? entry.items.some((item) => isNavigationItemActive(pathname, item))
    : isNavigationItemActive(pathname, entry);
}
