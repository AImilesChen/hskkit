import landing from "./hsk5-vocabulary-landing.json" with { type: "json" };
import { formalWordAudioUrlByContentId, getHsk3LevelStatus } from "./level-status.ts";
import type { CatalogResponse } from "../../app/vocabulary/[level]/vocabulary-catalog";

export const hsk5VocabularyTopics = landing.topics;

export function getHsk5VocabularyInitialPage(): CatalogResponse {
  const total = getHsk3LevelStatus(5).wordCount;
  return {
    contentAssets: landing.firstPage.map((word) => ({ ...word, level: 5,
      formalAudioAvailable: formalWordAudioUrlByContentId.has(word.id),
      formalAudioUrl: formalWordAudioUrlByContentId.get(word.id) ?? null,
    })),
    pagination: { page: 1, pageSize: 50, total, totalPages: Math.ceil(total / 50),
      hasPrevious: false, hasNext: total > 50 },
  };
}
