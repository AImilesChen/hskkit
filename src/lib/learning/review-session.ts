export type ReviewQueueCard = {
  id: string;
  isMistake: boolean;
  dimension: "reading" | "audio" | "context_audio";
  dueAt: string;
  level?: number;
  skill?: string;
  sourceGroupId?: string;
  templateId?: string;
  canonicalContentKey?: string;
};

export type ReviewLevelScope = "current" | "all" | number;
export type ReviewLevelControl = {
  currentLevel: number;
  currentCardIds: string[];
  allCardIds: string[];
  allCount: number;
  levels: Array<{ level: number; count: number }>;
  cardIdsByLevel: Record<number, string[]>;
};

function diversifyReviewQueue<T extends ReviewQueueCard>(orderedCards: T[], cap: number): T[] {
  const seenCanonical = new Set<string>();
  const remaining = [...orderedCards].filter((card) => {
    if (!card.canonicalContentKey) return true;
    if (seenCanonical.has(card.canonicalContentKey)) return false;
    seenCanonical.add(card.canonicalContentKey);
    return true;
  });
  const selected: T[] = [];
  const usedSources = new Set<string>();
  const maximum = Math.min(remaining.length, Math.max(1, cap));
  const allowed = (card: T, relaxSource: boolean, relaxTemplate: boolean, relaxSkill: boolean) => {
    const previous = selected.at(-1);
    const beforePrevious = selected.at(-2);
    if (!relaxSource && card.sourceGroupId && usedSources.has(card.sourceGroupId)) return false;
    if (!relaxTemplate && card.templateId && card.templateId === previous?.templateId) return false;
    if (!relaxSkill && card.skill && card.skill === previous?.skill && card.skill === beforePrevious?.skill) return false;
    return true;
  };
  while (selected.length < maximum) {
    let index = -1;
    for (const relaxation of [[false, false, false], [true, false, false], [true, true, false], [true, true, true]] as const) {
      index = remaining.findIndex((card) => allowed(card, relaxation[0], relaxation[1], relaxation[2]));
      if (index >= 0) break;
    }
    if (index < 0) break;
    const [next] = remaining.splice(index, 1);
    selected.push(next);
    if (next.sourceGroupId) usedSources.add(next.sourceGroupId);
  }
  return selected;
}

export function buildReviewQueue<T extends ReviewQueueCard>(cards: T[], cap: number): T[] {
  return diversifyReviewQueue(
    [...cards].sort((a, b) => Number(b.isMistake) - Number(a.isMistake) || a.dueAt.localeCompare(b.dueAt)),
    cap,
  );
}

export function reviewLevelControl<T extends ReviewQueueCard>(cards: T[], currentLevel: number, preserveOrder = false): ReviewLevelControl {
  const normalizedCurrentLevel = Number.isInteger(currentLevel) && currentLevel >= 1 && currentLevel <= 9 ? currentLevel : 1;
  const ordered = preserveOrder
    ? diversifyReviewQueue(cards, Math.max(1, cards.length))
    : buildReviewQueue(cards, Math.max(1, cards.length));
  const cardIdsByLevel = Object.fromEntries(Array.from({ length: 9 }, (_, index) => {
    const level = index + 1;
    return [level, ordered.filter((card) => card.level === level).map((card) => card.id)];
  })) as Record<number, string[]>;
  return {
    currentLevel: normalizedCurrentLevel,
    currentCardIds: cardIdsByLevel[normalizedCurrentLevel],
    allCardIds: ordered.map((card) => card.id),
    allCount: ordered.length,
    levels: Array.from({ length: 9 }, (_, index) => ({ level: index + 1, count: cardIdsByLevel[index + 1].length })),
    cardIdsByLevel,
  };
}

export function reviewCardIdsForScope(control: ReviewLevelControl, scope: ReviewLevelScope): string[] {
  if (scope === "all") return [...control.allCardIds];
  if (scope === "current") return [...control.currentCardIds];
  return [...(control.cardIdsByLevel[scope] ?? [])];
}

export type ReviewEntryIntent =
  | { kind: "setup" }
  | { kind: "today"; cap?: number; cardIds?: string[] }
  | { kind: "mistake"; contentId: string; cardId?: string };

