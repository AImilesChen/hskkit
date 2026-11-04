import type { StudyWord } from "./catalog.ts";
import { relatedWordsForWord } from "./catalog.ts";
import { findPublicCatalogWordById, findPublicCatalogWordsContainingCharacter, publicCatalogReleaseId } from "../content/public-catalog-index.ts";
import { getIndexedCharacter } from "./character-index.ts";
import { GRAMMAR_CURRICULUM, READING_LESSONS } from "../learning/step7-content.ts";
import { WORD_DETAIL_EDITORIAL } from "./word-detail-editorial.ts";

export type DetailWord = { id: string; hanzi: string; pinyin: string; meaning: string; level: number };
const levelNumber = (band: string) => band === "7-9" ? 7 : Number(band);
const uniqueExpressions = <T extends { hanzi: string }>(items: T[]) => {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.hanzi)) return false;
    seen.add(item.hanzi);
    return true;
  });
};

export function wordDetailContent(word: StudyWord) {
  const editorial = WORD_DETAIL_EDITORIAL[word.id];
  const examples = uniqueExpressions([...word.examples, ...(editorial?.examples ?? [])]);
  const collocations = uniqueExpressions([...word.collocations, ...(editorial?.collocations ?? [])]);
  const related = new Map<string, DetailWord & { relationship: string }>();
  for (const relation of editorial?.related ?? []) {
    const row = findPublicCatalogWordById(relation.id);
    if (row && row.release_id === publicCatalogReleaseId && row.id !== word.id) {
      related.set(row.id, { id: row.id, hanzi: row.hanzi, pinyin: row.pinyin, meaning: row.meaning, level: levelNumber(row.level_band), relationship: relation.relationship });
    }
  }
  for (const relation of relatedWordsForWord(word)) {
    if (relation.word.id !== word.id && !related.has(relation.word.id)) related.set(relation.word.id, { ...relation.word, relationship: relation.relationship });
  }
  const relatedWords = [...related.values()].slice(0, 4);
  const excluded = new Set([word.id, ...relatedWords.map(item => item.id)]);
  const seen = new Set<string>();
  const allCharacters = [...new Set([...word.hanzi])].flatMap(hanzi => {
    const entry = getIndexedCharacter(hanzi);
    return entry ? [entry] : [];
  });
  // Reuse the active catalog's character index. Do not suggest retired IDs,
  // duplicate the current word, or repeat a word across character groups.
  const containing = allCharacters.slice(0, 4).flatMap(character => {
    const rows = findPublicCatalogWordsContainingCharacter(character.hanzi, 11_000)
      .filter(row => !excluded.has(row.id))
      .sort((a, b) => levelNumber(a.level_band) - levelNumber(b.level_band) || a.hanzi.length - b.hanzi.length || a.id.localeCompare(b.id));
    const distinct = rows.filter(row => !seen.has(row.id));
    const selected = distinct.slice(0, allCharacters.length === 1 ? 8 : 4);
    selected.forEach(row => seen.add(row.id));
    return selected.length ? [{
      character: character.hanzi,
      total: rows.length,
      words: selected.map(row => ({ id: row.id, hanzi: row.hanzi, pinyin: row.pinyin, meaning: row.meaning, level: levelNumber(row.level_band) })),
      href: `/dictionary?mode=words&level=all&q=${encodeURIComponent(character.hanzi)}`,
    }] : [];
  });
  const grammar = (editorial?.grammar ?? []).flatMap(link => {
    const lesson = GRAMMAR_CURRICULUM.find(item => item.slug === link.slug);
    // Every recommendation explains a specific example actually shown here.
    return lesson && examples.some(item => item.hanzi === link.sentence)
      ? [{ ...link, title: lesson.title, pattern: lesson.pattern, level: lesson.level }]
      : [];
  });
  // Reading links are grounded in an explicit vocabulary item or a complete
  // multi-character word in the passage, never a single incidental character.
  const readings = READING_LESSONS.filter(lesson => lesson.vocabulary.some(item => item.word === word.hanzi)
    || ([...word.hanzi].length > 1 && lesson.text.includes(word.hanzi)))
    .sort((a, b) => a.level - b.level).slice(0, 3)
    .map(lesson => ({ slug: lesson.slug, title: lesson.title, level: lesson.level }));
  return { examples, collocations, related: relatedWords, containing, characters: allCharacters, grammar, readings, usage: editorial?.usage };
}
