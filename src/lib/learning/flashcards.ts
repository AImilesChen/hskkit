export type FlashcardRating = "known" | "retry";

export function splitFlashcardForms(value: string): string[] {
  return [...new Set(value.split("|").map((form) => form.trim()).filter(Boolean))];
}

export function flashcardSummary<T extends { id: string }>(words: T[], ratings: Record<string, FlashcardRating>) {
  const known = words.filter((word) => ratings[word.id] === "known").length;
  const markedForPractice = words.filter((word) => ratings[word.id] === "retry").length;
  const retryWords = words.filter((word) => ratings[word.id] !== "known");
  return { known, markedForPractice, skipped: words.length - known - markedForPractice, retryWords };
}

export function flashcardReviewIds<T extends { id: string }>(words: T[], ratings: Record<string, FlashcardRating>) {
  return [...new Set(words.filter((word) => ratings[word.id] === "retry").map((word) => word.id))];
}