export function reviewEntryIntent(search: string): ReviewEntryIntent {
  const params = new URLSearchParams(search);
  if (params.get("source") === "today") {
    const cap = Number(params.get("cap"));
    const cardIds = (params.get("cards") ?? "").split(",").map((value) => value.trim()).filter((value) => value.length > 0 && value.length <= 120).slice(0, 20);
    return { kind: "today", ...(Number.isInteger(cap) && cap > 0 ? { cap } : {}), ...(cardIds.length ? { cardIds } : {}) };
  }
  if (params.get("source") === "mistakes") {
    const contentId = params.get("contentId")?.trim();
    const cardId = params.get("cardId")?.trim();
    if (contentId) return { kind: "mistake", contentId, ...(cardId ? { cardId } : {}) };
  }
  return { kind: "setup" };
}

export function buildIntentReviewQueue<T extends ReviewQueueCard & { contentId: string }>(cards: T[], intent: ReviewEntryIntent, cap: number): T[] {
  if (intent.kind === "today") {
    if (intent.cardIds?.length) {
      const byId = new Map(cards.map((card) => [card.id, card]));
      return intent.cardIds.map((cardId) => byId.get(cardId)).filter((card): card is T => Boolean(card));
    }
    return buildReviewQueue(cards, intent.cap ?? cap);
  }
  if (intent.kind === "mistake") {
    const mistakes = cards.filter((card) => card.isMistake);
    const selected = mistakes.find((card) => card.contentId === intent.contentId && (!intent.cardId || card.id === intent.cardId));
    return selected ? [selected] : [];
  }
  return [];
}

export type ReviewGrade = "again" | "hard" | "good" | "easy";

export function reviewGradeOptions(ease: number, intervalDays: number): Array<{ grade: ReviewGrade; label: string; hint: string }> {
  const rememberedDays = Math.max(2, Math.round(Math.max(1, intervalDays) * ease));
  const easyDays = Math.max(4, Math.round(Math.max(1, intervalDays) * (ease + 0.3)));
  return [
    { grade: "again", label: "Forgot", hint: "Review again in 10 min" },
    { grade: "hard", label: "Difficult", hint: "Review tomorrow" },
    { grade: "good", label: "Remembered", hint: `Review in ${rememberedDays} days` },
    { grade: "easy", label: "Easy", hint: `Review in ${easyDays} days` },
  ];
}

export type ReviewPlanningCard = ReviewQueueCard & {
  contentId?: string;
  ease?: number;
  level?: number;
  skill?: string;
};

export function reviewComposition(cards: ReviewPlanningCard[]) {
  return {
    mistakes: cards.filter((card) => card.isMistake).length,
    reading: cards.filter((card) => card.dimension === "reading").length,
    listening: cards.filter((card) => card.dimension !== "reading").length,
  };
}

export function filterReviewCards<T extends ReviewPlanningCard>(cards: T[], filters: { difficultOnly?: boolean; level?: number; dimension?: ReviewQueueCard["dimension"] | "all" }): T[] {
  return cards.filter((card) =>
    (!filters.difficultOnly || card.isMistake || (card.ease ?? 2.5) < 2.5)
    && (!filters.level || card.level === filters.level)
    && (!filters.dimension || filters.dimension === "all" || card.dimension === filters.dimension));
}

export function recommendReviewCount(cards: ReviewPlanningCard[]): number {
  if (!cards.length) return 0;
  const difficult = cards.filter((card) => card.isMistake || (card.ease ?? 2.5) < 2.5).length;
  return Math.min(cards.length, Math.max(5, Math.ceil(difficult * 1.5)));
}

export function reviewTip(card: ReviewPlanningCard) {
  const level = card.level ? `HSK ${card.level}` : "This item";
  if (card.dimension !== "reading") return `${level} listening: hear the whole phrase once before choosing; do not translate word by word.`;
  if ((card.skill ?? "").toLowerCase().includes("grammar")) return `${level} grammar: identify the sentence role before comparing choices.`;
  return `${level} vocabulary: recall the meaning first, then verify pinyin and usage.`;
}

export function reviewReason(card: { isMistake: boolean; reviewCount?: number }) {
  if (card.isMistake) return "You missed this in an earlier practice session.";
  if ((card.reviewCount ?? 0) === 0) return "This is your first scheduled memory check.";
  return "This item is due now based on your previous review.";
}
