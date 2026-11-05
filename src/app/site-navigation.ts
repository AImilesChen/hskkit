export type NavigationItem = {
  href: string;
  label: string;
  description: string;
  match?: string;
  highlightGroup?: boolean;
};

export type NavigationSection = { title: string; items: NavigationItem[] };
export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
  sections?: NavigationSection[];
  quickLinks?: NavigationItem[];
};

export type NavigationEntry =
  | NavigationGroup
  | NavigationItem;

export const learnNavigationSections: NavigationSection[] = [
  { title: "HSK & Guides", items: [
    { href: "/learn", label: "Learning Guides", description: "Find a clear next step in learning Chinese." },
    { href: "/levels", label: "HSK Levels", description: "Explore the current HSK learning path." },
    { href: "/vocabulary/1", label: "Vocabulary", description: "Browse words by HSK level.", match: "/vocabulary" },
    { href: "/hsk-3-0", label: "HSK 3.0 Guide", description: "Understand the current exam syllabus.", highlightGroup: false },
    { href: "/blog/hsk-3-0-levels-explained", label: "HSK Levels Explained", description: "Find your way through Levels 1–9." },
  ] },
  { title: "Language Skills", items: [
    { href: "/grammar", label: "Grammar", description: "Learn grammar patterns." },
    { href: "/reading", label: "Reading", description: "Read levelled passages." },
    { href: "/listen", label: "Listening", description: "Practise listening by level." },
    { href: "/blog/chinese-pinyin-guide", label: "Pinyin Guide", description: "Understand Mandarin pronunciation." },
    { href: "/blog/chinese-tones-guide", label: "Chinese Tones Guide", description: "Learn how Mandarin tones work." },
  ] },
  { title: "Learning Tools", items: [
    { href: "/tools/chinese-number-converter", label: "Numbers & Listening", description: "Read and hear Chinese numbers, prices, dates and times." },
    { href: "/tools/chinese-stroke-order", label: "Stroke Order & Writing", description: "Watch character strokes and practise writing." },
    { href: "/vocabulary/1?mode=flashcards#vocabulary-activities", label: "Flashcards", description: "Practise recalling a short word set." },
    { href: "/tools/chinese-tone-trainer", label: "Tone Trainer", description: "Listen and identify Mandarin tones." },
    { href: "/tools/chinese-character-practice-sheet-generator", label: "Character Worksheets", description: "Create printable handwriting sheets." },
  ] },
  { title: "Topics", items: [
    { href: "/topics", label: "Browse All Topics", description: "Explore real-life learning situations." },
    { href: "/topics/daily-life", label: "Daily Life", description: "Learn words for daily routines." },
    { href: "/topics/food-drink", label: "Food & Drink", description: "Learn words for food and meals." },
    { href: "/topics/travel-transport", label: "Travel & Transport", description: "Learn words for getting around." },
    { href: "/chinese-for-travel", label: "Chinese for Travel", description: "Find useful phrases for your trip." },
  ] },
];

export const learnQuickLinks: NavigationItem[] = [
  { href: "/today", label: "Today", description: "Continue today's learning." },
  { href: "/planner", label: "Study Planner", description: "Plan your learning schedule." },
];

export const siteNavigation: NavigationEntry[] = [
  {
    label: "Learn",
    sections: learnNavigationSections,
    quickLinks: learnQuickLinks,
    items: [...learnNavigationSections.flatMap(section => section.items), ...learnQuickLinks],
  },
  {
    label: "Practice",
    items: [
      { href: "/practice", label: "Skill Practice", description: "Choose a level and skill." },
      { href: "/review", label: "Spaced Review", description: "Review cards that are due." },
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

export function isNavigationGroup(entry: NavigationEntry): entry is NavigationGroup {
  return "items" in entry;
}

export function flattenNavigation(): NavigationItem[] {
  const seen = new Set<string>();
  return siteNavigation.flatMap((entry) => isNavigationGroup(entry) ? entry.items : [entry])
    .filter(item => { if (seen.has(item.href)) return false; seen.add(item.href); return true; });
}

export function isNavigationItemActive(pathname: string, item: NavigationItem): boolean {
  return [item.href, item.match].some(match => Boolean(match) && (pathname === match || pathname.startsWith(`${match}/`)));
}

export function isNavigationEntryActive(pathname: string, entry: NavigationEntry): boolean {
  return isNavigationGroup(entry)
    ? entry.items.some((item) => item.highlightGroup !== false && isNavigationItemActive(pathname, item))
    : isNavigationItemActive(pathname, entry) && !siteNavigation.some(group => isNavigationGroup(group) && group.items.some(item => item.highlightGroup !== false && isNavigationItemActive(pathname, item)));
}
