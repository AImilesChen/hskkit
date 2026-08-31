import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";
import { findActiveCatalogWordsContainingCharacter } from "../content/catalog-search.ts";
import { getIndexedCharacter, relatedIndexedCharacters, type IndexedCharacter } from "./character-index.ts";

export interface CharacterContainingWord {
  id: string;
  hanzi: string;
  traditional: string;
  pinyin: string;
  meaning: string;
  partOfSpeech: string;
  level: number;
  levelBand: string;
}

export interface PublishedCharacter extends IndexedCharacter {
  wordsContainingCharacter: CharacterContainingWord[];
  sameRadical: IndexedCharacter[];
  samePinyin: IndexedCharacter[];
}

export const getPublishedCharacterByHanzi = cache(async (hanzi: string): Promise<{ status: "published"; item: PublishedCharacter } | { status: "missing" }> => {
  const indexed = getIndexedCharacter(hanzi);
  if (!indexed) return { status: "missing" };
  const db = (await getCloudflareContext({ async: true })).env.LEARNING_DB;
  const rows = await findActiveCatalogWordsContainingCharacter(db, hanzi, 36);
  const related = relatedIndexedCharacters(indexed);
  return {
    status: "published",
    item: {
      ...indexed,
      wordsContainingCharacter: rows.map((row) => ({
        id: row.id,
        hanzi: row.hanzi,
        traditional: row.traditional || row.hanzi,
        pinyin: row.pinyin,
        meaning: row.meaning,
        partOfSpeech: row.part_of_speech,
        level: row.level_band === "7-9" ? 7 : Number(row.level_band),
        levelBand: row.level_band,
      })),
      sameRadical: related.sameRadical,
      samePinyin: related.samePinyin,
    },
  };
});
