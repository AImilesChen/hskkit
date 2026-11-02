/**
 * Returns the primary published gloss for compact topic cards.
 * The complete verified meaning remains available on the word detail route.
 */
export function topicMeaningForCard(meaning: string) {
  const primary = meaning.split(";")[0]?.trim();
  return primary || meaning.trim();
}

/** Editorial context for this scene; the dictionary's full entry is unchanged. */
export function topicContextMeaning(topicSlug: string, assetId: string, meaning: string) {
  if (topicSlug === "morning-routine" && assetId === "hsk2025.word.l2.0307.v1") return "bag";
  return topicMeaningForCard(meaning);
}
