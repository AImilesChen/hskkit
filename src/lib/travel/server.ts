import "server-only";
import catalog from "../content/public-catalog-index.json";
import { publishedContentAudioAsset } from "../audio/assets";
import { travelEntries } from "./phrasebook";

/** Audio is attached only to the exact published word, never to a containing phrase. */
export function getTravelCards() {
  return travelEntries.map((entry) => {
    const row = entry.kind === "word" ? catalog.words.find((word) => word[4] === entry.hanzi) : undefined;
    const audio = row ? publishedContentAudioAsset(row[0], entry.hanzi) : undefined;
    return { ...entry, dictionaryId: row?.[0], audioSrc: audio?.src };
  });
}
