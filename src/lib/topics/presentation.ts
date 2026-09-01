/**
 * Returns the primary published gloss for compact topic cards.
 * The complete verified meaning remains available on the word detail route.
 */
export function topicMeaningForCard(meaning: string) {
  const primary = meaning.split(";")[0]?.trim();
  return primary || meaning.trim();
}
